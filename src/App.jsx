import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

const translations = {
  en: {
    nav: 'Join waitlist',
    eyebrow: 'NOW ACCEPTING EARLY MEMBERS',
    headline: 'The freelance platform built for Armenia and the Caucasus',
    subheadline: 'Local language. Local payments. No Upwork. Join 600+ people on the waitlist.',
    joined: 'people already joined',
    employer: "I'm an Employer",
    talent: "I'm Talent",
    howItWorks: 'How Vorak works',
    step1: 'Post your job in Armenian or Russian',
    step2: 'Get matched with verified local talent',
    step3: 'Pay securely — money held until work is approved',
    formHeadline: 'Join the waitlist',
    formSubtext: 'Be among the first when we launch. Free forever for early members.',
    fullName: 'Full name',
    email: 'Email address',
    iam: 'I am an:',
    employerBtn: 'Employer',
    talentBtn: 'Talent',
    submit: 'Get early access →',
    joining: 'Joining...',
    success: "🎉 You're in, {name}!",
    successSub: "We'll email you the moment Vorak launches.",
    developedBy: 'Developed by Digital Vibe Software',
    founder: 'Founder: Andre Manookian',
    regions: 'Armenia · Georgia · Kazakhstan'
  },
  am: {
    nav: 'Միանալ սպասողների ցանկին',
    eyebrow: 'ԱՅԺՄ ԸՆԴՈՒՆՈՒՄ ԵՆՔ ՎԱՂ ԱՆԴԱՄՆԵՐԻՆ',
    headline: 'Ֆրիլանս հարթակ՝ կառուցված Հայաստանի և Կովկասի համար',
    subheadline: 'Տեղական լեզու: Տեղական վճարումներ: Ոչ Upwork-ին: Միացեք 600+ սպասողներին:',
    joined: 'մարդ արդեն միացել է',
    employer: 'Ես գործատու եմ',
    talent: 'Ես մասնագետ եմ',
    howItWorks: 'Ինչպես է աշխատում Vorak-ը',
    step1: 'Տեղադրեք ձեր աշխատանքը հայերեն կամ ռուսերեն',
    step2: 'Գտեք ստուգված տեղական մասնագետների',
    step3: 'Վճարեք ապահով — գումարը պահվում է մինչև աշխատանքի հաստատումը',
    formHeadline: 'Միանալ սպասողների ցանկին',
    formSubtext: 'Եղեք առաջիններից մեկը: Անվճար հավերժ վաղ անդամների համար:',
    fullName: 'Ամբողջական անուն',
    email: 'Էլեկտրոնային հասցե',
    iam: 'Ես՝',
    employerBtn: 'Գործատու',
    talentBtn: 'Մասնագետ',
    submit: 'Ստանալ վաղ հասանելիություն →',
    joining: 'Միանում է...',
    success: '🎉 Դուք ցանկում եք, {name}!',
    successSub: 'Մենք կուղարկենք ձեզ նամակ Vorak-ի թողարկման պահին:',
    developedBy: 'Մշակված է Digital Vibe Software-ի կողմից',
    founder: 'Հիմնադիր՝ Անդրէ Մանուկեան',
    regions: 'Հայաստան · Վրաստան · Ղազախստան'
  },
  ru: {
    nav: 'Вступить в лист ожидания',
    eyebrow: 'ПРИНИМАЕМ ПЕРВЫХ УЧАСТНИКОВ',
    headline: 'Фриланс-платформа, созданная для Армении и Кавказа',
    subheadline: 'Местный язык. Местные платежи. Нет Upwork. Присоединяйтесь к 600+ участникам.',
    joined: 'человек уже присоединились',
    employer: 'Я работодатель',
    talent: 'Я талант',
    howItWorks: 'Как работает Vorak',
    step1: 'Разместите заказ на армянском или русском языке',
    step2: 'Найдите проверенных местных специалистов',
    step3: 'Платите безопасно — деньги удерживаются до подтверждения работы',
    formHeadline: 'Присоединиться к списку',
    formSubtext: 'Будьте среди первых. Бесплатно навсегда для ранних участников.',
    fullName: 'Полное имя',
    email: 'Электронная почта',
    iam: 'Я:',
    employerBtn: 'Работодатель',
    talentBtn: 'Талант',
    submit: 'Получить ранний доступ →',
    joining: 'Присоединение...',
    success: '🎉 Вы в списке, {name}!',
    successSub: 'Мы отправим вам письмо в момент запуска Vorak.',
    developedBy: 'Разработано Digital Vibe Software',
    founder: 'Основатель: Андре Манукян',
    regions: 'Армения · Грузия · Казахстан'
  }
}

function App() {
  const [lang, setLang] = useState(localStorage.getItem('vorak-lang') || 'en')
  const [theme, setTheme] = useState(localStorage.getItem('vorak-theme') || 'dark')
  const [role, setRole] = useState('Talent')
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(580)

  const t = translations[lang]

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('vorak-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('vorak-lang', lang)
  }, [lang])

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= 673) {
          clearInterval(timer)
          return 673
        }
        return prev + 1
      })
    }, 50)
    return () => clearInterval(timer)
  }, [])

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name || !formData.email) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    try {
      const { error: supabaseError } = await supabase
        .from('waitlist')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            role: role,
            created_at: new Date().toISOString()
          }
        ])

      if (supabaseError) throw supabaseError

      // Send confirmation email via Resend
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'VORAK <onboarding@resend.dev>',
            to: [formData.email],
            subject: 'Welcome to VORAK Waitlist!',
            html: `
              <div style="font-family: sans-serif; color: #0A0A09; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0F6E56; border-radius: 12px;">
                <h1 style="color: #0F6E56;">You're in, ${formData.name}!</h1>
                <p style="font-size: 16px; line-height: 1.5;">Thank you for joining the VORAK waitlist. We're excited to have you as an early member of the freelance platform built for Armenia and the Caucasus.</p>
                <p style="font-size: 16px; line-height: 1.5;"><strong>What's next?</strong></p>
                <ul style="font-size: 16px; line-height: 1.5;">
                  <li>We'll notify you as soon as we launch.</li>
                  <li>As an early member, you'll get exclusive benefits.</li>
                  <li>Stay tuned for updates!</li>
                </ul>
                <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  Find. Hire. Build.<br>
                  © 2026 Vorak — vorakfreelancers.com
                </p>
              </div>
            `,
          }),
        })
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr)
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error joining waitlist:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div
          className="logo"
          style={{ cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          VORAK
        </div>
        <div className="nav-right">
          <select
            className="lang-selector"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="am">AM</option>
            <option value="ru">RU</option>
          </select>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className="nav-btn"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.nav}
          </button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="headline">{t.headline}</h1>
          <p className="subheadline">{t.subheadline}</p>

          <div className="counter-container">
            <span className="counter-number">{count}</span>
            <span className="counter-text">{t.joined}</span>
          </div>

          <div className="hero-btns">
            <button className="btn-outline" onClick={() => handleRoleSelect('Employer')}>
              {t.employer}
            </button>
            <button className="btn-filled" onClick={() => handleRoleSelect('Talent')}>
              {t.talent}
            </button>
          </div>
        </section>

        <section className="how-it-works">
          <h2 className="section-title">{t.howItWorks}</h2>
          <div className="cards-grid">
            <div className="card">
              <span className="card-num">01</span>
              <p className="card-text">{t.step1}</p>
            </div>
            <div className="card">
              <span className="card-num">02</span>
              <p className="card-text">{t.step2}</p>
            </div>
            <div className="card">
              <span className="card-num">03</span>
              <p className="card-text">{t.step3}</p>
            </div>
          </div>
        </section>

        <section id="waitlist-form" className="waitlist-section">
          <div className="form-container">
            {!success ? (
              <>
                <h2 className="form-headline">{t.formHeadline}</h2>
                <p className="form-subtext">{t.formSubtext}</p>

                <form className="form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder={t.fullName}
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder={t.email}
                      className="input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ color: 'var(--text-body)', fontSize: '14px', marginBottom: '8px' }}>{t.iam}</label>
                    <div className="role-toggle">
                      <button
                        type="button"
                        className={`role-btn ${role === 'Employer' ? 'active' : ''}`}
                        onClick={() => setRole('Employer')}
                      >
                        {t.employerBtn}
                      </button>
                      <button
                        type="button"
                        className={`role-btn ${role === 'Talent' ? 'active' : ''}`}
                        onClick={() => setRole('Talent')}
                      >
                        {t.talentBtn}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? t.joining : t.submit}
                  </button>

                  {error && <p className="error-message">{error}</p>}
                </form>
              </>
            ) : (
              <div className="success-message">
                <h3>{t.success.replace('{name}', formData.name)}</h3>
                <p>{t.successSub}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p style={{ color: 'var(--text-heading)', marginBottom: '1rem' }}>© 2026 Vorak — vorakfreelance.com</p>
          <div className="footer-links">
            <a href="https://www.instagram.com/vorakfreelancers/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://t.me/+uLcFQno7ITdmYjQy" target="_blank" rel="noopener noreferrer">Telegram</a>
          </div>
          <p className="footer-locations">{t.regions}</p>
          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--footer-text)' }}>
            <p>{t.developedBy}</p>
            <p style={{ marginTop: '0.5rem' }}>{t.founder}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
