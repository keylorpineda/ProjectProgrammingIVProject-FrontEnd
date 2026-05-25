import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { NAVIGATION_CONFIG, Role } from '@/config/navigation';

export default function GlobalSidebar() {
  const { user } = useAuthStore();

  const handlePrefetch = (path: string) => {
    // TACTICAL PREFETCHING: Example of prefetching logic based on route
    if (path === '/personnel') {
      // queryClient.prefetchQuery({ queryKey: ['persons'], queryFn: getPersons });
    }
  };

  const allowedNavItems = NAVIGATION_CONFIG.filter((item) => 
    user?.role && item.allowedRoles.includes(user.role as Role)
  );

  return (
    <aside className="w-64 bg-ink-black border-r border-accent-orange/20 flex flex-col h-full z-20 shrink-0 relative overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-orange/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-accent-orange/20 bg-ink-black/80 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-accent-orange bg-dark-brown/50 flex items-center justify-center rounded-sm relative overflow-hidden group cursor-pointer shadow-[0_0_10px_rgba(212,163,115,0.2)]">
            <div className="absolute inset-0 bg-accent-orange/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
            <span className="font-mono font-bold text-accent-orange text-xl relative z-10">D</span>
          </div>
          <div>
            <h1 className="font-typewriter text-xl font-bold text-parchment/90 tracking-wider">DOOMSDAY</h1>
            <p className="font-mono text-[10px] text-accent-orange/60 uppercase tracking-widest">
              Comando Central
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10">
        <div className="px-3 mb-2">
          <h2 className="font-mono text-xs text-accent-orange/40 uppercase tracking-widest font-semibold">
            Operaciones
          </h2>
        </div>
        
        {allowedNavItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onMouseEnter={() => handlePrefetch(item.path)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-sm border transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'border-accent-orange bg-accent-orange/10 text-accent-orange shadow-[inset_4px_0_0_#d4a373]'
                  : 'border-transparent text-parchment/60 hover:text-parchment hover:bg-dark-brown/30 hover:border-accent-orange/30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-accent-orange/10 to-transparent translate-x-[-100%] transition-transform duration-300 ${
                    isActive ? 'translate-x-0' : 'group-hover:translate-x-[-50%]'
                  }`}
                />
                <item.icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    isActive ? 'text-accent-orange' : 'text-parchment/40 group-hover:text-parchment/80'
                  }`}
                />
                <span className="font-mono text-sm uppercase tracking-wide relative z-10">
                  {user?.role && item.roleLabels?.[user.role as Role] 
                    ? item.roleLabels[user.role as Role] 
                    : item.label}
                </span>
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-accent-orange rounded-full animate-pulse shadow-[0_0_8px_#d4a373]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
