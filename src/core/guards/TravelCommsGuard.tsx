import { Navigate } from 'react-router-dom'
import { useAuth } from '@/pages/Admin/context/AuthContext'

interface TravelCommsGuardProps {
  children: React.ReactNode
}

// Allowed roles for the TravelComms module
const TRAVEL_COMMS_ROLES = ['travel_comms', 'travelcomms', 'encargado_viajes', 'travel_manager']

export default function TravelCommsGuard({ children }: TravelCommsGuardProps) {
  const { user, isAuthenticated } = useAuth()

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toLowerCase().replace(/[^a-z_]/g, '')

  // Allow admin through (they can access everything)
  if (role?.includes('admin')) {
    return <>{children}</>
  }

  // Check if user has a travel comms role
  const isTravelComms = TRAVEL_COMMS_ROLES.some((r) => role?.includes(r.replace('_', '')))

  if (!isTravelComms) {
    // Redirect to appropriate dashboard based on role
    if (role === 'worker') return <Navigate to="/worker/dashboard" replace />
    if (role?.includes('camp')) return <Navigate to="/campleader/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
