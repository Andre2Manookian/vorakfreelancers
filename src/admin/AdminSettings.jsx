import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminUsers.css'

export default function AdminSettings() {
  const [commission, setCommission] = useState(8) 
  const [maintenanceMode, setMaintenanceMode] = 
    useState(false) 
  const [announcementActive, setAnnouncementActive] = 
    useState(false) 
  const [announcementText, setAnnouncementText] = 
    useState('') 
  const [saving, setSaving] = useState(false) 
  const [success, setSuccess] = useState('') 
  const [error, setError] = useState('') 
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    fetchSettings().finally(() => setLoading(false))
  }, [])

  async function fetchSettings() { 
    try { 
      const { data, error } = await supabase 
        .from('platform_settings') 
        .select('key, value') 
  
      if (error) { 
        console.error('Settings error:', error) 
        return 
      } 
  
      const map = {} 
      data?.forEach(s => { map[s.key] = s.value }) 
      
      setCommission( 
        parseFloat(map.commission_rate) || 8 
      ) 
      setMaintenanceMode( 
        map.maintenance_mode === 'true' 
      ) 
      setAnnouncementActive( 
        map.announcement_active === 'true' 
      ) 
      setAnnouncementText( 
        map.announcement_text || '' 
      ) 
    } catch (err) { 
      console.error('Settings catch:', err) 
    } 
  } 
  
  async function saveSettings() { 
    setSaving(true) 
    try { 
      const updates = [ 
        { key: 'commission_rate', 
          value: commission.toString() }, 
        { key: 'maintenance_mode', 
          value: maintenanceMode.toString() }, 
        { key: 'announcement_active', 
          value: announcementActive.toString() }, 
        { key: 'announcement_text', 
          value: announcementText }, 
      ] 
  
      for (const update of updates) { 
        await supabase 
          .from('platform_settings') 
          .upsert(update, { onConflict: 'key' }) 
      } 
  
      setSuccess('Settings saved successfully') 
      showToast('Settings saved successfully')
      setTimeout(() => setSuccess(''), 3000) 
    } catch (err) { 
      console.error('Save settings error:', err) 
      setError('Failed to save settings') 
      showToast('Failed to save settings', 'error')
    } finally { 
      setSaving(false) 
    } 
  } 

  if (loading) return <LoadingSpinner />

  return (
    <div className="admin-settings" style={{ maxWidth: '600px' }}>
      <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
        {success && <div style={{ color: '#22c55e', marginBottom: '16px' }}>{success}</div>}
        {error && <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#71717a', fontSize: '14px' }}>Commission Rate (%)</label>
          <input 
            type="number" 
            value={commission}
            onChange={e => setCommission(parseFloat(e.target.value))}
            style={{ width: '100%', padding: '12px', background: '#0F0F0E', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#71717a', fontSize: '14px' }}>Announcement Text</label>
          <textarea 
            value={announcementText}
            onChange={e => setAnnouncementText(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#0F0F0E', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', minHeight: '100px' }}
          />
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="announcementActive"
            checked={announcementActive}
            onChange={e => setAnnouncementActive(e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
          <label htmlFor="announcementActive" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Enable Announcement</label>
        </div>

        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="maintenance"
            checked={maintenanceMode}
            onChange={e => setMaintenanceMode(e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
          <label htmlFor="maintenance" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Enable Maintenance Mode</label>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
