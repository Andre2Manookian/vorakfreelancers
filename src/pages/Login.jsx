import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })

      if (authError) throw authError
      if (!data.user) throw new Error('No user returned')

      const { data: profile, error: profileError } =
        await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

      console.log('User ID:', data.user.id)
      console.log('Profile:', profile)
      console.log('Profile error:', profileError)

      if (profile?.role === 'admin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }

    } catch (err) {
      console.error('Login failed:', err)
      setError(
        err.message?.includes('Invalid')
          ? 'Wrong email or password'
          : err.message || 'Login failed'
      )
      setLoading(false)
    }
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
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <Link to="/" style={{
            fontSize: '20px',
            fontWeight: '700',
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
            Welcome back
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}>
            Login to your account
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
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
              {error}
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
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 16px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
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
                    padding: '4px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{
                textAlign: 'right',
                marginTop: '8px',
              }}>
                <Link to="/forgot-password" style={{
                  fontSize: '13px',
                  color: '#0F6E56',
                  textDecoration: 'none',
                }}>
                  Forgot password?
                </Link>
              </div>
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
                  Logging in...
                </>
              ) : 'Login →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}>
            No account?{' '}
            <Link to="/signup" style={{
              color: '#0F6E56',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 
