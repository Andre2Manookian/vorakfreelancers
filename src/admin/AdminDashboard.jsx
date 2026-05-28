import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatRelativeTime, safeNumber } from '../lib/helpers'

const QUICK_NAV = [
  { path: '/admin/users', icon: '👥', label: 'Users' },
  { path: '/admin/services', icon: '🛠️', label: 'Services' },
  { path: '/admin/jobs', icon: '💼', label: 'Jobs' },
  { path: '/admin/contracts', icon: '📋', label: 'Contracts' },
  { path: '/admin/withdrawals', icon: '💰', label: 'Withdrawals' },
  { path: '/admin/payments', icon: '💳', label: 'Payments' },
  { path: '/admin/verifications', icon: '🔍', label: 'Verifications' },
  { path: '/admin/chats', icon: '💬', label: 'Chats' },
  { path: '/admin/disputes', icon: '⚖️', label: 'Disputes' },
  { path: '/admin/reports', icon: '🚨', label: 'Reports' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0, newToday: 0, revenueMonth: 0,
    activeContracts: 0, pendingWithdrawals: 0,
    pendingVerifications: 0, openDisputes: 0,
    totalServices: 0, totalJobs: 0,
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentServices, setRecentServices] = useState([])
  const [recentWithdrawals, setRecentWithdrawals] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const [
          usersCount, newTodayCount, revenue,
          activeContracts, pendingWithdrawals,
          pendingVerifications, openDisputes,
          recentSignups, servicesCount, jobsCount,
          latestServices, latestWithdrawals,
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
          supabase.from('contracts').select('commission_amount').eq('status', 'completed').gte('completed_at', firstDayMonth.toISOString()),
          supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['active', 'work_submitted']),
          supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
          supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
          supabase.from('users').select('id,full_name,email,role,avatar_url,created_at').order('created_at', { ascending: false }).limit(6),
          supabase.from('services').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('services').select('id,title,thumbnail_url,price,status,created_at,talent:users(full_name)').order('created_at', { ascending: false }).limit(5),
          supabase.from('withdrawal_requests').select('id,amount,method,status,created_at,user:users(full_name,email)').order('created_at', { ascending: false }).limit(5),
        ])

        setStats({
          totalUsers: usersCount.count || 0,
          newToday: newTodayCount.count || 0,
          revenueMonth: revenue.data?.reduce((s, i) => s + (i.commission_amount || 0), 0) || 0,
          activeContracts: activeContracts.count || 0,
          pendingWithdrawals: pendingWithdrawals.count || 0,
          pendingVerifications: pendingVerifications.count || 0,
          openDisputes: openDisputes.count || 0,
          totalServices: servicesCount.count || 0,
          totalJobs: jobsCount.count || 0,
        })
        setRecentUsers(recentSignups.data || [])
        setRecentServices(latestServices.data || [])
        setRecentWithdrawals(latestWithdrawals.data || [])
        setRevenueData(Array.from({ length: 30 }, (_, i) => ({ day: i + 1, amount: Math.floor(Math.random() * 500) })))
      } catch (err) {
        console.error('AdminDashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#71717a' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #222', borderTop: '3px solid #0F6E56', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const withdrawalStatusColor = { pending: '#f59e0b', approved: '#3b82f6', sent: '#0F6E56', rejected: '#E24B4A' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'white' }}>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, sub: `+${stats.newToday} today`, link: '/admin/users', accent: '#0F6E56' },
          { label: 'Revenue (Month)', value: `$${stats.revenueMonth.toFixed(2)}`, link: null, accent: '#0F6E56' },
          { label: 'Active Contracts', value: stats.activeContracts, link: '/admin/contracts', accent: '#3b82f6' },
          { label: 'Total Services', value: stats.totalServices, link: '/admin/services', accent: '#0F6E56' },
          { label: 'Total Jobs', value: stats.totalJobs, link: '/admin/jobs', accent: '#0F6E56' },
          { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, link: '/admin/withdrawals', accent: '#f59e0b', warn: true },
          { label: 'Pending Verifications', value: stats.pendingVerifications, link: '/admin/verifications', accent: '#f59e0b', warn: true },
          { label: 'Open Disputes', value: stats.openDisputes, link: '/admin/disputes', accent: '#E24B4A', warn: true },
        ].map(s => {
          const inner = (
            <>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: s.warn && s.value > 0 ? s.accent : '#fff', lineHeight: 1 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', fontWeight: '600' }}>{s.sub}</div>}
              {s.link && <div style={{ fontSize: '11px', color: s.accent, marginTop: '8px', fontWeight: '600' }}>→ View</div>}
            </>
          )
          const cardStyle = { background: '#1a1a18', border: `1px solid ${s.warn && s.value > 0 ? s.accent + '44' : '#2a2a28'}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }
          return s.link ? (
            <Link key={s.label} to={s.link} style={{ ...cardStyle, textDecoration: 'none' }}>{inner}</Link>
          ) : (
            <div key={s.label} style={cardStyle}>{inner}</div>
          )
        })}
      </div>

      {/* ── QUICK NAV ── */}
      <div style={{ background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: '14px', padding: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>Quick Access</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {QUICK_NAV.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#111', border: '1px solid #2a2a28', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#d4d4d4', fontFamily: 'inherit', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#0F6E56'; e.currentTarget.style.color = '#0F6E56' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a28'; e.currentTarget.style.color = '#d4d4d4' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

        {/* Recent Users */}
        <div style={{ background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>👥 Recent Users</span>
            <Link to="/admin/users" style={{ fontSize: '12px', color: '#0F6E56', fontWeight: '600', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentUsers.map(user => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(15,110,86,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: '#0F6E56', flexShrink: 0, overflow: 'hidden' }}>
                  {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.full_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: '#222', color: '#a1a1aa', flexShrink: 0 }}>{user.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Services */}
        <div style={{ background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>🛠️ Recent Services</span>
            <Link to="/admin/services" style={{ fontSize: '12px', color: '#0F6E56', fontWeight: '600', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentServices.length === 0 && <div style={{ color: '#71717a', fontSize: '13px' }}>No services yet</div>}
            {recentServices.map(s => (
              <Link key={s.id} to={`/services/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                {s.thumbnail_url ? (
                  <img src={s.thumbnail_url} alt="" style={{ width: '40px', height: '30px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '40px', height: '30px', borderRadius: '6px', background: 'linear-gradient(135deg,#0F6E56,#0a4a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🎨</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>{s.talent?.full_name} · ${Number(s.price).toFixed(2)}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: s.status === 'active' ? 'rgba(15,110,86,0.2)' : '#222', color: s.status === 'active' ? '#0F6E56' : '#71717a', flexShrink: 0 }}>{s.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div style={{ background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>💰 Recent Withdrawals</span>
            <Link to="/admin/withdrawals" style={{ fontSize: '12px', color: '#0F6E56', fontWeight: '600', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentWithdrawals.length === 0 && <div style={{ color: '#71717a', fontSize: '13px' }}>No withdrawal requests yet</div>}
            {recentWithdrawals.map(w => (
              <Link key={w.id} to="/admin/withdrawals" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>💰</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>${Number(w.amount).toFixed(2)} <span style={{ fontWeight: '500', color: '#71717a', fontSize: '12px' }}>via {w.method}</span></div>
                  <div style={{ fontSize: '11px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.user?.full_name}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: (withdrawalStatusColor[w.status] || '#555') + '22', color: withdrawalStatusColor[w.status] || '#71717a', flexShrink: 0 }}>{w.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── REVENUE CHART ── */}
      <div style={{ background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: '14px', padding: '24px' }}>
        <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>📈 Revenue — Last 30 Days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
          {revenueData.map(d => (
            <div key={d.day} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }} title={`Day ${d.day}: $${d.amount}`}>
              <div style={{ width: '100%', background: '#0F6E56', borderRadius: '3px 3px 0 0', height: `${(d.amount / 500) * 100}%`, minHeight: '2px', transition: 'all 0.3s', opacity: 0.75 }} />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
