import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const BAN_DURATIONS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
  { label: 'Permanent', days: null },
]

function getBanMessage(days) {
  const durEn = days ? `${days} day${days > 1 ? 's' : ''}` : 'permanently'
  const durHy = days ? `${days} օր` : 'ընդմիշտ'
  const durRu = days ? `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}` : 'навсегда'
  return [
    `🇬🇧 Your account has been banned for ${durEn}. Contact vorakfreelance@gmail.com for more details.`,
    `🇦🇲 Ձեր հաշիվը արգելափակված է ${durHy}: Մանրամասների համար կապվեք vorakfreelance@gmail.com-ի հետ:`,
    `�� Ваш аккаунт заблокирован на ${durRu}. Для подробностей: vorakfreelance@gmail.com.`,
  ].join('\n\n')
}

function getBanExpiry(days) {
  if (!days) return null
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function timeLeft(expiresAt) {
  if (!expiresAt) return 'Permanent'
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return 'Expired'
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return `${days}d left`
}

function BanModal({ user, onClose, onBanned }) {
  const [selectedDays, setSelectedDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const message = getBanMessage(selectedDays)

  async function handleBan() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_suspended: true,
          ban_expires_at: getBanExpiry(selectedDays),
          ban_message: message,
        })
        .eq('id', user.id)
      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'ban',
        title: '🚫 Account Banned',
        message: message,
        link: '/dashboard',
      })

      // Pause all active services
      await supabase
        .from('services')
        .update({ status: 'paused' })
        .eq('talent_id', user.id)
        .eq('status', 'active')

      showToast(`${user.full_name} banned`)
      onBanned()
      onClose()
    } catch (err) {
      showToast('Failed to ban user', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div style={{ background: '#1a1a18', border: '1px solid #333', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(226,75,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🚫</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '17px', color: '#fff' }}>Ban User</div>
            <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{user.full_name} · {user.email}</div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Ban Duration</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {BAN_DURATIONS.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => setSelectedDays(days)}
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${selectedDays === days ? '#E24B4A' : '#333'}`, background: selectedDays === days ? 'rgba(226,75,74,0.15)' : 'transparent', color: selectedDays === days ? '#E24B4A' : '#a1a1aa', transition: 'all 0.15s' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Message sent to user</div>
          <div style={{ background: '#111', border: '1px solid #2a2a28', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', lineHeight: '1.8', color: '#d4d4d4', whiteSpace: 'pre-line' }}>
            {message}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#a1a1aa', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={handleBan} disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#E24B4A', color: 'white', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Banning…' : `Ban for ${selectedDays ? selectedDays + (selectedDays === 1 ? ' Day' : ' Days') : 'Permanent'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [banTarget, setBanTarget] = useState(null)
  const [processing, setProcessing] = useState(null)
  const { showToast } = useToast()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('users').select('*').order('created_at', { ascending: false })
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      if (roleFilter !== 'all') query = query.eq('role', roleFilter)
      if (statusFilter === 'banned') query = query.eq('is_suspended', true)
      if (statusFilter === 'active') query = query.eq('is_suspended', false)
      const { data, error } = await query
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Fetch users error:', err)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleUnban(user) {
    if (!window.confirm(`Unban ${user.full_name}?`)) return
    setProcessing(user.id)
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_suspended: false, ban_expires_at: null, ban_message: null })
        .eq('id', user.id)
      if (error) throw error

      // Restore paused services
      await supabase
        .from('services')
        .update({ status: 'active' })
        .eq('talent_id', user.id)
        .eq('status', 'paused')

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'unban',
        title: '✅ Account Reinstated',
        message: 'Your account ban has been lifted. You can now access VORAK Freelance again.',
        link: '/dashboard',
      })
      showToast(`${user.full_name} unbanned`)
      fetchUsers()
    } catch { showToast('Failed to unban', 'error') }
    finally { setProcessing(null) }
  }

  async function handleDelete(user) {
    if (!window.confirm(`PERMANENTLY delete "${user.full_name}"? This cannot be undone.`)) return
    setProcessing(user.id)
    try {
      const { error } = await supabase.from('users').delete().eq('id', user.id)
      if (error) throw error
      showToast('User deleted')
      fetchUsers()
    } catch { showToast('Failed to delete user', 'error') }
    finally { setProcessing(null) }
  }

  const roleColor = { talent: '#0F6E56', employer: '#3b82f6', admin: '#f59e0b' }
  const tabCounts = { all: users.length, active: 0, banned: 0 }
  users.forEach(u => { if (u.is_suspended) tabCounts.banned++; else tabCounts.active++ })

  const inputStyle = { padding: '10px 14px', background: '#1a1a18', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const btnBase = { border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }

  return (
    <div style={{ color: '#fff' }}>
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} onBanned={fetchUsers} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Users</h1>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" style={{ ...inputStyle, width: '260px' }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'active', 'banned'].map(tab => (
            <button key={tab} onClick={() => setStatusFilter(tab)} style={{ ...btnBase, background: statusFilter === tab ? 'rgba(15,110,86,0.15)' : 'transparent', color: statusFilter === tab ? '#0F6E56' : '#a1a1aa', border: `1.5px solid ${statusFilter === tab ? '#0F6E56' : '#333'}`, padding: '7px 16px' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>{tabCounts[tab] || 0}</span>
            </button>
          ))}
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
          <option value="all">All Roles</option>
          <option value="talent">Talent</option>
          <option value="employer">Employer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#71717a' }}>Loading users…</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#71717a', background: '#1a1a18', borderRadius: '12px', border: '1px solid #2a2a28' }}>No users found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(user => {
            const banned = user.is_suspended
            const expires = user.ban_expires_at
            return (
              <div key={user.id} style={{ background: banned ? 'rgba(226,75,74,0.05)' : '#1a1a18', border: `1px solid ${banned ? 'rgba(226,75,74,0.25)' : '#2a2a28'}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', transition: 'all 0.2s' }}>

                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: user.avatar_url ? 'transparent' : `${roleColor[user.role] || '#555'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: roleColor[user.role] || '#fff', flexShrink: 0, overflow: 'hidden' }}>
                  {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.full_name?.[0] || '?')}
                </div>

                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{user.full_name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: `${roleColor[user.role] || '#555'}22`, color: roleColor[user.role] || '#a1a1aa' }}>
                      {user.role}
                    </span>
                    {user.id_verified && (
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(15,110,86,0.15)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.3)' }}>✓ Verified</span>
                    )}
                    {banned && (
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: 'rgba(226,75,74,0.15)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.3)' }}>
                        🚫 BANNED · {timeLeft(expires)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#71717a' }}>
                    {user.email} · Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  {user.role === 'talent' && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F6E56' }}>
                        Balance: ${Number(user.balance || 0).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '12px', color: '#71717a' }}>
                        Total earned: ${Number(user.total_earned || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                  {banned ? (
                    <button onClick={() => handleUnban(user)} disabled={processing === user.id} style={{ ...btnBase, background: 'rgba(15,110,86,0.15)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.3)' }}>
                      {processing === user.id ? '…' : '� Unban'}
                    </button>
                  ) : (
                    <button onClick={() => setBanTarget(user)} disabled={processing === user.id} style={{ ...btnBase, background: 'rgba(226,75,74,0.12)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.25)' }}>
                      � Ban
                    </button>
                  )}
                  <button onClick={() => handleDelete(user)} disabled={processing === user.id} style={{ ...btnBase, background: 'rgba(113,113,122,0.12)', color: '#71717a', border: '1px solid rgba(113,113,122,0.2)' }}>
                    {processing === user.id ? '…' : '🗑 Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
