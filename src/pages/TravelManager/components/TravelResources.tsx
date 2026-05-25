import { useState, useMemo } from 'react';
import {
  Package,
  Droplets,
  Utensils,
  HeartPulse,
  Hammer,
  Filter,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  Crosshair,
  Flame,
  Bed,
  Archive,
  Navigation,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/pages/Admin/context/AuthContext';
import { getCamps } from '@/features/camps/services/camps.service';
import { getInventory } from '@/features/inventory/services/inventory.service';

export interface Resource {
  id: string;
  name: string;
  category: string;
  unit: string;
  campId: string;
  quantity: number;
  status: 'sufficient' | 'low' | 'insufficient' | 'critical' | 'none';
  minThreshold?: number;
  usageNotes?: string;
  description?: string;
}

type ResourceStatus = Resource['status'] | 'all';

export default function TravelResources() {
  const { user } = useAuth();
  const baseCampId = user?.camp_id ?? '';
  const [consultedCampId, setConsultedCampId] = useState(baseCampId);
  const [activeStatus, setActiveStatus] = useState<ResourceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Consultas asíncronas reales
  const { data: campsData = [], isError: campsError } = useQuery({
    queryKey: ['camps'],
    queryFn: getCamps
  });

  const { data: inventoryData = [], isError: inventoryError } = useQuery({
    queryKey: ['inventory', consultedCampId],
    queryFn: () => getInventory(consultedCampId),
    enabled: !!consultedCampId,
  });

  const hasError = campsError || inventoryError;

  const camps = campsData.map((c: any) => ({
    id: String(c.id),
    name: c.name
  }));

  // Mapear los datos reales del backend al formato que espera la plantilla
  const resources: Resource[] = useMemo(() => {
    return inventoryData.map((item: any) => {
      let status: Resource['status'] = 'sufficient';
      if (item.current_quantity === 0) {
        status = 'none';
      } else if (item.current_quantity <= (item.minimum_stock_required || 0) * 0.5) {
        status = 'critical';
      } else if (item.is_below_minimum) {
        status = 'insufficient';
      } else if (item.current_quantity <= (item.minimum_stock_required || 0) * 1.5) {
        status = 'low';
      }

      return {
        id: String(item.id),
        name: item.resource?.name || 'Recurso Desconocido',
        category: item.resource?.category || 'general',
        unit: item.resource?.unit || 'UNID',
        campId: String(item.camp_id || consultedCampId),
        quantity: item.current_quantity || 0,
        status: status,
        minThreshold: item.minimum_stock_required || 0,
        description: item.resource?.description || '',
        usageNotes: item.notes || ''
      };
    });
  }, [inventoryData, consultedCampId]);

  const baseCamp = camps.find(c => c.id === baseCampId);

  const getCampName = (id: string) => camps.find(c => c.id === id)?.name || id;

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (r.campId !== consultedCampId) return false;
      if (activeStatus !== 'all' && r.status !== activeStatus) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (searchQuery) {
        return r.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [resources, consultedCampId, activeStatus, categoryFilter, searchQuery]);

  const selectedResource = useMemo(() =>
    resources.find(r => r.id === selectedId) || null
    , [resources, selectedId]);

  const stats = [
    { id: 'sufficient', label: 'Suficientes', count: resources.filter(r => r.campId === consultedCampId && r.status === 'sufficient').length, color: 'text-accent-approved' },
    { id: 'low', label: 'Bajos', count: resources.filter(r => r.campId === consultedCampId && r.status === 'low').length, color: 'text-accent-warning' },
    { id: 'insufficient', label: 'Insuficientes', count: resources.filter(r => r.campId === consultedCampId && r.status === 'insufficient').length, color: 'text-accent-critical' },
    { id: 'critical', label: 'Críticos', count: resources.filter(r => r.campId === consultedCampId && r.status === 'critical').length, color: 'text-red-800' },
  ];

  const categories = ['all', ...Array.from(new Set(resources.map(r => r.category)))];

  const getIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'water': return Droplets;
      case 'food': return Utensils;
      case 'medicine': return HeartPulse;
      case 'tools': return Hammer;
      case 'weaponry': return Crosshair;
      case 'fuel': return Flame;
      case 'rest': return Bed;
      default: return Package;
    }
  };

  const getStatusLabel = (status: Resource['status']) => {
    switch (status) {
      case 'sufficient': return 'Suficiente';
      case 'low': return 'Bajo';
      case 'insufficient': return 'Insuficiente';
      case 'critical': return 'Crítico';
      case 'none': return 'Sin Stock';
      default: return status;
    }
  };

  const getStatusColor = (status: Resource['status']) => {
    switch (status) {
      case 'sufficient': return 'text-accent-approved';
      case 'low': return 'text-accent-warning';
      case 'insufficient': return 'text-accent-critical';
      case 'critical': return 'text-red-800';
      default: return 'text-white/20';
    }
  };

  const getLevelColor = (status: Resource['status']) => {
    switch (status) {
      case 'sufficient': return 'bg-accent-approved';
      case 'low': return 'bg-accent-warning';
      case 'insufficient': return 'bg-accent-critical';
      case 'critical': return 'bg-red-800';
      default: return 'bg-white/10';
    }
  };

  // Evaluation for prep panel
  const criticalShortages = filteredResources.filter(r => r.status === 'critical' || r.status === 'insufficient');
  const isTripReady = criticalShortages.length === 0 && filteredResources.length > 0;

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden bg-[#0a0a0a] p-4">
      {/* 1. Header de la vista */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#12110f] p-4 rounded-lg border-l-4 border-l-[#d4a373] shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-[#d4a373]/10 p-2 border border-[#d4a373]/30 rounded">
            <Archive className="h-6 w-6 text-[#d4a373]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-bg-paper paper-texture text-ink text-[7px] font-mono font-black uppercase rotate-1 shadow-sm border border-bg-paper-shadow/30">Logística_Refugio</span>
              <span className="text-[7px] font-mono text-[#d4a373]/40 uppercase tracking-widest font-black">INV_OPERATIONAL</span>
            </div>
            <h2 className="text-xl font-typewriter font-black text-white uppercase tracking-tight leading-none">RECURSOS DE VIAJE</h2>
            <p className="font-mono text-[9px] text-[#d4a373] font-black uppercase tracking-[0.2em] mt-1 opacity-80">
              Inventario operativo: {baseCamp?.name.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveStatus(s.id as ResourceStatus)}
                className={`flex flex-col items-center transition-all px-3 py-1 rounded border border-transparent ${activeStatus === s.id ? 'bg-[#d4a373]/10 border-[#d4a373]/20 shadow-inner scale-105' : 'hover:bg-white/5'
                  }`}
              >
                <span className={`text-lg font-mono font-black ${s.color}`}>{s.count}</span>
                <span className="text-[7px] font-mono text-white/40 uppercase font-black tracking-tighter">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasError && (
        <div className="bg-red-950/40 border border-red-500/50 p-3 font-mono text-[10px] text-red-400 uppercase flex items-center gap-2 shadow-lg mb-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los datos recientes.</span>
        </div>
      )}

      {/* 2. Barra de filtros compacta */}
      <div className="bg-[#12110f] p-2 px-4 rounded-lg flex items-center gap-4 shrink-0 border border-white/5">
        <div className="flex-1 flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded border border-white/10 focus-within:border-[#d4a373]/40 transition-all">
          <Search className="h-3.5 w-3.5 text-white/20" />
          <input
            type="text"
            placeholder="BUSCAR RECURSO POR NOMBRE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[10px] font-mono text-white/80 uppercase w-full placeholder:text-white/10"
          />
        </div>

        <div className="flex items-center gap-2 text-[9px] font-mono font-black uppercase text-white/40 px-4 border-l border-white/10">
          <span className="text-[#d4a373]/40">Ver Información de:</span>
          <select
            value={consultedCampId}
            onChange={(e) => setConsultedCampId(e.target.value)}
            className="bg-transparent border-none text-[#d4a373] focus:outline-none cursor-pointer hover:text-white transition-all uppercase"
          >
            {camps.map(c => (
              <option key={c.id} value={c.id} className="bg-[#12110f]">{c.id === baseCampId ? `[MI BASE] ${c.name.toUpperCase()}` : c.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
          <Filter className="h-3 w-3 text-white/20" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent border-none text-[9px] font-mono font-black text-white/40 uppercase focus:outline-none cursor-pointer hover:text-white transition-all"
          >
            {categories.map(c => (
              <option key={c} value={c} className="bg-[#12110f]">{c === 'all' ? 'TODAS LAS CATEGORÍAS' : c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* PANEL IZQUIERDO: INVENTARIO DE VIAJE */}
        <div className="w-[320px] flex flex-col gap-2 shrink-0 overflow-hidden bg-[#12110f] p-3 rounded-lg border-l-2 border-l-[#d4a373]/40 shadow-2xl relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

          <div className="flex flex-col px-1 mb-1 border-b border-[#d4a373]/10 pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-black text-[#d4a373] uppercase tracking-widest leading-none">Inventario de Viaje</span>
              <span className="text-[8px] font-mono font-black text-white/20 uppercase bg-white/5 px-1.5 py-0.5 rounded">{filteredResources.length} REGISTROS</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10">
            {filteredResources.length > 0 ? (
              filteredResources.map(resource => {
                const Icon = getIcon(resource.category);
                return (
                  <motion.button
                    key={resource.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedId(resource.id)}
                    className={`w-full text-left p-3 relative transition-all border border-[#d4a373]/10 rounded group shadow-md ${selectedId === resource.id
                        ? 'bg-bg-paper paper-texture scale-[1.02] z-10'
                        : 'bg-[#b69e7e]/5 hover:bg-[#b69e7e]/10 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 border ${selectedId === resource.id ? 'bg-ink/5 border-ink/10' : 'bg-black/20 border-white/5'}`}>
                        <Icon className={`h-4 w-4 ${selectedId === resource.id ? 'text-ink/60' : 'text-[#d4a373]/40'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-[12px] font-typewriter font-black uppercase truncate ${selectedId === resource.id ? 'text-ink' : 'text-[#d4a373]'
                          }`}>
                          {resource.name}
                        </h5>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-[8px] font-mono font-black uppercase tracking-widest ${selectedId === resource.id ? 'text-ink/40' : 'text-[#d4a373]/30'}`}>
                            {resource.category}
                          </span>
                          <span className={`text-[10px] font-mono font-black ${selectedId === resource.id ? 'text-ink' : 'text-white/60'}`}>
                            {resource.quantity} {resource.unit.toUpperCase()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((resource.quantity / (resource.minThreshold || 100)) * 100, 100)}%` }}
                              className={`h-full ${getLevelColor(resource.status)} opacity-80`}
                            />
                          </div>
                          <span className={`text-[7px] font-mono font-black uppercase ${getStatusColor(resource.status)}`}>
                            {getStatusLabel(resource.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedId === resource.id && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#d4a373]" />
                    )}
                  </motion.button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Archive className="h-10 w-10 text-[#d4a373]/10 mb-4" />
                <p className="text-[10px] font-mono text-white/20 uppercase font-black">Sin recursos registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL CENTRAL: FICHA DEL RECURSO SELECCIONADO */}
        <div className="flex-1 flex flex-col bg-[#12110f] rounded-lg overflow-hidden border border-white/5 shadow-2xl relative">
          <AnimatePresence mode="wait">
            {selectedResource ? (
              <motion.div
                key={selectedResource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header Manifest */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#b69e7e]/10 p-2 rounded border border-[#b69e7e]/20">
                      <ClipboardList className="h-5 w-5 text-[#d4a373]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-typewriter font-black text-white uppercase tracking-wider">Hoja de Suministro Operativo</h3>
                      <p className="text-[9px] font-mono text-[#d4a373]/60 uppercase tracking-widest font-black">
                        IDENTIFICADO_COMO: {selectedResource.id.toUpperCase()} // SECTOR_Z
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content - Old Paper Manifest */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden bg-[#0c0c0c] items-center justify-center">
                  <div className="w-full h-full max-w-2xl bg-bg-paper paper-texture shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden p-12 border-[8px] border-[#8b7355]/10 flex flex-col">
                    <div className="absolute top-10 right-10 flex flex-col items-center rotate-6 select-none opacity-40">
                      <div className="border-4 border-ink p-1 mb-1">
                        <span className="text-lg font-black font-mono px-2">REGISTRADO</span>
                      </div>
                      <span className="text-[8px] font-mono font-black italic">Refugio Alfa - Logística</span>
                    </div>

                    <div className="flex-1 flex flex-col relative z-10">
                      <div className="mb-10 pb-6 border-b-4 border-double border-ink/20">
                        <span className="text-[8px] font-mono text-ink/40 font-black uppercase tracking-tighter">NOMBRE_DEL_RECURSO</span>
                        <h2 className="text-3xl font-typewriter font-black text-ink uppercase leading-none mt-1">{selectedResource.name}</h2>
                      </div>

                      <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-4">
                          <div>
                            <span className="text-[8px] font-mono text-ink/40 font-black uppercase">Clasificación</span>
                            <p className="text-[14px] font-typewriter font-black text-ink uppercase mt-1">{selectedResource.category}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono text-ink/40 font-black uppercase">Unidad_Medida</span>
                            <p className="text-[14px] font-mono font-black text-ink uppercase mt-1">{selectedResource.unit}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono text-ink/40 font-black uppercase">Asignado_A</span>
                            <p className="text-[14px] font-mono font-black text-ink uppercase mt-1">{getCampName(selectedResource.campId)}</p>
                          </div>
                        </div>

                        <div className="bg-ink/5 p-6 rounded-sm border border-ink/10 flex flex-col items-center justify-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-ink/10" />
                          <span className="text-[10px] font-mono text-ink/40 font-black uppercase mb-4">Stock Vital</span>
                          <div className="text-5xl font-typewriter font-black text-ink leading-none mb-2">
                            {selectedResource.quantity}
                          </div>
                          <span className="text-[10px] font-mono text-ink font-black uppercase tracking-widest">{selectedResource.unit}</span>
                          <div className={`mt-4 px-3 py-1 border-2 font-mono font-black text-[10px] uppercase rotate-[-3deg] ${getStatusColor(selectedResource.status).replace('text-', 'border-').replace('text-', 'text-')}`}>
                            {getStatusLabel(selectedResource.status)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-12 space-y-6">
                        <div>
                          <h4 className="text-[9px] font-mono font-black text-ink/40 border-b border-ink/5 pb-1 mb-3 uppercase">ESTADO DE DISPONIBILIDAD</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-[10px] font-mono mb-1">
                              <span className="text-ink/60">UMBRAL CRÍTICO MÍNIMO</span>
                              <span className="font-black text-ink">{selectedResource.minThreshold || 0} {selectedResource.unit.toUpperCase()}</span>
                            </div>
                            <div className="h-6 w-full bg-ink/5 border border-ink/20 relative group overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((selectedResource.quantity / (selectedResource.minThreshold || 1)) * 50, 100)}%` }}
                                className={`h-full ${getLevelColor(selectedResource.status).replace('bg-', 'bg-')} opacity-60 shadow-inner`}
                              />
                              <div className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                                <span className="text-[8px] font-mono font-black text-white/40 uppercase tracking-widest">NIVEL_RECURSO_ACTUAL</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[9px] font-mono font-black text-ink/40 border-b border-ink/5 pb-1 mb-2 uppercase">RECOMENDACIÓN DE USO</h4>
                          <div className="p-4 bg-white/40 border border-ink/10 rounded-sm italic font-typewriter text-xs text-ink/80 leading-relaxed min-h-[60px]">
                            {selectedResource.usageNotes || 'Sin instrucciones adicionales de uso operativo.'}
                          </div>
                          <p className="mt-2 text-[10px] font-mono text-ink/40 leading-tight">
                            {selectedResource.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto pt-8 flex justify-between items-center text-[8px] font-mono text-ink/30 font-black uppercase">
                        <span>SINC_DATA: 2026-05-16 // RADIO_REF_ALFA</span>
                        <div className="flex gap-4">
                          <span>VERIFICADO: LOG-01</span>
                          <span className="text-ink/60">FOLIO_INV_{selectedResource.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Database className="h-16 w-16 mb-6 text-[#d4a373] opacity-20" />
                <h3 className="text-lg font-typewriter font-black text-white/40 uppercase mb-2">Sin recurso seleccionado</h3>
                <p className="text-xs font-mono text-white/20 uppercase max-w-xs">
                  Seleccione una ficha del inventario de viaje para desplegar el manifiesto detallado.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* PANEL DERECHO: PREPARACIÓN DE VIAJE */}
        <div className="w-[300px] flex flex-col gap-3 shrink-0 overflow-hidden">
          <div className="bg-[#12110f] p-4 rounded-lg flex flex-col h-full border border-white/5 shadow-2xl overflow-hidden relative">
            <h3 className="text-[10px] font-mono font-black text-[#d4a373] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 shrink-0 border-b border-[#d4a373]/10 pb-3">
              <Navigation className="h-3.5 w-3.5" /> Preparación de Viaje
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-5">
              <div className="space-y-4">
                <div className={`p-4 rounded-sm border-2 border-dashed relative shadow-inner flex flex-col items-center text-center ${isTripReady ? 'bg-accent-approved/10 border-accent-approved/20' : 'bg-red-900/10 border-red-900/20'
                  }`}>
                  <span className="text-[8px] font-mono text-white/30 font-black uppercase block mb-2 tracking-widest">Estado de Preparación</span>
                  {isTripReady ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-accent-approved mb-2" />
                      <span className="text-[14px] font-typewriter font-black uppercase text-accent-approved">LISTO PARA VIAJE</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-accent-critical mb-2" />
                      <span className="text-[14px] font-typewriter font-black uppercase text-accent-critical">REQUIERE REVISIÓN</span>
                    </>
                  )}
                </div>

                <div className="bg-black/20 border border-white/5 p-4 rounded-sm space-y-3">
                  <h4 className="text-[9px] font-mono font-black text-white/40 uppercase tracking-widest">SITUACIÓN DE INSUMOS</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-white/60 uppercase">Agua</span>
                      <span className="text-accent-approved font-black">ÓPTIMA</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-white/60 uppercase">Víveres</span>
                      <span className="text-accent-warning font-black">LIMITADA</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-white/60 uppercase">Sumin. Médicos</span>
                      <span className="text-accent-critical font-black">CRÍTICA</span>
                    </div>
                  </div>
                </div>

                {!isTripReady && criticalShortages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-black text-red-500 uppercase flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> FALTANTES CRÍTICOS
                    </span>
                    <div className="space-y-1.5">
                      {criticalShortages.slice(0, 3).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2 bg-red-950/20 border border-red-900/10 rounded-sm">
                          <span className="text-[9px] font-mono text-red-100/60 uppercase truncate flex-1">{r.name}</span>
                          <span className="text-[10px] font-mono font-black text-red-500 ml-2">{r.quantity} {r.unit}</span>
                        </div>
                      ))}
                      {criticalShortages.length > 3 && (
                        <p className="text-[8px] font-mono text-white/20 text-center uppercase mt-1">+ {criticalShortages.length - 3} recursos adicionales insuficientes</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-6">
                <button
                  disabled={!isTripReady}
                  className={`w-full py-2.5 font-mono font-black text-[10px] uppercase rounded shadow-lg border-b-2 border-r-2 border-black/20 transition-all active:scale-95 flex items-center justify-center gap-2 ${isTripReady
                      ? 'bg-accent-approved text-black hover:bg-white'
                      : 'bg-white/5 text-white/10 cursor-not-allowed grayscale'
                    }`}
                >
                  Preparar Exploración
                </button>
                {!isTripReady && (
                  <button className="w-full py-2.5 bg-accent-warning text-black font-mono font-black text-[10px] uppercase rounded shadow-lg border-b-2 border-r-2 border-black/20 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2">
                    Nueva Solicitud de Suministros
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 shrink-0">
              <div className="p-3 bg-black/40 rounded-sm border-l-2 border-[#d4a373]">
                <p className="italic font-mono text-[8px] text-[#d4a373] uppercase leading-relaxed font-bold">
                  Nota_Operativa: <br />
                  <span className="text-[8px] font-medium opacity-60">No autorizar salidas sin al menos 48h de raciones de emergencia.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
