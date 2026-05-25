import type { ChangeEvent, FormEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { isAxiosError } from "axios"
import { motion } from "framer-motion"
import { ShieldAlert, CheckCircle, Loader2 } from "lucide-react"
import { submitAdmission, trackAdmission } from "@/features/admissions/services/admissions.service"
import { uploadPersonImage } from "@/features/upload/services/upload.service"
import "./AdmissionNew.css"

// Forwards `wheel` events from anywhere inside the scene (the table, the
// surrounding paper, the lamp area) to the scrollable element returned by this
// hook, so the user can scroll the form with the mouse wheel regardless of
// whether the cursor is exactly over the scroll container. Wheel events that
// originate inside the scrollable already get native scrolling, so we ignore
// those. Touch scrolling continues to work natively via `touch-action: pan-y`.
function useWheelToScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const scene = el.closest(".scene-container") as HTMLElement | null
    if (!scene) return
    const onWheel = (event: WheelEvent) => {
      // Hijack ALL scroll events in the scene to scroll this container manually.
      // This bypasses browser bugs with scrolling 3D-transformed containers on Windows.
      el.scrollTop += event.deltaY
      event.preventDefault()
    }
    scene.addEventListener("wheel", onWheel, { passive: false })
    return () => scene.removeEventListener("wheel", onWheel)
  }, [])
  return ref
}

type AdmissionFormData = {
  nombre: string
  edad: string
  salud: string
  condicion_fisica: string
  habilidades: string
  cedula: string
  correo: string
  foto: File | null
}

type AdmissionFormErrors = Partial<Record<keyof AdmissionFormData, string>>

type SubmissionDetails = {
  trackingCode: string
  recommendation: string
  score: number
  status: string
}

// Public admission flow has no auth/camp context yet. The candidate is
// effectively submitting "to the system" — we default to the primary camp.
// TODO: replace with a real camp selector when the multi-camp signup UX exists.
const DEFAULT_CAMP_ID = 1

interface ApiErrorPayload {
  message?: string
  error?: string
  details?: string
}

export interface AdmissionFormProps {
  formData: AdmissionFormData
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting: boolean
  errors: AdmissionFormErrors
  submitError?: string
  submitMessage?: string
  submissionDetails?: SubmissionDetails | null
}

const cedulaPattern = /^[0-9]{9,20}$/

const formatPersonalHistory = (formData: AdmissionFormData): string => {
  const parts = [
    `Salud: ${formData.salud.trim()}`,
    `Condicion fisica: ${formData.condicion_fisica.trim()}`,
    `Cedula: ${formData.cedula.trim()}`,
    `Contacto: ${formData.correo.trim()}`,
  ]
  return `${parts.join(". ")}.`
}

const splitName = (full: string): { first_name: string; last_name: string } => {
  const cleaned = full.trim().replace(/\s+/g, " ")
  if (!cleaned) return { first_name: "", last_name: "" }
  const [first, ...rest] = cleaned.split(" ")
  return {
    first_name: first,
    last_name: rest.length > 0 ? rest.join(" ") : first,
  }
}

const parseSkills = (rawSkills: string): string[] =>
  rawSkills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)

const extractApiErrorMessage = (error: unknown): string => {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data
    return (
      payload?.message ??
      payload?.error ??
      payload?.details ??
      "No se pudo registrar la admision. Intenta nuevamente."
    )
  }

  return "No se pudo registrar la admision. Intenta nuevamente."
}

const getStoredToken = (): string | null => {
  const authToken = localStorage.getItem("auth-token")
  if (authToken) return authToken

  try {
    const authStorageRaw = localStorage.getItem("auth-storage")
    if (!authStorageRaw) return null
    const parsedStorage = JSON.parse(authStorageRaw) as { state?: { token?: string } }
    return parsedStorage.state?.token ?? null
  } catch {
    return null
  }
}

export function AdmissionFormTemplate({
  formData,
  onChange,
  onFileChange,
  onSubmit,
  isSubmitting,
  errors,
  submitError,
  submitMessage,
  submissionDetails,
}: AdmissionFormProps) {
  const [phase, setPhase] = useState<"intro" | "form">("intro")
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const formScrollRef = useWheelToScroll<HTMLFormElement>()
  const successScrollRef = useWheelToScroll<HTMLDivElement>()

  // No auto-zoom, wait for user click

  useEffect(() => {
    if (!formData.foto) {
      setPhotoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(formData.foto)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [formData.foto])

  const renderCordycepsSpores = () => {
    const spores = []
    for (let index = 0; index < 30; index += 1) {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 4 + 2}px`,
        height: `${Math.random() * 4 + 2}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 10 + 10}s`,
      }
      spores.push(<div key={index} className="cordyceps-spore" style={style} />)
    }
    return spores
  }

  const handleZoom = () => {
    if (phase === "intro") {
      setPhase("form")
      setTimeout(() => {
        if (formScrollRef.current) {
          formScrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
        }
      }, 100)
    }
  }

  return (
    <div className="scene-container">
      {phase === "intro" && (
        <div
          onClick={handleZoom}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "15vh",
            background: "transparent",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              color: "var(--system-green)",
              fontFamily: "var(--font-mono)",
              fontSize: "1.2rem",
              pointerEvents: "none",
              letterSpacing: "0.2em",
              textShadow: "0 0 10px rgba(91,122,74,0.8)",
              textAlign: "center",
            }}
          >
            [ SISTEMA EN ESPERA ]<br />
            <br />
            HAGA CLIC EN CUALQUIER LADO PARA ACERCAR Y COMENZAR
          </motion.div>
        </div>
      )}
      <div className="noise-overlay" />
      <div className="admission-scanlines" />
      <div className="vignette" />

      <div className="system-overlay">
        <div className="glitch-text system-text">SYSTEM: DOOMSDAY OS - v4.9.2</div>
      </div>

      <div className="room-background">
        <div className="wall-texture" />
        <div className="background-graffiti graffiti-flicker">
          WHEN YOU&apos;RE LOST IN THE DARKNESS,
          <br />
          LOOK FOR THE LIGHT.
        </div>
      </div>

      <div className="fog pulse-fog" />
      <div className="spore-container">{renderCordycepsSpores()}</div>

      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 80,
        }}
        variants={{
          hidden: { y: -1000, opacity: 0 },
          intro: {
            y: 0,
            x: 0,
            scale: 1,
            opacity: 1,
            transition: {
              type: "spring",
              mass: 2,
              stiffness: 35,
              damping: 12,
              restDelta: 0.001,
            },
          },
          form: {
            y: "-15vh",
            x: "-35vw",
            scale: 0.85,
            opacity: 0.8,
            transition: { duration: 2.5, ease: [0.4, 0, 0.2, 1] },
          },
        }}
        initial="hidden"
        animate={phase}
      >
        <div className="industrial-lamp-container">
          <div className="lamp-cable" />
          <div className="lamp-hood">
            <div className="lamp-hood-decay" />
            <div className="lamp-wire-cage" />
            <div className="lamp-core-bulb brutal-flicker" />
            <div className="lamp-volumetric-cone bulb-flicker" />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={{
          intro: { scale: 0.9, y: 150, z: -200, rotateX: 5, rotateZ: -1 },
          form: {
            scale: 1,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateZ: 0,
            transition: { duration: 2, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        initial="intro"
        animate={phase}
        className="survivor-board"
        style={{ transformOrigin: "center center" }}
      >
        <div className="table-surface">
          <label
            htmlFor="foto"
            className={`military-map ${photoPreviewUrl ? "has-photo" : "is-empty"} ${errors.foto ? "has-error" : ""}`}
            style={{ pointerEvents: phase === "intro" ? "none" : "auto" }}
            title={photoPreviewUrl ? "Cambiar foto del candidato" : "Adjuntar foto del candidato"}
          >
            {photoPreviewUrl ? (
              <img src={photoPreviewUrl} alt="Foto del candidato" className="military-map-image" />
            ) : (
              <div className="military-map-placeholder">
                <span className="military-map-plus">+</span>
                <span className="military-map-hint">
                  ADJUNTAR
                  <br />
                  FOTO
                </span>
              </div>
            )}
            <span className="military-map-caption">FOTO-ID</span>
          </label>
          <div
            className="bullet"
            style={{ top: "150px", left: "120px", transform: "rotate(45deg)" }}
          />
          <div
            className="bullet"
            style={{ top: "160px", left: "135px", transform: "rotate(70deg)" }}
          />
          <div className="blood-splatter blood-1" />
          <div className="blood-splatter blood-2" />

          <div className="paper-form-wrapper">
            <div className="paper-lighting" />
            <div className="digital-grid" />
            <div className="coffee-stain" />
            <div className="fedra-logo-stamp">
              <span className="stamp-title" style={{ fontSize: "28px" }}>
                GESTIÓN DEL FIN
              </span>
              <span className="stamp-subtitle">ZONA SEGURA VERIFICADA</span>
            </div>

            <div className="form-header">
              <h1 className="form-title">Formulario de admision</h1>
              <p className="form-subtitle">SISTEMA OFICIAL DE GESTIÓN DEL FIN - ZC CONFIDENCIAL</p>
            </div>

            {submitMessage ? (
              <div className="success-container" ref={successScrollRef}>
                <div className="success-header">
                  <CheckCircle className="success-icon" />
                  <h2 className="success-title glitch-text">{submitMessage}</h2>
                </div>

                {submissionDetails ? (
                  <div className="success-body">
                    <div>
                      <span className="stat-label">Codigo de seguimiento</span>
                      <span className="tracking-code">{submissionDetails.trackingCode}</span>
                    </div>

                    <div className="stats-grid">
                      <div className="stat-box">
                        <span className="stat-label">Puntaje</span>
                        <span className="stat-value">{submissionDetails.score}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Recomendacion IA</span>
                        <span className="stat-recommendation">
                          {submissionDetails.recommendation.toUpperCase()}
                        </span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Estado</span>
                        <span className="stat-value">{submissionDetails.status}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Imagen reportada</span>
                        <span className="stat-value">{formData.foto ? "SI" : "NO"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <motion.form
                ref={formScrollRef}
                onSubmit={onSubmit}
                className="form-content"
                initial="hidden"
                animate={phase !== "intro" ? "visible" : "hidden"}
                variants={{
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
                  hidden: { transition: { staggerChildren: 0 } },
                }}
              >
                {submitError ? (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10, rotateX: 10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        transition: { type: "spring", stiffness: 50 },
                      },
                    }}
                    className="error-box"
                  >
                    <ShieldAlert className="error-icon" />
                    <p className="error-text">{submitError}</p>
                  </motion.div>
                ) : null}

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="input-group"
                >
                  <label htmlFor="nombre" className="input-label">
                    Nombre Completo <span className="text-fedra-rust">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={onChange}
                    className="typewriter-input"
                    placeholder="Ej. Joel Miller"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.nombre ? <p className="field-error">{errors.nombre}</p> : null}
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="input-group"
                >
                  <label htmlFor="correo" className="input-label">
                    Metodo de Contacto (Email) <span className="text-fedra-rust">*</span>
                  </label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={onChange}
                    className="typewriter-input"
                    placeholder="ejemplo@qz.com"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.correo ? <p className="field-error">{errors.correo}</p> : null}
                </motion.div>

                <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10, rotateX: 10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        transition: { type: "spring", stiffness: 50 },
                      },
                    }}
                    className="input-group"
                    style={{ flex: 1 }}
                  >
                    <label htmlFor="edad" className="input-label">
                      Edad <span className="text-fedra-rust">*</span>
                    </label>
                    <input
                      type="number"
                      id="edad"
                      name="edad"
                      value={formData.edad}
                      onChange={onChange}
                      min={1}
                      step={1}
                      inputMode="numeric"
                      className="typewriter-input"
                      placeholder="00"
                      disabled={isSubmitting}
                      required
                    />
                    {errors.edad ? <p className="field-error">{errors.edad}</p> : null}
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10, rotateX: 10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        transition: { type: "spring", stiffness: 50 },
                      },
                    }}
                    className="input-group"
                    style={{ flex: 2 }}
                  >
                    <label htmlFor="cedula" className="input-label">
                      Cedula <span className="text-fedra-rust">*</span>
                    </label>
                    <input
                      type="text"
                      id="cedula"
                      name="cedula"
                      value={formData.cedula}
                      onChange={onChange}
                      inputMode="numeric"
                      pattern="[0-9]{9,20}"
                      minLength={9}
                      maxLength={20}
                      title="Debe contener entre 9 y 20 digitos"
                      className="typewriter-input"
                      placeholder="000000000"
                      disabled={isSubmitting}
                      required
                    />
                    {errors.cedula ? <p className="field-error">{errors.cedula}</p> : null}
                  </motion.div>
                </div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="input-group"
                >
                  <label htmlFor="salud" className="input-label">
                    Salud <span className="text-fedra-rust">*</span>
                  </label>
                  <textarea
                    id="salud"
                    name="salud"
                    value={formData.salud}
                    onChange={onChange}
                    rows={2}
                    className="typewriter-input textarea-resize"
                    placeholder="Dolencias, padecimientos, medicacion..."
                    disabled={isSubmitting}
                    required
                  />
                  {errors.salud ? <p className="field-error">{errors.salud}</p> : null}
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="input-group"
                >
                  <label htmlFor="condicion_fisica" className="input-label">
                    Condicion fisica <span className="text-fedra-rust">*</span>
                  </label>
                  <textarea
                    id="condicion_fisica"
                    name="condicion_fisica"
                    value={formData.condicion_fisica}
                    onChange={onChange}
                    rows={2}
                    className="typewriter-input textarea-resize"
                    placeholder="Describa su estado fisico..."
                    disabled={isSubmitting}
                    required
                  />
                  {errors.condicion_fisica ? (
                    <p className="field-error">{errors.condicion_fisica}</p>
                  ) : null}
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="input-group"
                >
                  <label htmlFor="habilidades" className="input-label">
                    Habilidades <span className="text-fedra-rust">*</span>
                  </label>
                  <textarea
                    id="habilidades"
                    name="habilidades"
                    value={formData.habilidades}
                    onChange={onChange}
                    rows={2}
                    className="typewriter-input textarea-resize"
                    placeholder="Armas, medicina, sigilo, mecanica..."
                    disabled={isSubmitting}
                    required
                  />
                  {errors.habilidades ? <p className="field-error">{errors.habilidades}</p> : null}
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="input-group photo-input-group"
                >
                  <span className="input-label">
                    Foto Adjunta <span className="text-fedra-rust">*</span>
                  </span>
                  <p className="field-helper">
                    {formData.foto
                      ? `Archivo cargado: ${formData.foto.name}`
                      : "Haz clic en el papel inclinado ↗ junto al formulario para adjuntar tu foto."}
                  </p>
                  <input
                    type="file"
                    id="foto"
                    name="foto"
                    onChange={onFileChange}
                    accept="image/*"
                    className="visually-hidden-input"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.foto ? <p className="field-error">{errors.foto}</p> : null}
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, rotateX: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: { type: "spring", stiffness: 50 },
                    },
                  }}
                  className="submit-container"
                  style={{ marginTop: "1.5rem" }}
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="military-stamp btn-submit"
                  >
                    <div className="stamp-hover-bg" />
                    <span className="stamp-content">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="spin-icon" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <span>Guardar Solicitud</span>
                      )}
                    </span>
                  </button>
                </motion.div>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const initialFormData: AdmissionFormData = {
  nombre: "",
  edad: "",
  salud: "",
  condicion_fisica: "",
  habilidades: "",
  cedula: "",
  correo: "",
  foto: null,
}

export default function AdmissionNew() {
  const [formData, setFormData] = useState<AdmissionFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<AdmissionFormErrors>({})
  const [submitMessage, setSubmitMessage] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    const normalizedValue = name === "cedula" ? value.replace(/\D/g, "") : value
    const fieldName = name as keyof AdmissionFormData

    setFormData((previous) => ({
      ...previous,
      [fieldName]: normalizedValue,
    }))

    if (errors[fieldName]) {
      setErrors((previous) => ({
        ...previous,
        [fieldName]: undefined,
      }))
    }

    if (submitError) setSubmitError("")
    if (submitMessage) setSubmitMessage("")
    if (submissionDetails) setSubmissionDetails(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null

    setFormData((previous) => ({
      ...previous,
      foto: selectedFile,
    }))

    if (errors.foto) {
      setErrors((previous) => ({
        ...previous,
        foto: undefined,
      }))
    }

    if (submitError) setSubmitError("")
    if (submitMessage) setSubmitMessage("")
    if (submissionDetails) setSubmissionDetails(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: AdmissionFormErrors = {}
    if (!formData.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio"

    const parsedAge = Number(formData.edad)
    if (!formData.edad.trim()) {
      nextErrors.edad = "La edad es obligatoria"
    } else if (!Number.isInteger(parsedAge) || parsedAge < 1) {
      nextErrors.edad = "La edad debe ser un entero mayor o igual a 1"
    }

    if (!formData.salud.trim()) nextErrors.salud = "La salud es obligatoria"
    if (!formData.condicion_fisica.trim())
      nextErrors.condicion_fisica = "La condicion fisica es obligatoria"
    if (!formData.habilidades.trim()) nextErrors.habilidades = "Las habilidades son obligatorias"

    if (!formData.cedula.trim()) {
      nextErrors.cedula = "La cedula es obligatoria"
    } else if (!cedulaPattern.test(formData.cedula.trim())) {
      nextErrors.cedula = "La cedula debe tener entre 9 y 20 digitos"
    }

    if (!formData.correo.trim()) {
      nextErrors.correo = "El correo de contacto es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo.trim())) {
      nextErrors.correo = "El formato de correo es invalido"
    }

    if (!formData.foto) {
      nextErrors.foto = "La foto es obligatoria"
    } else if (!formData.foto.type.startsWith("image/")) {
      nextErrors.foto = "Debes adjuntar una imagen valida"
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitError("Revisa los campos marcados antes de continuar")
      setSubmitMessage("")
      setSubmissionDetails(null)
      return
    }

    setSubmitError("")
    setSubmitMessage("")
    setErrors({})
    setSubmissionDetails(null)
    setIsSubmitting(true)

    try {
      const skillsList = parseSkills(formData.habilidades)
      const { first_name, last_name } = splitName(formData.nombre)
      const ageNumber = Number(formData.edad)

      let photoUrl: string | undefined
      if (formData.foto) {
        try {
          const uploaded = await uploadPersonImage(formData.foto)
          photoUrl = uploaded.url
        } catch {
          photoUrl = undefined
        }
      }

      const response = await submitAdmission({
        first_name,
        last_name,
        age: Number.isFinite(ageNumber) ? ageNumber : 0,
        health_status: 50,
        physical_condition: 50,
        skills: skillsList.length > 0 ? skillsList : [formData.habilidades.trim()],
        criminal_record: false,
        camp_id: DEFAULT_CAMP_ID,
        contact_email: formData.correo.trim(),
        personal_history: formatPersonalHistory(formData),
        photo_url: photoUrl,
      })

      let trackedStatus: string = response.status
      const token = getStoredToken()
      if (token) {
        try {
          const trackedAdmission = await trackAdmission(response.tracking_code)
          trackedStatus = trackedAdmission.status
        } catch {
          trackedStatus = response.status
        }
      }

      setSubmissionDetails({
        trackingCode: response.tracking_code,
        recommendation: response.suggested_decision ?? "",
        score: response.score ?? 0,
        status: trackedStatus,
      })
      setSubmitMessage("EVALUACION REGISTRADA.")
    } catch (error: unknown) {
      setSubmitError(extractApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdmissionFormTemplate
      formData={formData}
      onChange={handleChange}
      onFileChange={handleFileChange}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      errors={errors}
      submitError={submitError}
      submitMessage={submitMessage}
      submissionDetails={submissionDetails}
    />
  )
}
