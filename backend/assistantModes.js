export const ASSISTANT_MODES = {
  GENERAL: "general",
  STUDENT: "student",
  PATHFINDER: "pathfinder"
}

const validAssistantModes = new Set(Object.values(ASSISTANT_MODES))

export const normalizeAssistantMode = (value) => {
  const normalizedValue = typeof value === "string" ? value.trim().toLowerCase() : ""
  return validAssistantModes.has(normalizedValue) ? normalizedValue : ASSISTANT_MODES.GENERAL
}

export const isPathFinderMode = (value) => normalizeAssistantMode(value) === ASSISTANT_MODES.PATHFINDER
