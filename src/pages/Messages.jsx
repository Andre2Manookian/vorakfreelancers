import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getInitials, formatRelativeTime, isUserOnline } from '../lib/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'
import './Messages.css'

export default function Messages() {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedContractId = searchParams.get('contract')
  const selectedUserId = searchParams.get('user')

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [targetUser, setTargetUser] = useState(null)
  const [contractCreating, setContractCreating] = useState(false)

  const chatEndRef = useRef(null)
  const messageInputRef = useRef(null)
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

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
    if (!selectedContractId && selectedUserId && conversations.length > 0) {
      const match = conversations.find(conv => {
        const other = conv.employer_id === currentUser.id ? conv.talent : conv.employer
        return other?.id === selectedUserId
      })
      if (match) {
        setSearchParams({ contract: match.id })
      }
    }
  }, [selectedContractId, selectedUserId, conversations, currentUser.id, setSearchParams])

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

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
  }, [selectedContractId, fetchConversations, scrollToBottom, currentUser.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // close mobile menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const fetchTargetUser = useCallback(async () => {
    if (!selectedUserId) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, last_seen')
        .eq('id', selectedUserId)
        .single()

      if (error) throw error
      setTargetUser(data)
    } catch (error) {
      console.error('Error fetching target user:', error)
      setTargetUser(null)
    }
  }, [selectedUserId])

  useEffect(() => {
    if (selectedUserId && !selectedContractId) {
      fetchTargetUser()
    } else {
      setTargetUser(null)
    }
  }, [selectedUserId, selectedContractId, fetchTargetUser])

  const createDirectContract = async () => {
    if (!selectedUserId || contractCreating) return null
    setContractCreating(true)

    try {
      const isEmployer = currentUser.role === 'employer'
      const employer_id = isEmployer ? currentUser.id : selectedUserId
      const talent_id = isEmployer ? selectedUserId : currentUser.id
      const title = `Chat with ${targetUser?.full_name || 'user'}`

      const { data, error } = await supabase.from('contracts').insert({
        type: 'service',
        employer_id,
        talent_id,
        title,
        description: `Direct chat between ${currentUser.full_name} and ${targetUser?.full_name || ''}`,
        amount: 0,
        commission_amount: 0,
        talent_payout: 0,
        status: 'active'
      }).select().single()

      if (error) throw error
      setSearchParams({ contract: data.id })
      // focus the message input after navigation to the new contract
      setTimeout(() => messageInputRef.current?.focus(), 200)
      return data.id
    } catch (error) {
      console.error('Error creating direct contract:', error)
      showToast('Unable to start chat. Please try again.', 'error')
      return null
    } finally {
      setContractCreating(false)
    }
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || sending) return

    let contractId = selectedContractId
    if (!contractId && selectedUserId) {
      contractId = await createDirectContract()
      if (!contractId) return
    }

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    try {
      const { error } = await supabase.from('messages').insert({
        contract_id: contractId,
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

  const selectedConversation = conversations.find(c => c.id === selectedContractId)
  const otherUser = selectedConversation
    ? (selectedConversation.employer_id === currentUser.id ? selectedConversation.talent : selectedConversation.employer)
    : targetUser

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
            <h2>{t('messages.title')}</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder={t('messages.searchPlaceholder')}
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
              <div className="empty-sidebar">{t('messages.noConversations')}</div>
            )}
          </div>
        </aside>

        <main className="chat-area">
          {(selectedContractId || otherUser) ? (
            <>
              <header className="chat-header">
                <div className="user-summary">
                  <div className="avatar-wrapper">
                    {otherUser?.avatar_url ? (
                      <img src={otherUser.avatar_url} alt="" className="user-avatar" />
                    ) : (
                      <div className="user-avatar-placeholder">{getInitials(otherUser?.full_name)}</div>
                    )}
                    {isUserOnline(otherUser?.last_seen) && <div className="online-indicator" />}
                  </div>
                  <div className="user-meta">
                    <h3>{otherUser?.full_name || t('messages.title')}</h3>
                    <p className="profile-status">
                      {otherUser ? (isUserOnline(otherUser.last_seen) ? t('messages.online') : t('messages.offline')) : t('messages.selectConversation')}
                    </p>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  {selectedContractId ? (
                    <Link to={`/contracts/${selectedContractId}`} className="btn-outline btn-sm">
                      {t('messages.viewContract')}
                    </Link>
                  ) : (
                    otherUser && (
                      <button type="button" className="btn-outline btn-sm" onClick={createDirectContract} disabled={contractCreating}>
                        {contractCreating ? t('messages.startingChat') : t('messages.startChat')}
                      </button>
                    )
                  )}

                  <div ref={menuRef} style={{position: 'relative'}}>
                    <button
                      className="mobile-menu-btn"
                      type="button"
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen(open => !open)}
                    >
                      <span className="hamburger">☰</span>
                    </button>
                    {menuOpen && (
                      <div className="mobile-menu-dropdown">
                        <Link to="/browse-services" onClick={() => setMenuOpen(false)}>{t('nav.browseServices')}</Link>
                        <Link to="/profile" onClick={() => setMenuOpen(false)}>{t('nav.profile')}</Link>
                        <Link to="/settings" onClick={() => setMenuOpen(false)}>{t('nav.settings')}</Link>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              <div className="chat-messages">
                {messagesLoading ? (
                  <LoadingSpinner />
                ) : messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isMine = msg.sender_id === currentUser.id
                    return (
                      <div key={msg.id || index} className={`message-row ${isMine ? 'mine' : 'their'}`}>
                        <div className={`message-bubble ${isMine ? 'mine' : 'their'}`}>
                          {msg.content && <span>{msg.content}</span>}
                          {msg.file_url && (
                            msg.file_type?.startsWith('image/') ? (
                              <img src={msg.file_url} alt="" className="message-file" />
                            ) : (
                              <a href={msg.file_url} target="_blank" rel="noreferrer" className="message-file-link">
                                {msg.file_name}
                              </a>
                            )
                          )}
                        </div>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="chat-empty-state">
                    {t('messages.chatPrompt')}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="chat-footer" onSubmit={handleSendMessage}>
                <textarea
                  ref={messageInputRef}
                  className="message-input"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  placeholder={t('messages.typeMessage')}
                  rows={1}
                />
                <button type="submit" className="send-button" disabled={!newMessage.trim() || sending}>
                  {sending ? <span className="button-spinner" /> : t('messages.sendMessage')}
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <h2>{t('messages.title')}</h2>
              <p>{t('messages.selectConversation')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
