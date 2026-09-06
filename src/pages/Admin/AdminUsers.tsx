import { useEffect, useState } from 'react'
import { db, getUserId } from '../../lib/neon'
import { formatCurrency } from '../../lib/currency'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiMessageSquare, FiToggleLeft, FiToggleRight, FiSearch, FiDollarSign, FiTrash2, FiShield, FiStar, FiEye } from 'react-icons/fi'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  gender: string | null
  location: string | null
  avatar_url: string | null
  id_card_front: string | null
  id_card_back: string | null
  balance: number
  is_active: boolean
  role: string
  id_verified: boolean
  created_at: string
  preferred_currency: string
  account_tier: string
  blocked: boolean
  lock_message: string | null
}

const tierColors: Record<string, string> = {
  basic: '#6B7280', gold: '#F59E0B', premium: '#3B82F6', vip: '#8B5CF6', vvip: '#DC2626',
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [messageModal, setMessageModal] = useState<{ user: UserProfile | null; all: boolean }>({ user: null, all: false })
  const [messageSubject, setMessageSubject] = useState('')
  const [messageText, setMessageText] = useState('')
  const [balanceModal, setBalanceModal] = useState<UserProfile | null>(null)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [tierModal, setTierModal] = useState<UserProfile | null>(null)
  const [selectedTier, setSelectedTier] = useState('')
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null)
  const [lockModal, setLockModal] = useState<UserProfile | null>(null)
  const [lockMessage, setLockMessage] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await db.from('profiles').select('*').order('created_at', { ascending: false })
    const usersWithCurrency = (data || []).map(user => ({
      ...user,
      preferred_currency: user.preferred_currency || 'USD',
      account_tier: user.account_tier || 'basic',
      blocked: user.blocked || false,
    }))
    setUsers(usersWithCurrency as UserProfile[])
    setLoading(false)
  }

  async function toggleActive(userId: string, current: boolean) {
    const { error } = await db.from('profiles').update({ is_active: !current }).eq('id', userId)
    if (error) { alert(`Error: ${error.message}`); return }
    await db.from('notifications').insert({
      user_id: userId,
      title: !current ? 'Account Activated' : 'Account Deactivated',
      message: !current ? 'Your account has been activated.' : 'Your account has been deactivated. You can still log in but cannot withdraw or receive parcels.',
      type: !current ? 'success' : 'warning',
    })
    loadUsers()
  }

  async function toggleBlock(userId: string, current: boolean) {
    if (current) {
      // Unblock
      if (!confirm('Are you sure you want to unblock this user?')) return
      const { error } = await db.from('profiles').update({ blocked: false, lock_message: null }).eq('id', userId)
      if (error) { alert(`Error: ${error.message}`); return }
      await db.from('notifications').insert({
        user_id: userId,
        title: 'Account Unblocked',
        message: 'Your account has been unblocked. You can now log in.',
        type: 'success',
      })
      loadUsers()
    } else {
      // Block - open modal to get message
      const user = users.find(u => u.id === userId)
      if (user) {
        setLockMessage('')
        setLockModal(user)
      }
    }
  }

  async function confirmBlock() {
    if (!lockModal) return
    const { error } = await db.from('profiles').update({ 
      blocked: true, 
      lock_message: lockMessage || null 
    }).eq('id', lockModal.id)
    if (error) { alert(`Error: ${error.message}`); return }
    await db.from('notifications').insert({
      user_id: lockModal.id,
      title: 'Account Blocked',
      message: lockMessage || 'Your account has been blocked. You cannot log in. Contact support for assistance.',
      type: 'error',
    })
    setLockModal(null)
    setLockMessage('')
    loadUsers()
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to permanently delete this account? This action cannot be undone.')) return
    const { error } = await db.from('profiles').delete().eq('id', userId)
    if (error) { alert(`Error: ${error.message}`); return }
    loadUsers()
  }

  async function updateTier() {
    if (!tierModal || !selectedTier) return
    const { error } = await db.from('profiles').update({ account_tier: selectedTier }).eq('id', tierModal.id)
    if (error) { alert(`Error: ${error.message}`); return }
    await db.from('notifications').insert({
      user_id: tierModal.id,
      title: 'Account Upgraded',
      message: `Your account has been upgraded to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} tier.`,
      type: 'success',
    })
    setTierModal(null)
    setSelectedTier('')
    loadUsers()
  }

  async function verifyUser(userId: string) {
    await db.from('profiles').update({ id_verified: true }).eq('id', userId)
    loadUsers()
  }

  async function adjustBalance(userId: string) {
    const user = users.find(u => u.id === userId)
    if (!user) return
    const amount = parseFloat(adjustmentAmount)
    if (isNaN(amount) || amount <= 0) return
    const newBalance = adjustmentType === 'add' ? user.balance + amount : user.balance - amount
    await db.from('profiles').update({ balance: newBalance }).eq('id', userId)
    await db.from('transactions').insert({
      sender_id: await getUserId(),
      receiver_id: userId, amount: amount,
      type: adjustmentType === 'add' ? 'manual_add' : 'manual_subtract',
      status: 'approved', reference: `MANUAL-${Date.now()}`,
      description: adjustmentReason || `Manual ${adjustmentType}`
    })
    await db.from('notifications').insert({
      user_id: userId,
      title: 'Balance Adjustment',
      message: `Your balance has been ${adjustmentType === 'add' ? 'increased' : 'decreased'} by ${formatCurrency(amount, user.preferred_currency as any)}. Reason: ${adjustmentReason || 'Manual adjustment'}`,
      type: 'info',
    })
    setBalanceModal(null)
    setAdjustmentAmount('')
    setAdjustmentReason('')
    loadUsers()
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const { user: target, all } = messageModal
    const adminUserId = await getUserId()
    if (all) {
      for (const u of users) {
        await db.from('admin_messages').insert({
          sender_id: adminUserId, recipient_id: u.id,
          subject: messageSubject, message: messageText, is_general: true,
        })
        await db.from('notifications').insert({
          user_id: u.id, title: messageSubject, message: messageText, type: 'info',
        })
      }
    } else if (target) {
      await db.from('admin_messages').insert({
        sender_id: adminUserId, recipient_id: target.id,
        subject: messageSubject, message: messageText,
      })
      await db.from('notifications').insert({
        user_id: target.id, title: messageSubject, message: messageText,
      })
    }
    setMessageModal({ user: null, all: false })
    setMessageSubject('')
    setMessageText('')
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q)
  })

  if (loading) return <div className="admin-page"><div className="loading-screen"><div className="spinner" /></div></div>

  const tiers = ['basic', 'gold', 'premium', 'vip', 'vvip']

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Overview</Link>
          <Link to="/admin/users" className="admin-nav-link active">Users</Link>
          <Link to="/admin/transactions" className="admin-nav-link">Transactions</Link>
          <Link to="/admin/tracking" className="admin-nav-link">Tracking</Link>
          <Link to="/admin/accounts" className="admin-nav-link">Accounts</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-input-wrapper">
          <FiSearch size={16} />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setMessageModal({ user: null, all: true })}>
          <FiMessageSquare size={16} /> Message All
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Balance</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={u.blocked ? { opacity: 0.5 } : {}}>
                <td><strong>{u.first_name} {u.last_name}</strong></td>
                <td>{u.email}</td>
                <td>{formatCurrency(u.balance, u.preferred_currency as any)}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: tierColors[u.account_tier] || '#6B7280', color: '#fff' }}>
                    {u.account_tier.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'success' : 'danger'}`}>
                    {u.blocked ? 'Blocked' : u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {u.id_verified ? <FiCheckCircle color="#00A86B" /> : <FiXCircle color="#DC2626" />}
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="icon-btn" onClick={() => toggleActive(u.id, u.is_active)} title={u.is_active ? 'Deactivate' : 'Activate'}>
                      {u.is_active ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                    </button>
                    <button className="icon-btn" onClick={() => toggleBlock(u.id, u.blocked)} title={u.blocked ? 'Unblock' : 'Block'}>
                      <FiShield size={18} color={u.blocked ? '#00A86B' : '#DC2626'} />
                    </button>
                    <button className="icon-btn" onClick={() => { setTierModal(u); setSelectedTier(u.account_tier) }} title="Change tier">
                      <FiStar size={18} color={tierColors[u.account_tier]} />
                    </button>
                    <button className="icon-btn" onClick={() => setBalanceModal(u)} title="Adjust balance">
                      <FiDollarSign size={18} />
                    </button>
                    {!u.id_verified && (
                      <button className="icon-btn" onClick={() => verifyUser(u.id)} title="Verify ID">
                        <FiCheckCircle size={18} color="#00A86B" />
                      </button>
                    )}
                    <button className="icon-btn" onClick={() => setViewingProfile(u)} title="View profile">
                      <FiEye size={18} />
                    </button>
                    <button className="icon-btn" onClick={() => setMessageModal({ user: u, all: false })} title="Send message">
                      <FiMessageSquare size={18} />
                    </button>
                    <button className="icon-btn" onClick={() => deleteUser(u.id)} title="Delete account" style={{ color: '#DC2626' }}>
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {messageModal.user || messageModal.all ? (
        <div className="modal-overlay" onClick={() => setMessageModal({ user: null, all: false })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{messageModal.all ? 'Message All Users' : `Message ${messageModal.user?.first_name}`}</h3>
            <form onSubmit={sendMessage}>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" value={messageSubject} onChange={e => setMessageSubject(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={4} required />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setMessageModal({ user: null, all: false })} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {balanceModal ? (
        <div className="modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Adjust Balance for {balanceModal.first_name} {balanceModal.last_name}</h3>
            <p>Current Balance: <strong>{formatCurrency(balanceModal.balance, balanceModal.preferred_currency as any)}</strong></p>
            <form onSubmit={(e) => { e.preventDefault(); adjustBalance(balanceModal.id); }}>
              <div className="form-group">
                <label>Adjustment Type</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="adjType" value="add" checked={adjustmentType === 'add'} onChange={() => setAdjustmentType('add')} /> Add Funds
                  </label>
                  <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="adjType" value="subtract" checked={adjustmentType === 'subtract'} onChange={() => setAdjustmentType('subtract')} /> Subtract Funds
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Amount ({balanceModal.preferred_currency})</label>
                <input type="number" value={adjustmentAmount} onChange={e => setAdjustmentAmount(e.target.value)} min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input type="text" value={adjustmentReason} onChange={e => setAdjustmentReason(e.target.value)} placeholder="Reason for adjustment" />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setBalanceModal(null)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {adjustmentType === 'add' ? 'Add' : 'Subtract'} & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewingProfile && (
        <div className="modal-overlay" onClick={() => setViewingProfile(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>User Profile</h3>
            <div className="profile-card-admin">
              <div className="profile-card-header">
                <div className="profile-avatar-lg">
                  {viewingProfile.avatar_url ? (
                    <img src={viewingProfile.avatar_url} alt="" />
                  ) : (
                    <span>{viewingProfile.first_name[0]}{viewingProfile.last_name[0]}</span>
                  )}
                </div>
                <div>
                  <h2>{viewingProfile.first_name} {viewingProfile.last_name}</h2>
                  <p className="profile-email">{viewingProfile.email}</p>
                </div>
              </div>
              <div className="profile-details-grid">
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{viewingProfile.phone || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{viewingProfile.gender || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{viewingProfile.location || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tier</span>
                  <span className="badge" style={{ backgroundColor: tierColors[viewingProfile.account_tier] || '#6B7280', color: '#fff' }}>
                    {viewingProfile.account_tier.toUpperCase()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Balance</span>
                  <span className="detail-value">{formatCurrency(viewingProfile.balance, viewingProfile.preferred_currency as any)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`badge ${viewingProfile.is_active ? 'success' : 'danger'}`}>
                    {viewingProfile.blocked ? 'Blocked' : viewingProfile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">ID Verified</span>
                  <span>{viewingProfile.id_verified ? <FiCheckCircle color="#00A86B" /> : <FiXCircle color="#DC2626" />}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Joined</span>
                  <span className="detail-value">{new Date(viewingProfile.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="id-cards-section">
                <h4>ID Documents</h4>
                <div className="id-cards-grid">
                  <div className="id-card-item">
                    <label>Front</label>
                    {viewingProfile.id_card_front ? (
                      <a href={viewingProfile.id_card_front} target="_blank" rel="noreferrer">
                        <img src={viewingProfile.id_card_front} alt="ID Front" className="id-card-image" />
                      </a>
                    ) : (
                      <div className="id-card-placeholder">Not uploaded</div>
                    )}
                  </div>
                  <div className="id-card-item">
                    <label>Back</label>
                    {viewingProfile.id_card_back ? (
                      <a href={viewingProfile.id_card_back} target="_blank" rel="noreferrer">
                        <img src={viewingProfile.id_card_back} alt="ID Back" className="id-card-image" />
                      </a>
                    ) : (
                      <div className="id-card-placeholder">Not uploaded</div>
                    )}
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-block" onClick={() => setViewingProfile(null)} style={{ marginTop: 16 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {tierModal ? (
        <div className="modal-overlay" onClick={() => setTierModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Change Tier for {tierModal.first_name} {tierModal.last_name}</h3>
            <p>Current: <strong style={{ color: tierColors[tierModal.account_tier] }}>{tierModal.account_tier.toUpperCase()}</strong></p>
            <div className="form-group">
              <label>New Tier</label>
              <select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} className="form-select">
                {tiers.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setTierModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={updateTier} style={{ flex: 1 }}>Update Tier</button>
            </div>
          </div>
        </div>
      ) : null}

      {lockModal ? (
        <div className="modal-overlay" onClick={() => setLockModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Block {lockModal.first_name} {lockModal.last_name}</h3>
            <p>Enter a reason for blocking this account (this will be shown to the user).</p>
            <div className="form-group">
              <label>Reason for Block</label>
              <textarea
                value={lockMessage}
                onChange={e => setLockMessage(e.target.value)}
                placeholder="e.g., Suspicious activity detected on your account. Please contact support for more information."
                rows={4}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setLockModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmBlock} style={{ flex: 1 }}>Confirm Block</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
