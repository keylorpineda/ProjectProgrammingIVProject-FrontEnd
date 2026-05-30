import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Compass,
  AlertTriangle,
  ShieldCheck,
  Target,
  History,
  MessageSquare,
  Radio,
  ChevronRight,
  Users,
  AlertCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import type { Variants } from "framer-motion"

import { getCamps } from "@/features/camps/services/camps.service"
import { getExplorations } from "@/features/explorations/services/explorations.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"
import { useAuthStore } from "@/store/useAuthStore"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
}

export default function TravelDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const baseCampId = user?.camp_id ?? ""

  const { data: camps = [], isError: campsError } = useQuery({
    queryKey: ["camps"],
    queryFn: getCamps,
  })

  const { data: explorations = [], isError: expError } = useQuery({
    queryKey: ["explorations", baseCampId],
    queryFn: () => getExplorations({ campId: baseCampId }),
    enabled: !!baseCampId,
  })

  const { data: transfers = [], isError: transfersError } = useQuery({
    queryKey: ["transfers", baseCampId],
    queryFn: () => getCampTransfers(baseCampId),
    enabled: !!baseCampId,
  })

  const { data: inventory = [], isError: invError } = useQuery({
    queryKey: ["inventory", baseCampId],
    queryFn: () => getInventory(baseCampId),
    enabled: !!baseCampId,
  })

  const hasError = campsError || expError || transfersError || invError

  const baseCamp = camps.find((c) => c.id === baseCampId)
  const consultedCamp = baseCamp

  const activeExplorations = explorations.filter(
    (e) => e.status === "active" || e.status === "in_progress",
  )
  const scheduledExplorations = explorations.filter((e) => e.status === "scheduled")

  const transitTransfers = transfers.filter(
    (t) => t.status === "in_transit" || t.status === "approved",
  )
  const pendingRequests = transfers.filter((t) => t.status === "pending")

  const expeditionSupplies = inventory
    .map((item) => ({
      name: item.resource?.name || "Recurso",
      level: Math.min(
        (item.current_quantity / Math.max(item.minimum_stock_required, 1)) * 100,
        100,
      ),
      status: item.alert_active ? "Bajo" : "Suficiente",
      color: item.alert_active ? "bg-[#89633e] text-white" : "bg-[#43523d] text-white",
    }))
    .slice(0, 5)

  const lowResourcesCount = inventory.filter((r) => r.alert_active).length

  const getCampName = (id: string | number) =>
    camps.find((c) => String(c.id) === String(id))?.name || String(id)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex-1 flex flex-col gap-3 w-full overflow-y-auto bg-[#0a0a0a] p-3 custom-scrollbar"
    >
      {/* 1. MASTER HUD - CONTROL DE EXPEDICIONES */}
      <motion.div
        variants={itemVariants}
        className="archive-panel p-3 rounded-lg shrink-0 border-l-4 border-l-[#d4a373] bg-[#12110f]"
      >
        <div className="flex justify-between items-center mb-1 border-b border-[#d4a373]/10 pb-1">
          <div className="flex items-center gap-4">
            <span className="archive-header italic text-xs text-white/40 uppercase">
              Base de Viajes // Panel de Coordinación
            </span>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/20 uppercase">
                Panel de Coordinación Local
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="archive-header text-sm text-accent-approved animate-pulse">
              ENLACE_ACTIVO
            </span>
            <span className="archive-header text-sm text-[#d4a373] tracking-widest font-black border border-[#d4a373]/30 px-3 py-1 bg-black/40">
              {baseCamp?.name?.toUpperCase() ?? baseCampId}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#d4a373]/20 p-2 border border-[#d4a373]/30">
              <Radio className="h-6 w-6 text-[#d4a373]" />
            </div>
            <div>
              <h1 className="archive-title text-xl lg:text-2xl text-white uppercase">
                {consultedCamp?.name ?? baseCampId}
              </h1>
              <p className="text-sm font-mono text-[#d4a373] uppercase tracking-[0.2em] font-black">
                Gestión Directa de Movilidad
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 w-full md:w-auto">
            <div
              className="bg-[#d4a373]/10 border border-[#d4a373]/30 px-4 py-1.5 rounded text-center min-w-[90px] cursor-help transition-all hover:bg-[#d4a373]/20"
              title="Expediciones activas sin retorno registrado."
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-[#d4a373]/60 uppercase font-black">
                  Exploraciones
                </span>
                <span className="text-sm font-mono text-[#d4a373] uppercase font-black">
                  En Curso
                </span>
              </div>
              <span className="text-xl font-mono font-black text-white">
                {activeExplorations.length}
              </span>
            </div>
            <div
              className="bg-accent-critical/10 border border-accent-critical/30 px-4 py-1.5 rounded text-center min-w-[90px] cursor-help transition-all hover:bg-accent-critical/20"
              title="Solicitudes intercampamento esperando aprobación."
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-accent-critical/60 uppercase font-black">
                  Solicitudes
                </span>
                <span className="text-sm font-mono text-accent-critical uppercase font-black">
                  Pendientes
                </span>
              </div>
              <span className="text-xl font-mono font-black text-white">
                {pendingRequests.length}
              </span>
            </div>
            <div
              className="bg-[#c27c2f]/10 border border-[#c27c2f]/30 px-4 py-1.5 rounded text-center min-w-[90px] cursor-help transition-all hover:bg-[#c27c2f]/20"
              title="Solicitudes aprobadas que aún no registran llegada."
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-[#c27c2f]/60 uppercase font-black">
                  Transferencias
                </span>
                <span className="text-sm font-mono text-[#c27c2f] uppercase font-black">
                  En Tránsito
                </span>
              </div>
              <span className="text-xl font-mono font-black text-white">
                {transitTransfers.length}
              </span>
            </div>
            <div
              className="bg-bg-paper border border-[#8b7355]/30 px-4 py-1.5 rounded text-center min-w-[90px] cursor-help transition-all hover:bg-bg-paper-shadow/20"
              title="Insumos para viaje por debajo del mínimo recomendado."
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-ink/40 uppercase font-black">Recursos</span>
                <span className="text-sm font-mono text-ink uppercase font-black">Bajos</span>
              </div>
              <span className="text-xl font-mono font-black text-ink">{lowResourcesCount}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {hasError && (
        <div className="bg-red-950/40 border border-red-500/50 p-3 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg mb-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      {/* 2. OPERATIONAL GRID - 3 COLUMNS */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        {/* COL 1: OPERACIONES DE CAMPO (EXPLORACIONES) */}
        <section className="md:col-span-4 flex flex-col gap-4 overflow-hidden h-full">
          <div className="archive-panel p-4 rounded-lg flex-1 flex flex-col overflow-hidden shadow-2xl bg-[#12100d]">
            <div className="flex items-center justify-between mb-4 border-b border-[#d4a373]/20 pb-2 shrink-0">
              <h2 className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest flex items-center gap-2">
                <Compass className="h-4 w-4" /> Operaciones de Campo
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {[...activeExplorations, ...scheduledExplorations].map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-bg-paper paper-texture border-2 border-[#8b7355]/20 rounded-sm shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#8b7355]/30" />
                  <div className="flex flex-col min-w-0 flex-1 mr-4">
                    <span className="text-sm font-mono font-black text-ink truncate uppercase">
                      {exp.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className={`h-1 w-1 rounded-full ${exp.status === "active" || exp.status === "in_progress" ? "bg-[#43523d]" : "bg-[#89633e]"}`}
                      />
                      <span
                        className={`text-sm font-black uppercase tracking-widest ${exp.status === "active" || exp.status === "in_progress" ? "text-[#43523d]" : "text-[#89633e]"}`}
                      >
                        {exp.status === "active" || exp.status === "in_progress"
                          ? "EN CURSO"
                          : "PROGRAMADA"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/travel-manager/expeditions")}
                    className="text-xs font-mono font-black text-ink/40 border border-ink/10 px-2.5 py-1 rounded-sm hover:bg-black/5 transition-all shrink-0 uppercase"
                  >
                    Ficha
                  </button>
                </div>
              ))}
              {activeExplorations.length === 0 && scheduledExplorations.length === 0 && (
                <p className="text-center py-10 text-sm font-mono text-white/20 uppercase tracking-widest">
                  Sin operaciones registradas
                </p>
              )}
            </div>

            <button
              onClick={() => navigate("/travel-manager/expeditions")}
              className="mt-4 w-full py-2 border border-dashed border-[#d4a373]/30 text-sm font-mono font-black text-[#d4a373]/60 hover:text-[#d4a373] hover:border-[#d4a373] transition-all uppercase rounded shrink-0"
            >
              Ver todas las exploraciones
            </button>
          </div>

          {/* EQUIPO DISPONIBLE */}
          <div className="archive-panel p-4 rounded-lg h-[35%] shrink-0 flex flex-col overflow-hidden bg-[#15120e]">
            <h2 className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#d4a373]/20 pb-2 shrink-0">
              <Users className="h-4 w-4" /> Resumen de Equipo
            </h2>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-paper paper-texture border-2 border-[#8b7355]/20 p-3 rounded-sm text-center shadow-md">
                  <span className="block text-sm font-mono text-ink/40 uppercase mb-0.5 font-black tracking-widest">
                    En Base
                  </span>
                  <span className="text-2xl font-mono font-black text-ink">--</span>
                </div>
                <div className="bg-bg-paper paper-texture border-2 border-[#8b7355]/20 p-3 rounded-sm text-center shadow-md">
                  <span className="block text-sm font-mono text-ink/40 uppercase mb-0.5 font-black tracking-widest">
                    En Campo
                  </span>
                  <span className="text-2xl font-mono font-black text-[#89633e]">--</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/travel-manager/personnel")}
                className="w-full py-3 bg-[#b69e7e]/5 border border-[#b69e7e]/20 rounded-sm text-sm font-mono font-black text-white/60 hover:text-[#d4a373] hover:bg-[#b69e7e]/10 transition-all uppercase flex items-center justify-center gap-2 group"
              >
                Ver equipo y personas
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* COL 2: TRANSFERENCIAS Y SOLICITUDES */}
        <section className="md:col-span-4 flex flex-col gap-4 overflow-hidden h-full">
          {/* PANEL: EN MOVIMIENTO */}
          <div className="archive-panel p-4 rounded-lg flex-1 flex flex-col overflow-hidden bg-[#110e0c]">
            <h2 className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest mb-3 border-b border-[#d4a373]/20 pb-2 flex items-center gap-2 shrink-0">
              <Target className="h-4 w-4" /> Transferencias Activas
            </h2>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 cursor-default flex flex-col">
              {transitTransfers.map((t) => (
                <div
                  key={t.id}
                  className="bg-black/60 border border-[#d4a373]/10 p-3 rounded flex items-center justify-between hover:border-[#d4a373]/40 transition-all group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-mono font-bold text-white/90 uppercase tracking-tight truncate">
                      {getCampName(t.camp_origin_id)} → {getCampName(t.camp_destination_id)}
                    </span>
                    <span className="text-sm font-mono text-accent-approved uppercase font-black tracking-widest">
                      En Tránsito
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/travel-manager/transfers")}
                      className="bg-[#d4a373] text-black px-4 py-2.5 rounded text-xs font-mono font-black uppercase hover:bg-white transition-all shadow-lg active:scale-95"
                    >
                      LLEGADA
                    </button>
                    <button
                      aria-label="Contactar por radio"
                      className="text-[#d4a373]/40 hover:text-[#d4a373] transition-colors p-1"
                    >
                      <Radio className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {transitTransfers.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-[#d4a373]/10 rounded bg-black/20">
                  <Target className="h-8 w-8 text-white/5 mb-3" />
                  <span className="text-sm font-mono font-black text-white/10 uppercase tracking-[0.2em]">
                    Sin transferencias activas
                  </span>
                  <button
                    onClick={() => navigate("/travel-manager/transfers")}
                    className="mt-4 text-sm font-mono font-black text-[#d4a373] hover:text-[#fca311] uppercase border border-[#d4a373]/40 px-4 py-2.5 rounded transition-all bg-[#d4a373]/5"
                  >
                    Nueva solicitud
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PANEL: APROBACIONES PENDIENTES */}
          <div className="archive-panel p-4 rounded-lg h-[45%] shrink-0 flex flex-col overflow-hidden bg-[#15120e]">
            <h2 className="text-sm font-mono font-black text-accent-critical uppercase tracking-widest mb-3 border-b border-accent-critical/30 pb-2 flex items-center gap-2 shrink-0">
              <AlertTriangle className="h-4 w-4" /> Aprobaciones
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
              {pendingRequests.map((p) => (
                <div
                  key={p.id}
                  className="bg-bg-paper paper-texture border-2 border-[#8b7355]/20 p-4 rounded-sm shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute -top-1 -right-1 opacity-10">
                    <AlertTriangle className="h-10 w-10 text-accent-critical" />
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-mono font-black text-ink uppercase truncate leading-tight">
                        {getCampName(p.camp_origin_id)} → {getCampName(p.camp_destination_id)}
                      </span>
                      <span className="text-sm font-mono text-ink/40 font-black uppercase mt-0.5 tracking-widest">
                        Protocolo de Asignación
                      </span>
                    </div>
                    <div className="px-2 py-0.5 border border-[#632a2a]/30 bg-[#632a2a]/10 rotate-2">
                      <span className="text-sm font-mono font-black text-[#632a2a] uppercase leading-none">
                        ALTA
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4 text-xs font-mono font-black text-ink/30 border-y border-ink/5 py-1.5">
                    <span className="uppercase">
                      {p.type === "resources"
                        ? "RECURSOS"
                        : p.type === "people"
                          ? "PERSONAL"
                          : "MIXTO"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/travel-manager/transfers")}
                      className="flex-1 bg-[#43523d] text-white py-2 text-xs font-mono font-black uppercase rounded shadow-md hover:bg-white hover:text-[#43523d] transition-all active:scale-95"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => navigate("/travel-manager/transfers")}
                      className="flex-1 bg-ink/5 text-ink/60 border border-ink/10 py-2 text-xs font-mono font-black uppercase rounded hover:bg-ink hover:text-[#fca311] transition-all"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-black/10 rounded border border-dashed border-white/5">
                  <ShieldCheck className="h-10 w-10 mb-2 text-accent-approved opacity-20" />
                  <p className="text-sm font-mono font-black uppercase tracking-[0.2em] text-white/20 leading-tight">
                    Canal de solicitudes <br /> sin actividad
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* COL 3: INSUMOS, ACCIONES Y LOG (25%) */}
        <section className="md:col-span-4 flex flex-col gap-4 overflow-hidden h-full">
          {/* ESTADO DE INSUMOS */}
          <div className="archive-panel p-4 rounded-lg flex-1 flex flex-col overflow-hidden bg-[#12110f]">
            <h2 className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest mb-4 border-b border-[#d4a373]/20 pb-2 flex items-center gap-2 shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-[#c27c2f]" /> Recursos Críticos
            </h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5">
              {expeditionSupplies.map((res, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono font-black text-white uppercase tracking-tight">
                      {res.name}
                    </span>
                    <span
                      className={`text-sm font-black uppercase ${res.color} px-2 py-0.5 rounded-sm border border-white/10 shadow-md rotate-1`}
                    >
                      {res.status}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/40 border border-white/10 rounded-full overflow-hidden p-[1px] shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${res.level}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full shadow-[0_0_10px_rgba(212,163,115,0.1)] ${
                        res.level < 30
                          ? "bg-accent-critical"
                          : res.level < 60
                            ? "bg-[#c27c2f]"
                            : "bg-[#d4a373]"
                      }`}
                    />
                  </div>
                </div>
              ))}
              {expeditionSupplies.length === 0 && (
                <p className="text-center py-4 text-sm font-mono text-white/20 uppercase tracking-widest">
                  Sin recursos registrados
                </p>
              )}

              <button
                onClick={() => navigate("/travel-manager/inventory")}
                className="w-full mt-3 py-2 border border-[#d4a373]/20 text-xs font-mono font-black text-[#d4a373]/60 hover:text-[#d4a373] hover:border-[#d4a373]/40 transition-all uppercase rounded bg-black/20"
              >
                Revisar todos los recursos
              </button>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS - Tácticas */}
          <div className="shrink-0 grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/travel-manager/expeditions")}
                className="group text-black p-4 rounded flex flex-col justify-between hover:bg-white transition-all shadow-xl active:scale-95 h-24"
                style={{ backgroundColor: "#c27c2f" }}
              >
                <Compass className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                <div className="text-left">
                  <span className="font-typewriter font-black uppercase text-sm block leading-tight">
                    Preparar Exploración
                  </span>
                  <span className="text-sm font-mono font-black uppercase opacity-60 block tracking-widest mt-0.5">
                    Protocolo POST
                  </span>
                </div>
              </button>
              <button
                onClick={() => navigate("/travel-manager/transfers")}
                className="archive-panel group text-[#d4a373] p-4 rounded flex flex-col justify-between hover:border-white/40 transition-all shadow-md active:scale-95 h-24"
                style={{ backgroundColor: "#1f1d19" }}
              >
                <MessageSquare className="h-5 w-5" />
                <div className="text-left">
                  <span className="font-typewriter font-black uppercase text-sm block leading-tight">
                    Nueva Solicitud
                  </span>
                  <span className="text-sm font-mono font-black uppercase text-[#d4a373]/50 block tracking-widest mt-0.5">
                    Enlace Logístico
                  </span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => navigate("/travel-manager/transfers")}
                className="bg-black/40 border border-[#d4a373]/20 py-2.5 rounded text-sm font-mono font-black text-white/80 hover:text-[#d4a373] hover:border-[#d4a373]/40 transition-all uppercase"
              >
                Ver Pendientes
              </button>
              <button
                onClick={() => navigate("/travel-manager/transfers")}
                className="bg-black/40 border border-[#d4a373]/20 py-2.5 rounded text-sm font-mono font-black text-white/80 hover:text-[#d4a373] hover:border-[#d4a373]/40 transition-all uppercase"
              >
                Registrar Llegada
              </button>
              <button
                onClick={() => navigate("/travel-manager/inventory")}
                className="bg-black/40 border border-[#d4a373]/20 py-2.5 rounded text-sm font-mono font-black text-white/80 hover:text-[#d4a373] hover:border-[#d4a373]/40 transition-all uppercase"
              >
                Revisar Recursos
              </button>
            </div>
          </div>

          {/* SYSTEM LOGS */}
          <div className="archive-panel p-4 rounded-lg h-[22%] shrink-0 flex flex-col overflow-hidden bg-[#1a1815]">
            <h3 className="text-xs font-mono font-black uppercase opacity-40 mb-3 flex items-center gap-2 shrink-0 text-[#d4a373]">
              <History className="h-3 w-3" /> Bitácora
            </h3>
            <div className="flex-1 overflow-hidden space-y-2">
              {[
                { time: "14:22", log: "Exploración confirmada" },
                { time: "13:58", log: "Llegada registrada" },
                { time: "12:40", log: "Solicitud aprobada" },
              ].map((log, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-center border-b border-white/5 pb-1.5 last:border-0"
                >
                  <span className="text-sm font-mono text-white/40 shrink-0">{log.time}</span>
                  <p className="text-sm font-mono font-bold text-white/80 uppercase truncate">
                    {log.log}
                  </p>
                </div>
              ))}
              <button className="w-full text-center text-sm font-mono font-black text-white/20 hover:text-[#d4a373] transition-colors mt-1 uppercase">
                Ver historial
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
