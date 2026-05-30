import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(
      ({ data: { session } }) => {
        if (session) {
          setValidSession(true)
        } else {
          setError(
            'Invalid or expired reset link. ' +
            'Please request a new one.'
          )
        }
        setChecking(false)
      }
    )
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await
        supabase.auth.updateUser({
          password: password
        })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-input)',
    border: '1.5px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    height: '44px',
  }

  if (checking) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid var(--border)',
        borderTop: '3px solid #0F6E56',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>

        <div style={{
          textAlign: 'center',
          marginBottom: '28px',
        }}>
          <Link to="/" style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#0F6E56',
            letterSpacing: '3px',
            textDecoration: 'none',
            display: 'block',
            marginBottom: '16px',
          }}>
            VORAK FREELANCE
          </Link>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Set New Password
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}>
            Choose a strong password
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '52px',
                marginBottom: '16px',
              }}>
                ✅
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}>
                Password Updated!
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                marginBottom: '20px',
              }}>
                Redirecting to login...
              </p>
              <Link to="/login" style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: '#0F6E56',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
              }}>
                Go to Login →
              </Link>
            </div>
          ) : !validSession ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '52px',
                marginBottom: '16px',
              }}>
                ❌
              </div>
              <p style={{
                color: 'var(--error)',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6',
              }}>
                {error}
              </p>
              <Link to="/forgot-password" style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: '#0F6E56',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
              }}>
                Request New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: 'var(--error-bg)',
                  border: '1px solid rgba(226,75,74,0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: 'var(--error)',
                  fontSize: '14px',
                  marginBottom: '20px',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '7px',
                }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    style={inputStyle}
                    onFocus={e => {
                      e.target.style.borderColor = '#0F6E56'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor =
                        'var(--border)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '7px',
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  style={inputStyle}
                  onFocus={e => {
                    e.target.style.borderColor = '#0F6E56'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor =
                      'var(--border)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading
                    ? '#555' : '#0F6E56',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: loading
                    ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '18px', height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Updating...
                  </>
                ) : '🔐 Update Password'}
              </button>

              <p style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                Remember it?{' '}
                <Link to="/login" style={{
                  color: '#0F6E56',
                  fontWeight: '600',
                  textDecoration: 'none',
                }}>
                  Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
