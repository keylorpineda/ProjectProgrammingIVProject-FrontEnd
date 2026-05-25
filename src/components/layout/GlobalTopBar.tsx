import { LogOut, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface GlobalTopBarProps {
  onLogout: () => void;
}

export default function GlobalTopBar({ onLogout }: GlobalTopBarProps) {
  const { user } = useAuthStore();
  ;

  return (
    <header className="h-16 bg-ink-black border-b border-accent-orange/20 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-overlay pointer-events-none" />
      
      {/* Left side: System Status & Time (useServerTime hook will go here) */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-brown/30 border border-accent-orange/30 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="font-mono text-xs text-parchment/80 uppercase tracking-widest">
            SISTEMA EN LÍNEA
          </span>
        </div>
      </div>

      {/* Right side: User Profile & Actions */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex flex-col items-end mr-2 hidden sm:flex">
          <span className="font-mono text-sm font-bold text-parchment uppercase tracking-wide">
            {user?.username || 'OPERADOR'}
          </span>
          <span className="font-typewriter text-xs text-accent-orange/70">
            {user?.role?.replace('_', ' ') || 'DESCONOCIDO'}
          </span>
        </div>
        
        <div className="w-10 h-10 rounded-sm bg-dark-brown/50 border border-accent-orange/30 flex items-center justify-center text-parchment/70 shadow-inner">
          <UserCircle className="w-6 h-6" />
        </div>

        <div className="h-8 w-px bg-accent-orange/20 mx-1" />

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-red-900/30 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 transition-all duration-200 group"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs uppercase tracking-widest font-semibold hidden sm:inline">
            Desconectar
          </span>
        </button>
      </div>
    </header>
  );
}
