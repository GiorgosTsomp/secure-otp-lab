const crypto = require('crypto')
const db = require('../database/database')
const { sendSms } = require('./mockSmsService')

function generateOtp() {
    const otpLength = Number(process.env.OTP_LENGTH) || 6

    const min = 10 ** (otpLength - 1)
    const max = 10 ** otpLength

    return crypto.randomInt(min, max).toString()
}

function createOtp(phone) {
    const otp = generateOtp()

    const statement = db.prepare(`
    INSERT INTO otp_challenges (phone, otp)
    VALUES (?, ?)
  `)

    const result = statement.run(phone, otp)

    const message = `Your verification code is: ${otp}`

    sendSms(phone, message)

    return {
        id: result.lastInsertRowid
    }
}

function verifyOtp(phone, otp) {
    const otpExpirySeconds =
        Number(process.env.OTP_EXPIRY_SECONDS) || 300

    const expiryModifier = `-${otpExpirySeconds} seconds`

    const findStatement = db.prepare(`
    SELECT id
    FROM otp_challenges
    WHERE phone = ?
      AND otp = ?
      AND created_at >= datetime('now', ?)
      AND used_at IS NULL
    LIMIT 1
  `)

    const challenge = findStatement.get(
        phone,
        otp,
        expiryModifier
    )

    if (!challenge) {
        return false
    }

    const consumeStatement = db.prepare(`
    UPDATE otp_challenges
    SET used_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND used_at IS NULL
  `)

    const result = consumeStatement.run(challenge.id)

    return result.changes === 1
}

module.exports = {
    createOtp,
    verifyOtp
}
