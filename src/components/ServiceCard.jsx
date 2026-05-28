import { Link } from 'react-router-dom'
import { formatCurrency, getInitials } from '../lib/helpers'
import VerifiedBadge from './VerifiedBadge'
import './ServiceCard.css'

export default function ServiceCard({ service }) {
  const {
    id,
    title,
    thumbnail_url,
    price,
    delivery_days,
    rating_avg,
    orders_count,
    talent
  } = service

  return (
    <Link to={`/services/${id}`} className="service-card">
      <div className="service-card-image">
        {thumbnail_url ? (
          <img src={thumbnail_url} alt={title} className="service-thumbnail" />
        ) : (
          <div className="service-thumbnail-placeholder">
            🎨
          </div>
        )}
        <div className="service-card-overlay">
          <span>View Service</span>
        </div>
      </div>

      <div className="service-card-body">
        <div className="service-talent-info">
          {talent?.avatar_url ? (
            <img src={talent.avatar_url} alt="" className="talent-avatar-xs" />
          ) : (
            <div className="talent-avatar-xs-placeholder">
              {getInitials(talent?.full_name)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="talent-name-xs">{talent?.full_name}</span>
            {talent?.id_verified && <VerifiedBadge size="sm" />}
          </div>
        </div>

        <h3 className="service-title">{title}</h3>

        <div className="service-rating">
          <span className="star">★</span>
          <span className="rating-value">{rating_avg?.toFixed(1) || '0.0'}</span>
          <span className="orders-count">({orders_count || 0})</span>
        </div>

        <div className="service-card-footer">
          <div className="service-delivery">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {delivery_days} days
          </div>
          <div className="service-price-info">
            <span className="price-label">Starting at</span>
            <span className="price-value">{formatCurrency(price)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
