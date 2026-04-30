const DEFAULT_DEVELOPER_NAME = "Abhishek"

const developerQueryPatterns = [
  /\bwho\s+(made|created|built|developed|coded)\s+(you|this|this app|this assistant)\b/i,
  /\bwho\s+is\s+your\s+(creator|developer|author)\b/i,
  /\b(developer|creator|author)\s+of\s+(this|this app|this assistant|you)\b/i,
  /\b(who|kisne|kis)\b.*\b(banaya|bnaya|develop(ed)?|create(d)?|made|built|coded|code likha)\b/i,
  /\b(tumhe|tujhe|tuje|isko|is app ko|assistant ko|is assistant ko)\b.*\b(kisne|kis)\b.*\b(banaya|bnaya|develop kiya|create kiya|code kiya|code likha)\b/i,
  /\b(kisne|kis)\b.*\b(tumhe|tujhe|tuje|tumko|isko|ise|isey|assistant ko|bot ko)\b.*\b(banaya|bnaya|develop kiya|create kiya|code kiya|code likha)\b/i,
  /\b(tum|tumhe|tujhe|tuje|tumko|isko|ise|isey|assistant|bot)\b.*\b(banaya|bnaya)\b.*\b(kisne|kis)\b/i,
  /\b(your|tumhara|iska|is app ka|assistant ka)\s+(developer|creator|author)\b/i,
  /\b(developer|creator|author)\s+(kaun hai|kon hai|who is)\b/i
]

export const getDeveloperName = () => {
  const configuredName = process.env.ASSISTANT_DEVELOPER_NAME?.trim()
  return configuredName || DEFAULT_DEVELOPER_NAME
}

export const isDeveloperCreditQuery = (command = "") => {
  if (!command || typeof command !== "string") {
    return false
  }

  const normalizedCommand = command.trim().toLowerCase()
  if (!normalizedCommand) {
    return false
  }

  return developerQueryPatterns.some((pattern) => pattern.test(normalizedCommand))
}

export const buildDeveloperCreditText = ({ assistantName } = {}) => {
  const developerName = getDeveloperName()
  const trimmedAssistantName = assistantName?.trim()

  if (trimmedAssistantName) {
    return `${trimmedAssistantName} ko ${developerName} ne banaya aur develop kiya hai.`
  }

  return `Mujhe ${developerName} ne banaya aur develop kiya hai.`
}

export const buildDeveloperCreditResponse = ({ command, assistantName }) => JSON.stringify({
  type: "general",
  userInput: command?.trim() || "",
  response: buildDeveloperCreditText({ assistantName })
})
