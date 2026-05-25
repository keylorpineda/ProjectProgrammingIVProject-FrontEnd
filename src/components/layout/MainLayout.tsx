import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import GlobalSidebar from './GlobalSidebar';
import GlobalTopBar from './GlobalTopBar';
import './main-layout.css';

export default function MainLayout() {
  const navigate = useNavigate();
  // Using selector to avoid re-renders on every store change
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Perform cleanup and navigate
    // Wait for state updates if necessary
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 100);
  };

  return (
    <div className="travelmanager-root relative selection:bg-accent-orange selection:text-ink-black uppercase h-screen w-full flex overflow-hidden bg-black text-parchment font-sans">
      {/* Vintage scan-line overlay */}
      <div className="vintage-scanline pointer-events-none z-50 mix-blend-overlay opacity-50" />

      {/* Sidebar */}
      <GlobalSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <GlobalTopBar onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Background effects for the main content */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink-black via-[#0a0806] to-ink-black pointer-events-none z-0" />
          <div className="absolute inset-0 bg-paper-texture opacity-20 mix-blend-overlay pointer-events-none z-0" />
          
          <div className="relative z-10 p-6 h-full">
            <Outlet />
          </div>
        </main>

        <footer className="h-8 bg-ink-black border-t border-accent-orange/20 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <p className="font-mono text-[10px] text-parchment/40 tracking-widest">
            SISTEMA DOOMSDAY v2.0 // COMANDO CENTRAL
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono text-accent-orange/60 tracking-widest">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
              ENLACE SEGURO ACTIVO
            </div>
            <span>TRANSMISIÓN CIFRADA</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
