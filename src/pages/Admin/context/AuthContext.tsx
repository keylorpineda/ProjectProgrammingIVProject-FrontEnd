import { createContext, useCallback, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import {
  login as loginService,
  logout as logoutService,
} from "@/features/auth/services/auth.service"
import type { LoginBody } from "@/features/auth/services/auth.service"
import type { AuthUser } from "@/types/api.types"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (body: LoginBody) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const token = useTokenStore((s) => s.token)
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore()

  const login = useCallback(
    async (body: LoginBody) => {
      const response = await loginService(body)
      setAuth(response.access_token, response.user)
    },
    [setAuth],
  )

  const logout = useCallback(async () => {
    storeLogout()
    void logoutService().catch((error) => {
      console.warn("Remote logout failed after local session cleanup", error)
    })
  }, [storeLogout])

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken: null,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, isAuthenticated, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
