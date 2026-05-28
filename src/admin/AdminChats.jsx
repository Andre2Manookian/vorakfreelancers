import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminUsers.css'

export default function AdminChats() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users(full_name, email), contract:contracts(title)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(m => 
    m.content?.toLowerCase().includes(search.toLowerCase()) ||
    m.sender?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.contract?.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="admin-chats">
      <div className="admin-filters-bar" style={{ marginBottom: '20px' }}>
        <div className="search-group">
          <input 
            type="text" 
            placeholder="Search messages, users, or contracts..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Sender</th>
              <th>Contract</th>
              <th>Message</th>
              <th>Attachment</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((m) => (
              <tr key={m.id}>
                <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(m.created_at).toLocaleString()}
                </td>
                <td>
                  <div className="user-name">{m.sender?.full_name}</div>
                  <div className="user-email">{m.sender?.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.contract?.title || 'Unknown Contract'}
                  </div>
                </td>
                <td>
                  <div style={{ 
                    fontSize: '14px', 
                    maxWidth: '400px', 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {m.content}
                  </div>
                </td>
                <td>
                  {m.file_url ? (
                    <a 
                      href={m.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-ghost btn-sm"
                    >
                      View File
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
