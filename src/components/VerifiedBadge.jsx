export default function VerifiedBadge({
  size = 'sm'
}) {
  const styles = {
    sm: {
      padding: '2px 8px',
      fontSize: '11px',
      gap: '3px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '13px',
      gap: '4px',
    },
    lg: {
      padding: '6px 16px',
      fontSize: '14px',
      gap: '5px',
    },
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: 'var(--accent-light)',
      color: '#0F6E56',
      borderRadius: '20px',
      fontWeight: '600',
      border: '1.5px solid rgba(15,110,86,0.3)',
      whiteSpace: 'nowrap',
      ...styles[size],
    }}>
      <span style={{
        fontSize: '10px',
        background: '#0F6E56',
        color: 'white',
        borderRadius: '50%',
        width: '14px',
        height: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
      }}>
        ✓
      </span>
      Verified
    </span>
  )
} 
