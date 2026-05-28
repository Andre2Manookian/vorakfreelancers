import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)
  const { showToast } = useToast()
  const navigate = useNavigate()

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id,title,description,category,budget,budget_min,budget_max,status,proposals_count,created_at,employer:users(id,full_name,email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setJobs(data || [])
    } catch (err) {
      console.error('AdminJobs error:', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  async function handleToggleStatus(job) {
    const newStatus = job.status === 'open' ? 'closed' : 'open'
    setProcessing(job.id)
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id)
      if (error) throw error
      showToast(`Job ${newStatus === 'open' ? 'opened' : 'closed'}`)
      fetchJobs()
    } catch { showToast('Failed to update status', 'error') }
    finally { setProcessing(null) }
  }

  async function handleDelete(job) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    setProcessing(job.id)
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id)
      if (error) throw error
      showToast('Job deleted')
      fetchJobs()
    } catch { showToast('Failed to delete job', 'error') }
    finally { setProcessing(null) }
  }

  const statusColor = { open: '#0F6E56', closed: '#71717a', filled: '#3b82f6' }

  const tabCounts = { all: jobs.length }
  jobs.forEach(j => { tabCounts[j.status] = (tabCounts[j.status] || 0) + 1 })

  const filtered = jobs.filter(j => {
    const matchTab = activeTab === 'all' || j.status === activeTab
    const matchSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.employer?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const btnBase = { border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }
  const inputStyle = { padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '280px' }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Jobs</h1>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or employer name…"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'open', 'closed', 'filled'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...btnBase, background: activeTab === tab ? 'rgba(15,110,86,0.15)' : 'var(--bg-secondary)', color: activeTab === tab ? '#0F6E56' : 'var(--text-secondary)', border: `1.5px solid ${activeTab === tab ? '#0F6E56' : 'var(--border)'}`, padding: '7px 16px' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tabCounts[tab] ? <span style={{ marginLeft: '6px', background: 'rgba(15,110,86,0.15)', color: '#0F6E56', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>{tabCounts[tab]}</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>No jobs found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(job => (
            <div key={job.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>

              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(15,110,86,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>💼</div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <Link to={`/jobs/${job.id}`} style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: 'var(--text-primary)', textDecoration: 'none', display: 'block' }} onMouseEnter={e => e.currentTarget.style.color = '#0F6E56'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>{job.title}</Link>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  by {job.employer?.full_name || '—'}
                  {job.category ? ` · ${job.category}` : ''}
                  {job.budget_min && job.budget_max ? ` · $${job.budget_min}–$${job.budget_max}` : job.budget ? ` · $${job.budget}` : ''}
                  {` · ${job.proposals_count || 0} proposals · ${new Date(job.created_at).toLocaleDateString()}`}
                </div>
                {job.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {job.description}
                  </div>
                )}
              </div>

              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: (statusColor[job.status] || '#555') + '20', color: statusColor[job.status] || '#555', flexShrink: 0 }}>
                {job.status?.toUpperCase()}
              </span>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => navigate(`/jobs/${job.id}`)} style={{ ...btnBase, background: 'rgba(15,110,86,0.12)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.3)' }}>
                  → Open
                </button>
                <button
                  onClick={() => handleToggleStatus(job)}
                  disabled={processing === job.id}
                  style={{ ...btnBase, background: job.status === 'open' ? 'rgba(113,113,122,0.15)' : 'rgba(15,110,86,0.15)', color: job.status === 'open' ? '#71717a' : '#0F6E56', border: `1px solid ${job.status === 'open' ? 'rgba(113,113,122,0.3)' : 'rgba(15,110,86,0.3)'}` }}
                >
                  {processing === job.id ? '…' : job.status === 'open' ? 'Close' : 'Reopen'}
                </button>
                <button
                  onClick={() => handleDelete(job)}
                  disabled={processing === job.id}
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
