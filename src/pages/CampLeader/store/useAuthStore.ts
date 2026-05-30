// @ts-nocheck
/**
 * CampLeader Auth Store — reads the real JWT session from the global app store.
 */

import { useAuthStore as useGlobalAuthStore } from "@/store/useAuthStore"

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

export function useAuthStore(): AuthState {
  const globalUser = useGlobalAuthStore((s) => s.user)
  const isAuthenticated = useGlobalAuthStore((s) => s.isAuthenticated)

  const user = globalUser
    ? {
        id: Number(globalUser.id ?? 0),
        username: globalUser.username ?? "USUARIO",
        role: globalUser.role ?? "camp_leader",
        campId: Number(globalUser.camp_id ?? 1),
      }
    : null

  return { user, isAuthenticated }
}
