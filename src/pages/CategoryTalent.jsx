import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCategoryBySlug } from '../lib/helpers'
import TalentCard from '../components/TalentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import './BrowseTalent.css'

export default function CategoryTalent() {
  const { pathname } = useLocation()
  const slug = pathname.split('/').pop()
  const category = getCategoryBySlug(slug)
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (category) {
      document.title = `Hire ${category.name} Freelancers in Armenia | VORAK`
    }
    fetchTalents()
  }, [category])

  const fetchTalents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, talent_profiles!inner(*)')
        .eq('role', 'talent')
        .eq('talent_profiles.category', category?.name || '')
        .limit(20)
      
      if (error) throw error
      setTalents(data || [])
    } catch (error) {
      console.error('Error fetching category talents:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="browse-talent-page" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="category-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>
          Hire {category?.name || slug} Freelancers in Armenia
        </h1>
        <p style={{ color: '#71717a', fontSize: '18px', maxWidth: '800px' }}>
          Find verified {category?.name?.toLowerCase() || slug} professionals in Armenia and the Caucasus. 
          Scale your business with top local talent.
        </p>
      </header>

      {loading ? (
        <LoadingSpinner />
      ) : talents.length > 0 ? (
        <div className="talent-grid">
          {talents.map(talent => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <p style={{ color: '#71717a', marginBottom: '20px' }}>No freelancers found in this category yet.</p>
          <Link to="/talent" className="btn-primary">Browse All Talent</Link>
        </div>
      )}
    </div>
  )
}
