export const BUCKET_AVATARS = 'avatars'
export const BUCKET_PROOFS = 'proofs'

interface PresignResponse {
  uploadUrl: string
  key: string
  publicUrl: string
}

export async function uploadFile(
  bucket: string,
  folder: string,
  file: File,
): Promise<{ publicUrl: string | null; error: string | null }> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const key = `${folder}/${crypto.randomUUID()}.${ext}`

  try {
    const res = await fetch('/api/storage/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket,
        key,
        contentType: file.type || 'application/octet-stream',
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return { publicUrl: null, error: body.error || `Upload failed (${res.status})` }
    }
    const { data } = (await res.json()) as { data: PresignResponse }

    const upload = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!upload.ok) return { publicUrl: null, error: `Upload failed (${upload.status})` }

    return { publicUrl: data.publicUrl, error: null }
  } catch {
    return { publicUrl: null, error: 'Unable to upload file. Check your connection.' }
  }
}