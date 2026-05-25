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

  if (isAllowed) return <>{children}</>

  if (role === "worker")          return <Navigate to="/worker/dashboard" replace />
  if (role === "camp_leader")     return <Navigate to="/campleader/dashboard" replace />
  if (role === "camp_manager")    return <Navigate to="/camp-manager" replace />
  if (role === "resource_manager")return <Navigate to="/camp-manager" replace />

  return <Navigate to="/login" replace />
}
