import React, { useEffect, useRef } from "react"

function HomeCodeWallpaper() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext("2d")
    const fontSize = 18
    let columns = 0
    let drops = []
    let speeds = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      columns = Math.max(1, Math.floor(canvas.width / 24))
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * (canvas.height / fontSize)))
      speeds = Array.from({ length: columns }, () => 0.7 + Math.random() * 0.9)
    }

    const draw = () => {
      context.fillStyle = "rgba(0, 0, 0, 0.08)"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
      context.textBaseline = "top"
      context.shadowBlur = 10
      context.shadowColor = "rgba(34, 197, 94, 0.22)"

      for (let index = 0; index < drops.length; index += 1) {
        if (Math.random() < 0.18) {
          continue
        }

        const glyph = Math.random() > 0.5 ? "1" : "0"
        const x = index * 24
        const y = drops[index] * fontSize

        context.fillStyle = Math.random() > 0.88
          ? "rgba(187, 247, 208, 0.9)"
          : "rgba(74, 222, 128, 0.42)"
        context.fillText(glyph, x, y)

        if (y > canvas.height && Math.random() > 0.985) {
          drops[index] = 0
        }

        drops[index] += speeds[index]
      }
    }

    resizeCanvas()
    const interval = window.setInterval(draw, 48)
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <>
      <div className="absolute inset-0 bg-[#000000]" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-70"
        style={{ pointerEvents: "none" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_26%,_rgba(0,0,0,0.56)_100%)]" />
    </>
  )
}

export default HomeCodeWallpaper
