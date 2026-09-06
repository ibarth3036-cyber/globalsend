import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { client } from '../lib/neon'
import { FiEye, FiEyeOff, FiCheck } from 'react-icons/fi'

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const tokenParam = searchParams.get('token') || ''

  const [token, setToken] = useState(tokenParam)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(Boolean(tokenParam))

  useEffect(() => {
    if (tokenParam) setToken(tokenParam)
    setReady(Boolean(tokenParam))
  }, [tokenParam])

  const checks = {
    min8: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const strength = password.length === 0 ? 0 : passed <= 2 ? 1 : passed <= 3 ? 2 : passed === 4 ? 3 : 4
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#DC2626', '#F59E0B', '#3B82F6', '#00A86B']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) { setError('The reset token is missing or expired. Request a new link.'); return }
    if (!checks.min8) { setError('Password does not meet security requirements'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    const { error: err } = await client.auth.resetPassword({ newPassword: password, token })
    setLoading(false)

    if (err) { setError(err.message || 'Unable to reset the password. Request a new link.'); return }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 2500)
  }

  if (!ready) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p>Open the reset link from your email to set a new password. If it expired, request a new one.</p>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/forgot-password')}>
            Request a Reset Link
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <FiCheck size={48} color="#00A86B" style={{ marginBottom: '16px' }} />
            <h2>Password Updated</h2>
            <p>Your password has been successfully reset. Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Set New Password</h2>
          <p>Reset link verified — choose a new password.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Create a strong password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {password && (
              <>
                <div className="password-strength-bar">
                  <div className="password-strength-fill" style={{ width: `${(strength / 4) * 100}%`, background: strengthColor[strength] }} />
                </div>
                <span className="password-strength-label" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
              </>
            )}
            <div className="password-checks">
              <span className={`check ${checks.min8 ? 'pass' : ''}`}><FiCheck size={12} /> 8+ characters</span>
              <span className={`check ${checks.upper ? 'pass' : ''}`}><FiCheck size={12} /> Uppercase</span>
              <span className={`check ${checks.lower ? 'pass' : ''}`}><FiCheck size={12} /> Lowercase</span>
              <span className={`check ${checks.number ? 'pass' : ''}`}><FiCheck size={12} /> Number</span>
              <span className={`check ${checks.symbol ? 'pass' : ''}`}><FiCheck size={12} /> Symbol</span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {confirmPassword && (
              <span className={`check ${password === confirmPassword && confirmPassword ? 'pass' : ''}`} style={{ marginTop: 4, display: 'inline-block' }}>
                <FiCheck size={12} /> Passwords match
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}