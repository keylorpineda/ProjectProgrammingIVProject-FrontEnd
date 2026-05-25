import { lazy } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const AdminResources = lazy(() => import('@/pages/Admin/components/Resources'));
const TravelResources = lazy(() => import('@/pages/TravelManager/components/TravelResources'));
const CampLeaderInventory = lazy(() => import('@/pages/CampLeader/components/InventoryView'));
const WorkerResources = lazy(() => import('@/pages/worker/WorkerResources'));

const FallbackComponent = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/10 rounded border border-dashed border-white/5">
    <h2 className="text-xl font-bold font-mono text-accent-orange mb-2">ACCESO RESTRINGIDO</h2>
    <p className="text-white/40 font-mono text-sm">Módulo de logística restringido.</p>
  </div>
);

export default function InventoryRouter() {
  const { user } = useAuthStore();
  if (!user) return <FallbackComponent />;

  switch (user.role) {
    case 'admin':
      return <AdminResources {...({} as any)} />;
    case 'travel_manager':
      return <TravelResources {...({} as any)} />;
    case 'camp_leader':
      return <CampLeaderInventory inventory={[]} />;
    case 'worker':
      return <WorkerResources {...({} as any)} />;
    default:
      return <FallbackComponent />;
  }
}
