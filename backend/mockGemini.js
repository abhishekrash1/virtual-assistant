import { buildDeveloperCreditResponse, isDeveloperCreditQuery } from "./developerIdentity.js"
import { ASSISTANT_MODES, normalizeAssistantMode } from "./assistantModes.js"

const createResponse = (type, userInput, response) => JSON.stringify({
  type,
  userInput,
  response
})

const cleanInput = (value = "") => value.trim().replace(/\s+/g, " ")

const extractQuery = (command, patterns) => {
  let query = cleanInput(command)

  for (const pattern of patterns) {
    query = query.replace(pattern, " ")
  }

  return cleanInput(query)
}

const buildGeneralFallback = (assistantName, assistantMode = "general") => createResponse(
  "general",
  "",
  assistantMode === ASSISTANT_MODES.PATHFINDER
    ? `PathFinder Mode on hai. Apna target role, interests, aur current skills batao. Phir main tumhare liye clear roadmap, projects, aur internship steps bana dunga.`
    : assistantMode === ASSISTANT_MODES.STUDENT
    ? `${assistantName} yahan hoon. Main tumhara study buddy hoon, to tum mujhse concepts, revision, quick explanations ya study planning ke bare me normal tareeke se baat kar sakte ho.`
    : `${assistantName} yahan hoon. Main quick assist mode me hoon, isliye aap mujhse time, date, weather, YouTube, Google search ya basic commands bol sakte ho.`
)

const buildPathFinderStarterResponse = (command = "") => createResponse(
  "general",
  command,
  `Goal:
I need your target role or career direction.

Current Level:
I still need to know what skills, tools, or subjects you already know.

Skills to Learn:
I will suggest the right skills after I know your goal and current level.

Roadmap (step-by-step):
1. Tell me your main goal.
2. Tell me your interests.
3. Tell me your current skills or what you have already built.
4. I will turn that into a practical roadmap.

Project Ideas:
1. Beginner project based on your target field
2. Resume-ready mini project
3. Portfolio project for internships

Next Steps:
Reply in this format: Goal, Interests, Current Skills.`
)

const getMockResponse = (command, assistantName, userName, options = {}) => {
  const { forceFallback = true, assistantMode = ASSISTANT_MODES.GENERAL } = options
  const normalizedAssistantMode = normalizeAssistantMode(assistantMode)
  const normalized = cleanInput(command).toLowerCase()

  if (!normalized) {
    return forceFallback ? buildGeneralFallback(assistantName, normalizedAssistantMode) : null
  }

  if (normalizedAssistantMode === ASSISTANT_MODES.PATHFINDER) {
    if (/^(hi|hii|hello|hey|namaste|good morning|good evening)\b/.test(normalized) || /(help|madad|what can you do|kya kar sakte ho|kya kar sakti ho)/.test(normalized)) {
      return createResponse(
        "general",
        command,
        `PathFinder Mode active hai. Mujhe 3 cheezein batao: tumhara goal, tumhari interests, aur tumhari current skills. Uske baad main direct roadmap aur project ideas dunga.`
      )
    }

    if (!forceFallback) {
      return null
    }

    return buildPathFinderStarterResponse(command)
  }

  if (/^(hi|hii|hello|hey|namaste|good morning|good evening)\b/.test(normalized)) {
    return createResponse(
      "general",
      command,
      `Hello! Main ${assistantName} hoon. Bolo, main kis cheez me help karun?`
    )
  }

  if (/(how are you|kaise ho|kaisi ho)/.test(normalized)) {
    return createResponse(
      "general",
      command,
      `Main bilkul theek hoon. Tum batao, kya karna hai?`
    )
  }

  if (isDeveloperCreditQuery(command)) {
    return buildDeveloperCreditResponse({
      command,
      assistantName
    })
  }

  if (/(your name|tumhara naam|who are you|kaun ho tum|apna naam)/.test(normalized)) {
    return createResponse(
      "general",
      command,
      `Main ${assistantName} hoon, aapka virtual assistant.`
    )
  }

  if (/(thank you|thanks|shukriya|dhanyavad)/.test(normalized)) {
    return createResponse(
      "general",
      command,
      `Kabhi bhi. Main help ke liye yahin hoon.`
    )
  }

  if (/(help|madad|what can you do|kya kar sakte ho|kya kar sakti ho)/.test(normalized)) {
    return createResponse(
      "general",
      command,
      normalizedAssistantMode === ASSISTANT_MODES.STUDENT
        ? `Main tumhe padhai me help kar sakta hoon, topics simple tareeke se samjha sakta hoon, revision me help kar sakta hoon, aur saath me quick commands bhi handle kar sakta hoon.`
        : `Main aapke liye time, date, weather, Google search, YouTube play ya search, calculator aur social apps open kar sakta hoon. Basic baat-cheet bhi kar sakta hoon.`
    )
  }

  if (/(time|samay|kitne baje|what time)/.test(normalized)) {
    return createResponse("get-time", command, "Time batata hoon.")
  }

  if (/(date|tarikh|aaj ki date|what is today)/.test(normalized)) {
    return createResponse("get-date", command, "Date batata hoon.")
  }

  if (/(day|aaj ka din|kaunsa din|which day)/.test(normalized)) {
    return createResponse("get-day", command, "Aaj ka din batata hoon.")
  }

  if (/(month|mahina|kaunsa month|which month)/.test(normalized)) {
    return createResponse("get-month", command, "Current month batata hoon.")
  }

  if (/(weather|mausam|temperature|garmi|thand)/.test(normalized)) {
    return createResponse(
      "weather-show",
      extractQuery(command, [/\b(weather|mausam|temperature)\b/gi]) || "weather",
      "Weather check karta hoon."
    )
  }

  if (/(calculator|calculate|calc)/.test(normalized)) {
    return createResponse("calculator-open", "calculator", "Calculator khol raha hoon.")
  }

  if (/(instagram|insta)\b/.test(normalized)) {
    return createResponse("instagram-open", "instagram", "Instagram khol raha hoon.")
  }

  if (/\bfacebook\b|\bfb\b/.test(normalized)) {
    return createResponse("facebook-open", "facebook", "Facebook khol raha hoon.")
  }

  if (/(google search|search google|google par search|search for)/.test(normalized)) {
    const query = extractQuery(command, [
      /\bsearch google for\b/gi,
      /\bgoogle search\b/gi,
      /\bsearch google\b/gi,
      /\bgoogle par search\b/gi,
      /\bsearch for\b/gi
    ]) || command

    return createResponse(
      "google-search",
      query,
      `${query} ko Google par search karta hoon.`
    )
  }

  if (/^search\s+/.test(normalized)) {
    const query = extractQuery(command, [/^search\s+/i]) || command
    return createResponse(
      "google-search",
      query,
      `${query} ko Google par search karta hoon.`
    )
  }

  if (/\byoutube\b/.test(normalized)) {
    const query = extractQuery(command, [
      /\bon youtube\b/gi,
      /\byoutube\b/gi,
      /\bsearch\b/gi,
      /\bplay\b/gi,
      /\bopen\b/gi,
      /\bsong\b/gi,
      /\bvideo\b/gi
    ])

    if (/(play|open|song|video)/.test(normalized)) {
      return createResponse(
        "youtube-play",
        query || "youtube",
        query ? `${query} YouTube par khol raha hoon.` : "YouTube khol raha hoon."
      )
    }

    return createResponse(
      "youtube-search",
      query || "youtube",
      query ? `${query} YouTube par search kar raha hoon.` : "YouTube search khol raha hoon."
    )
  }

  if (/^play\s+/.test(normalized)) {
    const query = extractQuery(command, [/^play\s+/i]) || command
    return createResponse(
      "youtube-play",
      query,
      `${query} YouTube par khol raha hoon.`
    )
  }

  if (!forceFallback) {
    return null
  }

  return createResponse(
    "general",
    command,
      normalizedAssistantMode === ASSISTANT_MODES.STUDENT
      ? `${assistantName} abhi student mode me hai. Tum mujhse study topics, revision, easy explanations ya quick commands ke liye naturally baat kar sakte ho.`
      : `${assistantName} abhi quick assist mode me hai. Aap mujhse time, date, weather, YouTube ya Google search jaise kaam turant kara sakte ho.`
  )
}

export default getMockResponse
