/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ShieldAlert, Activity, Truck, Database, Flame, Droplet, AlertTriangle } from "lucide-react"
import { useEffect } from "react"

import { api } from "../config/api"

import type { CampBalance, TransferStatistics } from "../types/api.types"

interface ManagerOverviewProps {
  campId: string
  refreshTrigger: number
}

function StatBlock({
  label,
  value,
  sub,
  color = "text-[#c27c2f]",
  alert = false,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
  alert?: boolean
}) {
  return (
    <div className={`space-y-1 ${alert ? "animate-pulse" : ""}`}>
      <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{label}</div>
      <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-600 uppercase">{sub}</div>}
    </div>
  )
}

export default function ManagerOverview({ campId, refreshTrigger }: ManagerOverviewProps) {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["managerOverview", campId],
    queryFn: async () => {
      const [balanceRes, statsRes] = await Promise.all([
        api.get(`/users/camp/${campId}/balance`),
        api.get(`/transfers/statistics/${campId}`),
      ])
      return { balance: balanceRes.data as CampBalance, stats: statsRes.data as TransferStatistics }
    },
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  const balance = data?.balance
  const stats = data?.stats
  const error = queryError
    ? (queryError as any).message || "Error en telemetría de satélite de enlace."
    : null

  if (loading && !data) {
    return <div className="min-h-[400px]" />
  }

  if (error || !balance || !stats) {
    return (
      <div className="border border-[#9c2720] bg-[#9c2720]/10 p-8 font-mono text-[#e0d8cc] my-4">
        <h3 className="font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          <ShieldAlert className="h-6 w-6" /> TELEMETRY INTERRUPTED
        </h3>
        <p className="text-sm text-zinc-400">
          {error || "La respuesta de los datos de soporte vital está vacía."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 border border-[#c27c2f] text-[#c27c2f] px-5 py-2 uppercase text-xs hover:bg-[#c27c2f] hover:text-[#161513] transition font-bold cursor-pointer"
        >
          RETRY LINK SIGNAL
        </button>
      </div>
    )
  }

  // Normalise field names — Render backend may return snake_case
  const b = balance as any
  const foodProd = b.foodProduction ?? b.food_production ?? 0
  const foodCons = b.foodConsumption ?? b.food_consumption ?? 0
  const waterProd = b.waterProduction ?? b.water_production ?? 0
  const waterCons = b.waterConsumption ?? b.water_consumption ?? 0
  const medNeeded = b.medicalSuppliesNeeded ?? b.medical_supplies_needed ?? 0
  const alarmCount = b.activeAlarmsCount ?? b.active_alarms_count ?? 0
  const alarmList: string[] = b.detailedAlarms ?? b.detailed_alarms ?? []

  const s = stats as any
  const sentCount = s.sentCount ?? s.sent_count ?? 0
  const receivedCount = s.receivedCount ?? s.received_count ?? 0
  const totalTransferred = s.totalTransferredResources ?? s.total_transferred_resources ?? 0
  const pendingIncoming = s.pendingIncomingRequests ?? s.pending_incoming_requests ?? 0

  const isFoodDeficit = foodProd < foodCons
  const foodPct = foodCons > 0 ? Math.min(100, Math.round((foodProd / foodCons) * 100)) : 100
  const waterPct = waterCons > 0 ? Math.min(100, Math.round((waterProd / waterCons) * 100)) : 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* ROW 1: Food & Water balance — 2 wide cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD: FOOD */}
        <div
          className={`p-8 font-mono border-2 border-black ${isFoodDeficit ? "bg-[#9c2720]/20 border-[#9c2720]" : "bg-[#1a1a1a]"}`}
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black">
            <Flame
              className={`h-5 w-5 ${isFoodDeficit ? "text-[#9c2720] animate-bounce" : "text-[#c27c2f]"}`}
            />
            <span className="text-sm font-black uppercase tracking-widest text-[#c27c2f]">
              BALANCE ALIMENTARIO
            </span>
            {isFoodDeficit && (
              <span className="ml-auto text-xs font-black text-white bg-[#9c2720] px-2 py-0.5 animate-pulse">
                DÉFICIT
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <StatBlock
              label="Producción diaria"
              value={`+${foodProd}`}
              sub="MRE / DÍA"
              color="text-emerald-400"
            />
            <StatBlock
              label="Consumo población"
              value={`-${foodCons}`}
              sub="MRE / DÍA"
              color={isFoodDeficit ? "text-[#9c2720]" : "text-zinc-400"}
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-500 uppercase mb-2 font-bold">
              <span>Eficiencia de producción</span>
              <span className={foodPct >= 100 ? "text-emerald-400" : "text-[#9c2720]"}>
                {foodPct}%
              </span>
            </div>
            <div className="w-full h-4 bg-black border border-black overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${foodPct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full ${isFoodDeficit ? "bg-[#9c2720]" : "bg-emerald-500"}`}
              />
            </div>
          </div>
        </div>

        {/* CARD: WATER */}
        <div className="p-8 font-mono border-2 border-black bg-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black">
            <Droplet className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-black uppercase tracking-widest text-cyan-400">
              SUMINISTRO HÍDRICO
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <StatBlock
              label="Producción diaria"
              value={`+${waterProd}`}
              sub="LITROS / DÍA"
              color="text-cyan-400"
            />
            <StatBlock
              label="Consumo hidratación"
              value={`-${waterCons}`}
              sub="LITROS / DÍA"
              color="text-zinc-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-500 uppercase mb-2 font-bold">
              <span>Eficiencia hídrica</span>
              <span className={waterPct >= 100 ? "text-cyan-400" : "text-[#9c2720]"}>
                {waterPct}%
              </span>
            </div>
            <div className="w-full h-4 bg-black border border-black overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${waterPct}%` }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className={`h-full ${waterPct >= 100 ? "bg-cyan-500" : "bg-[#9c2720]"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Logistics + Medical — 2 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD: LOGISTICS */}
        <div className="p-8 font-mono border-2 border-black bg-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black">
            <Truck className="h-5 w-5 text-[#c27c2f]" />
            <span className="text-sm font-black uppercase tracking-widest text-[#c27c2f]">
              LOGÍSTICA Y TRÁNSITOS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <StatBlock
              label="Expediciones enviadas"
              value={sentCount}
              sub="DESPACHOS"
              color="text-[#e0d8cc]"
            />
            <StatBlock
              label="Cargamentos recibidos"
              value={receivedCount}
              sub="ENTREGAS"
              color="text-[#e0d8cc]"
            />
            <StatBlock
              label="Total transferido"
              value={totalTransferred}
              sub="UNIDADES"
              color="text-[#e0d8cc]"
            />
            <StatBlock
              label="Pedidos pendientes"
              value={pendingIncoming}
              sub="ENTRANTES"
              color={pendingIncoming > 0 ? "text-[#9c2720]" : "text-zinc-500"}
              alert={pendingIncoming > 0}
            />
          </div>
        </div>

        {/* CARD: MEDICAL & SECURITY */}
        <div className="p-8 font-mono border-2 border-black bg-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-black">
            <Database className="h-5 w-5 text-[#c27c2f]" />
            <span className="text-sm font-black uppercase tracking-widest text-[#c27c2f]">
              BIOMETRÍA Y SEGURIDAD
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <StatBlock
              label="Apoyo médico req."
              value={medNeeded}
              sub="DOSIS"
              color="text-[#c27c2f]"
            />
            <StatBlock
              label="Alarmas activas"
              value={alarmCount}
              sub="SECTOR"
              color={alarmCount > 0 ? "text-[#9c2720]" : "text-emerald-400"}
              alert={alarmCount > 0}
            />
            <StatBlock
              label="Seguridad búnker"
              value="NIVEL 4"
              sub="MÁXIMO"
              color="text-emerald-400"
            />
            <StatBlock
              label="Detección intrusiones"
              value="ACTIVA"
              sub="ONLINE"
              color="text-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* ALARM PANEL */}
      {alarmCount > 0 && (
        <div className="border-2 border-[#9c2720] bg-[#9c2720]/10 font-mono">
          <div className="bg-[#9c2720] px-5 py-3 text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
            <AlertTriangle className="h-4 w-4" />
            <span>ALARMAS ACTIVAS ({alarmCount})</span>
            <span className="ml-auto animate-pulse">● EN VIVO</span>
          </div>
          <div className="p-5 space-y-3">
            {alarmList.map((alarm, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border-l-4 border-[#9c2720] bg-black/30 px-4 py-3 text-sm text-[#e0d8cc]"
              >
                <div className="h-2 w-2 rounded-full bg-[#9c2720] animate-ping shrink-0" />
                <span>{alarm}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alarmCount === 0 && (
        <div className="border-2 border-black bg-[#1a1a1a] font-mono px-6 py-4 flex items-center gap-4 text-sm text-emerald-400">
          <Activity className="h-4 w-4 shrink-0" />
          <span className="uppercase font-bold tracking-wider">
            Todo en orden — Sensores de inventario y personal en márgenes permitidos.
          </span>
          <span className="ml-auto text-zinc-600 text-xs uppercase">● Monitoreo directo</span>
        </div>
      )}
    </motion.div>
  )
}
