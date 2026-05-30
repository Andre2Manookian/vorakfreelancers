import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ServiceCard from '../components/ServiceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '💻 Web Dev', value: 'Web Development' },
  { label: '📱 Mobile', value: 'Mobile Apps' },
  { label: '🎨 Design', value: 'Graphic Design' },
  { label: '🎬 Video', value: 'Video Editing' },
  { label: '📣 Marketing', value: 'Digital Marketing' },
  { label: '🌐 Translation', value: 'Translation' },
  { label: '💼 Finance', value: 'Accounting & Finance' },
  { label: '✍️ Writing', value: 'Content Writing' },
]

export default function BrowseServices() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const itemsPerPage = 12

  // Filters state
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'Popular')

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('services')
        .select('*, talent:users(full_name, avatar_url, id_verified)', { count: 'exact' })
        .eq('status', 'active')

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice))
      }

      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice))
      }

      // Sorting (Case-insensitive to handle both 'Popular' and 'popular')
      const normalizedSort = sortBy.toLowerCase()
      switch (normalizedSort) {
        case 'popular':
          query = query.order('orders_count', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'price_low':
        case 'price low':
          query = query.order('price', { ascending: true })
          break
        case 'price_high':
        case 'price high':
          query = query.order('price', { ascending: false })
          break
        case 'top rated':
        case 'top_rated':
          query = query.order('rating_avg', { ascending: false })
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

      setServices(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }, [search, category, minPrice, maxPrice, sortBy, page])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchServices()
    }, 500)
    return () => clearTimeout(handler)
  }, [fetchServices])

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (sortBy !== 'Popular') params.set('sort', sortBy)
    setSearchParams(params)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('Popular')
    setSearchParams({})
    setPage(1)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-input)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingTop: '100px',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 24px' }}>

        {/* Search Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {t('browseServices.title')}
          </h1>
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <input
              type="text"
              placeholder={t('browseServices.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                padding: '16px 20px',
                fontSize: '16px',
                paddingRight: '120px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
            <button
              onClick={handleApplyFilters}
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                bottom: '8px',
                background: '#0F6E56',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                padding: '0 20px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t('browseServices.searchButton')}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px' }}>

          {/* Filters Sidebar */}
          <aside style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>{t('browseServices.categoryLabel')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '24px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: '1.5px solid',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderColor: category === cat.value ? '#0F6E56' : 'var(--border)',
                        background: category === cat.value ? 'rgba(15,110,86,0.12)' : 'var(--bg-card)',
                        color: category === cat.value ? '#0F6E56' : 'var(--text-secondary)',
                        fontFamily: 'inherit',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>{t('browseServices.budgetRange')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>{t('browseServices.sortBy')}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Popular">Most Popular</option>
                  <option value="Newest">Newest</option>
                  <option value="Price Low">Price: Low to High</option>
                  <option value="Price High">Price: High to Low</option>
                  <option value="Top Rated">Top Rated</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleApplyFilters}
                  style={{
                    background: '#0F6E56',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <main>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {totalCount} Services available
              </h2>
            </div>

            {loading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    height: '380px',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    animation: 'pulse 1.5s infinite'
                  }} />
                ))}
              </div>
            ) : services.length > 0 ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  {services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {totalCount > itemsPerPage && (
                  <div style={{
                    marginTop: '60px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <button
                      disabled={page === 1}
                      onClick={() => {
                        setPage(p => p - 1)
                        window.scrollTo(0, 0)
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        opacity: page === 1 ? 0.5 : 1
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                      Page {page} of {Math.ceil(totalCount / itemsPerPage)}
                    </span>
                    <button
                      disabled={page >= Math.ceil(totalCount / itemsPerPage)}
                      onClick={() => {
                        setPage(p => p + 1)
                        window.scrollTo(0, 0)
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: page >= Math.ceil(totalCount / itemsPerPage) ? 'not-allowed' : 'pointer',
                        opacity: page >= Math.ceil(totalCount / itemsPerPage) ? 0.5 : 1
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 40px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px dashed var(--border)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔍</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>No services found</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                  We couldn't find any services matching your criteria. Try different keywords or filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: '#0F6E56',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 32px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
