export default function BannedScreen({ profile }) {
  const expiry = profile?.ban_expires_at
    ? new Date(profile.ban_expires_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0e0c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#1a1a18',
        border: '1px solid rgba(226,75,74,0.3)',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(226,75,74,0.08)',
      }}>
        <div style={{
          width: '72px', height: '72px',
          borderRadius: '50%',
          background: 'rgba(226,75,74,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 24px',
        }}>🚫</div>

        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
          Account Suspended
        </h1>

        {expiry && (
          <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '24px' }}>
            Access restricted until <strong style={{ color: '#E24B4A' }}>{expiry}</strong>
          </p>
        )}

        <div style={{
          background: '#111',
          border: '1px solid #2a2a28',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
          fontSize: '14px',
          lineHeight: '2',
          color: '#d4d4d4',
          whiteSpace: 'pre-line',
          marginBottom: '28px',
        }}>
          {profile?.ban_message || 'Your account has been suspended. Contact support for details.'}
        </div>

        <p style={{ fontSize: '13px', color: '#52525b' }}>
          If you believe this is a mistake, email{' '}
          <a href="mailto:vorakfreelance@gmail.com" style={{ color: '#0F6E56' }}>
            vorakfreelance@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
