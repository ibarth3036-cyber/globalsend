import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiPackage, FiClock, FiShield, FiDownload, FiArrowRight, FiDollarSign, FiGlobe } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { SiteFooter } from '../components/SiteFooter'

export function Landing() {
  const { user } = useAuth()
  const { canInstall, install } = usePwaInstall()
  const [trackInput, setTrackInput] = useState('')
  const navigate = useNavigate()

  function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (trackInput.trim()) navigate(`/track/${trackInput.trim().toUpperCase()}`)
  }

  return (
    <div className="gs-landing">

      <section className="gs-hero">
        <div className="gs-hero-bg" />
        <div className="gs-hero-content">
          <div className="gs-hero-left">
            <div className="gs-hero-tag">
              <span>Trusted &amp; Verified</span>
            </div>
            <h1 className="gs-hero-title">
              GlobalSend <span className="gs-hero-title-accent">Platform</span>
            </h1>
            <p className="gs-hero-subtitle">
              Money transfers and parcel tracking made simple, safe, and transparent.
            </p>
            <div className="gs-tracking-widget">
              <div className="gs-tracking-header">
                <FiSearch size={18} />
                <span className="gs-tracking-label">Track your shipment</span>
              </div>
              <form className="gs-tracking-form" onSubmit={handleTrack}>
                <div className="gs-tracking-input-wrapper">
                  <FiSearch size={16} className="gs-tracking-icon" />
                  <input
                    type="text"
                    className="gs-tracking-input"
                    placeholder="Enter tracking number"
                    value={trackInput}
                    onChange={e => setTrackInput(e.target.value.toUpperCase())}
                  />
                </div>
                <button type="submit" className="gs-tracking-btn">Track</button>
              </form>
            </div>
            <div className="gs-hero-actions">
              {!user ? (
                <>
                  <Link to="/signup" className="gs-btn-primary">Get Started</Link>
                  <Link to="/login" className="gs-btn-secondary">Sign In</Link>
                </>
              ) : (
                <Link to="/dashboard" className="gs-btn-primary">Go to Dashboard <FiArrowRight size={18} /></Link>
              )}
            </div>
          </div>
          <div className="gs-hero-right">
            <div className="gs-hero-image-container">
              <img src="/images/hero-bg.jpg" alt="GlobalSend" className="gs-hero-image" />
            </div>
          </div>
        </div>
      </section>

      <section className="gs-services">
        <div className="gs-services-container">
          <h2 className="gs-section-title">Everything you need in one place</h2>
          <div className="gs-services-grid">
            <div className="gs-service-card">
              <div className="gs-service-icon">
                <FiDollarSign size={28} />
              </div>
              <h3>Money Transfers</h3>
              <p>Send funds securely with a simple, admin-verified workflow and full transparency.</p>
            </div>
            <div className="gs-service-card">
              <div className="gs-service-icon">
                <FiPackage size={28} />
              </div>
              <h3>Parcel Tracking</h3>
              <p>Real-time tracking with milestones, interactive maps, and delivery updates.</p>
            </div>
            <div className="gs-service-card">
              <div className="gs-service-icon">
                <FiShield size={28} />
              </div>
              <h3>Secure &amp; Verified</h3>
              <p>ID verification, admin oversight, and encrypted transactions keep everything safe.</p>
            </div>
            <div className="gs-service-card">
              <div className="gs-service-icon">
                <FiClock size={28} />
              </div>
              <h3>Transaction History</h3>
              <p>Full audit trail of all transfers, deposits, and parcel activity.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="gs-stats">
        <div className="gs-stats-container">
          <div className="gs-stat-item">
            <FiShield size={26} className="gs-stat-icon" />
            <span className="gs-stat-number">Verified &amp; Secure</span>
            <span className="gs-stat-label">Every transaction is reviewed and approved by our team</span>
          </div>
          <div className="gs-stat-item">
            <FiPackage size={26} className="gs-stat-icon" />
            <span className="gs-stat-number">Real-Time Tracking</span>
            <span className="gs-stat-label">Follow every parcel from pickup to delivery</span>
          </div>
          <div className="gs-stat-item">
            <FiGlobe size={26} className="gs-stat-icon" />
            <span className="gs-stat-number">Global Coverage</span>
            <span className="gs-stat-label">Transfers and shipping across 20+ currencies and worldwide routes</span>
          </div>
          <div className="gs-stat-item">
            <FiClock size={26} className="gs-stat-icon" />
            <span className="gs-stat-number">Dedicated Support</span>
            <span className="gs-stat-label">A real team, always available to help</span>
          </div>
        </div>
      </section>

      <section className="gs-safety">
        <div className="gs-safety-container">
          <FiShield size={28} />
          <p>All deposits are 100% secure. Contact our support team anytime for assistance.</p>
        </div>
      </section>

      <section className="gs-two-col-section">
        <div className="gs-wrapper">
          <div className="gs-two-col-grid">
            <div className="gs-two-col-card">
              <div className="gs-two-col-img">
                <img src="/images/photo-agility.png" alt="Operating with agility" />
              </div>
              <div className="gs-two-col-text">
                <h3>Operating with agility, delivering with global strength</h3>
                <p>Our integrated logistics network empowers your business to reach customers worldwide with speed and reliability.</p>
                <Link to={user ? '/dashboard' : '/signup'} className="gs-btn-accent-outline">Start Shipping Now <FiArrowRight size={16} /></Link>
              </div>
            </div>
            <div className="gs-two-col-card">
              <div className="gs-two-col-img">
                <img src="/images/photo-platform.png" alt="Secure platform" />
              </div>
              <div className="gs-two-col-text">
                <h3>Secure money transfer platform</h3>
                <p>Move money securely and transparently with an admin-reviewed workflow and a complete history of every transaction.</p>
                <Link to={user ? '/transfer' : '/signup'} className="gs-btn-accent-outline">Get Started <FiArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gs-featured-offer">
        <div className="gs-wrapper">
          <div className="gs-featured-grid">
            <div className="gs-featured-text">
              <h2>Recognize &amp; Prevent Fraud</h2>
              <p>Stay informed about the latest fraud trends and learn how to protect your business and shipments.</p>
              <Link to="/fraud-prevention" className="gs-btn-accent">Learn More</Link>
            </div>
            <div className="gs-featured-img">
              <img src="/images/photo-fraud.png" alt="Fraud Prevention" />
            </div>
          </div>
        </div>
      </section>

      <section className="gs-cta-accent">
        <div className="gs-cta-accent-container">
          <div className="gs-cta-accent-icon">
            <img src="/images/offer-icon.png" alt="" width={70} height={70} />
          </div>
          <div className="gs-cta-accent-text">
            <h2>Sign up now to enjoy personalized shipping rates!</h2>
            <p>Benefit from our services and solutions tailored to your business needs.</p>
          </div>
          <div className="gs-cta-accent-action">
            {!user ? (
              <Link to="/signup" className="gs-btn-white">Open an Account</Link>
            ) : (
              <Link to="/dashboard" className="gs-btn-white">Go to Dashboard</Link>
            )}
          </div>
        </div>
      </section>

      {canInstall && (
        <div className="pwa-install-banner">
          <div className="pwa-install-banner-content">
            <div className="pwa-install-banner-icon">
              <img src="/icon.svg" alt="GlobalSend" style={{ height: '40px', width: 'auto' }} />
            </div>
            <div className="pwa-install-banner-text">
              <strong>GlobalSend Platform</strong>
              <span>Install for quick access</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={install}>Install</button>
          </div>
        </div>
      )}

      {canInstall && (
        <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
          <button onClick={install} className="gs-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', padding: '14px 32px' }}>
            <FiDownload size={20} /> Install App
          </button>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-muted)' }}>Install as a standalone app for quick access</p>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}