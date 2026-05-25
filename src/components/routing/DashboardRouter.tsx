import { lazy } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const AdminDashboard = lazy(() => import('@/pages/Admin/components/Dashboard'));
const TravelDashboard = lazy(() => import('@/pages/TravelManager/components/TravelDashboard'));
const CampLeaderDashboard = lazy(() => import('@/pages/CampLeader/components/DashboardView'));
const WorkerDashboard = lazy(() => import('@/pages/worker/WorkerDashboard'));

const FallbackComponent = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/10 rounded border border-dashed border-white/5">
    <h2 className="text-xl font-bold font-mono text-accent-orange mb-2">ACCESO RESTRINGIDO</h2>
    <p className="text-white/40 font-mono text-sm">Vista de comando no disponible para tu rol actual.</p>
  </div>
);

export default function DashboardRouter() {
  const { user } = useAuthStore();
  if (!user) return <FallbackComponent />;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard {...({} as any)} />;
    case 'travel_manager':
      return <TravelDashboard {...({} as any)} />;
    case 'camp_leader':
      return <CampLeaderDashboard explorations={[]} transfers={[]} inventory={[]} balances={[]} movements={[]} onNavigate={() => {}} />;
    case 'worker':
      return <WorkerDashboard {...({} as any)} />;
    default:
      return <FallbackComponent />;
  }
}
