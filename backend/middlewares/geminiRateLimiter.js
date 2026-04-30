// Rate limiting middleware for Gemini API requests
const userRequestTimes = new Map()

export const geminiRateLimiter = (maxRequestsPerMinute = 30) => {
  return (req, res, next) => {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Initialize or get user's request times
    if (!userRequestTimes.has(userId)) {
      userRequestTimes.set(userId, [])
    }

    const requestTimes = userRequestTimes.get(userId)

    // Remove requests older than 1 minute
    const recentRequests = requestTimes.filter(time => time > oneMinuteAgo)

    if (recentRequests.length >= maxRequestsPerMinute) {
      console.log(`[RateLimit] User ${userId} exceeded limit: ${recentRequests.length}/${maxRequestsPerMinute}`)
      return res.status(429).json({ 
        message: "Thoda slow karo! Bohot sare requests bheej rahe ho. Kripya thoda wait karo. You're sending too many requests! Please wait a bit.",
        type: "rate-limit",
        retryAfter: 60
      })
    }

    // Add current request time
    recentRequests.push(now)
    userRequestTimes.set(userId, recentRequests)

    // Log rate limit status
    console.log(`[RateLimit] User ${userId}: ${recentRequests.length}/${maxRequestsPerMinute} requests this minute`)

    next()
  }
}

// Optional: Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  for (const [userId, requestTimes] of userRequestTimes.entries()) {
    const recentRequests = requestTimes.filter(time => time > oneMinuteAgo)
    if (recentRequests.length === 0) {
      userRequestTimes.delete(userId)
    } else {
      userRequestTimes.set(userId, recentRequests)
    }
  }
}, 60000) // Cleanup every minute

export default geminiRateLimiter
