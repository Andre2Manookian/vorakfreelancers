import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import VerifiedBadge from '../components/VerifiedBadge'
import { useToast } from '../components/Toast'
import { uploadFile } from '../lib/cloudinary'
import { CATEGORIES, LANGUAGES_FILTER } from '../lib/helpers'
import { useLanguage } from '../contexts/LanguageContext'
import './Settings.css'

export default function Settings() {
  const { t } = useLanguage()
  const { currentUser, userProfile, isTalent, fetchProfile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser?.full_name || '')
  const [bio, setBio] = useState(userProfile?.bio || '')
  const [location, setLocation] = useState(userProfile?.location || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [category, setCategory] = useState(userProfile?.category || '')
  const [skills, setSkills] = useState(userProfile?.skills || [])
  const [skillInput, setSkillInput] = useState('')
  const [languages, setLanguages] = useState(userProfile?.languages || [])
  const [langInput, setLangInput] = useState('')
  const [hourlyRate, setHourlyRate] = useState(userProfile?.hourly_rate || '')
  const [tagline, setTagline] = useState(userProfile?.tagline || '')
  const [isAvailable, setIsAvailable] = useState(userProfile?.is_available ?? true)

  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState([])
  const [portfolioUploading, setPortfolioUploading] = useState(false)

  // Contact State
  const [contactEmail, setContactEmail] = useState('')
  const [contactTelegram, setContactTelegram] = useState('')
  const [showContactWarning, setShowContactWarning] = useState(false)

  // Payment Form State
  const [paypalEmail, setPaypalEmail] = useState(userProfile?.paypal_email || '')
  const [bankDetails, setBankDetails] = useState(userProfile?.bank_details || '')
  const [wiseEmail, setWiseEmail] = useState(userProfile?.wise_email || '')

  // Security Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Notifications State
  const [notifPrefs, setNotifPrefs] = useState(currentUser?.notification_settings || {
    email_messages: true,
    email_proposals: true,
    email_contracts: true,
    email_payments: true,
    email_reviews: true
  })

  // Verification State
  const [idDoc, setIdDoc] = useState(null)
  const [selfie, setSelfie] = useState(null)

  useEffect(() => {
    if (currentUser) {
      setNotifPrefs(currentUser.notification_settings || notifPrefs)
    }
    if (userProfile) {
      setFullName(userProfile.full_name || '')
      setPhone(userProfile.phone || '')
      setContactEmail(userProfile.contact_email || '')
      setContactTelegram(userProfile.contact_telegram || '')
      setBio(userProfile.bio || '')
      setLocation(userProfile.location || '')
      setCategory(userProfile.category || '')
      setSkills(userProfile.skills || [])
      setLanguages(userProfile.languages || [])
      setHourlyRate(userProfile.hourly_rate || '')
      setTagline(userProfile.tagline || '')
      setIsAvailable(userProfile.is_available ?? true)
      setPaypalEmail(userProfile.paypal_email || '')
      setBankDetails(userProfile.bank_details || '')
      setWiseEmail(userProfile.wise_email || '')
      const items = userProfile.portfolio_items
      setPortfolioItems(Array.isArray(items) ? items : (items ? Object.values(items) : []))
    }
  }, [currentUser, userProfile])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (contactEmail.trim() || contactTelegram.trim()) {
      setShowContactWarning(true)
    } else {
      await saveProfile()
    }
  }

  async function saveProfile() {
    setLoading(true)
    try {
      // Update users table (bio + location live here, not in talent_profiles)
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          bio,
          location,
          phone: phone,
          contact_email: contactEmail.trim(),
          contact_telegram: contactTelegram.trim(),
        })
        .eq('id', currentUser.id)

      if (userError) throw userError

      // Update talent_profiles table if talent 
      if (isTalent) {
        const profileData = {
          category,
          skills,
          languages,
          hourly_rate: parseFloat(hourlyRate) || 0,
          tagline,
          availability: isAvailable ? 'available' : 'busy',
        }

        const { data: existingProfile } = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle()

        let profileError
        if (existingProfile) {
          const { error } = await supabase
            .from('talent_profiles')
            .update(profileData)
            .eq('user_id', currentUser.id)
          profileError = error
        } else {
          const { error } = await supabase
            .from('talent_profiles')
            .insert({ user_id: currentUser.id, ...profileData })
          profileError = error
        }

        if (profileError) throw profileError
      }

      await fetchProfile(currentUser.id)
      showToast('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      showToast('Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePayment = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('talent_profiles')
        .update({
          paypal_email: paypalEmail,
          bank_details: bankDetails,
          wise_email: wiseEmail
        })
        .eq('user_id', currentUser.id)

      if (error) throw error
      showToast('Payment details saved')
    } catch (error) {
      showToast('Failed to save payment details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    // Account deletion logic
    alert('Account deletion requested.')
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_settings: notifPrefs })
        .eq('id', currentUser.id)
      if (error) throw error
      showToast('Notification preferences saved')
    } catch (error) {
      showToast('Failed to save preferences', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    try {
      const { url } = await uploadFile(file, 'avatars')
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: url })
        .eq('id', currentUser.id)
      if (error) throw error
      await fetchProfile(currentUser.id)
      showToast('Avatar updated')
    } catch (error) {
      showToast('Failed to update avatar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!idDoc || !selfie) return
    setLoading(true)
    try {
      const { url: idUrl } = await uploadFile(idDoc, 'verifications')
      const { url: selfieUrl } = await uploadFile(selfie, 'verifications')

      const { error } = await supabase
        .from('users')
        .update({
          id_document_url: idUrl,
          selfie_url: selfieUrl,
          verification_status: 'pending'
        })
        .eq('id', currentUser.id)

      if (error) throw error
      showToast('Verification request submitted')
    } catch (error) {
      showToast('Failed to submit verification', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function uploadPortfolioImage(file) {
    if (!file) return
    if (portfolioItems.length >= 10) {
      showToast('Maximum 10 portfolio items allowed', 'error')
      return
    }
    setPortfolioUploading(true)
    try {
      const { url } = await uploadFile(file, 'portfolio')
      const updated = [...portfolioItems, url]
      setPortfolioItems(updated)
      await supabase
        .from('talent_profiles')
        .update({ portfolio_items: updated })
        .eq('user_id', currentUser.id)
      showToast('Photo added to portfolio')
    } catch {
      showToast('Upload failed', 'error')
    } finally {
      setPortfolioUploading(false)
    }
  }

  async function removePortfolioItem(idx) {
    const updated = portfolioItems.filter((_, i) => i !== idx)
    setPortfolioItems(updated)
    await supabase
      .from('talent_profiles')
      .update({ portfolio_items: updated })
      .eq('user_id', currentUser.id)
    showToast('Photo removed')
  }

  async function saveContactInfo() {
    try {
      await supabase
        .from('users')
        .update({ contact_email: contactEmail.trim(), contact_telegram: contactTelegram.trim() })
        .eq('id', currentUser.id)
      await fetchProfile(currentUser.id)
      showToast('Contact info saved')
    } catch {
      showToast('Failed to save contact info', 'error')
    } finally {
      setShowContactWarning(false)
    }
  }

  const toggleLanguage = (lang) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const addCustomLang = (e) => {
    if (e.key === 'Enter' && langInput.trim()) {
      e.preventDefault()
      const val = langInput.trim()
      if (!languages.includes(val)) setLanguages(prev => [...prev, val])
      setLangInput('')
    }
  }

  const removeLang = (lang) => setLanguages(languages.filter(l => l !== lang))

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (skills.length >= 5) { setSkillInput(''); return }
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()])
      }
      setSkillInput('')
    }
  }

  const removeSkill = (s) => setSkills(skills.filter(skill => skill !== s))

  const NOTIF_META = {
    email_messages: { label: t('settings.emailMessages'), desc: t('settings.emailMessagesDesc'), icon: '💬' },
    email_proposals: { label: t('settings.emailProposals'), desc: t('settings.emailProposalsDesc'), icon: '📨' },
    email_contracts: { label: t('settings.emailContracts'), desc: t('settings.emailContractsDesc'), icon: '📋' },
    email_payments: { label: t('settings.emailPayments'), desc: t('settings.emailPaymentsDesc'), icon: '💳' },
    email_reviews: { label: t('settings.emailReviews'), desc: t('settings.emailReviewsDesc'), icon: '⭐' },
  }

  const NAV_ITEMS = [
    { id: 'profile', icon: '👤', label: t('settings.profileTab') },
    ...(isTalent ? [{ id: 'portfolio', icon: '🖼️', label: t('settings.portfolioTab') }] : []),
    ...(isTalent ? [{ id: 'payment', icon: '💳', label: t('settings.paymentTab') }] : []),
    { id: 'security', icon: '🔒', label: t('settings.securityTab') },
    { id: 'notifications', icon: '🔔', label: t('settings.notificationsTab') },
    { id: 'verification', icon: '✅', label: t('settings.verificationTab') },
  ]

  return (
    <div className="settings-page">

      {/* ── Hero ── */}
      <div className="settings-hero">
        <div className="settings-hero-inner">
          <div className="settings-hero-avatar">
            {currentUser?.avatar_url
              ? <img src={currentUser.avatar_url} alt="" />
              : (fullName?.[0] || '?')}
          </div>
          <div>
            <h1>{fullName || 'Your Account'}</h1>
            <p>{currentUser?.email}</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="settings-body">

        {/* Sidebar */}
        <aside className="settings-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="settings-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="settings-content">

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div>
              <div className="settings-section-header">
                <h2>{t('settings.profileSettings')}</h2>
                <p>{t('settings.profileDescription')}</p>
              </div>

              <div className="avatar-upload">
                <div className="avatar-preview">
                  {currentUser.avatar_url
                    ? <img src={currentUser.avatar_url} alt="" />
                    : <div className="avatar-placeholder">{fullName?.[0]}</div>}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{fullName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{currentUser?.email}</div>
                  <label className="btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    {t('settings.changePhoto')}
                    <input type="file" onChange={handleAvatarUpload} hidden accept="image/*" />
                  </label>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="form-group">
                  <label>{t('settings.fullName')}</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>{t('settings.bio')}</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} placeholder={t('settings.bioPlaceholder')} />
                  <div className="char-count">{bio.length}/500</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('settings.location')}</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('settings.locationPlaceholder')} />
                  </div>
                  <div className="form-group">
                    <label>{t('settings.phone')}</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('settings.phonePlaceholder')} />
                  </div>
                </div>

                <hr className="form-divider" />
                <div className="form-group">
                  <label>{t('settings.contactEmail')} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '400' }}>({t('settings.contactEmailVisible')})</span></label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder={t('settings.contactEmailPlaceholder')} />
                </div>
                <div className="form-group">
                  <label>{t('settings.telegram')} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '400' }}>({t('settings.telegramVisible')})</span></label>
                  <input type="text" value={contactTelegram} onChange={e => setContactTelegram(e.target.value)} placeholder={t('settings.telegramPlaceholder')} />
                </div>
                {isTalent && (
                  <>
                    <hr className="form-divider" />
                    <div className="form-group">
                      <label>{t('settings.tagline')}</label>
                      <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} maxLength={100} placeholder={t('settings.taglinePlaceholder')} />
                    </div>
                    <div className="form-group">
                      <label>{t('settings.category')}</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">{t('settings.selectCategory')}</option>
                        {CATEGORIES.map(cat => <option key={cat.slug} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('settings.skills')} <span style={{ fontWeight: '400', color: 'var(--text-tertiary)', fontSize: '12px' }}>({t('settings.skillsMax').replace('{count}', skills.length)})</span></label>
                      <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder={t('settings.skillsPlaceholder')} disabled={skills.length >= 5} />
                      <div className="skills-list">
                        {skills.map(s => (
                          <span key={s} className="skill-pill">
                            {s}<button type="button" onClick={() => removeSkill(s)}>&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{t('settings.languages')} <span style={{ fontWeight: '400', color: 'var(--text-tertiary)', fontSize: '12px' }}>— {t('settings.languagesHint')}</span></label>
                      <div className="checkbox-grid">
                        {LANGUAGES_FILTER.map(lang => (
                          <label key={lang} className="checkbox-label">
                            <input type="checkbox" checked={languages.includes(lang)} onChange={() => toggleLanguage(lang)} />
                            {lang}
                          </label>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={langInput}
                        onChange={e => setLangInput(e.target.value)}
                        onKeyDown={addCustomLang}
                        placeholder={t('settings.languagesPlaceholder')}
                        style={{ marginTop: '10px' }}
                      />
                      {languages.filter(l => !LANGUAGES_FILTER.includes(l)).length > 0 && (
                        <div className="skills-list" style={{ marginTop: '8px' }}>
                          {languages.filter(l => !LANGUAGES_FILTER.includes(l)).map(lang => (
                            <span key={lang} className="skill-pill">
                              {lang}<button type="button" onClick={() => removeLang(lang)}>&times;</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('settings.hourlyRate')}</label>
                        <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="0" />
                      </div>
                      <div className="form-group">
                        <label>{t('settings.availability')}</label>
                        <button type="button" className={`avail-btn ${isAvailable ? 'on' : ''}`} onClick={() => setIsAvailable(!isAvailable)}>
                          {isAvailable ? t('settings.available') : t('settings.busy')}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('settings.saving') : t('settings.saveButton')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── PORTFOLIO ── */}
          {activeTab === 'portfolio' && isTalent && (
            <div>
              <div className="settings-section-header">
                <h2>{t('settings.portfolioTab')}</h2>
                <p>{t('settings.portfolioDescription')}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {portfolioItems.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={url} alt={`portfolio ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => removePortfolioItem(idx)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(226,75,74,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '15px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >&times;</button>
                  </div>
                ))}
                {portfolioItems.length < 10 && (
                  <label
                    style={{ border: '2px dashed var(--border)', borderRadius: '12px', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '13px', gap: '6px' }}
                  >
                    {portfolioUploading ? '⏳' : '+'}
                    <span style={{ fontSize: '11px' }}>{portfolioUploading ? t('settings.saving') : t('settings.addPortfolio')}</span>
                    <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadPortfolioImage(f); e.target.value = '' }} />
                  </label>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{portfolioItems.length}/10 {t('settings.maxPortfolio')}</p>
            </div>
          )}

          {/* ── PAYMENT ── */}
          {activeTab === 'payment' && isTalent && (
            <div>
              <div className="settings-section-header">
                <h2>{t('settings.paymentSettings')}</h2>
                <p>{t('settings.paymentDescription')}</p>
              </div>
              <form onSubmit={handleSavePayment} className="settings-form">
                <div className="form-group">
                  <label>{t('settings.paypalEmail')}</label>
                  <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="your@paypal.com" />
                </div>
                <div className="form-group">
                  <label>{t('settings.wiseEmail')}</label>
                  <input type="email" value={wiseEmail} onChange={e => setWiseEmail(e.target.value)} placeholder="your@wise.com" />
                </div>
                <div className="form-group">
                  <label>{t('settings.bankDetails')}</label>
                  <textarea value={bankDetails} onChange={e => setBankDetails(e.target.value)} placeholder="Bank name, account number, SWIFT/BIC, account holder name..." />
                </div>
                <div>
                  <button type="submit" className="btn-primary" disabled={loading}>{t('settings.saveButton')}</button>
                </div>
              </form>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div>
              <div className="settings-section-header">
                <h2>{t('settings.securityTab')}</h2>
                <p>{t('settings.securityDescription')}</p>
              </div>
              <form onSubmit={handleChangePassword} className="settings-form">
                <p className="security-section-title">{t('settings.changePassword')}</p>
                <div className="form-group">
                  <label>{t('settings.newPassword')}</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} placeholder="Minimum 8 characters" />
                </div>
                <div className="form-group">
                  <label>{t('settings.confirmPassword')}</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} placeholder="Repeat your new password" />
                </div>
                <div>
                  <button type="submit" className="btn-primary" disabled={loading}>{t('settings.changePassword')}</button>
                </div>
              </form>

              <div className="danger-zone">
                <p className="danger-zone-title">⚠️ {t('settings.deleteAccount')}</p>
                <div className="danger-card">
                  <div>
                    <h4>{t('settings.deleteAccount')}</h4>
                    <p>{t('settings.deleteWarning')}</p>
                  </div>
                  <div className="delete-actions">
                    <input
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                      type="text"
                      placeholder={t('settings.deleteConfirm')}
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                    />
                    <button className="btn-red" disabled={deleteConfirm !== 'DELETE'} onClick={handleDeleteAccount}>{t('settings.deleteAccount')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div>
              <div className="settings-section-header">
                <h2>{t('settings.notificationsTab')}</h2>
                <p>{t('settings.notificationDescription')}</p>
              </div>
              <div className="notif-list">
                {Object.entries(notifPrefs).map(([key, val]) => {
                  const meta = NOTIF_META[key] || { label: key, desc: '', icon: '🔔' }
                  return (
                    <div key={key} className="notif-item">
                      <div className="notif-item-info">
                        <span className="notif-item-label">{meta.icon} {meta.label}</span>
                        <span className="notif-item-desc">{meta.desc}</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !val })}
                        />
                        <span className="toggle-track">
                          <span className="toggle-thumb" />
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
              <div className="notif-save-row">
                <button onClick={handleSaveNotifications} className="btn-primary" disabled={loading}>
                  {loading ? t('settings.saving') : t('settings.saveButton')}
                </button>
              </div>
            </div>
          )}

          {/* ── VERIFICATION ── */}
          {activeTab === 'verification' && (
            <div>
              <div className="settings-section-header">
                <h2>{t('settings.verificationSettings')}</h2>
                <p>{t('settings.verificationDescription')}</p>
              </div>

              {userProfile?.id_verified ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px',
                  background: 'rgba(15,110,86,0.08)',
                  border: '1.5px solid rgba(15,110,86,0.3)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#0F6E56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0,
                  }}>
                    ✓
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#0F6E56',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {t('settings.verificationApproved')}
                      <VerifiedBadge size="sm" />
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}>
                      {t('settings.verificationDescription')}
                    </div>
                  </div>
                </div>
              ) : userProfile?.verification_status === 'pending' ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px',
                  background: 'rgba(239,159,39,0.08)',
                  border: '1.5px solid rgba(239,159,39,0.3)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    flexShrink: 0,
                  }}>
                    ⏳
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--warning)',
                      marginBottom: '4px',
                    }}>
                      {t('settings.verificationPending')}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}>
                      We are reviewing your documents. Usually takes 24 hours.
                    </div>
                    <button
                      onClick={refreshProfile}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginTop: '12px',
                      }}
                    >
                      🔄 {t('settings.verificationPending')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: '1px solid var(--border)',
                }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    marginBottom: '16px',
                    lineHeight: '1.6',
                  }}>
                    {t('settings.verificationDescription')}
                  </p>
                  <div className="verification-form mt-8">
                    <div className="form-group">
                      <label>{t('settings.idDocument')}</label>
                      <input type="file" onChange={e => setIdDoc(e.target.files[0])} accept="image/*,application/pdf" />
                    </div>
                    <div className="form-group">
                      <label>{t('settings.selfie')}</label>
                      <input type="file" onChange={e => setSelfie(e.target.files[0])} accept="image/*" />
                    </div>
                    <button onClick={handleVerificationSubmit} className="btn-primary" disabled={loading || !idDoc || !selfie}>
                      {t('settings.submitVerification')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Contact Warning Modal ── */}
      {showContactWarning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '20px', padding: '36px', maxWidth: '520px', width: '100%' }}>
            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ textAlign: 'center', fontWeight: '800', fontSize: '18px', marginBottom: '20px', color: '#f59e0b' }}>Important Notice / Կարևոր Ծանուցում</h3>

            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '14px', lineHeight: '1.8' }}>
              <p style={{ marginBottom: '14px' }}>
                🇬🇧 <strong>Warning:</strong> If you make or receive payments outside the platform, your account will be <strong>permanently banned</strong>. If you need to arrange off-platform payment, you must notify support first: <a href="mailto:vorakfreelance@gmail.com" style={{ color: '#0F6E56' }}>vorakfreelance@gmail.com</a>
              </p>
              <p style={{ marginBottom: '14px' }}>
                🇦🇲 <strong>Զգուշացում:</strong> Եթե հարթակից դուրս վճարումներ կատարեք կամ ստանաք, Ձեր հաշիվը <strong>կարգելափակվի</strong>: Հարթակից դուրս վճարումների կարգավորման համար նախ պետք է ծանուցեք աջակցությանը՝ <a href="mailto:vorakfreelance@gmail.com" style={{ color: '#0F6E56' }}>vorakfreelance@gmail.com</a>
              </p>
              <p>
                🇷🇺 <strong>Предупреждение:</strong> Если вы проводите платежи за пределами платформы, ваш аккаунт будет <strong>заблокирован навсегда</strong>. Если вам необходимо договориться об оплате вне платформы, вы обязаны сначала уведомить поддержку: <a href="mailto:vorakfreelance@gmail.com" style={{ color: '#0F6E56' }}>vorakfreelance@gmail.com</a>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowContactWarning(false)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
              >Cancel</button>
              <button
                onClick={async () => { setShowContactWarning(false); await saveProfile() }}
                style={{ flex: 1, padding: '12px', background: '#0F6E56', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}
              >I Understand — Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
