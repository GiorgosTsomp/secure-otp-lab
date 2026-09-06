const crypto = require('crypto')
const db = require('../database/database')
const { sendSms } = require('./mockSmsService')

function generateOtp() {
    const otpLength = Number(process.env.OTP_LENGTH) || 6

    const min = 10 ** (otpLength - 1)
    const max = 10 ** otpLength

    return crypto.randomInt(min, max).toString()
}

function createOtpDigest(otp) {
    const secret = process.env.OTP_HMAC_SECRET

    if (!secret) {
        throw new Error('OTP_HMAC_SECRET is required')
    }

    return crypto
        .createHmac('sha256', secret)
        .update(otp)
        .digest('hex')
}

const createChallengeTransaction = db.transaction(
    (phone, otpDigest) => {
        const invalidateStatement = db.prepare(`
      UPDATE otp_challenges
      SET invalidated_at = CURRENT_TIMESTAMP
      WHERE phone = ?
        AND used_at IS NULL
        AND invalidated_at IS NULL
    `)

        invalidateStatement.run(phone)

        const insertStatement = db.prepare(`
      INSERT INTO otp_challenges (phone, otp_digest)
      VALUES (?, ?)
    `)

        return insertStatement.run(phone, otpDigest)
    }
)

function createOtp(phone) {
    const otp = generateOtp()
    const otpDigest = createOtpDigest(otp)

    const result = createChallengeTransaction(
        phone,
        otpDigest
    )

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
    SELECT id, phone, otp_digest, failed_attempts
    FROM otp_challenges
    WHERE id = ?
      AND phone = ?
      AND created_at >= datetime('now', ?)
      AND used_at IS NULL
      AND invalidated_at IS NULL
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

    const submittedDigest = createOtpDigest(otp)

    const storedDigestBuffer = Buffer.from(
        challenge.otp_digest,
        'hex'
    )

    const submittedDigestBuffer = Buffer.from(
        submittedDigest,
        'hex'
    )

    const otpMatches = crypto.timingSafeEqual(
        storedDigestBuffer,
        submittedDigestBuffer
    )

    if (!otpMatches) {
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
