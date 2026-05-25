import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"

interface CampLeaderGuardProps {
  children: React.ReactNode
}

export default function CampLeaderGuard({ children }: CampLeaderGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()
  const isCampLeader = role === "camp_leader" || role === "admin"

  if (isCampLeader) return <>{children}</>

  // Known non-camp-leader roles → redirect to their area
  if (role === "worker")          return <Navigate to="/worker/dashboard" replace />
  if (role === "camp_manager")    return <Navigate to="/camp-manager" replace />
  if (role === "resource_manager")return <Navigate to="/camp-manager" replace />
  if (role === "travel_manager")  return <Navigate to="/travel-manager/dashboard" replace />

  return <Navigate to="/login" replace />
}
