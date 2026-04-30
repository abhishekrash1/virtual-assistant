import React from "react"

const variants = {
  auth: {
    base: "bg-[#040816]",
    mesh: "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.2),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.18),_transparent_24%),radial-gradient(circle_at_50%_80%,_rgba(34,211,238,0.12),_transparent_30%)]",
    primary: "top-[10%] left-[8%] h-52 w-52 bg-cyan-400/35",
    secondary: "bottom-[8%] right-[10%] h-72 w-72 bg-fuchsia-500/25 floating-orb--delay",
    tertiary: "top-[45%] right-[24%] h-40 w-40 bg-blue-500/25 floating-orb--slow",
  },
  home: {
    base: "bg-[#01060c]",
    mesh: "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_22%),radial-gradient(circle_at_14%_24%,_rgba(34,211,238,0.14),_transparent_22%),radial-gradient(circle_at_82%_76%,_rgba(59,130,246,0.12),_transparent_26%)]",
    primary: "top-[12%] left-[5%] h-72 w-72 bg-emerald-400/16",
    secondary: "bottom-[12%] right-[8%] h-80 w-80 bg-cyan-500/16 floating-orb--delay",
    tertiary: "top-[55%] left-[55%] h-48 w-48 bg-sky-400/12 floating-orb--slow",
  },
  setup: {
    base: "bg-[#020611]",
    mesh: "bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.14),_transparent_32%)]",
    primary: "top-[8%] left-[18%] h-56 w-56 bg-sky-400/28",
    secondary: "bottom-[10%] right-[10%] h-64 w-64 bg-indigo-500/20 floating-orb--delay",
    tertiary: "top-[42%] right-[24%] h-40 w-40 bg-purple-500/18 floating-orb--slow",
  },
}

function AnimatedBackground({ variant = "auth", className = "" }) {
  const palette = variants[variant] || variants.auth

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className={`absolute inset-0 ${palette.base}`} />
      <div className={`absolute inset-0 opacity-90 ${palette.mesh}`} />
      <div className="grid-overlay absolute inset-0 opacity-50" />
      <div className={`floating-orb ${palette.primary}`} />
      <div className={`floating-orb ${palette.secondary}`} />
      <div className={`floating-orb ${palette.tertiary}`} />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/8 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#01030a] via-[#01030a]/80 to-transparent" />
    </div>
  )
}

export default AnimatedBackground
