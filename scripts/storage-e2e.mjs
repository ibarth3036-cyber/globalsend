import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: process.env.NEON_STORAGE_REGION || 'us-east-2',
  endpoint: process.env.NEON_STORAGE_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.NEON_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEON_STORAGE_SECRET_ACCESS_KEY,
  },
})

const bucket = 'avatars'
const key = `opencode-e2e-test-${Date.now()}.txt`
const endpoint = process.env.NEON_STORAGE_ENDPOINT.replace(/\/+$/, '')

// 1. presign
const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'text/plain' }), { expiresIn: 300 })
console.log('presigned url ok:', uploadUrl.slice(0, 80))

// 2. PUT
const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'hello-neon-storage' })
console.log('PUT status:', put.status)

const publicUrl = `${endpoint}/${bucket}/${key}`
console.log('public url:', publicUrl)

// 3. anonymous GET (public_read only)
try {
  const get = await fetch(publicUrl)
  console.log('anonymous GET status:', get.status, (await get.text()).slice(0, 60))
} catch (err) {
  console.log('anonymous GET error:', err instanceof Error ? err.message : err)
}

// cleanup
await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
console.log('cleaned up')