import { useEffect, useState } from 'react'
import { db } from '../../lib/neon'
import { FiUsers, FiDollarSign, FiPackage, FiActivity } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, transactions: 0, parcels: 0, pending: 0 })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { count: users } = await db.from('profiles').select('*', { count: 'exact', head: true })
    const { count: transactions } = await db.from('transactions').select('*', { count: 'exact', head: true })
    const { count: parcels } = await db.from('parcels').select('*', { count: 'exact', head: true })
    const { count: pending } = await db.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    setStats({ users: users || 0, transactions: transactions || 0, parcels: parcels || 0, pending: pending || 0 })
  }

  const cards = [
    { label: 'Total Users', value: stats.users, icon: FiUsers, color: '#1B3A5C', to: '/admin/users' },
    { label: 'Transactions', value: stats.transactions, icon: FiDollarSign, color: '#C9A84C', to: '/admin/transactions' },
    { label: 'Parcels', value: stats.parcels, icon: FiPackage, color: '#00A86B', to: '/admin/tracking' },
    { label: 'Pending Actions', value: stats.pending, icon: FiActivity, color: '#DC2626', to: '/admin/transactions' },
  ]

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link active">Overview</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/transactions" className="admin-nav-link">Transactions</Link>
          <Link to="/admin/tracking" className="admin-nav-link">Tracking</Link>
        </div>
      </div>
      <div className="admin-stats">
        {cards.map(card => (
          <Link to={card.to} key={card.label} className="admin-stat-card" style={{ '--accent': card.color } as React.CSSProperties}>
            <card.icon size={32} />
            <div>
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="admin-quick-links">
        <Link to="/admin/users" className="btn btn-outline">Manage Users</Link>
        <Link to="/admin/transactions" className="btn btn-outline">Review Transactions</Link>
        <Link to="/admin/tracking" className="btn btn-outline">Create Tracking Code</Link>
        <Link to="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
      </div>
    </div>
  )
}
