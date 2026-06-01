import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/helpers'
import JobCard from '../components/JobCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'
import './BrowseJobs.css'

export default function BrowseJobs() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const itemsPerPage = 10

  // Filters state
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [minBudget, setMinBudget] = useState(searchParams.get('minBudget') || '')
  const [maxBudget, setMaxBudget] = useState(searchParams.get('maxBudget') || '')
  const [postedWithin, setPostedWithin] = useState(searchParams.get('posted') || 'All')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'Newest')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('jobs')
        .select('*, employer:users(full_name, avatar_url)', { count: 'exact' })
        .eq('status', 'open')

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      if (category !== 'All') {
        query = query.eq('category', category)
      }

      if (minBudget) {
        query = query.gte('max_budget', parseFloat(minBudget))
      }

      if (maxBudget) {
        query = query.lte('min_budget', parseFloat(maxBudget))
      }

      if (postedWithin !== 'All') {
        const now = new Date()
        let dateLimit = new Date()
        if (postedWithin === 'Today') dateLimit.setDate(now.getDate() - 1)
        if (postedWithin === 'Week') dateLimit.setDate(now.getDate() - 7)
        if (postedWithin === 'Month') dateLimit.setMonth(now.getMonth() - 1)
        query = query.gte('created_at', dateLimit.toISOString())
      }

      // Sorting
      switch (sortBy) {
        case 'Newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'Budget High':
          query = query.order('max_budget', { ascending: false })
          break
        case 'Budget Low':
          query = query.order('min_budget', { ascending: true })
          break
        case 'Deadline Soon':
          query = query.order('deadline', { ascending: true })
          break
        case 'Most Proposals':
          query = query.order('proposals_count', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      // Pagination
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, count, error } = await query
      if (error) throw error

      setJobs(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [search, category, minBudget, maxBudget, postedWithin, sortBy, page])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchJobs()
    }, 500)
    return () => clearTimeout(handler)
  }, [fetchJobs])

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category !== 'All') params.set('category', category)
    if (minBudget) params.set('minBudget', minBudget)
    if (maxBudget) params.set('maxBudget', maxBudget)
    if (postedWithin !== 'All') params.set('posted', postedWithin)
    if (sortBy !== 'Newest') params.set('sort', sortBy)
    setSearchParams(params)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setCategory('All')
    setMinBudget('')
    setMaxBudget('')
    setPostedWithin('All')
    setSortBy('Newest')
    setSearchParams({})
    setPage(1)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="browse-jobs-page">

      {/* ── Hero ── */}
      <div className="bj-hero">
        <div className="bj-hero-inner">
          <h1>{t('browseJobs.title')}</h1>
          <p>{t('browseJobs.subtitle')}</p>
          <div className="bj-search-wrap">
            <span className="bj-search-icon">🔍</span>
            <input
              type="text"
              placeholder={t('browseJobs.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="bj-body">
        <div className="browse-content">

          {/* Mobile Filter Toggle */}
          <div className="mobile-filter-toggle">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="mobile-filter-btn"
            >
              ⚙️ {t('browseJobs.filters') || 'Filters'}
            </button>
          </div>

          {/* Mobile Filter Overlay */}
          {mobileFiltersOpen && (
            <div
              className="mobile-filter-overlay"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`filters-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
            {/* Mobile Close Header */}
            <div className="mobile-filter-header" style={{ display: 'none' }}>
              <h3>{t('browseJobs.filters') || 'Filters'}</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="mobile-filter-close">✕</button>
            </div>

            <div className="filter-group">
              <label>{t('browseJobs.categoryLabel')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">{t('browseJobs.allCategories')}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('browseJobs.budgetLabel')}</label>
              <div className="price-inputs">
                <input type="number" placeholder={t('browseJobs.minPlaceholder')} value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
                <input type="number" placeholder={t('browseJobs.maxPlaceholder')} value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
              </div>
            </div>

            <div className="filter-group">
              <label>{t('browseJobs.postedLabel')}</label>
              <select value={postedWithin} onChange={(e) => setPostedWithin(e.target.value)}>
                <option value="All">{t('browseJobs.allTime')}</option>
                <option value="Today">{t('browseJobs.today')}</option>
                <option value="Week">{t('browseJobs.thisWeek')}</option>
                <option value="Month">{t('browseJobs.thisMonth')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('browseJobs.sortBy')}</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="Newest">{t('browseJobs.newest')}</option>
                <option value="Budget High">{t('browseJobs.budgetHigh')}</option>
                <option value="Budget Low">{t('browseJobs.budgetLow')}</option>
                <option value="Most Proposals">{t('browseJobs.mostProposals')}</option>
                <option value="Deadline Soon">{t('browseJobs.deadlineSoon')}</option>
              </select>
            </div>

            <button onClick={() => { handleApplyFilters(); setMobileFiltersOpen(false); }} className="btn-primary" style={{ width: '100%' }}>
              {t('browseJobs.applyFilters')}
            </button>
            <button onClick={handleResetFilters} className="btn-link" style={{ width: '100%', textAlign: 'center' }}>
              {t('browseJobs.resetFilters')}
            </button>

            {/* Mobile Responsive Styles */}
            <style>{`
              @media (max-width: 768px) {
                .mobile-filter-toggle {
                  display: block !important;
                  margin-bottom: 20px;
                }
                .mobile-filter-btn {
                  width: 100%;
                  padding: 12px;
                  background: var(--bg-card);
                  border: 1px solid var(--border);
                  border-radius: 10px;
                  color: var(--text-primary);
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  font-size: 15px;
                }
                .mobile-filter-overlay {
                  display: block !important;
                  position: fixed;
                  inset: 0;
                  background: rgba(0,0,0,0.5);
                  z-index: 998;
                }
                .filters-sidebar {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  z-index: 999;
                  transform: translateX(-100%);
                  transition: transform 0.3s ease;
                  overflow-y: auto;
                  background: var(--bg-primary) !important;
                  max-width: none !important;
                }
                .filters-sidebar.mobile-open {
                  transform: translateX(0);
                }
                .mobile-filter-header {
                  display: flex !important;
                  justify-content: space-between;
                  align-items: center;
                  padding-bottom: 16px;
                  margin-bottom: 16px;
                  border-bottom: 1px solid var(--border);
                }
                .mobile-filter-header h3 {
                  margin: 0;
                  font-size: 18px;
                  font-weight: 700;
                }
                .mobile-filter-close {
                  background: none;
                  border: none;
                  font-size: 24px;
                  cursor: pointer;
                  color: var(--text-primary);
                  width: 36px;
                  height: 36px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 8px;
                }
                .mobile-filter-close:hover {
                  background: var(--bg-card);
                }
              }
              @media (min-width: 769px) {
                .mobile-filter-toggle,
                .mobile-filter-overlay {
                  display: none !important;
                }
                .mobile-filter-header {
                  display: none !important;
                }
              }
            `}</style>
          </aside>

          {/* Results */}
          <main className="results-container">
            <div className="results-header">
              <h2>{t('browseJobs.resultsFound').replace('{count}', totalCount)}</h2>
            </div>

            {loading ? (
              <div className="results-list-loading">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="job-card-skeleton" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="results-list">
                  {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="pagination-btn">←</button>
                    <div className="page-numbers">
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`page-number ${page === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                      ))}
                    </div>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pagination-btn">→</button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💼</div>
                <h3>{t('browseJobs.noResults')}</h3>
                <p>{t('browseJobs.noResultsDescription')}</p>
                <button onClick={handleResetFilters} className="btn-primary">{t('browseJobs.clearFilters')}</button>
              </div>
            )}

            {/* ── Coming Soon ── */}
            <div className="coming-soon-section">
              <div className="cs-header">
                <div className="cs-badge">🕐 {t('browseJobs.comingSoon')}</div>
                <h2 className="cs-title">{t('browseJobs.companyJobsTitle')}</h2>
                <p className="cs-subtitle">
                  {t('browseJobs.companyJobsSubtitle')}
                </p>
              </div>
              <div className="cs-cards">
                {[
                  {
                    icon: '🏢',
                    title: t('browseJobs.fullTime'),
                    en: 'Full-time',
                    desc: t('browseJobs.fullTimeDesc'),
                  },
                  {
                    icon: '⏰',
                    title: t('browseJobs.partTime'),
                    en: 'Part-time',
                    desc: t('browseJobs.partTimeDesc'),
                  },
                  {
                    icon: '🎓',
                    title: t('browseJobs.internship'),
                    en: 'Internship',
                    desc: t('browseJobs.internshipDesc'),
                  },
                ].map(item => (
                  <div key={item.title} className="cs-card">
                    <div className="cs-card-badge">{t('browseJobs.comingSoon')}</div>
                    <div className="cs-icon">{item.icon}</div>
                    <p className="cs-card-title">{item.title}</p>
                    <p className="cs-card-en">{item.en}</p>
                    <p className="cs-card-desc">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}
