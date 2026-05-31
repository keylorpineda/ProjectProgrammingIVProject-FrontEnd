import { Navigate } from "react-router-dom"

import { useAuth } from "@/pages/Admin/context/AuthContext"

interface WorkerGuardProps {
  children: React.ReactNode
}

/** Returns the correct dashboard path for a given role, or null if unknown. */
function dashboardForRole(role: string | undefined): string | null {
  if (!role) return null
  const r = role.toLowerCase()
  if (r === "worker") return null // handled by caller
  if (r.includes("admin")) return "/admin/dashboard"
  if (r === "camp_leader") return "/campleader/dashboard"
  if (r === "camp_manager") return "/camp-manager"
  if (r === "resource_manager") return "/camp-manager"
  if (r === "travel_manager") return "/travel-manager/dashboard"
  return null
}

export default function WorkerGuard({ children }: WorkerGuardProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase()

  if (role === "worker") {
    return <>{children}</>
  }

  // Redirect other authenticated roles to their own dashboard
  const redirect = dashboardForRole(role)
  if (redirect) return <Navigate to={redirect} replace />

  // Unknown role — back to login
  return <Navigate to="/login" replace />
}
