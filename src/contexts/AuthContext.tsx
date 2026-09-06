import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { client, db, getUserId } from '../lib/neon'

export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  gender: string | null
  location: string | null
  avatar_url: string | null
  id_card_front: string | null
  id_card_back: string | null
  id_verified: boolean
  balance: number
  is_active: boolean
  role: 'user' | 'admin'
  preferred_currency: string
  account_tier: string
  blocked: boolean
  lock_message: string | null
}

interface AuthUser {
  id: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  dbError: string | null
  login: (email: string, password: string) => Promise<{ error: any }>
  signup: (email: string, password: string, data: Partial<Profile>) => Promise<{ error: any }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeProfile(data: Record<string, unknown>): Profile {
  return {
    ...(data as unknown as Profile),
    preferred_currency: (data.preferred_currency as string) || 'USD',
    account_tier: (data.account_tier as string) || 'basic',
    blocked: Boolean(data.blocked),
    lock_message: (data.lock_message as string) || null,
    avatar_url: (data.avatar_url as string) || null,
    phone: (data.phone as string) || null,
    gender: (data.gender as string) || null,
    location: (data.location as string) || null,
    id_card_front: (data.id_card_front as string) || null,
    id_card_back: (data.id_card_back as string) || null,
  }
}

async function fetchProfileFromDb(userId: string): Promise<Profile | null> {
  try {
    const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
    return (data as unknown as Record<string, unknown> | null)
      ? normalizeProfile(data as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

async function ensureProfileRow(userId: string, email: string, firstName?: string, lastName?: string): Promise<Profile | null> {
  try {
    await db.from('profiles').insert([
      {
        id: userId,
        email: email.toLowerCase(),
        first_name: firstName || '',
        last_name: lastName || '',
      },
    ]).select()
  } catch {
    // Profile row may already exist (insert would then violate PK/unique).
  }
  return fetchProfileFromDb(userId)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await client.auth.getSession()
        if (cancelled) return
        const sessionUser = data?.user ?? null
        if (!sessionUser?.id) {
          setLoading(false)
          return
        }
        const uid = sessionUser.id
        setUser({ id: uid, email: sessionUser.email || '' })
        let fresh = await fetchProfileFromDb(uid)
        if (cancelled) return
        if (!fresh) fresh = await ensureProfileRow(uid, sessionUser.email || '')
        if (cancelled) return
        if (fresh) {
          setProfile(fresh)
          setUser({ id: fresh.id, email: fresh.email })
          setDbError(null)
        } else {
          setDbError('Unable to connect to the database. Some features may be unavailable.')
        }
      } catch {
        if (!cancelled) setDbError('Unable to connect to the database. Some features may be unavailable.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function fetchProfile(userId: string) {
    const data = await fetchProfileFromDb(userId)
    if (data) {
      setProfile(data)
      setUser({ id: data.id, email: data.email })
    }
  }

  async function refreshProfile() {
    const uid = user?.id || (await getUserId())
    if (uid) await fetchProfile(uid)
  }

  async function login(email: string, password: string) {
    try {
      const { data, error } = await client.auth.signIn.email({ email, password })
      if (error || !data?.user) return { error: new Error(error?.message || 'Invalid email or password') }

      const uid = data.user.id
      let fresh = await fetchProfileFromDb(uid)
      if (!fresh) fresh = await ensureProfileRow(uid, data.user.email || email)
      if (fresh) {
        setUser({ id: fresh.id, email: fresh.email })
        setProfile(fresh)
        setDbError(null)
      } else {
        setDbError('Unable to connect to the database. Some features may be unavailable.')
      }
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') }
    }
  }

  async function signup(email: string, password: string, data: Partial<Profile>) {
    try {
      const firstName = data.first_name || ''
      const lastName = data.last_name || ''
      const { data: signUp, error } = await client.auth.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
      })
      if (error) return { error: new Error(error.message || 'Sign up failed') }

      // Create the account's profile row (RLS allows inserting your own profile).
      const uid = signUp?.user?.id || (await getUserId())
      if (uid) await ensureProfileRow(uid, email, firstName, lastName)

      // Sign up creates the account only; the user signs in on the login page.
      await client.auth.signOut()
      setUser(null)
      setProfile(null)
      setDbError(null)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') }
    }
  }

  async function logout() {
    try {
      await client.auth.signOut()
    } catch {
      // Sign out best-effort; clear local state regardless.
    }
    setUser(null)
    setProfile(null)
    setDbError(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, dbError, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}