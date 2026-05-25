import { lazy } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const AdminTransfers = lazy(() => import('@/pages/Admin/components/Transfers'));
const TravelTransfers = lazy(() => import('@/pages/TravelManager/components/TravelTransfers'));
const CampLeaderTransfers = lazy(() => import('@/pages/CampLeader/components/TransfersView'));

const FallbackComponent = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/10 rounded border border-dashed border-white/5">
    <h2 className="text-xl font-bold font-mono text-accent-orange mb-2">ACCESO RESTRINGIDO</h2>
    <p className="text-white/40 font-mono text-sm">Logística de traslados no disponible.</p>
  </div>
);

export default function TransfersRouter() {
  const { user } = useAuthStore();
  if (!user) return <FallbackComponent />;

  switch (user.role) {
    case 'admin':
      return <AdminTransfers {...({} as any)} />;
    case 'travel_manager':
      return <TravelTransfers {...({} as any)} />;
    case 'camp_leader':
      return (
        <CampLeaderTransfers 
          transfers={[]} 
          camps={[]} 
          resources={[]} 
          inventory={[]} 
          myCampId={1} 
          onCreateTransferRequest={async () => {}}
          onApproveTransferRequest={async () => {}}
          onCancelTransferRequest={async () => {}}
          onArriveTransferRequest={async () => {}}
        />
      );
    default:
      return <FallbackComponent />;
  }
}
