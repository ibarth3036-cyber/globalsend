import { S3Client, CreateBucketCommand, HeadBucketCommand, ListBucketsCommand } from '@aws-sdk/client-s3'

const endpoint = process.env.NEON_STORAGE_ENDPOINT
const accessKeyId = process.env.NEON_STORAGE_ACCESS_KEY_ID
const secretAccessKey = process.env.NEON_STORAGE_SECRET_ACCESS_KEY
const region = process.env.NEON_STORAGE_REGION || 'us-east-2'

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Neon storage env vars not set. Run with: node --env-file=.env scripts/create-buckets.mjs')
  process.exit(1)
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
})

const buckets = ['avatars', 'proofs']

for (const bucket of buckets) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    console.log(`${bucket}: already exists`)
    continue
  } catch { /* not found -> create */ }

  try {
    await client.send(
      new CreateBucketCommand({
        Bucket: bucket,
      })
    )
    console.log(`${bucket}: created`)
  } catch (err) {
    console.error(`${bucket}: FAILED -> ${err instanceof Error ? err.message : err}`)
  }
}

console.log('Done. Buckets:')
try {
  const { Buckets } = await client.send(new ListBucketsCommand({}))
  console.log((Buckets || []).map(b => b.Name).join(', '))
} catch (err) {
  console.log('List failed:', err instanceof Error ? err.message : err)
}