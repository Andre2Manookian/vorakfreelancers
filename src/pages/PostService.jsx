import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'Graphic Design',
  'Video Editing',
  'Digital Marketing',
  'Translation',
  'Accounting & Finance',
  'Content Writing',
]

export default function PostService() {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('')
  const [revisions, setRevisions] = useState('1')
  const [requirements, setRequirements] = useState('')
  const [galleryUrls, setGalleryUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pageReady, setPageReady] = useState(false)

  useEffect(() => {
    if (userProfile !== null && userProfile !== undefined) {
      setPageReady(true)
    }
  }, [userProfile])

  async function uploadGalleryImage(file) {
    if (!file) return
    if (galleryUrls.length >= 5) {
      setError('Maximum 5 photos allowed')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'vorak_uploads')
      formData.append('folder', 'services')
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/ditl3dye5/upload',
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (data.secure_url) {
        setGalleryUrls(prev => [...prev, data.secure_url])
      } else {
        setError('Image upload failed')
      }
    } catch (err) {
      setError('Image upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function removeGalleryImage(idx) {
    setGalleryUrls(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    if (!category) {
      setError('Please select a category')
      return
    }

    if (!description.trim() || description.length < 30) {
      setError('Description must be at least 30 characters')
      return
    }

    if (!price || parseFloat(price) < 5) {
      setError('Minimum price is $5')
      return
    }

    if (!deliveryDays || parseInt(deliveryDays) < 1) {
      setError('Please enter delivery days')
      return
    }

    if (!currentUser) {
      setError('You must be logged in')
      return
    }

    setLoading(true)

    try {
      const { count } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('talent_id', currentUser.id)
        .eq('status', 'active')

      if (count >= 3) {
        setError('You have reached the maximum of 3 active services. Pause or delete an existing service first.')
        setLoading(false)
        return
      }

      const insertData = {
        talent_id: currentUser.id,
        title: title.trim(),
        category,
        description: description.trim(),
        price: parseFloat(price),
        delivery_days: parseInt(deliveryDays),
        revisions: revisions.toString(),
        status: 'active',
        orders_count: 0,
        rating_avg: 0,
        created_at: new Date().toISOString(),
      }

      if (requirements.trim()) {
        insertData.requirements = requirements.trim()
      }

      if (galleryUrls.length > 0) {
        insertData.thumbnail_url = galleryUrls[0]
        insertData.gallery_urls = galleryUrls
      }

      const { data, error: insertError } = await supabase
        .from('services')
        .insert(insertData)
        .select('id')
        .single()

      if (insertError) throw insertError

      if (data?.id) {
        navigate('/services/' + data.id)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(
        'Failed to post service: ' +
        (err.message || 'Unknown error')
      )
    } finally {
      setLoading(false)
    }
  }

  if (!pageReady) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border)',
          borderTop: '3px solid #0F6E56',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (userProfile?.role === 'employer') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
      }}>
        <div style={{ fontSize: '48px' }}>🚫</div>

        <h2>Employers cannot post services</h2>

        <Link to="/post-job">
          Post a Job Instead
        </Link>
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-input)',
    border: '1.5px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
  }

  const sectionStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '20px',
  }

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingTop: '80px',
      paddingBottom: '80px',
    }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '0 24px',
      }}>

        <div style={{ marginBottom: '32px' }}>
          <Link to="/dashboard">
            ← Back to Dashboard
          </Link>

          <h1>Create a New Service</h1>
          <p>Showcase your skills and start receiving orders</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)',
            padding: '14px',
            marginBottom: '24px',
            color: 'var(--error)',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              📋 Basic Information
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Service Title *</label>

              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
                style={inputStyle}
              />

              <div>{title.length}/80</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Category *</label>

              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a category...</option>

                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Description *</label>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />

              <div>
                {description.length} characters
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              💰 Pricing & Delivery
            </h3>

            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Price"
              style={inputStyle}
            />

            <input
              type="number"
              value={deliveryDays}
              onChange={e => setDeliveryDays(e.target.value)}
              placeholder="Delivery days"
              style={{
                ...inputStyle,
                marginTop: '16px',
              }}
            />

            <select
              value={revisions}
              onChange={e => setRevisions(e.target.value)}
              style={{
                ...inputStyle,
                marginTop: '16px',
              }}
            >
              <option value="1">1 revision</option>
              <option value="2">2 revisions</option>
              <option value="3">3 revisions</option>
              <option value="5">5 revisions</option>
              <option value="10">10 revisions</option>
              <option value="Unlimited">Unlimited</option>
            </select>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              🖼️ Service Photos
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>({galleryUrls.length}/5)</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Upload up to 5 photos. The first photo will be the thumbnail.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {galleryUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                  <img src={url} alt={`photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {idx === 0 && (
                    <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#0F6E56', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px' }}>MAIN</div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', lineHeight: '1' }}
                  >&times;</button>
                </div>
              ))}
              {galleryUrls.length < 5 && (
                <div
                  onClick={() => !uploading && document.getElementById('gallery-input').click()}
                  style={{ border: '2px dashed var(--border)', borderRadius: '10px', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '13px', gap: '6px' }}
                >
                  {uploading ? '⏳' : '+'}
                  <span style={{ fontSize: '11px' }}>{uploading ? 'Uploading...' : 'Add Photo'}</span>
                </div>
              )}
            </div>

            <input
              id="gallery-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadGalleryImage(file)
                e.target.value = ''
              }}
            />
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              📝 Buyer Requirements
            </h3>

            <textarea
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            style={{
              width: '100%',
              padding: '16px',
              background: '#0F6E56',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {loading
              ? 'Publishing Service...'
              : uploading
                ? 'Uploading image...'
                : '🚀 Publish Service'}
          </button>

        </form>
      </div>
    </div>
  )
}
