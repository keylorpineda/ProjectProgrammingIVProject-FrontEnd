/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { api } from '../config/api';
import { CampBalance, TransferStatistics } from '../types/api.types';
import { ShieldAlert, Activity, RefreshCw, Truck, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManagerOverviewProps {
  campId: string;
  refreshTrigger: number;
}

export default function ManagerOverview({ campId, refreshTrigger }: ManagerOverviewProps) {
  const [balance, setBalance] = useState<CampBalance | null>(null);
  const [stats, setStats] = useState<TransferStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceRes, statsRes] = await Promise.all([
        api.get(`/users/camp/${campId}/balance`),
        api.get(`/transfers/statistics/${campId}`)
      ]);
      setBalance(balanceRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err?.message || 'Error en telemetría de satélite de enlace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [campId, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-[#c27c2f]">
        <RefreshCw className="h-10 w-10 animate-spin mb-4" />
        <span className="animate-pulse text-sm">DECRYPTING ENCRYPTED WAVEFORMS...</span>
      </div>
    );
  }

  if (error || !balance || !stats) {
    return (
      <div className="border border-[#9c2720] bg-[#9c2720]/10 p-6 rounded font-mono text-[#e0d8cc] my-4">
        <h3 className="font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-2">
          <ShieldAlert className="h-6 w-6" /> TELEMETRY INTERRUPTED
        </h3>
        <p className="text-sm">{error || 'La respuesta de los datos de soporte vital está vacía.'}</p>
        <button
          type="button"
          onClick={fetchOverviewData}
          className="mt-4 border border-[#c27c2f] text-[#c27c2f] px-4 py-1.5 uppercase text-xs hover:bg-[#c27c2f] hover:text-[#161513] transition font-bold"
        >
          RETRY LINK SIGNAL
        </button>
      </div>
    );
  }

  // Check if food production is less than consumption
  const isFoodDeficit = balance.foodProduction < balance.foodConsumption;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* 3-COLUMN INDUSTRIAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: LIFELINE / SOPORTE VITAL */}
        <div 
          className={`flex flex-col justify-between p-5 font-mono ${
            isFoodDeficit 
              ? 'bg-[#9c2720] border-2 border-black text-white shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]' 
              : 'bg-[#1a1a1a] border-2 border-black text-[#e0d8cc]'
          }`}
        >
          <div className="space-y-4">
            <div className={`flex items-center gap-2 border-b pb-2 ${isFoodDeficit ? 'border-white/20' : 'border-black'}`}>
              <Activity className={`h-5 w-5 ${isFoodDeficit ? 'text-white animate-bounce' : 'text-[#c27c2f]'}`} />
              <h3 className="font-bold tracking-wider text-xs uppercase">01. Balance Alimentario</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              {/* Food Details */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>PRODUCCIÓN FOOD:</span>
                  <span className={isFoodDeficit ? 'text-white font-extrabold' : 'text-emerald-400'}>
                    +{balance.foodProduction} MRE/DÍA
                  </span>
                </div>
                <div className={`flex justify-between ${isFoodDeficit ? 'text-white/70' : 'text-zinc-400'}`}>
                  <span>CONSUMO POBLACIÓN:</span>
                  <span>-{balance.foodConsumption} MRE/DÍA</span>
                </div>
                {/* Visual indicator of production ratio */}
                <div className={`w-full h-2 border ${isFoodDeficit ? 'bg-black/30 border-white/10' : 'bg-black border-zinc-805'}`}>
                  <div 
                    className={`h-full ${isFoodDeficit ? 'bg-white' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (balance.foodProduction / (balance.foodConsumption || 1)) * 100)}%` }}
                  />
                </div>
                <div className={`flex justify-between text-[10px] ${isFoodDeficit ? 'text-white/60' : 'text-zinc-500'}`}>
                  <span>EFICIENCIA</span>
                  <span>{balance.foodConsumption > 0 ? Math.round((balance.foodProduction / balance.foodConsumption) * 100) : 100}%</span>
                </div>
              </div>

              {/* Water Details */}
              <div className={`space-y-1 pt-1 border-t ${isFoodDeficit ? 'border-white/15' : 'border-zinc-800'}`}>
                <div className="flex justify-between font-bold">
                  <span>SUMINISTRO DE AGUA:</span>
                  <span className={isFoodDeficit ? 'text-white' : 'text-emerald-400'}>+{balance.waterProduction} L/DÍA</span>
                </div>
                <div className={`flex justify-between ${isFoodDeficit ? 'text-white/70' : 'text-zinc-400'}`}>
                  <span>CONSUMO HIDRATACIÓN:</span>
                  <span>-{balance.waterConsumption} L/DÍA</span>
                </div>
                {/* Visual indicator of water ratio */}
                <div className={`w-full h-2 border ${isFoodDeficit ? 'bg-black/30 border-white/10' : 'bg-black border-zinc-805'}`}>
                  <div 
                    className={`h-full ${isFoodDeficit ? 'bg-white/85' : 'bg-cyan-600'}`}
                    style={{ width: `${Math.min(100, (balance.waterProduction / (balance.waterConsumption || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {isFoodDeficit ? (
              <div className="text-[10px] bg-white text-[#9c2720] p-1.5 text-center font-extrabold tracking-wider border border-black uppercase">
                CRITICAL_DEFICIT
              </div>
            ) : (
              <div className="text-[10px] bg-black text-[#e0d8cc] p-1.5 text-center font-bold tracking-wider border border-black uppercase">
                SOPORTE_VITAL_ESTABLE
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: LOGISTICS SATELLITE */}
        <div className="flex flex-col justify-between p-5 bg-[#9a9080] border-2 border-black text-black font-mono">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-black pb-2">
              <Truck className="h-5 w-5 text-black" />
              <h3 className="font-bold tracking-wider text-xs uppercase text-black">02. Logística y Tránsitos</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>EXPEDICIONES ENVIADAS:</span>
                <span className="font-mono text-black font-black">{stats.sentCount} DESPACHOS</span>
              </div>
              <div className="flex justify-between text-black/80">
                <span>CARGAMENTOS SEGUROS:</span>
                <span className="font-mono text-black font-bold">{stats.receivedCount} ENTREGAS</span>
              </div>
              <div className="flex justify-between text-black/80">
                <span>TOTAL TRANSFERIDO:</span>
                <span className="font-mono text-black font-bold">{stats.totalTransferredResources} UNIDADES</span>
              </div>
              <div className="flex justify-between text-[#801b15] font-extrabold border-t border-black/40 pt-2 pb-1">
                <span>PEDIDOS PENDIENTES:</span>
                <span className="animate-pulse">{stats.pendingIncomingRequests} ENTRANTES</span>
              </div>
              <div className="flex justify-between text-[11px] text-black/60">
                <span>GASTO DIÉSEL:</span>
                <span>{stats.totalFuelCostUsed} BIDONES</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10px] bg-black text-white p-1.5 text-center font-bold tracking-wider border border-black uppercase">
              ENLACE_ORBITAL_STABLE
            </div>
          </div>
        </div>

        {/* CARD 3: MEDICINE AND SANITARY */}
        <div className="flex flex-col justify-between p-5 bg-[#2a2824] border-2 border-black text-[#e0d8cc] font-mono">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-black pb-2">
              <Database className="h-5 w-5 text-[#c27c2f]" />
              <h3 className="font-bold tracking-wider text-xs uppercase text-[#c27c2f]">03. Biometría Cuarentena</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>APOYO MÉDICO REQ:</span>
                <span className="font-mono text-[#c27c2f] font-extrabold">{balance.medicalSuppliesNeeded} DOSIS</span>
              </div>
              <div className="flex justify-between text-[#e0d8cc]/80">
                <span>ALARMAS SECTOR:</span>
                <span className="font-mono text-red-500 font-bold">{balance.activeAlarmsCount} REGISTRADAS</span>
              </div>
              <div className="flex justify-between">
                <span>SEGURIDAD BÚNKER:</span>
                <span className="text-emerald-400 font-bold uppercase">NIVEL_4_MAX</span>
              </div>
              <div className="pt-2 border-t border-black flex justify-between text-[10px] text-zinc-400">
                <span>DETECCIÓN INTRUSIONES:</span>
                <span className="text-emerald-400 font-bold">ACTIVO</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10px] border border-[#c27c2f] text-[#c27c2f] p-1.5 text-center font-bold uppercase tracking-widest">
              MONITOR_BIOMÉTRICO_ONLINE
            </div>
          </div>
        </div>

      </div>

      {/* DEDICATED ALARM PANEL */}
      <div className="border-2 border-black bg-[#1a1a1a] font-mono">
        <div className="bg-black p-2 text-[10px] font-bold uppercase tracking-widest text-[#c27c2f] flex justify-between items-center">
          <span>ALARMAS_HISTORIAL_REGULADOR ({balance.activeAlarmsCount})</span>
          <span className="animate-pulse text-[#c27c2f]">● MONITOREO DIRECTO</span>
        </div>
        
        <div className="p-4">
          {balance.detailedAlarms.length === 0 ? (
            <p className="text-xs text-emerald-400 uppercase py-2">
              ✔ TODO EN ORDEN. Sensores de inventario y personal en márgenes permitidos.
            </p>
          ) : (
            <div className="space-y-2">
              {balance.detailedAlarms.map((alarm, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 bg-black/40 border-l-4 border-[#9c2720] p-2 text-xs text-[#e0d8cc]"
                >
                  <div className="h-2 w-2 rounded-full bg-[#9c2720] animate-ping shrink-0" />
                  <span className="font-medium">{alarm}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
