import { useEffect, useState } from 'react'
import { db, getUserId } from '../../lib/neon'
import { uploadFile, BUCKET_PROOFS } from '../../lib/storage'
import { useCurrency } from '../../hooks/useCurrency'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit2, FiX, FiTrash2, FiSend, FiCopy, FiCheck } from 'react-icons/fi'
import { ParcelMap } from '../../components/ParcelMap'
import { ImageUpload } from '../../components/ImageUpload'

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
  created_at: string
  milestones: Milestone[]
}

const statusOptions = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'on_hold', 'exception']
const statusColors: Record<string, string> = {
  pending: '#F59E0B', in_transit: '#3B82F6', out_for_delivery: '#8B5CF6',
  delivered: '#00A86B', on_hold: '#DC2626', exception: '#EF4444',
}

export function AdminTracking() {
  const { info } = useCurrency()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    tracking_code: '', sender_name: '', sender_email: '', sender_contact: '',
    recipient_name: '', recipient_email: '', recipient_contact: '',
    origin: '', destination: '', weight: '', description: '',
    quantity: '1', shipment_date: '', estimated_delivery: '',
    fee: '', fee_note: '',
  })

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editFee, setEditFee] = useState('')
  const [editFeeNote, setEditFeeNote] = useState('')
  const [editLocation, setEditLocation] = useState('')

  const [milestoneLocation, setMilestoneLocation] = useState('')
  const [milestoneDesc, setMilestoneDesc] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [newParcelImage, setNewParcelImage] = useState<File | null>(null)
  const [editParcelImage, setEditParcelImage] = useState<File | null>(null)
  const [editParcelImagePreview, setEditParcelImagePreview] = useState('')

  useEffect(() => { loadParcels() }, [])

  function genCode() {
    return `FX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
  }

  function copyTrackingLink(code: string) {
    const url = `${window.location.origin}/track/${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function loadParcels() {
    const { data } = await db.from('parcels').select('*, milestones:tracking_milestones(*)').order('created_at', { ascending: false })
    setParcels((data || []) as unknown as Parcel[])
    setLoading(false)
  }

  async function createParcel(e: React.FormEvent) {
    e.preventDefault()
    const code = form.tracking_code || genCode()
    const user = await getUserId()

    let parcelImageUrl: string | null = null
    if (newParcelImage) {
      const { publicUrl } = await uploadFile(BUCKET_PROOFS, 'parcels', newParcelImage)
      parcelImageUrl = publicUrl
    }

    const { error } = await db.from('parcels').insert({
      tracking_code: code,
      sender_name: form.sender_name, sender_email: form.sender_email || null, sender_contact: form.sender_contact || null,
      recipient_name: form.recipient_name, recipient_email: form.recipient_email || null, recipient_contact: form.recipient_contact || null,
      origin: form.origin, destination: form.destination,
      weight: form.weight || null, description: form.description || null,
      quantity: parseInt(form.quantity) || 1,
      shipment_date: form.shipment_date || null, estimated_delivery: form.estimated_delivery || null,
      fee: parseFloat(form.fee) || 0, fee_note: form.fee_note || null,
      created_by: user,
      parcel_image: parcelImageUrl,
    })
    if (!error) {
      setShowForm(false)
      setForm({ tracking_code: '', sender_name: '', sender_email: '', sender_contact: '', recipient_name: '', recipient_email: '', recipient_contact: '', origin: '', destination: '', weight: '', description: '', quantity: '1', shipment_date: '', estimated_delivery: '', fee: '', fee_note: '' })
      setNewParcelImage(null)
      loadParcels()
    }
  }

  function openEdit(p: Parcel) {
    setEditId(p.id)
    setEditFee(String(p.fee))
    setEditFeeNote(p.fee_note || '')
    setEditLocation(p.current_location || '')
  }

  async function saveEdit(id: string) {
    const p = parcels.find(x => x.id === id)
    if (!p) return

    let imageUrl: string | undefined = undefined
    if (editParcelImage) {
      const { publicUrl, error: upErr } = await uploadFile(BUCKET_PROOFS, 'parcels', editParcelImage)
      if (!upErr && publicUrl) imageUrl = publicUrl
    }

    const updates: Record<string, any> = {
      fee: parseFloat(editFee) || 0,
      fee_note: editFeeNote || null,
      current_location: editLocation || null,
    }
    if (imageUrl) updates.parcel_image = imageUrl

    await db.from('parcels').update(updates).eq('id', id)
    setEditId(null)
    setEditParcelImage(null)
    setEditParcelImagePreview('')
    loadParcels()
  }

  async function addMilestone(parcelId: string) {
    if (!milestoneLocation.trim()) return
    await db.from('tracking_milestones').insert({
      parcel_id: parcelId,
      location: milestoneLocation.trim(),
      description: milestoneDesc.trim() || '',
      status: 'in_transit',
    })
    await db.from('parcels').update({ current_location: milestoneLocation.trim() }).eq('id', parcelId)
    setMilestoneLocation('')
    setMilestoneDesc('')
    loadParcels()
  }

  async function deleteParcel(parcelId: string) {
    if (!confirm('Are you sure you want to delete this parcel?')) return
    await db.from('parcels').delete().eq('id', parcelId)
    loadParcels()
    if (selectedParcelId === parcelId) setSelectedParcelId(null)
  }

  async function updateParcelStatus(parcelId: string, newStatus: string) {
    await db.from('parcels').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', parcelId)
    loadParcels()
  }

  if (loading) return <div className="admin-page"><div className="loading-screen"><div className="spinner" /></div></div>

  const selectedParcel = selectedParcelId ? parcels.find(p => p.id === selectedParcelId) : null

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Parcel Tracking</h1>
        <div className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Overview</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/transactions" className="admin-nav-link">Transactions</Link>
          <Link to="/admin/tracking" className="admin-nav-link active">Tracking</Link>
          <Link to="/admin/accounts" className="admin-nav-link">Accounts</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setForm({ ...form, tracking_code: genCode() }) }}>
          <FiPlus size={16} /> Create Parcel
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>New Parcel</h3>
          <form onSubmit={createParcel}>
            <div className="form-group">
              <label>Tracking Code</label>
              <input type="text" value={form.tracking_code} onChange={e => setForm({ ...form, tracking_code: e.target.value })} required />
            </div>
            <fieldset className="form-fieldset">
              <legend>Sender Details</legend>
              <div className="form-row triple">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input type="text" value={form.sender_contact} onChange={e => setForm({ ...form, sender_contact: e.target.value })} placeholder="Phone number" />
                </div>
              </div>
            </fieldset>
            <fieldset className="form-fieldset">
              <legend>Recipient Details</legend>
              <div className="form-row triple">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input type="text" value={form.recipient_contact} onChange={e => setForm({ ...form, recipient_contact: e.target.value })} placeholder="Phone number" />
                </div>
              </div>
            </fieldset>
            <div className="form-row triple">
              <div className="form-group">
                <label>Origin</label>
                <input type="text" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Destination</label>
                <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Weight</label>
                <input type="text" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 2.5kg" />
              </div>
            </div>
            <div className="form-row triple">
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} min="1" />
              </div>
              <div className="form-group">
                <label>Shipment Date</label>
                <input type="date" value={form.shipment_date} onChange={e => setForm({ ...form, shipment_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Est. Delivery</label>
                <input type="date" value={form.estimated_delivery} onChange={e => setForm({ ...form, estimated_delivery: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Fee ({info.code})</label>
                <input type="text" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="0 or text" />
              </div>
            </div>
            <div className="form-group">
              <label>Fee Note</label>
              <input type="text" value={form.fee_note} onChange={e => setForm({ ...form, fee_note: e.target.value })} placeholder="Reason for fee" />
            </div>
            <div className="form-group">
              <ImageUpload
                label="Parcel Image"
                onFile={setNewParcelImage}
                crop={false}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Parcel</button>
            </div>
          </form>
        </div>
      )}

      <div className="tracking-layout">
        <div className="tracking-table-section">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Route</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => (
                <tr key={p.id}
                  style={{ cursor: 'pointer', backgroundColor: selectedParcelId === p.id ? 'rgba(77,20,140,0.06)' : '' }}
                  onClick={() => setSelectedParcelId(selectedParcelId === p.id ? null : p.id)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Link to={`/track/${p.tracking_code}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#1B3A5C', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                        onClick={e => e.stopPropagation()}>
                        {p.tracking_code}
                      </Link>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyTrackingLink(p.tracking_code) }}
                        title="Copy tracking link" style={{ padding: 2, flexShrink: 0 }}>
                        {copiedCode === p.tracking_code ? <FiCheck size={14} color="#00A86B" /> : <FiCopy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td><div className="cell-name">{p.sender_name}</div></td>
                  <td><div className="cell-name">{p.recipient_name}</div></td>
                  <td><span className="cell-route">{p.origin} &rarr; {p.destination}</span></td>
                  <td>{p.weight || '-'}</td>
                  <td>
                    <select value={p.status} onChange={e => updateParcelStatus(p.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="status-select" style={{ borderColor: statusColors[p.status] || '#ddd' }}>
                      {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="admin-actions" onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => openEdit(p)} title="Edit"><FiEdit2 size={18} /></button>
                      <button className="icon-btn" onClick={() => deleteParcel(p.id)} title="Delete" style={{ color: '#DC2626' }}><FiTrash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedParcel && (
          <div className="tracking-detail-panel">
            <div className="tracking-detail-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3>{selectedParcel.tracking_code}</h3>
                  <button className="icon-btn" onClick={() => copyTrackingLink(selectedParcel.tracking_code)} title="Copy tracking link" style={{ padding: 2 }}>
                    {copiedCode === selectedParcel.tracking_code ? <FiCheck size={16} color="#00A86B" /> : <FiCopy size={16} />}
                  </button>
                </div>
                <span className="badge" style={{ background: statusColors[selectedParcel.status] || '#6B7280', color: '#fff' }}>
                  {selectedParcel.status.replace('_', ' ')}
                </span>
              </div>
              <button className="icon-btn" onClick={() => setSelectedParcelId(null)}><FiX size={20} /></button>
            </div>

            <div className="tracking-detail-body">
              <div className="detail-section">
                <h4>Shipment Information</h4>
                <div className="detail-grid">
                  <div className="detail-col">
                    <div className="info-row"><label>Sender</label><span>{selectedParcel.sender_name}</span></div>
                    {selectedParcel.sender_email && <div className="info-row"><label>Email</label><span>{selectedParcel.sender_email}</span></div>}
                    {selectedParcel.sender_contact && <div className="info-row"><label>Contact</label><span>{selectedParcel.sender_contact}</span></div>}
                  </div>
                  <div className="detail-col">
                    <div className="info-row"><label>Recipient</label><span>{selectedParcel.recipient_name}</span></div>
                    {selectedParcel.recipient_email && <div className="info-row"><label>Email</label><span>{selectedParcel.recipient_email}</span></div>}
                    {selectedParcel.recipient_contact && <div className="info-row"><label>Contact</label><span>{selectedParcel.recipient_contact}</span></div>}
                  </div>
                </div>
                <div className="info-grid-compact">
                  <div className="info-row"><label>Origin</label><span>{selectedParcel.origin}</span></div>
                  <div className="info-row"><label>Destination</label><span>{selectedParcel.destination}</span></div>
                  <div className="info-row"><label>Weight</label><span>{selectedParcel.weight || '-'}</span></div>
                  <div className="info-row"><label>Quantity</label><span>{selectedParcel.quantity || 1}</span></div>
                  <div className="info-row"><label>Shipment Date</label><span>{selectedParcel.shipment_date ? new Date(selectedParcel.shipment_date).toLocaleDateString() : '-'}</span></div>
                  <div className="info-row"><label>Est. Delivery</label><span>{selectedParcel.estimated_delivery ? new Date(selectedParcel.estimated_delivery).toLocaleDateString() : '-'}</span></div>
                  <div className="info-row"><label>Fee</label><span>{selectedParcel.fee ? `${info.code} ${selectedParcel.fee}` : '-'}{selectedParcel.fee_note ? ` (${selectedParcel.fee_note})` : ''}</span></div>
                  <div className="info-row"><label>Current Location</label><span>{selectedParcel.current_location || '-'}</span></div>
                </div>
                {selectedParcel.description && (
                  <div className="info-row" style={{ marginTop: 8 }}>
                    <label>Description</label>
                    <span>{selectedParcel.description}</span>
                  </div>
                )}
                {selectedParcel.parcel_image && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Parcel Image</label>
                    <a href={selectedParcel.parcel_image} target="_blank" rel="noreferrer">
                      <img src={selectedParcel.parcel_image} alt="Parcel" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    </a>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Add Milestone</h4>
                <div className="milestone-input-row">
                  <input type="text" value={milestoneLocation} onChange={e => setMilestoneLocation(e.target.value)}
                    placeholder="Location name" className="ms-input" />
                  <input type="text" value={milestoneDesc} onChange={e => setMilestoneDesc(e.target.value)}
                    placeholder="Description (optional)" className="ms-input" />
                  <button className="btn btn-primary btn-sm" onClick={() => addMilestone(selectedParcel.id)}
                    disabled={!milestoneLocation.trim()}>
                    <FiSend size={14} /> Add
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h4>Edit Shipment</h4>
                <div className="edit-shipment-row" style={{ marginBottom: 12 }}>
                  <div className="edit-field">
                    <label>Fee ({info.code})</label>
                    <input type="text" value={editId === selectedParcel.id ? editFee : String(selectedParcel.fee)}
                      onChange={e => { setEditId(selectedParcel.id); setEditFee(e.target.value) }} />
                  </div>
                  <div className="edit-field">
                    <label>Fee Note</label>
                    <input type="text" value={editId === selectedParcel.id ? editFeeNote : (selectedParcel.fee_note || '')}
                      onChange={e => { setEditId(selectedParcel.id); setEditFeeNote(e.target.value) }} />
                  </div>
                  <div className="edit-field">
                    <label>Location</label>
                    <input type="text" value={editId === selectedParcel.id ? editLocation : (selectedParcel.current_location || '')}
                      onChange={e => { setEditId(selectedParcel.id); setEditLocation(e.target.value) }} />
                  </div>
                  {editId === selectedParcel.id && (
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(selectedParcel.id)} style={{ alignSelf: 'flex-end' }}>Save</button>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Parcel Image</label>
                  <ImageUpload
                    label={selectedParcel.parcel_image ? 'Change Image' : 'Upload Image'}
                    onFile={(file) => {
                      setEditParcelImage(file)
                      const reader = new FileReader()
                      reader.onload = () => setEditParcelImagePreview(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                    currentUrl={editParcelImagePreview || selectedParcel.parcel_image || undefined}
                    crop={false}
                  />
                </div>
              </div>

              <div className="detail-section">
                <h4>Timeline</h4>
                <div className="timeline-compact">
                  {(selectedParcel.milestones || []).length === 0 ? (
                    <div className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content"><strong>Pending</strong><p>Awaiting pickup</p></div>
                    </div>
                  ) : (
                    selectedParcel.milestones.map(ms => (
                      <div key={ms.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <strong>{ms.location}</strong>
                          <p>{ms.description}</p>
                          <small>{new Date(ms.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Route Map</h4>
                <div className="tracking-map-container">
                  <ParcelMap
                    origin={selectedParcel.origin}
                    destination={selectedParcel.destination}
                    currentLocation={selectedParcel.current_location}
                    milestones={selectedParcel.milestones}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editId && !selectedParcel && parcels.find(p => p.id === editId) && (
        <div className="modal-overlay" onClick={() => setEditId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit {parcels.find(p => p.id === editId)?.tracking_code}</h3>
            <div className="form-group"><label>Fee ({info.code})</label><input type="text" value={editFee} onChange={e => setEditFee(e.target.value)} /></div>
            <div className="form-group"><label>Fee Note</label><input type="text" value={editFeeNote} onChange={e => setEditFeeNote(e.target.value)} /></div>
            <div className="form-group"><label>Current Location</label><input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} /></div>
            <div className="form-group">
              <ImageUpload
                label="Parcel Image"
                onFile={(file) => {
                  setEditParcelImage(file)
                  const reader = new FileReader()
                  reader.onload = () => setEditParcelImagePreview(reader.result as string)
                  reader.readAsDataURL(file)
                }}
                currentUrl={editParcelImagePreview || parcels.find(p => p.id === editId)?.parcel_image || undefined}
                crop={false}
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={() => saveEdit(editId)}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
