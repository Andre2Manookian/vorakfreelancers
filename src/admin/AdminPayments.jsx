import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminUsers.css'

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalEarnings: 0,
    pendingPayouts: 0
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, employer:users!employer_id(full_name), talent:users!talent_id(full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setTransactions(data || [])

      // Calculate stats
      const totalVolume = data.reduce((sum, c) => sum + (c.amount || 0), 0)
      const totalEarnings = data.reduce((sum, c) => sum + ((c.amount || 0) - (c.talent_payout || 0)), 0)
      const pendingPayouts = data
        .filter(c => c.status === 'completed' && !c.payout_released)
        .reduce((sum, c) => sum + (c.talent_payout || 0), 0)

      setStats({ totalVolume, totalEarnings, pendingPayouts })
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Employer', 'Talent', 'Amount', 'Fee', 'Talent Payout', 'Status']
    const rows = transactions.map(t => [
      t.id,
      new Date(t.created_at).toLocaleDateString(),
      t.employer?.full_name,
      t.talent?.full_name,
      t.amount,
      (t.amount - t.talent_payout).toFixed(2),
      t.talent_payout,
      t.status
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n"
      + rows.map(e => e.join(',')).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `vorak_payments_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="admin-payments">
      <div className="admin-stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <span style={{ color: '#71717a', fontSize: '14px' }}>Total Transaction Volume</span>
          <h2 style={{ fontSize: '28px', marginTop: '8px' }}>{formatCurrency(stats.totalVolume)}</h2>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <span style={{ color: '#71717a', fontSize: '14px' }}>Platform Earnings (Fees)</span>
          <h2 style={{ fontSize: '28px', marginTop: '8px', color: '#22c55e' }}>{formatCurrency(stats.totalEarnings)}</h2>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <span style={{ color: '#71717a', fontSize: '14px' }}>Pending Talent Payouts</span>
          <h2 style={{ fontSize: '28px', marginTop: '8px', color: '#f59e0b' }}>{formatCurrency(stats.pendingPayouts)}</h2>
        </div>
      </div>

      <div className="admin-filters-bar" style={{ marginBottom: '20px', justifyContent: 'flex-end' }}>
        <button onClick={exportCSV} className="btn-ghost btn-sm">
          Export CSV
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Contract ID</th>
              <th>Employer</th>
              <th>Talent</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Payout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td><code style={{ fontSize: '11px' }}>{t.id.slice(0, 8)}...</code></td>
                <td>{t.employer?.full_name}</td>
                <td>{t.talent?.full_name}</td>
                <td>{formatCurrency(t.amount)}</td>
                <td style={{ color: '#22c55e' }}>{formatCurrency(t.amount - t.talent_payout)}</td>
                <td>{formatCurrency(t.talent_payout)}</td>
                <td>
                  <span className={`status-badge ${t.status}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
