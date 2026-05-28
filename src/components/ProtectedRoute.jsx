import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    if (!loading && !currentUser) {
      window.location.href = '/login'
    }
  }, [loading, currentUser])

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border)',
        borderTop: '3px solid #0F6E56',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  if (!currentUser) return null
  return children
} 
