import { motion } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import { useInventory, useInventoryMovements } from "@/features/worker/hooks/useWorkerAPI"
import type { InventoryItem } from "@/types/worker.api.types"
import "./WorkerViews.css"

const MOVEMENT_LABELS: Record<string, string> = {
  addition: "ENTRADA",
  removal: "SALIDA",
  adjustment: "AJUSTE",
  transfer: "TRASLADO",
  consumption: "CONSUMO",
  production: "PRODUCCION",
}

const getStatus = (item: InventoryItem): "ok" | "warning" | "critical" => {
  if (item.alert_active) return "critical"
  if (item.current_quantity < item.minimum_stock_required * 1.25) return "warning"
  return "ok"
}

const STATUS_LABELS = { ok: "OK", warning: "ADVERTENCIA", critical: "CRÍTICO" }

export default function WorkerResources() {
  const { user } = useAuth()
  const { data: inventory } = useInventory(user?.camp_id)
  const { data: movements } = useInventoryMovements(user?.camp_id, 20)

  const rows = (inventory ?? []).map((item, i) => ({
    ...item,
    rowNum: i + 1,
    status: getStatus(item),
  }))

  return (
    <div className="wv-page">
      <div className="wv-page-header">
        <h2>MANIFIESTO DE ALMACÉN</h2>
        <span className="wv-breadcrumb">SECTOR {user?.camp_id ?? "?"} // INVENTARIO ACTUAL</span>
      </div>

      {rows.some((r) => r.status === "critical") ? (
        <div className="wv-alert-banner">
          ⚠ ALERTA — {rows.filter((r) => r.status === "critical").length} RECURSO(S) EN ESTADO
          CRÍTICO
        </div>
      ) : null}

      <motion.div
        className="wv-paper"
        style={{ padding: 24, marginBottom: 28 }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <h3 className="wv-section-title">DEPÓSITO CENTRAL — REGISTRO DE RECURSOS</h3>
        <div className="wv-table-wrapper">
          <table className="wv-table">
            <thead>
              <tr>
                <th>REF.</th>
                <th>DESCRIPCIÓN</th>
                <th>CANTIDAD</th>
                <th>MÍN. REQ.</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.resource_id} className={`wv-row-${item.status}`}>
                  <td>{String(item.rowNum).padStart(4, "0")}</td>
                  <td>
                    <strong>{item.resource?.name ?? `#${item.resource_id}`}</strong>
                  </td>
                  <td>
                    {item.current_quantity} {item.resource?.unit ?? ""}
                  </td>
                  <td>
                    {item.minimum_stock_required} {item.resource?.unit ?? ""}
                  </td>
                  <td>
                    <span className={`wv-badge wv-badge-${item.status}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="wv-empty">
                    SIN INVENTARIO REGISTRADO
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </motion.div>

      {movements && movements.length > 0 ? (
        <motion.div
          className="wv-paper-dark"
          style={{ padding: 24 }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
        >
          <h3 className="wv-section-title">HISTORIAL DE MOVIMIENTOS</h3>
          <div className="wv-movement-list">
            {movements.map((m, i) => (
              <div key={m.id ?? i} className="wv-movement-row">
                <span className="wv-mv-type">
                  {MOVEMENT_LABELS[m.type] ?? m.type?.toUpperCase() ?? "MOV"}
                </span>
                <span className="wv-mv-resource">
                  {m.resource?.name ?? `Recurso #${m.resource_id}`}
                </span>
                <span className="wv-mv-qty">
                  {m.quantity} {m.resource?.unit ?? ""}
                </span>
                <span className="wv-mv-date">{m.date ? String(m.date).split("T")[0] : "N/D"}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
