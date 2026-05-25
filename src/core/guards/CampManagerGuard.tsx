import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"

interface CampManagerGuardProps {
  children: React.ReactNode
}

export default function CampManagerGuard({ children }: CampManagerGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()
  // Camp Manager Dashboard is typically meant for admins viewing specific camps
  const isAllowed = role === "admin" || role === "camp_manager" || role === "resource_manager"

  if (!isAllowed) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
