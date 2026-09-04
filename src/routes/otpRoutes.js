const express = require('express')
const {
    createOtp,
    verifyOtp
} = require('../services/otpService')

const router = express.Router()

router.post('/request', (req, res) => {
    const { phone } = req.body

    if (!phone) {
        return res.status(400).json({
            success: false,
            message: 'Phone number is required'
        })
    }

    const result = createOtp(phone)

    return res.status(201).json({
        success: true,
        message: 'OTP sent successfully',
        challengeId: result.id
    })
})

router.post('/verify', (req, res) => {
    const { challengeId, phone, otp } = req.body

    if (!challengeId || !phone || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Challenge ID, phone number, and OTP are required'
        })
    }

    const isValid = verifyOtp(challengeId, phone, otp)

    if (!isValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid OTP'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
    })
})

module.exports = router