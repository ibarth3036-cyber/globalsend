import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, dbError } = useAuth()

  if (dbError && !user) {
    return (
      <div className="db-error-page">
        <div className="db-error-card">
          <h2>Connection Issue</h2>
          <p>{dbError}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '8px' }}>
            Please check that your Supabase project is active and try again.
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
