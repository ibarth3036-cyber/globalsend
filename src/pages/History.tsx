import { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { formatCurrency } from '../lib/currency'
import { db } from '../lib/neon'
import { useAuth } from '../contexts/AuthContext'
import { FiArrowUpRight, FiArrowDownLeft, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  description: string | null
  reference: string
  created_at: string
  sender_id: string
  receiver_id: string
  sender?: { first_name: string; last_name: string }
  receiver?: { first_name: string; last_name: string }
}

export function History() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    loadTransactions()
  }, [user?.id])

  async function loadTransactions() {
    const { data } = await db
      .from('transactions')
      .select(`
        *,
        sender:profiles!transactions_sender_id_fkey(first_name, last_name),
        receiver:profiles!transactions_receiver_id_fkey(first_name, last_name)
      `)
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })
    setTransactions((data || []) as Transaction[])
    setLoading(false)
  }

  if (!profile) return null
  const isInactive = !profile.is_active

  const statusIcon: Record<string, typeof FiCheckCircle> = {
    approved: FiCheckCircle,
    completed: FiCheckCircle,
    rejected: FiXCircle,
    pending: FiClock,
    processing: FiClock,
  }

  const statusColor: Record<string, string> = {
    approved: '#00A86B',
    completed: '#00A86B',
    rejected: '#DC2626',
    pending: '#F59E0B',
    processing: '#3B82F6',
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main"><div className="loading-screen"><div className="spinner" /></div></main>
    </div>
  )

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <h1>Transaction History</h1>
        {isInactive && (
          <div className="inactive-banner">
            <h2>Account Inactive</h2>
            <p>Your account is currently inactive. Please contact customer support for assistance.</p>
          </div>
        )}
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px' }}>No transactions yet</p>
        ) : (
          <div className="transaction-list">
            {transactions.map(tx => {
              const StatusIcon = statusIcon[tx.status] || FiClock
              const isDeposit = tx.type === 'deposit'
              const isIncoming = tx.receiver_id === user?.id
              const isPositive = isDeposit || isIncoming
              return (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-icon" style={{ background: isPositive ? '#E8F5E9' : '#FEEBEE' }}>
                    {isPositive ? <FiArrowDownLeft color="#00A86B" /> : <FiArrowUpRight color="#DC2626" />}
                  </div>
                  <div className="tx-details">
                    <strong>
                      {isDeposit ? 'Deposit' :
                       isIncoming ? `From ${tx.sender?.first_name} ${tx.sender?.last_name}`
                                  : `To ${tx.receiver?.first_name} ${tx.receiver?.last_name}`}
                    </strong>
                    <small>{tx.description || tx.reference}</small>
                    <small>{formatDate(tx.created_at)}</small>
                  </div>
                  <div className="tx-amount-status">
                    <span className={`tx-amount ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : '-'}{formatCurrency(tx.amount, profile?.preferred_currency as any)}
                    </span>
                    <span className="tx-status" style={{ color: statusColor[tx.status] }}>
                      <StatusIcon size={14} /> {tx.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
