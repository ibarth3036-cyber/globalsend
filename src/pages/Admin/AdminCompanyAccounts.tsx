import { useEffect, useState } from 'react'
import { db } from '../../lib/neon'
import { uploadFile, BUCKET_PROOFS } from '../../lib/storage'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi'

interface CompanyAccount {
  id: string
  image_url: string | null
  account_name: string
  account_number: string
  bank_name: string
  is_active: boolean
  sort_order: number
  account_type: 'bank' | 'crypto'
  crypto_network: string | null
}

export function AdminCompanyAccounts() {
  const [accounts, setAccounts] = useState<CompanyAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<{ 
    account_name: string; 
    account_number: string; 
    bank_name: string; 
    image_url: string; 
    account_type: 'bank' | 'crypto'; 
    crypto_network: string 
  }>({ 
    account_name: '', 
    account_number: '', 
    bank_name: '', 
    image_url: '', 
    account_type: 'bank', 
    crypto_network: '' 
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { loadAccounts() }, [])

  async function loadAccounts() {
    const { data } = await db.from('company_accounts').select('*').order('sort_order')
    setAccounts(data || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ account_name: '', account_number: '', bank_name: '', image_url: '', account_type: 'bank', crypto_network: '' })
    setImageFile(null)
    setEditId(null)
    setShowForm(false)
  }

  function openEdit(acc: CompanyAccount) {
    setEditId(acc.id)
    setForm({ 
      account_name: acc.account_name, 
      account_number: acc.account_number, 
      bank_name: acc.bank_name, 
      image_url: acc.image_url || '', 
      account_type: acc.account_type || 'bank', 
      crypto_network: acc.crypto_network || '' 
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let imageUrl = form.image_url

    if (imageFile) {
      const { publicUrl } = await uploadFile(BUCKET_PROOFS, 'company_accounts', imageFile)
      if (publicUrl) imageUrl = publicUrl
    }

    if (editId) {
      await db.from('company_accounts').update({
        account_name: form.account_name,
        account_number: form.account_number,
        bank_name: form.bank_name,
        image_url: imageUrl,
        account_type: form.account_type,
        crypto_network: form.account_type === 'crypto' ? form.crypto_network : null
      }).eq('id', editId)
    } else {
      const { data: existing } = await db.from('company_accounts').select('sort_order').order('sort_order', { ascending: false }).limit(1)
      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
      await db.from('company_accounts').insert({
        account_name: form.account_name,
        account_number: form.account_number,
        bank_name: form.bank_name,
        image_url: imageUrl,
        sort_order: nextOrder,
        account_type: form.account_type,
        crypto_network: form.account_type === 'crypto' ? form.crypto_network : null
      })
    }

    resetForm()
    loadAccounts()
  }

  async function deleteAccount(id: string) {
    if (!confirm('Delete this account?')) return
    await db.from('company_accounts').delete().eq('id', id)
    loadAccounts()
  }

  async function toggleActive(id: string, current: boolean) {
    await db.from('company_accounts').update({ is_active: !current }).eq('id', id)
    loadAccounts()
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return <div className="admin-page"><div className="loading-screen"><div className="spinner" /></div></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Company Accounts</h1>
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Overview</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/transactions" className="admin-nav-link">Transactions</Link>
          <Link to="/admin/tracking" className="admin-nav-link">Tracking</Link>
          <Link to="/admin/accounts" className="admin-nav-link active">Accounts</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <FiPlus /> Add Account
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editId ? 'Edit Account' : 'New Account'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Account Type</label>
              <select value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value as 'bank' | 'crypto' })} className="form-select">
                <option value="bank">Bank Transfer</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Account Title</label>
              <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder={form.account_type === 'bank' ? 'e.g., Chase Bank' : 'e.g., BTC Wallet'} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder={form.account_type === 'bank' ? 'e.g., Main company account' : 'e.g., Bitcoin deposit address'} required />
            </div>
            <div className="form-group">
              <label>{form.account_type === 'bank' ? 'Account Number' : 'Crypto Address'}</label>
              <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} placeholder={form.account_type === 'bank' ? 'Account number' : 'Wallet address'} required />
            </div>
            {form.account_type === 'crypto' && (
              <div className="form-group">
                <label>Network</label>
                <input type="text" value={form.crypto_network} onChange={e => setForm({ ...form, crypto_network: e.target.value })} placeholder="e.g., Bitcoin, Ethereum, USDT TRC20" required />
              </div>
            )}
            <div className="form-group">
              <label>Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              {form.image_url && !imageFile && <small>Current: <a href={form.image_url} target="_blank" rel="noreferrer">View</a></small>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-outline" onClick={resetForm} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-accounts-grid">
        {accounts.map(acc => (
          <div key={acc.id} className={`admin-account-card ${!acc.is_active ? 'inactive' : ''}`}>
            <div className="admin-account-img">
              {acc.image_url ? (
                <img src={acc.image_url} alt={acc.bank_name} />
              ) : (
                <div className="admin-account-no-img">No Image</div>
              )}
            </div>
            <div className="admin-account-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0 }}>{acc.bank_name}</h3>
                <span className="badge" style={{ backgroundColor: acc.account_type === 'crypto' ? '#1B3A5C' : '#00A86B', color: 'white' }}>
                  {acc.account_type.charAt(0).toUpperCase() + acc.account_type.slice(1)}
                </span>
              </div>
              <p className="admin-account-desc">{acc.account_name}</p>
              {acc.account_type === 'crypto' && acc.crypto_network && <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', margin: '4px 0' }}>Network: {acc.crypto_network}</p>}
              <div className="admin-account-number-row">
                <code className="crypto-address-sm">{acc.account_number}</code>
                <button className="icon-btn" onClick={() => copyToClipboard(acc.account_number, acc.id)}>
                  {copiedId === acc.id ? <FiCheck color="#00A86B" /> : <FiCopy size={16} />}
                </button>
              </div>
              <span className={`badge ${acc.is_active ? 'success' : 'danger'}`}>{acc.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="admin-account-actions">
              <button className="icon-btn" onClick={() => toggleActive(acc.id, acc.is_active)} title="Toggle active">
                {acc.is_active ? 'Hide' : 'Show'}
              </button>
              <button className="icon-btn" onClick={() => openEdit(acc)} title="Edit"><FiEdit2 size={18} /></button>
              <button className="icon-btn" onClick={() => deleteAccount(acc.id)} title="Delete" style={{ color: '#DC2626' }}><FiTrash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
