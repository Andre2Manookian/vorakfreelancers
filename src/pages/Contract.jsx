import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import {
  formatCurrency,
  formatDate,
  getInitials,
  CONTRACT_STATUS_COLORS,
  isUserOnline,
  safeNumber
} from '../lib/helpers'
import { createNotification } from '../lib/notifications'
import LoadingSpinner from '../components/LoadingSpinner'
import { uploadFile } from '../lib/cloudinary'
import './Contract.css'

export default function Contract() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [contract, setContract] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [paymentRef, setPaymentRef] = useState('')
  const [showWorkModal, setShowWorkModal] = useState(false)
  const [workDescription, setWorkDescription] = useState('')
  const [workFiles, setWorkFiles] = useState([])
  const [paypalReady, setPaypalReady] = useState(false)
  const [paypalError, setPaypalError] = useState('')
  const paypalRef = useRef(null)

  const chatEndRef = useRef(null)

  const isEmployer = currentUser?.id === contract?.employer_id
  const isTalent = currentUser?.id === contract?.talent_id

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch contract
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*, employer:users!employer_id(*), talent:users!talent_id(*)')
        .eq('id', id)
        .single()

      if (contractError) throw contractError

      // Check participant
      if (currentUser.id !== contractData.employer_id && currentUser.id !== contractData.talent_id) {
        navigate('/dashboard')
        return
      }

      setContract(contractData)

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', id)
        .order('created_at', { ascending: true })

      setMessages(messagesData || [])

    } catch (error) {
      console.error('Error fetching contract:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, currentUser, navigate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (contract?.status !== 'pending_payment') return
    if (currentUser?.id !== contract?.employer_id) return

    function tryRender() {
      if (typeof window.paypal === 'undefined') {
        setPaypalError('PayPal is loading... please wait.')
        setTimeout(tryRender, 1000)
        return
      }

      const container = document.getElementById(
        'paypal-button-container'
      )
      if (!container) {
        setTimeout(tryRender, 500)
        return
      }

      if (container.children.length > 0) return

      setPaypalError('')
      setPaypalReady(true)

      try {
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 50,
            tagline: false,
          },
          createOrder: (data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [{
                amount: {
                  currency_code: 'USD',
                  value: Number(contract.amount)
                    .toFixed(2),
                },
                description: 'Vorak: ' +
                  contract.title,
                custom_id: contract.id,
              }],
              application_context: {
                brand_name: 'Vorak Freelance',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
              }
            })
          },
          onApprove: async (data, actions) => {
            try {
              const order =
                await actions.order.capture()

              await supabase
                .from('contracts')
                .update({
                  status: 'awaiting_confirmation',
                  paypal_order_id: order.id,
                  payment_method: 'paypal',
                  payment_reference: order.id,
                })
                .eq('id', contract.id)

              await supabase
                .from('notifications')
                .insert({
                  user_id: contract.talent_id,
                  type: 'payment_received',
                  title: 'Payment received!',
                  message: 'Client payment confirmed.',
                  link: '/contracts/' + contract.id,
                })

              // Increment orders_count only after successful payment
              if (contract.service_id) {
                const { data: service } = await supabase
                  .from('services')
                  .select('orders_count')
                  .eq('id', contract.service_id)
                  .single()

                if (service) {
                  await supabase
                    .from('services')
                    .update({ orders_count: (service.orders_count || 0) + 1 })
                    .eq('id', contract.service_id)
                }
              }

              alert(
                '\u2705 Payment successful!\n' +
                'Admin will activate your ' +
                'contract shortly.'
              )
              window.location.reload()

            } catch (err) {
              console.error('Capture error:', err)
              alert('Payment failed: ' + err.message)
            }
          },
          onError: (err) => {
            console.error('PayPal error:', err)
            setPaypalError(
              'Payment error. Please refresh and try again.'
            )
          },
          onCancel: () => {
            console.log('Cancelled')
          }
        }).render('#paypal-button-container')
      } catch (err) {
        console.error('Render error:', err)
        setPaypalError('Could not load PayPal: ' +
          err.message)
      }
    }

    const timer = setTimeout(tryRender, 500)
    return () => clearTimeout(timer)
  }, [contract?.id, contract?.status,
  currentUser?.id, contract?.employer_id])

  useEffect(() => {
    const channel = supabase
      .channel(`contract-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setContract((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    try {
      const { error } = await supabase.from('messages').insert({
        contract_id: id,
        sender_id: currentUser.id,
        content,
        created_at: new Date().toISOString(),
      })
      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
      showToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleFileUpload(file) {
    if (!file) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'vorak_uploads')
      formData.append('folder', 'messages')
      const isImage = file.type.startsWith('image/')
      const endpoint = isImage
        ? 'https://api.cloudinary.com/v1_1/ditl3dye5/image/upload'
        : 'https://api.cloudinary.com/v1_1/ditl3dye5/raw/upload'
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.secure_url) {
        await supabase.from('messages').insert({
          contract_id: contract.id,
          sender_id: currentUser.id,
          content: isImage ? '📷 Image' : '📎 ' + file.name,
          file_url: data.secure_url,
          file_name: file.name,
          file_type: file.type,
          created_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error('File upload error:', err)
      alert('File upload failed. Try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleManualPayment = async () => {
    if (!paymentRef.trim()) return
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          payment_reference: paymentRef,
          status: 'awaiting_confirmation'
        })
        .eq('id', id)

      if (error) throw error

      await createNotification(
        contract.talent_id,
        'payment',
        'Payment submitted',
        'Client has submitted payment reference for confirmation.',
        `/contracts/${id}`
      )

      showToast('Payment submitted for confirmation')
    } catch (error) {
      console.error('Error submitting payment:', error)
      showToast('Failed to submit payment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitWork = async () => {
    if (!workDescription.trim()) return
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'work_submitted',
          work_description: workDescription,
          work_submitted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await createNotification(
        contract.employer_id,
        'work',
        'Work submitted',
        'Talent has submitted the completed work for your review.',
        `/contracts/${id}`
      )

      setShowWorkModal(false)
      showToast('Work submitted successfully')
    } catch (error) {
      console.error('Error submitting work:', error)
      showToast('Failed to submit work', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveWork = async () => {
    if (!window.confirm('Approve this work? Payment will be released to the talent after admin confirmation.')) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          payout_released: false,
        })
        .eq('id', id)

      if (error) throw error

      // Increment talent's completed orders count
      const { data: tpData } = await supabase
        .from('talent_profiles')
        .select('total_orders')
        .eq('user_id', contract.talent_id)
        .single()

      if (tpData) {
        await supabase
          .from('talent_profiles')
          .update({ total_orders: (tpData.total_orders || 0) + 1 })
          .eq('user_id', contract.talent_id)
      }

      await createNotification(
        contract.talent_id,
        'contract',
        '✅ Work approved!',
        'The client approved your work. Payment is pending admin release and will appear in your balance shortly.',
        `/contracts/${id}`
      )

      showToast('Work approved! Admin will release payment to talent shortly.')
    } catch (error) {
      console.error('Error approving work:', error)
      showToast('Failed to approve work', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    const reason = window.prompt('Describe what needs to be changed:')
    if (!reason) return

    setSubmitting(true)
    try {
      // Send revision message
      await supabase.from('messages').insert({
        contract_id: id,
        sender_id: currentUser.id,
        content: `REVISION REQUESTED: ${reason}`
      })

      // Update contract status
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'active'
        })
        .eq('id', id)

      if (error) throw error

      await createNotification(
        contract.talent_id,
        'contract',
        'Revision requested',
        'Employer has requested revisions on your submitted work.',
        `/contracts/${id}`
      )

      showToast('Revision request sent')
    } catch (error) {
      console.error('Error requesting revision:', error)
      showToast('Failed to request revision', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDispute = async () => {
    const reason = window.prompt('Please describe the reason for the dispute:')
    if (!reason) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'disputed',
          dispute_reason: reason,
          dispute_opened_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await createNotification(
        contract.talent_id,
        'contract',
        'Dispute opened',
        'A dispute has been opened for this contract.',
        `/contracts/${id}`
      )

      showToast('Dispute opened. Admin will review.')
    } catch (error) {
      console.error('Error opening dispute:', error)
      showToast('Failed to open dispute', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />
  if (!contract) return null

  const statusColor = CONTRACT_STATUS_COLORS[contract.status] || 'gray'

  return (
    <div className="contract-page">
      <div className="contract-container">
        <header className="contract-header">
          <div className="header-top">
            <div>
              <h1 className="contract-title">{contract.title}</h1>
              <span className="contract-id">#CONTRACT-{contract.id.slice(0, 8)}</span>
            </div>
            <div className={`status-badge-lg ${statusColor} ${contract.status === 'pending_payment' ? 'pulse' : ''}`}>
              {contract.status.replace('_', ' ')}
            </div>
          </div>

          <div className="contract-info-grid">
            <div className="info-item">
              <span className="label">Amount</span>
              <span className="value teal">{formatCurrency(contract.amount)}</span>
            </div>
            <div className="info-item">
              <span className="label">Commission (8%)</span>
              <span className="value">{formatCurrency(contract.commission_amount)}</span>
            </div>
            <div className="info-item">
              <span className="label">{isTalent ? 'You Receive' : 'Talent Payout'}</span>
              <span className="value">{formatCurrency(contract.talent_payout)}</span>
            </div>
            <div className="info-item">
              <span className="label">Deadline</span>
              <span className="value">{formatDate(contract.deadline)}</span>
            </div>
          </div>

          <div className="participants">
            <div className="participant-card">
              <span className="role-label">Employer</span>
              <div className="user-info">
                {contract.employer?.avatar_url ? (
                  <img src={contract.employer.avatar_url} alt="" className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">{getInitials(contract.employer?.full_name)}</div>
                )}
                <div>
                  <Link to={`/talent/${contract.employer_id}`} className="user-name">{contract.employer?.full_name}</Link>
                  <div className="user-rating">★ {contract.employer?.rating_avg || '0.0'}</div>
                </div>
              </div>
            </div>
            <div className="participant-card">
              <span className="role-label">Talent</span>
              <div className="user-info">
                {contract.talent?.avatar_url ? (
                  <img src={contract.talent.avatar_url} alt="" className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">{getInitials(contract.talent?.full_name)}</div>
                )}
                <div>
                  <Link to={`/talent/${contract.talent_id}`} className="user-name">{contract.talent?.full_name}</Link>
                  <div className="user-rating">★ {contract.talent?.talent_profiles?.[0]?.rating_avg || '0.0'}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="contract-main">
          {/* Status Specific Sections */}
          {contract?.status === 'pending_payment' &&
            currentUser?.id === contract?.employer_id && (
              <div style={{
                background: 'var(--bg-card)',
                border: '2px solid rgba(15,110,86,0.3)',
                borderRadius: '16px',
                padding: '28px',
                marginBottom: '24px',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  💳 Complete Payment
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                }}>
                  Money held securely until you
                  approve the completed work
                </p>

                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    marginBottom: '10px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}>
                      {contract.title}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                    }}>
                      Total
                    </span>
                    <span style={{
                      fontSize: '26px',
                      fontWeight: '800',
                      color: '#0F6E56',
                    }}>
                      ${Number(contract.amount || 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>

                {paypalError && (
                  <div style={{
                    padding: '12px',
                    background: 'var(--error-bg)',
                    borderRadius: '8px',
                    color: 'var(--error)',
                    fontSize: '13px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}>
                    {paypalError}
                  </div>
                )}

                <div
                  id="paypal-button-container"
                  style={{ minHeight: '50px' }}
                />

                {!paypalReady && !paypalError && (
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    color: 'var(--text-tertiary)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--border)',
                      borderTop: '2px solid #0F6E56',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Loading PayPal...
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  color: 'var(--text-tertiary)',
                  fontSize: '12px',
                }}>
                  🔒 Visa · Mastercard · Debit cards · PayPal
                </div>
              </div>
            )}

          {contract?.status === 'pending_payment' &&
            currentUser?.id === contract?.talent_id && (
              <div style={{
                background: 'var(--warning-bg)',
                border: '1px solid rgba(239,159,39,0.25)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}>
                <div style={{
                  fontSize: '28px',
                  flexShrink: 0,
                }}>
                  ⏳
                </div>
                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--warning)',
                    marginBottom: '4px',
                  }}>
                    Waiting for client payment
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}>
                    The client needs to complete payment
                    before work can begin.
                  </div>
                </div>
              </div>
            )}

          {contract.status === 'awaiting_confirmation' && (
            <div className="status-section">
              <div className="info-banner warning">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4>Payment submitted — Admin confirming</h4>
                  <p>Our team is verifying the payment. This usually takes less than 2 hours.</p>
                </div>
              </div>
            </div>
          )}

          {contract.status === 'active' && (
            <div className="status-section">
              <div className="info-banner success">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4>Contract is active — work in progress</h4>
                  {isTalent && <button onClick={() => setShowWorkModal(true)} className="btn-primary btn-sm mt-2">Submit Your Work</button>}
                </div>
              </div>
            </div>
          )}

          {contract.status === 'work_submitted' && (
            <div className="status-section">
              <div className="info-banner info">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4>Work has been submitted for review</h4>
                  {isEmployer && (
                    <div className="action-buttons mt-4">
                      <button onClick={handleApproveWork} className="btn-primary btn-sm" disabled={submitting}>Approve & Release Payment</button>
                      <button onClick={handleRequestRevision} className="btn-outline btn-sm" disabled={submitting}>Request Revision</button>
                      <button onClick={handleOpenDispute} className="btn-text btn-sm text-red" disabled={submitting}>Open Dispute</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="work-preview mt-4">
                <h5>Work Description:</h5>
                <p>{contract.work_description}</p>
              </div>
            </div>
          )}

          {contract.status === 'completed' && (
            <div className="status-section">
              <div className="info-banner success">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4>Contract Completed Successfully</h4>
                  <p>Funds have been released to the talent.</p>
                </div>
              </div>
            </div>
          )}

          {contract.status === 'disputed' && (
            <div className="status-section">
              <div className="info-banner danger">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 14c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4>Dispute under review</h4>
                  <p>Our admin team is investigating the case and will reach out shortly.</p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Section */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '520px', marginTop: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '16px' }}>💬</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>Messages</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, index) => {
                const isMine = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '68%', background: isMine ? '#0F6E56' : 'var(--bg-secondary)', color: isMine ? 'white' : 'var(--text-primary)', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', border: isMine ? 'none' : '1px solid var(--border)' }}>
                      {msg.content && <span>{msg.content}</span>}
                      {msg.file_url && (
                        <div style={{ marginTop: msg.content ? '8px' : '0' }}>
                          {msg.file_type?.startsWith('image/') ? (
                            <img
                              src={msg.file_url}
                              alt={msg.file_name || 'Image'}
                              style={{ maxWidth: '220px', maxHeight: '200px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                              onClick={() => window.open(msg.file_url, '_blank')}
                            />
                          ) : (
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'inherit', textDecoration: 'none', fontSize: '13px', border: '1px solid rgba(255,255,255,0.15)' }}
                            >
                              📎 {msg.file_name || 'Download file'}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', paddingLeft: '4px', paddingRight: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
              <input
                id="chat-file-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 20 * 1024 * 1024) {
                      alert('File too large. Maximum 20MB.')
                      return
                    }
                    handleFileUpload(file)
                  }
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('chat-file-input').click()}
                disabled={uploadingFile}
                style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-card)', border: '1.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, transition: 'all 0.2s' }}
                title="Attach file or image"
              >
                {uploadingFile ? (
                  <div style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTop: '2px solid #0F6E56', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : '📎'}
              </button>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto' }}
                onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                style={{ width: '44px', height: '44px', borderRadius: '10px', background: newMessage.trim() ? '#0F6E56' : 'var(--border)', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s', flexShrink: 0 }}
              >
                {sending ? (
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : '➤'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {showWorkModal && (
        <div className="modal-overlay" onClick={() => setShowWorkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Completed Work</h2>
            <p className="text-secondary">Describe what you have completed and attach any relevant files.</p>
            <div className="form-group mt-4">
              <label>Work Description</label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Details about the delivered work..."
                required
              />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowWorkModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleSubmitWork}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
