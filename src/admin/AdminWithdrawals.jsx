import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const STATUS_COLOR = { pending: '#EF9F27', approved: '#3b82f6', sent: '#0F6E56', rejected: '#E24B4A' }

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [adminNotes, setAdminNotes] = useState({})
  const [processing, setProcessing] = useState(null)
  const { showToast } = useToast()

  async function fetchWithdrawals() {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('requested_at', { ascending: false })
      if (error) { setWithdrawals([]); return }
      if (!data?.length) { setWithdrawals([]); return }

      const userIds = [...new Set(data.map(w => w.user_id))]
      const { data: users } = await supabase
        .from('users').select('id, full_name, email').in('id', userIds)
      const usersMap = {}
      users?.forEach(u => { usersMap[u.id] = u })
      setWithdrawals(data.map(w => ({ ...w, user: usersMap[w.user_id] || null })))
    } catch (err) {
      console.error('Withdrawals error:', err)
      setWithdrawals([])
    }
  }

  useEffect(() => { fetchWithdrawals().finally(() => setLoading(false)) }, [])

  async function handleApprove(req) {
    if (!window.confirm('Approve this request?')) return
    setProcessing(req.id)
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('id', req.id)
      if (error) throw error
      showToast('Request approved')
      fetchWithdrawals()
    } catch { showToast('Failed to approve', 'error') }
    finally { setProcessing(null) }
  }

  async function handleMarkSent(req) {
    if (!window.confirm(`Mark $${Number(req.amount).toFixed(2)} as sent to ${req.user?.full_name}?`)) return
    setProcessing(req.id)
    try {
      const note = adminNotes[req.id] || ''
      const { error: updateErr } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'sent', processed_at: new Date().toISOString(), admin_notes: note || null })
        .eq('id', req.id)
      if (updateErr) throw updateErr

      const { data: userData } = await supabase
        .from('users').select('balance, total_withdrawn').eq('id', req.user_id).single()
      await supabase.from('users').update({
        balance: Math.max(0, (Number(userData?.balance) || 0) - Number(req.amount)),
        total_withdrawn: (Number(userData?.total_withdrawn) || 0) + Number(req.amount),
      }).eq('id', req.user_id)

      await supabase.from('notifications').insert({
        user_id: req.user_id,
        type: 'withdrawal_sent',
        title: '✅ Withdrawal Processed!',
        message: '$' + Number(req.amount).toFixed(2) + ' has been sent to your ' + (req.method || 'account'),
        link: '/withdrawal',
      })
      showToast('Marked as sent — balance deducted')
      fetchWithdrawals()
    } catch (err) { showToast('Failed: ' + err.message, 'error') }
    finally { setProcessing(null) }
  }

  async function handleReject(req) {
    const reason = window.prompt('Rejection reason (optional):') ?? null
    if (reason === null) return
    setProcessing(req.id)
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'rejected', admin_notes: reason || null, processed_at: new Date().toISOString() })
        .eq('id', req.id)
      if (error) throw error
      showToast('Request rejected')
      fetchWithdrawals()
    } catch { showToast('Failed to reject', 'error') }
    finally { setProcessing(null) }
  }

  const filtered = withdrawals.filter(r => r.status === activeTab)
  const tabCounts = {}
  withdrawals.forEach(r => { tabCounts[r.status] = (tabCounts[r.status] || 0) + 1 })

  const btnBase = { border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ padding: '0', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>Withdrawal Requests</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['pending', 'approved', 'sent', 'rejected'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...btnBase, background: activeTab === tab ? (STATUS_COLOR[tab] + '20') : 'var(--bg-secondary)', color: activeTab === tab ? STATUS_COLOR[tab] : 'var(--text-secondary)', border: `1.5px solid ${activeTab === tab ? STATUS_COLOR[tab] : 'var(--border)'}`, padding: '8px 16px' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tabCounts[tab] ? <span style={{ marginLeft: '6px', background: STATUS_COLOR[tab] + '30', color: STATUS_COLOR[tab], borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>{tabCounts[tab]}</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          No {activeTab} requests
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(req => (
            <div key={req.id} style={{ background: 'var(--bg-card)', border: `1px solid ${req.status === 'pending' ? 'rgba(239,159,39,0.3)' : 'var(--border)'}`, borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '3px' }}>{req.user?.full_name || 'Unknown User'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{req.user?.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {new Date(req.requested_at || req.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0F6E56' }}>${Number(req.amount).toFixed(2)}</div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: (STATUS_COLOR[req.status] || '#555') + '20', color: STATUS_COLOR[req.status] || '#555' }}>
                    {req.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Method</div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{req.method?.toUpperCase()}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Bank / Payment Details</div>
                  <div style={{ fontSize: '13px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{req.account_details || req.bank_details || '—'}</div>
                </div>
              </div>

              {(req.notes || req.note) && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>User Notes</div>
                  <div style={{ fontSize: '13px' }}>{req.notes || req.note}</div>
                </div>
              )}

              {req.admin_notes && (
                <div style={{ background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#EF9F27' }}>
                  📝 Admin note: {req.admin_notes}
                </div>
              )}

              {(req.status === 'pending' || req.status === 'approved') && (
                <div style={{ marginBottom: '12px' }}>
                  <textarea
                    value={adminNotes[req.id] || ''}
                    onChange={e => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    placeholder="Admin note (optional, shown to talent on sent/reject)"
                    rows={2}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {req.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(req)} disabled={processing === req.id} style={{ ...btnBase, background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640' }}>
                      {processing === req.id ? '...' : '✓ Approve'}
                    </button>
                    <button onClick={() => handleReject(req)} disabled={processing === req.id} style={{ ...btnBase, background: '#E24B4A20', color: '#E24B4A', border: '1px solid #E24B4A40' }}>
                      ✗ Reject
                    </button>
                  </>
                )}
                {req.status === 'approved' && (
                  <button onClick={() => handleMarkSent(req)} disabled={processing === req.id} style={{ ...btnBase, background: '#0F6E5620', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.3)', padding: '9px 20px' }}>
                    {processing === req.id ? 'Processing...' : '✅ Mark as Sent'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
