// @ts-nocheck
/**
 * CampLeader Auth Store — reads the real JWT session from the global app store.
 */

import { useState, useEffect } from "react"

interface User {
  id: number
  username: string
  role: string
  campId: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

function readRealUser(): User | null {
  try {
    // Try the shared auth-storage (Zustand persisted store)
    const raw = localStorage.getItem("auth-storage")
    if (raw) {
      const parsed = JSON.parse(raw)
      const u = parsed?.state?.user
      if (u) {
        return {
          id: Number(u.id ?? u.userId ?? 0),
          username: u.username ?? u.name ?? "USUARIO",
          role: u.role ?? "camp_leader",
          campId: Number(u.camp_id ?? u.campId ?? 1),
        }
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function useAuthStore(): AuthState {
  const [user, setUser] = useState<User | null>(readRealUser)

  useEffect(() => {
    // Re-read whenever localStorage changes (e.g. after login/switch-camp)
    const onStorage = () => setUser(readRealUser())
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return {
    user,
    isAuthenticated: user !== null,
  }
}
