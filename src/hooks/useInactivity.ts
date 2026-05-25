import { useCallback, useEffect, useRef, useState } from "react"

const MAX_IDLE_MS  = 20 * 60 * 1000   // 20 minutos
const WARNING_MS   = 60 * 1000         // aviso al último minuto

interface UseInactivityOptions {
  isAuthenticated: boolean
  onLogout: () => void
}

export function useInactivity({ isAuthenticated, onLogout }: UseInactivityOptions) {
  const [secondsLeft, setSecondsLeft] = useState(MAX_IDLE_MS / 1000)
  const lastActivityRef = useRef(Date.now())

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Listen for user activity
  useEffect(() => {
    if (!isAuthenticated) return
    const events = ["mousemove", "keydown", "scroll", "pointerdown", "touchstart"] as const
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, resetActivity))
  }, [isAuthenticated, resetActivity])

  // Count down and log out when idle
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = window.setInterval(() => {
      const idleMs   = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, Math.floor((MAX_IDLE_MS - idleMs) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) onLogout()
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isAuthenticated, onLogout])

  return {
    secondsLeft,
    isWarning: secondsLeft <= WARNING_MS / 1000,
    resetActivity,
  }
}
