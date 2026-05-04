import { createContext, useContext, useState, ReactNode } from "react"
import { Camp } from "../../../types/api.types"

interface CampContextType {
  activeCampId: string
  setActiveCampId: (id: string) => void
  camps: Camp[]
  isLoading: boolean
}

const CampContext = createContext<CampContextType | undefined>(undefined)

export const useCamp = () => {
  const context = useContext(CampContext)
  if (!context) throw new Error("useCamp must be used within CampProvider")
  return context
}

export const CampProvider = ({ children }: { children: ReactNode }) => {
  const [activeCampId, setActiveCampId] = useState("")
  const [camps] = useState<Camp[]>([])
  const [isLoading] = useState(false)

  return (
    <CampContext.Provider value={{ activeCampId, setActiveCampId, camps, isLoading }}>
      {children}
    </CampContext.Provider>
  )
}
