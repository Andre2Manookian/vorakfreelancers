import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function EmployerRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="route-loading">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />
  if (userProfile?.role !== 'employer' && userProfile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
