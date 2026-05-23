// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Exploration, 
  ExplorationStatus, 
  Person, 
  Inventory, 
  ResourceItem 
} from '../types';
import { 
  Compass, 
  Plus, 
  Play, 
  CheckSquare, 
  XSquare, 
  Users, 
  Package, 
  Calendar, 
  Clock, 
  BookOpen, 
  Search, 
  ChevronRight,
  TriangleAlert,
  Archive,
  Star
} from 'lucide-react';

interface ExplorationsViewProps {
  explorations: Exploration[];
  activePersons: Person[];
  inventory: Inventory[];
  resources: ResourceItem[];
  onCreateExploration: (data: any) => Promise<void>;
  onDepartExploration: (id: number) => Promise<void>;
  onReturnExploration: (id: number, data: any) => Promise<void>;
  onCancelExploration: (id: number) => Promise<void>;
}

export default function ExplorationsView({
  explorations,
  activePersons,
  inventory,
  resources,
  onCreateExploration,
  onDepartExploration,
  onReturnExploration,
  onCancelExploration
}: ExplorationsViewProps) {
  const [filterStatus, setFilterStatus] = useState<ExplorationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedExplorationId, setSelectedExplorationId] = useState<number | null>(null);

  // Form Fields - New Expedition
  const [newExpName, setNewExpName] = useState('');
  const [newExpDest, setNewExpDest] = useState('');
  const [newExpESTDays, setNewExpESTDays] = useState(3);
  const [newExpGraceDays, setNewExpGraceDays] = useState(1);
  const [newExpNotes, setNewExpNotes] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);
  const [provisionStocks, setProvisionStocks] = useState<{ [key: number]: number }>({
    1: 10, // Default 10 Comida
    2: 10  // Default 10 Agua
  });

  // Form Fields - Return Expedition
  const [returnNotes, setReturnNotes] = useState('');
  const [salvagedResources, setSalvagedResources] = useState<{ [key: number]: number }>({
    1: 40, // Found Food
    2: 30, // Found Water
    3: 5,  // Found Medicine
    4: 2,  // Found Parts
    5: 100 // Found Ammo
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search Logic
  const filteredExplorations = explorations.filter(exp => {
    const matchStatus = filterStatus === 'ALL' || exp.status === filterStatus;
    const matchSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        exp.destination_description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Handle New Expedition Submission
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!newExpName.trim() || !newExpDest.trim()) {
      setFormError("COMPLETE TODOS LOS CAMPOS RESALTADOS.");
      return;
    }

    if (selectedPeople.length === 0) {
      setFormError("DEBE ASIGNAR AL MENOS UN EXCURSIONISTA.");
      return;
    }

    // Check inventory stock supplies
    let stockOk = true;
    Object.entries(provisionStocks).forEach(([resId, reqQty]) => {
      const dbInv = inventory.find(i => i.resource_id === Number(resId));
      if (!dbInv || dbInv.current_quantity < (reqQty as number)) {
        setFormError(`RECURSOS DISPONIBLES INSUFICIENTES EN ALMACÉN PARA PREPARAR VIAJE.`);
        stockOk = false;
      }
    });

    if (!stockOk) return;

    try {
      setIsSubmitting(true);
      const resourceConsumptions = Object.entries(provisionStocks).map(([key, value]) => ({
        resource_id: Number(key),
        quantity: value
      }));

      await onCreateExploration({
        camp_id: 1,
        name: newExpName,
        destination_description: newExpDest,
        departure_date: new Date().toISOString(),
        estimated_days: Number(newExpESTDays),
        grace_days: Number(newExpGraceDays),
        notes: newExpNotes,
        personIds: selectedPeople,
        resourceConsumptions
      });

      // Clear Form
      setNewExpName('');
      setNewExpDest('');
      setNewExpESTDays(3);
      setNewExpGraceDays(1);
      setNewExpNotes('');
      setSelectedPeople([]);
      setIsNewModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "FALLO EN REGISTRO DE MISIÓN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Safe Return submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExplorationId) return;

    try {
      setIsSubmitting(true);
      const foundList = Object.entries(salvagedResources).map(([key, value]) => ({
        resource_id: Number(key),
        quantity: value
      }));

      await onReturnExploration(selectedExplorationId, {
        notes: returnNotes,
        foundResources: foundList
      });

      setReturnNotes('');
      setIsReturnModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "FALLO AL REGISTRAR RETORNO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePersonSelection = (pId: number) => {
    if (selectedPeople.includes(pId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== pId));
    } else {
      setSelectedPeople([...selectedPeople, pId]);
    }
  };

  const handleProvisionChange = (resId: number, qty: number) => {
    setProvisionStocks({
      ...provisionStocks,
      [resId]: Math.max(0, qty)
    });
  };

  const handleSalvageChange = (resId: number, qty: number) => {
    setSalvagedResources({
      ...salvagedResources,
      [resId]: Math.max(0, qty)
    });
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="border-b border-[#c27c2f]/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase">
            EXPLORACIONES EN LA ZONA MUERTA
          </h2>
          <p className="font-mono text-xs text-[#fca311]/60 uppercase tracking-widest">
            RECLUTAMIENTO, LANZAMIENTOS DE RUTA Y SEGUIMIENTO DE PATRULLAS EXTERIORES
          </p>
        </div>
        
        <button
          onClick={() => {
            setFormError(null);
            setIsNewModalOpen(true);
          }}
          className="bg-[#c27c2f] hover:bg-[#d68b38] text-black text-xs font-bold uppercase py-2 px-4 shadow-[2px_2px_0_#000] border border-black hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ORGANIZAR EXPLORACIÓN
        </button>
      </div>

      {/* FILTER BUTTONS & HUNT SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/40 p-4 border border-[#3b4d3e] rounded">
        {/* State filters */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-wider rounded border cursor-pointer ${
                filterStatus === status 
                  ? 'bg-[#c27c2f] text-black border-black font-semibold' 
                  : 'bg-[#111] border-[#3b4d3e]/60 text-zinc-400 hover:text-[#fca311]'
              }`}
            >
              {status === 'ALL' ? 'VER TODOS' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Searching text */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="BUSCAR RUTA/ZONA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black/50 border border-[#3b4d3e]/70 text-white font-mono text-xs rounded uppercase focus:outline-none focus:border-[#c27c2f]"
          />
        </div>
      </div>

      {/* EXPEDITIONS MAP LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredExplorations.length === 0 ? (
          <div className="col-span-2 text-center py-16 border border-dashed border-zinc-800 rounded">
            <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
            <h4 className="font-typewriter text-sm text-[#ab9e8b] uppercase font-bold">
              SIN REGISTROS DE EXPEDICIÓN EN LA COLA FILTRADA
            </h4>
            <p className="font-mono text-[10px] text-zinc-500 mt-1">
              ASEGURESE DE EXPANDIR SUS FILTROS O CREAR NUEVOS CONVOYES DE SALIDA.
            </p>
          </div>
        ) : (
          filteredExplorations.map((exp) => {
            const isScheduled = exp.status === 'scheduled';
            const isInProgress = exp.status === 'in_progress';
            const isCompleted = exp.status === 'completed';
            const isCancelled = exp.status === 'cancelled';
            
            const leaderName = exp.explorationPersons.find(ep => ep.is_leader)?.person.first_name || 'SIN ASIGNAR';
            const membersList = exp.explorationPersons.map(ep => ep.person.first_name).join(", ");

            return (
              <div 
                key={exp.id} 
                className={`bg-[#9a9080] border border-black relative overflow-hidden text-black transition-transform hover:scale-[1.01] p-5 relative overflow-hidden flex flex-col justify-between ${ isCancelled ? 'opacity-85 filter contrast-75 bg-zinc-400' : '' }`}
                style={{ transform: `rotate(${Math.sin(exp.id) * 0.4}deg)` }}
              >
                {/* STATUS BADGES AND CORNER DESIGN */}
                <div className="flex justify-between items-start border-b border-black/10 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-zinc-800 uppercase block tracking-wider">
                      MISIÓN OPERATIVA #{exp.id}
                    </span>
                    <h3 className="font-typewriter text-md font-bold text-black uppercase tracking-tight mt-0.5">
                      {exp.name}
                    </h3>
                  </div>

                  {/* Aesthetic stamp labels */}
                  <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded uppercase border ${
                    isScheduled ? 'bg-amber-300 text-black border-amber-500' :
                    isInProgress ? 'bg-amber-500 text-black border-black animate-pulse' :
                    isCompleted ? 'bg-[#3b4d3e] text-white border-black' :
                    'bg-red-800 text-white border-black'
                  }`}>
                    {exp.status === 'in_progress' ? 'â— EN CURSO' : exp.status.replace('_', ' ')}
                  </span>
                </div>

                {/* TRIP DESCRIPTION */}
                <div className="space-y-2 mb-4 text-xs font-mono text-zinc-950">
                  <p className="flex items-start gap-1 pb-1">
                    <span className="font-bold shrink-0">DESTINO:</span>
                    <span className="text-zinc-900 uppercase font-medium">{exp.destination_description}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-black/5 p-2 rounded border border-black/10">
                    <div>
                      <span className="text-[9px] block text-zinc-600 font-bold uppercase">FECHA SALIDA</span>
                      <span className="font-bold text-zinc-900">{exp.departure_date.split('T')[0]}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block text-zinc-600 font-bold uppercase">ALERTA RETORNO</span>
                      <span className="font-bold text-zinc-900">
                        {exp.estimated_days} DÍAS (+{exp.grace_days} GRACIA)
                      </span>
                    </div>
                  </div>

                  {/* MEMBERS & PROVISIONS SUMMARY */}
                  <div className="space-y-1">
                    <p className="flex gap-1">
                      <span className="font-bold">LÍDER:</span> 
                      <span className="font-bold text-red-950 uppercase">{leaderName}</span>
                    </p>
                    <p className="flex gap-2">
                      <span className="font-bold">EQUIPO:</span> 
                      <span className="text-zinc-800 uppercase truncate">{membersList}</span>
                    </p>
                    {exp.explorationResources.length > 0 && (
                      <p className="flex gap-1 text-[10px]">
                        <span className="font-bold">EQUIPAMIENTO:</span>
                        <span className="text-zinc-700 italic">
                          {exp.explorationResources.map(er => `${er.quantity} ${er.resource.unit} ${er.resource.name}`).join(', ')}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* REAL RETURN DISCHARGE NOTES IF COMPLETED */}
                  {isCompleted && exp.real_return_date && (
                    <div className="bg-[#4c6351]/25 border border-[#3b4d3e] p-2 rounded text-[11px] text-[#2c3d31] font-mono mt-2">
                      <p className="font-bold">RETORNO EJECUTADO EL: {exp.real_return_date.split('T')[0]}</p>
                      <p className="mt-0.5 italic">NOTAS: "{exp.notes}"</p>
                    </div>
                  )}

                  {exp.notes && !isCompleted && (
                    <p className="text-[10px] text-zinc-700 italic mt-1 font-sans">
                      * Notas: "{exp.notes}"
                    </p>
                  )}
                </div>

                {/* DYNAMIC ACTION BUTTONS */}
                <div className="flex gap-2 border-t border-black/10 pt-3 mt-auto">
                  {isScheduled && (
                    <>
                      <button
                        onClick={() => onDepartExploration(exp.id)}
                        className="flex-1 bg-black text-amber-500 font-typewriter text-xs py-2 px-3 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer border-2 border-zinc-900 shadow-[2px_2px_0_#000]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        PARTIR (RUTA)
                      </button>
                      <button
                        onClick={() => onCancelExploration(exp.id)}
                        className="bg-[#9c2720] hover:bg-red-800 text-white py-1.5 px-3 font-typewriter font-bold text-[10px] uppercase border border-black rounded shadow-[1px_1px_0_#000]"
                        title="CANCELAR PROGRAMADO"
                      >
                        <XSquare className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => {
                        setSelectedExplorationId(exp.id);
                        setIsReturnModalOpen(true);
                        setReturnNotes('');
                      }}
                      className="w-full bg-[#4c6351] text-white hover:bg-[#3b4d3e] font-typewriter text-xs font-bold py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-2 border-black"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-300" />
                      REGISTRAR RETORNO DE EQUIPO
                    </button>
                  )}

                  {(isCompleted || isCancelled) && (
                    <div className="w-full text-center py-1 text-zinc-600 font-typewriter text-[10px] uppercase font-bold tracking-wider">
                      â€” EXPERIMENTADO SIN ACTIVIDAD ADICIONAL â€”
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ORGANIZAR NUEVA EXPLORACIÓN */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-4 border-[#c27c2f] max-w-2xl w-full p-6 text-white text-left font-mono shadow-[0_0_24px_rgba(194,124,47,0.25)] rounded-lg my-8"
            >
              <div className="border-b-2 border-[#c27c2f] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-amber-500 font-bold tracking-widest flex items-center gap-2">
                  <Compass className="w-5 h-5" />
                  CREAR HOJA DE MISIÓN EXCURSIONISTA
                </h3>
                <button 
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg"
                >
                  [X]
                </button>
              </div>

              {formError && (
                <div className="bg-red-950/40 border-l-4 border-red-500 p-3 mb-4 text-red-400 text-xs flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">NOMBRE CLAVED DE LA OPERACIÓN</label>
                    <input
                      type="text"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      placeholder="EJ. BÚSQUEDA DE ANTÍXIDAS EN VALLE GRIS"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      required
                    />
                  </div>
                  {/* Dest */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">DESCRIPCIÓN DEL DESTINO ESTABLECIDO</label>
                    <input
                      type="text"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      placeholder="EJ. HOSPITAL UNIVERSITARIO, PISOS INFERIORES"
                      value={newExpDest}
                      onChange={(e) => setNewExpDest(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Est days */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">DÍAS ESTIMA DE VIAJE</label>
                    <input
                      type="number"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      min={1}
                      max={15}
                      value={newExpESTDays}
                      onChange={(e) => setNewExpESTDays(Number(e.target.value))}
                      required
                    />
                  </div>
                  {/* Grace days */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">DÍAS DE GRACIA ADICIONAL</label>
                    <input
                      type="number"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      min={0}
                      max={7}
                      value={newExpGraceDays}
                      onChange={(e) => setNewExpGraceDays(Number(e.target.value))}
                      required
                    />
                  </div>
                  {/* Date mockup display info */}
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-1 justify-end">
                    <div className="text-[9px] bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 rounded leading-4 uppercase">
                      PARTIDA: <span className="text-white font-bold">INMEDIATA</span>
                    </div>
                  </div>
                </div>

                {/* SELECTOR PERSONAS INTEGRANTES */}
                <div>
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold block mb-2">
                    SELECCIÓN DE CONTRINGENTES DISPONIBLES (PRIMERO SERÁ EL LÍDER)
                  </label>
                  {activePersons.length === 0 ? (
                    <div className="p-3 bg-zinc-900 text-zinc-500 text-center text-xs uppercase border border-dashed border-zinc-800 rounded">
                      — NO HAY DISPONIBILIDAD DE TRABAJADORES SANO EN ESTE MOMENTO —
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-black/40 border border-zinc-900 rounded">
                      {activePersons.map((p) => {
                        const isSelected = selectedPeople.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePersonSelection(p.id)}
                            className={`p-2 rounded border transition-colors cursor-pointer flex justify-between items-center ${
                              isSelected 
                                ? 'bg-amber-950/40 border-amber-500 text-white' 
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className="text-left">
                              <span className="font-bold text-xs block uppercase">
                                {p.first_name} {p.last_name}
                              </span>
                              <span className="text-[9px] block text-zinc-400 uppercase font-mono tracking-widest">
                                {p.profession.name} • XP: {p.experience_points} ({p.expeditionsSurvived} EXT)
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="accent-amber-500 pointer-events-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* EQUIPAMIENTOS REQUERIDOS (PROVISIONES DESDE EL REFUGIO) */}
                <div>
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold block mb-2">
                    SUMINISTROS DE EXPEDICIÓN (CONTRADUCIDOS DE BODEGA)
                  </label>
                  <div className="grid grid-cols-2 gap-4 bg-zinc-900/60 p-3 rounded-md border border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">CANTIDAD COMIDA (RACIONES)</span>
                      <input
                        type="number"
                        min={0}
                        className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors w-full"
                        value={provisionStocks[1] || 0}
                        onChange={(e) => handleProvisionChange(1, Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">CANTIDAD AGUA (LITROS)</span>
                      <input
                        type="number"
                        min={0}
                        className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors w-full"
                        value={provisionStocks[2] || 0}
                        onChange={(e) => handleProvisionChange(2, Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Optional description */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">COMENTARIO EXTRA / INTELIGENCIA OPERATIVA ADICIONAL</label>
                  <textarea
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors h-14 resize-none"
                    placeholder="E.G., NO DETENERSE EN CASO DE NIEBLA SÉPTICA..."
                    value={newExpNotes}
                    onChange={(e) => setNewExpNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-zinc-800 pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 vintage-btn bg-[#3b4d3e] text-white py-2 font-bold cursor-pointer"
                  >
                    {isSubmitting ? 'REGISTRANDO HOJA...' : 'REGISTRAR PLAN EN CENTRAL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="vintage-btn bg-zinc-800 text-zinc-300 py-2 hover:bg-zinc-700 cursor-pointer"
                  >
                    RETORNAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTRAR RETORNO DE LA EXPEDICIÓN CON MATERIALES RESCATADOS */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-4 border-[#4c6351] max-w-lg w-full p-6 text-white font-mono shadow-[0_0_24px_rgba(76,99,81,0.25)] rounded-lg"
            >
              <div className="border-b-2 border-[#4c6351] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-[#4c6351] font-bold tracking-widest flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  HOJA DE REGISTRO DE RETORNO Y EXCLUSIÓN DE ZONA
                </h3>
                <button 
                  onClick={() => setIsReturnModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold"
                >
                  [X]
                </button>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <p className="text-[11px] text-zinc-400 uppercase leading-4 border-b border-zinc-900 pb-2">
                  INDIQUE TODOS LOS ELEMENTOS LOGÍSTICOS RECUPERADOS EN LA ZONA MUERTA POR EL EQUIPO DE COMBATE. ESTAS CANTIDADES SE AÑADIRÁN DINÁMICAMENTE A LA DESPENSA EN EL BÚNKER ALFA.
                </p>

                {/* Dynamic fields inputs for quantities found */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {resources.map((res) => (
                    <div key={res.id} className="flex justify-between items-center p-1.5 bg-zinc-900/60 border border-zinc-800 rounded">
                      <div className="text-left pl-1">
                        <span className="text-xs font-bold uppercase block text-white">{res.name}</span>
                        <span className="text-[9px] block text-zinc-500 font-mono">UNIDAD DE MEDIDA: {res.unit}</span>
                      </div>
                      <div className="w-28 flex items-center gap-1.5">
                        <input
                          type="number"
                          className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors text-right w-full"
                          min={0}
                          value={salvagedResources[res.id] || 0}
                          onChange={(e) => handleSalvageChange(res.id, Number(e.target.value))}
                        />
                        <span className="text-[10px] text-zinc-400">{res.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Return comments notes input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">INFORME DEL LÍDER DE OPERACIÓN EN RETORNO</label>
                  <textarea
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors h-14 resize-none"
                    placeholder="EJ. EXPEDICIÓN ALTAMENTE RENTABLE. ENCONTRAMOS BOTELLAS SELLADAS EN BASE DAWNTECH..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-zinc-900 pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#4c6351] hover:bg-[#3b4d3e] text-white py-1.5 px-3 font-typewriter font-bold text-[10px] uppercase border border-black rounded shadow-[1px_1px_0_#000]"
                  >
                    {isSubmitting ? 'INVENTARIANDO...' : 'REGISTRAR INGRESO EN ALMACÉN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="vintage-btn bg-zinc-800 text-zinc-300 py-2 hover:bg-zinc-700 cursor-pointer"
                  >
                    RETORNAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
