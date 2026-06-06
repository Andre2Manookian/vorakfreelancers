import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/helpers'
import './Landing.css'

// Base offset for signup counter
const BASE_SIGNUP_COUNT = 100

export default function Landing() {
  const { t } = useLanguage()
  const [userCount, setUserCount] = useState(0)
  const [jobCount, setJobCount] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState({})
  const [activeTab, setActiveTab] = useState('employer')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      try {
        const [usersRes, jobsRes, profilesRes] = await Promise.all([
          supabase.from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'talent'),
          supabase.from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open'),
          supabase.from('talent_profiles').select('category'),
        ])

        if (!mounted) return

        setUserCount(usersRes.count || 0)
        setJobCount(jobsRes.count || 0)

        const counts = {}
        CATEGORIES.forEach((c) => { counts[c.slug] = 0 })
        profilesRes.data?.forEach((p) => {
          if (p.category) {
            const slug = p.category.toLowerCase().replace(/\s+/g, '-')
            counts[slug] = (counts[slug] || 0) + 1
          }
        })
        setCategoryCounts(counts)
      } catch (error) {
        console.error('Error fetching landing stats:', error)
      }
    }
    fetchStats()
    return () => { mounted = false }
  }, [])

  const employerSteps = [
    t('landing.employerStep1'),
    t('landing.employerStep2'),
    t('landing.employerStep3'),
    t('landing.employerStep4'),
  ]

  const talentSteps = [
    t('landing.talentStep1'),
    t('landing.talentStep2'),
    t('landing.talentStep3'),
    t('landing.talentStep4'),
  ]

  const whyCards = [
    { icon: '🌍', text: t('landing.whyLang') },
    { icon: '🔒', text: t('landing.whyEscrow') },
    { icon: '💰', text: t('landing.whyCommission') },
    { icon: '✅', text: t('landing.whyVerified') },
  ]

  const steps = activeTab === 'employer' ? employerSteps : talentSteps

  return (
    <div className={`landing ${loaded ? 'loaded' : ''}`}>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <p className="hero-eyebrow">{t('landing.eyebrow')}</p>
          <h1 className="hero-title">{t('landing.headline')}</h1>
          <p className="hero-subtitle">{t('landing.subheadline')}</p>

          <div className="hero-counter">
            <span className="hero-counter-num">{userCount + BASE_SIGNUP_COUNT}</span>
            <span className="hero-counter-label">{t('landing.professionalsJoined')}</span>
          </div>

          <div className="hero-actions">
            <Link to="/talent" className="btn-outline btn-lg">{t('landing.browseTalent')}</Link>
            <Link to="/post-job" className="btn-primary btn-lg">{t('landing.postJob')}</Link>
          </div>
        </div>
      </section>

      <section className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item">
            <span className="stat-value">{userCount + BASE_SIGNUP_COUNT}</span>
            <span className="stat-label">{t('landing.statsFreelancers')}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{jobCount}</span>
            <span className="stat-label">{t('landing.statsJobs')}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">8%</span>
            <span className="stat-label">{t('landing.statsCommission')}</span>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <h2 className="section-title">{t('landing.browseByCategory')}</h2>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/talent?category=${cat.slug}`}
              className="category-card"
            >
              <span className="category-emoji">{cat.emoji}</span>
              <span className="category-name">{cat.name}</span>
              <span className="category-count">{categoryCounts[cat.slug] || 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="how-section">
        <h2 className="section-title">{t('landing.howItWorks')}</h2>
        <div className="how-tabs">
          <button
            type="button"
            className={`how-tab ${activeTab === 'employer' ? 'active' : ''}`}
            onClick={() => setActiveTab('employer')}
          >
            {t('landing.forEmployers')}
          </button>
          <button
            type="button"
            className={`how-tab ${activeTab === 'talent' ? 'active' : ''}`}
            onClick={() => setActiveTab('talent')}
          >
            {t('landing.forTalent')}
          </button>
        </div>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={step} className="step-card">
              <span className="step-num">{i + 1}</span>
              <p className="step-text">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="why-section">
        <h2 className="section-title">{t('landing.whyVorak')}</h2>
        <div className="why-grid">
          {whyCards.map((card) => (
            <div key={card.text} className="why-card">
              <span className="why-icon">{card.icon}</span>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>{t('landing.ctaTitle')}</h2>
        <div className="cta-actions">
          <Link to="/signup" className="btn-white btn-lg">{t('landing.joinTalent')}</Link>
          <Link to="/talent" className="btn-outline-white btn-lg">{t('landing.hireTalent')}</Link>
        </div>
      </section>
    </div>
  )
}
