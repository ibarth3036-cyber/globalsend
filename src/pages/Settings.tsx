import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { ImageUpload } from '../components/ImageUpload'
import { SearchSelect } from '../components/SearchSelect'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency } from '../hooks/useCurrency'
import { db } from '../lib/neon'
import { uploadFile, BUCKET_AVATARS } from '../lib/storage'
import { FiSun, FiMoon, FiEye, FiEyeOff, FiSave } from 'react-icons/fi'

export function Settings() {
  const { profile, refreshProfile } = useAuth()
  const { dark, toggle } = useTheme()
  const { setCurrency, format, currencies } = useCurrency()
  const [hideBalance, setHideBalance] = useState(false)
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [preferredCurrency, setPreferredCurrency] = useState(profile?.preferred_currency || 'USD')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!profile) return null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    let avatarUrl = profile?.avatar_url

    if (avatarFile) {
      const { publicUrl, error: upErr } = await uploadFile(BUCKET_AVATARS, 'avatars', avatarFile)
      if (!upErr && publicUrl) avatarUrl = publicUrl
    }

    const { error } = await db
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        location,
        avatar_url: avatarUrl,
        preferred_currency: preferredCurrency,
      })
      .eq('id', profile?.id)

    setSaving(false)
    if (error) { setMessage('Error saving: ' + error.message); return }
    setMessage('Settings saved!')
    setCurrency(preferredCurrency as any)
    refreshProfile()
  }

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.symbol} ${c.code} — ${c.name}`,
  }))

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <h1>Settings</h1>

        {message && <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="setting-row">
            <span>Dark Mode</span>
            <button className="toggle-btn" onClick={toggle}>
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
              <span>{dark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
          <div className="setting-row">
            <span>Hide Balance</span>
            <button className="toggle-btn" onClick={() => setHideBalance(!hideBalance)}>
              {hideBalance ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              <span>{hideBalance ? 'Show' : 'Hide'}</span>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Currency</h3>
          <SearchSelect
            label="Preferred Currency"
            value={preferredCurrency}
            onChange={v => setPreferredCurrency(v as any)}
            options={currencyOptions}
          />
          <p className="setting-hint">Preview: {format(1250.50)}</p>
        </div>

        <div className="settings-section">
          <h3>Profile</h3>
          <form onSubmit={handleSave}>
            <ImageUpload
              label="Profile Picture"
              onFile={setAvatarFile}
              crop
              aspect={1}
              cropShape="round"
              currentUrl={profile?.avatar_url || undefined}
            />
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
