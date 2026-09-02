const db = require('../database/database')
const { sendSms } = require('./mockSmsService')

function generateOtp() {
    const otpLength = Number(process.env.OTP_LENGTH) || 6

    const min = 10 ** (otpLength - 1)
    const max = 10 ** otpLength

    return Math.floor(min + Math.random() * (max - min)).toString()
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

module.exports = {
    createOtp
}
