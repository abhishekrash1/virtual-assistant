import React from 'react'

const sectionBadges = [
  "Goal",
  "Current Level",
  "Skills to Learn",
  "Roadmap",
  "Project Ideas",
  "Next Steps"
]

function PathFinderPanel({ aiText = "", userText = "" }) {
  const hasResponse = Boolean(aiText)

  return (
    <div className='mt-2 w-full max-w-3xl px-4'>
      <div className='glass-panel glow-border relative overflow-hidden rounded-[28px] px-5 py-5 sm:px-6'>
        <div className='absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10' />
        <div className='relative z-10 flex flex-col gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <div className='inline-flex rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100'>
                Student Career Mentor
              </div>
              <h2 className='mt-3 text-xl font-semibold text-white sm:text-2xl'>PathFinder Mode</h2>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>
                Share your goal, interests, and current skills. You'll get a practical roadmap instead of a random reply.
              </p>
            </div>
            {userText && (
              <div className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200'>
                <span className='block text-[11px] uppercase tracking-[0.2em] text-slate-400'>Latest input</span>
                <span className='mt-1 block max-w-[260px]'>{userText}</span>
              </div>
            )}
          </div>

          <div className='flex flex-wrap gap-2'>
            {sectionBadges.map((badge) => (
              <span key={badge} className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200'>
                {badge}
              </span>
            ))}
          </div>

          <div className='rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:p-5'>
            {hasResponse ? (
              <div className='custom-scrollbar max-h-[280px] overflow-y-auto whitespace-pre-line text-left text-sm leading-7 text-slate-100 sm:text-[15px]'>
                {aiText}
              </div>
            ) : (
              <div className='space-y-3 text-left text-sm leading-7 text-slate-300'>
                <p>Tell PathFinder these 3 things:</p>
                <p>1. Goal: for example, frontend developer, data analyst, UI/UX designer, AI engineer.</p>
                <p>2. Interests: for example, coding, design, data, problem solving, content, business.</p>
                <p>3. Current skills: for example, HTML/CSS, Python basics, Figma, Excel, or no experience yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PathFinderPanel
