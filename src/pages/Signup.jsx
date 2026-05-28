import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [role, setRole] = useState('')
  const [termsChecked, setTermsChecked] =
    useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] =
    useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!role) {
      setError('Please select your role')
      return
    }
    if (!termsChecked) {
      setError('Please accept the terms')
      return
    }

    setLoading(true)
    try {
      await signup(
        email.trim(),
        password,
        fullName.trim(),
        role
      )
      navigate('/onboarding')
    } catch (err) {
      console.error('Signup error:', err)
      if (err.message?.includes('already')) {
        setError('Email already registered. Please login.')
      } else {
        setError(err.message ||
          'Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-input)',
    border: '1.5px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px'
      }}>

        <div style={{
          textAlign: 'center',
          marginBottom: '28px'
        }}>
          <Link to="/" style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#0F6E56',
            letterSpacing: '3px',
            textDecoration: 'none',
            display: 'block',
            marginBottom: '12px',
          }}>
            VORAK FREELANCE
          </Link>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            Create your account
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}>
            Join thousands of professionals
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
        }}>

          {error && (
            <div style={{
              background: 'var(--error-bg)',
              border: '1px solid rgba(226,75,74,0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: 'var(--error)',
              fontSize: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e =>
                  setFullName(e.target.value)}
                placeholder="Andre Manookian"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword
                    ? 'text' : 'password'}
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  style={{
                    ...inputStyle,
                    paddingRight: '44px',
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
                    color: 'var(--text-tertiary)',
                    fontSize: '16px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e =>
                  setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '10px',
              }}>
                I am joining as
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                {[
                  {
                    value: 'employer',
                    icon: '💼',
                    title: 'Employer',
                    sub: 'I want to hire talent'
                  },
                  {
                    value: 'talent',
                    icon: '🎯',
                    title: 'Talent',
                    sub: 'I want to find work'
                  },
                ].map(r => (
                  <div
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    style={{
                      padding: '16px 12px',
                      border: role === r.value
                        ? '2px solid #0F6E56'
                        : '1.5px solid var(--border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: role === r.value
                        ? 'rgba(15,110,86,0.08)'
                        : 'var(--bg-secondary)',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      fontSize: '24px',
                      marginBottom: '6px',
                    }}>
                      {r.icon}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}>
                      {r.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)',
                    }}>
                      {r.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() =>
                setTermsChecked(!termsChecked)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                minWidth: '18px',
                borderRadius: '4px',
                border: termsChecked
                  ? '2px solid #0F6E56'
                  : '2px solid var(--border)',
                background: termsChecked
                  ? '#0F6E56' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                marginTop: '1px',
              }}>
                {termsChecked && (
                  <span style={{
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}>
                    ✓
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                userSelect: 'none',
              }}>
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  onClick={e => e.stopPropagation()}
                  style={{ color: '#0F6E56' }}
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  onClick={e => e.stopPropagation()}
                  style={{ color: '#0F6E56' }}
                >
                  Privacy Policy
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading
                  ? '#555' : '#0F6E56',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading
                  ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Creating account...
                </>
              ) : 'Create Account →'}
            </button>

          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#0F6E56',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
} 
