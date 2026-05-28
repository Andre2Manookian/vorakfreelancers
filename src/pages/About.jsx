import './Landing.css' // Reusing some landing styles

export default function About() {
  return (
    <div className="about-page" style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Connecting Armenian Talent with Global Opportunities</h1>
        <p style={{ fontSize: '18px', color: '#71717a', maxWidth: '700px', margin: '0 auto' }}>
          VORAK is the premier freelance marketplace designed specifically for professionals in Armenia and the Caucasus.
        </p>
      </header>

      <section style={{ marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Our Mission</h2>
            <p style={{ color: '#71717a', lineHeight: '1.6', fontSize: '17px' }}>
              We believe that talent has no borders. Our mission is to empower Armenian freelancers by providing them with a secure, reliable, and professional platform to showcase their skills and connect with employers from around the world.
            </p>
          </div>
          <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🇦🇲</div>
            <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Local Expertise</h3>
            <p style={{ color: '#71717a' }}>Built by Armenians, for Armenians. We understand the local market and the unique challenges faced by talent in our region.</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '40px' }}>Why VORAK?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div style={{ padding: '30px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>🔒</div>
            <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>Secure Payments</h4>
            <p style={{ color: '#71717a' }}>Our escrow system ensures that talent gets paid and employers get the quality work they expect.</p>
          </div>
          <div style={{ padding: '30px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>💬</div>
            <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>Real-time Collaboration</h4>
            <p style={{ color: '#71717a' }}>Built-in chat and file sharing make it easy to manage projects from start to finish.</p>
          </div>
          <div style={{ padding: '30px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>🔍</div>
            <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>Verified Talent</h4>
            <p style={{ color: '#71717a' }}>We manually verify identity and portfolios to maintain a high standard of quality (Vorak).</p>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', background: 'var(--color-teal-dark)', padding: '60px', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px', color: 'var(--text-primary)' }}>Ready to get started?</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '30px' }}>Join thousands of professionals already growing their business on VORAK.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <a href="/signup" className="btn-primary" style={{ background: 'white', color: 'black' }}>Join as Talent</a>
          <a href="/signup" className="btn-primary">Hire Talent</a>
        </div>
      </section>
    </div>
  )
}
