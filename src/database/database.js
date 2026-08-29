const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../data/otp-lab.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

console.log('SQLite database initialized')

module.exports = db