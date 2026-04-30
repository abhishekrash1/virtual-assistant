export const sanitizeAssistantDisplayText = (value = "") => {
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

export const sanitizeAssistantSpeechText = (value = "") => sanitizeAssistantDisplayText(value)
  .replace(/\s+/g, " ")
  .trim()
