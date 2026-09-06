import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { db } from '../lib/neon'
import {
  FiLogOut, FiMenu, FiX, FiSun, FiMoon, FiBell,
  FiHome, FiSend, FiDownload, FiClock, FiPackage, FiSettings, FiUser
} from 'react-icons/fi'
import { LuShieldCheck } from 'react-icons/lu'

const navItems = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/transfer', icon: FiSend, label: 'Transfer' },
  { to: '/deposit', icon: FiDownload, label: 'Deposit' },
  { to: '/history', icon: FiClock, label: 'History' },
  { to: '/track', icon: FiPackage, label: 'Parcel Tracker' },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
]

export function DbBanner() {
  const { dbError } = useAuth()
  if (!dbError) return null
  return <div className="db-banner">{dbError}</div>
}

export function Navbar() {
  const { user, profile, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    loadUnread()
    const interval = setInterval(() => { loadUnread() }, 15000)
    return () => clearInterval(interval)
  }, [user])

  async function loadUnread() {
    if (!user) return
    const { count } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function close() { setMenuOpen(false) }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : ''
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || '?'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/icon.svg" alt="GlobalSend" style={{ height: '32px', width: 'auto' }} />
          </Link>

          <div className="navbar-actions">
            {user && (
              <Link to="/notifications" className="notif-bell">
                <FiBell size={20} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
            )}
            <button onClick={toggle} className="icon-btn" title="Toggle theme">
              {dark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            {!user && (
              <div className="nav-auth-buttons">
                <Link to="/login" className="nav-btn-login">Log In</Link>
                <Link to="/signup" className="nav-btn-signup">Sign Up</Link>
              </div>
            )}
            {user && (
              <button onClick={handleLogout} className="icon-btn desktop-only" title="Logout">
                <FiLogOut size={20} />
              </button>
            )}
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`mobile-drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={close} />
      <aside className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }} onClick={close}>
            <img src="/icon.svg" alt="GlobalSend" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <button className="mobile-drawer-close" onClick={close}>
            <FiX size={22} />
          </button>
        </div>

        {user && (
          <div className="mobile-drawer-user">
            <div className="mobile-drawer-avatar-ring">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="mobile-drawer-avatar-img" />
              ) : (
                <span className="mobile-drawer-avatar-init">{initials}</span>
              )}
            </div>
            <div>
              <div className="mobile-drawer-name">{displayName || 'User'}</div>
              <div className="mobile-drawer-email">{user.email}</div>
            </div>
          </div>
        )}

        <div className="mobile-drawer-links">
          {user ? (
            <>
              <div className="mobile-drawer-label">Main Menu</div>
              {navItems.map(item => (
                <Link key={item.to} to={item.to} className="mobile-drawer-link" onClick={close}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.to === '/notifications' && unreadCount > 0 && (
                    <span className="mobile-drawer-badge">{unreadCount}</span>
                  )}
                </Link>
              ))}
              {profile?.role === 'admin' && (
                <>
                  <div className="mobile-drawer-label">Admin</div>
                  <Link to="/admin" className="mobile-drawer-link" onClick={close}>
                    <LuShieldCheck size={20} />
                    <span>Admin Panel</span>
                  </Link>
                </>
              )}
              <div className="mobile-drawer-divider" />
              <button onClick={() => { toggle(); close(); }} className="mobile-drawer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--font)', fontSize: '0.95rem', color: 'var(--color-text)' }}>
                {dark ? <><FiSun size={20} /> Light Mode</> : <><FiMoon size={20} /> Dark Mode</>}
              </button>
              <button onClick={handleLogout} className="mobile-drawer-link mobile-drawer-logout" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--font)', fontSize: '0.95rem' }}>
                <FiLogOut size={20} /> Logout
              </button>
            </>
          ) : (
            <>
              <div className="mobile-drawer-label">Menu</div>
              <Link to="/" className="mobile-drawer-link" onClick={close}><FiHome size={20} /><span>Home</span></Link>
              <Link to="/login" className="mobile-drawer-link" onClick={close}><span>Login</span></Link>
              <Link to="/signup" className="mobile-drawer-link" onClick={close}><span>Sign Up</span></Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
