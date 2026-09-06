import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiSend, FiDownload, FiPackage, FiClock } from 'react-icons/fi'

const tabs = [
  { to: '/dashboard', icon: FiHome, label: 'Home' },
  { to: '/transfer', icon: FiSend, label: 'Transfer' },
  { to: '/deposit', icon: FiDownload, label: 'Deposit' },
  { to: '/track', icon: FiPackage, label: 'Track' },
  { to: '/history', icon: FiClock, label: 'History' },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const active = pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
