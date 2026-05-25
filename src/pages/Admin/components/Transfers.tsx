import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  approveOrRejectTransfer,
  cancelTransfer,
  confirmTransferArrival,
  createTransferRequest,
  getCampTransfers,
} from "@/features/transfers/services/transfers.service"
import type {
  ApprovalBody,
  CreateTransferBody,
} from "@/features/transfers/services/transfers.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { getResources } from "@/features/inventory/services/inventory.service"
import type { IntercampRequest, Person, Resource } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import { TransferRouteMap } from "@/features/map-test/components/TransferRouteMap"
import "./Transfers.css"

type TransferView = {
  id: string
  statusKey: string
  status: string
  origin: string
  dest: string
  type: string
  resources: string[]
  people: string[]
  date: string
  notes: string | null
  raw: IntercampRequest
}

const TYPE_LABELS: Record<string, string> = {
  resources: "RECURSOS",
  people: "PERSONAS",
  both: "RECURSOS + PERSONAS",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDIENTE",
  approved: "APROBADO",
  completed: "COMPLETADO",
  rejected: "RECHAZADO",
  cancelled: "CANCELADO",
  in_transit: "EN TRÁNSITO",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#e8c44a",
  approved: "#4c6351",
  completed: "#4c6351",
  in_transit: "#c27c2f",
  rejected: "#9c2720",
  cancelled: "#555",
}

const formatDate = (value?: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

type ModalType = "detail" | "create" | "approve" | "reject" | null

interface ResourceRow {
  resource_id: string
  requested_quantity: string
}

interface PersonRow {
  person_id: string
  is_leader: boolean
}

export default function Transfers() {
  const { activeCampId, camps } = useCamp()
  
  const [availableResources, setAvailableResources] = useState<Resource[]>([])
  const [availablePersons, setAvailablePersons] = useState<Person[]>([])
  const [filterStatus, setFilterStatus] = useState("")
  const [selectedTransfer, setSelectedTransfer] = useState<TransferView | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [formDestId, setFormDestId] = useState("")
  const [formType, setFormType] = useState<"resources" | "people" | "both">("resources")
  const [formNotes, setFormNotes] = useState("")
  const [formTravelDays, setFormTravelDays] = useState("")
  const [formResourceRows, setFormResourceRows] = useState<ResourceRow[]>([
    { resource_id: "", requested_quantity: "" },
  ])
  const [formPersonRows, setFormPersonRows] = useState<PersonRow[]>([
    { person_id: "", is_leader: false },
  ])
  const [formApprovalNotes, setFormApprovalNotes] = useState("")

  const campById = useMemo(() => new Map(camps.map((c) => [c.id, c.name])), [camps])

  const { data: transfers = [], isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ["adminTransfers", activeCampId],
    queryFn: async () => {
      if (!activeCampId) return []
      return await getCampTransfers(activeCampId)
    },
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
  })

  const isLoading = queryLoading && transfers.length === 0
  const error = queryError ? "No se pudieron cargar las transferencias." : ""

  const reload = () => refetch()

  useEffect(() => {
    let isMounted = true
    void Promise.all([
      getResources({ limit: 100 }),
      getPersons({ campId: activeCampId, limit: 100 }),
    ])
      .then(([resources, persons]) => {
        if (!isMounted) return
        setAvailableResources(resources)
        setAvailablePersons(persons.data)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [activeCampId])

  const mappedTransfers = useMemo<TransferView[]>(
    () =>
      transfers.map((t) => {
        const statusKey = (t.status ?? "").toLowerCase().replace(/\s+/g, "_")
        const resourceLines =
          t.resourceDetails?.map((d) => {
            const name = d.resource?.name ?? `Recurso #${d.resource_id}`
            return `${name} × ${d.requested_quantity}`
          }) ?? []
        const peopleLines =
          t.personDetails?.map((d) => {
            const person = d.person
            const fullName = person
              ? [person.first_name, person.last_name].filter(Boolean).join(" ").trim()
              : ""
            const base = fullName || `Persona #${d.person_id}`
            return d.is_leader ? `${base} (Líder)` : base
          }) ?? []
        return {
          id: t.id,
          statusKey,
          status: STATUS_LABELS[statusKey] ?? t.status,
          origin: campById.get(t.camp_origin_id) ?? t.camp_origin_id,
          dest: campById.get(t.camp_destination_id) ?? t.camp_destination_id,
          type: TYPE_LABELS[t.type?.toLowerCase() ?? ""] ?? t.type?.toUpperCase() ?? "N/D",
          resources: resourceLines,
          people: peopleLines,
          date: formatDate(t.request_date),
          notes: t.notes,
          raw: t,
        }
      }),
    [transfers, campById],
  )

  const filteredTransfers = mappedTransfers.filter((t) => {
    if (filterStatus && t.statusKey !== filterStatus) return false
    return true
  })

  const openCreate = () => {
    setFormDestId("")
    setFormType("resources")
    setFormNotes("")
    setFormTravelDays("")
    setFormResourceRows([{ resource_id: "", requested_quantity: "" }])
    setFormPersonRows([{ person_id: "", is_leader: false }])
    setFormError("")
    setActiveModal("create")
  }

  const openDetail = (transfer: TransferView) => {
    setSelectedTransfer(transfer)
    setFormApprovalNotes("")
    setFormError("")
    setActiveModal("detail")
  }

  const closeAll = () => {
    setActiveModal(null)
    setSelectedTransfer(null)
    setFormError("")
  }

  const addResourceRow = () =>
    setFormResourceRows((prev) => [...prev, { resource_id: "", requested_quantity: "" }])

  const removeResourceRow = (index: number) =>
    setFormResourceRows((prev) => prev.filter((_, i) => i !== index))

  const updateResourceRow = (index: number, field: keyof ResourceRow, value: string) =>
    setFormResourceRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )

  const addPersonRow = () =>
    setFormPersonRows((prev) => [...prev, { person_id: "", is_leader: false }])

  const removePersonRow = (index: number) =>
    setFormPersonRows((prev) => prev.filter((_, i) => i !== index))

  const updatePersonRow = (index: number, field: keyof PersonRow, value: string | boolean) =>
    setFormPersonRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )

  const handleCreate = async () => {
    if (!formDestId) {
      setFormError("Selecciona el campamento de destino.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      const body: CreateTransferBody = {
        camp_origin_id: activeCampId,
        camp_destination_id: formDestId,
        type: formType,
        notes: formNotes.trim() || undefined,
        travel_days: formTravelDays ? Number(formTravelDays) : undefined,
      }
      if (formType === "resources" || formType === "both") {
        const validRows = formResourceRows.filter((r) => r.resource_id && r.requested_quantity)
        if (validRows.length === 0) {
          setFormError("Agrega al menos un recurso para transferir.")
          setIsSaving(false)
          return
        }
        body.resource_details = validRows.map((r) => ({
          resource_id: r.resource_id,
          requested_quantity: Number(r.requested_quantity),
        }))
      }
      if (formType === "people" || formType === "both") {
        const validPeople = formPersonRows.filter((p) => p.person_id)
        if (validPeople.length === 0) {
          setFormError("Agrega al menos una persona para trasladar.")
          setIsSaving(false)
          return
        }
        body.person_details = validPeople.map((p) => ({
          person_id: p.person_id,
          is_leader: p.is_leader,
        }))
      }
      await createTransferRequest(body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo crear la solicitud de traslado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedTransfer) return
    setIsSaving(true)
    setFormError("")
    try {
      const body: ApprovalBody = {
        status: "approved",
        notes: formApprovalNotes.trim() || undefined,
      }
      await approveOrRejectTransfer(selectedTransfer.id, body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo aprobar el traslado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedTransfer) return
    setIsSaving(true)
    setFormError("")
    try {
      const body: ApprovalBody = {
        status: "rejected",
        notes: formApprovalNotes.trim() || undefined,
      }
      await approveOrRejectTransfer(selectedTransfer.id, body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo rechazar el traslado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedTransfer) return
    setIsSaving(true)
    setFormError("")
    try {
      await cancelTransfer(selectedTransfer.id)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo cancelar el traslado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleArrive = async () => {
    if (!selectedTransfer) return
    setIsSaving(true)
    setFormError("")
    try {
      await confirmTransferArrival(selectedTransfer.id)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo confirmar la llegada.")
    } finally {
      setIsSaving(false)
    }
  }

  const otherCamps = camps.filter((c) => c.id !== activeCampId)

  return (
    <div className="generic-container transfers-page">
      <div className="section-header">
        <h2>MANIFIESTOS DE TRANSPORTE</h2>
        <button className="action-btn-primary" onClick={openCreate}>
          + NUEVO TRASLADO
        </button>
      </div>

      <div className="filters-bar">
        <select
          className="vintage-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ flex: "0 1 220px", minWidth: 0 }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      {isLoading ? (
        <div className="loading-msg">CARGANDO MANIFIESTOS...</div>
      ) : (
        <motion.div
          className="transfers-grid"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {filteredTransfers.map((transfer) => (
            <motion.div
              key={transfer.id}
              className="transfer-carbon-copy"
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 16 },
                show: { opacity: 1, scale: 1, y: 0 },
              }}
              whileHover={{ scale: 1.01, x: 6 }}
              onClick={() => openDetail(transfer)}
            >
              <div className="t-header">
                <span>TRASLADO #{transfer.id.slice(-8).toUpperCase()}</span>
                <span
                  className="t-status-badge"
                  style={{ color: STATUS_COLORS[transfer.statusKey] ?? "#aaa" }}
                >
                  [{transfer.status}]
                </span>
              </div>
              <div className="t-route">
                <span className="t-location">{transfer.origin}</span>
                <span className="t-arrow">➔</span>
                <span className="t-location">{transfer.dest}</span>
              </div>
              <div className="t-meta">
                <span>
                  <strong>TIPO:</strong> {transfer.type}
                </span>
                {transfer.resources.length > 0 ? (
                  <span>
                    <strong>CARGA:</strong> {transfer.resources.slice(0, 2).join(", ")}
                    {transfer.resources.length > 2 ? ` +${transfer.resources.length - 2} más` : ""}
                  </span>
                ) : null}
                {transfer.people.length > 0 ? (
                  <span>
                    <strong>PASAJEROS:</strong> {transfer.people.length}
                  </span>
                ) : null}
              </div>
              <div className="t-date">FECHA: {transfer.date}</div>
              <div className="t-watermark">{transfer.status}</div>
            </motion.div>
          ))}
          {filteredTransfers.length === 0 ? (
            <div className="empty-state">SIN TRASLADOS REGISTRADOS</div>
          ) : null}
        </motion.div>
      )}

      <AnimatePresence>
        {activeModal === "create" ? (
          <motion.div
            className="modal-overlay"
            key="create-transfer"
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
                <h2>NUEVA SOLICITUD DE TRASLADO</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">CAMPAMENTO DESTINO *</label>
                    <select
                      className="vintage-input full-width"
                      value={formDestId}
                      onChange={(e) => setFormDestId(e.target.value)}
                    >
                      <option value="">Seleccionar destino...</option>
                      {otherCamps.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group form-full">
                    <label className="form-label">TIPO DE TRASLADO</label>
                    <div className="radio-group">
                      {(["resources", "people", "both"] as const).map((t) => (
                        <label key={t} className="radio-label">
                          <input
                            type="radio"
                            value={t}
                            checked={formType === t}
                            onChange={() => setFormType(t)}
                          />
                          {TYPE_LABELS[t]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">DÍAS DE VIAJE</label>
                    <input
                      type="number"
                      min="1"
                      className="vintage-input full-width"
                      value={formTravelDays}
                      onChange={(e) => setFormTravelDays(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">NOTAS</label>
                    <input
                      className="vintage-input full-width"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Observaciones..."
                    />
                  </div>

                  {(formType === "resources" || formType === "both") && (
                    <div className="form-group form-full">
                      <label className="form-label">RECURSOS A TRANSFERIR</label>
                      <div className="resource-rows">
                        {formResourceRows.map((row, index) => (
                          <div key={index} className="resource-row">
                            <select
                              className="vintage-input"
                              value={row.resource_id}
                              onChange={(e) =>
                                updateResourceRow(index, "resource_id", e.target.value)
                              }
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <option value="">Seleccionar recurso...</option>
                              {availableResources.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.unit})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              className="vintage-input qty"
                              value={row.requested_quantity}
                              onChange={(e) =>
                                updateResourceRow(index, "requested_quantity", e.target.value)
                              }
                              placeholder="Cant."
                            />
                            {formResourceRows.length > 1 ? (
                              <button
                                className="remove-row-btn"
                                onClick={() => removeResourceRow(index)}
                              >
                                ✕
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <button className="add-row-btn" onClick={addResourceRow}>
                        + AGREGAR RECURSO
                      </button>
                    </div>
                  )}

                  {(formType === "people" || formType === "both") && (
                    <div className="form-group form-full">
                      <label className="form-label">PERSONAS A TRASLADAR</label>
                      <div className="resource-rows">
                        {formPersonRows.map((row, index) => (
                          <div key={index} className="resource-row">
                            <select
                              className="vintage-input"
                              value={row.person_id}
                              onChange={(e) => updatePersonRow(index, "person_id", e.target.value)}
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <option value="">Seleccionar persona...</option>
                              {availablePersons.map((p) => {
                                const fullName = [p.first_name, p.last_name]
                                  .filter(Boolean)
                                  .join(" ")
                                return (
                                  <option key={p.id} value={p.id}>
                                    {fullName}
                                  </option>
                                )
                              })}
                            </select>
                            <label className="leader-label">
                              <input
                                type="checkbox"
                                checked={row.is_leader}
                                onChange={(e) =>
                                  updatePersonRow(index, "is_leader", e.target.checked)
                                }
                              />
                              Líder
                            </label>
                            {formPersonRows.length > 1 ? (
                              <button
                                className="remove-row-btn"
                                onClick={() => removePersonRow(index)}
                              >
                                ✕
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <button className="add-row-btn" onClick={addPersonRow}>
                        + AGREGAR PERSONA
                      </button>
                    </div>
                  )}

                  {formError ? <div className="form-error">{formError}</div> : null}
                </div>
              </div>
              <div className="modal-actions">
                <button className="action-btn-secondary" onClick={closeAll}>
                  CANCELAR
                </button>
                <button
                  className="action-btn-primary"
                  onClick={() => void handleCreate()}
                  disabled={isSaving}
                >
                  {isSaving ? "ENVIANDO..." : "CREAR SOLICITUD"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {(activeModal === "detail" || activeModal === "approve" || activeModal === "reject") &&
        selectedTransfer ? (
          <motion.div
            className="modal-overlay"
            key="transfer-detail"
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
              {activeModal === "detail" && (
                <>
                  <div className="modal-header">
                    <h2>MANIFIESTO COMPLETO</h2>
                    <button className="modal-close-btn" onClick={closeAll}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="detail-row">
                      <span className="detail-label">ID</span>
                      <span className="detail-value">{selectedTransfer.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ESTADO</span>
                      <span
                        className="detail-value"
                        style={{ color: STATUS_COLORS[selectedTransfer.statusKey] ?? "inherit" }}
                      >
                        {selectedTransfer.status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">TIPO</span>
                      <span className="detail-value">{selectedTransfer.type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">RUTA</span>
                      <span className="detail-value">
                        {selectedTransfer.origin} ➔ {selectedTransfer.dest}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">FECHA</span>
                      <span className="detail-value">{selectedTransfer.date}</span>
                    </div>
                    {selectedTransfer.notes ? (
                      <div className="detail-row">
                        <span className="detail-label">NOTAS</span>
                        <span className="detail-value">{selectedTransfer.notes}</span>
                      </div>
                    ) : null}
                    {selectedTransfer.resources.length > 0 ? (
                      <div className="detail-row">
                        <span className="detail-label">CARGA</span>
                        <span className="detail-value">
                          {selectedTransfer.resources.map((r) => (
                            <div key={r}>{r}</div>
                          ))}
                        </span>
                      </div>
                    ) : null}
                    {selectedTransfer.people.length > 0 ? (
                      <div className="detail-row">
                        <span className="detail-label">PASAJEROS</span>
                        <span className="detail-value">
                          {selectedTransfer.people.map((p) => (
                            <div key={p}>{p}</div>
                          ))}
                        </span>
                      </div>
                    ) : null}
                    {(() => {
                      const originCamp = camps.find(
                        (c) => c.id === selectedTransfer.raw.camp_origin_id,
                      )
                      const destCamp = camps.find(
                        (c) => c.id === selectedTransfer.raw.camp_destination_id,
                      )
                      const fromCoords: [number, number] | null =
                        originCamp?.latitude != null && originCamp?.longitude != null
                          ? [Number(originCamp.latitude), Number(originCamp.longitude)]
                          : null
                      const toCoords: [number, number] | null =
                        destCamp?.latitude != null && destCamp?.longitude != null
                          ? [Number(destCamp.latitude), Number(destCamp.longitude)]
                          : null
                      if (!fromCoords || !toCoords) return null
                      return (
                        <TransferRouteMap
                          fromCoords={fromCoords}
                          toCoords={toCoords}
                          fromName={selectedTransfer.origin}
                          toName={selectedTransfer.dest}
                        />
                      )
                    })()}
                    {formError ? (
                      <div className="form-error" style={{ marginTop: 16 }}>
                        {formError}
                      </div>
                    ) : null}
                  </div>
                  <div className="modal-actions">
                    {selectedTransfer.statusKey === "pending" && (
                      <>
                        <button
                          className="action-btn-approve"
                          onClick={() => {
                            setFormApprovalNotes("")
                            setFormError("")
                            setActiveModal("approve")
                          }}
                        >
                          APROBAR
                        </button>
                        <button
                          className="action-btn-danger"
                          onClick={() => {
                            setFormApprovalNotes("")
                            setFormError("")
                            setActiveModal("reject")
                          }}
                        >
                          RECHAZAR
                        </button>
                        <button
                          className="action-btn-secondary"
                          onClick={() => void handleCancel()}
                          disabled={isSaving}
                        >
                          {isSaving ? "..." : "CANCELAR TRASLADO"}
                        </button>
                      </>
                    )}
                    {selectedTransfer.statusKey === "in_transit" && (
                      <button
                        className="action-btn-approve"
                        onClick={() => void handleArrive()}
                        disabled={isSaving}
                      >
                        {isSaving ? "CONFIRMANDO..." : "CONFIRMAR LLEGADA"}
                      </button>
                    )}
                    <button className="action-btn-secondary" onClick={closeAll}>
                      CERRAR
                    </button>
                  </div>
                </>
              )}

              {activeModal === "approve" && (
                <>
                  <div className="modal-header">
                    <h2>APROBAR TRASLADO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <label className="form-label">NOTAS DE APROBACIÓN (opcional)</label>
                        <textarea
                          className="vintage-input full-width"
                          rows={3}
                          value={formApprovalNotes}
                          onChange={(e) => setFormApprovalNotes(e.target.value)}
                          placeholder="Condiciones o comentarios..."
                        />
                      </div>
                      {formError ? <div className="form-error">{formError}</div> : null}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="action-btn-secondary"
                      onClick={() => setActiveModal("detail")}
                    >
                      CANCELAR
                    </button>
                    <button
                      className="action-btn-approve"
                      onClick={() => void handleApprove()}
                      disabled={isSaving}
                    >
                      {isSaving ? "APROBANDO..." : "CONFIRMAR APROBACIÓN"}
                    </button>
                  </div>
                </>
              )}

              {activeModal === "reject" && (
                <>
                  <div className="modal-header">
                    <h2>RECHAZAR TRASLADO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <label className="form-label">MOTIVO DE RECHAZO (opcional)</label>
                        <textarea
                          className="vintage-input full-width"
                          rows={3}
                          value={formApprovalNotes}
                          onChange={(e) => setFormApprovalNotes(e.target.value)}
                          placeholder="Razón del rechazo..."
                        />
                      </div>
                      {formError ? <div className="form-error">{formError}</div> : null}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="action-btn-secondary"
                      onClick={() => setActiveModal("detail")}
                    >
                      CANCELAR
                    </button>
                    <button
                      className="action-btn-danger"
                      onClick={() => void handleReject()}
                      disabled={isSaving}
                    >
                      {isSaving ? "RECHAZANDO..." : "CONFIRMAR RECHAZO"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
