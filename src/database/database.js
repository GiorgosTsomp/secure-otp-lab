const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../data/otp-lab.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    otp_digest TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME DEFAULT NULL,
    invalidated_at DATETIME DEFAULT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0
  )
`)

const columns = db.prepare(`
  PRAGMA table_info(otp_challenges)
`).all()

const hasUsedAt = columns.some(
  column => column.name === 'used_at'
)

if (!hasUsedAt) {
  db.exec(`
    ALTER TABLE otp_challenges
    ADD COLUMN used_at DATETIME DEFAULT NULL
  `)

  console.log('Database migration applied: added used_at column')
}

const hasFailedAttempts = columns.some(
  column => column.name === 'failed_attempts'
)

if (!hasFailedAttempts) {
  db.exec(`
    ALTER TABLE otp_challenges
    ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0
  `)

  console.log(
    'Database migration applied: added failed_attempts column'
  )
}

const hasInvalidatedAt = columns.some(
  column => column.name === 'invalidated_at'
)

if (!hasInvalidatedAt) {
  db.exec(`
    ALTER TABLE otp_challenges
    ADD COLUMN invalidated_at DATETIME DEFAULT NULL
  `)

  console.log(
    'Database migration applied: added invalidated_at column'
  )
}

console.log('SQLite database initialized')

module.exports = db