export default function Terms() {
  return (
    <div className="terms-page" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '40px' }}>Terms of Service</h1>
      
      <div style={{ color: '#71717a', lineHeight: '1.8' }}>
        <p style={{ marginBottom: '20px' }}>Last updated: May 16, 2026</p>
        
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using the VORAK platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>2. User Responsibilities</h2>
          <p>Users are responsible for maintaining the confidentiality of their accounts and for all activities that occur under their account. You must provide accurate and complete information when creating an account.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>3. Payment and Escrow</h2>
          <p>VORAK uses an escrow system to protect both talent and employers. Payments are held by VORAK and released to the talent upon successful completion of the agreed-upon milestones and approval by the employer.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>4. Platform Fees</h2>
          <p>VORAK charges a service fee for successful transactions. These fees are deducted from the payment released to the talent. Fees are subject to change with notice.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>5. Dispute Resolution</h2>
          <p>In the event of a dispute between a talent and an employer, VORAK provides a resolution center. Our decision in such disputes is final and binding on both parties.</p>
        </section>
      </div>
    </div>
  )
}
