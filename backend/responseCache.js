// Simple in-memory cache for Gemini responses
class ResponseCache {
  constructor(ttl = 3600000) { // 1 hour default
    this.cache = new Map()
    this.ttl = ttl
  }

  getContextSignature(context = {}) {
    const rawContext = JSON.stringify(context)
    let hash = 0

    for (let index = 0; index < rawContext.length; index += 1) {
      hash = ((hash << 5) - hash + rawContext.charCodeAt(index)) | 0
    }

    return `${rawContext.length}:${hash}`
  }

  // Generate cache key from command + assistant + user id + conversational context
  generateKey(command, userId, assistantName, context = {}) {
    return `${command.toLowerCase().trim()}|${String(userId || "anonymous")}|${assistantName}|${this.getContextSignature(context)}`
  }

  get(command, userId, assistantName, context = {}) {
    const key = this.generateKey(command, userId, assistantName, context)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    console.log("[Cache HIT] Reused cached assistant response")
    return entry.response
  }

  set(command, userId, assistantName, response, context = {}) {
    const key = this.generateKey(command, userId, assistantName, context)
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    })
    console.log("[Cache SET] Stored assistant response in cache")
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl
    }
  }
}

export default ResponseCache
