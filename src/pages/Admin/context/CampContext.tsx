import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { Camp } from "@/types/api.types"
import { getCamps } from "@/features/camps/services/camps.service"
import { switchCamp as switchCampService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/store/useAuthStore"
import { useAuth } from "./AuthContext"

interface CampContextType {
  activeCampId: string
  setActiveCampId: (id: string) => void
  /**
   * User-driven camp switch. Calls PATCH /auth/switch-camp, persists the
   * rotated tokens, and forces a full reload to the start screen so every
   * cached camp-scoped query is rebuilt against the new JWT
   * (see docs/MASTER_DOC.md §3.5).
   */
  switchActiveCamp: (id: string) => Promise<void>
  camps: Camp[]
  isLoading: boolean
}

const CampContext = createContext<CampContextType | undefined>(undefined)

const getStoredCampId = () => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("active-camp-id") ?? ""
}

export const CampProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [activeCampId, setActiveCampIdState] = useState<string>(
    getStoredCampId() || user?.camp_id || "",
  )
  const [camps, setCamps] = useState<Camp[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadCamps = async () => {
      setIsLoading(true)
      try {
        const data = await getCamps()
        if (!isMounted) return
        setCamps(data)
        setActiveCampIdState((current) => {
          if (current && data.some((camp) => camp.id === current)) return current
          if (user?.camp_id && data.some((camp) => camp.id === user.camp_id)) return user.camp_id
          return data[0]?.id ?? ""
        })
      } catch {
        if (!isMounted) return
        setCamps([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadCamps()

    return () => {
      isMounted = false
    }
  }, [user?.camp_id])

  const setActiveCampId = useCallback((id: string) => {
    setActiveCampIdState(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("active-camp-id", id)
    }
  }, [])

  const switchActiveCamp = useCallback(async (id: string) => {
    const numericId = Number(id)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error("Invalid camp id")
    }
    const response = await switchCampService({ camp_id: numericId })
    useAuthStore
      .getState()
      .setAuth(response.access_token, response.user, response.refresh_token)
    if (typeof window !== "undefined") {
      localStorage.setItem("active-camp-id", id)
      window.location.assign("/admin/dashboard")
    }
  }, [])

  const value = useMemo(
    () => ({
      activeCampId,
      setActiveCampId,
      switchActiveCamp,
      camps,
      isLoading,
    }),
    [activeCampId, setActiveCampId, switchActiveCamp, camps, isLoading],
  )

  return <CampContext.Provider value={value}>{children}</CampContext.Provider>
}

export const useCamp = () => {
  const context = useContext(CampContext)
  if (!context) {
    throw new Error("useCamp must be used within a CampProvider")
  }
  return context
}
