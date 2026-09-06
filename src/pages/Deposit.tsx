import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { SearchSelect } from '../components/SearchSelect'
import { formatCurrency } from '../lib/currency'
import { useCurrency } from '../hooks/useCurrency'
import { db } from '../lib/neon'
import { uploadFile, BUCKET_PROOFS } from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'
import { FiCopy, FiCheck, FiCreditCard} from 'react-icons/fi'
import { ImageUpload } from '../components/ImageUpload'

interface CompanyAccount {
  id: string
  image_url: string | null
  account_name: string
  account_number: string
  bank_name: string
  account_type: 'bank' | 'crypto'
  crypto_network: string | null
  is_active: boolean
}

export function Deposit() {
  const { user, profile } = useAuth()
  const { format: formatCurr, info } = useCurrency()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<CompanyAccount[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [depositMethod, setDepositMethod] = useState<'bank' | 'giftcard'>('bank')
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [giftcardFront, setGiftcardFront] = useState<File | null>(null)
  const [giftcardBack, setGiftcardBack] = useState<File | null>(null)

  const isInactive = !profile?.is_active

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    const { data } = await db
      .from('company_accounts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    setAccounts(data || [])
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setError('Invalid amount')
      return
    }

    if (depositMethod === 'giftcard' && (!giftcardFront || !giftcardBack)) {
      setError('Please upload both front and back of the gift card')
      return
    }

    if (depositMethod === 'bank' && !selectedAccount) {
      setError('Please select an account')
      return
    }

    setLoading(true)

    try {
      let giftcardFrontUrl = ''
      let giftcardBackUrl = ''
      let cryptoAddress = ''
      let cryptoNetwork = ''

      if (depositMethod === 'giftcard') {
        if (giftcardFront) {
          const { publicUrl, error: uploadErr } = await uploadFile(BUCKET_PROOFS, 'giftcards', giftcardFront)
          if (uploadErr) throw new Error(uploadErr)
          giftcardFrontUrl = publicUrl || ''
        }

        if (giftcardBack) {
          const { publicUrl, error: uploadErr } = await uploadFile(BUCKET_PROOFS, 'giftcards', giftcardBack)
          if (uploadErr) throw new Error(uploadErr)
          giftcardBackUrl = publicUrl || ''
        }
      }

      if (depositMethod === 'bank' && selectedAccount) {
        const account = accounts.find(a => a.id === selectedAccount)
        if (account) {
          cryptoAddress = account.account_number
          cryptoNetwork = account.crypto_network || ''
        }
      }

      const { error: err } = await db.from('transactions').insert({
        sender_id: user?.id,
        amount: amt,
        type: 'deposit',
        status: 'processing',
        reference: `DEP-${Date.now()}`,
        description: `${depositMethod === 'bank' ? 'Crypto' : depositMethod.charAt(0).toUpperCase() + depositMethod.slice(1)} deposit of ${formatCurr(amt)}`,
        deposit_method: depositMethod === 'bank' ? 'crypto' : depositMethod,
        giftcard_front_url: giftcardFrontUrl || null,
        giftcard_back_url: giftcardBackUrl || null,
        crypto_address: cryptoAddress || null,
        crypto_network: cryptoNetwork || null,
      })

      if (err) throw err

      await db.from('notifications').insert({
        user_id: user?.id,
        title: 'Deposit Processing',
        message: `Your ${depositMethod === 'bank' ? 'crypto' : depositMethod} deposit of ${formatCurrency(amt, profile?.preferred_currency as any)} is being processed. You will receive a confirmation once it has been approved.`,
        type: 'info',
      })

      setSuccess('Deposit processing. You will receive a confirmation once approved.')
      setAmount('')
      setGiftcardFront(null)
      setGiftcardBack(null)
      setSelectedAccount(null)
    } catch (err: any) {
      setError(err.message || 'Deposit failed')
    }

    setLoading(false)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <h1>Deposit Funds</h1>
        {isInactive && (
          <div className="inactive-banner">
            <h2>Account Inactive</h2>
            <p>Your account is currently inactive. Please contact customer support for assistance.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${depositMethod === 'bank' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDepositMethod('bank')}
            disabled={isInactive}
          >
            <FiCreditCard size={16} style={{ marginRight: '8px' }} />
            Crypto
          </button>
          <button
            type="button"
            className={`btn ${depositMethod === 'giftcard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDepositMethod('giftcard')}
            disabled={isInactive}
          >
            <FiCreditCard size={16} style={{ marginRight: '8px' }} />
            Gift Card
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="deposit-form">
            {depositMethod === 'bank' && (
              <div style={{ marginBottom: '24px' }}>
                <SearchSelect
                  label="Select Account"
                  placeholder="-- Select an account --"
                  value={selectedAccount || ''}
                  onChange={setSelectedAccount}
                  options={accounts
                    .filter(acc => acc.is_active)
                    .map(acc => ({
                      value: acc.id,
                      label: `${acc.bank_name}${acc.crypto_network ? ` (${acc.crypto_network})` : ''}`,
                    }))}
                />
                <div className="company-accounts-grid">
                  {accounts
                    .filter(acc => acc.is_active)
                    .map(acc => (
                      <div
                        key={acc.id}
                        className={`company-account-card deposit-card ${selectedAccount === acc.id ? 'selected' : ''}`}
                        onClick={() => !isInactive && setSelectedAccount(acc.id)}
                        style={{ cursor: isInactive ? 'not-allowed' : 'pointer' }}
                      >
                        {acc.image_url && (
                          <div className="company-account-image deposit-image">
                            <img src={acc.image_url} alt={acc.bank_name} />
                          </div>
                        )}
                        <div className="company-account-details">
                          <h4>{acc.bank_name}</h4>
                          <p className="company-account-desc">{acc.account_name}</p>
                          {acc.crypto_network && <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Network: {acc.crypto_network}</p>}
                          <div className="company-account-number-row">
                            <span className="company-account-number crypto-address">{acc.account_number}</span>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(acc.account_number, acc.id);
                              }}
                              title="Copy address"
                              disabled={isInactive}
                            >
                              {copiedId === acc.id ? <FiCheck color="#00A86B" /> : <FiCopy />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {depositMethod === 'giftcard' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <ImageUpload
                  label="Gift Card (Front)"
                  onFile={setGiftcardFront}
                  crop={false}
                />
                <ImageUpload
                  label="Gift Card (Back)"
                  onFile={setGiftcardBack}
                  crop={false}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Amount ({info.code})</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
              placeholder="0.00"
              disabled={isInactive}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || isInactive}
            style={{ marginTop: 16 }}
          >
            {loading ? 'Submitting...' : 'Submit Deposit'}
          </button>
        </form>
      </main>
    </div>
  )
}
