import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './AdminLayout.css'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/contracts', label: 'Contracts', icon: '📋' },
  { path: '/admin/payments', label: 'Payments', icon: '💳' },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: '💰', badgeKey: 'withdrawals' },
  { path: '/admin/verifications', label: 'Verifications', icon: '🔍', badgeKey: 'verifications' },
  { path: '/admin/chats', label: 'Chats', icon: '💬' },
  { path: '/admin/disputes', label: 'Disputes', icon: '⚖️', badgeKey: 'disputes' },
  { path: '/admin/reports', label: 'Reports', icon: '🚨' },
  { path: '/admin/services', label: 'Services', icon: '🛠️' },
  { path: '/admin/jobs', label: 'Jobs', icon: '💼' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()
  const [badges, setBadges] = useState({
    withdrawals: 0,
    verifications: 0,
    disputes: 0
  })

  useEffect(() => {
    const fetchBadges = async () => {
      const [withdrawals, verifications, disputes] = await Promise.all([
        supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'disputed')
      ])

      setBadges({
        withdrawals: withdrawals.count || 0,
        verifications: verifications.count || 0,
        disputes: disputes.count || 0
      })
    }

    fetchBadges()

    // Subscribe to changes for badges (simplified)
    const channel = supabase.channel(`admin-badges-${currentUser.id}`).on('postgres_changes', { event: '*', schema: 'public' }, () => {
      fetchBadges()
    }).subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentUser?.id])

  const currentNav = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  )

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <Link to="/" className="admin-logo">
            <span className="logo-text">VORAK FREELANCE</span>
          </Link>
          <span className="admin-tag">Admin Panel</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${(item.end ? location.pathname === item.path : location.pathname.startsWith(item.path))
                ? 'active' : ''
                }`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badgeKey && badges[item.badgeKey] > 0 && (
                <span className="nav-badge">{badges[item.badgeKey]}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-profile-sm">
            <div className="admin-avatar">{currentUser?.full_name?.[0]}</div>
            <div className="admin-info">
              <span className="admin-name">{currentUser?.full_name}</span>
              <Link to="/" className="view-site">View Site</Link>
            </div>
          </div>
          <button type="button" className="admin-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>{currentNav?.label || 'Admin'}</h1>
            <span className="date-today">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="admin-header-actions">
            <button className="header-notif-btn">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
