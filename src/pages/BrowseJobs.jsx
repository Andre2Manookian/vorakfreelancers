import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/helpers'
import JobCard from '../components/JobCard'
import LoadingSpinner from '../components/LoadingSpinner'
import './BrowseJobs.css'

export default function BrowseJobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
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
          <h1>Գտի՛ր Քո Հաջորդ Ֆռիլանս Աշխատանքը</h1>
          <p>Ամբողջ աշխարհի ընկերություններից ու անձնավորություններից պատվերներ</p>
          <div className="bj-search-wrap">
            <span className="bj-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Որոնել աշխատանք..."
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

          {/* Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-group">
              <label>Կատեգորիա</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">Բոլոր կատեգորիաները</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Բյուջե ($)</label>
              <div className="price-inputs">
                <input type="number" placeholder="Նվազ." value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
                <input type="number" placeholder="Առավ." value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
              </div>
            </div>

            <div className="filter-group">
              <label>Տեղադրված</label>
              <select value={postedWithin} onChange={(e) => setPostedWithin(e.target.value)}>
                <option value="All">Ամբողջ ժամանակ</option>
                <option value="Today">Այսօր</option>
                <option value="Week">Այս շաբաթ</option>
                <option value="Month">Այս ամիս</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Դասավորել</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="Newest">Նոր</option>
                <option value="Budget High">Բյուջե ↓</option>
                <option value="Budget Low">Բյուջե ↑</option>
                <option value="Most Proposals">Շատ առաջարկ</option>
                <option value="Deadline Soon">Վաղ ժամկետ</option>
              </select>
            </div>

            <button onClick={handleApplyFilters} className="btn-primary" style={{ width: '100%' }}>
              Կիրառել
            </button>
            <button onClick={handleResetFilters} className="btn-link" style={{ width: '100%', textAlign: 'center' }}>
              Մաքրել բոլոր ֆիլտրները
            </button>
          </aside>

          {/* Results */}
          <main className="results-container">
            <div className="results-header">
              <h2>{totalCount} {totalCount === 1 ? 'աշխատանք' : 'աշխատանք'} գտնված</h2>
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
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="pagination-btn">← Նախ.</button>
                    <div className="page-numbers">
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`page-number ${page === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                      ))}
                    </div>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pagination-btn">Հաջ. →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💼</div>
                <h3>Աշխատանք չի գտնվել</h3>
                <p>Փորձի՛ր փոփոխել ֆիլտրերը կամ որոնման բառերը:</p>
                <button onClick={handleResetFilters} className="btn-primary">Մաքրել ֆիլտրերը</button>
              </div>
            )}

            {/* ── Coming Soon ── */}
            <div className="coming-soon-section">
              <div className="cs-header">
                <div className="cs-badge">🕐 Շուտով</div>
                <h2 className="cs-title">Ընկերությունների Հայտարարություններ</h2>
                <p className="cs-subtitle">
                  VORAK Freelance-ը շուտով կներկայացնի ամբողջ դրույքի, կես դրույքի
                  և ստաժավարության հնարավորություններ ընկերությունների համար:
                </p>
              </div>
              <div className="cs-cards">
                {[
                  {
                    icon: '🏢',
                    title: 'Ամբողջ դրույք',
                    en: 'Full-time',
                    desc: 'Մշտական աշխատանք հեղինակավոր ընկերություններում՝ ամբողջ սոցփաթեթով',
                  },
                  {
                    icon: '⏰',
                    title: 'Կես դրույք',
                    en: 'Part-time',
                    desc: 'Ճկուն ժամանակացույցով մասնակի աշխատանք՝ քո ռիթմով',
                  },
                  {
                    icon: '🎓',
                    title: 'Ստաժավարություն',
                    en: 'Internship',
                    desc: 'Կրթական ու մասնագիտական ծրագրեր ուսանողների և սկսնակների համար',
                  },
                ].map(item => (
                  <div key={item.title} className="cs-card">
                    <div className="cs-card-badge">Շուտով</div>
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
