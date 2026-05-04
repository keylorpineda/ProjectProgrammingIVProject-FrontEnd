import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { Camp } from "@/types/api.types"
import { getCamps } from "@/features/camps/services/camps.service"
import { useAuth } from "./AuthContext"

interface CampContextType {
  activeCampId: string
  setActiveCampId: (id: string) => void
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
    getStoredCampId() || user?.campId || "",
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
          if (user?.campId && data.some((camp) => camp.id === user.campId)) return user.campId
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
  }, [user?.campId])

  const setActiveCampId = useCallback((id: string) => {
    setActiveCampIdState(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("active-camp-id", id)
    }
  }, [])

  const value = useMemo(
    () => ({
      activeCampId,
      setActiveCampId,
      camps,
      isLoading,
    }),
    [activeCampId, setActiveCampId, camps, isLoading],
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
