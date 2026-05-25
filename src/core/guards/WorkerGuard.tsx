import { Navigate } from 'react-router-dom'
import { useAuth } from '@/pages/Admin/context/AuthContext'

interface WorkerGuardProps {
  children: React.ReactNode
}

export default function WorkerGuard({ children }: WorkerGuardProps) {
  const { user, isAuthenticated } = useAuth()

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check role
  const role = user.role?.toLowerCase()
  const isWorker = role === 'worker'

  // If user is admin, redirect to admin dashboard
  if (!isWorker && role?.includes('admin')) {
    return <Navigate to="/admin/dashboard" replace />
  }

  // If user has invalid role, redirect to login
  if (!isWorker) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated and is a worker
  return <>{children}</>
}
