// Keep enough turns for natural follow-up questions without letting the prompt grow unbounded.
const MAX_MESSAGES_PER_CONVERSATION = 24
const MAX_MESSAGE_LENGTH = 1000
const ALLOWED_ROLES = new Set(["user", "assistant"])

const cleanConversationText = (value = "") => value.trim().replace(/\s+/g, " ").slice(0, MAX_MESSAGE_LENGTH)

const normalizeConversationEntry = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null
  }

  const role = ALLOWED_ROLES.has(entry.role) ? entry.role : null
  const content = cleanConversationText(entry.content || "")

  if (!role || !content) {
    return null
  }

  return { role, content }
}

export const getRecentConversation = ({ conversationHistory = [] }) => {
  if (!Array.isArray(conversationHistory)) {
    return []
  }

  return conversationHistory
    .map(normalizeConversationEntry)
    .filter(Boolean)
    .slice(-MAX_MESSAGES_PER_CONVERSATION)
}

export const appendConversationTurn = ({ conversationHistory = [], userInput, assistantResponse }) => {
  const nextConversation = [
    ...getRecentConversation({ conversationHistory }),
    normalizeConversationEntry({ role: "user", content: userInput }),
    normalizeConversationEntry({ role: "assistant", content: assistantResponse })
  ].filter(Boolean)

  return nextConversation.slice(-MAX_MESSAGES_PER_CONVERSATION)
}
