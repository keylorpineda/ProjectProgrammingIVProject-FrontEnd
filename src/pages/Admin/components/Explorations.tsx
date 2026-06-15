import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

import { useCamp } from "../context/CampContext"

import type {
  CreateExplorationBody,
  ExplorationResourceBody,
  ReturnExplorationBody,
} from "@/features/explorations/services/explorations.service"
import type { Person, Resource } from "@/types/api.types"

import {
  cancelExploration,
  createExploration,
  departExploration,
  getExplorations,
  returnExploration,
} from "@/features/explorations/services/explorations.service"
import { getResources } from "@/features/inventory/services/inventory.service"
import { ExplorationZoneMap } from "@/features/map-test/components/ExplorationZoneMap"
import { getPersons } from "@/features/persons/services/persons.service"
import "./Explorations.css"

const STATUS_LABELS: Record<string, string> = {
  scheduled: "PROGRAMADA",
  in_progress: "EN CURSO",
  returned: "COMPLETADA",
  completed: "COMPLETADA",
  cancelled: "CANCELADA",
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#e8c44a",
  in_progress: "#c27c2f",
  returned: "#4c6351",
  completed: "#4c6351",
  cancelled: "#555",
}

const formatDate = (value?: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

interface ExplorationLog {
  id: string
  title: string
  date: string
  status: string
  statusKey: string
  duration: string
  group: string[]
  resources: string[]
  entry: string | null
}

interface PersonRow {
  person_id: string
  is_leader: boolean
}

interface ResourceRow {
  resource_id: string
  quantity: string
}

type ModalType = "detail" | "create" | "return" | "cancel-confirm" | null

export default function Explorations() {
  const { activeCampId, camps } = useCamp()

  const [availablePersons, setAvailablePersons] = useState<Person[]>([])
  const [availableResources, setAvailableResources] = useState<Resource[]>([])
  const [selectedLog, setSelectedLog] = useState<ExplorationLog | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [formName, setFormName] = useState("")
  const [formDestination, setFormDestination] = useState("")
  const [formDepartureDate, setFormDepartureDate] = useState("")
  const [formEstimatedDays, setFormEstimatedDays] = useState("")
  const [formGraceDays, setFormGraceDays] = useState("")
  const [formPersonRows, setFormPersonRows] = useState<PersonRow[]>([
    { person_id: "", is_leader: false },
  ])
  const [formOutResources, setFormOutResources] = useState<ResourceRow[]>([])

  const [formReturnDate, setFormReturnDate] = useState("")
  const [formReturnNotes, setFormReturnNotes] = useState("")
  const [formFoundResources, setFormFoundResources] = useState<ResourceRow[]>([])

  const {
    data: explorations = [],
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["adminExplorations", activeCampId],
    queryFn: async () => {
      if (!activeCampId) return []
      return await getExplorations({ campId: activeCampId })
    },
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
  })

  const isLoading = queryLoading && explorations.length === 0
  const error = queryError ? "No se pudieron cargar las exploraciones." : ""

  const reload = () => refetch()

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true
    void Promise.all([
      getPersons({ campId: activeCampId, limit: 100 }),
      getResources({ limit: 100 }),
    ])
      .then(([persons, resources]) => {
        if (!isMounted) return
        setAvailablePersons(persons.data)
        setAvailableResources(resources)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [activeCampId])

  const logs = useMemo<ExplorationLog[]>(
    () =>
      explorations.map((exploration) => {
        const group =
          exploration.explorationPersons?.map((member) => {
            const person = member.person
            if (!person) return member.person_id
            return (
              [person.first_name, person.last_name].filter(Boolean).join(" ").trim() ||
              member.person_id
            )
          }) ?? []

        const resourceLines =
          exploration.explorationResources
            ?.filter((item) => item.flow === "out")
            .map((item) => {
              const name = item.resource?.name ?? item.resource_id
              return `${name} × ${item.quantity}`
            }) ?? []

        const statusKey = (exploration.status ?? "").toLowerCase()
        return {
          id: exploration.id,
          title: exploration.name,
          date: formatDate(exploration.departure_date),
          status: STATUS_LABELS[statusKey] ?? exploration.status?.toUpperCase() ?? "N/D",
          statusKey,
          duration: `${exploration.estimated_days} DÍAS`,
          group,
          resources: resourceLines,
          entry: exploration.notes ?? exploration.destination_description,
        }
      }),
    [explorations],
  )

  const openCreate = () => {
    setFormName("")
    setFormDestination("")
    setFormDepartureDate("")
    setFormEstimatedDays("")
    setFormGraceDays("")
    setFormPersonRows([{ person_id: "", is_leader: false }])
    setFormOutResources([])
    setFormError("")
    setActiveModal("create")
  }

  const openDetail = (log: ExplorationLog) => {
    setSelectedLog(log)
    setFormError("")
    setActiveModal("detail")
  }

  const openReturn = () => {
    setFormReturnDate(new Date().toISOString().split("T")[0])
    setFormReturnNotes("")
    setFormFoundResources([])
    setFormError("")
    setActiveModal("return")
  }

  const closeAll = () => {
    setActiveModal(null)
    setSelectedLog(null)
    setFormError("")
  }

  const addPersonRow = () =>
    setFormPersonRows((prev) => [...prev, { person_id: "", is_leader: false }])

  const removePersonRow = (index: number) =>
    setFormPersonRows((prev) => prev.filter((_, i) => i !== index))

  const updatePersonRow = (index: number, field: keyof PersonRow, value: string | boolean) =>
    setFormPersonRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )

  const addOutResource = () =>
    setFormOutResources((prev) => [...prev, { resource_id: "", quantity: "" }])

  const removeOutResource = (index: number) =>
    setFormOutResources((prev) => prev.filter((_, i) => i !== index))

  const updateOutResource = (index: number, field: keyof ResourceRow, value: string) =>
    setFormOutResources((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )

  const addFoundResource = () =>
    setFormFoundResources((prev) => [...prev, { resource_id: "", quantity: "" }])

  const removeFoundResource = (index: number) =>
    setFormFoundResources((prev) => prev.filter((_, i) => i !== index))

  const updateFoundResource = (index: number, field: keyof ResourceRow, value: string) =>
    setFormFoundResources((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )

  const handleCreate = async () => {
    if (!formName.trim()) {
      setFormError("El nombre de la expedición es obligatorio.")
      return
    }
    if (!formDepartureDate) {
      setFormError("La fecha de salida es obligatoria.")
      return
    }
    if (!formEstimatedDays || Number(formEstimatedDays) < 1) {
      setFormError("Los días estimados deben ser al menos 1.")
      return
    }
    const validPersons = formPersonRows.filter((p) => p.person_id)
    if (validPersons.length === 0) {
      setFormError("Agrega al menos un integrante del equipo.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      const validResources: ExplorationResourceBody[] = formOutResources
        .filter((r) => r.resource_id && r.quantity)
        .map((r) => ({
          resource_id: Number(r.resource_id),
          flow: "out",
          quantity: Number(r.quantity),
        }))

      const body: CreateExplorationBody = {
        camp_id: Number(activeCampId),
        name: formName.trim(),
        destination_description: formDestination.trim(),
        departure_date: `${formDepartureDate}T00:00:00.000Z`,
        estimated_days: Number(formEstimatedDays),
        grace_days: formGraceDays ? Number(formGraceDays) : undefined,
        persons: validPersons.map((p) => ({
          person_id: Number(p.person_id),
          is_leader: Boolean(p.is_leader),
        })),
        resources: validResources.length > 0 ? validResources : undefined,
      }

      await createExploration(body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo crear la expedición.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDepart = async () => {
    if (!selectedLog) return
    setIsSaving(true)
    setFormError("")
    try {
      await departExploration(selectedLog.id)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo marcar la salida.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReturn = async () => {
    if (!selectedLog) return
    if (!formReturnDate) {
      setFormError("La fecha de regreso es obligatoria.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      const foundResources: ExplorationResourceBody[] = formFoundResources
        .filter((r) => r.resource_id && r.quantity)
        .map((r) => ({
          resource_id: Number(r.resource_id),
          flow: "in",
          quantity: Number(r.quantity),
        }))

      const body: ReturnExplorationBody = {
        real_return_date: formReturnDate,
        notes: formReturnNotes.trim() || undefined,
        found_resources: foundResources.length > 0 ? foundResources : undefined,
      }
      await returnExploration(selectedLog.id, body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo registrar el regreso.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedLog) return
    setIsSaving(true)
    setFormError("")
    try {
      await cancelExploration(selectedLog.id)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo cancelar la expedición.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="generic-container explorations-page">
      <div className="section-header">
        <h2>BITÁCORAS DE CAMPO</h2>
        <button className="action-btn-primary" onClick={openCreate}>
          + NUEVA EXPEDICIÓN
        </button>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      {isLoading ? (
        <div className="loading-msg">CARGANDO BITÁCORAS...</div>
      ) : (
        <div className="journals-container">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              className="field-journal-page"
              initial={{ scale: 0.85, opacity: 0, rotate: -12, y: 80 }}
              animate={{ scale: 1, opacity: 1, rotate: index % 2 === 0 ? -1 : 2, y: 0 }}
              transition={{ type: "spring", stiffness: 80, delay: index * 0.12 }}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
              onClick={() => openDetail(log)}
              style={{ cursor: "pointer" }}
            >
              <div className="journal-holes">
                <div className="hole" />
                <div className="hole" />
                <div className="hole" />
                <div className="hole" />
              </div>
              <div className="journal-content">
                <h3 className="journal-title">
                  {log.title}
                  <span
                    className="journal-status"
                    style={{ color: STATUS_COLORS[log.statusKey] ?? "#000" }}
                  >
                    [{log.status}]
                  </span>
                </h3>
                <div className="j-date">
                  SALIDA: {log.date} | {log.duration}
                </div>
                <div className="j-details">
                  <div>
                    <strong>EQUIPO:</strong> {log.group.join(", ") || "N/D"}
                  </div>
                  {log.resources.length > 0 ? (
                    <div>
                      <strong>RECURSOS LLEVADOS:</strong> {log.resources.join(", ")}
                    </div>
                  ) : null}
                </div>
                {log.entry ? <p className="j-entry">{log.entry}</p> : null}
                <div className="signature-line">
                  <span>FIRMA LÍDER DE ESCUADRÓN</span>
                  <div className="sign-marker">{log.group[0] ?? "—"}</div>
                </div>
              </div>
            </motion.div>
          ))}
          {logs.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              SIN EXPEDICIONES REGISTRADAS
            </div>
          ) : null}
        </div>
      )}

      <AnimatePresence>
        {activeModal === "create" ? (
          <motion.div
            className="modal-overlay"
            key="create-exploration"
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
                <h2>NUEVA EXPEDICIÓN</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <div className="form-label">NOMBRE DE LA EXPEDICIÓN *</div>
                    <input
                      className="vintage-input full-width"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Exploración Sector Norte"
                    />
                  </div>
                  <div className="form-group form-full">
                    <div className="form-label">DESTINO / ZONA</div>
                    <input
                      className="vintage-input full-width"
                      value={formDestination}
                      onChange={(e) => setFormDestination(e.target.value)}
                      placeholder="Descripción de la zona objetivo..."
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">FECHA DE SALIDA *</div>
                    <input
                      type="date"
                      className="vintage-input full-width"
                      value={formDepartureDate}
                      onChange={(e) => setFormDepartureDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">DÍAS ESTIMADOS *</div>
                    <input
                      type="number"
                      min="1"
                      className="vintage-input full-width"
                      value={formEstimatedDays}
                      onChange={(e) => setFormEstimatedDays(e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">DÍAS DE GRACIA</div>
                    <input
                      type="number"
                      min="0"
                      className="vintage-input full-width"
                      value={formGraceDays}
                      onChange={(e) => setFormGraceDays(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-group form-full">
                    <label htmlFor="field-equipo-de-campo-482" className="form-label">
                      EQUIPO DE CAMPO *
                    </label>
                    <div className="resource-rows">
                      {formPersonRows.map((row, index) => (
                        <div key={index} className="resource-row">
                          <select
                            id="field-equipo-de-campo-482"
                            className="vintage-input"
                            value={row.person_id}
                            onChange={(e) => updatePersonRow(index, "person_id", e.target.value)}
                            style={{ flex: 1, minWidth: 0 }}
                          >
                            <option value="">Seleccionar integrante...</option>
                            {availablePersons.map((p) => (
                              <option key={p.id} value={p.id}>
                                {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                              </option>
                            ))}
                          </select>
                          <label className="leader-label-expl">
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
                      + AGREGAR INTEGRANTE
                    </button>
                  </div>

                  <div className="form-group form-full">
                    <label htmlFor="field-526" className="form-label">
                      RECURSOS QUE LLEVAN (opcional)
                    </label>
                    {formOutResources.length > 0 ? (
                      <div className="resource-rows">
                        {formOutResources.map((row, index) => (
                          <div key={index} className="resource-row">
                            <select
                              id="field-526"
                              className="vintage-input"
                              value={row.resource_id}
                              onChange={(e) =>
                                updateOutResource(index, "resource_id", e.target.value)
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
                              value={row.quantity}
                              onChange={(e) => updateOutResource(index, "quantity", e.target.value)}
                              placeholder="Cant."
                            />
                            <button
                              className="remove-row-btn"
                              onClick={() => removeOutResource(index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button className="add-row-btn" onClick={addOutResource}>
                      + AGREGAR RECURSO
                    </button>
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
                  onClick={() => void handleCreate()}
                  disabled={isSaving}
                >
                  {isSaving ? "REGISTRANDO..." : "CREAR EXPEDICIÓN"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {(activeModal === "detail" ||
          activeModal === "return" ||
          activeModal === "cancel-confirm") &&
        selectedLog ? (
          <motion.div
            className="modal-overlay"
            key="exploration-detail"
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
                    <h2>BITÁCORA: {selectedLog.title}</h2>
                    <button className="modal-close-btn" onClick={closeAll}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="detail-row">
                      <span className="detail-label">ESTADO</span>
                      <span
                        className="detail-value"
                        style={{ color: STATUS_COLORS[selectedLog.statusKey] ?? "inherit" }}
                      >
                        {selectedLog.status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">FECHA SALIDA</span>
                      <span className="detail-value">{selectedLog.date}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">DURACIÓN</span>
                      <span className="detail-value">{selectedLog.duration}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">EQUIPO</span>
                      <span className="detail-value">
                        {selectedLog.group.length > 0
                          ? selectedLog.group.map((g) => <div key={g}>{g}</div>)
                          : "N/D"}
                      </span>
                    </div>
                    {selectedLog.resources.length > 0 ? (
                      <div className="detail-row">
                        <span className="detail-label">RECURSOS</span>
                        <span className="detail-value">
                          {selectedLog.resources.map((r) => (
                            <div key={r}>{r}</div>
                          ))}
                        </span>
                      </div>
                    ) : null}
                    {selectedLog.entry ? (
                      <div className="detail-row">
                        <span className="detail-label">NOTAS</span>
                        <span className="detail-value">{selectedLog.entry}</span>
                      </div>
                    ) : null}
                    {(() => {
                      const activeCamp = camps.find((c) => c.id === activeCampId)
                      const originCoords: [number, number] | null =
                        activeCamp?.latitude != null && activeCamp?.longitude != null
                          ? [Number(activeCamp.latitude), Number(activeCamp.longitude)]
                          : null
                      if (!originCoords) return null
                      const rawExploration = explorations.find((e) => e.id === selectedLog.id)
                      return (
                        <ExplorationZoneMap
                          originCoords={originCoords}
                          originName={activeCamp?.name ?? "BASE"}
                          destinationLabel={rawExploration?.destination_description ?? ""}
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
                    {selectedLog.statusKey === "scheduled" && (
                      <>
                        <button
                          className="action-btn-primary"
                          onClick={() => void handleDepart()}
                          disabled={isSaving}
                        >
                          {isSaving ? "..." : "MARCAR SALIDA"}
                        </button>
                        <button
                          className="action-btn-danger"
                          onClick={() => {
                            setFormError("")
                            setActiveModal("cancel-confirm")
                          }}
                        >
                          CANCELAR EXPEDICIÓN
                        </button>
                      </>
                    )}
                    {selectedLog.statusKey === "in_progress" && (
                      <button className="action-btn-approve" onClick={openReturn}>
                        REGISTRAR REGRESO
                      </button>
                    )}
                    <button className="action-btn-secondary" onClick={closeAll}>
                      CERRAR
                    </button>
                  </div>
                </>
              )}

              {activeModal === "return" && (
                <>
                  <div className="modal-header">
                    <h2>REGISTRAR REGRESO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <div className="form-label">FECHA DE REGRESO *</div>
                        <input
                          type="date"
                          className="vintage-input full-width"
                          value={formReturnDate}
                          onChange={(e) => setFormReturnDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group form-full">
                        <label htmlFor="field-notas-del-regreso-732" className="form-label">
                          NOTAS DEL REGRESO
                        </label>
                        <textarea
                          id="field-notas-del-regreso-732"
                          className="vintage-input full-width"
                          rows={3}
                          value={formReturnNotes}
                          onChange={(e) => setFormReturnNotes(e.target.value)}
                          placeholder="Observaciones del retorno..."
                        />
                      </div>
                      <div className="form-group form-full">
                        <label htmlFor="field-742" className="form-label">
                          RECURSOS ENCONTRADOS (opcional)
                        </label>
                        {formFoundResources.length > 0 ? (
                          <div className="resource-rows">
                            {formFoundResources.map((row, index) => (
                              <div key={index} className="resource-row">
                                <select
                                  id="field-742"
                                  className="vintage-input"
                                  value={row.resource_id}
                                  onChange={(e) =>
                                    updateFoundResource(index, "resource_id", e.target.value)
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
                                  value={row.quantity}
                                  onChange={(e) =>
                                    updateFoundResource(index, "quantity", e.target.value)
                                  }
                                  placeholder="Cant."
                                />
                                <button
                                  className="remove-row-btn"
                                  onClick={() => removeFoundResource(index)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <button className="add-row-btn" onClick={addFoundResource}>
                          + AGREGAR RECURSO ENCONTRADO
                        </button>
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
                      onClick={() => void handleReturn()}
                      disabled={isSaving}
                    >
                      {isSaving ? "REGISTRANDO..." : "CONFIRMAR REGRESO"}
                    </button>
                  </div>
                </>
              )}

              {activeModal === "cancel-confirm" && (
                <>
                  <div className="modal-header">
                    <h2>CANCELAR EXPEDICIÓN</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <p className="confirm-text">
                      ¿Cancelar la expedición <strong>{selectedLog.title}</strong>? Esta acción no
                      puede deshacerse.
                    </p>
                    {formError ? <div className="form-error">{formError}</div> : null}
                  </div>
                  <div className="modal-actions">
                    <button
                      className="action-btn-secondary"
                      onClick={() => setActiveModal("detail")}
                    >
                      VOLVER
                    </button>
                    <button
                      className="action-btn-danger"
                      onClick={() => void handleCancel()}
                      disabled={isSaving}
                    >
                      {isSaving ? "CANCELANDO..." : "CONFIRMAR CANCELACIÓN"}
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
