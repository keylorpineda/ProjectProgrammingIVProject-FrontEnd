import { createContext, useContext, useState, ReactNode } from "react"

interface SessionContextType {
  isWarning: boolean
  secondsUntilLogout: number
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error("useSession must be used within SessionProvider")
  return context
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [isWarning] = useState(false)
  const [secondsUntilLogout] = useState(60)

  return (
    <SessionContext.Provider value={{ isWarning, secondsUntilLogout }}>
      {children}
    </SessionContext.Provider>
  )
}
