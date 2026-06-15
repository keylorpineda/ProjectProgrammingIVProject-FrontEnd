import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  maxOpacity: number
  r: number
  g: number
  b: number
  life: number
  maxLife: number
}

// Ember/ash palette — warm ambers, oranges, pale dust
const PALETTE: [number, number, number][] = [
  [254, 240, 138], // warm yellow
  [251, 191, 36], // amber
  [251, 146, 60], // orange
  [239, 68, 68], // deep red ember
  [253, 186, 116], // peach
  [220, 215, 200], // pale ash
  [180, 165, 130], // dust
]

function spawn(canvasWidth: number, canvasHeight: number, randomY = false): Particle {
  const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)]
  const maxLife = 5000 + Math.random() * 9000
  const maxOpacity = 0.35 + Math.random() * 0.65
  return {
    x: Math.random() * canvasWidth,
    y: randomY ? Math.random() * canvasHeight : canvasHeight + Math.random() * 20,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(0.2 + Math.random() * 0.75),
    size: 0.4 + Math.random() * 2.2,
    opacity: randomY ? maxOpacity * Math.random() : 0,
    maxOpacity,
    r,
    g,
    b,
    life: randomY ? Math.random() * maxLife * 0.7 : 0,
    maxLife,
  }
}

interface ParticleCanvasProps {
  count?: number
  className?: string
  zIndex?: number
}

export function ParticleCanvas({ count = 90, className = "", zIndex = 20 }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize, { passive: true })

    const particles: Particle[] = Array.from({ length: count }, () =>
      spawn(canvas.width, canvas.height, true),
    )

    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.life += dt
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)

        // Organic turbulence
        p.vx += (Math.random() - 0.5) * 0.018
        p.vx = Math.max(-0.55, Math.min(0.55, p.vx))

        // Gentle upward drift variation
        p.vy += (Math.random() - 0.52) * 0.005
        p.vy = Math.max(-1.2, Math.min(-0.1, p.vy))

        // Fade in / sustain / fade out
        const ratio = p.life / p.maxLife
        if (ratio < 0.12) {
          p.opacity = p.maxOpacity * (ratio / 0.12)
        } else if (ratio > 0.72) {
          p.opacity = p.maxOpacity * Math.max(0, (1 - ratio) / 0.28)
        } else {
          p.opacity = p.maxOpacity
        }

        if (p.life >= p.maxLife || p.y < -12) {
          Object.assign(p, spawn(canvas.width, canvas.height, false))
          continue
        }

        const { r, g, b, opacity, size, x, y } = p

        // Core dot
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`
        ctx.fill()

        // Soft glow halo — only for visible embers above a size threshold
        if (size > 1.0 && opacity > 0.05) {
          ctx.beginPath()
          ctx.arc(x, y, size * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.11})`
          ctx.fill()
        }
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none mix-blend-screen ${className}`}
      style={{ zIndex, opacity: 0.92 }}
    />
  )
}
