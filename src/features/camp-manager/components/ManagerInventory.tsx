/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { InventoryItem } from '../types/api.types';
import { Sliders, ShieldAlert, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManagerInventoryProps {
  campId: string;
  onDataChanged: () => void;
  refreshTrigger: number;
}

export default function ManagerInventory({ campId, onDataChanged, refreshTrigger }: ManagerInventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newMinStock, setNewMinStock] = useState<number>(0);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);

  // Daily Process Confirmation Modal State
  const [showConfirmDaily, setShowConfirmDaily] = useState<boolean>(false);
  const [dailyProcessing, setDailyProcessing] = useState<boolean>(false);
  const [dailyResponse, setDailyResponse] = useState<any>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/resources/inventory/${campId}`);
      setInventory(res.data);
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con los sensores de la bodega.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [campId, refreshTrigger]);

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setNewMinStock(item.minimum_stock_required);
  };

  const handleSaveMinStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (newMinStock < 0) {
      setError('El umbral de reserva mínimo no puede ser negativo.');
      return;
    }

    setSubmittingEdit(true);
    setError(null);
    try {
      await api.patch(`/resources/inventory/${campId}/${editingItem.id}`, {
        minimum_stock_required: newMinStock
      });
      setEditingItem(null);
      fetchInventory();
      onDataChanged(); // Refresh statistics and balance
    } catch (err: any) {
      setError(err?.message || 'Fallo de escritura en memoria del circuito.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleForceDailyProcess = async () => {
    setDailyProcessing(true);
    setError(null);
    try {
      const res = await api.post(`/resources/daily-process/${campId}`);
      setDailyResponse(res.data);
      fetchInventory();
      onDataChanged();
      // Auto close confirmation after showing result briefly
      setTimeout(() => {
        setShowConfirmDaily(false);
        setDailyResponse(null);
      }, 4000);
    } catch (err: any) {
      setError(err?.message || 'Error grave al interrumpir ciclo del generador.');
    } finally {
      setDailyProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-[#c27c2f]">
        <RefreshCw className="h-10 w-10 animate-spin mb-4" />
        <span className="animate-pulse text-sm">ESCANEANDO BODEGAS SUBTERRÁNEAS...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* ACTION HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1a1a1a] border-2 border-black p-4 font-mono">
        <div>
          <h3 className="text-sm font-bold text-[#c27c2f] uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-[#c27c2f]" /> CONTROL_FÍSICO_DE_LA_BODEGA_CENTRAL
          </h3>
          <p className="text-xs text-zinc-400 mt-1 uppercase">
            Modifica las raciones en reserva o ejecuta el procesamiento del ciclo solar.
          </p>
        </div>
        
        {/* FORCE CLOSURE OF THE DAY: RED, SPECIAL STYLES */}
        <button
          type="button"
          onClick={() => setShowConfirmDaily(true)}
          className="border-2 border-black bg-[#9c2720] hover:bg-red-800 text-white font-extrabold uppercase text-xs px-5 py-2.5 tracking-wider transition-all select-none shadow-[inset_0_0_10px_rgba(0,0,0,0.4)]"
        >
          ⚡ FORZAR CIERRE DE DÍA
        </button>
      </div>

      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-200 font-mono text-xs p-3.5 flex items-start gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">FALLO PROTOCOLO:</span> {error}
          </div>
        </div>
      )}

      {/* CONSOLE STYLE TABLE */}
      <div className="overflow-hidden border-2 border-black bg-[#161513]">
        <table className="table-auto w-full border-collapse font-mono text-xs">
          <thead className="bg-[#121110] text-[#c27c2f] border-b border-black text-left uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2.5 border-r border-black font-bold">RESOURCE_NAME / CATEGORY</th>
              <th className="p-2.5 border-r border-black font-bold">CURRENT_STOCK</th>
              <th className="p-2.5 border-r border-black font-bold">MINIMUM_CRITICAL_STOCK</th>
              <th className="p-2.5 border-r border-black font-bold text-center">SAFETY_STATUS</th>
              <th className="p-2.5 text-center font-bold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-[#e0d8cc] tracking-wide">
            {inventory.map((item) => {
              const warningStyle = item.is_below_minimum 
                ? 'bg-[#2a1111] text-[#e0d8cc] border-b border-black' 
                : 'border-b border-black hover:bg-[#2a2824]/40';

              return (
                <tr key={item.id} className={`${warningStyle} transition-colors`}>
                  <td className="p-2.5 border-r border-black font-bold">
                    <div>{item.name.toUpperCase()}</div>
                    <div className="text-[9px] text-zinc-500 font-normal uppercase mt-0.5">
                      CODE: {item.category.toUpperCase()}
                    </div>
                  </td>
                  <td className="p-2.5 border-r border-black font-mono font-black text-xs md:text-sm">
                    {item.current_stock} <span className="text-[10px] font-normal text-zinc-500">{item.unit.toUpperCase()}</span>
                  </td>
                  <td className="p-2.5 border-r border-black font-mono">
                    {item.minimum_stock_required} {item.unit.toUpperCase()}
                  </td>
                  <td className="p-2.5 border-r border-black text-center uppercase font-mono font-bold">
                    {item.is_below_minimum ? (
                      <span className="text-[#9c2720] font-black tracking-widest animate-pulse">
                        [CRITICAL_LOW]
                      </span>
                    ) : (
                      <span className="text-emerald-500 tracking-wider">
                        SECURE
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      className="underline cursor-pointer hover:text-white text-[10px] font-bold uppercase transition"
                    >
                      [EDIT_MIN]
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT MINIMUM_STOCK_REQUIRED */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#161513] border-4 border-double border-[#c27c2f] p-6 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#c27c2f]">
              <Sliders className="h-5 w-5" />
              <h4 className="font-bold uppercase tracking-widest text-xs">REDIMENSIONAR RESERVA MÍNIMA</h4>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed uppercase">
              Establece el umbral mínimo necesario para el recurso <span className="font-bold text-[#e0d8cc]">{editingItem.name.toUpperCase()}</span>. 
              Si el stock cae por debajo de este límite, el sistema central emitirá una alerta de defensa pasiva.
            </p>

            <form onSubmit={handleSaveMinStock} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">
                  CANTIDAD_RESERVA_EXIGIDA ({editingItem.unit.toUpperCase()}):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-sm font-bold font-mono transition"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 border-2 border-black bg-[#c27c2f] text-[#161513] uppercase text-xs py-2 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                >
                  {submittingEdit ? 'ACTUALIZANDO...' : 'GUARDAR LÍMITES'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CONFIRMATION DAILY PROCESS MODAL: MANDATORY CONFIRMATION */}
      {showConfirmDaily && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#161513] border-4 border-double border-[#9c2720] p-6 font-mono text-[#e0d8cc] shadow-2xl relative"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#9c2720]">
              <ShieldAlert className="h-5.5 w-5.5 animate-bounce" />
              <h4 className="font-bold uppercase tracking-widest text-xs">AUTORIZACIÓN CRÍTICA DE CIERRE SOLAR</h4>
            </div>

            {dailyResponse ? (
              <div className="space-y-4 py-2">
                <div className="bg-[#9c2720]/20 border-l-4 border-[#9c2720] p-3.5 text-xs text-red-300 space-y-1">
                  <div className="font-bold uppercase tracking-wider">{dailyResponse.message.toUpperCase()}</div>
                  <p className="uppercase">Consumos y producciones calculadas y consolidadas en base de datos.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] bg-[#1a1a1a] border-2 border-black p-3 text-zinc-300">
                  <div>🍔 COMIDA PRODUCIDA: <span className="font-bold text-emerald-400">+{dailyResponse.metrics.foodProduced}</span></div>
                  <div>👥 COMIDA CONSUMIDA: <span className="font-bold text-[#9c2720]">-{dailyResponse.metrics.foodConsumed}</span></div>
                  <div>💧 AGUA PRODUCIDA: <span className="font-bold text-emerald-400">+{dailyResponse.metrics.waterProduced}</span></div>
                  <div>🏃‍♂️ AGUA CONSUMIDA: <span className="font-bold text-[#9c2720]">-{dailyResponse.metrics.waterConsumed}</span></div>
                </div>
                <p className="text-[9px] text-zinc-500 text-center animate-pulse uppercase tracking-widest font-bold">
                  RECONSOLIDANDO STOCK... CERRANDO CONEXIÓN.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 uppercase">
                  ¡ATENCIÓN ADMINISTRADOR! Estás a punto de forzar el <span className="text-[#9c2720] font-bold">Cierre del Ciclo Solar</span>. 
                  Esto ejecutará el consumo biológico diario de toda la fuerza de trabajo habitando el búnker, 
                  recolectará las cosechas hidropónicas agrícolas y quemará combustible diésel para los generadores de oxígeno.
                </p>

                <div className="bg-[#1a1a1a] border border-black p-3.5 mb-4 text-left text-[11px] space-y-1.5 text-zinc-400">
                  <span className="text-[10px] text-[#c27c2f] font-bold block uppercase tracking-wider">MÁRGENES OPERACIONALES:</span>
                  <div>• Consumo Base Comida MRE: <span className="text-red-400">Comensales x factor de salud (1.0 - 1.5x)</span></div>
                  <div>• Consumo Base Agua Filtrada: <span className="text-red-400">Habitantes x factor de salud (1.0 - 1.5x)</span></div>
                  <div>• Consumo Diésel Generadores: <span className="text-red-500">-15 Bidones por ciclo</span></div>
                  <div>• Cosecha Hidropónica Activa: <span className="text-emerald-400">Basado en Granjeros activos</span></div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDaily(false)}
                    disabled={dailyProcessing}
                    className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
                  >
                    [ABORTAR SECUENCIA]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleForceDailyProcess()}
                    disabled={dailyProcessing}
                    className="flex-1 border-2 border-black bg-[#9c2720] hover:bg-red-800 text-white uppercase text-xs py-2 font-black transition flex items-center justify-center gap-2"
                  >
                    {dailyProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> PROCESANDO...
                      </>
                    ) : (
                      'EJECUTAR CONSUMOS (CIERRE)'
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
