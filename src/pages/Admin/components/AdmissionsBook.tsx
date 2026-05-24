import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useCamp } from "../context/CampContext"
import {
  createAdmissionAccount,
  getAdmissionById,
  getPendingAdmissions,
  reviewAdmission,
} from "@/features/admissions/services/admissions.service"
import type { AiAdmission } from "@/types/api.types"
import StampButton from "./StampButton"
import "./AdmissionsBook.css"

type AdmissionSummary = {
  id: string
  applicantName: string
  fileNumber: string
  date: string
}

type AiRecommendation = "accept" | "reject" | "review"

type AdmissionDetail = AdmissionSummary & {
  appearanceNotes: string
  fingerprintsScanned: boolean
  aiScore: number
  suggestedDecision: "ACCEPT" | "REJECT"
  aiAnalysis: string
  rulesApplied: string[]
  aiRecommendation: AiRecommendation
  contactEmail: string | null
}

// Default role assigned to newly admitted survivors. Matches `worker` role in
// the seed (role_id=2). See docs/ALIGNMENT_SPEC.md §1.2 / P0-4.
const DEFAULT_NEW_ACCOUNT_ROLE_ID = 2
const DEFAULT_ACCOUNT_PASSWORD = "Temp1234!"
const DEMO_ADMISSIONS_ENABLED = import.meta.env.VITE_DEMO_ADMISSIONS === "true" || import.meta.env.DEV

const DEMO_ADMISSIONS: AdmissionDetail[] = [
  {
    id: "DEMO-01",
    applicantName: "Mateo Vargas",
    fileNumber: "A2-17865",
    date: "2042-11-12",
    appearanceNotes: "Cicatriz en brazo derecho; signos de desnutricion.",
    fingerprintsScanned: true,
    aiScore: 84,
    suggestedDecision: "ACCEPT",
    aiAnalysis: "Evaluacion neuronal sugiere adaptacion estable en entornos cerrados.",
    rulesApplied: ["CRITICAL_ROLE_NEEDED", "HEALTH_SCORE_OK"],
    aiRecommendation: "accept",
    contactEmail: null,
  },
  {
    id: "DEMO-02",
    applicantName: "Lucia Silva",
    fileNumber: "A2-17866",
    date: "2042-11-13",
    appearanceNotes: "Quemaduras leves y fatiga prolongada.",
    fingerprintsScanned: false,
    aiScore: 62,
    suggestedDecision: "REJECT",
    aiAnalysis: "Riesgo medico elevado y baja tolerancia al confinamiento.",
    rulesApplied: ["HEALTH_SCORE_OK"],
    aiRecommendation: "reject",
    contactEmail: null,
  },
  {
    id: "DEMO-03",
    applicantName: "Hector Cruz",
    fileNumber: "A2-17867",
    date: "2042-11-14",
    appearanceNotes: "Exposicion a polvo radiactivo; requiere cuarentena.",
    fingerprintsScanned: true,
    aiScore: 76,
    suggestedDecision: "ACCEPT",
    aiAnalysis: "Adaptacion social alta; requiere seguimiento medico.",
    rulesApplied: ["CRITICAL_ROLE_NEEDED"],
    aiRecommendation: "review",
    contactEmail: null,
  },
]

const DEMO_SUMMARIES: AdmissionSummary[] = DEMO_ADMISSIONS.map(({ id, applicantName, fileNumber, date }) => ({
  id,
  applicantName,
  fileNumber,
  date,
}))

const DEMO_BY_ID = new Map(DEMO_ADMISSIONS.map((item) => [item.id, item]))

const formatDate = (value: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

const buildUsername = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")

const buildApplicantName = (admission: AiAdmission): string => {
  const candidate = admission.candidate_data ?? ({} as AiAdmission["candidate_data"])
  return [candidate.first_name, candidate.last_name, candidate.last_name2]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim()
}

const normalizeRecommendation = (
  suggested: string | null | undefined,
): AiRecommendation => {
  const value = (suggested ?? "").toUpperCase()
  if (value.includes("ACCEPT")) return "accept"
  if (value.includes("REJECT")) return "reject"
  return "review"
}

const mapAdmissionSummary = (admission: AiAdmission): AdmissionSummary => ({
  id: admission.id,
  applicantName: buildApplicantName(admission) || "Sin nombre",
  fileNumber: admission.tracking_code,
  date: formatDate(admission.submission_date),
})

const extractRulesApplied = (raw: unknown): string[] => {
  if (!raw || typeof raw !== "object") return []
  const factors = (raw as { nestjs_evaluation?: { factors?: Array<{ category?: string }> } })
    .nestjs_evaluation?.factors
  if (!Array.isArray(factors)) return []
  return factors
    .map((factor) => factor?.category)
    .filter((category): category is string => typeof category === "string")
}

const mapAdmissionDetail = (admission: AiAdmission): AdmissionDetail => {
  const aiRecommendation = normalizeRecommendation(admission.suggested_decision)
  const suggestedDecision = aiRecommendation === "accept" ? "ACCEPT" : "REJECT"
  const rulesApplied = extractRulesApplied(admission.raw_ai_response)
  const analysis = admission.justification ?? "Evaluación automática registrada."
  const candidate = admission.candidate_data ?? ({} as AiAdmission["candidate_data"])
  const appearanceNotes = [
    candidate.medical_conditions?.join(", "),
    candidate.personal_history,
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" | ")

  return {
    ...mapAdmissionSummary(admission),
    appearanceNotes: appearanceNotes || "Sin observaciones adicionales.",
    fingerprintsScanned: Boolean(candidate.id_card_url),
    aiScore: admission.score ?? 0,
    suggestedDecision,
    aiAnalysis: analysis,
    rulesApplied,
    aiRecommendation,
    contactEmail: candidate.contact_email ?? null,
  }
}

export default function AdmissionsBook() {
  const { activeCampId } = useCamp()
  const [admissions, setAdmissions] = useState<AdmissionSummary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailData, setDetailData] = useState<AdmissionDetail | null>(null)
  const [decision, setDecision] = useState<"ACCEPT" | "REJECT" | null>(null)
  const [showingProcessed, setShowingProcessed] = useState(false)
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDemoData, setIsDemoData] = useState(false)

  useEffect(() => {
    if (!activeCampId) {
      if (DEMO_ADMISSIONS_ENABLED) {
        setAdmissions(DEMO_SUMMARIES)
        setIsDemoData(true)
      } else {
        setAdmissions([])
        setIsDemoData(false)
      }
      setLoading(false)
      return
    }
    let isMounted = true

    const loadAdmissions = async () => {
      setLoading(true)
      try {
        const response = await getPendingAdmissions({ campId: activeCampId, page: 1, limit: 50 })
        if (!isMounted) return
        const items = response.data ?? []
        if (items.length === 0) {
          if (DEMO_ADMISSIONS_ENABLED) {
            setAdmissions(DEMO_SUMMARIES)
            setIsDemoData(true)
          } else {
            setAdmissions([])
            setIsDemoData(false)
          }
        } else {
          setAdmissions(items.map(mapAdmissionSummary))
          setIsDemoData(false)
        }
        setCurrentIndex(0)
      } catch {
        if (!isMounted) return
        if (DEMO_ADMISSIONS_ENABLED) {
          setAdmissions(DEMO_SUMMARIES)
          setIsDemoData(true)
        } else {
          setAdmissions([])
          setIsDemoData(false)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadAdmissions()

    return () => {
      isMounted = false
    }
  }, [activeCampId])

  useEffect(() => {
    if (!admissions[currentIndex]) return
    let isMounted = true

    const loadDetail = async () => {
      setLoading(true)
      if (isDemoData) {
        if (!isMounted) return
        const demoDetail = DEMO_BY_ID.get(admissions[currentIndex].id) ?? null
        setDetailData(demoDetail)
        setDecision(null)
        setShowingProcessed(false)
        setLoading(false)
        return
      }
      try {
        const admission = await getAdmissionById(admissions[currentIndex].id)
        if (!isMounted) return
        setDetailData(mapAdmissionDetail(admission))
        setDecision(null)
        setShowingProcessed(false)
      } catch {
        if (!isMounted) return
        const fallback: AdmissionDetail = {
          ...admissions[currentIndex],
          appearanceNotes: "Sin observaciones adicionales.",
          fingerprintsScanned: false,
          aiScore: 0,
          suggestedDecision: "REJECT",
          aiAnalysis: "Evaluación automática registrada.",
          rulesApplied: [],
          aiRecommendation: "review",
          contactEmail: null,
        }
        setDetailData(fallback)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadDetail()

    return () => {
      isMounted = false
    }
  }, [admissions, currentIndex, isDemoData])

  const handleNextPage = () => {
    if (currentIndex < admissions.length - 1 && turnDirection === null) {
      setTurnDirection("next")
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 400)
      setTimeout(() => {
        setTurnDirection(null)
      }, 800)
    }
  }

  const handlePrevPage = () => {
    if (currentIndex > 0 && turnDirection === null) {
      setTurnDirection("prev")
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1)
      }, 400)
      setTimeout(() => {
        setTurnDirection(null)
      }, 800)
    }
  }

  const archiveAdmission = () => {
    setAdmissions((previous) => {
      const next = [...previous]
      next.splice(currentIndex, 1)
      const nextIndex = Math.min(currentIndex, Math.max(0, next.length - 1))
      setCurrentIndex(nextIndex)
      return next
    })
    setDecision(null)
    setShowingProcessed(false)
  }

  const handleDecision = async (nextDecision: "ACCEPT" | "REJECT") => {
    if (!detailData) return
    setDecision(nextDecision)
    setIsProcessing(true)
    if (isDemoData) {
      setTimeout(() => {
        if (nextDecision === "ACCEPT") {
          setShowingProcessed(true)
        } else {
          archiveAdmission()
        }
        setIsProcessing(false)
      }, 1000)
      return
    }
    try {
      const decisionValue = nextDecision === "ACCEPT" ? "accepted" : "rejected"
      const notes = (document.getElementById("admin_notes_input") as HTMLTextAreaElement)?.value || "Reviewed"

      await reviewAdmission(detailData.id, {
        decision: decisionValue,
        notes,
      })

      setTimeout(() => {
        if (nextDecision === "ACCEPT") {
          setShowingProcessed(true)
        } else {
          archiveAdmission()
        }
      }, 1000)
    } catch {
      setDecision(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleArchive = async () => {
    if (!detailData) return
    if (isDemoData) {
      archiveAdmission()
      return
    }

    if (decision === "ACCEPT" && activeCampId) {
      try {
        const username = buildUsername(detailData.applicantName)
        const email = detailData.contactEmail ?? `${username}@camp.local`
        await createAdmissionAccount(detailData.id, {
          username,
          email,
          password: DEFAULT_ACCOUNT_PASSWORD,
          role_id: DEFAULT_NEW_ACCOUNT_ROLE_ID,
        })
      } catch {
        // Ignore create-account errors to keep the flow visible
      }
    }

    archiveAdmission()
  }

  if (loading && admissions.length === 0) {
    return <div className="admissions-container">BUSCANDO ARCHIVOS...</div>
  }

  if (admissions.length === 0) {
    return (
      <div className="admissions-container" style={{ justifyContent: "center" }}>
        <h2
          style={{
            color: "var(--accent-warning)",
            border: "2px dashed var(--accent-warning)",
            padding: "20px",
            backgroundColor: "rgba(0,0,0,0.5)",
            textShadow: "0 0 10px var(--accent-warning)",
          }}
        >
          [ ALERTA ] NO HAY ADMISIONES PENDIENTES EN ESTE CAMPAMENTO
        </h2>
      </div>
    )
  }

  const currentCount = currentIndex + 1
  const totalCount = admissions.length

  return (
    <div className="admissions-container" style={{ overflow: "hidden" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "5px",
          color: "#fff",
          textShadow: "0 0 5px rgba(255,255,255,0.5)",
        }}
      >
        LIBRO MAYOR DE ADMISIONES
      </h2>
      <div style={{ fontFamily: "var(--font-mono)", marginBottom: "10px", color: "#aaa" }}>
        EXPEDIENTE {currentCount} DE {totalCount}
      </div>

      <div
        className="book-scaler"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "60px",
        }}
      >
        <div
          className={`physical-book-cover ${turnDirection === "next" ? "is-turning-next" : turnDirection === "prev" ? "is-turning-prev" : ""}`}
        >
          <div className="book-binding-center"></div>
          <div className="book-thickness-pages">
            <div className="thickness-page"></div>
            <div className="thickness-page"></div>
            <div className="thickness-page"></div>
            <div className="thickness-page"></div>
            <div className="thickness-page"></div>
            <div className="thickness-page"></div>
          </div>

          <div
            className={`flips-layer ${turnDirection ? (turnDirection === "next" ? "is-turning-next" : "is-turning-prev") : ""}`}
          >
            <div className="flip-segment flip1">
              <div className="flip-segment flip2">
                <div className="flip-segment flip3">
                  <div className="flip-segment flip4">
                    <div className="flip-segment flip5">
                      <div className="flip-segment flip6">
                        <div className="flip-segment flip7"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={turnDirection === "next" ? 1 : -1}>
            {detailData ? (
              <motion.div
                key={detailData.id + (showingProcessed ? "-processed" : "-review")}
                custom={turnDirection === "next" ? 1 : -1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="portfolio-spread"
              >
                <div className="portfolio-page left-page">
                  <div className="binder-header">PERFIL DE INTELIGENCIA</div>
                  <div className="profile-photo">
                    <div className="photo-placeholder">
                      <svg viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>EXPEDIENTE:</label> <span>{detailData.fileNumber}</span>
                  </div>
                  <div className="form-field">
                    <label>NOMBRE:</label> <span>{detailData.applicantName}</span>
                  </div>
                  <div className="form-field">
                    <label>FECHA:</label> <span>{detailData.date}</span>
                  </div>
                  <div className="form-field">
                    <label>NOTAS:</label>
                    <span style={{ fontFamily: "var(--font-marker)" }}>{detailData.appearanceNotes}</span>
                  </div>
                  <div className="form-field">
                    <label>BIOMETRÍA:</label>
                    <span className={detailData.fingerprintsScanned ? "biometrics-ok" : ""}>
                      {detailData.fingerprintsScanned ? "VERIFICADO" : "PENDIENTE"}
                    </span>
                  </div>

                  {decision ? (
                    <div
                      className="decision-stamp-overlay"
                      style={{
                        color: decision === "ACCEPT" ? "var(--accent-mil)" : "var(--accent-critical)",
                        borderColor: decision === "ACCEPT" ? "var(--accent-mil)" : "var(--accent-critical)",
                      }}
                    >
                      {decision === "ACCEPT" ? "ACEPTADO" : "RECHAZADO"}
                    </div>
                  ) : null}
                </div>

                <div className="portfolio-page right-page">
                  {!showingProcessed ? (
                    <>
                      <div className="binder-header">REVISIÓN DE IA</div>
                      <div className="ai-evaluation-section">
                        <div className="form-field">
                          <label>SCORE IA:</label>
                          <span
                            style={{
                              color: detailData.aiScore >= 80 ? "var(--accent-mil)" : "var(--accent-warning)",
                              fontSize: "1.2em",
                            }}
                          >
                            {detailData.aiScore}/100
                          </span>
                        </div>
                        <div className="form-field">
                          <label>SUGERENCIA:</label>
                          <span>{detailData.suggestedDecision === "ACCEPT" ? "ACEPTAR" : "RECHAZAR"}</span>
                        </div>
                        <div className="form-field">
                          <label>ANÁLISIS:</label>
                          <span style={{ fontFamily: "var(--font-typewriter)" }}>{detailData.aiAnalysis}</span>
                        </div>
                        <div className="form-field">
                          <label>REGLAS:</label>
                          <ul style={{ fontSize: "0.9em", paddingLeft: "20px", fontFamily: "var(--font-mono)" }}>
                            {detailData.rulesApplied.map((rule) => (
                              <li key={rule}>
                                {rule === "CRITICAL_ROLE_NEEDED"
                                  ? "ROL_CRÍTICO_REQUERIDO"
                                  : rule === "HEALTH_SCORE_OK"
                                    ? "ESTRUCTURA_SALUD_OK"
                                    : rule}
                              </li>
                            ))}
                            {detailData.rulesApplied.length === 0 ? <li>Ninguna</li> : null}
                          </ul>
                        </div>
                      </div>

                      <div className="binder-header" style={{ marginTop: "12px" }}>
                        RESOLUCIÓN OFICIAL
                      </div>

                      <div className="form-field comments-field" style={{ marginTop: "10px" }}>
                        <label style={{ display: "block", marginBottom: "5px" }}>COMENTARIOS (OPCIONAL):</label>
                        <textarea
                          className="vintage-input"
                          id="admin_notes_input"
                          placeholder="Escriba observaciones..."
                          style={{ width: "100%", height: "48px", resize: "none" }}
                        ></textarea>
                      </div>

                      <div className="binder-footer decision-footer">
                        <StampButton label="RECHAZAR" type="reject" onClick={() => handleDecision("REJECT")} disabled={!!decision || isProcessing} />
                        <StampButton label="ACEPTAR" type="accept" onClick={() => handleDecision("ACCEPT")} disabled={!!decision || isProcessing} />
                      </div>
                    </>
                  ) : (
                    <div
                      className="processed-view"
                      style={{
                        position: "relative",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingTop: "50px",
                      }}
                    >
                      <div className="binder-header" style={{ width: "100%" }}>
                        RESULTADO
                      </div>

                      <div
                        className="decision-stamp-overlay"
                        style={{
                          top: "30%",
                          left: "10%",
                          transform: "rotate(10deg)",
                          color: "var(--accent-mil)",
                          borderColor: "var(--accent-mil)",
                        }}
                      >
                        PROCESADO
                      </div>

                      <div
                        style={{
                          fontFamily: "var(--font-typewriter)",
                          marginTop: "80px",
                          textAlign: "center",
                          fontSize: "1.2rem",
                          color: "#000",
                          fontWeight: "bold",
                        }}
                      >
                        CREACIÓN DE CUENTA DELEGADA AL SISTEMA
                        <br />// BASADA EN PROFESIÓN REGISTRADA
                      </div>

                      <div style={{ fontFamily: "var(--font-mono)", marginTop: "30px", textAlign: "center", opacity: 0.7 }}>
                        EXPEDIENTE #{detailData.fileNumber}
                      </div>

                      <div className="binder-footer" style={{ bottom: "40px", justifyContent: "center" }}>
                        <button className="archive-btn" onClick={handleArchive}>
                          CREAR CUENTA Y ARCHIVAR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="page-controls" style={{ display: "flex", gap: "30px", marginTop: "20px", position: "relative", zIndex: 1000 }}>
        <button className="arrow-btn" onClick={handlePrevPage} disabled={currentIndex === 0 || !!decision}>
          ← PASAR PÁG. ANTERIOR
        </button>
        <button
          className="arrow-btn"
          onClick={handleNextPage}
          disabled={currentIndex === admissions.length - 1 || !!decision}
        >
          PASAR PÁG. SIGUIENTE →
        </button>
      </div>
    </div>
  )
}
