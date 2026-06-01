import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import VerifiedBadge from '../components/VerifiedBadge'
import './Dashboard.css'

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  useEffect(() => {
    if (userProfile && !userProfile.id_verified) {
      setShowVerifyModal(true)
    }
  }, [userProfile])
  const [contracts, setContracts] = useState([])
  const [services, setServices] = useState([])
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState({
    activeContracts: 0,
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
  })
  const [pendingBalance, setPendingBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser && userProfile) {
      loadDashboard()
    }
  }, [currentUser, userProfile])

  async function loadDashboard() {
    setLoading(true)
    try {
      await Promise.all([
        loadContracts(),
        userProfile.role === 'talent'
          ? loadServices()
          : loadJobs(),
      ])
      loadStats()
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadContracts() {
    const field = userProfile.role === 'talent'
      ? 'talent_id' : 'employer_id'
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq(field, currentUser.id)
      .not('status', 'in',
        '(completed,cancelled,pending_payment)')
      .order('created_at', { ascending: false })
      .limit(5)
    setContracts(data || [])
  }

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('talent_id', currentUser.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
    setServices(data || [])
  }

  async function handleDeleteService(e, serviceId, serviceTitle) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Delete "${serviceTitle}"? This cannot be undone.`)) return
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'deleted' })
        .eq('id', serviceId)
        .eq('talent_id', currentUser.id)
      if (error) throw error
      setServices(prev => prev.filter(s => s.id !== serviceId))
    } catch (err) {
      console.error('Delete service error:', err)
      alert('Failed to delete service: ' + err.message)
    }
  }

  async function loadJobs() {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setJobs(data || [])
  }

  async function loadStats() {
    const field = userProfile.role === 'talent'
      ? 'talent_id' : 'employer_id'
    const { data } = await supabase
      .from('contracts')
      .select('status, amount, talent_payout')
      .eq(field, currentUser.id)

    const active = data?.filter(c =>
      ['active', 'work_submitted',
        'awaiting_confirmation'].includes(c.status)
    ).length || 0

    setStats({
      activeContracts: active,
      balance: userProfile.balance || 0,
      totalEarned: userProfile.total_earned || 0,
      totalSpent: userProfile.total_spent || 0,
    })

    if (userProfile.role === 'talent') {
      const { data: pendingData } = await supabase
        .from('contracts')
        .select('talent_payout')
        .eq('talent_id', currentUser.id)
        .eq('status', 'completed')
        .eq('payout_released', false)
      const pending = pendingData?.reduce(
        (sum, c) => sum + (Number(c.talent_payout) || 0), 0
      ) || 0
      setPendingBalance(pending)
    }
  }

  if (!userProfile) return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  )

  const isTalent = userProfile.role === 'talent'
  const balance = Number(userProfile?.balance || 0)
  const totalEarned = Number(userProfile?.total_earned || 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingTop: '80px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div className="dashboard-avatar-placeholder">
            {userProfile.full_name?.[0]}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {t('dashboard.welcome')}, {userProfile.full_name?.split(' ')[0]} 👋
              </h1>
              {userProfile?.id_verified && <VerifiedBadge size="md" />}
            </div>
            <span className="role-badge">{userProfile.role} {t('dashboard.account')}</span>
          </div>
          <div className="dashboard-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {isTalent ? (
              <Link to="/post-service" className="btn btn-primary">+ {t('dashboard.postService')}</Link>
            ) : (
              <Link to="/post-job" className="btn btn-primary">+ {t('dashboard.postJob')}</Link>
            )}
            <Link to="/settings" className="btn btn-ghost">⚙️ {t('dashboard.settings')}</Link>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{t('dashboard.activeContracts')}</div>
            <div style={{ fontSize: '30px', fontWeight: '800', color: '#0F6E56', lineHeight: '1' }}>{stats.activeContracts}</div>
          </div>
          {isTalent ? (
            <>
              <Link to="/withdrawal" style={{ background: 'var(--bg-card)', border: '1.5px solid rgba(15,110,86,0.3)', borderRadius: '12px', padding: '22px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{t('dashboard.availableBalance')}</div>
                <div style={{ fontSize: '30px', fontWeight: '800', color: '#0F6E56', lineHeight: '1' }}>${balance.toFixed(2)}</div>
              </Link>
              {pendingBalance > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1.5px solid rgba(245,158,11,0.35)', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{t('dashboard.pendingBalance')}</div>
                  <div style={{ fontSize: '30px', fontWeight: '800', color: '#f59e0b', lineHeight: '1' }}>${pendingBalance.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{t('dashboard.awaitingRelease')}</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{t('dashboard.totalSpent')}</div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: '#0F6E56', lineHeight: '1' }}>${Number(stats.totalSpent).toFixed(2)}</div>
            </div>
          )}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{isTalent ? t('dashboard.totalEarned') : t('dashboard.jobsPosted')}</div>
            <div style={{ fontSize: '30px', fontWeight: '800', color: '#0F6E56', lineHeight: '1' }}>{isTalent ? '$' + totalEarned.toFixed(2) : jobs.length}</div>
          </div>
          <Link to="/verify" style={{ background: 'var(--bg-card)', border: userProfile.id_verified ? '1px solid #0F6E56' : '1px solid var(--border)', borderRadius: '12px', padding: '22px', textDecoration: 'none' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{t('dashboard.identityStatus')}</div>
            <div style={{ fontSize: '30px', fontWeight: '800', color: userProfile.id_verified ? '#0F6E56' : 'var(--text-secondary)', lineHeight: '1', marginBottom: '4px' }}>{userProfile.id_verified ? '✓' : '→'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{userProfile.id_verified ? t('dashboard.verified') : t('dashboard.tapToVerify')}</div>
          </Link>
        </div>

        {/* Content grid */}
        <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: isTalent ? '1fr 1fr' : '1fr', gap: '32px' }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{t('dashboard.activeContracts')}</h2>
              <Link to="/messages" style={{ fontSize: '13px', fontWeight: '500', color: '#0F6E56', textDecoration: 'none' }}>{t('dashboard.viewAll')} →</Link>
            </div>
            {loading ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : contracts.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('dashboard.noActiveContracts')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{isTalent ? t('dashboard.postServiceToGetHired') : t('dashboard.postJobToFindTalent')}</p>
                <Link to={isTalent ? '/post-service' : '/post-job'} className="btn btn-primary btn-sm">{t('dashboard.getStarted')}</Link>
              </div>
            ) : (
              <div>
                {contracts.map(contract => (
                  <Link key={contract.id} to={`/contracts/${contract.id}`} style={{ display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', transition: 'all 0.2s', cursor: 'pointer', textDecoration: 'none' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{contract.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{new Date(contract.created_at).toLocaleDateString()}</span>
                      <span style={{ fontWeight: '700', color: '#0F6E56' }}>${Number(contract.amount).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {isTalent && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{t('dashboard.myServices')}</h2>
                <Link to="/post-service" style={{ fontSize: '13px', fontWeight: '500', color: '#0F6E56', textDecoration: 'none' }}>+ {t('dashboard.addNew')}</Link>
              </div>
              {services.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('dashboard.noServicesPosted')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{t('dashboard.startEarning')}</p>
                  <Link to="/post-service" className="btn btn-primary btn-sm">{t('dashboard.postService')}</Link>
                </div>
              ) : (
                <div>
                  {services.map(service => (
                    <div key={service.id} className="dashboard-service-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                      <Link to={`/services/${service.id}`} style={{ flex: 1, textDecoration: 'none', minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{service.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                          {service.orders_count || 0} {t('dashboard.orders')}
                          {service.status === 'paused' && <span style={{ marginLeft: '8px', color: '#f59e0b', fontWeight: '600' }}>· {t('dashboard.paused')}</span>}
                        </div>
                      </Link>
                      <span className="service-price" style={{ fontWeight: '700', color: '#0F6E56', flexShrink: 0 }}>${Number(service.price).toFixed(2)}</span>
                      <button
                        onClick={(e) => handleDeleteService(e, service.id, service.title)}
                        title={t('dashboard.deleteService')}
                        className="service-delete-btn"
                        style={{ flexShrink: 0, padding: '6px 10px', background: 'transparent', border: '1px solid rgba(226,75,74,0.35)', borderRadius: '7px', color: '#E24B4A', cursor: 'pointer', fontSize: '14px', lineHeight: 1, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,75,74,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {isTalent && balance > 0 && (
          <Link to="/withdrawal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(15,110,86,0.08)', border: '1.5px solid rgba(15,110,86,0.2)', borderRadius: '10px', textDecoration: 'none', marginTop: '24px', transition: 'all 0.2s' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#0F6E56', fontWeight: '600', marginBottom: '2px' }}>{t('dashboard.availableForWithdrawal')}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>${balance.toFixed(2)}</div>
            </div>
            <div style={{ padding: '10px 18px', background: '#0F6E56', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>{t('dashboard.withdraw')} →</div>
          </Link>
        )}
      </div>

      {/* Verification Modal for Unverified Users */}
      {showVerifyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              {t('dashboard.verifyYourProfile')}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              {t('dashboard.verifyDescription')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                to="/verify"
                onClick={() => setShowVerifyModal(false)}
                style={{
                  display: 'block',
                  padding: '14px 24px',
                  background: '#0F6E56',
                  color: 'white',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '15px'
                }}
              >
                {t('dashboard.verifyNow')} →
              </Link>
              <button
                onClick={() => setShowVerifyModal(false)}
                style={{
                  padding: '14px 24px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px'
                }}
              >
                {t('dashboard.later')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
