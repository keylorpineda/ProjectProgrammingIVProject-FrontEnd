import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import type { AuthUser } from "@/types/api.types"

// sessionStorage store — token survives page reloads but not tab/browser close
interface TokenState {
  token: string | null
  setToken: (token: string | null) => void
  getToken: () => string | null
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => set({ token }),
      getToken: () => get().token,
    }),
    {
      name: "auth-token-session",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

// Persisted store — only non-sensitive user data
interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  sessionExpired: boolean
  setAuth: (token: string, user: AuthUser, _refreshToken?: string | null) => void
  setRefreshToken: (_refreshToken: string | null) => void
  setSessionExpired: (value: boolean) => void
  logout: () => void
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sessionExpired: false,

      setAuth: (token, user) => {
        useTokenStore.getState().setToken(token)
        set({ user, isAuthenticated: true, sessionExpired: false })
      },

      // Kept for call-site compatibility; refresh token no longer stored client-side
      setRefreshToken: (_refreshToken) => {},

      setSessionExpired: (value) => set({ sessionExpired: value }),

      logout: () => {
        useTokenStore.getState().setToken(null)
        set({ user: null, isAuthenticated: false, sessionExpired: false })
      },

      isTokenExpired: () => {
        const token = useTokenStore.getState().token
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
      name: "auth-user-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
