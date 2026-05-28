import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES, LANGUAGES_FILTER } from '../lib/helpers'
import TalentCard from '../components/TalentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import './BrowseTalent.css'

export default function BrowseTalent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const itemsPerPage = 12

  // Filters state
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [languages, setLanguages] = useState(searchParams.getAll('lang') || [])
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true')
  const [minRating, setMinRating] = useState(searchParams.get('rating') || 'Any')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'Newest')
  const [skillSearch, setSkillSearch] = useState(searchParams.get('skill') || '')

  const fetchTalents = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select('*, talent_profiles!inner(*)', { count: 'exact' })
        .eq('role', 'talent')

      if (search) {
        query = query.ilike('full_name', `%${search}%`)
      }

      if (category !== 'All') {
        query = query.eq('talent_profiles.category', category)
      }

      if (minPrice) {
        query = query.gte('talent_profiles.hourly_rate', parseFloat(minPrice))
      }

      if (maxPrice) {
        query = query.lte('talent_profiles.hourly_rate', parseFloat(maxPrice))
      }

      if (languages.length > 0) {
        query = query.contains('talent_profiles.languages', languages)
      }

      if (skillSearch.trim()) {
        query = query.ilike('talent_profiles.skills', `%${skillSearch.trim()}%`)
      }

      if (verifiedOnly) {
        query = query.eq('id_verified', true)
      }

      if (minRating !== 'Any') {
        query = query.gte('talent_profiles.rating_avg', parseFloat(minRating))
      }

      // Sorting
      switch (sortBy) {
        case 'Newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'Top Rated':
          query = query.order('rating_avg', { foreignTable: 'talent_profiles', ascending: false })
          break
        case 'Most Orders':
          query = query.order('total_orders', { foreignTable: 'talent_profiles', ascending: false })
          break
        case 'Price Low to High':
          query = query.order('hourly_rate', { foreignTable: 'talent_profiles', ascending: true })
          break
        case 'Price High to Low':
          query = query.order('hourly_rate', { foreignTable: 'talent_profiles', ascending: false })
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

      setTalents(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching talents:', error)
    } finally {
      setLoading(false)
    }
  }, [search, category, minPrice, maxPrice, languages, verifiedOnly, minRating, sortBy, page, skillSearch])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTalents()
    }, 500)
    return () => clearTimeout(handler)
  }, [fetchTalents])

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category !== 'All') params.set('category', category)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    languages.forEach(lang => params.append('lang', lang))
    if (verifiedOnly) params.set('verified', 'true')
    if (minRating !== 'Any') params.set('rating', minRating)
    if (sortBy !== 'Newest') params.set('sort', sortBy)
    if (skillSearch) params.set('skill', skillSearch)
    setSearchParams(params)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setCategory('All')
    setMinPrice('')
    setMaxPrice('')
    setLanguages([])
    setVerifiedOnly(false)
    setMinRating('Any')
    setSortBy('Newest')
    setSkillSearch('')
    setSearchParams({})
    setPage(1)
  }

  const toggleLanguage = (lang) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="browse-talent-page">

      {/* ── Hero ── */}
      <div className="bt-hero">
        <div className="bt-hero-inner">
          <h1>Browse Talent</h1>
          <p>Find skilled freelancers for your next project</p>
          <div className="bt-search-wrap">
            <span className="bt-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="bt-body">
        <div className="browse-content">

          {/* Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Hourly Rate ($)</label>
              <div className="price-inputs">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <div className="filter-group">
              <label>Skills</label>
              <input
                type="text"
                placeholder="e.g. React, Figma..."
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Languages</label>
              <div className="checkbox-group">
                {LANGUAGES_FILTER.map(lang => (
                  <label key={lang} className="checkbox-label">
                    <input type="checkbox" checked={languages.includes(lang)} onChange={() => toggleLanguage(lang)} />
                    {lang}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="toggle-label" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Verified Only</span>
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              </label>
            </div>

            <div className="filter-group">
              <label>Min Rating</label>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                <option value="Any">Any</option>
                <option value="3">3+ ⭐</option>
                <option value="4">4+ ⭐</option>
                <option value="4.5">4.5+ ⭐</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="Newest">Newest</option>
                <option value="Top Rated">Top Rated</option>
                <option value="Most Orders">Most Orders</option>
                <option value="Price Low to High">Price ↑</option>
                <option value="Price High to Low">Price ↓</option>
              </select>
            </div>

            <button onClick={handleApplyFilters} className="btn-primary" style={{ width: '100%' }}>
              Apply Filters
            </button>
            <button onClick={handleResetFilters} className="btn-link" style={{ width: '100%', textAlign: 'center' }}>
              Reset Filters
            </button>
          </aside>

          {/* Results */}
          <main className="results-container">
            <div className="results-header">
              <h2>{totalCount} {totalCount === 1 ? 'freelancer' : 'freelancers'} found</h2>
            </div>

            {loading ? (
              <div className="results-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="talent-card-skeleton" />
                ))}
              </div>
            ) : talents.length > 0 ? (
              <>
                <div className="results-grid">
                  {talents.map(talent => <TalentCard key={talent.id} talent={talent} />)}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="pagination-btn">← Previous</button>
                    <div className="page-numbers">
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`page-number ${page === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                      ))}
                    </div>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pagination-btn">Next →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No freelancers found</h3>
                <p>Try adjusting your filters to find more results.</p>
                <button onClick={handleResetFilters} className="btn-primary">Reset Filters</button>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  )
}
