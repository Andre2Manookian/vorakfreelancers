import { useState } from 'react'

export default function FAQ() {
  const [activeTab, setActiveTab] = useState('general')

  const faqs = {
    general: [
      { q: "What is VORAK?", a: "VORAK is a freelance marketplace specifically designed for Armenian professionals and global employers." },
      { q: "How do I get started?", a: "Simply sign up as a Talent or Employer, complete your profile, and you're ready to start browsing or posting." },
      { q: "Is VORAK free?", a: "Signing up and browsing is free. We charge a small platform fee on successful contracts." }
    ],
    talent: [
      { q: "How do I get paid?", a: "Payments are held in escrow and released to your VORAK wallet once the employer approves your work. You can then withdraw to your bank account or PayPal." },
      { q: "What is the platform fee?", a: "We charge a 10% fee on all completed contracts to cover platform maintenance and secure payment processing." },
      { q: "How do I get verified?", a: "Go to your settings and upload a clear photo of your ID and a selfie. Our team will review it within 24-48 hours." }
    ],
    employer: [
      { q: "How do I hire someone?", a: "You can post a job and wait for proposals, or browse talent and services and hire them directly." },
      { q: "What if I'm not happy with the work?", a: "We have a dispute resolution system. If work is not delivered as agreed, you can open a dispute and our admins will review the case." },
      { q: "Are there any hiring fees?", a: "Employers don't pay any fees to post jobs. You only pay the agreed contract amount." }
    ]
  }

  return (
    <div className="faq-page" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>Frequently Asked Questions</h1>
        <p style={{ color: '#71717a' }}>Everything you need to know about the VORAK platform.</p>
      </header>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
        {['general', 'talent', 'employer'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px',
              borderRadius: '30px',
              border: '1px solid var(--border)',
              background: activeTab === tab ? '#0F6E56' : 'var(--bg-card)',
              color: activeTab === tab ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: '600'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {faqs[activeTab].map((faq, i) => (
          <div key={i} style={{
            background: 'var(--bg-primary)',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>{faq.q}</h3>
            <p style={{ color: '#71717a', lineHeight: '1.6' }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
