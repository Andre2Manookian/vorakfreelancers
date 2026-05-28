export default function Privacy() {
  return (
    <div className="privacy-page" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '40px' }}>Privacy Policy</h1>
      
      <div style={{ color: '#71717a', lineHeight: '1.8' }}>
        <p style={{ marginBottom: '20px' }}>Last updated: May 16, 2026</p>
        
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, complete your profile, or communicate with other users. This may include your name, email, payment information, and identity documents for verification.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about your account and platform updates.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>3. Data Sharing</h2>
          <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processors), to comply with the law, or with your explicit consent.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>4. Security</h2>
          <p>We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access. However, no internet transmission is ever 100% secure.</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '20px' }}>5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information at any time through your account settings or by contacting our support team.</p>
        </section>
      </div>
    </div>
  )
}
