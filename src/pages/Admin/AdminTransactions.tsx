import { useEffect, useState } from 'react'
import { db, getUserId } from '../../lib/neon'
import { formatCurrency } from '../../lib/currency'
import { Link } from 'react-router-dom'
import { FiEye } from 'react-icons/fi'

interface Transaction {
  id: string
  sender_id: string
  receiver_id: string | null
  amount: number
  type: string
  status: string
  description: string | null
  reference: string
  created_at: string
  proof_url: string | null
  deposit_method: 'bank' | 'crypto' | 'giftcard' | null
  giftcard_front_url: string | null
  giftcard_back_url: string | null
  crypto_address: string | null
  crypto_network: string | null
  recipient_details: {
    recipient_name: string
    bank_name: string
    account_number: string
    country: string
  } | null
  sender: { first_name: string; last_name: string; email: string; preferred_currency: string }
  receiver: { first_name: string; last_name: string; email: string; preferred_currency: string } | null
}

interface UpgradeRequest {
  id: string
  user_id: string
  current_tier: string
  requested_tier: string
  status: string
  created_at: string
  profile: { first_name: string; last_name: string; email: string }
}

const tierColors: Record<string, string> = {
  basic: '#6B7280', gold: '#F59E0B', premium: '#3B82F6', vip: '#8B5CF6', vvip: '#DC2626',
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'transactions' | 'upgrades'>('transactions')
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null)

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions()
    else loadUpgradeRequests()
  }, [filter, activeTab])

  async function loadTransactions() {
    setLoading(true)
    let query = db
      .from('transactions')
      .select(`
        *,
        sender:profiles!transactions_sender_id_fkey(first_name, last_name, email, preferred_currency),
        receiver:profiles!transactions_receiver_id_fkey(first_name, last_name, email, preferred_currency)
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    const transactionsWithCurrency = (data || []).map(tx => ({
      ...tx,
      sender: { ...tx.sender, preferred_currency: tx.sender?.preferred_currency || 'USD' },
      receiver: { ...tx.receiver, preferred_currency: tx.receiver?.preferred_currency || 'USD' }
    }))
    setTransactions(transactionsWithCurrency as unknown as Transaction[])
    setLoading(false)
  }

  async function loadUpgradeRequests() {
    setLoading(true)
    const { data } = await db
      .from('upgrade_requests')
      .select('*, profile:profiles!upgrade_requests_user_id_fkey(first_name, last_name, email)')
      .order('created_at', { ascending: false })
    setUpgradeRequests((data || []) as unknown as UpgradeRequest[])
    setLoading(false)
  }

  async function updateStatus(txId: string, status: string) {
    const tx = transactions.find(t => t.id === txId)
    if (!tx) return

    if (status === 'approved') {
      if (tx.type === 'deposit') {
        const { data: sender } = await db.from('profiles').select('balance, preferred_currency').eq('id', tx.sender_id).single()
        await db.from('profiles').update({ balance: (sender?.balance || 0) + tx.amount }).eq('id', tx.sender_id)
      } else if (tx.type === 'transfer') {
        const { data: sender } = await db.from('profiles').select('balance, preferred_currency').eq('id', tx.sender_id).single()
        const { data: receiver } = await db.from('profiles').select('balance, preferred_currency').eq('id', tx.receiver_id).single()
        await db.from('profiles').update({ balance: (sender?.balance || 0) - tx.amount }).eq('id', tx.sender_id)
        await db.from('profiles').update({ balance: (receiver?.balance || 0) + tx.amount }).eq('id', tx.receiver_id)
      }
    }

    await db.from('transactions').update({ status, updated_at: new Date().toISOString() }).eq('id', txId)

    const notificationUserId = tx.sender_id
    const senderCurrency = tx.sender?.preferred_currency || 'USD'
    await db.from('notifications').insert({
      user_id: notificationUserId,
      title: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${tx.type} of ${formatCurrency(tx.amount, senderCurrency as any)} has been ${status}.`,
      type: status === 'approved' ? 'success' : 'error',
    })

    if (status === 'approved' && tx.type === 'transfer' && tx.receiver_id) {
      const receiverCurrency = tx.receiver?.preferred_currency || 'USD'
      await db.from('notifications').insert({
        user_id: tx.receiver_id,
        title: 'Payment Received',
        message: `You received ${formatCurrency(tx.amount, receiverCurrency as any)} from ${tx.sender?.first_name} ${tx.sender?.last_name}.`,
        type: 'success',
      })
    }

    loadTransactions()
  }

  async function handleUpgrade(reqId: string, status: 'approved' | 'rejected') {
    const req = upgradeRequests.find(r => r.id === reqId)
    if (!req) return
    const adminUserId = await getUserId()

    if (status === 'approved') {
      await db.from('profiles').update({ account_tier: req.requested_tier }).eq('id', req.user_id)
    }

    await db.from('upgrade_requests').update({
      status,
      processed_by: adminUserId,
      processed_at: new Date().toISOString(),
    }).eq('id', reqId)

    await db.from('notifications').insert({
      user_id: req.user_id,
      title: `Upgrade ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: status === 'approved'
        ? `Your upgrade to ${req.requested_tier.charAt(0).toUpperCase() + req.requested_tier.slice(1)} has been approved!`
        : `Your upgrade request to ${req.requested_tier.charAt(0).toUpperCase() + req.requested_tier.slice(1)} was rejected.`,
      type: status === 'approved' ? 'success' : 'error',
    })

    loadUpgradeRequests()
  }

  if (loading) return <div className="admin-page"><div className="loading-screen"><div className="spinner" /></div></div>

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Transactions</h1>
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Overview</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/transactions" className="admin-nav-link active">Transactions</Link>
          <Link to="/admin/tracking" className="admin-nav-link">Tracking</Link>
          <Link to="/admin/accounts" className="admin-nav-link">Accounts</Link>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          Fund Transactions
        </button>
        <button className={`admin-tab ${activeTab === 'upgrades' ? 'active' : ''}`} onClick={() => setActiveTab('upgrades')}>
          Upgrade Requests {upgradeRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="badge pending">{upgradeRequests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          <div className="admin-toolbar">
            <div className="filter-group">
              {['all', 'pending', 'processing', 'approved', 'rejected'].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td><small>{tx.reference}</small></td>
                    <td><span className="badge info">{tx.type}</span></td>
                    <td>
                      {tx.deposit_method && (
                        <span className="badge" style={{ backgroundColor: tx.deposit_method === 'giftcard' ? '#C9A84C' : tx.deposit_method === 'crypto' ? '#1B3A5C' : '#00A86B', color: 'white' }}>
                          {tx.deposit_method.charAt(0).toUpperCase() + tx.deposit_method.slice(1)}
                        </span>
                      )}
                    </td>
                    <td>{tx.sender?.first_name} {tx.sender?.last_name}</td>
                    <td>{tx.receiver?.first_name} {tx.receiver?.last_name}</td>
                    <td><strong>{formatCurrency(tx.amount, tx.sender?.preferred_currency as any)}</strong></td>
                    <td><span className={`badge ${tx.status}`}>{tx.status}</span></td>
                    <td><small>{new Date(tx.created_at).toLocaleDateString()}</small></td>
                    <td>
                      <div className="admin-actions">
                        {['pending', 'processing', 'approved', 'rejected'].map(status => (
                          tx.status !== status && (
                            <button key={status} className="btn btn-sm"
                              style={{
                                padding: '4px 8px', fontSize: '0.75rem', marginRight: '4px',
                                background: status === 'approved' ? '#10B981' : status === 'rejected' ? '#EF4444' : status === 'processing' ? '#F59E0B' : '#6B7280',
                                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                              }}
                              onClick={() => updateStatus(tx.id, status)}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          )
                        ))}
                        <button className="icon-btn" onClick={() => setViewingTx(tx)} title="View details">
                          <FiEye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'upgrades' && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Current Tier</th>
                <th>Requested Tier</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upgradeRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.profile?.first_name} {req.profile?.last_name}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: tierColors[req.current_tier] || '#6B7280', color: '#fff' }}>
                      {req.current_tier.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: tierColors[req.requested_tier] || '#6B7280', color: '#fff' }}>
                      {req.requested_tier.toUpperCase()}
                    </span>
                  </td>
                  <td><span className={`badge ${req.status}`}>{req.status}</span></td>
                  <td><small>{new Date(req.created_at).toLocaleDateString()}</small></td>
                  <td>
                    {req.status === 'pending' && (
                      <div className="admin-actions">
                        <button className="btn btn-sm" style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px 12px' }}
                          onClick={() => handleUpgrade(req.id, 'approved')}>
                          Approve
                        </button>
                        <button className="btn btn-sm" style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px 12px' }}
                          onClick={() => handleUpgrade(req.id, 'rejected')}>
                          Reject
                        </button>
                      </div>
                    )}
                    {req.status !== 'pending' && <span className="badge">{req.status}</span>}
                  </td>
                </tr>
              ))}
              {upgradeRequests.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#6B7280' }}>No upgrade requests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewingTx && (
        <div className="modal-overlay" onClick={() => setViewingTx(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>Transaction Details</h3>
            <div className="recipient-details-card">
              <div className="detail-row">
                <span className="detail-label">Reference</span>
                <span className="detail-value">{viewingTx.reference}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">{viewingTx.type.charAt(0).toUpperCase() + viewingTx.type.slice(1)}</span>
              </div>
              {viewingTx.deposit_method && (
                <div className="detail-row">
                  <span className="detail-label">Deposit Method</span>
                  <span className="detail-value">{viewingTx.deposit_method.charAt(0).toUpperCase() + viewingTx.deposit_method.slice(1)}</span>
                </div>
              )}
              {viewingTx.crypto_network && (
                <div className="detail-row">
                  <span className="detail-label">Crypto Network</span>
                  <span className="detail-value">{viewingTx.crypto_network}</span>
                </div>
              )}
              {viewingTx.crypto_address && (
                <div className="detail-row">
                  <span className="detail-label">Crypto Address</span>
                  <span className="detail-value" style={{ wordBreak: 'break-all' }}>{viewingTx.crypto_address}</span>
                </div>
              )}
              {viewingTx.recipient_details && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Recipient Name</span>
                    <span className="detail-value">{viewingTx.recipient_details.recipient_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Bank Name</span>
                    <span className="detail-value">{viewingTx.recipient_details.bank_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Account Number</span>
                    <span className="detail-value">{viewingTx.recipient_details.account_number}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Country</span>
                    <span className="detail-value">{viewingTx.recipient_details.country}</span>
                  </div>
                </>
              )}
              <div className="detail-row">
                <span className="detail-label">Amount</span>
                <span className="detail-value">{formatCurrency(viewingTx.amount, viewingTx.sender?.preferred_currency as any)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`badge ${viewingTx.status}`}>{viewingTx.status}</span>
              </div>
              {(viewingTx.giftcard_front_url || viewingTx.giftcard_back_url) && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Gift Card Images</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {viewingTx.giftcard_front_url && (
                      <div>
                        <p style={{ marginBottom: '4px', fontSize: '0.875rem' }}>Front</p>
                        <img src={viewingTx.giftcard_front_url} alt="Gift card front" style={{ width: '100%', borderRadius: '8px' }} />
                      </div>
                    )}
                    {viewingTx.giftcard_back_url && (
                      <div>
                        <p style={{ marginBottom: '4px', fontSize: '0.875rem' }}>Back</p>
                        <img src={viewingTx.giftcard_back_url} alt="Gift card back" style={{ width: '100%', borderRadius: '8px' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {viewingTx.proof_url && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Proof</h4>
                  <img src={viewingTx.proof_url} alt="Proof" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setViewingTx(null)} style={{ marginTop: 16 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
