import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthUser } from "@/types/api.types"

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser, refreshToken?: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  logout: () => void
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user, refreshToken = null) =>
        set({ token, refreshToken, user, isAuthenticated: true }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      logout: () => {
        localStorage.clear()
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
      },

      isTokenExpired: () => {
        const { token } = get()
        if (!token) return true
        try {
          const payload = JSON.parse(atob(token.split(".")[1])) as { exp: number }
          return payload.exp * 1000 < Date.now()
        } catch {
          return true
        }
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)
