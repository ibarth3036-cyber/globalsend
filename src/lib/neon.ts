import { createClient } from '@neondatabase/neon-js'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || ''
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL || ''

export const client = createClient({
  auth: { url: authUrl, allowAnonymous: true },
  dataApi: { url: dataApiUrl },
})

export const db = client

export async function getUserId(): Promise<string | null> {
  try {
    const { data } = await client.auth.getSession()
    return data?.user?.id ?? null
  } catch {
    return null
  }
}