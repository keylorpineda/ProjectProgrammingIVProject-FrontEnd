/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { IntercampRequest } from '../types/api.types';
import { Truck, ShieldAlert, Plus, RefreshCw, Archive, Mail, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManagerLogisticsProps {
  campId: string;
  onDataChanged: () => void;
  refreshTrigger: number;
}

export default function ManagerLogistics({ campId, onDataChanged, refreshTrigger }: ManagerLogisticsProps) {
  const [requests, setRequests] = useState<IntercampRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Request Modal state
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<string>('Raciones de Emergencia (MRE)');
  const [requestAmount, setRequestAmount] = useState<number>(50);
  const [sourceBunker, setSourceBunker] = useState<string>('Bunker-Alpha');
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);

  // Action Loading state
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/transfers/requests/camp/${campId}`);
      setRequests(res.data);
    } catch (err: any) {
      setError(err?.message || 'Error al descargar bitácora de transferencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [campId, refreshTrigger]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestAmount <= 0) {
      setError('Especifique una cantidad de carga superior a cero.');
      return;
    }

    setSubmittingRequest(true);
    setError(null);
    try {
      await api.post('/transfers/requests', {
        resource_type: selectedResource,
        amount: Number(requestAmount),
        camp_source_id: sourceBunker,
        camp_destination_id: campId,
        notes: requestNotes
      });
      setShowRequestModal(false);
      setRequestNotes('');
      fetchRequests();
      onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Fallo de enlace de solicitud.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleApproval = async (id: string, status: 'approved' | 'denied') => {
    setActionId(id);
    setError(null);
    try {
      await api.patch(`/transfers/requests/${id}/approval`, { status });
      fetchRequests();
      onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Fallo de respuesta de satélite.');
    } finally {
      setActionId(null);
    }
  };

  const handleArrive = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await api.patch(`/transfers/requests/${id}/arrive`);
      fetchRequests();
      onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Error de descarga física del flete.');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-[#c27c2f]">
        <RefreshCw className="h-10 w-10 animate-spin mb-4" />
        <span className="animate-pulse text-sm">ENLAZANDO CONVOYES Y CANALES LOGÍSTICOS...</span>
      </div>
    );
  }

  // Filter requests to show incoming (to us) and outgoing (from us)
  const incomingRequests = requests.filter(r => r.camp_destination_id === campId);
  const outgoingRequests = requests.filter(r => r.camp_source_id === campId);

  const resourceTypes = [
    'Raciones de Emergencia (MRE)',
    'Agua Purificada de Filtro',
    'Antitoxinas y Antibióticos',
    'Munición Calibre 5.56mm',
    'Combustible Diésel (Generador)',
    'Acero de Refuerzo Bunker'
  ];

  const bunkerList = ['Bunker-Alpha', 'Bunker-Beta', 'Bunker-Delta', 'Bunker-Gamma'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* LOGISTICAL ACTION PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1a1a1a] border-2 border-black p-4 font-mono">
        <div>
          <h3 className="text-sm font-bold text-[#c27c2f] uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4.5 w-4.5 text-[#c27c2f]" /> PROTOCOLO_LOGÍSTICA_DE_SUMINISTROS
          </h3>
          <p className="text-xs text-zinc-400 mt-1 uppercase">
            Aprueba reabastecimientos entrantes o despacha transportes blindados solicitando refuerzos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRequestModal(true)}
          className="border-2 border-black bg-[#c27c2f] hover:bg-white text-[#161513] font-black uppercase text-xs px-4 py-2 hover:text-black transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> PEDIR_REFUERZO
        </button>
      </div>

      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-150 font-mono text-xs p-3.5 flex items-start gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">ORDEN LOGÍSTICA RECHAZADA:</span> {error}
          </div>
        </div>
      )}

      {/* TWO SECTIONS: INCOMING INBOX & OUTGOING HISTORY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* SECTION A: INCOMING EXPEDITIONS (CARGOS TO US) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2 text-[#c27c2f] font-mono">
            <Mail className="h-4 w-4" />
            <h4 className="font-black text-[10px] uppercase tracking-wider">EXPEDICIONES_Y_CARGAS_ENTRANTES ({incomingRequests.length})</h4>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="font-mono text-xs text-zinc-500 py-8 text-center uppercase border-2 border-black bg-[#161513]">
              INBOX_SEGURO: No hay tránsitos pendientes de ingreso.
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => {
                let statusBadge = '';
                let borderTheme = 'border-2 border-black bg-[#131211]';
                
                if (req.status === 'pending') {
                  statusBadge = 'bg-[#c27c2f]/20 text-[#c27c2f] border border-[#c27c2f]/30';
                  borderTheme = 'border-2 border-black bg-[#1e1c19]';
                } else if (req.status === 'approved') {
                  statusBadge = 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/30';
                  borderTheme = 'border-2 border-black bg-[#141b17]';
                } else if (req.status === 'denied') {
                  statusBadge = 'bg-red-950 text-red-400 border border-red-900/40';
                  borderTheme = 'border-2 border-black bg-[#1a1212]';
                } else if (req.status === 'arrived') {
                  statusBadge = 'bg-zinc-800 text-zinc-400';
                  borderTheme = 'border-2 border-black bg-zinc-900/30 opacity-70';
                }

                return (
                  <div key={req.id} className={`p-4 border-2 font-mono transition-shadow ${borderTheme}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase font-black">REMITENTE: {req.camp_source_id.toUpperCase()}</div>
                        <h5 className="font-bold text-[#e0d8cc] mt-0.5 text-xs text-[#c27c2f]">{req.resource_type.toUpperCase()}</h5>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${statusBadge}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between items-end border-t border-black pt-2 text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">PESO DE CARGA:</span>
                        <span className="font-black text-sm text-[#e0d8cc]">{req.amount} uds</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">FECHA SATELLITE:</span>
                        <span className="text-[10px] text-zinc-400">{new Date(req.requested_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="mt-3 text-[10px] italic text-zinc-450 border-l border-[#c27c2f] pl-2 uppercase">
                        "{req.notes}"
                      </p>
                    )}

                    {/* INTERACTIVE ACTIONS */}
                    <div className="mt-4 flex gap-2 justify-end">
                      {req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, 'denied')}
                            className="border-2 border-black bg-[#4a1210]/20 hover:bg-[#9c2720] text-red-400 hover:text-white px-3 py-1.5 uppercase text-[10px] font-black transition"
                          >
                            [RECHAZAR]
                          </button>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, 'approved')}
                            className="border-2 border-black bg-[#c27c2f] text-[#161513] hover:bg-white hover:text-black px-3 py-1.5 uppercase text-[10px] font-black transition"
                          >
                            [AUTORIZAR]
                          </button>
                        </>
                      )}

                      {req.status === 'approved' && (
                        <button
                          type="button"
                          disabled={actionId !== null}
                          onClick={() => handleArrive(req.id)}
                          className="w-full border-2 border-black bg-emerald-600 text-[#161513] hover:bg-white hover:text-black py-2.5 uppercase text-xs font-black tracking-widest transition flex items-center justify-center gap-1.5"
                        >
                          <Archive className="h-4 w-4" /> REGISTRAR LLEGADA FÍSICA Y TRANSBORDO
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION B: OUTGOING TRANSFERS (CARGOS TO OTHER CAMPS) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2 text-[#c27c2f] font-mono">
            <Send className="h-4 w-4" />
            <h4 className="font-black text-[10px] uppercase tracking-wider">HISTORIAL_DESPACHOS_SALIENTES ({outgoingRequests.length})</h4>
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="font-mono text-xs text-zinc-500 py-8 text-center uppercase border-2 border-black bg-[#161513]">
              NINGÚN DESPACHO REGISTRADO DESDE LA BODEGA ACTIVA.
            </div>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((req) => (
                <div key={req.id} className="p-4 border-2 border-black bg-zinc-950/40 font-mono opacity-80">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase font-black">COOPERATIVO DESTINO: {req.camp_destination_id.toUpperCase()}</div>
                      <h5 className="font-black text-[#e0d8cc] mt-0.5 text-xs uppercase">{req.resource_type}</h5>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border border-black bg-zinc-800 text-zinc-400">
                      STATUS: {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between items-end border-t border-black pt-2 text-[10px] text-zinc-400">
                    <div>
                      <span>PESO ENVIADO:</span>
                      <span className="font-black block text-zinc-200 text-sm">{req.amount} uds</span>
                    </div>
                    <div className="text-right">
                      <span>DESPACHO SOLAR:</span>
                      <span className="block font-black">{new Date(req.requested_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* NEW REQUEST MODAL (POST /transfers/requests) */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#161513] border-4 border-double border-[#c27c2f] p-6 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#c27c2f]">
              <Truck className="h-5 w-5 animate-pulse text-[#c27c2f]" />
              <h4 className="font-bold uppercase tracking-widest text-xs">SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA</h4>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">
                  BÚNKER_DE_SUMINISTRO_ORIGEN:
                </label>
                <select
                  value={sourceBunker}
                  onChange={(e) => setSourceBunker(e.target.value)}
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-xs font-bold font-mono transition uppercase text-[#e0d8cc]"
                >
                  {bunkerList.map(b => (
                    <option key={b} value={b} className="bg-[#161513] text-[#e0d8cc]">{b.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">
                  RECURSO_BODEGA_SOLICITADO:
                </label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-xs font-bold font-mono transition uppercase text-[#e0d8cc]"
                >
                  {resourceTypes.map(r => (
                    <option key={r} value={r} className="bg-[#161513] text-[#e0d8cc]">{r.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">
                  CANTIDAD_CARGA_PEDIDA:
                </label>
                <input
                  type="number"
                  min="1"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-xs font-bold font-mono transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">
                  MOTIVACIONES / JUSTIFICANTE LOGÍSTICO:
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={2}
                  placeholder="JUSTIFIQUE EL PROTOCOLO DE TRASLADO MRE..."
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-xs font-bold font-mono transition uppercase placeholder-zinc-650"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 border-2 border-black bg-[#c27c2f] text-[#161513] uppercase text-xs py-2 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                >
                  {submittingRequest ? 'EMITIENDO...' : 'FIRMAR ORDEN'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
