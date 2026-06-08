import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "./AuthContext"

import type { ReactNode } from "react"

import { getSessionStatus } from "@/features/auth/services/auth.service"

interface SessionContextType {
  lastActivity: number
  secondsUntilLogout: number
  resetActivity: () => void
  isWarning: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const MAX_IDLE_SECONDS = 20 * 60
const WARNING_SECONDS = 60

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, logout } = useAuth()
  const [secondsUntilLogout, setSecondsUntilLogout] = useState(MAX_IDLE_SECONDS)
  // Activity timestamp lives in a ref so high-frequency events (mousemove,
  // scroll) don't re-render the provider or tear down the countdown interval
  // on every single event — the interval just reads the ref each tick.
  const lastActivityRef = useRef<number>(Date.now())

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const events = ["mousemove", "keydown", "scroll", "pointerdown", "touchstart"] as const
    events.forEach((event) => window.addEventListener(event, resetActivity, { passive: true }))

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetActivity))
    }
  }, [isAuthenticated, resetActivity])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const interval = window.setInterval(() => {
      const idleSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000)
      const remaining = Math.max(0, MAX_IDLE_SECONDS - idleSeconds)
      setSecondsUntilLogout(remaining)

      if (remaining <= 0) {
        void logout()
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isAuthenticated, logout])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const pollInterval = window.setInterval(async () => {
      try {
        const status = await getSessionStatus()
        if (!status.isActive) {
          void logout()
        }
      } catch {
        void logout()
      }
    }, 60000)

    return () => window.clearInterval(pollInterval)
  }, [isAuthenticated, logout])

  const value = useMemo(
    () => ({
      lastActivity: lastActivityRef.current,
      secondsUntilLogout,
      resetActivity,
      isWarning: secondsUntilLogout <= WARNING_SECONDS,
    }),
    [secondsUntilLogout, resetActivity],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
