function sendSms(phone, message) {
    console.log('\n=================================')
    console.log('          SMS OTP Service')
    console.log('=================================')
    console.log(`To: ${phone}`)
    console.log('')
    console.log(message)
    console.log('=================================\n')
}

module.exports = {
    sendSms
}
