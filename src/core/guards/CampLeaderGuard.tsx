import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"

interface CampLeaderGuardProps {
  children: React.ReactNode
}

export default function CampLeaderGuard({ children }: CampLeaderGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check role
  const role = user.role?.toLowerCase()
  const isCampLeader = role === "camp_leader" || role === "admin"

  // If user has invalid role, redirect to login (or dashboard if they are something else)
  if (!isCampLeader) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated and has correct role
  return <>{children}</>
}
