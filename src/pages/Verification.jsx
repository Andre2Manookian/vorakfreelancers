import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { uploadFile } from '../lib/cloudinary'
import './Verification.css'

export default function Verification() {
  const { currentUser, fetchProfile } = useAuth()
  const { showToast } = useToast()
  
  const [documentUrl, setDocumentUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleFileUpload = async (file, type) => {
    setUploading(true)
    setError('')
    try {
      const { url } = await uploadFile(file, 'verifications')
      if (type === 'id') setDocumentUrl(url)
      else setSelfieUrl(url)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() { 
    if (!documentUrl) { 
      setError('Please upload your ID document') 
      return 
    } 
    if (!selfieUrl) { 
      setError('Please upload your selfie') 
      return 
    } 
  
    setLoading(true) 
    setError('') 
  
    try { 
      const { error: updateError } = await supabase 
        .from('users') 
        .update({ 
          id_document_url: documentUrl, 
          selfie_url: selfieUrl, 
          verification_status: 'pending' 
        }) 
        .eq('id', currentUser.id) 
  
      if (updateError) throw updateError 
  
      setSubmitted(true) 
      setSuccess( 
        'Submitted successfully! ' + 
        'We will review within 24 hours.' 
      ) 
      if (fetchProfile) await fetchProfile(currentUser.id)
    } catch (err) { 
      console.error('Verification error:', err) 
      setError( 
        'Failed to submit verification. ' + 
        'Please try again.' 
      ) 
    } finally { 
      setLoading(false) 
    } 
  } 

  if (submitted) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="verification-form-card">
            <div className="pending-state">
              <div className="pending-icon" style={{ color: '#22c55e' }}>✓</div>
              <h3>{success}</h3>
              <p>You can close this page now.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="verification-page">
      <div className="verification-container">
        <header className="verification-header">
          <h1>Get Verified ✅</h1>
          <p className="subtitle">Verify your identity to build trust and unlock more opportunities.</p>
        </header>

        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🛡️</div>
            <h3>Build Trust</h3>
            <p>Clients prefer working with verified professionals.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💎</div>
            <h3>Premium Access</h3>
            <p>Access high-value jobs reserved for verified talent.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🚀</div>
            <h3>Faster Payouts</h3>
            <p>Verified accounts get priority withdrawal processing.</p>
          </div>
        </div>

        <div className="verification-form-card">
          <div className="current-status">
            <span>Current Status:</span>
            <span className={`status-badge ${currentUser.verification_status || 'unverified'}`}>
              {currentUser.verification_status || 'Not Verified'}
            </span>
          </div>

          {(!currentUser.verification_status || currentUser.verification_status === 'rejected') ? (
            <div className="upload-sections">
              {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
              
              <div className="upload-item">
                <div className="item-number">1</div>
                <div className="item-content">
                  <h3>Upload Passport or National ID</h3>
                  <p>Make sure the photo is clear and all details are visible.</p>
                  <input 
                    type="file" 
                    onChange={e => handleFileUpload(e.target.files[0], 'id')} 
                    accept="image/*,application/pdf" 
                    className="file-input"
                    disabled={uploading}
                  />
                  {documentUrl && <div className="file-ready">✓ ID Uploaded</div>}
                </div>
              </div>

              <div className="upload-item">
                <div className="item-number">2</div>
                <div className="item-content">
                  <h3>Upload a Selfie with your ID</h3>
                  <p>Hold your document next to your face. Both should be clearly visible.</p>
                  <input 
                    type="file" 
                    onChange={e => handleFileUpload(e.target.files[0], 'selfie')} 
                    accept="image/*" 
                    className="file-input"
                    disabled={uploading}
                  />
                  {selfieUrl && <div className="file-ready">✓ Selfie Uploaded</div>}
                </div>
              </div>

              <button 
                onClick={handleSubmit} 
                className="btn-primary full-width large" 
                disabled={loading || uploading || !documentUrl || !selfieUrl}
              >
                {loading ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit for Review'}
              </button>
            </div>
          ) : (
            <div className="pending-state">
              <div className="pending-icon">⏳</div>
              <h3>Under Review</h3>
              <p>Our team is reviewing your documents. We will notify you once completed (usually within 24 hours).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
