import { lazy } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const AdminPeople = lazy(() => import('@/pages/Admin/components/People'));
const TravelTeam = lazy(() => import('@/pages/TravelManager/components/TravelTeam'));
const CampLeaderProfile = lazy(() => import('@/pages/CampLeader/components/ProfileView'));
const WorkerProfile = lazy(() => import('@/pages/worker/WorkerProfile'));

const FallbackComponent = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/10 rounded border border-dashed border-white/5">
    <h2 className="text-xl font-bold font-mono text-accent-orange mb-2">ACCESO RESTRINGIDO</h2>
    <p className="text-white/40 font-mono text-sm">Gestión de personal no autorizada.</p>
  </div>
);

export default function PersonnelRouter() {
  const { user } = useAuthStore();
  if (!user) return <FallbackComponent />;

  switch (user.role) {
    case 'admin':
      return <AdminPeople {...({} as any)} />;
    case 'travel_manager':
      return <TravelTeam {...({} as any)} />;
    case 'camp_leader':
      return <CampLeaderProfile user={user as any} statistics={{} as any} residents={[]} />;
    case 'worker':
      return <WorkerProfile {...({} as any)} />;
    default:
      return <FallbackComponent />;
  }
}
