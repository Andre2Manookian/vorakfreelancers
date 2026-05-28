import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getInitials, formatRelativeTime, isUserOnline } from '../lib/helpers'
import { uploadFile } from '../lib/cloudinary'
import LoadingSpinner from '../components/LoadingSpinner'
import './Messages.css'

export default function Messages() {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedContractId = searchParams.get('contract')

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  const chatEndRef = useRef(null)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all contracts where user is participant
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          employer:users!employer_id(id, full_name, avatar_url, last_seen),
          talent:users!talent_id(id, full_name, avatar_url, last_seen),
          last_message:messages(*)
        `)
        .or(`employer_id.eq.${currentUser.id},talent_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter for contracts that have messages or are active
      setConversations(contracts || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser.id])

  const fetchMessages = useCallback(async (contractId) => {
    setMessagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('contract_id', contractId)
        .neq('sender_id', currentUser.id)

    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }, [currentUser.id])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedContractId) {
      fetchMessages(selectedContractId)
    } else {
      setMessages([])
    }
  }, [selectedContractId, fetchMessages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.new.contract_id === selectedContractId) {
            setMessages((prev) => [...prev, payload.new])
            scrollToBottom()
          }
          // Refresh conversation list to show last message
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedContractId, fetchConversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || !selectedContractId || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    try {
      const { error } = await supabase.from('messages').insert({
        contract_id: selectedContractId,
        sender_id: currentUser.id,
        content,
        created_at: new Date().toISOString(),
      })
      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
      showToast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedContractId) return

    setUploading(true)
    try {
      const { url } = await uploadFile(file, 'messages')
      const { error } = await supabase.from('messages').insert({
        contract_id: selectedContractId,
        sender_id: currentUser.id,
        file_url: url,
        file_name: file.name,
        file_type: file.type
      })
      if (error) throw error
    } catch (error) {
      console.error('Error uploading file:', error)
      showToast('File upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedContractId)
  const otherUser = selectedConversation
    ? (selectedConversation.employer_id === currentUser.id ? selectedConversation.talent : selectedConversation.employer)
    : null

  const filteredConversations = conversations.filter(c => {
    const other = c.employer_id === currentUser.id ? c.talent : c.employer
    return other?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase())
  })

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="messages-page">
      <div className="messages-layout">
        <aside className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="conversations-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conv => {
                const other = conv.employer_id === currentUser.id ? conv.talent : conv.employer
                const isOnline = isUserOnline(other?.last_seen)
                const isActive = selectedContractId === conv.id

                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSearchParams({ contract: conv.id })}
                  >
                    <div className="avatar-wrapper">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="user-avatar" />
                      ) : (
                        <div className="user-avatar-placeholder">{getInitials(other?.full_name)}</div>
                      )}
                      {isOnline && <div className="online-indicator" />}
                    </div>
                    <div className="conv-info">
                      <div className="conv-header">
                        <span className="user-name">{other?.full_name}</span>
                        {conv.last_message && (
                          <span className="conv-time">{formatRelativeTime(conv.last_message.created_at)}</span>
                        )}
                      </div>
                      <div className="conv-title">{conv.title}</div>
                      <div className="conv-preview">
                        {conv.last_message?.content || (conv.last_message?.file_url ? 'Sent a file' : 'No messages yet')}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-sidebar">No conversations found</div>
            )}
          </div>
        </aside>

        <main className="chat-area">
          {selectedContractId ? (
            <>
              <header className="chat-header">
                <div className="other-user-info">
                  <div className="avatar-wrapper">
                    {otherUser?.avatar_url ? (
                      <img src={otherUser.avatar_url} alt="" className="user-avatar" />
                    ) : (
                      <div className="user-avatar-placeholder">{getInitials(otherUser?.full_name)}</div>
                    )}
                    {isUserOnline(otherUser?.last_seen) && <div className="online-indicator" />}
                  </div>
                  <div>
                    <h3>{otherUser?.full_name}</h3>
                    <p className="text-secondary">{isUserOnline(otherUser?.last_seen) ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <Link to={`/contracts/${selectedContractId}`} className="btn-outline btn-sm">
                  View Contract
                </Link>
              </header>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messagesLoading ? (
                  <LoadingSpinner />
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.sender_id === currentUser.id
                    return (
                      <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '68%', background: isMine ? '#0F6E56' : 'var(--bg-secondary)', color: isMine ? 'white' : 'var(--text-primary)', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', border: isMine ? 'none' : '1px solid var(--border)' }}>
                          {msg.content && <span>{msg.content}</span>}
                          {msg.file_url && (
                            msg.file_type?.startsWith('image/') ? (
                              <img src={msg.file_url} alt="" style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }} />
                            ) : (
                              <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ color: isMine ? 'rgba(255,255,255,0.9)' : 'var(--accent)', textDecoration: 'underline' }}>{msg.file_name}</a>
                            )
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', paddingLeft: '4px', paddingRight: '4px' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  placeholder="Type a message... (Enter to send)"
                  rows={1}
                  style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto' }}
                  onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  style={{ width: '44px', height: '44px', borderRadius: '10px', background: newMessage.trim() ? '#0F6E56' : 'var(--border)', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s', flexShrink: 0 }}
                >
                  {sending ? (
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : '➤'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <h2>Your Messages</h2>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
