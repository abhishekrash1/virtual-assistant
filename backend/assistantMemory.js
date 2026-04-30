const MAX_LIST_ITEMS = 6
const MAX_VALUE_LENGTH = 80
const MAX_NOTE_LENGTH = 140

const createEmptyAssistantMemory = () => ({
  profile: {
    preferredName: "",
    location: "",
    profession: "",
    education: ""
  },
  preferences: {
    language: "",
    responseStyle: ""
  },
  likes: [],
  dislikes: [],
  goals: [],
  notes: [],
  updatedAt: null
})

const cleanValue = (value = "", maxLength = MAX_VALUE_LENGTH) => value
  .replace(/\s+/g, " ")
  .replace(/^["'\s]+|["'\s]+$/g, "")
  .trim()
  .slice(0, maxLength)

const normalizeList = (items = [], maxLength = MAX_VALUE_LENGTH) => {
  const unique = []
  const seen = new Set()

  for (const item of items) {
    const cleaned = cleanValue(item || "", maxLength)
    if (!cleaned) {
      continue
    }

    const key = cleaned.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(cleaned)

    if (unique.length >= MAX_LIST_ITEMS) {
      break
    }
  }

  return unique
}

const pickFirstMatch = (command, patterns, maxLength = MAX_VALUE_LENGTH) => {
  for (const pattern of patterns) {
    const match = command.match(pattern)
    const value = cleanValue(match?.[1] || "", maxLength)
    if (value) {
      return value
    }
  }

  return ""
}

const mapResponseStyle = (value = "") => {
  const normalized = value.toLowerCase()

  if (!normalized) {
    return ""
  }

  if (normalized === "brief") {
    return "short"
  }

  if (normalized === "long") {
    return "detailed"
  }

  if (normalized === "chhota") {
    return "short"
  }

  return normalized
}

const isLikelyQuestion = (command = "") => {
  const normalized = command.trim()
  if (!normalized) {
    return false
  }

  return (
    normalized.endsWith("?") ||
    /^(what|who|when|where|why|how|do|does|did|can|could|would|should|am|is|are|will)\b/i.test(normalized)
  )
}

export const ensureAssistantMemory = (memory = {}) => {
  const safeMemory = createEmptyAssistantMemory()

  safeMemory.profile.preferredName = cleanValue(memory?.profile?.preferredName || "")
  safeMemory.profile.location = cleanValue(memory?.profile?.location || "")
  safeMemory.profile.profession = cleanValue(memory?.profile?.profession || "")
  safeMemory.profile.education = cleanValue(memory?.profile?.education || "")
  safeMemory.preferences.language = cleanValue(memory?.preferences?.language || "")
  safeMemory.preferences.responseStyle = cleanValue(memory?.preferences?.responseStyle || "")
  safeMemory.likes = normalizeList(memory?.likes || [])
  safeMemory.dislikes = normalizeList(memory?.dislikes || [])
  safeMemory.goals = normalizeList(memory?.goals || [])
  safeMemory.notes = normalizeList(memory?.notes || [], MAX_NOTE_LENGTH)
  safeMemory.updatedAt = memory?.updatedAt || null

  return safeMemory
}

export const extractAssistantMemoryUpdates = (command = "") => {
  const trimmedCommand = command.trim()
  const updates = createEmptyAssistantMemory()

  if (!trimmedCommand) {
    return updates
  }

  const allowDeclarativeExtraction = !isLikelyQuestion(trimmedCommand)

  if (allowDeclarativeExtraction) {
    updates.profile.preferredName = pickFirstMatch(trimmedCommand, [
      /(?:call me|you can call me|address me as)\s+([\p{L}][\p{L}\s]{1,30})/iu,
      /(?:my name is|mera naam)\s+([\p{L}][\p{L}\s]{1,30})/iu
    ])

    updates.profile.location = pickFirstMatch(trimmedCommand, [
      /(?:i live in|i'm from|i am from)\s+([^,.!?]{2,50})/i,
      /(?:main|mai)\s+([^,.!?]{2,40})\s+se\s+hoon/i,
      /(?:main|mai)\s+([^,.!?]{2,40})\s+me(?:in)?\s+rehta\s+hoon/i,
      /(?:main|mai)\s+([^,.!?]{2,40})\s+me(?:in)?\s+rehti\s+hoon/i
    ])

    updates.profile.profession = pickFirstMatch(trimmedCommand, [
      /(?:i work as|i am working as|i'm working as)\s+([^,.!?]{2,60})/i,
      /(?:i am a|i am an|i'm a|i'm an)\s+([^,.!?]{2,60})/i
    ])

    updates.profile.education = pickFirstMatch(trimmedCommand, [
      /(?:i study|i am studying|i'm studying)\s+([^,.!?]{2,60})/i,
      /(?:my course is)\s+([^,.!?]{2,60})/i
    ])

    updates.preferences.language = cleanValue(pickFirstMatch(trimmedCommand, [
      /(?:reply|respond|talk|speak|baat karo|bolo)\s+(?:to me\s+)?(?:in\s+)?(hindi|english|hinglish)\b/i,
      /\b(hindi|english|hinglish)\s+(?:me|mein)\s+(?:reply karo|bolo|baat karo)\b/i
    ])).toLowerCase()

    updates.preferences.responseStyle = mapResponseStyle(pickFirstMatch(trimmedCommand, [
      /(?:keep|make)\s+(?:your\s+)?(?:answers|replies|response)\s+(short|brief|detailed|long)\b/i,
      /\b(short|brief|detailed|long)\s+(?:reply|response|answer)\b/i,
      /\b(chhota|short|detailed|long)\s+(?:jawab|reply)\b/i
    ]))

    const like = pickFirstMatch(trimmedCommand, [
      /(?:i like|i love)\s+([^,.!?]{2,60})/i,
      /mujhe\s+([^,.!?]{2,60})\s+pasand\s+hai/i,
      /my favorite(?:\s+\w+)?\s+is\s+([^,.!?]{2,60})/i
    ])
    if (like) {
      updates.likes = [like]
    }

    const dislike = pickFirstMatch(trimmedCommand, [
      /(?:i dislike|i hate)\s+([^,.!?]{2,60})/i,
      /mujhe\s+([^,.!?]{2,60})\s+pasand\s+nahi\s+hai/i
    ])
    if (dislike) {
      updates.dislikes = [dislike]
    }

    const goal = pickFirstMatch(trimmedCommand, [
      /(?:my goal is to|i want to|i wanna|i would like to)\s+([^,.!?]{3,80})/i,
      /(?:mera goal|mera aim)\s+(?:hai|h)\s+([^,.!?]{3,80})/i,
      /(?:main|mai)\s+chahta\s+hoon\s+ki\s+([^,.!?]{3,80})/i,
      /(?:main|mai)\s+chahti\s+hoon\s+ki\s+([^,.!?]{3,80})/i
    ])
    if (goal) {
      updates.goals = [goal]
    }
  }

  const note = pickFirstMatch(trimmedCommand, [
    /(?:remember that|remember this|note that)\s+(.+)/i,
    /(?:yaad rakhna(?: ki)?)\s+(.+)/i
  ], MAX_NOTE_LENGTH)

  if (note) {
    updates.notes = [note]
  }

  return updates
}

export const mergeAssistantMemory = (currentMemory = {}, updates = {}) => {
  const existing = ensureAssistantMemory(currentMemory)
  const incoming = ensureAssistantMemory(updates)
  let hasChanges = false

  for (const key of Object.keys(existing.profile)) {
    if (incoming.profile[key] && incoming.profile[key] !== existing.profile[key]) {
      existing.profile[key] = incoming.profile[key]
      hasChanges = true
    }
  }

  for (const key of Object.keys(existing.preferences)) {
    if (incoming.preferences[key] && incoming.preferences[key] !== existing.preferences[key]) {
      existing.preferences[key] = incoming.preferences[key]
      hasChanges = true
    }
  }

  for (const key of ["likes", "dislikes", "goals", "notes"]) {
    const mergedList = normalizeList([...existing[key], ...incoming[key]], key === "notes" ? MAX_NOTE_LENGTH : MAX_VALUE_LENGTH)

    if (mergedList.join("|") !== existing[key].join("|")) {
      existing[key] = mergedList
      hasChanges = true
    }
  }

  if (hasChanges) {
    existing.updatedAt = new Date()
  }

  return { memory: existing, hasChanges }
}

export const formatAssistantMemoryForPrompt = ({ userName, userMemory } = {}) => {
  const memory = ensureAssistantMemory(userMemory)
  const lines = []

  if (userName) {
    lines.push(`- Account name: ${cleanValue(userName)}`)
  }

  if (memory.profile.preferredName) {
    lines.push(`- Preferred name: ${memory.profile.preferredName}`)
  }

  if (memory.profile.location) {
    lines.push(`- Location: ${memory.profile.location}`)
  }

  if (memory.profile.profession) {
    lines.push(`- Profession: ${memory.profile.profession}`)
  }

  if (memory.profile.education) {
    lines.push(`- Education: ${memory.profile.education}`)
  }

  if (memory.preferences.language) {
    lines.push(`- Preferred language: ${memory.preferences.language}`)
  }

  if (memory.preferences.responseStyle) {
    lines.push(`- Preferred response style: ${memory.preferences.responseStyle}`)
  }

  if (memory.likes.length) {
    lines.push(`- Likes: ${memory.likes.join(", ")}`)
  }

  if (memory.dislikes.length) {
    lines.push(`- Dislikes: ${memory.dislikes.join(", ")}`)
  }

  if (memory.goals.length) {
    lines.push(`- Goals: ${memory.goals.join(", ")}`)
  }

  if (memory.notes.length) {
    lines.push(`- Notes to remember: ${memory.notes.join(" | ")}`)
  }

  if (!lines.length) {
    return "No stored long-term memory yet."
  }

  return `Stored user memory:\n${lines.join("\n")}`
}
