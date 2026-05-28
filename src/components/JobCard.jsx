import { Link } from 'react-router-dom'
import { formatCurrency, formatRelativeTime } from '../lib/helpers'
import './JobCard.css'

export default function JobCard({ job }) {
  const {
    id,
    title,
    description,
    category,
    skills,
    min_budget,
    max_budget,
    deadline,
    created_at,
    proposals_count,
    employer
  } = job

  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  
  let deadlineColor = 'green'
  if (daysLeft < 3) deadlineColor = 'red'
  else if (daysLeft < 7) deadlineColor = 'yellow'

  return (
    <Link to={`/jobs/${id}`} className="job-card">
      <div className="job-card-header">
        <div className="employer-mini">
          {employer?.avatar_url ? (
            <img src={employer.avatar_url} alt="" className="employer-avatar-sm" />
          ) : (
            <div className="employer-avatar-sm-placeholder">
              {employer?.full_name?.[0] || '?'}
            </div>
          )}
          <span className="employer-name-sm">{employer?.full_name}</span>
        </div>
        <span className="job-posted-time">{formatRelativeTime(created_at)}</span>
      </div>

      <h3 className="job-title">{title}</h3>
      <p className="job-description-excerpt">{description}</p>

      <div className="job-tags">
        <span className="job-category-pill">{category}</span>
        {skills?.slice(0, 5).map((skill, index) => (
          <span key={index} className="job-skill-pill">{skill}</span>
        ))}
      </div>

      <div className="job-card-footer">
        <div className="job-footer-item">
          <span className="label">Budget</span>
          <span className="value bold">{formatCurrency(min_budget)} - {formatCurrency(max_budget)}</span>
        </div>
        
        <div className="job-footer-item">
          <span className="label">Deadline</span>
          <span className={`value deadline-${deadlineColor}`}>
            {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
          </span>
        </div>

        <div className="job-footer-item">
          <span className="label">Proposals</span>
          <span className="value">{proposals_count || 0} submitted</span>
        </div>

        <div className="job-view-btn">View Job</div>
      </div>
    </Link>
  )
}
