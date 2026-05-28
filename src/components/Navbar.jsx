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
        <div className="navbar-mobile-theme">
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
        </div>
        {navLinks.map((link) => (
          link.hash ? (
            <a key={link.to} href={link.to} className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ) : (
            <Link key={link.to} to={link.to} className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          )
        ))}
        {currentUser ? (
          <div className="navbar-mobile-auth">
            <Link to="/dashboard" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/messages" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              Messages {unreadCount > 0 && `(${unreadCount})`}
            </Link>
            <Link to="/settings" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Settings</Link>
            <Link to="/verify" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Verification</Link>
            {isAdmin && <Link to="/admin" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Admin</Link>}
            <button type="button" className="btn-ghost btn-block" onClick={logout}>Logout</button>
          </div>
        ) : (
          <div className="navbar-mobile-auth">
            <Link to="/login" className="btn-ghost btn-block" onClick={() => setMenuOpen(false)}>
              {t('nav.login')}
            </Link>
            <Link to="/signup" className="btn-primary btn-block" onClick={() => setMenuOpen(false)}>
              {t('nav.signup')}
            </Link>
          </div>
        )}
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
