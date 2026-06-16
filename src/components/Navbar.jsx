import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import NotificationBell from './NotificationBell'
import './Navbar.css'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'
import './Navbar.css'

export default function Navbar() {
  const { currentUser, userProfile, logout, isAdmin } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme', theme
    )
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadCount(0)
      return
    }

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel(`navbar-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => fetchUnread()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLinks = [
    { to: '/talent', label: t('nav.browseTalent') },
    { to: '/jobs', label: t('nav.browseJobs') },
    { to: '/services', label: t('nav.browseServices') },
    { to: '/courses', label: t('nav.courses') },
    { to: '/#how-it-works', label: t('nav.howItWorks'), hash: true },
  ]

  const needsVerification = currentUser && userProfile && !userProfile.id_verified

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          VORAK FREELANCE
        </Link>

        <div className="navbar-center">
          {navLinks.map((link) => (
            link.hash ? (
              <a key={link.to} href={link.to} className="navbar-link">
                {link.label}
              </a>
            ) : (
              <Link key={link.to} to={link.to} className="navbar-link">
                {link.label}
              </Link>
            )
          ))}
          {userProfile?.role === 'talent' && (
            <Link to="/post-service" style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#0F6E56',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              + Post Service
            </Link>
          )}
          {userProfile?.role === 'employer' && (
            <Link to="/post-job" style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#0F6E56',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              + Post Job
            </Link>
          )}
        </div>

        <div className="navbar-right">
          <button
            onClick={() => setTheme(
              theme === 'dark' ? 'light' : 'dark'
            )}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <LanguageToggle />

          {currentUser && <NotificationBell />}

          {currentUser ? (
            <div className="navbar-user" ref={dropdownRef}>
              <button
                type="button"
                className="navbar-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="navbar-avatar" />
                ) : (
                  <span className="navbar-avatar-placeholder">
                    {userProfile?.full_name?.[0] || '?'}
                  </span>
                )}
                {needsVerification && <span className="navbar-verify-dot" title="Verify identity" />}
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>
                    {t('nav.dashboard')}
                  </Link>
                  <Link to="/messages" onClick={() => setDropdownOpen(false)} className="navbar-dropdown-messages">
                    {t('nav.messages')}
                    {unreadCount > 0 && <span className="navbar-unread-badge">{unreadCount}</span>}
                  </Link>
                  <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                    {t('nav.settings')}
                  </Link>
                  <Link to="/services" onClick={() => setDropdownOpen(false)}>
                    {t('nav.browseServices')}
                  </Link>
                  <Link to="/courses" onClick={() => setDropdownOpen(false)}>
                    {t('nav.courses')}
                  </Link>
                  <Link to="/verify" onClick={() => setDropdownOpen(false)} className="navbar-verify-link">
                    {t('nav.verification')}
                    {needsVerification && <span className="navbar-verify-dot-inline" />}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setDropdownOpen(false)}>
                      {t('nav.adminPanel')}
                    </Link>
                  )}
                  <button type="button" onClick={logout} className="navbar-logout">
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">{t('nav.login')}</Link>
              <Link to="/signup" className="btn-primary btn-sm">{t('nav.signup')}</Link>
            </>
          )}

          <button
            type="button"
            className="navbar-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className={`navbar-mobile ${menuOpen ? 'open' : ''}`}>
        {/* Mobile Menu Header */}
        <div className="navbar-mobile-header">
          <h3>{t('nav.menu') || 'Menu'}</h3>
          <button
            className="navbar-mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Auth Buttons at Top for Guests */}
        {!currentUser && (
          <div className="navbar-mobile-auth" style={{ marginBottom: '20px', marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <Link to="/login" className="btn-ghost" onClick={() => setMenuOpen(false)}>
              {t('nav.login')}
            </Link>
            <Link to="/signup" className="btn-primary" onClick={() => setMenuOpen(false)}>
              {t('nav.signup')}
            </Link>
          </div>
        )}

        {/* User Info (if logged in) */}
        {currentUser && (
          <div className="navbar-mobile-user">
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="" className="navbar-mobile-user-avatar" />
            ) : (
              <div className="navbar-mobile-user-avatar" style={{
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                color: 'var(--accent)'
              }}>
                {userProfile?.full_name?.[0] || '?'}
              </div>
            )}
            <div className="navbar-mobile-user-info">
              <div className="navbar-mobile-user-name">{userProfile?.full_name || 'User'}</div>
              <div className="navbar-mobile-user-email">{currentUser?.email}</div>
            </div>
            {needsVerification && <span className="navbar-verify-dot" style={{ position: 'static' }} />}
          </div>
        )}

        {/* Main Navigation */}
        <div className="navbar-mobile-section">
          <p className="navbar-mobile-section-title">Browse</p>
          <Link to="/talent" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
            <span className="navbar-mobile-link-icon">👤</span>
            {t('nav.browseTalent')}
          </Link>
          <Link to="/jobs" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
            <span className="navbar-mobile-link-icon">💼</span>
            {t('nav.browseJobs')}
          </Link>
          <Link to="/services" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
            <span className="navbar-mobile-link-icon">⚡</span>
            {t('nav.browseServices')}
          </Link>
          <Link to="/courses" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
            <span className="navbar-mobile-link-icon">🎓</span>
            Courses
          </Link>
          <a href="/#how-it-works" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
            <span className="navbar-mobile-link-icon">❓</span>
            {t('nav.howItWorks')}
          </a>
        </div>

        {/* Post Actions (for logged in users) */}
        {currentUser && (
          <div className="navbar-mobile-section">
            <p className="navbar-mobile-section-title">{t('nav.actions') || 'Actions'}</p>
            {userProfile?.role === 'talent' && (
              <Link to="/post-service" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
                <span className="navbar-mobile-link-icon">➕</span>
                Post Service
              </Link>
            )}
            {userProfile?.role === 'employer' && (
              <Link to="/post-job" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
                <span className="navbar-mobile-link-icon">➕</span>
                Post Job
              </Link>
            )}
          </div>
        )}

        {/* Account Links (if logged in) */}
        {currentUser && (
          <div className="navbar-mobile-section">
            <p className="navbar-mobile-section-title">My Account</p>
            <Link to="/dashboard" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="navbar-mobile-link-icon">📊</span>
              {t('nav.dashboard')}
            </Link>
            <Link to="/messages" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="navbar-mobile-link-icon">💬</span>
              {t('nav.messages')}
              {unreadCount > 0 && <span style={{ marginLeft: 'auto', background: 'var(--error)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>{unreadCount}</span>}
            </Link>
            <Link to="/settings" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="navbar-mobile-link-icon">⚙️</span>
              {t('nav.settings')}
            </Link>
            <Link to="/services" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="navbar-mobile-link-icon">🛠️</span>
              {t('nav.browseServices')}
            </Link>
            <Link to="/courses" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="navbar-mobile-link-icon">🎓</span>
              {t('nav.courses')}
            </Link>
            <Link to="/verify" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="navbar-mobile-link-icon">✅</span>
              {t('nav.verification')}
              {needsVerification && <span style={{ marginLeft: 'auto', color: 'var(--warning)', fontSize: '11px' }}>!</span>}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
                <span className="navbar-mobile-link-icon">🔒</span>
                {t('nav.adminPanel')}
              </Link>
            )}
          </div>
        )}

        {/* Logout at Bottom for logged in users */}
        {currentUser && (
          <div className="navbar-mobile-auth">
            <button type="button" className="btn-ghost" onClick={() => { logout(); setMenuOpen(false); }}>
              {t('nav.logout')}
            </button>
          </div>
        )}

        {/* Theme Toggle at Bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '12px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="navbar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
    </nav>
  )
}
