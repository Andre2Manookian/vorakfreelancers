import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, CONTRACT_STATUS_COLORS } from '../lib/helpers'
import { useToast } from '../components/Toast'
import './AdminContracts.css'

export default function AdminContracts() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const { showToast } = useToast()

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('contracts')
        .select('*, employer:users!employer_id(full_name), talent:users!talent_id(full_name)')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`title.ilike.%${search}%,id.ilike.%${search}%`)
      }
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter.toLowerCase())
      }

      const { data, error } = await query
      if (error) throw error
      setContracts(data || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const confirmPayment = async (id) => {
    if (!window.confirm('Confirm that payment has been received for this contract?')) return

    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
      showToast('Payment confirmed. Contract is now active.')
      fetchContracts()
    } catch (error) {
      console.error('Confirm error:', error)
      showToast('Failed to confirm payment', 'error')
    }
  }

  const releasePayout = async (contract) => {
    if (!window.confirm(`Release ${formatCurrency(contract.talent_payout)} to ${contract.talent?.full_name}? This will add it to their balance.`)) return

    try {
      // Step 1: mark payout released on contract
      const { error: contractErr } = await supabase
        .from('contracts')
        .update({ payout_released: true })
        .eq('id', contract.id)

      if (contractErr) {
        console.error('Step 1 contract update error:', contractErr)
        throw contractErr
      }

      // Step 2: fetch talent's current balance
      const { data: userData, error: fetchErr } = await supabase
        .from('users')
        .select('balance, total_earned')
        .eq('id', contract.talent_id)
        .single()

      if (fetchErr) {
        console.error('Step 2 user fetch error:', fetchErr)
      } else if (userData) {
        // Step 3: increment balance and total_earned
        const { error: balanceErr } = await supabase
          .from('users')
          .update({
            balance: (Number(userData.balance) || 0) + Number(contract.talent_payout),
            total_earned: (Number(userData.total_earned) || 0) + Number(contract.talent_payout),
          })
          .eq('id', contract.talent_id)

        if (balanceErr) console.error('Step 3 balance update error:', balanceErr)
      }

      // Step 4: notify talent (non-blocking)
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: contract.talent_id,
          type: 'payment',
          title: '💰 Payment released!',
          message: `${formatCurrency(contract.talent_payout)} has been added to your available balance.`,
          link: '/withdrawal',
        })

      if (notifErr) console.error('Step 4 notification error:', notifErr)

      showToast('Payout released to talent balance!')
      fetchContracts()
    } catch (error) {
      console.error('Release payout failed:', error)
      showToast('Failed to release payout', 'error')
    }
  }

  return (
    <div className="admin-contracts">
      <div className="admin-filters-bar">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search title or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="awaiting_confirmation">Awaiting Confirmation</option>
            <option value="active">Active</option>
            <option value="work_submitted">Work Submitted</option>
            <option value="completed">Completed</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Participants</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8">Loading contracts...</td></tr>
            ) : contracts.length > 0 ? (
              contracts.map(contract => (
                <tr key={contract.id}>
                  <td>
                    <div className="contract-cell">
                      <div className="contract-title">{contract.title}</div>
                      <div className="contract-id-sm">#{contract.id.slice(0, 8)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="participants-cell">
                      <div><span className="label">E:</span> {contract.employer?.full_name}</div>
                      <div><span className="label">T:</span> {contract.talent?.full_name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="amount-cell">
                      <div className="total">{formatCurrency(contract.amount)}</div>
                      <div className="payout">Payout: {formatCurrency(contract.talent_payout)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                      {contract.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(contract.created_at)}</td>
                  <td>
                    <div className="actions-cell">
                      {contract.status === 'awaiting_confirmation' && (
                        <button onClick={() => confirmPayment(contract.id)} className="btn btn-sm btn-primary">Confirm Pay</button>
                      )}
                      {contract.status === 'completed' && !contract.payout_released && (
                        <button onClick={() => releasePayout(contract)} className="btn btn-sm btn-teal">Release Payout</button>
                      )}
                      <button className="btn-icon">📝</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center py-8">No contracts found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
