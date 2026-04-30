const allowedTypes = new Set([
  "general",
  "google-search",
  "youtube-search",
  "youtube-play",
  "get-time",
  "get-date",
  "get-day",
  "get-month",
  "calculator-open",
  "instagram-open",
  "facebook-open",
  "weather-show"
])

const buildSafeGeneralResponse = (command, fallbackText) => JSON.stringify({
  type: "general",
  userInput: command,
  response: fallbackText
})

export const sanitizeAssistantResponseText = (value = "") => {
  if (typeof value !== "string") {
    return ""
  }

  return value
    .replace(/```([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(^|\s)(\*|_)([^*_]+)(\*|_)(?=\s|$)/g, "$1$3")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

export const normalizeProviderResponse = ({ rawText, command }) => {
  if (!rawText || typeof rawText !== "string") {
    return buildSafeGeneralResponse(command, "Main abhi theek se reply generate nahi kar paya. Ek baar phir bolo.")
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  const candidateText = jsonMatch ? jsonMatch[0] : rawText

  try {
    const parsed = JSON.parse(candidateText)
    const normalizedType = allowedTypes.has(parsed.type) ? parsed.type : "general"
    const normalizedUserInput = typeof parsed.userInput === "string" && parsed.userInput.trim()
      ? parsed.userInput.trim()
      : command
    const normalizedResponse = typeof parsed.response === "string" && parsed.response.trim()
      ? sanitizeAssistantResponseText(parsed.response)
      : "Main abhi uska better reply nahi bana paya. Ek baar aur bol do."

    return JSON.stringify({
      type: normalizedType,
      userInput: normalizedUserInput,
      response: normalizedResponse
    })
  } catch {
    return buildSafeGeneralResponse(command, candidateText.trim() || "Main abhi theek se reply generate nahi kar paya. Ek baar phir bolo.")
  }
}
