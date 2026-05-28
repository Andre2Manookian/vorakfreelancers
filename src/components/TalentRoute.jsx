import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function TalentRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="route-loading">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />
  if (userProfile?.role !== 'talent' && userProfile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
