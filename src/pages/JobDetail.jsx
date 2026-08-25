import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatDate, formatRelativeTime, getInitials } from '../lib/helpers'
import { trackEvent } from '../lib/codewords'
import LoadingSpinner from '../components/LoadingSpinner'
import './JobDetail.css'

export default function JobDetail() {
  const { id } = useParams()
  const { currentUser, isTalent, isEmployer } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [proposals, setProposals] = useState([])
  const [myProposal, setMyProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // 'details' or 'proposals'

  // Proposal form state
  const [coverLetter, setCoverLetter] = useState('')
  const [proposalPrice, setProposalPrice] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('')

  const isJobOwner = currentUser?.id === job?.employer_id

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*, employer:users(*)')
        .eq('id', id)
        .single()

      if (jobError) throw jobError
      setJob(jobData)

      // Increment views (simplified, ideally needs a separate table or edge function)
      await supabase.from('jobs').update({ views_count: (jobData.views_count || 0) + 1 }).eq('id', id)

      // If talent, fetch their proposal
      if (isTalent) {
        const { data: myProp } = await supabase
          .from('proposals')
          .select('*')
          .eq('job_id', id)
          .eq('talent_id', currentUser.id)
          .maybeSingle()
        setMyProposal(myProp)
      }

      // If employer/owner, fetch all proposals
      if (currentUser?.id === jobData.employer_id) {
        const { data: props } = await supabase
          .from('proposals')
          .select('*, talent:users(*)')
          .eq('job_id', id)
          .order('created_at', { ascending: false })
        setProposals(props || [])
      }

    } catch (error) {
      console.error('Error fetching job detail:', error)
      navigate('/404')
    } finally {
      setLoading(false)
    }
  }, [id, currentUser, isTalent, navigate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmitProposal = async (e) => {
    e.preventDefault()
    if (!coverLetter || !proposalPrice || !deliveryDays) return
    if (coverLetter.length < 100) {
      alert('Cover letter must be at least 100 characters.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.from('proposals').insert({
        job_id: id,
        talent_id: currentUser.id,
        cover_letter: coverLetter,
        price: parseFloat(proposalPrice),
        delivery_days: parseInt(deliveryDays),
        status: 'pending'
      }).select().single()

      if (error) throw error

      // Update job proposal count
      await supabase.rpc('increment_proposals_count', { job_id: id })

      trackEvent('proposal_submitted', { delivery_days: parseInt(deliveryDays) })

      setMyProposal(data)
      alert('Proposal submitted successfully!')
    } catch (error) {
      console.error('Error submitting proposal:', error)
      alert('Failed to submit proposal.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdrawProposal = async () => {
    if (!window.confirm('Are you sure you want to withdraw your proposal?')) return

    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', myProposal.id)

      if (error) throw error

      // Update job proposal count
      await supabase.rpc('decrement_proposals_count', { job_id: id })

      setMyProposal(null)
      alert('Proposal withdrawn.')
    } catch (error) {
      console.error('Error withdrawing proposal:', error)
    }
  }

  const handleAcceptProposal = async (proposal) => {
    if (!window.confirm('Accepting this proposal will create a contract and close the job. Continue?')) return

    try {
      setSubmitting(true)

      // 1. Create contract
      const commission = proposal.price * 0.08
      const payout = proposal.price * 0.92

      const { data: contract, error: contractError } = await supabase.from('contracts').insert({
        type: 'job',
        job_id: id,
        proposal_id: proposal.id,
        employer_id: currentUser.id,
        talent_id: proposal.talent_id,
        title: job.title,
        amount: proposal.price,
        commission_amount: commission,
        talent_payout: payout,
        status: 'pending_payment'
      }).select().single()

      if (contractError) throw contractError

      // 2. Update job status
      await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', id)

      // 3. Update proposal status
      await supabase.from('proposals').update({ status: 'accepted' }).eq('id', proposal.id)

      // 4. Reject other proposals
      await supabase.from('proposals').update({ status: 'rejected' }).eq('job_id', id).neq('id', proposal.id)

      // 5. Create notifications (simplified)

      navigate(`/contracts/${contract.id}`)
    } catch (error) {
      console.error('Error accepting proposal:', error)
      alert('Failed to accept proposal.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />
  if (!job) return null

  return (
    <div className="job-detail-page">
      <div className="job-container">
        <div className="job-left">
          <div className="job-header-section">
            <div className="job-title-row">
              <h1 className="job-title">{job.title}</h1>
              <div className={`status-badge ${job.status}`}>{job.status}</div>
            </div>
            <div className="job-meta-row">
              <span>Posted {formatRelativeTime(job.created_at)}</span>
              <span className="dot">•</span>
              <span>{job.views_count || 0} views</span>
            </div>
          </div>

          <div className="job-tabs">
            <button
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            {isJobOwner && (
              <button
                className={`tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => setActiveTab('proposals')}
              >
                Proposals ({proposals.length})
              </button>
            )}
          </div>

          {activeTab === 'details' ? (
            <div className="job-details-content">
              <section className="detail-section">
                <h3 className="section-title">Description</h3>
                <div className="rich-text">{job.description}</div>
              </section>

              <section className="detail-section">
                <h3 className="section-title">Required Skills</h3>
                <div className="skills-tags">
                  {job.skills?.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </section>

              {isTalent && !isJobOwner && (
                <section className="proposal-section">
                  {myProposal ? (
                    <div className="my-proposal-card">
                      <div className="card-header">
                        <h3>Your Proposal</h3>
                        <div className={`status-badge ${myProposal.status}`}>{myProposal.status}</div>
                      </div>
                      <div className="proposal-info-grid">
                        <div className="info-item">
                          <span className="label">Proposed Price</span>
                          <span className="value">{formatCurrency(myProposal.price)}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Delivery Time</span>
                          <span className="value">{myProposal.delivery_days} days</span>
                        </div>
                      </div>
                      <div className="cover-letter-preview">
                        <p>{myProposal.cover_letter}</p>
                      </div>
                      <button
                        onClick={handleWithdrawProposal}
                        className="btn-text text-red"
                      >
                        Withdraw Proposal
                      </button>
                    </div>
                  ) : job.status === 'open' ? (
                    <form onSubmit={handleSubmitProposal} className="proposal-form">
                      <h3>Submit a Proposal</h3>
                      <div className="form-group">
                        <label>Cover Letter (min 100 characters)</label>
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Explain why you are the best fit for this job..."
                          required
                        />
                        <div className="char-count">{coverLetter.length} characters</div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Your Price ($)</label>
                          <input
                            type="number"
                            value={proposalPrice}
                            onChange={(e) => setProposalPrice(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Delivery Time (days)</label>
                          <input
                            type="number"
                            value={deliveryDays}
                            onChange={(e) => setDeliveryDays(e.target.value)}
                            placeholder="E.g. 7"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Proposal'}
                      </button>
                    </form>
                  ) : (
                    <div className="info-box">
                      This job is no longer accepting proposals.
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <div className="proposals-list">
              {proposals.length > 0 ? (
                proposals.map(prop => (
                  <div key={prop.id} className={`proposal-item-card ${prop.status === 'rejected' ? 'dimmed' : ''}`}>
                    <div className="proposal-card-header">
                      <div className="talent-info">
                        {prop.talent?.avatar_url ? (
                          <img src={prop.talent.avatar_url} alt="" className="talent-avatar" />
                        ) : (
                          <div className="talent-avatar-placeholder">
                            {getInitials(prop.talent?.full_name)}
                          </div>
                        )}
                        <div>
                          <div className="talent-name">{prop.talent?.full_name}</div>
                          <div className="talent-rating">
                            ★ {prop.talent?.talent_profiles?.[0]?.rating_avg || '0.0'}
                          </div>
                        </div>
                      </div>
                      <div className="proposal-price-tag">
                        {formatCurrency(prop.price)}
                      </div>
                    </div>

                    <div className="proposal-body">
                      <div className="delivery-info">Delivery in {prop.delivery_days} days</div>
                      <p className="cover-letter">{prop.cover_letter}</p>
                    </div>

                    {prop.status === 'pending' && (
                      <div className="proposal-actions">
                        <button
                          onClick={() => handleAcceptProposal(prop)}
                          className="btn-primary btn-sm"
                          disabled={submitting}
                        >
                          Accept
                        </button>
                        <button className="btn-outline btn-sm">Message</button>
                        <button className="btn-text btn-sm text-gray">Reject</button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">No proposals received yet.</div>
              )}
            </div>
          )}
        </div>

        <aside className="job-right">
          <div className="sticky-card">
            <div className="info-card">
              <div className="info-section">
                <div className="info-label">Budget Range</div>
                <div className="info-value large">
                  {formatCurrency(job.min_budget)} - {formatCurrency(job.max_budget)}
                </div>
              </div>
              <div className="info-section">
                <div className="info-label">Deadline</div>
                <div className="info-value">{formatDate(job.deadline)}</div>
              </div>
              <div className="info-section">
                <div className="info-label">Category</div>
                <div className="info-value">{job.category}</div>
              </div>
            </div>

            <div className="employer-card">
              <h3>About Employer</h3>
              <div className="employer-header">
                {job.employer?.avatar_url ? (
                  <img src={job.employer.avatar_url} alt="" className="employer-avatar" />
                ) : (
                  <div className="employer-avatar-placeholder">
                    {getInitials(job.employer?.full_name)}
                  </div>
                )}
                <div>
                  <div className="employer-name">{job.employer?.full_name}</div>
                  <div className="employer-joined">Member since {formatDate(job.employer?.created_at)}</div>
                </div>
              </div>
              <Link to={`/talent/${job.employer_id}`} className="btn-link">View Profile</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
