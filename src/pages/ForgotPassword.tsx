import { useState } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../lib/neon'
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await client.auth.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message || 'Unable to send the reset email'); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <FiCheck size={48} color="#00A86B" style={{ marginBottom: '16px' }} />
            <h2>Check Your Email</h2>
            <p>We sent a password reset link to <strong>{email}</strong>. Follow the link to choose a new password.</p>
          </div>
          <p style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#1B3A5C', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font)', fontSize: '0.85rem' }}
              onClick={() => { setSent(false); setError('') }}
            >
              Change email or try again
            </button>
          </p>
          <p className="auth-footer" style={{ marginTop: '16px' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1B3A5C', textDecoration: 'none' }}>
              <FiArrowLeft size={14} /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRequest}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <FiMail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="john@company.com"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '16px' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1B3A5C', textDecoration: 'none' }}>
            <FiArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}