import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { formatCurrency } from '../lib/currency'
import { useCurrency } from '../hooks/useCurrency'
import { db } from '../lib/neon'
import { useAuth } from '../contexts/AuthContext'

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'Denmark', 'Egypt', 'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana',
  'Greece', 'Hong Kong', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait', 'Lebanon',
  'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria',
  'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan',
  'Tanzania', 'Thailand', 'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Vietnam', 'Zambia', 'Zimbabwe',
]

export function Transfer() {
  const { user, profile } = useAuth()
  const { info } = useCurrency()
  const [recipientName, setRecipientName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [country, setCountry] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (!profile) return null
  const isInactive = !profile.is_active

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!recipientName.trim()) { setError('Please enter recipient name'); return }
    if (!bankName.trim()) { setError('Please enter bank name'); return }
    if (!accountNumber.trim()) { setError('Please enter account number'); return }
    if (!country) { setError('Please select a country'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Invalid amount'); return }
    if (amt > (profile?.balance || 0)) { setError('Insufficient balance'); return }
    setLoading(true)

    const { error: err } = await db.from('transactions').insert({
      sender_id: user?.id,
      receiver_id: null,
      amount: amt,
      type: 'transfer',
      status: 'pending',
      description: description || `Transfer to ${recipientName}`,
      reference: `TRF-${Date.now()}`,
      recipient_details: {
        recipient_name: recipientName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        country,
      },
    })

    if (!err) {
      await db.from('notifications').insert({
        user_id: user?.id,
        title: 'Transfer Submitted',
        message: `Your transfer of ${formatCurrency(amt, profile?.preferred_currency as any)} to ${recipientName} has been submitted and is pending approval.`,
        type: 'info',
      })
    }

    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Transfer submitted! Pending approval.')
    setRecipientName('')
    setBankName('')
    setAccountNumber('')
    setCountry('')
    setAmount('')
    setDescription('')
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <h1>Transfer Funds</h1>
        {isInactive && (
          <div className="inactive-banner">
            <h2>Account Inactive</h2>
            <p>Your account is currently inactive. Please contact customer support for assistance.</p>
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit} className="transfer-form">
          <div className="form-group">
            <label>Recipient Name</label>
            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Full name of recipient" required disabled={isInactive} />
          </div>
          <div className="form-group">
            <label>Bank Name</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Chase, HSBC, Access Bank" required disabled={isInactive} />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Recipient account number" required disabled={isInactive} />
          </div>
          <div className="form-group">
            <label>Country</label>
            <select value={country} onChange={e => setCountry(e.target.value)} className="form-select" required disabled={isInactive}>
              <option value="">Select country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Amount ({info.code})</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" step="0.01" required placeholder="0.00" disabled={isInactive} />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Purpose of transfer" disabled={isInactive} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || isInactive}>
            {loading ? 'Processing...' : 'Send Transfer'}
          </button>
        </form>
      </main>
    </div>
  )
}
