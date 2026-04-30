import axios from "axios"
import ResponseCache from "./responseCache.js"
import getMockResponse from "./mockGemini.js"
import { buildGeminiPrompt } from "./assistantPrompt.js"
import { normalizeAssistantMode } from "./assistantModes.js"
import { getRecentConversation } from "./conversationMemory.js"
import { callGroqProvider, isGroqEnabled } from "./providers/groqProvider.js"
import { normalizeProviderResponse } from "./aiResponseUtils.js"
import { buildDeveloperCreditResponse, isDeveloperCreditQuery } from "./developerIdentity.js"

// Global response cache
const responseCache = new ResponseCache(3600000) // 1 hour cache
const providerState = {
  gemini: { cooldownUntil: 0 },
  groq: { cooldownUntil: 0 }
}

const getRetryDelayMs = (error, fallbackMs = 60000) => {
  const message = error.response?.data?.error?.message || ""

  // When the Gemini project has effectively no usable free-tier quota left,
  // retrying every few seconds just wastes time before Groq can answer.
  if (/quota exceeded/i.test(message) && /limit:\s*0/i.test(message)) {
    return Math.max(fallbackMs, 60 * 60 * 1000)
  }

  const retryAfterHeader = error.response?.headers?.["retry-after"]
  if (retryAfterHeader) {
    const retryAfterSeconds = Number.parseFloat(retryAfterHeader)
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.ceil(retryAfterSeconds * 1000)
    }
  }

  const retryInfo = error.response?.data?.error?.details?.find((detail) => detail?.["@type"]?.includes("RetryInfo"))
  const retryDelay = retryInfo?.retryDelay

  if (typeof retryDelay === "string") {
    const seconds = Number.parseFloat(retryDelay.replace("s", ""))
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000)
    }
  }

  const retryMatch = message.match(/retry in\s+([\d.]+)s/i)
  if (retryMatch) {
    const seconds = Number.parseFloat(retryMatch[1])
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000)
    }
  }

  return fallbackMs
}

const normalizeIdentity = ({ assistantName, userName, userId }) => ({
  assistantName: assistantName?.trim() || "Assistant",
  userName: userName?.trim() || "User",
  userId: String(userId || "anonymous")
})

const shouldBypassCache = (command = "") => /(?:\b\d+\s*(?:sec(?:ond)?s?|minute|min|mins)\b|\bone\s+minute\b|\bek\s+minute\b|lagatar|continue\s+speaking|keep\s+talking|keep\s+speaking|non[-\s]?stop|without\s+stopping)/i.test(command)

const buildCacheContext = ({ assistantMode = "general", recentConversation = [], userMemory = {} } = {}) => ({
  assistantMode,
  recentConversation: recentConversation.map((entry) => ({
    role: entry?.role || "",
    content: entry?.content || ""
  })),
  userMemory: {
    updatedAt: userMemory?.updatedAt || null,
    profile: userMemory?.profile || {},
    preferences: userMemory?.preferences || {},
    likes: userMemory?.likes || [],
    dislikes: userMemory?.dislikes || [],
    goals: userMemory?.goals || [],
    notes: userMemory?.notes || []
  }
})

const isGeminiEnabled = () => process.env.GEMINI_ENABLED !== "false" && Boolean(process.env.GEMINI_API_URL)

const isProviderCoolingDown = (providerName) => Date.now() < providerState[providerName].cooldownUntil

const markProviderCoolingDown = (providerName, error, fallbackMs) => {
  providerState[providerName].cooldownUntil = Date.now() + getRetryDelayMs(error, fallbackMs)
}

const buildErrorSummary = (error) => error.response?.data?.error?.message || error.message

const callGeminiProvider = async ({ command, assistantName, userName, userMemory, assistantMode = "general", recentConversation = [] }) => {
  const apiUrl = process.env.GEMINI_API_URL

  if (!apiUrl) {
    throw new Error("GEMINI_API_URL is not configured")
  }

  const result = await axios.post(
    apiUrl,
    {
      contents: [{
        parts: [{ text: buildGeminiPrompt({ command, assistantName, userName, userMemory, assistantMode, recentConversation }) }]
      }]
    },
    { timeout: 20000 }
  )

  const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("Gemini returned an empty response")
  }

  return text
}

const geminiResponse = async (command, assistantName, userName, userId, options = {}) => {
  const cleanedCommand = command?.trim() || ""
  const identity = normalizeIdentity({ assistantName, userName, userId })
  const debugMode = process.env.DEBUG_MODE === "true"
  const useMock = process.env.USE_MOCK_RESPONSES === "true"
  const recentConversation = getRecentConversation({ conversationHistory: options.recentConversation })
  const userMemory = options.userMemory || {}
  const assistantMode = normalizeAssistantMode(options.assistantMode)
  const bypassCache = shouldBypassCache(cleanedCommand)
  const cacheContext = buildCacheContext({ assistantMode, recentConversation, userMemory })

  if (!bypassCache) {
    const cachedResponse = responseCache.get(cleanedCommand, identity.userId, identity.assistantName, cacheContext)
    if (cachedResponse) {
      return cachedResponse
    }
  }

  const localIntentResponse = getMockResponse(cleanedCommand, identity.assistantName, identity.userName, {
    forceFallback: false,
    assistantMode
  })
  if (localIntentResponse) {
    console.log("[Gemini] Local intent handled without API call")
    return localIntentResponse
  }

  if (isDeveloperCreditQuery(cleanedCommand)) {
    const developerResponse = buildDeveloperCreditResponse({
      command: cleanedCommand,
      assistantName: identity.assistantName
    })
    if (!bypassCache) {
      responseCache.set(cleanedCommand, identity.userId, identity.assistantName, developerResponse, cacheContext)
    }
    return developerResponse
  }

  if (debugMode || useMock) {
    console.log(`[Gemini] DEBUG/MOCK MODE ACTIVE - Using mock responses`)
    return getMockResponse(cleanedCommand, identity.assistantName, identity.userName, { assistantMode })
  }

  const providers = [
    {
      name: "gemini",
      enabled: isGeminiEnabled(),
      cooldownMs: 60000,
      call: callGeminiProvider
    },
    {
      name: "groq",
      enabled: isGroqEnabled(),
      cooldownMs: 120000,
      call: callGroqProvider
    }
  ]

  for (const provider of providers) {
    if (!provider.enabled) {
      continue
    }

    if (isProviderCoolingDown(provider.name)) {
      console.warn(`[AI] ${provider.name} cooldown active. Skipping provider`)
      continue
    }

    try {
      console.log(`[AI] Trying provider: ${provider.name}`)
        const providerResponse = await provider.call({
          command: cleanedCommand,
          assistantName: identity.assistantName,
          userName: identity.userName,
          userMemory,
          assistantMode,
          recentConversation
        })
      const normalizedResponse = normalizeProviderResponse({
        rawText: providerResponse,
        command: cleanedCommand
      })

      if (!bypassCache) {
        responseCache.set(cleanedCommand, identity.userId, identity.assistantName, normalizedResponse, cacheContext)
      }
      return normalizedResponse
    } catch (error) {
      const status = error.response?.status
      const errorSummary = buildErrorSummary(error)
      const shouldCooldown = status === 429 || status === 401 || status === 403

      console.error(`[AI] ${provider.name} failed - Status: ${status}, Error: ${errorSummary}`)

      if (shouldCooldown) {
        markProviderCoolingDown(provider.name, error, provider.cooldownMs)
      }

      continue
    }
  }

  return getMockResponse(cleanedCommand, identity.assistantName, identity.userName, { assistantMode })
}

export default geminiResponse
