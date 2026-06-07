import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useState } from "react"
import {
  Compass,
  AlertTriangle,
  AlertCircle,
  ArrowRightLeft,
  Radio,
  Users,
  Package,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { getCamps } from "@/features/camps/services/camps.service"
import { getExplorations } from "@/features/explorations/services/explorations.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"
import { useAuthStore } from "@/store/useAuthStore"


// ── Resource fill class ──────────────────────────────────────────────────────
function resFillClass(level: number) {
  if (level < 30) return "tm-fill-critical"
  if (level < 60) return "tm-fill-warning"
  return "tm-fill-ok"
}

// ── Animated resource bar ────────────────────────────────────────────────────
function ResourceBar({ name, level, isLow }: { name: string; level: number; isLow: boolean }) {
  return (
    <div className="tm-res-row">
      <div className="tm-res-header">
        <span>{name}</span>
        <span className={`tm-badge ${isLow ? "tm-badge-critical" : "tm-badge-ok"}`}>
          {isLow ? "Bajo" : "OK"}
        </span>
      </div>
      <div className="tm-res-track">
        <motion.div
          className={`tm-res-fill ${resFillClass(level)}`}
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TravelDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [leftTab, setLeftTab] = useState<"pending" | "transit">("pending")
  const [rightTab, setRightTab] = useState<"explorations" | "resources">("explorations")

  const baseCampId = user?.camp_id ? String(user.camp_id) : ""

  // ── Data queries ───────────────────────────────────────────────────────────
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

  const { data: personsResponse } = useQuery({
    queryKey: ["persons", baseCampId],
    queryFn: () => getPersons({ campId: baseCampId, limit: 1000 }),
    enabled: !!baseCampId,
  })
  const persons = personsResponse?.data ?? []

  // ── Computed values ────────────────────────────────────────────────────────
  const inBaseCount = persons.filter((p) => {
    const key = String(p.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "active" || key === "idle"
  }).length

  const inFieldCount = persons.filter((p) => {
    const key = String(p.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "exploring"
  }).length

  const hasError = campsError || expError || transfersError || invError

  const baseCamp = camps.find((c) => String(c.id) === baseCampId)

  const activeExplorations = explorations.filter((e) => {
    const key = String(e.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "active" || key === "in_progress"
  })
  const scheduledExplorations = explorations.filter((e) => {
    const key = String(e.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "scheduled"
  })

  const transitTransfers = transfers.filter((t) => {
    const key = String(t.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "in_transit" || key === "approved"
  })
  const pendingRequests = transfers.filter((t) => {
    const key = String(t.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "pending"
  })

  const lowResourcesCount = inventory.filter((r) => r.alert_active).length

  const expeditionSupplies = inventory
    .map((item) => ({
      name: item.resource?.name || "Recurso",
      level: Math.min(
        (item.current_quantity / Math.max(item.minimum_stock_required, 1)) * 100,
        100,
      ),
      isLow: item.alert_active,
    }))
    .slice(0, 6)

  const getCampName = (id: string | number) =>
    camps.find((c) => String(c.id) === String(id))?.name || `Base #${id}`

  // ── Pinned metric cards ────────────────────────────────────────────────────
  const metricCards = [
    {
      title: "Exploraciones en curso",
      value: activeExplorations.length,
      label: "equipos desplegados",
      pin: "tm-pin-amber",
      rotate: -1.5,
    },
    {
      title: "Solicitudes pendientes",
      value: pendingRequests.length,
      label: "requieren aprobación",
      pin: pendingRequests.length > 0 ? "tm-pin-red" : "tm-pin-green",
      rotate: -2,
    },
    {
      title: "Recursos bajos",
      value: lowResourcesCount,
      label: "bajo el mínimo",
      pin: lowResourcesCount > 0 ? "tm-pin-red" : "tm-pin-green",
      rotate: -0.5,
    },
    {
      title: "Equipo en campo",
      value: inFieldCount,
      label: `de ${inBaseCount + inFieldCount} en base`,
      pin: "tm-pin-amber",
      rotate: 2,
    },
  ]

  return (
    <div className="tm-dashboard">
      {/* ── BOARD HEADER ───────────────────────────────────────────────── */}
      <div className="tm-board-header">
        <div className="tm-board-left">
          <div className="tm-online-dot" />
          <div>
            <h2 className="tm-board-title">
              TABLERO — {baseCamp?.name?.toUpperCase() ?? `BASE ${baseCampId}`}
            </h2>
          </div>
        </div>
      </div>

      {/* ── ERROR BANNER ───────────────────────────────────────────────── */}
      {hasError && (
        <div className="tm-alert">
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>Error de conexión. Modo fuera de línea — datos recientes no disponibles.</span>
        </div>
      )}

      {/* ── CORK GRID — metric cards ────────────────────────────────────── */}
      <div className="tm-cork-grid">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.title}
            className="tm-pinned"
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: card.rotate, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: i * 0.08 }}
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
          >
            <div className={`tm-pin ${card.pin}`} />
            <h3 className="tm-card-title">{card.title}</h3>
            <div className="tm-big-number">{card.value}</div>
            <div className="tm-small-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── OPERATIONS DETAIL — two columns ───────────────────────────── */}
      <motion.div
        className="tm-operations"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 100 }}
      >
        {/* LEFT COLUMN: Mobility and Transfers Tabs */}
        <div className="tm-op-col">
          <div className="tm-folder-header-row">
            <h4 className="tm-folder-title">LOGÍSTICA DE TRASLADOS</h4>
            <div className="tm-folder-tabs">
              <button
                type="button"
                className={`tm-tab ${leftTab === "pending" ? "tm-tab-active" : ""}`}
                onClick={() => setLeftTab("pending")}
              >
                📥 PENDIENTES ({pendingRequests.length})
              </button>
              <button
                type="button"
                className={`tm-tab ${leftTab === "transit" ? "tm-tab-active" : ""}`}
                onClick={() => setLeftTab("transit")}
              >
                🚚 EN TRÁNSITO ({transitTransfers.length})
              </button>
            </div>
          </div>

          {leftTab === "pending" ? (
            <div className="tm-paper animate-fade-in" key="pending-panel">
              <div className="tm-section-row">
                <h3 className="tm-section-title">
                  <AlertTriangle style={{ width: 14, height: 14 }} />
                  Solicitudes Pendientes
                </h3>
                <span className="tm-section-count">{pendingRequests.length} PARA REVISAR</span>
              </div>

              <div className="tm-op-list">
                {pendingRequests.length === 0 ? (
                  <p className="tm-empty">Sin solicitudes pendientes</p>
                ) : (
                  pendingRequests.map((t) => (
                    <div key={t.id} className="tm-op-row tm-row-pending">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="tm-op-chip tm-chip-pending">PEND.</span>
                          <span className="tm-op-label font-mono font-bold text-xs uppercase tracking-wide">
                            {getCampName(t.camp_origin_id)} → {getCampName(t.camp_destination_id)}
                          </span>
                        </div>
                        <div className="text-[10px] tm-op-meta-sub font-mono uppercase tracking-wider pl-1">
                          Tipo: {t.type === "resources" ? "Recursos" : t.type === "people" ? "Personal" : "Mixto"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="tm-op-btn"
                        onClick={() => navigate("/travel-manager/transfers")}
                      >
                        Revisar
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="tm-action-btn tm-action-btn-primary"
                  style={{ flex: 1, padding: "10px 14px" }}
                  onClick={() => navigate("/travel-manager/transfers")}
                >
                  <span className="tm-action-label">Gestionar traslados</span>
                  <span className="tm-action-sub">Aprobar · Rechazar · Registrar</span>
                </button>
                <button
                  type="button"
                  className="tm-action-btn"
                  style={{ flex: 1, padding: "10px 14px" }}
                  onClick={() => navigate("/travel-manager/transfers", { state: { openNewTransfer: true } })}
                >
                  <Radio style={{ width: 14, height: 14 }} />
                  <span className="tm-action-label">Nueva solicitud</span>
                  <span className="tm-action-sub">Enlace logístico</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="tm-paper tm-paper-dark animate-fade-in" key="transit-panel">
              <div className="tm-section-row">
                <h3 className="tm-section-title">
                  <ArrowRightLeft style={{ width: 14, height: 14 }} />
                  Traslados en Tránsito
                </h3>
                <span className="tm-section-count">{transitTransfers.length} ACTIVOS</span>
              </div>

              <div className="tm-op-list">
                {transitTransfers.length === 0 ? (
                  <p className="tm-empty">Sin movimientos activos</p>
                ) : (
                  transitTransfers.map((t) => (
                    <div key={t.id} className="tm-op-row tm-row-transit">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="tm-op-chip tm-chip-transit">TRÁNS.</span>
                          <span className="tm-op-label font-mono font-bold text-xs uppercase tracking-wide">
                            {getCampName(t.camp_origin_id)} → {getCampName(t.camp_destination_id)}
                          </span>
                        </div>
                        <div className="text-[10px] tm-op-meta-sub font-mono uppercase tracking-wider pl-1">
                          Tipo: {t.type === "resources" ? "Recursos" : t.type === "people" ? "Personal" : "Mixto"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="tm-op-btn"
                        onClick={() => navigate("/travel-manager/transfers")}
                      >
                        Ver
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="tm-action-btn tm-action-btn-primary"
                  style={{ flex: 1, padding: "10px 14px" }}
                  onClick={() => navigate("/travel-manager/transfers")}
                >
                  <span className="tm-action-label">Ver Enlace de Traslados</span>
                  <span className="tm-action-sub">Monitorear mapa e historial</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Operations and Resources Tabs */}
        <div className="tm-op-col">
          <div className="tm-folder-header-row">
            <h4 className="tm-folder-title">OPERACIONES Y RECURSOS</h4>
            <div className="tm-folder-tabs">
              <button
                type="button"
                className={`tm-tab ${rightTab === "explorations" ? "tm-tab-active" : ""}`}
                onClick={() => setRightTab("explorations")}
              >
                🧭 EXPLORACIONES ({activeExplorations.length + scheduledExplorations.length})
              </button>
              <button
                type="button"
                className={`tm-tab ${rightTab === "resources" ? "tm-tab-active" : ""}`}
                onClick={() => setRightTab("resources")}
              >
                📦 RECURSOS ({lowResourcesCount > 0 ? `${lowResourcesCount} BAJOS` : "OK"})
              </button>
            </div>
          </div>

          {rightTab === "explorations" ? (
            <div className="tm-paper animate-fade-in" key="explorations-panel">
              <div className="tm-section-row">
                <h3 className="tm-section-title">
                  <Compass style={{ width: 14, height: 14 }} />
                  Operaciones de Campo
                </h3>
                <span className="tm-section-count">
                  {activeExplorations.length + scheduledExplorations.length} TOTAL
                </span>
              </div>

              <div className="tm-op-list">
                {activeExplorations.length === 0 && scheduledExplorations.length === 0 ? (
                  <p className="tm-empty">Sin operaciones registradas</p>
                ) : (
                  [...activeExplorations, ...scheduledExplorations].map((exp) => {
                    const key = String(exp.status ?? "").toLowerCase().replace(/\s+/g, "_")
                    const isActive = key === "active" || key === "in_progress"
                    return (
                      <div key={exp.id} className={`tm-op-row ${isActive ? "tm-row-active" : "tm-row-sched"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`tm-op-chip ${isActive ? "tm-chip-active" : "tm-chip-sched"}`}>
                              {isActive ? "Activa" : "Prog."}
                            </span>
                            <span className="tm-op-label font-mono font-bold text-xs uppercase tracking-wide">
                              {exp.name}
                            </span>
                          </div>
                          <div className="text-[10px] tm-op-meta-sub font-mono uppercase tracking-wider pl-1">
                            Campamento: {getCampName(exp.camp_id)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="tm-op-btn"
                          onClick={() => navigate("/travel-manager/expeditions")}
                        >
                          Ver
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="tm-action-btn"
                  style={{ flex: 1, padding: "10px 14px" }}
                  onClick={() => navigate("/travel-manager/expeditions")}
                >
                  <Compass style={{ width: 14, height: 14 }} />
                  <span className="tm-action-label">Preparar exploración</span>
                  <span className="tm-action-sub">Protocolo de salida</span>
                </button>
                <button
                  type="button"
                  className="tm-action-btn"
                  style={{ flex: 1, padding: "10px 14px" }}
                  onClick={() => navigate("/travel-manager/personnel")}
                >
                  <Users style={{ width: 14, height: 14 }} />
                  <span className="tm-action-label">Ver equipo</span>
                  <span className="tm-action-sub">
                    {inBaseCount} en base · {inFieldCount} en campo
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="tm-paper tm-paper-dark animate-fade-in" key="resources-panel">
              <div className="tm-section-row">
                <h3 className="tm-section-title">
                  <Package style={{ width: 14, height: 14 }} />
                  Estado de Recursos
                </h3>
                <span className="tm-section-count">
                  {lowResourcesCount > 0 ? `${lowResourcesCount} BAJOS` : "NIVELES OK"}
                </span>
              </div>

              <div className="tm-op-list">
                {expeditionSupplies.length === 0 ? (
                  <p className="tm-empty">Sin recursos registrados</p>
                ) : (
                  expeditionSupplies.map((res, i) => (
                    <ResourceBar key={i} name={res.name} level={res.level} isLow={res.isLow} />
                  ))
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="tm-action-btn tm-action-btn-primary"
                  style={{ flex: 1, padding: "10px 14px" }}
                  onClick={() => navigate("/travel-manager/inventory")}
                >
                  <span className="tm-action-label">Revisar inventario completo</span>
                  <span className="tm-action-sub">Verificar stocks de base</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
