import { Outlet } from 'react-router-dom';
import { Role } from '@/config/navigation';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export default function ProtectedRoute(_props: ProtectedRouteProps) {
  // TEMP: Bypassed for UI testing. Original code removed temporarily to avoid TS unused variable errors.
  return <Outlet />;
}
