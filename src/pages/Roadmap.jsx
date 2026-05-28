export default function Roadmap() {
  const milestones = [
    { 
      status: 'completed', 
      title: 'Platform Launch', 
      date: 'Q1 2026',
      desc: 'Core marketplace, authentication, and secure escrow payments.'
    },
    { 
      status: 'in_progress', 
      title: 'Admin Suite', 
      date: 'Q2 2026',
      desc: 'Enhanced tools for dispute resolution, verification, and financial reporting.'
    },
    { 
      status: 'pending', 
      title: 'Mobile App', 
      date: 'Q3 2026',
      desc: 'Dedicated iOS and Android apps for better real-time communication.'
    },
    { 
      status: 'pending', 
      title: 'VORAK API', 
      date: 'Q4 2026',
      desc: 'Developer API for integrating VORAK services into third-party apps.'
    }
  ]

  return (
    <div className="roadmap-page" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>Platform Roadmap</h1>
        <p style={{ color: '#71717a' }}>See where VORAK is headed next.</p>
      </header>

      <div className="roadmap-timeline" style={{ position: 'relative', paddingLeft: '40px' }}>
        <div style={{ 
          position: 'absolute', 
          left: '7px', 
          top: '0', 
          bottom: '0', 
          width: '2px', 
          background: 'var(--border)' 
        }} />

        {milestones.map((m, i) => (
          <div key={i} style={{ marginBottom: '60px', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              left: '-40px', 
              top: '5px', 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              background: m.status === 'completed' ? 'var(--color-teal)' : m.status === 'in_progress' ? '#f59e0b' : 'var(--border)',
              border: '4px solid #000',
              zIndex: '1'
            }} />
            
            <div style={{ 
              background: 'var(--bg-primary)', 
              padding: '30px', 
              borderRadius: '16px', 
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '20px' }}>{m.title}</h3>
                <span style={{ fontSize: '12px', color: '#71717a', fontWeight: '700' }}>{m.date}</span>
              </div>
              <p style={{ color: '#71717a' }}>{m.desc}</p>
              <div style={{ 
                marginTop: '15px', 
                fontSize: '11px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                color: m.status === 'completed' ? 'var(--color-teal)' : m.status === 'in_progress' ? '#f59e0b' : '#71717a'
              }}>
                {m.status.replace('_', ' ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
