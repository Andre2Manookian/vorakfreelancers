import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency } from '../lib/helpers'
import './AdminUsers.css'

export default function AdminReports() {
  const [stats, setStats] = useState({
    userCount: 0,
    talentCount: 0,
    employerCount: 0,
    contractCount: 0,
    totalVolume: 0,
    completedContracts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [users, contracts] = await Promise.all([
        supabase.from('users').select('role'),
        supabase.from('contracts').select('amount, status')
      ])

      const uData = users.data || []
      const cData = contracts.data || []

      setStats({
        userCount: uData.length,
        talentCount: uData.filter(u => u.role === 'talent').length,
        employerCount: uData.filter(u => u.role === 'employer').length,
        contractCount: cData.length,
        totalVolume: cData.reduce((sum, c) => sum + (c.amount || 0), 0),
        completedContracts: cData.filter(c => c.status === 'completed').length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="admin-reports">
      <div className="admin-stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px'
      }}>
        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#71717a', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Base</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>Total Users</span>
              <strong>{stats.userCount}</strong>
            </div>
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(stats.talentCount/stats.userCount)*100}%`, background: '#22c55e' }} />
              <div style={{ width: `${(stats.employerCount/stats.userCount)*100}%`, background: '#3b82f6' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                Talents ({stats.talentCount})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                Employers ({stats.employerCount})
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#71717a', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marketplace Health</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Total Volume</span>
              <strong>{formatCurrency(stats.totalVolume)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Total Contracts</span>
              <strong>{stats.contractCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Completion Rate</span>
              <strong>{stats.contractCount > 0 ? Math.round((stats.completedContracts / stats.contractCount) * 100) : 0}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
