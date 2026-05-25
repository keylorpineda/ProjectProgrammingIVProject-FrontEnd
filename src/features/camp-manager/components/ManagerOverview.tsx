/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react"
import { api } from "../config/api"
import type { CampBalance, TransferStatistics } from "../types/api.types"
import { ShieldAlert, Activity, Truck, Database } from "lucide-react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"

interface ManagerOverviewProps {
  campId: string
  refreshTrigger: number
}

export default function ManagerOverview({ campId, refreshTrigger }: ManagerOverviewProps) {
  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ["managerOverview", campId],
    queryFn: async () => {
      const [balanceRes, statsRes] = await Promise.all([
        api.get(`/users/camp/${campId}/balance`),
        api.get(`/transfers/statistics/${campId}`),
      ])
      return { balance: balanceRes.data as CampBalance, stats: statsRes.data as TransferStatistics }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  const balance = data?.balance
  const stats = data?.stats
  const error = queryError ? (queryError as any).message || "Error en telemetría de satélite de enlace." : null

  if (loading && !data) {
    return <div className="min-h-[400px]" />
  }

  if (error || !balance || !stats) {
    return (
      <div className="border border-[#9c2720] bg-[#9c2720]/10 p-6 rounded font-mono text-[#e0d8cc] my-4">
        <h3 className="font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-2">
          <ShieldAlert className="h-6 w-6" /> TELEMETRY INTERRUPTED
        </h3>
        <p className="text-sm">
          {error || "La respuesta de los datos de soporte vital está vacía."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 border border-[#c27c2f] text-[#c27c2f] px-4 py-1.5 uppercase text-xs hover:bg-[#c27c2f] hover:text-[#161513] transition font-bold"
        >
          RETRY LINK SIGNAL
        </button>
      </div>
    )
  }

  // Check if food production is less than consumption
  const isFoodDeficit = balance.foodProduction < balance.foodConsumption

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* 3-COLUMN INDUSTRIAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* CARD 1: LIFELINE / SOPORTE VITAL */}
        <div
          className={`flex flex-col justify-between p-8 md:p-10 font-mono ${
            isFoodDeficit
              ? "bg-[#9c2720] border-2 border-black text-white shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]"
              : "bg-[#1a1a1a] border-2 border-black text-[#e0d8cc]"
          }`}
        >
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 border-b-2 pb-4 ${isFoodDeficit ? "border-white/20" : "border-black"}`}
            >
              <Activity
                className={`h-6 w-6 ${isFoodDeficit ? "text-white animate-bounce" : "text-[#c27c2f]"}`}
              />
              <h3 className="font-black tracking-widest text-base uppercase">
                01. Balance Alimentario
              </h3>
            </div>

            <div className="space-y-8 text-base">
              {/* Food Details */}
              <div className="space-y-3">
                <div className="flex justify-between font-black">
                  <span>PRODUCCIÓN FOOD:</span>
                  <span
                    className={isFoodDeficit ? "text-white font-extrabold" : "text-emerald-400"}
                  >
                    +{balance.foodProduction} MRE/DÍA
                  </span>
                </div>
                <div
                  className={`flex justify-between font-bold ${isFoodDeficit ? "text-white/70" : "text-zinc-400"}`}
                >
                  <span>CONSUMO POBLACIÓN:</span>
                  <span>-{balance.foodConsumption} MRE/DÍA</span>
                </div>
                {/* Visual indicator of production ratio */}
                <div
                  className={`w-full h-5 border-2 my-4 relative overflow-hidden ${isFoodDeficit ? "bg-black border-[#9c2720]" : "bg-black border-emerald-900"}`}
                >
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.7)_5px,rgba(0,0,0,0.7)_10px)] z-10" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (balance.foodProduction / (balance.foodConsumption || 1)) * 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full relative z-0 ${isFoodDeficit ? "bg-[#9c2720]" : "bg-emerald-500"}`}
                  />
                </div>
                <div
                  className={`flex justify-between text-sm font-black ${isFoodDeficit ? "text-white/60" : "text-zinc-500"}`}
                >
                  <span>EFICIENCIA</span>
                  <span>
                    {balance.foodConsumption > 0
                      ? Math.round((balance.foodProduction / balance.foodConsumption) * 100)
                      : 100}
                    %
                  </span>
                </div>
              </div>

              {/* Water Details */}
              <div
                className={`space-y-3 pt-6 border-t-2 ${isFoodDeficit ? "border-white/15" : "border-zinc-800"}`}
              >
                <div className="flex justify-between font-black">
                  <span>SUMINISTRO DE AGUA:</span>
                  <span className={isFoodDeficit ? "text-white" : "text-emerald-400"}>
                    +{balance.waterProduction} L/DÍA
                  </span>
                </div>
                <div
                  className={`flex justify-between font-bold ${isFoodDeficit ? "text-white/70" : "text-zinc-400"}`}
                >
                  <span>CONSUMO HIDRATACIÓN:</span>
                  <span>-{balance.waterConsumption} L/DÍA</span>
                </div>
                {/* Visual indicator of water ratio */}
                <div
                  className={`w-full h-5 border-2 my-4 relative overflow-hidden ${isFoodDeficit ? "bg-black border-zinc-700" : "bg-black border-cyan-900"}`}
                >
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.7)_5px,rgba(0,0,0,0.7)_10px)] z-10" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (balance.waterProduction / (balance.waterConsumption || 1)) * 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                    className={`h-full relative z-0 ${isFoodDeficit ? "bg-zinc-400" : "bg-cyan-500"}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {isFoodDeficit ? (
              <div className="text-base bg-white text-[#9c2720] p-2 text-center font-extrabold tracking-wider border border-black uppercase">
                CRITICAL_DEFICIT
              </div>
            ) : (
              <div className="text-base bg-black text-[#e0d8cc] p-2 text-center font-bold tracking-wider border border-black uppercase">
                SOPORTE_VITAL_ESTABLE
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: LOGISTICS SATELLITE */}
        <div className="flex flex-col justify-between p-8 md:p-10 bg-[#9a9080] border-2 border-black text-black font-mono">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-black pb-4">
              <Truck className="h-6 w-6 text-black" />
              <h3 className="font-black tracking-widest text-base uppercase text-black">
                02. Logística y Tránsitos
              </h3>
            </div>

            <div className="space-y-6 text-base">
              <div className="flex justify-between font-bold">
                <span>EXPEDICIONES ENVIADAS:</span>
                <span className="font-mono text-black font-black">{stats.sentCount} DESPACHOS</span>
              </div>
              <div className="flex justify-between text-black/80">
                <span>CARGAMENTOS SEGUROS:</span>
                <span className="font-mono text-black font-bold">
                  {stats.receivedCount} ENTREGAS
                </span>
              </div>
              <div className="flex justify-between text-black/80">
                <span>TOTAL TRANSFERIDO:</span>
                <span className="font-mono text-black font-bold">
                  {stats.totalTransferredResources} UNIDADES
                </span>
              </div>
              <div className="flex justify-between text-[#801b15] font-extrabold border-t border-black/40 pt-2 pb-1">
                <span>PEDIDOS PENDIENTES:</span>
                <span className="animate-pulse">{stats.pendingIncomingRequests} ENTRANTES</span>
              </div>
              <div className="flex justify-between text-sm text-black/60">
                <span>GASTO DIÉSEL:</span>
                <span>{stats.totalFuelCostUsed} BIDONES</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {/* RADAR ANIMATION */}
            <div className="h-20 w-full border-2 border-black bg-[#161513] mb-4 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,124,47,0.15)_0,transparent_70%)]" />
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(194,124,47,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(194,124,47,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
              
              <div className="w-14 h-14 border border-[#c27c2f]/40 rounded-full flex items-center justify-center relative">
                <div className="w-6 h-6 border border-[#c27c2f]/60 rounded-full" />
                <div className="w-1 h-1 bg-[#df8120] rounded-full absolute top-2 left-2 animate-ping" />
                <div className="w-1 h-1 bg-[#df8120] rounded-full absolute bottom-3 right-1 animate-ping" style={{ animationDelay: "1s" }} />
                
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "conic-gradient(from 0deg, transparent 70%, rgba(194,124,47,0.6) 100%)" }}
                />
              </div>
              <div className="absolute left-3 bottom-2 text-[10px] text-[#c27c2f] font-black uppercase tracking-widest flex flex-col">
                <span className="animate-pulse">TRACKING</span>
                <span>SAT_UPLINK</span>
              </div>
            </div>
            <div className="text-base bg-black text-white p-2 text-center font-bold tracking-wider border border-black uppercase shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]">
              ENLACE_ORBITAL_STABLE
            </div>
          </div>
        </div>

        {/* CARD 3: MEDICINE AND SANITARY */}
        <div className="flex flex-col justify-between p-8 md:p-10 bg-[#2a2824] border-2 border-black text-[#e0d8cc] font-mono">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-black pb-4">
              <Database className="h-6 w-6 text-[#c27c2f]" />
              <h3 className="font-black tracking-widest text-base uppercase text-[#c27c2f]">
                03. Biometría Cuarentena
              </h3>
            </div>

            <div className="space-y-6 text-base">
              <div className="flex justify-between font-black">
                <span>APOYO MÉDICO REQ:</span>
                <span className="font-mono text-[#c27c2f] font-extrabold">
                  {balance.medicalSuppliesNeeded} DOSIS
                </span>
              </div>
              <div className="flex justify-between text-[#9c2720] font-black border-y-2 border-black/40 py-2">
                <span>ALARMAS SECTOR:</span>
                <span className="animate-pulse">REGISTRADAS</span>
              </div>
              <div className="flex justify-between text-[#e0d8cc]/80 font-bold">
                <span>SEGURIDAD BÚNKER:</span>
                <span className="text-emerald-400 font-mono font-black">NIVEL_4_MAX</span>
              </div>
              <div className="flex justify-between text-[#e0d8cc]/60 font-bold">
                <span>DETECCIÓN INTRUSIONES:</span>
                <span className="text-emerald-400 font-mono">ACTIVA</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-base border-2 border-[#c27c2f] text-[#c27c2f] p-2 text-center font-bold uppercase tracking-widest">
              MONITOR_BIOMÉTRICO_ONLINE
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED ALARM PANEL */}
      <div className="border-2 border-black bg-[#1a1a1a] font-mono">
        <div className="bg-black p-2 text-sm font-bold uppercase tracking-widest text-[#c27c2f] flex justify-between items-center">
          <span>ALARMAS_HISTORIAL_REGULADOR ({balance.activeAlarmsCount})</span>
          <span className="animate-pulse text-[#c27c2f]">● MONITOREO DIRECTO</span>
        </div>

        <div className="p-4">
          {(balance.detailedAlarms || []).length === 0 ? (
            <p className="text-xs text-emerald-400 uppercase py-2">
              ✔ TODO EN ORDEN. Sensores de inventario y personal en márgenes permitidos.
            </p>
          ) : (
            <div className="space-y-2">
              {(balance.detailedAlarms || []).map((alarm, index) => (
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
  )
}
