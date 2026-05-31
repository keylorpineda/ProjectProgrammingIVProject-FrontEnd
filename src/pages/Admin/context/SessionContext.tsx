import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

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
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [secondsUntilLogout, setSecondsUntilLogout] = useState(MAX_IDLE_SECONDS)

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const handleActivity = () => resetActivity()
    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("keydown", handleActivity)
    window.addEventListener("scroll", handleActivity)

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("scroll", handleActivity)
    }
  }, [isAuthenticated, resetActivity])

  useEffect(() => {
    if (!isAuthenticated) return undefined

    const interval = window.setInterval(() => {
      const idleSeconds = Math.floor((Date.now() - lastActivity) / 1000)
      const remaining = MAX_IDLE_SECONDS - idleSeconds
      setSecondsUntilLogout(Math.max(0, remaining))

      if (remaining <= 0) {
        void logout()
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isAuthenticated, lastActivity, logout])

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
      lastActivity,
      secondsUntilLogout,
      resetActivity,
      isWarning: secondsUntilLogout <= WARNING_SECONDS,
    }),
    [lastActivity, secondsUntilLogout, resetActivity],
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
