import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"

interface TravelManagerGuardProps {
  children: React.ReactNode
}

export default function TravelManagerGuard({ children }: TravelManagerGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()
  const isAllowed = role === "admin" || role === "travel_manager"

  if (!isAllowed) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
