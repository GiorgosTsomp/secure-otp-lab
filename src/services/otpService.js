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

function verifyOtp(challengeId, phone, otp) {
    const otpExpirySeconds =
        Number(process.env.OTP_EXPIRY_SECONDS) || 300

    const maxAttempts =
        Number(process.env.OTP_MAX_ATTEMPTS) || 5

    const expiryModifier = `-${otpExpirySeconds} seconds`

    const findStatement = db.prepare(`
    SELECT id, phone, otp, failed_attempts
    FROM otp_challenges
    WHERE id = ?
      AND phone = ?
      AND created_at >= datetime('now', ?)
      AND used_at IS NULL
    LIMIT 1
  `)

    const challenge = findStatement.get(
        challengeId,
        phone,
        expiryModifier
    )

    if (!challenge) {
        return false
    }

    if (challenge.failed_attempts >= maxAttempts) {
        return false
    }

    if (challenge.otp !== otp) {
        const incrementStatement = db.prepare(`
      UPDATE otp_challenges
      SET failed_attempts = failed_attempts + 1
      WHERE id = ?
    `)

        incrementStatement.run(challenge.id)

        return false
    }

    const consumeStatement = db.prepare(`
    UPDATE otp_challenges
    SET used_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND used_at IS NULL
      AND failed_attempts < ?
  `)

    const result = consumeStatement.run(
        challenge.id,
        maxAttempts
    )

    return result.changes === 1
}

module.exports = {
    createOtp,
    verifyOtp
}
