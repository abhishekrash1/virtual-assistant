// Request queue to prevent hitting API rate limits
class RequestQueue {
  constructor(maxConcurrent = 1, delayBetweenRequests = 2000) {
    this.queue = []
    this.running = 0
    this.maxConcurrent = maxConcurrent
    this.delayBetweenRequests = delayBetweenRequests
    this.lastRequestTime = 0
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const { task, resolve, reject } = this.queue.shift()

    try {
      // Enforce delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime
      if (timeSinceLastRequest < this.delayBetweenRequests) {
        await new Promise(r => setTimeout(r, this.delayBetweenRequests - timeSinceLastRequest))
      }

      this.lastRequestTime = Date.now()
      const result = await task()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.running--
      this.process()
    }
  }
}

export default RequestQueue
