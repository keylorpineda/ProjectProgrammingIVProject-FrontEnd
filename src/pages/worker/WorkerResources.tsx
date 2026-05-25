import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import { useInventory, useInventoryMovements, useCamp, useInventoryStatus } from "@/features/worker/hooks/useWorkerAPI"
import type { InventoryItem } from "@/types/worker.api.types"
import "./WorkerViews.css"

const MOVEMENT_LABELS: Record<string, string> = {
  addition:    "ENTRADA",
  removal:     "SALIDA",
  adjustment:  "AJUSTE",
  transfer:    "TRASLADO",
  consumption: "CONSUMO",
  production:  "PRODUCCIÓN",
}

const CATEGORY_ICON: Record<string, string> = {
  food:     "🌽",
  water:    "💧",
  medicine: "💊",
  tools:    "🔧",
  weapons:  "⚔️",
  fuel:     "⛽",
  clothing: "👕",
}

const getStatus = (item: InventoryItem): "ok" | "warning" | "critical" => {
  if (item.alert_active) return "critical"
  if (item.current_quantity < item.minimum_stock_required * 1.25) return "warning"
  return "ok"
}

const STATUS_LABELS: Record<string, string> = { ok: "NORMAL", warning: "ESCASO", critical: "CRÍTICO" }

const STATUS_COLORS: Record<string, string> = {
  ok:       "var(--accent-approved)",
  warning:  "var(--accent-warning)",
  critical: "var(--accent-critical)",
}

function StockBar({ item, index }: { item: InventoryItem & { status: string }; index: number }) {
  const max = Math.max(item.minimum_stock_required * 2, item.current_quantity, 1)
  const pct = Math.min((item.current_quantity / max) * 100, 100)
  const minPct = (item.minimum_stock_required / max) * 100
  const icon = CATEGORY_ICON[item.resource?.category ?? ""] ?? "📦"
  const color = STATUS_COLORS[item.status]

  return (
    <motion.div
      className="wv-resource-row"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 160 }}
    >
      {/* Icon + name */}
      <div className="wv-res-icon">{icon}</div>
      <div className="wv-res-info">
        <div className="wv-res-name">
          {item.resource?.name ?? `#${item.resource_id}`}
          {item.status === "critical" ? (
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="wv-res-alert-dot"
            >
              ●
            </motion.span>
          ) : null}
        </div>
        <div className="wv-res-category">
          {item.resource?.category?.toUpperCase() ?? "—"}
        </div>
      </div>

      {/* Qty + bar */}
      <div className="wv-res-bar-zone">
        <div className="wv-res-qty-row">
          <span style={{ color, fontWeight: "bold" }}>
            {item.current_quantity}
          </span>
          <span className="wv-res-unit">{item.resource?.unit ?? ""}</span>
          <span className="wv-res-min-label">/ mín {item.minimum_stock_required}</span>
        </div>
        <div className="wv-res-bar-track">
          {/* minimum marker */}
          <div
            className="wv-res-bar-min"
            style={{ left: `${minPct}%` }}
          />
          <motion.div
            className="wv-res-bar-fill"
            style={{ background: color, boxShadow: `0 0 6px ${color}40` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: index * 0.04 }}
          />
        </div>
      </div>

      {/* Badge */}
      <span className={`wv-badge wv-badge-${item.status}`} style={{ minWidth: 72, textAlign: "center" }}>
        {STATUS_LABELS[item.status]}
      </span>
    </motion.div>
  )
}

export default function WorkerResources() {
  const { user } = useAuth()
  const { data: inventory } = useInventory(user?.camp_id)
  const { data: movements } = useInventoryMovements(user?.camp_id, 20)
  const { data: campData } = useCamp(user?.camp_id)
  const { stats } = useInventoryStatus(user?.camp_id)
  const campName = campData?.camp?.name ?? `CAMPAMENTO #${user?.camp_id ?? "?"}`

  const rows = (inventory ?? []).map((item, i) => ({
    ...item,
    rowNum: i + 1,
    status: getStatus(item),
  }))

  const criticalCount = rows.filter((r) => r.status === "critical").length
  const warningCount  = rows.filter((r) => r.status === "warning").length
  const okCount       = rows.filter((r) => r.status === "ok").length

  return (
    <div className="wv-page">
      <div className="wv-page-header">
        <h2>MANIFIESTO DE ALMACÉN</h2>
        <span className="wv-breadcrumb">{campName}</span>
      </div>

      {/* ── CRITICAL ALERT ──────────────────────────────────────── */}
      <AnimatePresence>
        {criticalCount > 0 ? (
          <motion.div
            className="wv-alert-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ⚠ ALERTA — {criticalCount} RECURSO(S) EN ESTADO CRÍTICO
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── STAT CARDS ─────────────────────────────────────────── */}
      <div className="wv-res-stat-row">
        <motion.div
          className="wv-res-stat-card"
          style={{ borderColor: "var(--accent-approved)" }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 160 }}
        >
          <div className="wv-res-stat-num" style={{ color: "var(--accent-approved)" }}>
            {okCount}
          </div>
          <div className="wv-res-stat-label">NORMALES</div>
          <div className="wv-res-stat-icon">✓</div>
        </motion.div>
        <motion.div
          className="wv-res-stat-card"
          style={{ borderColor: "var(--accent-warning)" }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.10, type: "spring", stiffness: 160 }}
        >
          <div className="wv-res-stat-num" style={{ color: "var(--accent-warning)" }}>
            {warningCount}
          </div>
          <div className="wv-res-stat-label">ESCASOS</div>
          <div className="wv-res-stat-icon">⚡</div>
        </motion.div>
        <motion.div
          className="wv-res-stat-card"
          style={{ borderColor: "var(--accent-critical)" }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 160 }}
        >
          <motion.div
            className="wv-res-stat-num"
            style={{ color: "var(--accent-critical)" }}
            animate={criticalCount > 0 ? { opacity: [1, 0.4, 1] } : {}}
            transition={criticalCount > 0 ? { duration: 1.2, repeat: Infinity } : {}}
          >
            {criticalCount}
          </motion.div>
          <div className="wv-res-stat-label">CRÍTICOS</div>
          <div className="wv-res-stat-icon">☠</div>
        </motion.div>
        <motion.div
          className="wv-res-stat-card"
          style={{ borderColor: "var(--panel-border-bright)" }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.20, type: "spring", stiffness: 160 }}
        >
          <div className="wv-res-stat-num" style={{ color: "var(--text-amber)" }}>
            {stats?.total ?? rows.length}
          </div>
          <div className="wv-res-stat-label">TOTAL ÍTEMS</div>
          <div className="wv-res-stat-icon">📦</div>
        </motion.div>
      </div>

      {/* ── INVENTORY BARS ──────────────────────────────────────── */}
      <motion.div
        className="wv-paper"
        style={{ padding: 24, marginBottom: 28 }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.15 }}
      >
        <h3 className="wv-section-title">
          DEPÓSITO CENTRAL — REGISTRO DE RECURSOS
          <span className="wv-section-count">{rows.length} ÍTEM(S)</span>
        </h3>

        <div className="wv-resource-list">
          {rows.length === 0 ? (
            <div className="wv-empty">SIN INVENTARIO REGISTRADO</div>
          ) : (
            rows.map((item, i) => <StockBar key={item.resource_id} item={item} index={i} />)
          )}
        </div>
      </motion.div>

      {/* ── MOVEMENT LOG ───────────────────────────────────────── */}
      {movements && movements.length > 0 ? (
        <motion.div
          className="wv-paper-dark"
          style={{ padding: 24 }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
        >
          <h3 className="wv-section-title">HISTORIAL DE MOVIMIENTOS</h3>
          <div className="wv-movement-list">
            {movements.map((m, i) => (
              <motion.div
                key={m.id ?? i}
                className="wv-movement-row"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <span
                  className="wv-mv-type"
                  style={{
                    color:
                      m.type === "removal" || m.type === "consumption"
                        ? "var(--accent-critical)"
                        : m.type === "addition" || m.type === "production"
                          ? "var(--accent-approved)"
                          : "var(--accent-warning)",
                  }}
                >
                  {MOVEMENT_LABELS[m.type] ?? m.type?.toUpperCase() ?? "MOV"}
                </span>
                <span className="wv-mv-resource">
                  {m.resource?.name ?? `Recurso #${m.resource_id}`}
                </span>
                <span
                  className="wv-mv-qty"
                  style={{
                    color:
                      m.quantity > 0 ? "var(--accent-approved)" : "var(--accent-critical)",
                  }}
                >
                  {m.quantity > 0 ? "+" : ""}
                  {m.quantity} {m.resource?.unit ?? ""}
                </span>
                <span className="wv-mv-date">{m.date ? String(m.date).split("T")[0] : "N/D"}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
