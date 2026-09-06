import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlFile = process.argv[2] ?? path.join(__dirname, '../neon/init.sql')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Run with: node --env-file=.env scripts/apply-schema.mjs')
  process.exit(1)
}

const sql = neon(databaseUrl)
const source = readFileSync(sqlFile, 'utf8')

function splitStatements(text) {
  const statements = []
  let buffer = ''
  let inDollar = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (!inDollar && ch === '$' && next === '$') {
      inDollar = true
      buffer += ch
      continue
    }
    if (inDollar && ch === '$' && next === '$') {
      inDollar = false
      buffer += ch
      continue
    }
    if (!inDollar && ch === ';' && (next === '\n' || next === '\r' || next === undefined)) {
      buffer += ch
      const trimmed = stripLeadingComments(buffer)
      if (trimmed.length > 0) statements.push(trimmed)
      buffer = ''
      continue
    }
    buffer += ch
  }
  const trimmed = stripLeadingComments(buffer)
  if (trimmed.length > 0) statements.push(trimmed)
  return statements
}

function stripLeadingComments(text) {
  const lines = text
    .split(/\r?\n/)
    .filter(line => line.trim().length === 0 || !line.trim().startsWith('--'))
  return lines.join('\n').trim()
}

const statements = splitStatements(source)

let executed = 0
for (const statement of statements) {
  try {
    await sql.query(statement)
    executed++
  } catch (err) {
    console.error(`\n[FAILED] statement ${executed + 1}:\n${statement.slice(0, 300)}\n`)
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

console.log(`Schema applied: ${executed} statements in ${path.basename(sqlFile)}`)