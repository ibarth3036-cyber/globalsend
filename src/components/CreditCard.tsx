import { useState } from 'react'
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiAward, FiStar, FiShield, FiZap } from 'react-icons/fi'
import { useCurrency } from '../hooks/useCurrency'
import type { Profile } from '../contexts/AuthContext'

interface Props {
  profile: Profile
}

const tierConfig: Record<string, { name: string; color: string; icon: any }> = {
  basic: { name: 'Basic', color: '#6B7280', icon: FiStar },
  gold: { name: 'Gold', color: '#F59E0B', icon: FiAward },
  premium: { name: 'Premium', color: '#3B82F6', icon: FiShield },
  vip: { name: 'VIP', color: '#8B5CF6', icon: FiZap },
  vvip: { name: 'VVIP', color: '#DC2626', icon: FiZap },
}

export function CreditCard({ profile }: Props) {
  const [showBalance, setShowBalance] = useState(false)
  const { format } = useCurrency()
  const tier = tierConfig[profile.account_tier] || tierConfig.basic
  const TierIcon = tier.icon

  return (
    <div className={`credit-card ${profile.is_active ? 'active' : 'inactive'}`} style={{ '--tier-color': tier.color } as React.CSSProperties}>
      <div className="card-bg" />
      <div className="card-tier-badge" style={{ backgroundColor: tier.color }}>
        <TierIcon size={12} />
        <span>{tier.name}</span>
      </div>
      <div className="card-content">
        <div className="card-top">
          <span className="card-label">{profile.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
          {profile.is_active
            ? <FiCheckCircle size={20} />
            : <FiXCircle size={20} />
          }
        </div>
        <div className="card-balance">
          <span className="card-balance-label">Balance</span>
          <div className="card-balance-row">
            <span className="card-balance-amount">
              {showBalance ? format(profile.balance) : '****'}
            </span>
            <button className="icon-btn" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>
        <div className="card-footer">
          <span className="card-name">{profile.first_name} {profile.last_name}</span>
        </div>
      </div>
    </div>
  )
}
