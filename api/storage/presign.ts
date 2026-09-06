import type { IncomingMessage, ServerResponse } from 'node:http'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { readBody, sendData, sendError } from '../_lib/db'

const ALLOWED_BUCKETS = new Set(['avatars', 'proofs'])

interface PresignBody {
  bucket?: string
  key?: string
  contentType?: string
}

function s3Client(): S3Client {
  const endpoint = process.env.NEON_STORAGE_ENDPOINT
  const accessKeyId = process.env.NEON_STORAGE_ACCESS_KEY_ID
  const secretAccessKey = process.env.NEON_STORAGE_SECRET_ACCESS_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Neon Object Storage credentials are not configured')
  }
  return new S3Client({
    region: process.env.NEON_STORAGE_REGION || 'us-east-2',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export default async function presignHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  const body = (await readBody(req)) as PresignBody | null
  if (!body?.bucket || !body?.key) return sendError(res, 'Bucket and key are required')
  if (!ALLOWED_BUCKETS.has(body.bucket)) return sendError(res, 'Unknown bucket', 403)

  const contentType = body.contentType || 'application/octet-stream'

  try {
    const command = new PutObjectCommand({
      Bucket: body.bucket,
      Key: body.key,
      ContentType: contentType,
    })
    const uploadUrl = await getSignedUrl(s3Client(), command, { expiresIn: 300 })
    const endpoint = process.env.NEON_STORAGE_ENDPOINT as string
    const publicUrl = `${endpoint.replace(/\/+$/, '')}/${body.bucket}/${body.key}`
    sendData(res, { uploadUrl, key: body.key, publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to prepare upload'
    sendError(res, message, 500)
  }
}