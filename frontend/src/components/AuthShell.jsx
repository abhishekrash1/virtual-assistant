import React from "react"
import { RiRobot2Line, RiShieldCheckLine, RiVoiceprintLine } from "react-icons/ri"
import { IoSparklesOutline } from "react-icons/io5"
import AnimatedBackground from "./AnimatedBackground"

const highlights = [
  {
    icon: RiVoiceprintLine,
    title: "Voice-first experience",
    text: "Natural conversation flow with quick wake-up and smart listening states.",
  },
  {
    icon: RiRobot2Line,
    title: "Human-like responses",
    text: "Shared prompt + fallback chain keeps the assistant consistent and polished.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Demo-ready stability",
    text: "Built to keep working even when a provider gets slow or rate-limited.",
  },
]

function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <AnimatedBackground variant="auth" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="glass-panel glow-border relative overflow-hidden rounded-[32px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-500/10" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">
                  <IoSparklesOutline className="text-sm" />
                  {eyebrow}
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    {description}
                  </p>
                </div>

                <div className="grid gap-4">
                  {highlights.map(({ icon: Icon, title: cardTitle, text }) => (
                    <div
                      key={cardTitle}
                      className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-blue-500/10 text-cyan-100">
                        <Icon className="text-xl" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">{cardTitle}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/40 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Interaction</p>
                  <p className="mt-2 text-lg font-semibold">Voice + chat</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Response style</p>
                  <p className="mt-2 text-lg font-semibold">Warm & human</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Use case</p>
                  <p className="mt-2 text-lg font-semibold">Demo-ready MVP</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel glow-border relative overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-cyan-400/10" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Welcome back</p>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
                  <p className="text-sm leading-7 text-slate-300">
                    Keep the backend running on `http://localhost:8000` for the smoothest sign-in and voice experience.
                  </p>
                </div>
              </div>

              {children}

              {footer ? <div className="text-sm text-slate-300">{footer}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AuthShell
