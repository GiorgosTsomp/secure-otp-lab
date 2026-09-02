const express = require('express')
const { createOtp } = require('../services/otpService')

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

module.exports = router