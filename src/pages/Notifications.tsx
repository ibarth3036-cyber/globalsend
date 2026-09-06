import { useEffect, useState, useCallback } from 'react'
import { Sidebar } from '../components/Sidebar'
import { db } from '../lib/neon'
import { useAuth } from '../contexts/AuthContext'
import {
  FiBell, FiCheckCircle, FiXCircle, FiInfo, FiTrash2, FiCheck, FiAlertTriangle
} from 'react-icons/fi'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  success: { icon: FiCheckCircle, color: '#00A86B' },
  error: { icon: FiXCircle, color: '#DC2626' },
  warning: { icon: FiAlertTriangle, color: '#F59E0B' },
  info: { icon: FiInfo, color: '#3B82F6' },
}

export function Notifications() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    setNotifications((data || []) as Notification[])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  if (!profile) return null

  if (!profile.is_active) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="inactive-banner">
            <h2>Account Inactive</h2>
            <p>Your account is currently inactive. Please contact customer support for assistance.</p>
          </div>
        </main>
      </div>
    )
  }

  async function markRead(id: string) {
    await db.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await db.from('notifications').update({ is_read: true }).eq('user_id', user?.id).is('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function deleteNotification(id: string) {
    const { error } = await db.from('notifications').delete().eq('id', id)
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  function formatDate(date: string) {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
        <div className="notif-header">
          <div>
            <h1>Notifications</h1>
            <p className="notif-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>
              <FiCheck size={16} /> Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="notif-empty">
            <FiBell size={48} />
            <h3>No notifications yet</h3>
            <p>You'll see updates here when transactions are processed or messages are sent.</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.info
              const Icon = cfg.icon
              return (
                <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
                  <div className="notif-icon" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{formatDate(n.created_at)}</div>
                  </div>
                  <div className="notif-actions">
                    {!n.is_read && (
                      <button className="icon-btn" onClick={() => markRead(n.id)} title="Mark read">
                        <FiCheck size={16} />
                      </button>
                    )}
                    <button className="icon-btn" onClick={() => deleteNotification(n.id)} title="Delete">
                      <FiTrash2 size={16} />
                    </button>
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
