import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="notfound-page" style={{ 
      padding: '100px 20px', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <div style={{ fontSize: '120px', fontWeight: '800', color: 'var(--border)', marginBottom: '20px' }}>404</div>
      <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Page Not Found</h1>
      <p style={{ color: '#71717a', maxWidth: '400px', marginBottom: '32px' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  )
}
