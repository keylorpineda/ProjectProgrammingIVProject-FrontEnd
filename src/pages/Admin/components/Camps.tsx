import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  createCamp,
  deleteCamp,
  getCampById,
  getCamps,
  updateCamp,
} from "@/features/camps/services/camps.service"
import type { CreateCampBody } from "@/features/camps/services/camps.service"
import type { Camp } from "@/types/api.types"
import { MapCoordPicker } from "@/features/map-test/components/MapCoordPicker"
import "./Camps.css"

type CampView = {
  id: string
  name: string
  capacity: number | string
  status: string
  coordinates: string
  active: boolean
  locationDescription: string | null
  latitude: number | null
  longitude: number | null
  foundationDate: string | null
}

const formatCoordinates = (camp: Camp): string => {
  if (camp.latitude != null && camp.longitude != null) {
    return `${Number(camp.latitude).toFixed(4)}, ${Number(camp.longitude).toFixed(4)}`
  }
  return camp.location_description ?? "N/D"
}

type ModalType = "detail" | "create" | "edit" | "delete" | null

interface CampFormProps {
  name: string
  setName: (v: string) => void
  locationDescription: string
  setLocationDescription: (v: string) => void
  latitude: string
  setLatitude: (v: string) => void
  longitude: string
  setLongitude: (v: string) => void
  maxCapacity: string
  setMaxCapacity: (v: string) => void
  foundationDate: string
  setFoundationDate: (v: string) => void
}

function CampForm({
  name,
  setName,
  locationDescription,
  setLocationDescription,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  maxCapacity,
  setMaxCapacity,
  foundationDate,
  setFoundationDate,
}: CampFormProps) {
  return (
    <div className="form-grid">
      <div className="form-group form-full">
        <label className="form-label">NOMBRE DEL CAMPAMENTO *</label>
        <input
          className="vintage-input full-width"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre identificador"
        />
      </div>
      <div className="form-group form-full">
        <label className="form-label">DESCRIPCIÓN DE UBICACIÓN</label>
        <input
          className="vintage-input full-width"
          value={locationDescription}
          onChange={(e) => setLocationDescription(e.target.value)}
          placeholder="Ej: Sector norte, zona boscosa..."
        />
      </div>
      <div className="form-group form-full">
        <label className="form-label">UBICACIÓN EN EL MAPA (CLICK PARA SELECCIONAR)</label>
        <MapCoordPicker
          lat={latitude ? Number(latitude) : null}
          lng={longitude ? Number(longitude) : null}
          onChange={(lat, lng) => {
            setLatitude(lat.toFixed(6))
            setLongitude(lng.toFixed(6))
          }}
        />
      </div>
      <div className="form-group">
        <label className="form-label">CAPACIDAD MÁXIMA</label>
        <input
          type="number"
          min="1"
          className="vintage-input full-width"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          placeholder="50"
        />
      </div>
      <div className="form-group">
        <label className="form-label">FECHA DE FUNDACIÓN</label>
        <input
          type="date"
          className="vintage-input full-width"
          value={foundationDate}
          onChange={(e) => setFoundationDate(e.target.value)}
        />
      </div>
    </div>
  )
}

export default function Camps() {
  const { data: camps = [], isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ["adminCamps"],
    queryFn: async () => await getCamps(),
    staleTime: 1000 * 60 * 2,
  })

  const isLoading = queryLoading && camps.length === 0
  const error = queryError ? "No se pudo cargar la red de campamentos." : ""

  const reload = () => refetch()

  const [selectedCamp, setSelectedCamp] = useState<CampView | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [formName, setFormName] = useState("")
  const [formLocationDescription, setFormLocationDescription] = useState("")
  const [formLatitude, setFormLatitude] = useState("")
  const [formLongitude, setFormLongitude] = useState("")
  const [formMaxCapacity, setFormMaxCapacity] = useState("")
  const [formFoundationDate, setFormFoundationDate] = useState("")


  const campViews = useMemo<CampView[]>(
    () =>
      camps.map((camp) => ({
        id: camp.id,
        name: camp.name,
        capacity: camp.max_capacity ?? "N/D",
        status: camp.active ? "EN LÍNEA" : "FUERA DE LÍNEA",
        coordinates: formatCoordinates(camp),
        active: camp.active,
        locationDescription: camp.location_description,
        latitude: camp.latitude,
        longitude: camp.longitude,
        foundationDate: camp.foundation_date,
      })),
    [camps],
  )

  const { data: selectedDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["adminCampDetail", selectedCamp?.id],
    queryFn: async () => {
      if (!selectedCamp) return null
      return await getCampById(selectedCamp.id)
    },
    enabled: !!selectedCamp && activeModal === "detail",
    staleTime: 1000 * 60 * 2,
  })

  const openCreate = () => {
    setFormName("")
    setFormLocationDescription("")
    setFormLatitude("")
    setFormLongitude("")
    setFormMaxCapacity("")
    setFormFoundationDate("")
    setFormError("")
    setActiveModal("create")
  }

  const openDetail = (camp: CampView) => {
    setSelectedCamp(camp)
    setActiveModal("detail")
  }

  const openEdit = (camp: CampView) => {
    setFormName(camp.name)
    setFormLocationDescription(camp.locationDescription ?? "")
    setFormLatitude(camp.latitude != null ? String(camp.latitude) : "")
    setFormLongitude(camp.longitude != null ? String(camp.longitude) : "")
    setFormMaxCapacity(camp.capacity !== "N/D" ? String(camp.capacity) : "")
    setFormFoundationDate(camp.foundationDate ? camp.foundationDate.split("T")[0] : "")
    setFormError("")
    setActiveModal("edit")
  }

  const closeAll = () => {
    setActiveModal(null)
    setSelectedCamp(null)
    setFormError("")
  }

  const handleCreate = async () => {
    if (!formName.trim()) {
      setFormError("El nombre del campamento es obligatorio.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      const body: CreateCampBody = {
        name: formName.trim(),
        location_description: formLocationDescription.trim() || undefined,
        latitude: formLatitude ? Number(formLatitude) : undefined,
        longitude: formLongitude ? Number(formLongitude) : undefined,
        max_capacity: formMaxCapacity ? Number(formMaxCapacity) : undefined,
        foundation_date: formFoundationDate || undefined,
      }
      await createCamp(body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo crear el campamento.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCamp || !formName.trim()) {
      setFormError("El nombre del campamento es obligatorio.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      await updateCamp(selectedCamp.id, {
        name: formName.trim(),
        location_description: formLocationDescription.trim() || undefined,
        latitude: formLatitude ? Number(formLatitude) : undefined,
        longitude: formLongitude ? Number(formLongitude) : undefined,
        max_capacity: formMaxCapacity ? Number(formMaxCapacity) : undefined,
        foundation_date: formFoundationDate || undefined,
      })
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo actualizar el campamento.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCamp) return
    setIsSaving(true)
    setFormError("")
    try {
      await deleteCamp(selectedCamp.id)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo desactivar el campamento.")
    } finally {
      setIsSaving(false)
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100 } },
  }

  return (
    <div className="generic-container camps-page">
      <div className="section-header">
        <h2>RED DE CAMPAMENTOS AUTORIZADOS</h2>
        <button className="action-btn-primary" onClick={openCreate}>
          + NUEVO CAMPAMENTO
        </button>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      {isLoading ? (
        <div className="loading-msg">CARGANDO RED...</div>
      ) : (
        <motion.div
          className="camps-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {campViews.map((camp) => (
            <motion.div
              key={camp.id}
              className={`camp-card ${!camp.active ? "offline" : ""}`}
              variants={itemVariants}
              whileHover={{ y: -8, boxShadow: "10px 10px 0 rgba(0,0,0,0.5)", cursor: "pointer" }}
              onClick={() => openDetail(camp)}
            >
              <div className={`c-status-indicator ${camp.active ? "online" : "offline-dot"}`} />
              <h3>{camp.name}</h3>
              <div className="c-info">
                <span>
                  <span className="c-info-label">CAPACIDAD MÁX.:</span> {camp.capacity}
                </span>
                <span>
                  <span className="c-info-label">COORDENADAS:</span> {camp.coordinates}
                </span>
              </div>
              <div className="c-stamp">{camp.status}</div>
            </motion.div>
          ))}
          {campViews.length === 0 ? (
            <div className="empty-state">SIN CAMPAMENTOS REGISTRADOS</div>
          ) : null}
        </motion.div>
      )}

      <AnimatePresence>
        {activeModal === "create" ? (
          <motion.div
            className="modal-overlay"
            key="create-camp"
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
                <h2>NUEVO CAMPAMENTO</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <CampForm
                  name={formName}
                  setName={setFormName}
                  locationDescription={formLocationDescription}
                  setLocationDescription={setFormLocationDescription}
                  latitude={formLatitude}
                  setLatitude={setFormLatitude}
                  longitude={formLongitude}
                  setLongitude={setFormLongitude}
                  maxCapacity={formMaxCapacity}
                  setMaxCapacity={setFormMaxCapacity}
                  foundationDate={formFoundationDate}
                  setFoundationDate={setFormFoundationDate}
                />
                {formError ? <div className="form-error">{formError}</div> : null}
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
                  {isSaving ? "CREANDO..." : "CREAR CAMPAMENTO"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal !== null && activeModal !== "create" && selectedCamp ? (
          <motion.div
            className="modal-overlay"
            key="camp-modal"
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
                    <h2>DETALLES DEL CAMPAMENTO</h2>
                    <button className="modal-close-btn" onClick={closeAll}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="detail-row">
                      <span className="detail-label">NOMBRE</span>
                      <span className="detail-value">{selectedCamp.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ESTADO</span>
                      <span className="detail-value">{selectedCamp.status}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">CAPACIDAD MÁX.</span>
                      <span className="detail-value">{selectedCamp.capacity}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">COORDENADAS</span>
                      <span className="detail-value">{selectedCamp.coordinates}</span>
                    </div>
                    {selectedCamp.foundationDate ? (
                      <div className="detail-row">
                        <span className="detail-label">FUNDACIÓN</span>
                        <span className="detail-value">
                          {selectedCamp.foundationDate.split("T")[0]}
                        </span>
                      </div>
                    ) : null}
                    <div
                      style={{
                        marginTop: "20px",
                        borderTop: "1px dashed var(--bg-paper-shadow)",
                        paddingTop: "16px",
                      }}
                    >
                      {isLoadingDetail ? (
                        <p className="loading-msg" style={{ padding: 0 }}>
                          CARGANDO INVENTARIO...
                        </p>
                      ) : selectedDetail ? (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">RECURSOS</span>
                            <span className="detail-value">
                              {selectedDetail.metrics.totalResources} tipos registrados
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">ALERTAS</span>
                            <span
                              className="detail-value"
                              style={{
                                color:
                                  selectedDetail.metrics.resourcesWithAlerts > 0
                                    ? "var(--accent-critical)"
                                    : "inherit",
                              }}
                            >
                              {selectedDetail.metrics.resourcesWithAlerts} activas
                            </span>
                          </div>
                          {selectedDetail.metrics.inventorySummary.length > 0 ? (
                            <div className="camp-inventory-list">
                              {selectedDetail.metrics.inventorySummary.slice(0, 6).map((item) => (
                                <div
                                  key={item.resource}
                                  className={`camp-inv-item ${item.alert ? "alert" : ""}`}
                                >
                                  <span>{item.resource}</span>
                                  <span>
                                    {item.quantity} {item.unit}
                                    {item.alert ? " ⚠" : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p style={{ opacity: 0.5, fontFamily: "var(--font-mono)" }}>
                          SIN DATOS DE INVENTARIO
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="action-btn-secondary" onClick={() => openEdit(selectedCamp)}>
                      EDITAR
                    </button>
                    <button
                      className="action-btn-danger"
                      onClick={() => {
                        setFormError("")
                        setActiveModal("delete")
                      }}
                    >
                      DESACTIVAR
                    </button>
                  </div>
                </>
              )}

              {activeModal === "edit" && (
                <>
                  <div className="modal-header">
                    <h2>EDITAR CAMPAMENTO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <CampForm
                      name={formName}
                      setName={setFormName}
                      locationDescription={formLocationDescription}
                      setLocationDescription={setFormLocationDescription}
                      latitude={formLatitude}
                      setLatitude={setFormLatitude}
                      longitude={formLongitude}
                      setLongitude={setFormLongitude}
                      maxCapacity={formMaxCapacity}
                      setMaxCapacity={setFormMaxCapacity}
                      foundationDate={formFoundationDate}
                      setFoundationDate={setFormFoundationDate}
                    />
                    {formError ? <div className="form-error">{formError}</div> : null}
                  </div>
                  <div className="modal-actions">
                    <button
                      className="action-btn-secondary"
                      onClick={() => setActiveModal("detail")}
                    >
                      CANCELAR
                    </button>
                    <button
                      className="action-btn-primary"
                      onClick={() => void handleEdit()}
                      disabled={isSaving}
                    >
                      {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                    </button>
                  </div>
                </>
              )}

              {activeModal === "delete" && (
                <>
                  <div className="modal-header">
                    <h2>DESACTIVAR CAMPAMENTO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <p className="confirm-text">
                      ¿Desactivar el campamento <strong>{selectedCamp.name}</strong>? El campamento
                      quedará fuera de línea.
                    </p>
                    {formError ? <div className="form-error">{formError}</div> : null}
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
                      onClick={() => void handleDelete()}
                      disabled={isSaving}
                    >
                      {isSaving ? "PROCESANDO..." : "CONFIRMAR BAJA"}
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
