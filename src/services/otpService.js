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
    const statement = db.prepare(`
    SELECT id, phone, otp, created_at
    FROM otp_challenges
    WHERE phone = ? AND otp = ?
    LIMIT 1
  `)

    const challenge = statement.get(phone, otp)

    return Boolean(challenge)
}

module.exports = {
    createOtp,
    verifyOtp
}
