import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"

import { useCamp } from "../context/CampContext"

import type {
  CreatePersonBody,
  UpdatePersonStatusBody,
} from "@/features/persons/services/persons.service"
import type { Profession } from "@/types/api.types"
import type { Variants } from "framer-motion"

import {
  createPerson,
  deletePerson,
  getProfessions,
  getPersons,
  updatePerson,
  updatePersonStatus,
} from "@/features/persons/services/persons.service"
import { ImageUploader } from "@/features/upload/components/ImageUploader"
import { uploadPersonImage } from "@/features/upload/services/upload.service"
import { PersonStatus } from "@/types/api.types"

import "./People.css"

type PersonView = {
  id: string
  name: string
  statusKey: string
  status: string
  profession: string
  professionId: string | null
  camp: string
  age: number | string
  birthDate: string | null
  firstName: string
  lastName: string
  lastName2: string | null
  notes: string | null
  previousSkills: string | null
  photoUrl: string | null
  idCardUrl: string | null
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  sick: "Enfermo",
  injured: "Herido",
  exploring: "Explorando",
  traveling: "En traslado",
  resting: "Reposo",
  idle: "Inactivo",
  out_of_camp: "Fuera de campamento",
  deceased: "Fallecido",
}

const calculateAge = (birthDate: string | null): number | "N/D" => {
  if (!birthDate) return "N/D"
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return "N/D"
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  return age >= 0 ? age : "N/D"
}

type ModalType = "detail" | "create" | "edit" | "status" | "delete" | null

interface PersonFormProps {
  firstName: string
  setFirstName: (v: string) => void
  lastName: string
  setLastName: (v: string) => void
  lastName2: string
  setLastName2: (v: string) => void
  birthDate: string
  setBirthDate: (v: string) => void
  professionId: string
  setProfessionId: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  skills: string
  setSkills: (v: string) => void
  professions: Profession[]
  photoUrl: string
  setPhotoUrl: (v: string) => void
  idCardUrl: string
  setIdCardUrl: (v: string) => void
}

function PersonForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  lastName2,
  setLastName2,
  birthDate,
  setBirthDate,
  professionId,
  setProfessionId,
  notes,
  setNotes,
  skills,
  setSkills,
  professions,
  photoUrl,
  setPhotoUrl,
  idCardUrl,
  setIdCardUrl,
}: PersonFormProps) {
  return (
    <div className="form-grid">
      <div className="form-group">
        <div className="form-label">NOMBRE *</div>
        <input
          className="vintage-input full-width"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Primer nombre"
        />
      </div>
      <div className="form-group">
        <div className="form-label">APELLIDO 1 *</div>
        <input
          className="vintage-input full-width"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Primer apellido"
        />
      </div>
      <div className="form-group">
        <div className="form-label">APELLIDO 2</div>
        <input
          className="vintage-input full-width"
          value={lastName2}
          onChange={(e) => setLastName2(e.target.value)}
          placeholder="Segundo apellido"
        />
      </div>
      <div className="form-group">
        <div className="form-label">FECHA DE NACIMIENTO</div>
        <input
          type="date"
          className="vintage-input full-width"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>
      <div className="form-group form-full">
        <label htmlFor="field-profesi-n-156" className="form-label">
          PROFESIÓN
        </label>
        <select
          id="field-profesi-n-156"
          className="vintage-input full-width"
          value={professionId}
          onChange={(e) => setProfessionId(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group form-full">
        <div className="form-label">HABILIDADES PREVIAS</div>
        <input
          className="vintage-input full-width"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Habilidades o experiencia anterior..."
        />
      </div>
      <div className="form-group form-full">
        <label htmlFor="field-notas-180" className="form-label">
          NOTAS
        </label>
        <textarea
          id="field-notas-180"
          className="vintage-input full-width"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones adicionales..."
        />
      </div>
      <ImageUploader
        label="FOTO DE PERFIL"
        currentUrl={photoUrl || null}
        onChange={setPhotoUrl}
        uploadFn={uploadPersonImage}
      />
      <ImageUploader
        label="CÉDULA / IDENTIFICACIÓN"
        currentUrl={idCardUrl || null}
        onChange={setIdCardUrl}
        uploadFn={uploadPersonImage}
      />
    </div>
  )
}

export default function People() {
  const { activeCampId, camps } = useCamp()

  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterText, setFilterText] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<PersonView | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [formFirstName, setFormFirstName] = useState("")
  const [formLastName, setFormLastName] = useState("")
  const [formLastName2, setFormLastName2] = useState("")
  const [formBirthDate, setFormBirthDate] = useState("")
  const [formProfessionId, setFormProfessionId] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formSkills, setFormSkills] = useState("")
  const [formPhotoUrl, setFormPhotoUrl] = useState("")
  const [formIdCardUrl, setFormIdCardUrl] = useState("")
  const [formStatus, setFormStatus] = useState<PersonStatus>(PersonStatus.Active)
  const [formStatusNotes, setFormStatusNotes] = useState("")

  const campById = useMemo(() => new Map(camps.map((c) => [c.id, c.name])), [camps])
  const {
    data: peopleData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["adminPeople", activeCampId, page],
    queryFn: async () => {
      if (!activeCampId) return { data: [], total: 0 }
      return await getPersons({ campId: activeCampId, page, limit: 10 })
    },
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
    // Keep the current page visible while the next one loads instead of
    // blanking the list on every page change.
    placeholderData: keepPreviousData,
  })

  const { data: professionsData } = useQuery({
    queryKey: ["adminProfessions"],
    queryFn: async () => await getProfessions(),
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const people = useMemo(() => peopleData?.data || [], [peopleData])
  const professions = professionsData || []
  const isLoading = queryLoading && people.length === 0
  const error = queryError ? "No se pudo cargar el listado de personas." : ""

  const reload = () => refetch()

  const mappedPeople = useMemo<PersonView[]>(
    () =>
      people.map((person) => {
        const name = [person.first_name, person.last_name, person.last_name2]
          .filter(Boolean)
          .join(" ")
          .trim()
        const statusKey = (person.status ?? "").toLowerCase()
        return {
          id: person.id,
          name: name || "N/D",
          statusKey,
          status: STATUS_LABELS[statusKey] ?? person.status ?? "N/D",
          profession: person.profession?.name ?? person.profession_id ?? "Sin profesión",
          professionId: person.profession_id,
          camp: campById.get(activeCampId) ?? activeCampId,
          age: calculateAge(person.birth_date),
          birthDate: person.birth_date,
          firstName: person.first_name,
          lastName: person.last_name,
          lastName2: person.last_name2,
          notes: person.notes,
          previousSkills: person.previous_skills,
          photoUrl: (person as { photo_url?: string }).photo_url ?? null,
          idCardUrl: (person as { id_card_url?: string }).id_card_url ?? null,
        }
      }),
    [people, campById, activeCampId],
  )

  const filteredPeople = mappedPeople.filter((person) => {
    if (filterStatus && person.statusKey !== filterStatus) return false
    if (filterText) {
      const needle = filterText.toLowerCase()
      if (
        !person.name.toLowerCase().includes(needle) &&
        !person.profession.toLowerCase().includes(needle)
      ) {
        return false
      }
    }
    return true
  })

  const openCreate = () => {
    setFormFirstName("")
    setFormLastName("")
    setFormLastName2("")
    setFormBirthDate("")
    setFormProfessionId("")
    setFormNotes("")
    setFormSkills("")
    setFormPhotoUrl("")
    setFormIdCardUrl("")
    setFormError("")
    setActiveModal("create")
  }

  const openDetail = (person: PersonView) => {
    setSelectedPerson(person)
    setActiveModal("detail")
  }

  const openEdit = (person: PersonView) => {
    setFormFirstName(person.firstName)
    setFormLastName(person.lastName)
    setFormLastName2(person.lastName2 ?? "")
    setFormBirthDate(person.birthDate ? person.birthDate.split("T")[0] : "")
    setFormProfessionId(person.professionId ?? "")
    setFormNotes(person.notes ?? "")
    setFormSkills(person.previousSkills ?? "")
    setFormPhotoUrl(person.photoUrl ?? "")
    setFormIdCardUrl(person.idCardUrl ?? "")
    setFormError("")
    setActiveModal("edit")
  }

  const openStatusChange = (person: PersonView) => {
    setFormStatus((person.statusKey as PersonStatus) || PersonStatus.Active)
    setFormStatusNotes("")
    setFormError("")
    setActiveModal("status")
  }

  const closeAll = () => {
    setActiveModal(null)
    setSelectedPerson(null)
    setFormError("")
  }

  const handleCreate = async () => {
    if (!formFirstName.trim() || !formLastName.trim()) {
      setFormError("Nombre y apellido son obligatorios.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      const body: CreatePersonBody = {
        first_name: formFirstName.trim(),
        last_name: formLastName.trim(),
        last_name2: formLastName2.trim() || undefined,
        birth_date: formBirthDate || undefined,
        profession_id: formProfessionId ? Number(formProfessionId) : undefined,
        camp_id: activeCampId ? Number(activeCampId) : undefined,
        notes: formNotes.trim() || undefined,
        previous_skills: formSkills.trim() || undefined,
        photo_url: formPhotoUrl || undefined,
        id_card_url: formIdCardUrl || undefined,
      }
      await createPerson(body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo registrar la persona. Verifica los datos.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedPerson || !formFirstName.trim() || !formLastName.trim()) {
      setFormError("Nombre y apellido son obligatorios.")
      return
    }
    setIsSaving(true)
    setFormError("")
    try {
      await updatePerson(selectedPerson.id, {
        first_name: formFirstName.trim(),
        last_name: formLastName.trim(),
        last_name2: formLastName2.trim() || undefined,
        birth_date: formBirthDate || undefined,
        profession_id: formProfessionId ? Number(formProfessionId) : undefined,
        notes: formNotes.trim() || undefined,
        previous_skills: formSkills.trim() || undefined,
        photo_url: formPhotoUrl || undefined,
        id_card_url: formIdCardUrl || undefined,
      })
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo actualizar la persona.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async () => {
    if (!selectedPerson) return
    setIsSaving(true)
    setFormError("")
    try {
      const body: UpdatePersonStatusBody = {
        status: formStatus,
        notes: formStatusNotes.trim() || undefined,
      }
      await updatePersonStatus(selectedPerson.id, body)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo actualizar el estado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPerson) return
    setIsSaving(true)
    setFormError("")
    try {
      await deletePerson(selectedPerson.id)
      closeAll()
      reload()
    } catch {
      setFormError("No se pudo eliminar la persona.")
    } finally {
      setIsSaving(false)
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24, rotate: -4 },
    show: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { type: "spring" as const, stiffness: 200 },
    },
  }

  return (
    <div className="people-container">
      <div className="section-header">
        <h2>DOSSIERS DEL SISTEMA {page > 1 ? `| PÁG. ${page}` : ""}</h2>
        <button className="action-btn-primary" onClick={openCreate}>
          + NUEVO REGISTRO
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="vintage-input"
          placeholder="Buscar por nombre o profesión"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ flex: "1 1 220px", minWidth: 0 }}
        />
        <select
          className="vintage-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ flex: "0 1 200px", minWidth: 0 }}
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
        <div className="loading-msg">CARGANDO DOSSIERS...</div>
      ) : (
        <motion.div
          className="dossier-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredPeople.map((person) => (
            <motion.div
              key={person.id}
              className="dossier-card"
              variants={cardVariants}
              whileHover={{ scale: 1.04, zIndex: 10 }}
              onClick={() => openDetail(person)}
            >
              <div className="dossier-photo-placeholder">
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "sepia(0.2)",
                    }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="var(--ink)" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                  </svg>
                )}
              </div>
              <div className="dossier-info">
                <div className="d-name">{person.name}</div>
                <div className="d-prof">{person.profession}</div>
                <div className="d-status">ESTADO: {person.status}</div>
                <div className="d-camp">CAMP: {person.camp}</div>
              </div>
            </motion.div>
          ))}
          {filteredPeople.length === 0 ? (
            <div className="empty-state">SIN REGISTROS ENCONTRADOS</div>
          ) : null}
        </motion.div>
      )}

      <div className="pagination-bar">
        <button
          className="action-btn-secondary"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          ← ANTERIOR
        </button>
        <span className="page-indicator">PÁG. {page}</span>
        <button
          className="action-btn-secondary"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={people.length < 10}
        >
          SIGUIENTE →
        </button>
      </div>

      <AnimatePresence>
        {activeModal === "create" ? (
          <motion.div
            className="modal-overlay"
            key="create-modal"
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
                <h2>NUEVO REGISTRO</h2>
                <button className="modal-close-btn" onClick={closeAll}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <PersonForm
                  firstName={formFirstName}
                  setFirstName={setFormFirstName}
                  lastName={formLastName}
                  setLastName={setFormLastName}
                  lastName2={formLastName2}
                  setLastName2={setFormLastName2}
                  birthDate={formBirthDate}
                  setBirthDate={setFormBirthDate}
                  professionId={formProfessionId}
                  setProfessionId={setFormProfessionId}
                  notes={formNotes}
                  setNotes={setFormNotes}
                  skills={formSkills}
                  setSkills={setFormSkills}
                  professions={professions}
                  photoUrl={formPhotoUrl}
                  setPhotoUrl={setFormPhotoUrl}
                  idCardUrl={formIdCardUrl}
                  setIdCardUrl={setFormIdCardUrl}
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
                  {isSaving ? "REGISTRANDO..." : "REGISTRAR PERSONA"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal !== null && activeModal !== "create" && selectedPerson ? (
          <motion.div
            className="modal-overlay"
            key="person-modal"
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
              {activeModal === "detail" && (
                <>
                  <div className="modal-header">
                    <h2>DOSSIER CLASIFICADO</h2>
                    <button className="modal-close-btn" onClick={closeAll}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    {selectedPerson.photoUrl ? (
                      <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <img
                          src={selectedPerson.photoUrl}
                          alt={selectedPerson.name}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            border: "2px solid var(--ink)",
                            filter: "sepia(0.2)",
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="detail-row">
                      <span className="detail-label">NOMBRE</span>
                      <span className="detail-value">{selectedPerson.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">EDAD</span>
                      <span className="detail-value">{selectedPerson.age}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">PROFESIÓN</span>
                      <span className="detail-value">{selectedPerson.profession}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">ESTADO</span>
                      <span className="detail-value">{selectedPerson.status}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">CAMPAMENTO</span>
                      <span className="detail-value">{selectedPerson.camp}</span>
                    </div>
                    {selectedPerson.previousSkills ? (
                      <div className="detail-row">
                        <span className="detail-label">HABILIDADES</span>
                        <span className="detail-value">{selectedPerson.previousSkills}</span>
                      </div>
                    ) : null}
                    {selectedPerson.notes ? (
                      <div className="detail-row">
                        <span className="detail-label">NOTAS</span>
                        <span className="detail-value">{selectedPerson.notes}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="modal-actions">
                    <button
                      className="action-btn-secondary"
                      onClick={() => openEdit(selectedPerson)}
                    >
                      EDITAR
                    </button>
                    <button
                      className="action-btn-secondary"
                      onClick={() => openStatusChange(selectedPerson)}
                    >
                      CAMBIAR ESTADO
                    </button>
                    <button className="action-btn-danger" onClick={() => setActiveModal("delete")}>
                      ELIMINAR
                    </button>
                  </div>
                </>
              )}

              {activeModal === "edit" && (
                <>
                  <div className="modal-header">
                    <h2>EDITAR REGISTRO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <PersonForm
                      firstName={formFirstName}
                      setFirstName={setFormFirstName}
                      lastName={formLastName}
                      setLastName={setFormLastName}
                      lastName2={formLastName2}
                      setLastName2={setFormLastName2}
                      birthDate={formBirthDate}
                      setBirthDate={setFormBirthDate}
                      professionId={formProfessionId}
                      setProfessionId={setFormProfessionId}
                      notes={formNotes}
                      setNotes={setFormNotes}
                      skills={formSkills}
                      setSkills={setFormSkills}
                      professions={professions}
                      photoUrl={formPhotoUrl}
                      setPhotoUrl={setFormPhotoUrl}
                      idCardUrl={formIdCardUrl}
                      setIdCardUrl={setFormIdCardUrl}
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

              {activeModal === "status" && (
                <>
                  <div className="modal-header">
                    <h2>CAMBIAR ESTADO — {selectedPerson.name}</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <label htmlFor="field-nuevo-estado-766" className="form-label">
                          NUEVO ESTADO
                        </label>
                        <select
                          id="field-nuevo-estado-766"
                          className="vintage-input full-width"
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as PersonStatus)}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group form-full">
                        <label htmlFor="field-780" className="form-label">
                          NOTAS (opcional)
                        </label>
                        <textarea
                          id="field-780"
                          className="vintage-input full-width"
                          rows={3}
                          value={formStatusNotes}
                          onChange={(e) => setFormStatusNotes(e.target.value)}
                          placeholder="Razón del cambio de estado..."
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
                      className="action-btn-primary"
                      onClick={() => void handleStatusChange()}
                      disabled={isSaving}
                    >
                      {isSaving ? "ACTUALIZANDO..." : "CONFIRMAR ESTADO"}
                    </button>
                  </div>
                </>
              )}

              {activeModal === "delete" && (
                <>
                  <div className="modal-header">
                    <h2>ELIMINAR REGISTRO</h2>
                    <button className="modal-close-btn" onClick={() => setActiveModal("detail")}>
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <p className="confirm-text">
                      ¿Confirmar la eliminación de <strong>{selectedPerson.name}</strong>? Esta
                      acción no puede deshacerse.
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
                      {isSaving ? "ELIMINANDO..." : "CONFIRMAR BAJA"}
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
