import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../lib/neon'
import { ParcelMap } from '../components/ParcelMap'
import { FiSearch, FiMapPin, FiCheckCircle, FiTruck, FiPackage, FiClock, FiArrowLeft, FiPrinter, FiDownload } from 'react-icons/fi'

interface Milestone {
  id: string
  location: string
  description: string
  status: string
  timestamp: string
}

interface Parcel {
  id: string
  tracking_code: string
  sender_name: string
  sender_email: string | null
  sender_contact: string | null
  recipient_name: string
  recipient_email: string | null
  recipient_contact: string | null
  origin: string
  destination: string
  weight: string | null
  description: string | null
  quantity: number | null
  shipment_date: string | null
  estimated_delivery: string | null
  status: string
  fee: number
  fee_note: string | null
  current_location: string | null
  parcel_image: string | null
  milestones: Milestone[]
  created_at: string
}

const statusIcons: Record<string, any> = {
  pending: FiClock, in_transit: FiTruck,
  out_for_delivery: FiPackage, delivered: FiCheckCircle,
  on_hold: FiClock, exception: FiPackage,
}

const statusLabels: Record<string, string> = {
  pending: 'Pending', in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  on_hold: 'On Hold', exception: 'Exception',
}

const statusColors: Record<string, string> = {
  pending: '#F59E0B', in_transit: '#3B82F6', out_for_delivery: '#8B5CF6',
  delivered: '#00A86B', on_hold: '#DC2626', exception: '#EF4444',
}

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openInvoice(parcel: Parcel) {
  const w = window.open('', '_blank')
  if (!w) return
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(parcel.tracking_code)}`
  w.document.write(`
<!DOCTYPE html>
<html>
<head><title>Invoice - ${parcel.tracking_code}</title>
<style>
  @page { margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
  body { color: #1a1a2e; background: #fff; padding: 40px; position: relative; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(0,168,107,0.06); pointer-events: none; z-index: 0; letter-spacing: 8px; }
  .invoice-wrap { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 3px solid #1B3A5C; margin-bottom: 24px; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .header-left img { height: 48px; background: #1B3A5C; border-radius: 6px; padding: 4px 8px; }
  .header-left h1 { font-size: 24px; color: #1B3A5C; }
  .company-address { font-size: 13px; color: #6B7280; margin-top: 4px; }
  .header-right { text-align: right; }
  .header-right h2 { font-size: 28px; color: #1B3A5C; letter-spacing: 2px; }
  .header-right p { font-size: 13px; color: #6B7280; }
  h3 { font-size: 14px; color: #1B3A5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #E5E7EB; }
  .section { margin-bottom: 24px; }
  .detail-table { width: 100%; border-collapse: collapse; }
  .detail-table td { padding: 6px 12px; font-size: 14px; vertical-align: top; }
  .detail-table td:first-child { color: #6B7280; font-weight: 600; width: 160px; }
  .detail-table td:last-child { color: #1a1a2e; }
  .two-col { display: flex; gap: 24px; }
  .two-col > div { flex: 1; }
  .qr-section { text-align: center; padding: 20px; margin-top: 16px; border-top: 1px solid #E5E7EB; }
  .qr-section img { width: 140px; height: 140px; }
  .qr-section p { font-size: 14px; color: #1B3A5C; font-weight: 700; margin-top: 8px; letter-spacing: 1px; }
  .footer { text-align: center; padding-top: 16px; border-top: 2px solid #E5E7EB; margin-top: 16px; font-size: 12px; color: #9CA3AF; }
  .safe-shopping { text-align: center; margin-top: 24px; }
  .safe-shopping { text-align: center; margin-top: 24px; }
  .safe-shopping img { width: 200px; height: auto; }
  .print-btn { display: block; margin: 20px auto; padding: 12px 32px; background: #1B3A5C; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
  .landscape-table { width: 100%; border-collapse: collapse; }
  .landscape-table td { padding: 6px 12px; font-size: 13px; vertical-align: top; border: 1px solid #E5E7EB; }
  .landscape-table td.label { color: #6B7280; font-weight: 600; background: #F9FAFB; width: 140px; }
  .landscape-table td.value { color: #1a1a2e; }
  .status-badge { display: inline-block; padding: 4px 14px; border-radius: 4px; font-weight: 700; font-size: 13px; color: #fff; }
  @media print { .print-btn { display: none; } .watermark { color: rgba(0,168,107,0.08); } }
</style></head>
<body>
<div class="watermark">CONFIRMED</div>
<div class="invoice-wrap">
  <div class="header">
    <div class="header-left">
      <img src="/icon.svg" alt="GlobalSend" />
      <div><h1>GlobalSend Platform</h1></div>
    </div>
    <div class="header-right">
      <h2>INVOICE</h2>
      <p>Tracking: <a href="${window.location.origin}/track/${parcel.tracking_code}" style="color: #1B3A5C; font-weight: 700; text-decoration: underline; text-underline-offset: 3px;">${parcel.tracking_code}</a></p>
      <p>Date: ${formatDate(parcel.created_at)}</p>
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <h3>Sender Details</h3>
      <table class="detail-table">
        <tr><td>Name</td><td>${parcel.sender_name}</td></tr>
        <tr><td>Email</td><td>${parcel.sender_email || '-'}</td></tr>
        <tr><td>Contact</td><td>${parcel.sender_contact || '-'}</td></tr>
      </table>
    </div>
    <div class="section">
      <h3>Recipient Details</h3>
      <table class="detail-table">
        <tr><td>Name</td><td>${parcel.recipient_name}</td></tr>
        <tr><td>Email</td><td>${parcel.recipient_email || '-'}</td></tr>
        <tr><td>Contact</td><td>${parcel.recipient_contact || '-'}</td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <h3>Shipment Details</h3>
    <table class="landscape-table">
      <tr>
        <td class="label">Tracking Code</td>
        <td class="value"><strong>${parcel.tracking_code}</strong></td>
        <td class="label">Status</td>
        <td class="value"><span class="status-badge" style="background: ${parcel.status === 'delivered' ? '#00A86B' : parcel.status === 'in_transit' ? '#3B82F6' : parcel.status === 'out_for_delivery' ? '#8B5CF6' : parcel.status === 'on_hold' || parcel.status === 'exception' ? '#DC2626' : '#F59E0B'}">${(parcel.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
      </tr>
      <tr>
        <td class="label">Origin</td>
        <td class="value">${parcel.origin}</td>
        <td class="label">Destination</td>
        <td class="value">${parcel.destination}</td>
      </tr>
      <tr>
        <td class="label">Weight</td>
        <td class="value">${parcel.weight || '-'}</td>
        <td class="label">Quantity</td>
        <td class="value">${parcel.quantity || 1}</td>
      </tr>
      <tr>
        <td class="label">Shipment Date</td>
        <td class="value">${formatDate(parcel.shipment_date)}</td>
        <td class="label">Est. Delivery</td>
        <td class="value">${formatDate(parcel.estimated_delivery)}</td>
      </tr>
      <tr>
        <td class="label">Description</td>
        <td class="value" colspan="3">${parcel.description || '-'}</td>
      </tr>
      <tr>
        <td class="label">Fee</td>
        <td class="value" colspan="3">${parcel.fee ? '$' + parcel.fee : '-'}${parcel.fee_note ? ' (' + parcel.fee_note + ')' : ''}</td>
      </tr>
    </table>
  </div>

  <div class="qr-section">
    <img src="${qrUrl}" alt="QR Code" />
    <p>${parcel.tracking_code}</p>
  </div>

  <div class="safe-shopping">
    <img src="/images/payment-security.png" alt="Payment Security" />
  </div>

  <div class="footer">
    <p>GlobalSend Platform &bull; support@globalsend.com</p>
    <p>This is an official invoice for tracking code ${parcel.tracking_code} &bull; Generated on ${new Date().toLocaleString()}</p>
  </div>

  <button class="print-btn" onclick="window.print()">Print Invoice</button>
</div>
</body></html>`)
  w.document.close()
}

export function PublicTracking() {
  const { code } = useParams()
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [codeInput, setCodeInput] = useState(code || '')

  useEffect(() => {
    if (code) { setCodeInput(code); fetchParcel(code) }
    else setLoading(false)
  }, [code])

  async function fetchParcel(trackingCode: string) {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchErr } = await db
        .rpc('get_parcel_by_tracking', { code: trackingCode.toUpperCase() })
      if (fetchErr || !data) { setError('Tracking code not found'); setParcel(null) }
      else setParcel({ ...data, milestones: data.milestones || [] } as unknown as Parcel)
    } catch { setError('Could not load tracking data') }
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (codeInput.trim()) {
      window.history.pushState({}, '', `/track/${codeInput.trim().toUpperCase()}`)
      fetchParcel(codeInput.trim())
    }
  }

  const StatusIcon = parcel ? (statusIcons[parcel.status] || FiClock) : FiClock

  return (
    <div className="tracking-page">
      <div className="tracking-hero">
        <Link to="/" className="tracking-back"><FiArrowLeft size={18} /> Back to Home</Link>
        <h1>Track Your Parcel</h1>
        <p>Enter your tracking number to see real-time updates</p>
        <form onSubmit={handleSearch} className="tracking-hero-form">
          <div className="tracking-input-group">
            <FiSearch size={20} />
            <input type="text" value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} placeholder="e.g. FX-2024-001" />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>
      </div>

      <div className="tracking-result">
        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="loading-screen"><div className="spinner" /></div>}

        {parcel && (
          <div className="tracking-result-layout">
            <div className="tracking-main-content">

              <div className="tracking-status-header" style={{ borderLeftColor: statusColors[parcel.status] || '#F59E0B' }}>
                <div className="tsh-left">
                  <StatusIcon size={28} style={{ color: statusColors[parcel.status] || '#F59E0B' }} />
                  <div>
                    <h2>{statusLabels[parcel.status] || parcel.status.replace('_', ' ')}</h2>
                    <span className="tsh-code">{parcel.tracking_code}</span>
                  </div>
                </div>
                <div className="tsh-right">
                  <button className="btn btn-outline" onClick={() => openInvoice(parcel)}>
                    <FiDownload size={16} /> Download Invoice
                  </button>
                </div>
              </div>

              <div className="tracking-details-table">
                <table>
                  <tbody>
                    <tr>
                      <td className="td-label">Sender</td>
                      <td className="td-value">{parcel.sender_name}</td>
                      <td className="td-label">Recipient</td>
                      <td className="td-value">{parcel.recipient_name}</td>
                    </tr>
                    {parcel.sender_email && (
                      <tr>
                        <td className="td-label">Sender Email</td>
                        <td className="td-value">{parcel.sender_email}</td>
                        <td className="td-label">Recipient Email</td>
                        <td className="td-value">{parcel.recipient_email || '-'}</td>
                      </tr>
                    )}
                    {parcel.sender_contact && (
                      <tr>
                        <td className="td-label">Sender Contact</td>
                        <td className="td-value">{parcel.sender_contact}</td>
                        <td className="td-label">Recipient Contact</td>
                        <td className="td-value">{parcel.recipient_contact || '-'}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="td-label">Origin</td>
                      <td className="td-value">{parcel.origin}</td>
                      <td className="td-label">Destination</td>
                      <td className="td-value">{parcel.destination}</td>
                    </tr>
                    <tr>
                      <td className="td-label">Weight</td>
                      <td className="td-value">{parcel.weight || '-'}</td>
                      <td className="td-label">Quantity</td>
                      <td className="td-value">{parcel.quantity || 1}</td>
                    </tr>
                    <tr>
                      <td className="td-label">Shipment Date</td>
                      <td className="td-value">{formatDate(parcel.shipment_date)}</td>
                      <td className="td-label">Est. Delivery</td>
                      <td className="td-value">{formatDate(parcel.estimated_delivery)}</td>
                    </tr>
                    <tr>
                      <td className="td-label">Current Location</td>
                      <td className="td-value" colSpan={3}>{parcel.current_location || '-'}</td>
                    </tr>
                    {parcel.description && (
                      <tr>
                        <td className="td-label">Description</td>
                        <td className="td-value" colSpan={3}>{parcel.description}</td>
                      </tr>
                    )}
                    {parcel.fee > 0 && (
                      <tr>
                        <td className="td-label">Fee</td>
                        <td className="td-value" colSpan={3}>
                          {parcel.fee}{parcel.fee_note ? ` (${parcel.fee_note})` : ''}
                        </td>
                      </tr>
                    )}
                    {parcel.parcel_image && (
                      <tr>
                        <td className="td-label">Parcel Image</td>
                        <td className="td-value" colSpan={3}>
                          <a href={parcel.parcel_image} target="_blank" rel="noreferrer">
                            <img src={parcel.parcel_image} alt="Parcel" style={{ maxHeight: 180, borderRadius: 8, border: '1px solid var(--color-border)', maxWidth: '100%' }} />
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="tracking-timeline-section">
                <h3>Tracking Timeline</h3>
                <div className="timeline">
                  {parcel.milestones.length === 0 && parcel.status === 'pending' ? (
                    <div className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <strong>Package Pending</strong>
                        <p>Awaiting pickup by carrier</p>
                      </div>
                    </div>
                  ) : (
                    parcel.milestones.map(ms => {
                      const Icon = statusIcons[ms.status] || FiMapPin
                      return (
                        <div key={ms.id} className="timeline-item">
                          <div className="timeline-dot"><Icon size={14} /></div>
                          <div className="timeline-content">
                            <strong>{ms.location}</strong>
                            <p>{ms.description}</p>
                            <small>{new Date(ms.timestamp).toLocaleString()}</small>
                          </div>
                        </div>
                      )
                    })
                  )}
                  {parcel.current_location && parcel.milestones.length > 0 && (
                    <div className="timeline-item current">
                      <div className="timeline-dot"><FiMapPin size={14} /></div>
                      <div className="timeline-content">
                        <strong>Current Location</strong>
                        <p>{parcel.current_location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="tracking-map-section">
                <h3>Route Map</h3>
                <ParcelMap
                  origin={parcel.origin}
                  destination={parcel.destination}
                  currentLocation={parcel.current_location}
                  milestones={parcel.milestones}
                />
              </div>
            </div>

            <div className="tracking-sidebar">
              <div className="sidebar-card">
                <h4><FiPrinter size={18} /> Invoice</h4>
                <p>Download a printable invoice for this shipment with all details.</p>
                <button className="btn btn-primary btn-block" onClick={() => openInvoice(parcel)}>
                  <FiDownload size={16} /> Print Invoice
                </button>
              </div>

              <div className="sidebar-card">
                <h4><FiPackage size={18} /> Shipment Summary</h4>
                <div className="summary-row">
                  <span className="summary-label">Status</span>
                  <span className="summary-value" style={{ color: statusColors[parcel.status] }}>
                    {statusLabels[parcel.status] || parcel.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Origin</span>
                  <span className="summary-value">{parcel.origin}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Destination</span>
                  <span className="summary-value">{parcel.destination}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Weight</span>
                  <span className="summary-value">{parcel.weight || '-'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Qty</span>
                  <span className="summary-value">{parcel.quantity || 1}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
