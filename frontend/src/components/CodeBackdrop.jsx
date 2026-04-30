import React, { useEffect, useRef } from "react"
import AnimatedBackground from "./AnimatedBackground"

const variantConfig = {
  auth: {
    backgroundVariant: "auth",
    characters: "constletfunctionreturnasyncawaitimportexport{}[]()<>=+-*/01",
    fadeColor: "rgba(2, 6, 17, 0.08)",
    charColor: "rgba(56, 189, 248, 0.45)",
    canvasClassName: "absolute inset-0 h-full w-full opacity-60",
    scanTintClassName: "from-transparent via-cyan-300/18 to-transparent",
    snippetClassName: "text-cyan-100/52",
    snippetPanelClassName: "border-cyan-300/12 bg-slate-950/26",
    snippetOpacityClassName: "opacity-90",
    snippetPositions: [6, 28, 50],
    snippets: [
      ["const mood = 'focused';", "if (user.ready) startSession();", "await assistant.replyNaturally();", "return 'let us build something';"],
      ["function unlockContext() {", "  rememberPreferences();", "  streamConfidence();", "}"],
      ["import { clarity } from 'mind';", "const answer = explain(topic);", "console.log(answer);"],
    ],
  },
  home: {
    backgroundVariant: "home",
    characters: "functionconstreturnasyncawaitclassinterface=>{}[]()<>0101npmgitapiuseEffect",
    fadeColor: "rgba(1, 4, 12, 0.07)",
    charColor: "rgba(52, 211, 153, 0.24)",
    canvasClassName: "absolute inset-0 h-full w-full opacity-34",
    scanTintClassName: "from-transparent via-emerald-300/12 to-transparent",
    snippetClassName: "text-emerald-100/28",
    snippetPanelClassName: "border-emerald-300/10 bg-[#020b0f]/16",
    snippetOpacityClassName: "opacity-42",
    snippetPositions: [4, 76],
    snippets: [
      ["const assistant = createAssistant({", "  mode: 'human-like',", "  voice: 'natural',", "  memory: 'persistent'", "});"],
      ["useEffect(() => {", "  syncPresence();", "  renderSignals();", "}, []);"],
    ],
  },
}

function CodeBackdrop({ variant = "auth" }) {
  const canvasRef = useRef(null)
  const palette = variantConfig[variant] || variantConfig.auth

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext("2d")
    const fontSize = variant === "home" ? 15 : 14
    let columns = 0
    let drops = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      columns = Math.max(1, Math.floor(canvas.width / fontSize))
      drops = Array.from(
        { length: columns },
        () => Math.floor((Math.random() * canvas.height) / fontSize)
      )
    }

    const draw = () => {
      context.fillStyle = palette.fadeColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = palette.charColor
      context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

      for (let index = 0; index < drops.length; index += 1) {
        const char = palette.characters.charAt(Math.floor(Math.random() * palette.characters.length))
        const x = index * fontSize
        const y = drops[index] * fontSize

        context.fillText(char, x, y)

        if (y > canvas.height && Math.random() > (variant === "home" ? 0.983 : 0.978)) {
          drops[index] = 0
        }

        drops[index] += 1
      }
    }

    resizeCanvas()
    const interval = window.setInterval(draw, variant === "home" ? 42 : 34)
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [palette.charColor, palette.characters, palette.fadeColor, variant])

  return (
    <>
      <AnimatedBackground variant={palette.backgroundVariant} />
      <canvas
        ref={canvasRef}
        className={palette.canvasClassName}
        style={{ pointerEvents: "none" }}
      />
      <div className="circuit-overlay absolute inset-0 opacity-55" />
      <div className={`absolute inset-0 overflow-hidden ${palette.snippetOpacityClassName}`}>
        {palette.snippets.map((snippet, index) => (
          <div
            key={`${variant}-snippet-${index}`}
            className={`code-snippet-column ${palette.snippetPanelClassName} ${palette.snippetClassName}`}
            style={{
              left: `${palette.snippetPositions?.[index] ?? 6 + index * 22}%`,
              animationDelay: `${index * -4.5}s`,
              animationDuration: `${19 + index * 1.8}s`,
            }}
          >
            {snippet.map((line, lineIndex) => (
              <div key={`${variant}-line-${index}-${lineIndex}`} className="code-snippet-line">
                {line}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={`code-scan-line bg-gradient-to-b ${palette.scanTintClassName}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(4,8,20,0.08),_rgba(1,4,12,0.9)_74%)]" />
      <div className="absolute left-[-8%] top-[14%] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[8%] right-[-6%] h-72 w-72 rounded-full bg-indigo-500/14 blur-3xl" />
      {variant === "home" && (
        <>
          <div className="absolute left-[10%] top-[18%] h-px w-32 bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />
          <div className="absolute right-[12%] top-[32%] h-px w-44 bg-gradient-to-r from-transparent via-cyan-300/38 to-transparent" />
          <div className="absolute bottom-[20%] left-[16%] h-24 w-24 rounded-full border border-emerald-300/10" />
          <div className="absolute bottom-[16%] right-[18%] h-20 w-20 rounded-full border border-cyan-300/8" />
        </>
      )}
    </>
  )
}

export default CodeBackdrop
