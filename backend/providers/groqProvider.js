import axios from "axios"
import { buildChatMessages } from "../assistantPrompt.js"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export const isGroqEnabled = () => process.env.GROQ_ENABLED !== "false" && Boolean(process.env.GROQ_API_KEY)

const buildGroqPayload = ({ model, messages, temperature, maxCompletionTokens }) => ({
  model,
  messages,
  temperature: Number.isFinite(temperature) ? temperature : 0.7,
  max_completion_tokens: Number.isFinite(maxCompletionTokens) ? maxCompletionTokens : 900
})

const sendGroqRequest = async ({ groqApiKey, model, messages, temperature, maxCompletionTokens }) => axios.post(
  GROQ_API_URL,
  buildGroqPayload({ model, messages, temperature, maxCompletionTokens }),
  {
    timeout: 20000,
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json"
    }
  }
)

const isGroqTokenPerDayLimitError = (error) => {
  const message = error.response?.data?.error?.message || ""
  return error.response?.status === 429 && /tokens per day|TPD/i.test(message)
}

const getEmergencyTokenBudget = (message = "", currentMaxCompletionTokens = 900, fallbackBudget = 64) => {
  const limitMatch = message.match(/Limit\s+(\d+)/i)
  const usedMatch = message.match(/Used\s+(\d+)/i)
  const requestedMatch = message.match(/Requested\s+(\d+)/i)

  if (limitMatch && usedMatch && requestedMatch) {
    const limit = Number.parseInt(limitMatch[1], 10)
    const used = Number.parseInt(usedMatch[1], 10)
    const requested = Number.parseInt(requestedMatch[1], 10)
    const remaining = limit - used

    if (
      Number.isFinite(remaining) &&
      Number.isFinite(requested) &&
      Number.isFinite(currentMaxCompletionTokens) &&
      currentMaxCompletionTokens > 32
    ) {
      const excessTokens = Math.max(0, requested - remaining)
      const adjustedBudget = currentMaxCompletionTokens - excessTokens - 24

      if (adjustedBudget > 32) {
        return adjustedBudget
      }
    }
  }

  return fallbackBudget
}

export const callGroqProvider = async ({ command, assistantName, userName, userMemory, assistantMode = "general", recentConversation = [] }) => {
  const groqApiKey = process.env.GROQ_API_KEY

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured")
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
  const temperature = Number.parseFloat(process.env.GROQ_TEMPERATURE || "0.7")
  const maxCompletionTokens = Number.parseInt(process.env.GROQ_MAX_COMPLETION_TOKENS || "900", 10)
  const messages = buildChatMessages({ command, assistantName, userName, userMemory, assistantMode, recentConversation })

  let response

  try {
    response = await sendGroqRequest({
      groqApiKey,
      model,
      messages,
      temperature,
      maxCompletionTokens
    })
  } catch (error) {
    if (!isGroqTokenPerDayLimitError(error)) {
      throw error
    }

    const message = error.response?.data?.error?.message || ""
    const emergencyTokenBudget = getEmergencyTokenBudget(message, maxCompletionTokens)

    console.warn(`[Groq] Token-per-day limit is tight. Retrying with reduced max_completion_tokens=${emergencyTokenBudget}`)

    response = await sendGroqRequest({
      groqApiKey,
      model,
      messages,
      temperature,
      maxCompletionTokens: emergencyTokenBudget
    })
  }

  const text = response.data?.choices?.[0]?.message?.content

  if (!text) {
    throw new Error("Groq returned an empty response")
  }

  return text
}
