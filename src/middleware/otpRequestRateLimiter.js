const phoneBuckets = new Map()
const ipBuckets = new Map()

function getBucketState(map, key, limit, windowMs) {
    const now = Date.now()

    let bucket = map.get(key)

    if (!bucket || now >= bucket.resetAt) {
        bucket = {
            count: 0,
            resetAt: now + windowMs
        }

        map.set(key, bucket)
    }

    return {
        bucket,
        allowed: bucket.count < limit,
        retryAfterMs: Math.max(bucket.resetAt - now, 0)
    }
}

function otpRequestRateLimiter(req, res, next) {
    const phone = req.body.phone

    if (!phone) {
        return next()
    }

    const windowSeconds =
        Number(process.env.OTP_REQUEST_WINDOW_SECONDS) || 60

    const maxPerPhone =
        Number(process.env.OTP_MAX_REQUESTS_PER_PHONE) || 3

    const maxPerIp =
        Number(process.env.OTP_MAX_REQUESTS_PER_IP) || 10

    const windowMs = windowSeconds * 1000

    const phoneState = getBucketState(
        phoneBuckets,
        phone,
        maxPerPhone,
        windowMs
    )

    const ipState = getBucketState(
        ipBuckets,
        req.ip,
        maxPerIp,
        windowMs
    )

    if (!phoneState.allowed || !ipState.allowed) {
        const retryAfterMs = Math.max(
            phoneState.allowed ? 0 : phoneState.retryAfterMs,
            ipState.allowed ? 0 : ipState.retryAfterMs
        )

        const retryAfterSeconds = Math.ceil(
            retryAfterMs / 1000
        )

        res.set('Retry-After', retryAfterSeconds.toString())

        return res.status(429).json({
            success: false,
            message: 'Too many OTP requests. Try again later.'
        })
    }

    phoneState.bucket.count += 1
    ipState.bucket.count += 1

    next()
}

module.exports = {
    otpRequestRateLimiter
}