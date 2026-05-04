import { useAuthStore } from "../../../store/useAuthStore"

export const useAuth = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  return { isAuthenticated, user, logout }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
