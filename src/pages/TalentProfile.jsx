import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  formatCurrency,
  formatDate,
  isUserOnline,
  getInitials,
  formatRelativeTime
} from '../lib/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import VerifiedBadge from '../components/VerifiedBadge'
import Lightbox from '../components/Lightbox'
import './TalentProfile.css'

export default function TalentProfile() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [talent, setTalent] = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFullBio, setShowFullBio] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  const isOwnProfile = currentUser?.id === id

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch talent user and profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, talent_profiles(*)')
        .eq('id', id)
        .single()

      if (userError) throw userError
      setTalent(userData)

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('talent_id', id)
        .eq('status', 'active')
      setServices(servicesData || [])

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:users!reviewer_id(full_name, avatar_url)')
        .eq('reviewed_id', id)
        .is('service_id', null)
        .order('created_at', { ascending: false })
      setReviews(reviewsData || [])
      if (currentUser) {
        setHasReviewed(reviewsData?.some(r => r.reviewer_id === currentUser.id) ?? false)
      }

    } catch (error) {
      console.error('Error fetching talent profile:', error)
      navigate('/404')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  async function submitReview() {
    if (reviewRating === 0) return
    setReviewSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        reviewed_id: id,
        reviewer_id: currentUser.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      })
      if (error) throw error
      setHasReviewed(true)
      setReviewRating(0)
      setReviewComment('')
      fetchData()
    } catch (err) {
      console.error('Review error:', err)
      alert(err.message)
    } finally {
      setReviewSubmitting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleContact = () => {
    // Navigate to messages with this talent
    navigate(`/messages?user=${id}`)
  }

  const handleHire = () => {
    navigate(`/post-job?talent=${id}`)
  }

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href)
    // Toast would be triggered here
    alert('Profile link copied!')
  }

  if (loading) return <LoadingSpinner fullPage />
  if (!talent) return null

  const profile = talent.talent_profiles?.[0] || {}
  const isOnline = isUserOnline(talent.last_seen)
  const initials = getInitials(talent.full_name)
  const rawPortfolio = profile.portfolio_items
  const portfolio = Array.isArray(rawPortfolio) ? rawPortfolio : (rawPortfolio ? Object.values(rawPortfolio) : [])

  return (
    <div className="talent-profile-page">
      <div className="profile-container">
        <div className="profile-left">
          <div className="profile-header-card">
            <div className="profile-banner" />
            <div className="profile-header-content">
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper">
                  {talent.avatar_url ? (
                    <img src={talent.avatar_url} alt={talent.full_name} className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar-placeholder">{initials}</div>
                  )}
                  {talent?.id_verified && <VerifiedBadge size="sm" />}
                </div>
                <div className="profile-basic-info">
                  <h1 className="profile-name" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {talent.full_name}
                    {talent?.id_verified && <VerifiedBadge size="md" />}
                  </h1>
                  <p className="profile-tagline">{profile.tagline || 'Professional Freelancer'}</p>
                  <div className="profile-meta">
                    {profile.location && (
                      <span className="profile-meta-item">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profile.location}
                      </span>
                    )}
                    <span className="profile-meta-item">Member since {formatDate(talent.created_at)}</span>
                    <span className={`profile-status ${isOnline ? 'online' : ''}`}>
                      <span className="status-dot" />
                      {isOnline ? 'Online' : `Last seen ${formatRelativeTime(talent.last_seen)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-stats-bar">
                <div className="stat-item">
                  <div className="stat-value">
                    <span className="star-icon">★</span>
                    {profile.rating_avg?.toFixed(1) || '0.0'}
                  </div>
                  <div className="stat-label">{profile.total_reviews || 0} reviews</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{profile.total_orders || 0}</div>
                  <div className="stat-label">Orders completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{profile.response_time || '1 hour'}</div>
                  <div className="stat-label">Response time</div>
                </div>
              </div>
            </div>
          </div>

          <section className="profile-section">
            <h2 className="section-title">About</h2>
            <div className={`profile-about ${showFullBio ? 'expanded' : ''}`}>
              <p>{profile.bio || 'No bio provided.'}</p>
            </div>
            {profile.bio?.length > 300 && (
              <button className="btn-link" onClick={() => setShowFullBio(!showFullBio)}>
                {showFullBio ? 'Show less' : 'Show more'}
              </button>
            )}
          </section>

          <section className="profile-section">
            <h2 className="section-title">Skills</h2>
            <div className="profile-skills">
              {profile.skills?.map((skill, index) => (
                <span key={index} className="skill-pill">{skill}</span>
              ))}
            </div>
          </section>

          <section className="profile-section">
            <h2 className="section-title">Languages</h2>
            <div className="profile-languages">
              {profile.languages?.map((lang, index) => (
                <span key={index} className="lang-pill">{lang}</span>
              ))}
            </div>
          </section>

          {services.length > 0 && (
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Services</h2>
                <Link to="/services" className="btn-link">View All Services</Link>
              </div>
              <div className="services-scroll">
                {services.map(service => (
                  <Link key={service.id} to={`/services/${service.id}`} className="service-mini-card">
                    <img src={service.thumbnail_url} alt={service.title} className="service-thumb" />
                    <div className="service-info">
                      <h4 className="service-title">{service.title}</h4>
                      <div className="service-price">From {formatCurrency(service.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(talent.contact_email || talent.contact_telegram) && !isOwnProfile && (
            <section className="profile-section">
              <h2 className="section-title">Contact</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {talent.contact_email && (
                  <a href={`mailto:${talent.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '18px' }}>✉️</span>
                    <span>{talent.contact_email}</span>
                  </a>
                )}
                {talent.contact_telegram && (
                  <a href={`https://t.me/${talent.contact_telegram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '18px' }}>✈️</span>
                    <span>{talent.contact_telegram}</span>
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Portfolio</h2>
              {isOwnProfile && <button className="btn-outline btn-sm" onClick={() => window.location.href = '/settings'}>Add Portfolio</button>}
            </div>
            {portfolio.length > 0 ? (
              <div className="portfolio-grid">
                {portfolio.map((url, index) => (
                  <div
                    key={index}
                    className="portfolio-item"
                    onClick={() => {
                      setLightboxIndex(index)
                      setLightboxOpen(true)
                    }}
                  >
                    <img src={url} alt="" className="portfolio-img" />
                    <div className="portfolio-overlay">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No portfolio items yet.</p>
            )}
          </section>

          <section className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Reviews</h2>
              {reviews.length > 0 && (
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  ★ {profile.rating_avg?.toFixed(1) || '0.0'} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        {review.reviewer?.avatar_url ? (
                          <img src={review.reviewer.avatar_url} alt="" className="reviewer-avatar" />
                        ) : (
                          <div className="reviewer-avatar" style={{ background: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                            {review.reviewer?.full_name?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <div className="reviewer-name">{review.reviewer?.full_name}</div>
                          <div className="review-date">{formatDate(review.created_at)}</div>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="review-content">{review.comment}</p>
                    {review.response && (
                      <div className="talent-response">
                        <strong>Response from talent:</strong>
                        <p>{review.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No reviews yet. Be the first to leave one!</p>
            )}

            {currentUser && !isOwnProfile && !hasReviewed && (
              <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Write a Review</h4>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      style={{ fontSize: '28px', cursor: 'pointer', color: star <= (reviewHover || reviewRating) ? '#f59e0b' : 'var(--text-tertiary)', transition: 'color 0.15s' }}
                    >★</span>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this freelancer..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <button
                  onClick={submitReview}
                  disabled={reviewRating === 0 || reviewSubmitting}
                  style={{ marginTop: '10px', padding: '10px 24px', background: reviewRating === 0 ? 'var(--bg-card)' : '#0F6E56', color: reviewRating === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: reviewRating === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
            {hasReviewed && !isOwnProfile && (
              <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>✓ You've already reviewed this freelancer.</p>
            )}
          </section>
        </div>

        <aside className="profile-right">
          <div className="sticky-card">
            <div className="price-card">
              <div className="price-value">
                {formatCurrency(profile.hourly_rate || 0)}
                <span className="price-unit">/ hour</span>
              </div>

              <div className="info-rows">
                <div className="info-row">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Response time: {profile.response_time || '1 hour'}</span>
                </div>
                <div className="info-row">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Member since {formatDate(talent.created_at)}</span>
                </div>
                <div className="info-row">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{talent.id_verified ? 'Identity Verified' : 'Identity Not Verified'}</span>
                </div>
                <div className="info-row">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>{profile.languages?.join(', ')}</span>
                </div>
              </div>

              {isOwnProfile ? (
                <div className="action-buttons">
                  <button onClick={() => navigate('/settings')} className="btn-primary full-width">
                    Edit Profile
                  </button>
                  <button className="btn-outline full-width">Add to Portfolio</button>
                </div>
              ) : (
                <div className="action-buttons">
                  <button onClick={handleContact} className="btn-primary full-width">
                    Contact
                  </button>
                  <button onClick={handleHire} className="btn-outline full-width">
                    Hire
                  </button>
                </div>
              )}

              <div className="utility-buttons">
                <button onClick={copyProfileLink} className="btn-text">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Profile
                </button>
                <button className="btn-text text-red">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 14c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={portfolio}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + portfolio.length) % portfolio.length)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % portfolio.length)}
        />
      )}
    </div>
  )
}
