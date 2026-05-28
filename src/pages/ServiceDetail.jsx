import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link }
  from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import VerifiedBadge from
  '../components/VerifiedBadge'

export default function ServiceDetail() {
  const { id } = useParams()
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [talent, setTalent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [requirements, setRequirements] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    fetchService()
  }, [id])

  async function fetchService() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setService(data)

      const { data: talentData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.talent_id)
        .single()
      setTalent(talentData)

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:users!reviewer_id(full_name, avatar_url)')
        .eq('service_id', id)
        .order('created_at', { ascending: false })
      setReviews(reviewsData || [])
      if (currentUser) {
        setHasReviewed(reviewsData?.some(r => r.reviewer_id === currentUser.id) ?? false)
      }
    } catch (err) {
      console.error('Service fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function submitReview() {
    if (!currentUser) { navigate('/login'); return }
    if (reviewRating === 0) return
    setReviewSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        service_id: service.id,
        reviewer_id: currentUser.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      })
      if (error) throw error
      setHasReviewed(true)
      setReviewRating(0)
      setReviewComment('')
      fetchService()
    } catch (err) {
      console.error('Review error:', err)
      alert(err.message)
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleOrder() {
    if (!currentUser) {
      navigate('/login')
      return
    }
    if (userProfile?.role === 'talent' &&
      currentUser.id === service.talent_id) {
      alert('You cannot order your own service')
      return
    }
    setShowModal(true)
  }

  async function confirmOrder() {
    setOrdering(true)
    try {
      const deadline = new Date()
      deadline.setDate(
        deadline.getDate() + service.delivery_days
      )

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          type: 'service',
          service_id: service.id,
          employer_id: currentUser.id,
          talent_id: service.talent_id,
          title: service.title,
          description: requirements,
          amount: service.price,
          commission_amount: service.price * 0.08,
          talent_payout: service.price * 0.92,
          status: 'pending_payment',
          deadline: deadline.toISOString()
            .split('T')[0],
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) throw error

      await supabase
        .from('services')
        .update({
          orders_count: (service.orders_count || 0) + 1
        })
        .eq('id', service.id)

      navigate('/contracts/' + data.id)
    } catch (err) {
      console.error('Order error:', err)
      alert('Failed to create order: ' + err.message)
    } finally {
      setOrdering(false)
      setShowModal(false)
    }
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '80px',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid var(--border)',
        borderTop: '3px solid #0F6E56',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  if (!service) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '80px',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>😕</div>
      <h2 style={{ color: 'var(--text-primary)' }}>
        Service not found
      </h2>
      <Link to="/services" style={{
        color: '#0F6E56'
      }}>
        Browse services
      </Link>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingTop: '80px',
      paddingBottom: '60px',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '32px',
        alignItems: 'start',
      }}>

        <div>
          {service.thumbnail_url && (
            <img
              src={service.thumbnail_url}
              alt={service.title}
              style={{
                width: '100%',
                borderRadius: '12px',
                marginBottom: '28px',
                maxHeight: '400px',
                objectFit: 'cover',
              }}
            />
          )}

          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(15,110,86,0.1)',
            color: '#0F6E56',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '12px',
          }}>
            {service.category}
          </div>

          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '20px',
            lineHeight: '1.3',
          }}>
            {service.title}
          </h1>

          {talent && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px',
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}>
              <Link to={'/talent/' + talent.id}>
                {talent.avatar_url ? (
                  <img
                    src={talent.avatar_url}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                    alt={talent.full_name}
                  />
                ) : (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#0F6E56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '18px',
                  }}>
                    {talent.full_name?.[0] || 'T'}
                  </div>
                )}
              </Link>
              <div>
                <Link
                  to={'/talent/' + talent.id}
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  {talent.full_name}
                </Link>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {talent.id_verified && (
                    <VerifiedBadge size="sm" />
                  )}
                  <span style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}>
                    {service.orders_count || 0} orders
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}>
              About This Service
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
            }}>
              {service.description}
            </p>
          </div>

          {service.requirements && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '12px',
              }}>
                What I Need From You
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
              }}>
                {service.requirements}
              </p>
            </div>
          )}

          {/* ── Reviews Section ── */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Reviews
              </h2>
              {reviews.length > 0 && (
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  ★ {service.rating_avg?.toFixed(1) || '0.0'} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {review.reviewer?.avatar_url ? (
                          <img src={review.reviewer.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                            {review.reviewer?.full_name?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{review.reviewer?.full_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <span key={i} style={{ fontSize: '16px', color: i <= review.rating ? '#f59e0b' : 'var(--text-tertiary)' }}>★</span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{review.comment}</p>
                    )}
                    {review.response && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #0F6E56' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F6E56', marginBottom: '4px' }}>Response from seller</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{review.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>No reviews yet. Be the first to leave one!</p>
            )}

            {currentUser && currentUser.id !== service.talent_id && !hasReviewed && (
              <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px' }}>Leave a Review</h3>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      style={{ fontSize: '32px', cursor: 'pointer', color: star <= (reviewHover || reviewRating) ? '#f59e0b' : 'var(--text-tertiary)', transition: 'color 0.15s', userSelect: 'none' }}
                    >★</span>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this service..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '12px' }}
                />
                <button
                  onClick={submitReview}
                  disabled={reviewRating === 0 || reviewSubmitting}
                  style={{ padding: '10px 28px', background: reviewRating === 0 ? 'var(--bg-secondary)' : '#0F6E56', color: reviewRating === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: reviewRating === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
            {hasReviewed && currentUser?.id !== service.talent_id && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>✓ You've already reviewed this service.</p>
            )}
            {!currentUser && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Link to="/login" style={{ color: '#0F6E56' }}>Log in</Link> to leave a review.
              </p>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: '88px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#0F6E56',
              marginBottom: '20px',
            }}>
              ${service.price}
            </div>

            <div style={{ marginBottom: '20px' }}>
              {[
                {
                  icon: '⏱️',
                  label: 'Delivery',
                  value: service.delivery_days + ' days'
                },
                {
                  icon: '🔄',
                  label: 'Revisions',
                  value: service.revisions || '1'
                },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                  }}>
                    {item.icon} {item.label}
                  </span>
                  <span style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleOrder}
              style={{
                width: '100%',
                padding: '14px',
                background: '#0F6E56',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px',
                transition: 'all 0.2s',
              }}
            >
              Order Now →
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              fontSize: '12px',
            }}>
              🔒 Payment held until work approved
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              Confirm Your Order
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              {service.title}
            </p>

            {service.requirements && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}>
                  Requirements for the talent:
                </label>
                <textarea
                  value={requirements}
                  onChange={e =>
                    setRequirements(e.target.value)}
                  placeholder={service.requirements}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{
              background: 'rgba(15,110,86,0.08)',
              border: '1px solid rgba(15,110,86,0.2)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                }}>
                  Service price
                </span>
                <span style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}>
                  ${service.price}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                }}>
                  Delivery time
                </span>
                <span style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}>
                  {service.delivery_days} days
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                disabled={ordering}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: ordering
                    ? '#555' : '#0F6E56',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: ordering
                    ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                }}
              >
                {ordering
                  ? 'Creating order...'
                  : 'Confirm & Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
