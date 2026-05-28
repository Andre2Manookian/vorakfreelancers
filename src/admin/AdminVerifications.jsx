import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminUsers.css' // Reusing table styles

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const { showToast } = useToast()

  async function fetchVerifications() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, email, full_name, created_at, ' +
          'id_document_url, selfie_url, id_verified, ' +
          'verification_status'
        )
        .not('id_document_url', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Verifications error:', error)
        setVerifications([])
        return
      }
      setVerifications(data || [])
    } catch (err) {
      console.error('Verifications catch:', err)
      setVerifications([])
    }
  }

  async function approveVerification(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          id_verified: true,
          verification_status: 'approved',
        })
        .eq('id', userId)

      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'id_verified',
        title: 'Identity Verified ✅',
        message: 'Your identity has been verified. Your profile now shows a verified badge.',
        link: '/settings',
      })

      setVerifications(prev =>
        prev.filter(v => v.id !== userId)
      )
      alert('User verified successfully!')
      fetchVerifications()
    } catch (err) {
      console.error('Approve error:', err)
      alert('Failed: ' + err.message)
    }
  }

  async function rejectVerification(
    userId, reason
  ) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          id_verified: false,
          verification_status: 'rejected',
          admin_notes: reason
        })
        .eq('id', userId)

      if (error) throw error

      setVerifications(prev =>
        prev.filter(v => v.id !== userId)
      )
      setSuccess('Verification rejected')
    } catch (err) {
      console.error('Reject error:', err)
      setError('Failed to reject verification')
    }
  }

  useEffect(() => {
    fetchVerifications().finally(() => setLoading(false))
  }, [])

  const handleAction = async (userId, status) => {
    if (status === 'verified') {
      await approveVerification(userId)
    } else {
      const reason = window.prompt('Reason for rejection:')
      if (reason !== null) {
        await rejectVerification(userId, reason)
      }
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="admin-users">
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Documents</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                  No pending verifications found.
                </td>
              </tr>
            ) : (
              verifications.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">{user.full_name?.[0]}</div>
                      <div>
                        <div className="user-name">{user.full_name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {user.id_document_url && (
                        <a
                          href={user.id_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost btn-sm"
                          style={{ fontSize: '12px' }}
                        >
                          View ID
                        </a>
                      )}
                      {user.selfie_url && (
                        <a
                          href={user.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost btn-sm"
                          style={{ fontSize: '12px' }}
                        >
                          View Selfie
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-email">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAction(user.id, 'verified')}
                        disabled={processing === user.id}
                        className="btn-primary btn-sm"
                        style={{ background: '#22c55e', borderColor: '#22c55e' }}
                      >
                        {processing === user.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(user.id, 'rejected')}
                        disabled={processing === user.id}
                        className="btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                      >
                        {processing === user.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
