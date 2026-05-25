/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import ManagerOverview from './ManagerOverview';
import ManagerInventory from './ManagerInventory';
import ManagerWorkforce from './ManagerWorkforce';
import ManagerLogistics from './ManagerLogistics';
import { Terminal, Database, Radio, Users, Truck, LogOut, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

type TabID = 'overview' | 'inventory' | 'workforce' | 'logistics';

export default function DashboardManager() {
  const user = useAuthStore((state) => state.user);
  const setCampId = useAuthStore((state) => state.setCampId);
  const logout = useAuthStore((state) => state.logout);
  const campId = user?.campId;

  const [activeTab, setActiveTab] = useState<TabID>('overview');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Helper to force-refresh all sub-components by incrementing key
  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetDatabase = () => {
    if (confirm('¿Restablecer registros de la bodega y sobrevivientes a valores de fábrica del búnker?')) {
      localStorage.clear();
      triggerRefresh();
    }
  };

  // ⚠️ MANDATORY RULE: If campId is null, show terminal static loader
  if (!campId || !user) {
    return (
      <div className="min-h-screen bg-[#0d0c0b] flex items-center justify-center p-4 font-mono select-none">
        <div className="w-full max-w-lg border-2 border-dashed border-[#9c2720] bg-[#121110] p-8 rounded text-[#e0d8cc] space-y-6 relative overflow-hidden">
          {/* Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />
          
          <div className="flex flex-col items-center text-center space-y-4">
            <Radio className="h-14 w-14 text-[#9c2720] animate-ping" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#9c2720]">SIGNAL INTERRUPTED</h2>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-extrabold flex items-center justify-center gap-1">
                <span>TERMINAL RECON: DECRYPT_STAGE_2</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-black/55 p-4 rounded text-xs select-all text-center uppercase tracking-wide text-zinc-400 space-y-1">
            <span className="font-bold text-[#9c2720] block animate-pulse">Awaiting Camp Signal...</span>
            <p className="text-[10px] text-zinc-600 mt-1">
              No camp assigned to current session certificate. Establish orbital lock vector to decode warehouse registers.
            </p>
          </div>

          {/* DEVELOPER BEZEL TO DEMO LOGINS */}
          <div className="border-2 border-black bg-[#121110] p-4 rounded text-center space-y-3">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Debug Panel: Fuerza de Enlace</span>
            <button
              type="button"
              onClick={() => setCampId('Bunker-04')}
              className="w-full border-2 border-[#c27c2f] text-[#c27c2f] py-1.5 uppercase text-xs font-bold hover:bg-[#c27c2f] hover:text-black transition"
            >
              🔄 CONECTAR SENDER A BUNKER-04
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabList: { id: TabID; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'overview', label: 'Balance', icon: Database },
    { id: 'inventory', label: 'Bodega', icon: Terminal },
    { id: 'workforce', label: 'Personal', icon: Users },
    { id: 'logistics', label: 'Traslados', icon: Truck }
  ];

  const [utcTime, setUtcTime] = useState('');
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      setUtcTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen max-h-screen bg-[#0d0c0b] text-[#e0d8cc] relative overflow-hidden font-mono flex flex-col">
      {/* SCANLINE OVERLAY */}
      <div 
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.035]" 
        style={{ 
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', 
          backgroundSize: '100% 2px, 3px 100%' 
        }} 
      ></div>

      {/* COMPACT RUNTIME BEZEL */}
      <div className="bg-[#121110] border-b-2 border-black px-4 py-1.5 flex flex-wrap justify-between items-center gap-2 text-[10px] text-zinc-500 z-10 select-none">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#df8120] animate-pulse"></span>
          <span className="font-bold">CONSOLA OPERACIONAL:</span>
          <span>CAMP_ID_SECURE_LINK // ACTIVO</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCampId(null)}
            className="hover:text-[#9c2720] cursor-pointer hover:border-black border-2 border-black px-1.5 py-0.5 text-[9px] bg-black/40 font-bold"
          >
            DESCONECTAR
          </button>
          <button
            type="button"
            onClick={handleResetDatabase}
            className="hover:text-[#df8120] cursor-pointer hover:border-black border-2 border-black px-1.5 py-0.5 text-[9px] bg-black/40 font-bold flex items-center gap-1"
          >
            <Trash2 className="h-2.5 w-2.5" /> RE-INICIALIZAR DATOS
          </button>
        </div>
      </div>

      {/* SIDEBAR OR CONTENT SHELL CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* DOOMSDAY STYLE LEFT SIDEBAR - RESPONSIVE */}
        <aside className="w-full md:w-72 bg-[#121110] border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col justify-between shrink-0 z-20 select-none font-mono">
          <div>
            {/* BRAND HEADER & SKULL LOGO */}
            {/* ==========================================
                1. BRAND HEADER & SYSTEM SKULL HEADER
                ========================================== */}
            <div className="mb-6 pb-4 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <span className="text-[#9c2720] text-xl animate-pulse font-bold">☠</span>
                <span className="text-lg font-black text-[#df8120] tracking-widest uppercase">DOOMSDAY</span>
              </div>
              <p className="text-[10px] text-zinc-500 tracking-wider font-extrabold uppercase mt-0.5 pl-0.5">
                REGISTRO DE REFUGIO
              </p>
            </div>

            {/* ==========================================
                2. RETRO NAVIGATION MENU
                ========================================== */}
            <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0 font-mono">
              {tabList.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full text-left relative flex items-center justify-center md:justify-start gap-3 md:gap-4 py-4 px-4 md:px-5 rounded-xl transition-all duration-150 group border cursor-pointer shrink-0 hover:translate-x-1 active:translate-y-0.5 min-w-[140px] md:min-w-0 mx-1 md:mx-0"
                    style={{
                      backgroundColor: isActive ? '#c27c2f' : '#9a9080',
                      borderColor: '#000000',
                      borderWidth: '2px',
                      color: '#000000',
                      boxShadow: '3px 3px 0px #000000',
                      height: '52px',
                      minHeight: '52px',
                      marginBottom: '16px', // Espacio para Desktop
                    }}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-black font-extrabold" />
                    
                    <span className="font-mono text-[11px] md:text-xs lg:text-sm tracking-wider uppercase text-black font-extrabold select-none truncate">
                      {tab.label.toUpperCase()}
                    </span>

                    {tab.id === 'inventory' && (
                      <span 
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-[8px] md:text-[9px] font-mono px-1.5 md:px-2 py-0.5 rounded animate-pulse uppercase font-extrabold"
                        style={{
                          backgroundColor: '#9c2720',
                          color: '#ffffff',
                          border: '1px solid #000000'
                        }}
                      >
                        ALERTA
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

            {/* ==========================================
                3. ENCRYPTION & COORDINATES OVERLAY
                ========================================== */}

          {/* SIDEBAR METADATA FOOTER PANEL */}
          <div className="mt-6 border border-dashed border-[#df8120]/40 p-3.5 bg-black/40 text-left rounded-lg hidden md:block">
            <div className="text-[9px] text-[#df8120] font-extrabold uppercase tracking-wider mb-2">COORDENADAS DE ENLACE:</div>
            <div className="space-y-1 text-[11px] font-bold">
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">SECTOR:</span>
                <span className="text-[#df8120] uppercase">COSTA GRIS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">ESTACIÓN:</span>
                <span className="text-[#e0d8cc] underline uppercase">{campId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">MODO:</span>
                <span className="text-[#9c2720] uppercase font-black animate-pulse">CONTENCION</span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT DISPLAY CANVAS */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          
          {/* THREE COLUMN DOOMSDAY TOPBAR PANEL */}
          <header className="bg-[#121110] border-b-2 border-black flex flex-col sm:flex-row justify-between items-center px-4 md:px-6 py-3 gap-4 shrink-0 font-mono select-none z-10 shadow-md">
            
            {/* Left Portal Badges */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9c2720] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#9c2720]"></span>
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-black text-[#e0d8cc] hover:text-[#df8120] transition uppercase tracking-widest">
                  DOOMSDAY CENTRAL CONTROL PORTAL
                </h2>
                <p className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">
                  SALA DE MANDOS • CAMPAMENTO {campId?.toUpperCase()} [ID: #04]
                </p>
              </div>
            </div>

            {/* Center survival rating / Clock */}
            <div className="hidden lg:flex items-center gap-8 text-center px-6">
              <div>
                <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">SCORE DE SUPERVIVENCIA</div>
                <div className="text-sm font-black text-amber-500 tracking-wider">880 PTS</div>
              </div>
              <div className="border-l-2 border-black h-6"></div>
              <div className="flex items-center gap-2 text-left text-[10px]">
                <span className="text-[#df8120]">⚡</span>
                <span className="tracking-widest text-zinc-300 font-bold font-mono">{utcTime}</span>
              </div>
            </div>

            {/* Right operator badge */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right">
                <div className="font-extrabold text-[11px] text-[#e0d8cc] uppercase tracking-wider">
                  {user.name.toUpperCase()}
                </div>
                <span className="inline-block bg-[#df8120] text-black text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest mt-0.5">
                  LÍDER DE VIAJES
                </span>
              </div>
              <div className="h-9 w-9 bg-black border-2 border-black flex items-center justify-center font-black text-[#df8120] text-xs">
                {user.name[0]?.toUpperCase() || 'M'}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="h-9 px-3 bg-black hover:bg-[#9c2720] border-2 border-black hover:border-black text-xs font-black text-[#df8120] hover:text-[#e0d8cc] transition uppercase flex items-center gap-1.5 cursor-pointer shadow-[inset_0_0_6px_rgba(0,0,0,0.6)]"
                title="CERRAR SESIÓN"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">SALIR</span>
              </button>
            </div>

          </header>

          {/* MAIN PAGE ROUTE INJECTION ADAPTER */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#0d0c0b] space-y-6 relative">
            
            {/* VIEW TITLE BAR WITH BENTO STATS ADAPTER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b-2 border-black font-mono">
              <div>
                <h3 className="text-xl font-black uppercase tracking-widest text-[#df8120]">
                  {activeTab === 'overview' && "ESTACIÓN CENTRAL DE TABLERO DE COMBATE"}
                  {activeTab === 'inventory' && "BODEGA CENTRAL DE SUMINISTROS"}
                  {activeTab === 'workforce' && "ADMINISTRACIÓN DE PERSONAL Y RECURSOS"}
                  {activeTab === 'logistics' && "CONTROL DE TRASLADOS DE CONVOY"}
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase mt-1 tracking-wider font-extrabold">
                  {activeTab === 'overview' && "SINOPSIS METADATA • REPORTES OPERATIVOS ACTOS DEL SECTOR GRIS"}
                  {activeTab === 'inventory' && "CONSOLIDACIÓN DE RESERVAS DE BODEGAS Y PARÁMETROS CRÍTICOS"}
                  {activeTab === 'workforce' && "CENSO MULTIDISPENSARIO • DISTRIBUCIÓN DE HABILIDADES TÉCNICAS"}
                  {activeTab === 'logistics' && "RUTAS DE TRÁNSITO INTER-BÚNKER SATELET CORRIENDO"}
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="border-2 border-black bg-[#121110] font-mono px-3.5 py-2 text-[10px] text-[#e0d8cc] select-none uppercase font-bold tracking-widest">
                  {activeTab === 'overview' && "CONTROL MILITAR ACTIVO"}
                  {activeTab === 'inventory' && "PROTOCOLO DE SEGURIDAD ON"}
                  {activeTab === 'workforce' && "MONITOR CLÍNICO ONLINE"}
                  {activeTab === 'logistics' && "SATELLITE LINK ACTIVE"}
                </div>
              </div>
            </div>

            {/* NESTED DYNAMIC MODULE RENDER PANEL */}
            <div className="min-h-[450px]">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <div key="overview">
                    <ManagerOverview 
                      campId={campId} 
                      refreshTrigger={refreshTrigger} 
                    />
                  </div>
                )}
                {activeTab === 'inventory' && (
                  <div key="inventory">
                    <ManagerInventory 
                      campId={campId} 
                      onDataChanged={triggerRefresh}
                      refreshTrigger={refreshTrigger}
                    />
                  </div>
                )}
                {activeTab === 'workforce' && (
                  <div key="workforce">
                    <ManagerWorkforce 
                      campId={campId} 
                      onDataChanged={triggerRefresh}
                      refreshTrigger={refreshTrigger}
                    />
                  </div>
                )}
                {activeTab === 'logistics' && (
                  <div key="logistics">
                    <ManagerLogistics 
                      campId={campId} 
                      onDataChanged={triggerRefresh}
                      refreshTrigger={refreshTrigger}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>

          </main>

          {/* RETRO BENTOGRID FOOTER TIE */}
          <footer className="bg-[#121110] border-t-2 border-black px-6 py-2.5 font-mono text-[9px] text-[#df8120]/75 flex flex-col sm:flex-row justify-between gap-1.5 select-none uppercase tracking-widest font-black shrink-0">
            <span>SISTEMA DE CONTROL DE CONTENCIÓN v4.2 // ENLACE CON BÚNKER COOPERANTE ACTIVO</span>
            <span className="text-zinc-500">AUT_REGISTRY: SUCCESSFUL_VALIDATION_TOKEN_32x45c</span>
          </footer>

        </div>
      </div>
    </div>
  );
}
