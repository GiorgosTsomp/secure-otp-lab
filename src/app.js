require('dotenv').config()

const express = require('express')

require('./database/database')

const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'running'
    })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Secure OTP Lab running on http://localhost:${PORT}`)
})