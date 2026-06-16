import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { formatCurrency, safeNumber } from '../lib/helpers'
import './Courses.css'

const CATEGORY_KEYS = {
  All: 'all',
  'Web Development': 'webDevelopment',
  'Mobile Apps': 'mobileApps',
  'Graphic Design': 'graphicDesign',
  'Digital Marketing': 'digitalMarketing',
  'UI/UX Design': 'uiuxDesign',
  'Data Science': 'dataScience',
  Programming: 'programming',
  Business: 'business',
  'Language Learning': 'languageLearning',
}

const PLATFORM_KEYS = {
  All: 'all',
  Udemy: 'udemy',
  Coursera: 'coursera',
  Other: 'other',
}

const LEVEL_KEYS = {
  'All Levels': 'allLevels',
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
}

const SORT_KEYS = {
  Newest: 'newest',
  'Top Rated': 'topRated',
  'Most Popular': 'mostPopular',
  'Price Low to High': 'priceLowToHigh',
  'Price High to Low': 'priceHighToLow',
}

const CATEGORIES = Object.keys(CATEGORY_KEYS)
const PLATFORMS = Object.keys(PLATFORM_KEYS)
const LEVELS = Object.keys(LEVEL_KEYS)
const SORT_OPTIONS = Object.keys(SORT_KEYS)

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-input)',
  border: '1.5px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
}

const platformColors = {
  Udemy: '#EC5252',
  Coursera: '#3B82F6',
  Other: '#0F6E56',
}

const translateOption = (t, section, key) => t(`courses.${section}.${key}`)

const badgeLabel = (platform) => {
  if (platform === 'Udemy') return 'Udemy'
  if (platform === 'Coursera') return 'Coursera'
  return 'Other'
}

const getSortValue = (a, b, sortBy) => {
  if (sortBy === 'Newest') {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  }
  if (sortBy === 'Top Rated') {
    return safeNumber(b.rating) - safeNumber(a.rating)
  }
  if (sortBy === 'Most Popular') {
    return safeNumber(b.students_count) - safeNumber(a.students_count)
  }
  if (sortBy === 'Price Low to High') {
    return safeNumber(a.current_price) - safeNumber(b.current_price)
  }
  if (sortBy === 'Price High to Low') {
    return safeNumber(b.current_price) - safeNumber(a.current_price)
  }
  return 0
}

function CourseCard({ course }) {
  const { t } = useLanguage()
  const currentPrice = safeNumber(course.current_price)
  const originalPrice = safeNumber(course.original_price)
  const ratingValue = safeNumber(course.rating)
  const ratingStars = Math.round(Math.max(0, Math.min(5, ratingValue)))
  const affiliateUrl = course.affiliate_url?.trim()

  const openAffiliate = (event) => {
    event.stopPropagation()
    if (!affiliateUrl) return
    window.open(affiliateUrl, '_blank', 'noopener')
  }

  return (
    <div
      className="courses-card"
      onClick={(e) => affiliateUrl && openAffiliate(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && affiliateUrl && openAffiliate(e)}
    >
      <div className="course-media">
        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="course-cover"
          />
        ) : (
          <div className="course-placeholder">
            <span>{`${translateOption(t, 'platforms', PLATFORM_KEYS[course.platform] || 'other')} ${t('courses.courseType')}`}</span>
          </div>
        )}
        <span
          className="course-platform-badge"
          style={{ background: platformColors[course.platform] || platformColors.Other }}
        >
          {translateOption(t, 'platforms', PLATFORM_KEYS[course.platform] || 'other')}
        </span>
        {course.is_featured && (
          <span className="course-featured-badge">{t('courses.featuredBadge')}</span>
        )}
      </div>
      <div className="course-content">
        <span className="course-category-tag">{translateOption(t, 'categories', CATEGORY_KEYS[course.category] || 'all')}</span>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-instructor">{course.instructor_name || t('courses.instructorFallback') || 'Instructor'}</p>
        <div className="course-rating-row">
          <div className="course-stars" aria-label={`${ratingValue} stars`}>
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={index < ratingStars ? 'star filled' : 'star'}
              >
                ★
              </span>
            ))}
          </div>
          <span className="course-rating-value">{ratingValue.toFixed(1)}</span>
          <span className="course-review-count">({course.students_count || 0})</span>
        </div>
        <div className="course-info-row">
          {course.duration && <span className="course-pill">{course.duration}</span>}
          {course.level && <span className="course-pill">{course.level}</span>}
        </div>
        <div className="course-price-row">
          {currentPrice === 0 ? (
            <span className="course-free-badge">{t('courses.freeBadge')}</span>
          ) : (
            <>
              <span className="course-price-current">{formatCurrency(currentPrice)}</span>
              {originalPrice > currentPrice && (
                <span className="course-price-original">{formatCurrency(originalPrice)}</span>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          className="course-enroll-btn"
          onClick={openAffiliate}
          disabled={!affiliateUrl}
        >
          {t('courses.enrollNow')}
        </button>
      </div>
    </div>
  )
}

function CourseSkeleton() {
  return (
    <div className="courses-card skeleton-card">
      <div className="skeleton-image shimmer" />
      <div className="course-content">
        <div className="skeleton-line shimmer short" />
        <div className="skeleton-line shimmer" />
        <div className="skeleton-line shimmer" />
        <div className="skeleton-line shimmer small" />
        <div className="skeleton-line shimmer" />
      </div>
    </div>
  )
}

export default function Courses() {
  const { t } = useLanguage()
  const { isAdmin } = useAuth()
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [platform, setPlatform] = useState('All')
  const [level, setLevel] = useState('All Levels')
  const [sortBy, setSortBy] = useState('Newest')
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadCourses() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Courses fetch error:', error)
          return
        }

        if (!mounted) return
        setCourses(data || [])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadCourses()
    return () => { mounted = false }
  }, [])

  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const query = search.trim().toLowerCase()
        const matchesSearch = !query ||
          course.title?.toLowerCase().includes(query) ||
          course.instructor_name?.toLowerCase().includes(query)

        const matchesCategory = category === 'All' || course.category === category
        const matchesPlatform = platform === 'All' || course.platform === platform
        const matchesLevel = level === 'All Levels' || course.level === level

        return matchesSearch && matchesCategory && matchesPlatform && matchesLevel
      })
      .sort((a, b) => getSortValue(a, b, sortBy))
  }, [courses, search, category, platform, level, sortBy])

  const featured = courses.filter((course) => course.is_featured).slice(0, 3)
  const showEmpty = !loading && filteredCourses.length === 0
  const activeFilters = [
    category !== 'All',
    platform !== 'All',
    level !== 'All Levels',
    search.trim().length > 0,
  ].filter(Boolean).length

  return (
    <div className="courses-page">
      <div className="courses-hero">
        <div className="courses-hero-copy">
          <p className="courses-eyebrow">{t('courses.pageTitle')}</p>
          <h1>{t('courses.pageTitle')}</h1>
          <p className="courses-subtitle">{t('courses.pageSubtitle')}</p>
        </div>
      </div>

      <div className="courses-controls">
        <div className="courses-search-wrapper">
          <input
            style={inputStyle}
            type="search"
            placeholder={t('courses.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="courses-filter-button mobile-only"
          onClick={() => setDrawerOpen(true)}
        >
          {t('courses.filters')}{activeFilters > 0 ? ` · ${activeFilters}` : ''}
        </button>
        <div className="courses-filters desktop-only">
          <div className="courses-pill-row">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={`courses-pill ${category === item ? 'active' : ''}`}
                onClick={() => setCategory(item)}
              >
                {translateOption(t, 'categories', CATEGORY_KEYS[item])}
              </button>
            ))}
          </div>

          <div className="courses-filter-row">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
              {PLATFORMS.map((item) => (
                <option key={item} value={item}>{translateOption(t, 'platforms', PLATFORM_KEYS[item])}</option>
              ))}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
              {LEVELS.map((item) => (
                <option key={item} value={item}>{translateOption(t, 'levels', LEVEL_KEYS[item])}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
              {SORT_OPTIONS.map((item) => (
                <option key={item} value={item}>{translateOption(t, 'sortOptions', SORT_KEYS[item])}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="featured-banner">
        <div className="featured-label">
          <span>{t('courses.featuredLabel')}</span>
        </div>
        <div className="featured-cards">
          {featured.length > 0 ? featured.map((course) => (
            <div key={course.id} className="featured-card" onClick={() => window.open(course.affiliate_url, '_blank', 'noopener')}>
              <div className="course-media featured-media">
                {course.cover_image_url ? (
                  <img src={course.cover_image_url} alt={course.title} className="course-cover" />
                ) : (
                  <div className="course-placeholder featured-placeholder">
                    <span>{`${translateOption(t, 'platforms', PLATFORM_KEYS[course.platform] || 'other')} ${t('courses.courseType')}`}</span>
                  </div>
                )}
                <span
                  className="course-platform-badge"
                  style={{ background: platformColors[course.platform] || platformColors.Other }}
                >
                  {translateOption(t, 'platforms', PLATFORM_KEYS[course.platform] || 'other')}
                </span>
                <span className="course-featured-badge">{t('courses.featuredBadge')}</span>
              </div>
              <div className="course-content featured-content">
                <span className="course-category-tag">{translateOption(t, 'categories', CATEGORY_KEYS[course.category] || 'all')}</span>
                <h3 className="course-title">{course.title}</h3>
                <p className="course-instructor">{course.instructor_name || t('courses.instructorFallback') || 'Instructor'}</p>
                <div className="course-price-row">
                  {safeNumber(course.current_price) === 0 ? (
                    <span className="course-free-badge">{t('courses.freeBadge')}</span>
                  ) : (
                    <span className="course-price-current">{formatCurrency(safeNumber(course.current_price))}</span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="featured-empty">{t('courses.noFeaturedCourses')}</div>
          )}
        </div>
      </div>

      <div className="courses-main">
        {loading ? (
          <div className="courses-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <CourseSkeleton key={index} />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="empty-state">
            <div className="empty-emoji">🎓</div>
            <h2>{t('courses.emptyTitle')}</h2>
            <p>{t('courses.emptySubtitle')}</p>
            {isAdmin && (
              <Link to="/admin/courses" className="btn-primary">
                {t('courses.addFirstCourse')}
              </Link>
            )}
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      <div className={`courses-filter-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span>{t('courses.filters')}</span>
          <button type="button" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <div className="drawer-body">
          <label>
            {t('courses.searchPlaceholder')}
            <input
              type="search"
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('courses.searchPlaceholder')}
            />
          </label>
          <div className="drawer-group">
            <span className="drawer-label">{t('courses.categoryLabel')}</span>
            <div className="courses-pill-row filter-drawer-pills">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`courses-pill ${category === item ? 'active' : ''}`}
                  onClick={() => setCategory(item)}
                >
                  {translateOption(t, 'categories', CATEGORY_KEYS[item])}
                </button>
              ))}
            </div>
          </div>
          <label>
            {t('courses.platformLabel')}
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
              {PLATFORMS.map((item) => (
                <option key={item} value={item}>{translateOption(t, 'platforms', PLATFORM_KEYS[item])}</option>
              ))}
            </select>
          </label>
          <label>
            {t('courses.levelLabel')}
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
              {LEVELS.map((item) => (
                <option key={item} value={item}>{translateOption(t, 'levels', LEVEL_KEYS[item])}</option>
              ))}
            </select>
          </label>
          <label>
            {t('courses.sortBy')}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
              {SORT_OPTIONS.map((item) => (
                <option key={item} value={item}>{translateOption(t, 'sortOptions', SORT_KEYS[item])}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
    </div>
  )
}
