import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiEye, FiEyeOff, FiCheck } from 'react-icons/fi'

export function Signup() {
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    email: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const passwordVal = form.password
  const checks = {
    min8: passwordVal.length >= 8,
    upper: /[A-Z]/.test(passwordVal),
    lower: /[a-z]/.test(passwordVal),
    number: /[0-9]/.test(passwordVal),
    symbol: /[^A-Za-z0-9]/.test(passwordVal),
  }
  const passed = Object.values(checks).filter(Boolean).length
  const strength = passwordVal.length === 0 ? 0 : passed <= 2 ? 1 : passed <= 3 ? 2 : passed === 4 ? 3 : 4
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#DC2626', '#F59E0B', '#3B82F6', '#00A86B']

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!checks.min8) { setError('Password does not meet security requirements'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)

    const { error: err } = await signup(form.email, form.password, {
      first_name: form.first_name,
      last_name: form.last_name,
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up in under a minute</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" value={form.first_name} onChange={e => update('first_name', e.target.value)} required placeholder="John" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" value={form.last_name} onChange={e => update('last_name', e.target.value)} required placeholder="Smith" />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="john@company.com" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                placeholder="Create a strong password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {form.password && (
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
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                required
                placeholder="Re-enter password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {form.confirmPassword && (
              <span className={`check ${form.password === form.confirmPassword && form.confirmPassword ? 'pass' : ''}`} style={{ marginTop: 4, display: 'inline-block' }}>
                <FiCheck size={12} /> Passwords match
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}