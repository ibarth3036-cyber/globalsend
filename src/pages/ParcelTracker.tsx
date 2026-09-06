import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'

export function ParcelTracker() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [trackingCode, setTrackingCode] = useState('')
  const [error, setError] = useState('')

  if (!profile) return null
  const isInactive = !profile.is_active

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!trackingCode.trim()) { setError('Enter a tracking number'); return }
    const code = trackingCode.trim().toUpperCase()
    navigate(`/track/${code}`)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main" style={{ padding: '20px' }}>
        {isInactive && (
          <div className="inactive-banner">
            <h2>Account Inactive</h2>
            <p>Your account is currently inactive. Please contact customer support for assistance.</p>
          </div>
        )}
        <div style={{ 
          background: 'linear-gradient(135deg, #1B3A5C 0%, #2C5282 100%)', 
          padding: '32px 24px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          color: 'white'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Track Your Parcel</h1>
          <p style={{ margin: '0 0 20px 0', opacity: 0.9, fontSize: '0.95rem' }}>Enter your tracking number to get real-time updates</p>
          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '12px', maxWidth: '600px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '1.1rem' }} />
              <input 
                type="text" 
                value={trackingCode} 
                onChange={e => setTrackingCode(e.target.value)} 
                placeholder="e.g., FX-2024-0001" 
                disabled={isInactive}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  fontSize: '1rem',
                  border: 'none',
                  borderRadius: '12px',
                  outline: 'none',
                  backgroundColor: 'white',
                  color: '#111',
                  cursor: isInactive ? 'not-allowed' : 'text',
                  opacity: isInactive ? 0.7 : 1
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={isInactive}
              style={{
                padding: '14px 28px',
                backgroundColor: '#C9A84C',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: isInactive ? 'not-allowed' : 'pointer',
                flex: '0 0 auto',
                whiteSpace: 'nowrap',
                opacity: isInactive ? 0.7 : 1
              }}
            >
              Track
            </button>
          </form>
        </div>

        {error && (
          <div style={{ 
            padding: '16px 20px', 
            backgroundColor: '#FEF2F2', 
            color: '#DC2626', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
