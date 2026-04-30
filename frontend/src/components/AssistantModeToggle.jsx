import React from 'react'

function AssistantModeToggle({ assistantMode = "general", modeLoading = false, onModeChange }) {
  const isGeneralMode = assistantMode === "general"
  const isPathFinderMode = assistantMode === "pathfinder"
  const isLegacyStudentMode = assistantMode === "student"

  return (
    <div className='absolute left-[20px] top-[64px] z-10 flex max-w-[calc(100%-40px)] flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-3'>
        <button
          onClick={() => onModeChange("general")}
          disabled={modeLoading}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isGeneralMode ? "bg-white text-black" : "border border-white/20 bg-white/8 text-white"} ${modeLoading ? "opacity-70" : ""}`}
        >
          General Mode
        </button>
        <button
          onClick={() => onModeChange("pathfinder")}
          disabled={modeLoading}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isPathFinderMode ? "bg-emerald-300 text-slate-950" : "border border-emerald-200/30 bg-emerald-300/10 text-emerald-100"} ${modeLoading ? "opacity-70" : ""}`}
        >
          PathFinder Mode
        </button>
      </div>

      {isLegacyStudentMode && (
        <div className='rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-xs text-amber-100'>
          Legacy Student Mode is active. Switch to General or PathFinder whenever you want.
        </div>
      )}
    </div>
  )
}

export default AssistantModeToggle
