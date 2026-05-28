import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../lib/cloudinary'
import { LANGUAGES_FILTER } from '../lib/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import './Onboarding.css'

const ONBOARDING_CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'Graphic Design',
  'Video Editing',
  'Digital Marketing',
  'Translation',
  'Accounting and Finance',
  'Content Writing',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { userProfile, updateProfile, refreshProfile } = useAuth()
  const fileRef = useRef(null)

  const isTalent = userProfile?.role === 'talent'
  const totalSteps = isTalent ? 4 : 3

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '')
  const [location, setLocation] = useState(userProfile?.location || '')
  const [phone, setPhone] = useState(userProfile?.phone || '')
  const [bio, setBio] = useState(userProfile?.bio || '')

  const [category, setCategory] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [languages, setLanguages] = useState([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [tagline, setTagline] = useState('')

  const displayStep = isTalent ? step : (step >= 3 ? 3 : step)
  const progress = (displayStep / totalSteps) * 100

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const { url } = await uploadFile(file, 'avatars')
      setAvatarUrl(url)
      await updateProfile({ avatar_url: url })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const saveTalentProfile = async () => {
    const payload = {
      user_id: userProfile.id,
      category,
      skills,
      languages,
      hourly_rate: parseFloat(hourlyRate) || null,
      tagline: tagline.slice(0, 100),
    }
    const { data: existing } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('user_id', userProfile.id)
      .maybeSingle()

    const { error: tpError } = existing
      ? await supabase.from('talent_profiles').update(payload).eq('user_id', userProfile.id)
      : await supabase.from('talent_profiles').insert(payload)

    if (tpError) throw tpError
  }

  const goNext = async () => {
    setError('')
    setLoading(true)
    try {
      if (step === 1) {
        setStep(2)
      } else if (step === 2) {
        await updateProfile({
          location: location.trim(),
          phone: phone.trim(),
          bio: bio.slice(0, 300),
        })
        if (isTalent) setStep(3)
        else setStep(4)
      } else if (step === 3 && isTalent) {
        if (!category) throw new Error('Please select a category')
        if (skills.length < 1) throw new Error('Add at least one skill')
        await saveTalentProfile()
        setStep(4)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (step === 4 && !isTalent) setStep(2)
    else if (step > 1) setStep(step - 1)
  }

  const skip = () => {
    if (step === 1) setStep(2)
    else if (step === 2) setStep(isTalent ? 3 : 4)
    else if (step === 3) setStep(4)
  }

  if (!userProfile) {
    return (
      <div className="onboarding-page">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-progress">
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="onboarding-progress-text">
          Step {displayStep} of {totalSteps}
        </p>
      </div>

      {error && <p className="onboarding-error">{error}</p>}

      {step === 1 && (
        <div>
          <h2 className="onboarding-step-title">Add your profile photo</h2>
          <p className="onboarding-step-desc">A professional photo helps you stand out</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarUpload}
          />
          <div
            className="avatar-upload"
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" />
            ) : (
              <span className="avatar-upload-placeholder">
                Click to upload<br />JPG or PNG
              </span>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="onboarding-step-title">Tell us about yourself</h2>
          <p className="onboarding-step-desc">Help clients and talent find you</p>
          <div className="auth-form" style={{ gap: 16 }}>
            <div className="auth-field">
              <label className="auth-label">Location (city)</label>
              <input
                className="input"
                placeholder="e.g. Yerevan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Phone number</label>
              <input
                className="input"
                placeholder="+374 XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Bio</label>
              <textarea
                className="input"
                rows={4}
                placeholder="A short introduction..."
                value={bio}
                maxLength={300}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="char-count">{bio.length}/300</p>
            </div>
          </div>
        </div>
      )}

      {step === 3 && isTalent && (
        <div>
          <h2 className="onboarding-step-title">Set up your freelance profile</h2>
          <p className="onboarding-step-desc">Showcase your expertise</p>
          <div className="auth-form" style={{ gap: 16 }}>
            <div className="auth-field">
              <label className="auth-label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category</option>
                {ONBOARDING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label className="auth-label">Skills (press Enter to add)</label>
              <div className="skills-input-row">
                <input
                  className="input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="e.g. React, Figma..."
                />
                <button type="button" className="btn-outline" onClick={addSkill}>Add</button>
              </div>
              <div className="skills-pills">
                {skills.map((s) => (
                  <span key={s} className="skill-pill">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Languages</label>
              <div className="lang-checkboxes">
                {LANGUAGES_FILTER.map((lang) => (
                  <label key={lang}>
                    <input
                      type="checkbox"
                      checked={languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                    />
                    {lang}
                  </label>
                ))}
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Hourly rate</label>
              <div className="rate-input-wrap">
                <span className="rate-prefix">$</span>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="1"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="25"
                />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Tagline</label>
              <input
                className="input"
                maxLength={100}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="What makes you unique?"
              />
              <p className="char-count">{tagline.length}/100</p>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="onboarding-complete">
          <div className="complete-icon">✓</div>
          <h2 className="onboarding-step-title">You are all set!</h2>
          <p className="onboarding-step-desc">Welcome to Vorak Freelance</p>
          <div className="complete-actions">
            {userProfile.role === 'employer' ? (
              <Link to="/post-job" className="btn-primary btn-lg">Post your first job</Link>
            ) : (
              <Link to="/post-service" className="btn-primary btn-lg">Create your first service</Link>
            )}
            <Link to="/" className="btn-outline btn-lg">Explore the platform</Link>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="onboarding-actions">
          {step > 1 && (
            <button type="button" className="btn-ghost" onClick={goBack} disabled={loading}>
              Back
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={skip} disabled={loading}>
            Skip
          </button>
          <button type="button" className="btn-primary" onClick={goNext} disabled={loading}>
            {loading ? <LoadingSpinner size="small" /> : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
