import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  createMovement,
  getInventory,
  getMovements,
  runDailyProcess,
  updateInventoryItem,
} from "@/features/inventory/services/inventory.service"
import type { CreateMovementBody } from "@/features/inventory/services/inventory.service"
import type { InventoryItem, InventoryMovement } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./Resources.css"

type InventoryRow = {
  id: number
  resourceId: string
  name: string
  quantity: number
  minimumStock: number
  unit: string
  status: "OK" | "ADVERTENCIA" | "CRÍTICO"
  alertActive: boolean
}

const getStatus = (item: InventoryItem): InventoryRow["status"] => {
  if (item.alert_active) return "CRÍTICO"
  if (
    item.minimum_stock_required > 0 &&
    item.current_quantity <= item.minimum_stock_required * 1.25
  ) {
    return "ADVERTENCIA"
  }
  return "OK"
}

const MOVEMENT_TYPES = ["addition", "removal", "adjustment", "transfer"]
const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  addition: "ENTRADA",
  removal: "SALIDA",
  adjustment: "AJUSTE",
  transfer: "TRASLADO",
}

type ModalType = "movement" | "adjust-stock" | "history" | "daily-confirm" | null

export default function Resources() {
  const { activeCampId, camps } = useCamp()
  
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [formResourceId, setFormResourceId] = useState("")
  const [formQuantity, setFormQuantity] = useState("")
  const [formMovementType, setFormMovementType] = useState("addition")
  const [formDescription, setFormDescription] = useState("")
  const [formMinStock, setFormMinStock] = useState("")
  const [isDailyRunning, setIsDailyRunning] = useState(false)
  const [dailyResult, setDailyResult] = useState<"ok" | "error" | null>(null)

  const campName = camps.find((c) => c.id === activeCampId)?.name ?? "Campamento"

  const { data: items = [], isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ["adminResources", activeCampId],
    queryFn: async () => {
      if (!activeCampId) return []
      return await getInventory(activeCampId)
    },
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
  })

  const isLoading = queryLoading && items.length === 0
  const error = queryError ? "No se pudo cargar el inventario." : ""

  const reload = () => refetch()

  const rows = useMemo<InventoryRow[]>(
    () =>
      items.map((item, index) => ({
        id: index + 1,
        resourceId: item.resource_id,
        name: item.resource?.name ?? "N/D",
        quantity: Number(item.current_quantity),
        minimumStock: Number(item.minimum_stock_required),
        unit: item.resource?.unit ?? "",
        status: getStatus(item),
        alertActive: item.alert_active,
      })),
    [items],
  )

  const openMovement = (row?: InventoryRow) => {
    setFormResourceId(row?.resourceId ?? "")
    setFormQuantity("")
    setFormMovementType("addition")
    setFormDescription("")
    setFormError("")
    setSelectedRow(row ?? null)
    setActiveModal("movement")
  }

  const openAdjustStock = (row: InventoryRow) => {
    setFormMinStock(String(row.minimumStock))
    setFormError("")
    setSelectedRow(row)
    setActiveModal("adjust-stock")
  }

  const openHistory = async () => {
    setActiveModal("history")
    try {
      const data = await getMovements(activeCampId, 30)
      setMovements(data)
    } catch {
      setMovements([])
    }
  }

  const closeAll = () => {
    setActiveModal(null)
    setSelectedRow(null)
    setFormError("")
    setDailyResult(null)
  }

  const handleDailyProcess = async () => {
    setIsDailyRunning(true)
    setDailyResult(null)
    try {
      await runDailyProcess(activeCampId)
      setDailyResult("ok")
      reload()
    } catch {
      setDailyResult("error")
    } finally {
      setIsDailyRunning(false)
    }
  }

  const handleMovement = async () => {
    if (!formResourceId) {
      setFormError("Selecciona un recurso.")
      return
    }
    if (!formQuantity || Number(formQuantity) <= 0) {
      setFormError("La cantidad debe ser mayor a 0.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      const body: CreateMovementBody = {
        camp_id: Number(activeCampId),
        resource_id: Number(formResourceId),
        quantity: Number(formQuantity),
        type: formMovementType,
        description: formDescription.trim() || undefined,
      }
      await createMovement(body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo registrar el movimiento.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdjustStock = async () => {
    if (!selectedRow) return
    if (formMinStock === "" || Number(formMinStock) < 0) {
      setFormError("El stock mínimo debe ser un número positivo.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      await updateInventoryItem(activeCampId, selectedRow.resourceId, {
        minimum_stock_required: Number(formMinStock),
      })
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo actualizar el stock mínimo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="generic-container resources-page">
      <div className="section-header">
        <h2>MANIFIESTO DE ALMACÉN — {campName.toUpperCase()}</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="action-btn-secondary" onClick={() => void openHistory()}>
            HISTORIAL
          </button>
          <button
            className="action-btn-secondary"
            onClick={() => {
              setDailyResult(null)
              setActiveModal("daily-confirm")
            }}
          >
            PROCESO DIARIO
          </button>
          <button className="action-btn-primary" onClick={() => openMovement()}>
            + REGISTRAR MOVIMIENTO
          </button>
        </div>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      {isLoading ? (
        <div className="loading-msg">CARGANDO INVENTARIO...</div>
      ) : (
        <motion.div
          className="inventory-sheet"
          initial={{ y: 80, opacity: 0, rotate: -1 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 50 }}
        >
          <div className="sheet-header">
            <div>DEPÓSITO CENTRAL // RED ENLAZADA</div>
            <div>HOJA 1/1</div>
          </div>
          <div className="table-scroll-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DESCRIPCIÓN</th>
                  <th>CANTIDAD</th>
                  <th>STOCK MÍN.</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              >
                {rows.map((item) => (
                  <motion.tr
                    key={item.id}
                    className={`row-${item.status === "CRÍTICO" ? "critical" : item.status === "ADVERTENCIA" ? "warning" : "ok"}`}
                    variants={{
                      hidden: { opacity: 0, x: -16 },
                      show: { opacity: 1, x: 0 },
                    }}
                  >
                    <td>{String(item.id).padStart(4, "0")}</td>
                    <td>{item.name}</td>
                    <td>
                      {item.quantity} {item.unit}
                    </td>
                    <td>
                      {item.minimumStock} {item.unit}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${item.status === "CRÍTICO" ? "critical" : item.status === "ADVERTENCIA" ? "warning" : "ok"}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="table-action-btn" onClick={() => openMovement(item)}>
                          MOVIMIENTO
                        </button>
                        <button className="table-action-btn" onClick={() => openAdjustStock(item)}>
                          AJUSTAR
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", opacity: 0.5 }}>
                      SIN INVENTARIO REGISTRADO
                    </td>
                  </tr>
                ) : null}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {activeModal === "movement" ? (
          <motion.div
            className="modal-overlay"
            key="movement-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAll}
          >
            <motion.div
              className="modal-card"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>REGISTRAR MOVIMIENTO</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">RECURSO *</label>
                    <select
                      className="vintage-input full-width"
                      value={formResourceId}
                      onChange={(e) => setFormResourceId(e.target.value)}
                    >
                      <option value="">Seleccionar recurso...</option>
                      {rows.map((r) => (
                        <option key={r.resourceId} value={r.resourceId}>
                          {r.name} ({r.quantity} {r.unit} disponibles)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">TIPO DE MOVIMIENTO</label>
                    <select
                      className="vintage-input full-width"
                      value={formMovementType}
                      onChange={(e) => setFormMovementType(e.target.value)}
                    >
                      {MOVEMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {MOVEMENT_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CANTIDAD *</label>
                    <input
                      type="number"
                      min="1"
                      className="vintage-input full-width"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">DESCRIPCIÓN (opcional)</label>
                    <input
                      className="vintage-input full-width"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Razón del movimiento..."
                    />
                  </div>
                  {formError ? <div className="form-error">{formError}</div> : null}
                </div>
              </div>
              <div className="modal-actions">
                <button className="action-btn-secondary" onClick={closeAll}>
                  CANCELAR
                </button>
                <button
                  className="action-btn-primary"
                  onClick={() => void handleMovement()}
                  disabled={isSaving}
                >
                  {isSaving ? "REGISTRANDO..." : "REGISTRAR"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal === "adjust-stock" && selectedRow ? (
          <motion.div
            className="modal-overlay"
            key="adjust-stock-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAll}
          >
            <motion.div
              className="modal-card"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>AJUSTAR STOCK MÍNIMO</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">RECURSO</span>
                  <span className="detail-value">{selectedRow.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">CANTIDAD ACTUAL</span>
                  <span className="detail-value">
                    {selectedRow.quantity} {selectedRow.unit}
                  </span>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">
                      STOCK MÍNIMO REQUERIDO ({selectedRow.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="vintage-input full-width"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                    />
                  </div>
                </div>
                {formError ? (
                  <div className="form-error" style={{ marginTop: 16 }}>
                    {formError}
                  </div>
                ) : null}
              </div>
              <div className="modal-actions">
                <button className="action-btn-secondary" onClick={closeAll}>
                  CANCELAR
                </button>
                <button
                  className="action-btn-primary"
                  onClick={() => void handleAdjustStock()}
                  disabled={isSaving}
                >
                  {isSaving ? "GUARDANDO..." : "CONFIRMAR AJUSTE"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal === "daily-confirm" ? (
          <motion.div
            className="modal-overlay"
            key="daily-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAll}
          >
            <motion.div
              className="modal-card"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>PROCESO DIARIO</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {dailyResult === null ? (
                  <p className="confirm-text">
                    Ejecutar el proceso diario de consumo y producción de recursos para{" "}
                    <strong>{campName}</strong>. Esta operación actualizará los niveles de
                    inventario según la población activa del campamento.
                  </p>
                ) : dailyResult === "ok" ? (
                  <p className="confirm-text" style={{ color: "var(--accent-approved)" }}>
                    ✓ Proceso diario ejecutado correctamente. El inventario ha sido actualizado.
                  </p>
                ) : (
                  <p className="confirm-text" style={{ color: "var(--accent-critical)" }}>
                    ✕ No se pudo ejecutar el proceso diario. Verifica la conexión e intenta de
                    nuevo.
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <button className="action-btn-secondary" onClick={closeAll}>
                  {dailyResult ? "CERRAR" : "CANCELAR"}
                </button>
                {!dailyResult ? (
                  <button
                    className="action-btn-primary"
                    onClick={() => void handleDailyProcess()}
                    disabled={isDailyRunning}
                  >
                    {isDailyRunning ? "EJECUTANDO..." : "CONFIRMAR PROCESO"}
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal === "history" ? (
          <motion.div
            className="modal-overlay"
            key="history-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAll}
          >
            <motion.div
              className="modal-card modal-card-wide"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>HISTORIAL DE MOVIMIENTOS</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {movements.length === 0 ? (
                  <p className="loading-msg" style={{ padding: 0 }}>
                    SIN MOVIMIENTOS REGISTRADOS
                  </p>
                ) : (
                  <div className="movements-list">
                    {movements.map((m) => (
                      <div key={m.id} className="movement-row">
                        <div className="mv-type">
                          {MOVEMENT_TYPE_LABELS[m.type] ?? m.type.toUpperCase()}
                        </div>
                        <div className="mv-resource">
                          {m.resource?.name ?? `Recurso #${m.resource_id}`}
                        </div>
                        <div className="mv-quantity">
                          {m.quantity} {m.resource?.unit ?? ""}
                        </div>
                        <div className="mv-date">{m.date ? m.date.split("T")[0] : "N/D"}</div>
                        {m.description ? <div className="mv-desc">{m.description}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="action-btn-secondary" onClick={closeAll}>
                  CERRAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
