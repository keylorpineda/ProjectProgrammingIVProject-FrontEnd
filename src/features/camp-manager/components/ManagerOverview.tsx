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

const P =
  "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")"

function StatBlock({
  label,
  value,
  sub,
  valueColor = "#1a1208",
  alert = false,
}: {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
  alert?: boolean
}) {
  return (
    <div
      className={alert ? "animate-pulse" : ""}
      style={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: "#7a6a4a",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontFamily: "monospace",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.6rem",
          fontWeight: 900,
          fontFamily: "monospace",
          color: valueColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: "0.62rem",
            color: "#9a8a6a",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "monospace",
          }}
        >
          {sub}
        </div>
      )}
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
      {/* ROW 1: Food & Water balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARD: FOOD */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, rotate: -1 }}
          animate={{ scale: 1, opacity: 1, rotate: -1 }}
          whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
          style={{
            backgroundColor: isFoodDeficit ? "#e8d4c8" : "#d8d2bf",
            backgroundImage: P,
            padding: "32px 28px 28px",
            position: "relative",
            border: isFoodDeficit ? "1px solid rgba(156,39,32,0.4)" : "1px solid rgba(0,0,0,0.18)",
            borderLeft: isFoodDeficit ? "4px solid #9c2720" : "4px solid #7a3a1a",
            boxShadow: "-3px 10px 28px rgba(0,0,0,0.7)",
            color: "#1a1208",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: isFoodDeficit
                ? "radial-gradient(circle at 35% 30%,#ff8c8c 0%,#d31a1a 45%,#660000 100%)"
                : "radial-gradient(circle at 35% 30%,#e8e8e8 0%,#999 45%,#444 100%)",
              boxShadow: "inset -1px -2px 5px rgba(0,0,0,0.55),2px 4px 8px rgba(0,0,0,0.5)",
              zIndex: 5,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px dashed rgba(0,0,0,0.3)",
            }}
          >
            <Flame
              style={{
                width: 18,
                height: 18,
                color: isFoodDeficit ? "#9c2720" : "#7a3a1a",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#2a1a08",
              }}
            >
              BALANCE ALIMENTARIO
            </span>
            {isFoodDeficit && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  color: "#fff",
                  backgroundColor: "#9c2720",
                  padding: "2px 8px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
                className="animate-pulse"
              >
                DÉFICIT
              </span>
            )}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}
          >
            <StatBlock
              label="Producción diaria"
              value={`+${foodProd}`}
              sub="MRE / DÍA"
              valueColor="#2a4a35"
            />
            <StatBlock
              label="Consumo población"
              value={`-${foodCons}`}
              sub="MRE / DÍA"
              valueColor={isFoodDeficit ? "#9c2720" : "#5a4a2a"}
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                color: "#7a6a4a",
                textTransform: "uppercase",
                marginBottom: 6,
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              <span>Eficiencia de producción</span>
              <span style={{ color: foodPct >= 100 ? "#2a4a35" : "#9c2720" }}>{foodPct}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: 10,
                backgroundColor: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${foodPct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ height: "100%", backgroundColor: isFoodDeficit ? "#9c2720" : "#2a4a35" }}
              />
            </div>
          </div>
        </motion.div>

        {/* CARD: WATER */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, rotate: 1 }}
          animate={{ scale: 1, opacity: 1, rotate: 1 }}
          whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
          style={{
            backgroundColor: "#d4d8dc",
            backgroundImage: P,
            padding: "32px 28px 28px",
            position: "relative",
            border: "1px solid rgba(0,0,0,0.18)",
            borderLeft: "4px solid #2a5a6a",
            boxShadow: "-3px 10px 28px rgba(0,0,0,0.7)",
            color: "#1a1208",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%,#8cc8e8 0%,#1a6a9a 45%,#00336a 100%)",
              boxShadow: "inset -1px -2px 5px rgba(0,0,0,0.55),2px 4px 8px rgba(0,0,0,0.5)",
              zIndex: 5,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px dashed rgba(0,0,0,0.3)",
            }}
          >
            <Droplet style={{ width: 18, height: 18, color: "#2a5a6a", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#1a2a2a",
              }}
            >
              SUMINISTRO HÍDRICO
            </span>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}
          >
            <StatBlock
              label="Producción diaria"
              value={`+${waterProd}`}
              sub="LITROS / DÍA"
              valueColor="#1a5a7a"
            />
            <StatBlock
              label="Consumo hidratación"
              value={`-${waterCons}`}
              sub="LITROS / DÍA"
              valueColor="#5a4a2a"
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                color: "#5a6a7a",
                textTransform: "uppercase",
                marginBottom: 6,
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              <span>Eficiencia hídrica</span>
              <span style={{ color: waterPct >= 100 ? "#1a5a7a" : "#9c2720" }}>{waterPct}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: 10,
                backgroundColor: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${waterPct}%` }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                style={{ height: "100%", backgroundColor: waterPct >= 100 ? "#1a5a7a" : "#9c2720" }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ROW 2: Logistics + Medical */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARD: LOGISTICS */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, rotate: 1.2 }}
          animate={{ scale: 1, opacity: 1, rotate: 1.2 }}
          whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
          style={{
            backgroundColor: "#ccc8b4",
            backgroundImage: P,
            padding: "32px 28px 28px",
            position: "relative",
            border: "1px solid rgba(0,0,0,0.18)",
            borderLeft: "4px solid #6a4a1a",
            boxShadow: "-3px 10px 28px rgba(0,0,0,0.7)",
            color: "#1a1208",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%,#e8e8e8 0%,#999 45%,#444 100%)",
              boxShadow: "inset -1px -2px 5px rgba(0,0,0,0.55),2px 4px 8px rgba(0,0,0,0.5)",
              zIndex: 5,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px dashed rgba(0,0,0,0.3)",
            }}
          >
            <Truck style={{ width: 18, height: 18, color: "#6a4a1a", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#2a1a08",
              }}
            >
              LOGÍSTICA Y TRÁNSITOS
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <StatBlock
              label="Expediciones enviadas"
              value={sentCount}
              sub="DESPACHOS"
              valueColor="#1a1208"
            />
            <StatBlock
              label="Cargamentos recibidos"
              value={receivedCount}
              sub="ENTREGAS"
              valueColor="#1a1208"
            />
            <StatBlock
              label="Total transferido"
              value={totalTransferred}
              sub="UNIDADES"
              valueColor="#1a1208"
            />
            <StatBlock
              label="Pedidos pendientes"
              value={pendingIncoming}
              sub="ENTRANTES"
              valueColor={pendingIncoming > 0 ? "#9c2720" : "#5a7a5a"}
              alert={pendingIncoming > 0}
            />
          </div>
        </motion.div>

        {/* CARD: MEDICAL & SECURITY */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, rotate: -0.8 }}
          animate={{ scale: 1, opacity: 1, rotate: -0.8 }}
          whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
          style={{
            backgroundColor: alarmCount > 0 ? "#e8d4c8" : "#d8d2bf",
            backgroundImage: P,
            padding: "32px 28px 28px",
            position: "relative",
            border: alarmCount > 0 ? "1px solid rgba(156,39,32,0.4)" : "1px solid rgba(0,0,0,0.18)",
            borderLeft: alarmCount > 0 ? "4px solid #9c2720" : "4px solid #2a4a35",
            boxShadow: "-3px 10px 28px rgba(0,0,0,0.7)",
            color: "#1a1208",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background:
                alarmCount > 0
                  ? "radial-gradient(circle at 35% 30%,#ff8c8c 0%,#d31a1a 45%,#660000 100%)"
                  : "radial-gradient(circle at 35% 30%,#e8e8e8 0%,#999 45%,#444 100%)",
              boxShadow: "inset -1px -2px 5px rgba(0,0,0,0.55),2px 4px 8px rgba(0,0,0,0.5)",
              zIndex: 5,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px dashed rgba(0,0,0,0.3)",
            }}
          >
            <Database style={{ width: 18, height: 18, color: "#2a4a35", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#2a1a08",
              }}
            >
              BIOMETRÍA Y SEGURIDAD
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <StatBlock
              label="Apoyo médico req."
              value={medNeeded}
              sub="DOSIS"
              valueColor="#6a4a1a"
            />
            <StatBlock
              label="Alarmas activas"
              value={alarmCount}
              sub="SECTOR"
              valueColor={alarmCount > 0 ? "#9c2720" : "#2a4a35"}
              alert={alarmCount > 0}
            />
            <StatBlock label="Seguridad búnker" value="NIVEL 4" sub="MÁXIMO" valueColor="#2a4a35" />
            <StatBlock
              label="Detección intrusiones"
              value="ACTIVA"
              sub="ONLINE"
              valueColor="#2a4a35"
            />
          </div>
        </motion.div>
      </div>

      {/* ALARM PANEL */}
      {alarmCount > 0 && (
        <div
          style={{
            backgroundColor: "#e8d0c4",
            backgroundImage: P,
            border: "1px solid rgba(156,39,32,0.4)",
            borderLeft: "4px solid #9c2720",
            boxShadow: "-3px 8px 24px rgba(0,0,0,0.65)",
            color: "#1a1208",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 24px",
              backgroundColor: "#9c2720",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            <AlertTriangle style={{ width: 16, height: 16 }} />
            <span>ALARMAS ACTIVAS ({alarmCount})</span>
            <span style={{ marginLeft: "auto" }} className="animate-pulse">
              ● EN VIVO
            </span>
          </div>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {alarmList.map((alarm, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderLeft: "3px solid #9c2720",
                  backgroundColor: "rgba(156,39,32,0.08)",
                  padding: "10px 14px",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  color: "#2a1208",
                }}
              >
                <div className="h-2 w-2 rounded-full bg-[#9c2720] animate-ping shrink-0" />
                <span>{alarm}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alarmCount === 0 && (
        <div
          style={{
            backgroundColor: "#d0d8cc",
            backgroundImage: P,
            border: "1px solid rgba(0,0,0,0.2)",
            borderLeft: "4px solid #2a4a35",
            boxShadow: "-3px 8px 24px rgba(0,0,0,0.6)",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "monospace",
            color: "#1a2a1a",
          }}
        >
          <Activity style={{ width: 16, height: 16, color: "#2a4a35", flexShrink: 0 }} />
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Todo en orden — Sensores de inventario y personal en márgenes permitidos.
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.65rem",
              color: "#6a8a6a",
              textTransform: "uppercase",
            }}
          >
            ● Monitoreo directo
          </span>
        </div>
      )}
    </motion.div>
  )
}
