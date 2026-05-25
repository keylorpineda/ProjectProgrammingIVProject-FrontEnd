import { useAuthStore } from '@/store/useAuthStore';

const roles = ['admin', 'travel_manager', 'camp_leader', 'worker'] as const;

export default function RoleSwitcher() {
  const { user, setAuth, logout } = useAuthStore();

  // Ocultar en producción
  if (import.meta.env.PROD) return null;

  const handleSwitchRole = (role: string) => {
    // Creamos un token falso válido para evitar el logout automático si hay guards
    // Header (alg: HS256) + Payload (exp: in 1 year) + Signature
    const fakePayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 31536000 }));
    const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.fake_signature`;

    setAuth(fakeToken, {
      id: `dev_${role}_1`,
      username: `dev_${role}`,
      email: `${role}@doomsday.com`,
      role: role,
      camp_id: '1'
    });
    
    // Recargar para que los Routers lean bien el store inicial si es necesario
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/80 border border-accent-orange/40 p-3 rounded-lg shadow-[0_0_20px_rgba(212,163,115,0.2)] backdrop-blur-md">
      <div className="text-[10px] font-mono text-accent-orange/80 uppercase tracking-widest mb-2 border-b border-accent-orange/20 pb-1 text-center font-bold">
        🛠 Dev Role Switcher
      </div>
      <div className="flex flex-col gap-1.5">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => handleSwitchRole(role)}
            className={`px-3 py-1 text-[10px] font-mono uppercase rounded transition-all border ${
              user?.role === role 
                ? 'bg-accent-orange text-black font-black border-accent-orange' 
                : 'bg-black/40 text-parchment/60 border-white/10 hover:border-accent-orange/40 hover:text-accent-orange'
            }`}
          >
            {role.replace('_', ' ')}
          </button>
        ))}
        <button
          onClick={() => { logout(); window.location.reload(); }}
          className="mt-2 px-3 py-1 text-[10px] font-mono uppercase rounded bg-red-900/20 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
        >
          Limpiar Sesión (Logout)
        </button>
      </div>
    </div>
  );
}
