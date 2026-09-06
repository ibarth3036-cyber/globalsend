import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard } from '../components/CreditCard'
import { Sidebar } from '../components/Sidebar'
import { Link } from 'react-router-dom'
import { FiSend, FiDownload, FiPackage, FiClock, FiStar, FiShield, FiAward, FiZap } from 'react-icons/fi'
import { db } from '../lib/neon'
import type { Profile } from '../contexts/AuthContext'

const tierConfig: Record<string, { name: string; color: string; icon: any; cost: number }> = {
  basic: { name: 'Basic', color: '#6B7280', icon: FiStar, cost: 0 },
  gold: { name: 'Gold', color: '#F59E0B', icon: FiAward, cost: 4700 },
  premium: { name: 'Premium', color: '#3B82F6', icon: FiShield, cost: 6530 },
  vip: { name: 'VIP', color: '#8B5CF6', icon: FiZap, cost: 10430 },
  vvip: { name: 'VVIP', color: '#DC2626', icon: FiZap, cost: 18660 },
}

const upgradeOptions = [
  { tier: 'gold', name: 'Gold Account', cost: 4700, color: '#F59E0B', features: ['Priority support', 'Reduced transfer fees', 'Gold badge'] },
  { tier: 'premium', name: 'Premium Account', cost: 6530, color: '#3B82F6', features: ['Express support', 'Free transfers', 'Premium badge', 'Higher deposit limits'] },
  { tier: 'vip', name: 'VIP Account', cost: 10430, color: '#8B5CF6', features: ['24/7 dedicated support', 'Zero fees', 'VIP badge', 'Unlimited deposits', 'Priority processing'] },
  { tier: 'vvip', name: 'VVIP Account', cost: 18660, color: '#DC2626', features: ['Concierge support', 'All fees waived', 'VVIP badge', 'Unlimited everything', 'Personal account manager'] },
]

export function Dashboard() {
  const { profile } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState('')

  if (!profile) return null
  const p = profile as Profile
  const isInactive = !p.is_active

  const currentTier = tierConfig[p.account_tier] || tierConfig.basic
  const TierIcon = currentTier.icon

  const initials = `${p.first_name} ${p.last_name}`
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const quickActions = [
    { to: '/transfer', icon: FiSend, label: 'Transfer', color: '#1B3A5C' },
    { to: '/deposit', icon: FiDownload, label: 'Deposit', color: '#C9A84C' },
    { to: '/track', icon: FiPackage, label: 'Track Parcel', color: '#00A86B' },
    { to: '/history', icon: FiClock, label: 'History', color: '#2563EB' },
  ]

  async function requestUpgrade(tier: string) {
    setUpgradeLoading(true)
    setUpgradeMsg('')
    const { error } = await db.from('upgrade_requests').insert({
      user_id: p.id,
      current_tier: p.account_tier,
      requested_tier: tier,
    })
    if (error) {
      setUpgradeMsg(`Error: ${error.message}`)
    } else {
      setUpgradeMsg('Upgrade request submitted! Admin will review it.')
    }
    setUpgradeLoading(false)
  }

  function getUpgradeableTiers() {
    const currentIndex = Object.keys(tierConfig).indexOf(p.account_tier)
    return upgradeOptions.filter((_, i) => i >= currentIndex)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-avatar-ring">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="dashboard-avatar-img" />
            ) : (
              <span className="dashboard-avatar-initials">{initials}</span>
            )}
          </div>
          <div>
            <h1>Welcome, {p.first_name}</h1>
            <p>{p.email}</p>
            <div className="dashboard-tier-badge" style={{ backgroundColor: currentTier.color }}>
              <TierIcon size={14} />
              <span>{currentTier.name}</span>
            </div>
          </div>
        </div>
        {isInactive && (
          <div className="inactive-banner">
            <h2>Account Inactive</h2>
            <p>Your account is currently inactive. Please contact customer support for assistance.</p>
          </div>
        )}

        <CreditCard profile={p} />

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map(action => (
              <Link 
                to={isInactive ? "#" : action.to} 
                key={action.to} 
                className="action-card" 
                style={{ '--accent': action.color, opacity: isInactive ? 0.5 : 1, pointerEvents: isInactive ? 'none' : 'auto' } as React.CSSProperties}
                onClick={e => isInactive && e.preventDefault()}
              >
                <action.icon size={28} />
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Account Tier</h3>
            <button 
              className="btn btn-sm btn-outline" 
              onClick={() => setShowUpgrade(!showUpgrade)}
              disabled={isInactive}
            >
              {showUpgrade ? 'Close' : 'Upgrade'}
            </button>
          </div>
          <div className="dashboard-tier-card" style={{ borderColor: currentTier.color }}>
            <div className="dashboard-tier-current">
              <TierIcon size={24} color={currentTier.color} />
              <div>
                <strong style={{ color: currentTier.color }}>{currentTier.name} Account</strong>
                <p>You are on the {currentTier.name.toLowerCase()} plan.</p>
              </div>
            </div>
          </div>
        </div>

        {showUpgrade && (
          <div className="dashboard-upgrade-section">
            <h3>Upgrade Your Account</h3>
            {upgradeMsg && (
              <div className={`alert ${upgradeMsg.includes('Error') ? 'alert-error' : 'alert-success'}`}>{upgradeMsg}</div>
            )}
            <div className="upgrade-grid">
              {getUpgradeableTiers().map(opt => {
                const isCurrent = p.account_tier === opt.tier
                return (
                  <div key={opt.tier} className="upgrade-card" style={{ borderColor: opt.color, opacity: isInactive ? 0.5 : 1 }}>
                    <div className="upgrade-card-header" style={{ backgroundColor: opt.color }}>
                      <h4>{opt.name}</h4>
                      {isCurrent && <span className="upgrade-current-badge">Current</span>}
                    </div>
                    <div className="upgrade-card-body">
                      <div className="upgrade-price">${opt.cost.toLocaleString()}</div>
                      <ul className="upgrade-features">
                        {opt.features.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                      {!isCurrent && (
                        <button
                          className="btn btn-primary btn-block"
                          onClick={() => requestUpgrade(opt.tier)}
                          disabled={upgradeLoading || isInactive}
                        >
                          {upgradeLoading ? 'Requesting...' : 'Request Upgrade'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
