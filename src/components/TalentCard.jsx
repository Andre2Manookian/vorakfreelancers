import { Link } from 'react-router-dom'
import { isUserOnline, formatCurrency, getInitials } from '../lib/helpers'
import { useLanguage } from '../contexts/LanguageContext'
import VerifiedBadge from './VerifiedBadge'
import './TalentCard.css'

export default function TalentCard({ talent }) {
  const { t } = useLanguage()
  const {
    id,
    full_name,
    avatar_url,
    last_seen,
    id_verified,
    talent_profiles,
  } = talent

  const profile = talent_profiles?.[0] || {}
  const isOnline = isUserOnline(last_seen)
  const initials = getInitials(full_name)

  return (
    <div className="talent-card">
      <div className="talent-card-top">
        <div className="talent-card-avatar-wrapper">
          {avatar_url ? (
            <img src={avatar_url} alt={full_name} className="talent-card-avatar" />
          ) : (
            <div className="talent-card-avatar-placeholder">{initials}</div>
          )}
          {isOnline && <div className="talent-card-online-dot" title="Online" />}
        </div>
      </div>

      <div className="talent-card-body">
        <h3 className="talent-card-name">
          {full_name}
          {id_verified && (
            <VerifiedBadge size="sm" />
          )}
        </h3>
        <p className="talent-card-tagline">{profile.tagline || 'No tagline provided'}</p>

        {profile.category && (
          <span className="talent-card-category">{profile.category}</span>
        )}

        <div className="talent-card-skills">
          {profile.skills?.slice(0, 3).map((skill, index) => (
            <span key={index} className="talent-card-skill-pill">{skill}</span>
          ))}
        </div>

        {profile.languages?.length > 0 && (
          <div className="talent-card-languages">
            {profile.languages.map(lang => (
              <span key={lang} className="talent-card-language-pill">{lang}</span>
            ))}
          </div>
        )}

        <div className="talent-card-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.round(profile.rating_avg || 0) ? 'text-yellow' : 'text-gray'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="talent-card-reviews">({profile.total_reviews || 0})</span>
        </div>

        <div className="talent-card-footer">
          <div className="talent-card-price-info">
            <span className="talent-card-price-label">{t('talentCard.startingFrom')}</span>
            <span className="talent-card-price">{formatCurrency(profile.hourly_rate || 0)}</span>
          </div>
          <div className="talent-card-actions">
            <Link to={`/talent/${id}`} className="talent-card-button">
              {t('talentCard.viewProfile')}
            </Link>
            <Link to={`/messages?user=${id}`} className="talent-card-button talent-card-button-chat">
              {t('talentCard.chat')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
