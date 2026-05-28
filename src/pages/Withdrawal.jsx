import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Withdrawal() {
  const { currentUser, userProfile } = useAuth()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank')
  const [bankDetails, setBankDetails] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [requests, setRequests] = useState([])
  const [balance, setBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)

  useEffect(() => {
    if (currentUser) {
      fetchBalance()
      fetchRequests()
    }
  }, [currentUser])

  async function fetchBalance() {
    const { data } = await supabase
      .from('users')
      .select('balance, total_earned')
      .eq('id', currentUser.id)
      .single()
    if (data) {
      setBalance(Number(data.balance) || 0)
      setTotalEarned(Number(data.total_earned) || 0)
    }
  }

  async function fetchRequests() {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('requested_at', { ascending: false })
    setRequests(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    if (amt > balance) { setError('Amount exceeds your balance of $' + balance.toFixed(2)); return }
    if (!bankDetails.trim()) { setError('Please enter your bank or card details'); return }
    setLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: currentUser.id,
          amount: amt,
          method,
          account_details: bankDetails.trim(),
          bank_details: bankDetails.trim(),
          notes: notes.trim() || null,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
      if (insertError) throw insertError
      await supabase.from('notifications').insert({
        user_id: '4d25bf9c-9997-4531-b355-980ac2a0dbe0',
        type: 'withdrawal_request',
        title: '💰 Withdrawal Request',
        message: (userProfile?.full_name || 'A talent') + ' requested $' + amt.toFixed(2) + ' withdrawal',
        link: '/admin/withdrawals',
      })
      setSuccess('Withdrawal request submitted! We will process within 1-2 business days.')
      setAmount('')
      setBankDetails('')
      setNotes('')
      fetchRequests()
    } catch (err) {
      setError('Failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (userProfile?.role !== 'talent') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Talent accounts only</h2>
        <Link to="/dashboard" style={{ color: '#0F6E56' }}>Back to Dashboard</Link>
      </div>
    )
  }

  const statusColor = { pending: '#EF9F27', approved: '#3b82f6', sent: '#0F6E56', rejected: '#E24B4A' }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'var(--bg-input)',
    border: '1.5px solid var(--border)', borderRadius: '8px',
    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '80px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px 0' }}>

        <Link to="/dashboard" style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Withdraw Funds</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>Processed within 1-2 business days</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Available Balance', value: '$' + balance.toFixed(2), teal: true, icon: '💰' },
            { label: 'Total Earned', value: '$' + totalEarned.toFixed(2), teal: false, icon: '📈' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg-card)', border: stat.teal ? '1.5px solid rgba(15,110,86,0.3)' : '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: stat.teal ? '#0F6E56' : 'var(--text-primary)', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {balance <= 0 && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(239,159,39,0.25)', borderRadius: '10px', padding: '14px 18px', color: 'var(--warning)', fontSize: '14px', marginBottom: '24px' }}>
            ⚠️ No balance available. Complete orders to earn money.
          </div>
        )}

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
            Request Withdrawal
          </h2>

          {error && (
            <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: '8px', padding: '12px 16px', color: 'var(--error)', fontSize: '14px', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '8px', padding: '12px 16px', color: 'var(--success)', fontSize: '14px', marginBottom: '20px' }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>Amount (USD) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '15px', pointerEvents: 'none' }}>$</span>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" min="1" max={balance} step="0.01"
                  style={{ ...inputStyle, paddingLeft: '28px' }}
                  onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Available: ${balance.toFixed(2)}</div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>Payment Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { value: 'bank', label: '🏦 Bank Transfer' },
                  { value: 'paypal', label: '💳 PayPal' },
                  { value: 'card', label: '💳 Card' },
                ].map(m => (
                  <button key={m.value} type="button" onClick={() => setMethod(m.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1.5px solid', borderColor: method === m.value ? '#0F6E56' : 'var(--border)', background: method === m.value ? 'rgba(15,110,86,0.1)' : 'var(--bg-secondary)', color: method === m.value ? '#0F6E56' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>
                {method === 'bank' ? 'Bank Account Details *' : method === 'paypal' ? 'PayPal Email *' : 'Card Number *'}
              </label>
              <textarea
                value={bankDetails} onChange={e => setBankDetails(e.target.value)}
                placeholder={method === 'bank' ? 'Enter your bank name, account number, and SWIFT/BIC code.\n\nIf your bank is not Armenian please contact support@vorakfreelance.com' : method === 'paypal' ? 'Enter your PayPal email address' : 'Enter your card number and cardholder name'}
                rows={4} style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
              {method === 'bank' && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                  ℹ️ If your bank account is not Armenian please contact: support@vorakfreelance.com
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '7px' }}>Additional Notes (optional)</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any additional information..." rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>

            <button
              type="submit" disabled={loading || balance <= 0}
              style={{ width: '100%', padding: '14px', background: (loading || balance <= 0) ? 'var(--border)' : '#0F6E56', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: (loading || balance <= 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}
            >
              {loading ? (
                <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Submitting...</>
              ) : '💰 Request Withdrawal'}
            </button>
          </form>
        </div>

        {requests.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Request History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#0F6E56' }}>${Number(req.amount).toFixed(2)}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: (statusColor[req.status] || '#555') + '20', color: statusColor[req.status] || '#555' }}>
                      {req.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {req.method?.toUpperCase()} — {new Date(req.requested_at || req.created_at).toLocaleDateString()}
                  </div>
                  {req.admin_notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', padding: '8px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                      Admin note: {req.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
