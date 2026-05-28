import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRelativeTime } from '../lib/helpers'
import './NotificationBell.css'

export default function NotificationBell() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.log('Notifications not ready:', error.message)
        return
      }
      setNotifications(data || [])
      setUnreadCount(
        data?.filter(n => !n.is_read).length || 0
      )
    } catch (err) {
      console.log('Notifications error:', err)
    }
  }, [currentUser])

  useEffect(() => {
    fetchNotifications()

    if (!currentUser) return

    const channel = supabase
      .channel(`bell-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          fetchNotifications()
          // Optionally play sound or show browser notification
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, fetchNotifications])

  const markAsRead = async (id) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
    fetchNotifications()
  }

  return (
    <div className="notification-bell-container">
      <button className="bell-btn" onClick={() => setIsOpen(!isOpen)}>
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div className="bell-overlay" onClick={() => setIsOpen(false)} />
          <div className="notifications-dropdown">
            <div className="dropdown-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn-link-sm">Mark all as read</button>
              )}
            </div>
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <Link
                    key={n.id}
                    to={n.link || '#'}
                    className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
                    onClick={() => {
                      markAsRead(n.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="notif-icon">
                      {n.type === 'message' && '💬'}
                      {n.type === 'payment' && '💰'}
                      {n.type === 'contract' && '📋'}
                      {n.type === 'work' && '🚀'}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-time">{formatRelativeTime(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div className="unread-dot" />}
                  </Link>
                ))
              ) : (
                <div className="empty-notifs">No notifications yet</div>
              )}
            </div>
            <Link to="/dashboard" className="view-all-link" onClick={() => setIsOpen(false)}>
              View all dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
