import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/helpers'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminUsers.css'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchDisputes()
  }, [])

  async function fetchDisputes() { 
    setLoading(true)
    try { 
      const { data, error } = await supabase 
        .from('contracts') 
        .select(` 
          *, 
          employer:employer_id(full_name, email), 
          talent:talent_id(full_name, email) 
        `) 
        .eq('status', 'disputed') 
        .order('updated_at', { ascending: false }) 
      
      if (error) throw error 
      setDisputes(data || []) 
    } catch (err) { 
      console.error('Disputes error:', err) 
      setDisputes([]) 
    } finally {
      setLoading(false)
    }
  } 

  const resolveDispute = async (contractId, resolution) => {
    const confirmMsg = resolution === 'completed' 
      ? 'Are you sure you want to release the funds to the talent?' 
      : 'Are you sure you want to refund the employer?'
    
    if (!window.confirm(confirmMsg)) return

    setProcessing(contractId)
    try {
      const updates = {
        status: resolution,
        dispute_resolved_at: new Date().toISOString(),
        payout_released: resolution === 'completed'
      }

      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId)

      if (error) throw error
      
      showToast(`Dispute resolved: ${resolution === 'completed' ? 'Funds released to talent' : 'Refunded to employer'}`)
      setDisputes(disputes.filter(d => d.id !== contractId))
    } catch (error) {
      console.error('Error resolving dispute:', error)
      showToast('Failed to resolve dispute', 'error')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="admin-disputes">
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Parties</th>
              <th>Amount</th>
              <th>Disputed On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                  No active disputes found.
                </td>
              </tr>
            ) : (
              disputes.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="user-name">{d.title}</div>
                    <code style={{ fontSize: '11px' }}>{d.id}</code>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      <strong>Employer:</strong> {d.employer?.full_name}<br />
                      <strong>Talent:</strong> {d.talent?.full_name}
                    </div>
                  </td>
                  <td>{formatCurrency(d.amount)}</td>
                  <td>{formatDate(d.updated_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => resolveDispute(d.id, 'completed')}
                        disabled={processing === d.id}
                        className="btn-primary btn-sm"
                        style={{ background: '#22c55e', borderColor: '#22c55e' }}
                      >
                        Release to Talent
                      </button>
                      <button
                        onClick={() => resolveDispute(d.id, 'cancelled')}
                        disabled={processing === d.id}
                        className="btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                      >
                        Refund Employer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
