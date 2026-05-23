// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transfer, TransferStatus, Camp, ResourceItem, Inventory } from '../types';
import { 
  Truck, 
  Plus, 
  Check, 
  X, 
  ArrowRight, 
  Play, 
  MapPin, 
  Package, 
  FileText, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface TransfersViewProps {
  transfers: Transfer[];
  camps: Camp[];
  resources: ResourceItem[];
  inventory: Inventory[];
  myCampId: number;
  onCreateTransferRequest: (data: any) => Promise<void>;
  onApproveTransferRequest: (id: number, approved: boolean) => Promise<void>;
  onCancelTransferRequest: (id: number) => Promise<void>;
  onArriveTransferRequest: (id: number) => Promise<void>;
}

export default function TransfersView({
  transfers,
  camps,
  resources,
  inventory,
  myCampId,
  onCreateTransferRequest,
  onApproveTransferRequest,
  onCancelTransferRequest,
  onArriveTransferRequest
}: TransfersViewProps) {
  const [filterRole, setFilterRole] = useState<'ALL' | 'origin' | 'destination'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TransferStatus | 'ALL'>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Request Form Fields
  const [targetCampId, setTargetCampId] = useState<number>(2);
  const [direction, setDirection] = useState<'import' | 'export'>('import'); // import = destination is us, export = origin is us
  const [selectedResourceId, setSelectedResourceId] = useState<number>(1);
  const [requestQty, setRequestQty] = useState<number>(50);
  const [notes, setNotes] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters logic
  const filteredTransfers = transfers.filter(t => {
    // Role filter
    const isOrigin = t.origin_camp_id === myCampId;
    const isDest = t.destination_camp_id === myCampId;
    const matchRole = filterRole === 'ALL' || 
                      (filterRole === 'origin' && isOrigin) || 
                      (filterRole === 'destination' && isDest);

    // Status filter
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;

    return matchRole && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (requestQty <= 0) {
      setFormError("LA CANTIDAD SOLICITADA DEBE SER MAYOR A CERO.");
      return;
    }

    // Set origin and destination ids based on direction
    const origin_camp_id = direction === 'import' ? targetCampId : myCampId;
    const destination_camp_id = direction === 'import' ? myCampId : targetCampId;

    if (origin_camp_id === destination_camp_id) {
      setFormError("LOS CAMPAMENTOS NO PUEDEN SER IDÉNTICOS.");
      return;
    }

    // If exporting, check that our camp (origin) actually has the needed inventory!
    if (direction === 'export') {
      const dbInv = inventory.find(i => i.resource_id === selectedResourceId);
      if (!dbInv || dbInv.current_quantity < requestQty) {
        setFormError(`NIVELES DE STOCK INSUFICIENTES PARA AUTORIZAR EL ENVÍO (${dbInv?.current_quantity || 0} DISPONIBLES).`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onCreateTransferRequest({
        origin_camp_id,
        destination_camp_id,
        resource_id: selectedResourceId,
        quantity: requestQty,
        notes,
        requested_by_user_id: 77 // Simulated commander ID
      });

      // Clear Form and Close
      setRequestQty(50);
      setNotes('');
      setIsNewModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "FALLO EN EL REGISTRO DE TRASLADO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* PAGE HEADER */}
      <div className="border-b border-[#c27c2f]/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-typewriter text-2xl font-bold tracking-wider text-[#fca311] uppercase">
            TRASLADOS INTER-CAMPAMENTOS
          </h2>
          <p className="font-mono text-xs text-[#fca311]/60 uppercase tracking-widest">
            REGISTRO DE CONVOYES DE ABASTECIMIENTO ENTRE BASES REHABILITADAS
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
          SOLICITAR TRASLADO
        </button>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-black/40 p-4 border border-[#3b4d3e] rounded">
        {/* Toggle Role */}
        <div className="flex bg-[#111111] p-1 rounded border border-[#3b4d3e]/40">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1 font-mono text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer ${
              filterRole === 'ALL' ? 'bg-[#c27c2f] text-black font-semibold' : 'text-zinc-400 hover:text-[#fca311]'
            }`}
          >
            TODOS LOS CONVOYES
          </button>
          <button
            onClick={() => setFilterRole('origin')}
            className={`px-3 py-1 font-mono text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer ${
              filterRole === 'origin' ? 'bg-[#3b4d3e] text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            NUESTRA BASE ENVÍA (ORIGEN)
          </button>
          <button
            onClick={() => setFilterRole('destination')}
            className={`px-3 py-1 font-mono text-[9px] uppercase font-bold tracking-wider rounded cursor-pointer ${
              filterRole === 'destination' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            NUESTRA BASE RECIBE (DESTINO)
          </button>
        </div>

        {/* State status dropdown & filters */}
        <div className="flex flex-wrap gap-1.5 self-center">
          {['ALL', 'pending', 'approved', 'in_transit', 'completed', 'rejected', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st as any)}
              className={`px-2.5 py-1 font-mono text-[9px] uppercase rounded border cursor-pointer ${
                filterStatus === st 
                  ? 'bg-[#c27c2f] text-black border-black font-semibold' 
                  : 'bg-[#111] border-[#3b4d3e]/60 text-zinc-400 hover:text-[#fca311]'
              }`}
            >
              {st === 'ALL' ? 'VER TODOS ESTADOS' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSFERS CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransfers.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed border-zinc-800 rounded bg-black/10">
            <Truck className="w-12 h-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
            <span className="font-typewriter text-xs text-[#ab9e8b] uppercase block font-bold">
              SIN CONVOYES EN LA COLA SECCIONAL FILTRADA
            </span>
            <p className="font-mono text-[10px] text-zinc-500 mt-1 uppercase">
              SELECCIONES OTRO FILTRO O COMIENCE A ENVIAR CARGAMENTO DE RE-ESTOCADO.
            </p>
          </div>
        ) : (
          filteredTransfers.map((t) => {
            const isOriginUs = t.origin_camp_id === myCampId;
            const resItem = resources.find(r => r.id === t.resource_id);

            // Origin camp name search list
            const originCampName = camps.find(c => c.id === t.origin_camp_id)?.name || "CAMP DESCONOCIDO";
            const destCampName = camps.find(c => c.id === t.destination_camp_id)?.name || "CAMP DESCONOCIDO";

            return (
              <div 
                key={t.id} 
                className="bg-[#9a9080] border border-black relative overflow-hidden text-black transition-transform hover:scale-[1.01] p-5 relative overflow-hidden flex flex-col justify-between"
                style={{ transform: `rotate(${Math.cos(t.id) * 0.3}deg)` }}
              >
                {/* Header info card */}
                <div className="border-b border-black/10 pb-3 mb-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] font-bold text-zinc-700 block uppercase tracking-wider">
                      TRASLADO REG. ID: #{t.id}
                    </span>
                    <span className={`px-2 py-0.5 font-mono text-[8px] font-bold rounded uppercase border ${
                      t.status === 'pending' ? 'bg-amber-200 text-amber-900 border-amber-600 animate-pulse' :
                      t.status === 'in_transit' ? 'bg-amber-500 text-black border-black animate-pulse' :
                      t.status === 'completed' ? 'bg-[#3b4d3e] text-white border-black' :
                      'bg-red-800 text-white border-black'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* ROUTING DESCRIPTION STAMPS */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="bg-black/8 w-full p-1.5 rounded border border-black/5 text-[10px] font-mono flex items-center justify-between">
                      <div className="truncate text-left w-1/3 text-zinc-850 font-bold" title={originCampName}>
                        {isOriginUs ? "NUESTRO BÚNKER" : originCampName.substring(0, 15) + "..."}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      <div className="truncate text-right w-1/3 text-zinc-850 font-bold" title={destCampName}>
                        {!isOriginUs ? "NUESTRO BÚNKER" : destCampName.substring(0, 15) + "..."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MATERIALS DETAIL ROWS */}
                <div className="space-y-2.5 mb-4 text-xs font-mono text-zinc-950">
                  <div className="flex justify-between items-center pb-1 border-b border-black/5">
                    <span className="text-zinc-600 font-bold uppercase">RECURSO CARGADO:</span>
                    <span className="font-bold uppercase text-black">{resItem?.name || t.resource?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 font-bold uppercase">CANTIDAD DISPUESTA:</span>
                    <span className="font-typewriter text-sm font-bold text-amber-800">
                      {t.quantity} / {resItem?.unit || t.resource?.unit}
                    </span>
                  </div>

                  {t.notes && (
                    <p className="text-[10px] text-zinc-700 italic border-t border-black/5 pt-1.5 font-sans">
                      * Notas: "{t.notes}"
                    </p>
                  )}
                </div>

                {/* DYNAMIC ACTION SWITCHES */}
                <div className="border-t border-black/10 pt-3 mt-auto">
                  {/* Scenario A: Pending Transfer and we are Destination. Destination approval check! */}
                  {t.status === 'pending' && !isOriginUs && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApproveTransferRequest(t.id, true)}
                        className="flex-1 bg-[#4c6351] text-white py-1.5 px-2 hover:bg-[#3b4d3e] cursor-pointer text-[10px] font-typewriter font-bold uppercase border-2 border-black"
                      >
                        [APROBAR ENVIÓ]
                      </button>
                      <button
                        onClick={() => onApproveTransferRequest(t.id, false)}
                        className="bg-red-800 hover:bg-red-700 text-white p-1.5 cursor-pointer border-2 border-black"
                        title="RECHAZAR SOLICITUD"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Scenario B: Pending and we are Origin. We can cancel our requested transit! */}
                  {t.status === 'pending' && isOriginUs && (
                    <button
                      onClick={() => onCancelTransferRequest(t.id)}
                      className="w-full bg-red-800 hover:bg-red-700 text-white font-typewriter text-[10px] py-1.5 px-2 border-2 border-black cursor-pointer uppercase"
                    >
                      [CANCELAR SOLICITUD]
                    </button>
                  )}

                  {/* Scenario C: Outgoing transit, destination camp confirms receipt! */}
                  {(t.status === 'in_transit' || t.status === 'approved') && !isOriginUs && (
                    <button
                      onClick={() => onArriveTransferRequest(t.id)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-typewriter text-xs font-bold py-2 px-3 border-2 border-black cursor-pointer flex items-center justify-center gap-1 uppercase"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      CONFIRMAR LLEGADA DOCKS ALFA
                    </button>
                  )}

                  {/* Scenario D: In transit and we are origin. Waiting for delivery! */}
                  {(t.status === 'in_transit' || t.status === 'approved') && isOriginUs && (
                    <div className="text-center py-1 bg-amber-950/20 text-[#8f581e] font-typewriter text-[9px] uppercase font-bold tracking-wider rounded border border-[#8f581e]/40">
                      â— CONVOY DIRECCIÓN SUR EN RUTA EXCLUSIÓN
                    </div>
                  )}

                  {/* Scenario E: Suministros Completados */}
                  {t.status === 'completed' && (
                    <div className="text-center text-zinc-500 font-typewriter text-[10px] uppercase font-bold tracking-widest py-1 border border-zinc-500/10 rounded">
                      ENTREGADO RESPALDADO EN ARCHIVO
                    </div>
                  )}

                  {t.status === 'rejected' && (
                    <div className="text-center text-red-900 bg-red-500/10 font-typewriter text-[9px] uppercase font-bold text-xs tracking-wider border border-red-500/20 rounded py-1">
                      TRASLADO RECHAZADO POR CENTRAL
                    </div>
                  )}

                  {t.status === 'cancelled' && (
                    <div className="text-center text-zinc-500 font-typewriter text-[10px] uppercase font-bold tracking-wider py-1">
                      CONVOY CANCELADO / REINTEGRADO
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: SOLICITAR NUEVA TRANSFERENCIA INTER-CAMPAMENTO */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-4 border-[#c27c2f] max-w-md w-full p-6 text-white text-left font-mono shadow-[0_0_24px_rgba(194,124,47,0.25)] rounded-lg"
            >
              <div className="border-b-2 border-[#c27c2f] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-amber-500 font-bold tracking-widest flex items-center gap-2">
                  <Truck className="w-5 h-5 animate-bounce" />
                  CREAR HOJA DE TRASLADO PENDIENTE
                </h3>
                <button 
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold"
                >
                  [X]
                </button>
              </div>

              {formError && (
                <div className="bg-red-950/40 border-l-4 border-red-500 p-3 mb-4 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Target Camp Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">VÍNCULO COOPERANTE CAMPAMENTAL</label>
                  <select
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                    value={targetCampId}
                    onChange={(e) => setTargetCampId(Number(e.target.value))}
                  >
                    {camps.filter(c => c.id !== myCampId).map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-950 text-white font-mono uppercase text-xs">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Import Direction or Export Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">TIPO DE OPERACIÓN SOLICITADA</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setDirection('import')}
                      className={`p-2 font-mono text-xs uppercase font-bold border rounded transition-colors ${
                        direction === 'import' 
                          ? 'bg-amber-500 text-black border-black' 
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-750'
                      }`}
                    >
                      SOLICITAR ENVÍO (IMPORTACIÓN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('export')}
                      className={`p-2 font-mono text-xs uppercase font-bold border rounded transition-colors ${
                        direction === 'export' 
                          ? 'bg-amber-500 text-black border-black' 
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-750'
                      }`}
                    >
                      REGISTRAR SUMINISTRO (EXPORTACIÓN)
                    </button>
                  </div>
                  <span className="text-[9px] text-[#ab9e8b]/70 block leading-3 mt-1 font-sans">
                    {direction === 'import' 
                      ? "* Solicita que el campamento seleccionado nos envíe un convoy." 
                      : "* Suministramos desde el Refugio Alfa al campamento destino."}
                  </span>
                </div>

                {/* Resource Item Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">RECURSO</label>
                    <select
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      value={selectedResourceId}
                      onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                    >
                      {resources.map((res) => (
                        <option key={res.id} value={res.id} className="bg-zinc-950 text-white font-mono uppercase text-xs">
                          {res.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">CANTIDAD DISPUESTA</label>
                    <input
                      type="number"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      min={10}
                      max={1000}
                      step={10}
                      value={requestQty}
                      onChange={(e) => setRequestQty(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Custom warning description helper if exporting */}
                {direction === 'export' && (
                  <div className="p-2 bg-yellow-950/25 border border-yellow-500/30 text-[9.5px] text-yellow-400 rounded leading-3.5">
                    RECUERDE QUE LAS UNIDADES SE DESCONTARÁN DE NUESTRO ALMACÉN AL APROBAR O DESPACHAR EL EMBARQUE.
                  </div>
                )}

                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#ab9e8b] uppercase font-bold">MENSAJE DEL CANAL / NOTAS ADICIONALES</label>
                  <textarea
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors h-14 resize-none"
                    placeholder="MOTIVOS DE SUMINISTRO O DESTRUCCIÓN..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-zinc-900 pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#c27c2f] hover:bg-[#d68b38] text-black text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-sm"
                  >
                    {isSubmitting ? 'REGISTRANDO OPERACIÓN...' : 'MEMORIZAR TRASLADO'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="bg-[#9a9080] hover:bg-[#ab9e8b] text-black text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-sm"
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
