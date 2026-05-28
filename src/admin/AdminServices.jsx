import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)
  const { showToast } = useToast()
  const navigate = useNavigate()

  async function fetchServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id,title,description,thumbnail_url,price,category,status,orders_count,created_at,talent:users(id,full_name,email,avatar_url)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('AdminServices error:', err)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  async function handleToggleStatus(service) {
    const newStatus = service.status === 'active' ? 'paused' : 'active'
    setProcessing(service.id)
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus })
        .eq('id', service.id)
      if (error) throw error
      showToast(`Service ${newStatus === 'active' ? 'activated' : 'paused'}`)
      fetchServices()
    } catch { showToast('Failed to update status', 'error') }
    finally { setProcessing(null) }
  }

  async function handleDelete(service) {
    if (!window.confirm(`Delete "${service.title}"? This cannot be undone.`)) return
    setProcessing(service.id)
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)
      if (error) throw error
      showToast('Service deleted')
      fetchServices()
    } catch { showToast('Failed to delete service', 'error') }
    finally { setProcessing(null) }
  }

  const statusColor = { active: '#0F6E56', paused: '#EF9F27', pending: '#3b82f6', rejected: '#E24B4A' }

  const tabCounts = { all: services.length }
  services.forEach(s => { tabCounts[s.status] = (tabCounts[s.status] || 0) + 1 })

  const filtered = services.filter(s => {
    const matchTab = activeTab === 'all' || s.status === activeTab
    const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase()) || s.talent?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const btnBase = { border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }
  const inputStyle = { padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '280px' }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Services</h1>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or talent name…"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'active', 'paused', 'pending', 'rejected'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...btnBase, background: activeTab === tab ? 'rgba(15,110,86,0.15)' : 'var(--bg-secondary)', color: activeTab === tab ? '#0F6E56' : 'var(--text-secondary)', border: `1.5px solid ${activeTab === tab ? '#0F6E56' : 'var(--border)'}`, padding: '7px 16px' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tabCounts[tab] ? <span style={{ marginLeft: '6px', background: 'rgba(15,110,86,0.15)', color: '#0F6E56', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>{tabCounts[tab]}</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading services…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>No services found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(service => (
            <div key={service.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>

              {service.thumbnail_url ? (
                <img src={service.thumbnail_url} alt="" style={{ width: '64px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '64px', height: '48px', borderRadius: '8px', background: 'linear-gradient(135deg,#0F6E56,#0a4a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🎨</div>
              )}

              <div style={{ flex: 1, minWidth: '200px' }}>
                <Link to={`/services/${service.id}`} style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: 'var(--text-primary)', textDecoration: 'none', display: 'block' }} onMouseEnter={e => e.currentTarget.style.color = '#0F6E56'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>{service.title}</Link>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  by {service.talent?.full_name || '—'} · {service.category || '—'} · ${Number(service.price).toFixed(2)} · {service.orders_count || 0} orders · {new Date(service.created_at).toLocaleDateString()}
                </div>
                {service.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {service.description}
                  </div>
                )}
              </div>

              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: (statusColor[service.status] || '#555') + '20', color: statusColor[service.status] || '#555', flexShrink: 0 }}>
                {service.status?.toUpperCase()}
              </span>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => navigate(`/services/${service.id}`)} style={{ ...btnBase, background: 'rgba(15,110,86,0.12)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.3)' }}>
                  → Open
                </button>
                <button
                  onClick={() => handleToggleStatus(service)}
                  disabled={processing === service.id}
                  style={{ ...btnBase, background: service.status === 'active' ? 'rgba(239,159,39,0.15)' : 'rgba(15,110,86,0.15)', color: service.status === 'active' ? '#EF9F27' : '#0F6E56', border: `1px solid ${service.status === 'active' ? 'rgba(239,159,39,0.3)' : 'rgba(15,110,86,0.3)'}` }}
                >
                  {processing === service.id ? '…' : service.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(service)}
                  disabled={processing === service.id}
                  style={{ ...btnBase, background: 'rgba(226,75,74,0.12)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.25)' }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
