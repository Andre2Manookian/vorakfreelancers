import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '40px 0 24px',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '32px',
          marginBottom: '32px',
        }}>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '800',
              color: '#0F6E56',
              letterSpacing: '2px',
              marginBottom: '8px',
            }}>
              VORAK FREELANCE
            </div>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              maxWidth: '240px',
              lineHeight: '1.6',
            }}>
              Armenia and the Caucasus
              region's first freelance marketplace.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '48px',
            flexWrap: 'wrap',
          }}>
            {[
              {
                title: 'Platform',
                links: [
                  ['/talent', 'Browse Talent'],
                  ['/services', 'Services'],
                  ['/jobs', 'Jobs'],
                  ['/about', 'About'],
                ]
              },
              {
                title: 'Legal',
                links: [
                  ['/terms', 'Terms'],
                  ['/privacy', 'Privacy'],
                  ['/faq', 'FAQ'],
                  ['/roadmap', 'Roadmap'],
                ]
              },
              {
                title: 'Account',
                links: [
                  ['/signup', 'Sign Up'],
                  ['/login', 'Login'],
                  ['/dashboard', 'Dashboard'],
                  ['/settings', 'Settings'],
                ]
              },
            ].map(col => (
              <div key={col.title}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                }}>
                  {col.title}
                </div>
                {col.links.map(([to, label]) => (
                  <Link key={to} to={to} style={{
                    display: 'block',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    marginBottom: '8px',
                    transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.target.style.color = '#0F6E56'
                    }}
                    onMouseLeave={e => {
                      e.target.style.color =
                        'var(--text-secondary)'
                    }}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
          }}>
            © 2026 Vorak Freelance.
            Founded by Andre Manookian —
            Yerevan, Armenia 🇦🇲
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
          }}>
            {[
              ['https://instagram.com/vorakfreelancers',
                '@vorakfreelancers'],
              ['https://tiktok.com/@vorak.freelancers',
                '@vorak.freelancers'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => {
                  e.target.style.color = '#0F6E56'
                }}
                onMouseLeave={e => {
                  e.target.style.color =
                    'var(--text-tertiary)'
                }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
