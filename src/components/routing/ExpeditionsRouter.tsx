import { lazy } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const AdminExplorations = lazy(() => import('@/pages/Admin/components/Explorations'));
const TravelExplorations = lazy(() => import('@/pages/TravelManager/components/TravelExplorations'));
const CampLeaderExplorations = lazy(() => import('@/pages/CampLeader/components/ExplorationsView'));

const FallbackComponent = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/10 rounded border border-dashed border-white/5">
    <h2 className="text-xl font-bold font-mono text-accent-orange mb-2">ACCESO RESTRINGIDO</h2>
    <p className="text-white/40 font-mono text-sm">Control de expediciones denegado.</p>
  </div>
);

export default function ExpeditionsRouter() {
  const { user } = useAuthStore();
  if (!user) return <FallbackComponent />;

  switch (user.role) {
    case 'admin':
      return <AdminExplorations {...({} as any)} />;
    case 'travel_manager':
      return <TravelExplorations {...({} as any)} />;
    case 'camp_leader':
      return (
        <CampLeaderExplorations 
          explorations={[]} 
          activePersons={[]} 
          inventory={[]} 
          resources={[]} 
          onCreateExploration={async () => {}}
          onDepartExploration={async () => {}}
          onReturnExploration={async () => {}}
          onCancelExploration={async () => {}}
        />
      );
    default:
      return <FallbackComponent />;
  }
}
