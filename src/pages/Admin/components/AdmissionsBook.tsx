import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
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

type AdmissionDetail = AdmissionSummary & {
  status: AiAdmission["status"]
  aiScore: number
  suggestedDecision: string
  aiRecommendation: AiAdmission["ai_recommendation"]
  aiAnalysis: string
  rulesApplied: string[]
  appearanceNotes: string
  fingerprintsScanned: boolean
  aboutYourself: string
  skills: string
  medicalInfo: string
  hasPhoto: boolean
}

type AccountFormState = {
  username: string
  password: string
  role: string
  campId: string
}

const formatDate = (value: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

const formatDecision = (value?: string) => (value ? value.toUpperCase() : "N/D")

const buildRules = (admission: AiAdmission) =>
  admission.glass_box_report?.factors?.map(
    (factor) => `${factor.category}: ${factor.detail} (${factor.score}/${factor.maxScore})`,
  ) ?? []

const buildAnalysis = (admission: AiAdmission) => {
  const parts = []
  if (admission.glass_box_report?.finalRecommendation) {
    parts.push(admission.glass_box_report.finalRecommendation)
  }
  if (admission.glass_box_report?.criticalRuleTriggered) {
    parts.push("Regla critica activada.")
  }
  return parts.length ? parts.join(" ") : "Sin analisis disponible."
}

const mapAdmissionSummary = (admission: AiAdmission): AdmissionSummary => ({
  id: admission.id,
  applicantName: admission.name,
  fileNumber: admission.tracking_code,
  date: formatDate(admission.created_at),
})

const mapAdmissionDetail = (admission: AiAdmission): AdmissionDetail => {
  const appearanceNotes = [admission.medical_info, admission.skills].filter(Boolean).join(" | ")

  return {
    ...mapAdmissionSummary(admission),
    status: admission.status,
    aiScore: admission.evaluation_score,
    suggestedDecision: formatDecision(admission.ai_recommendation),
    aiRecommendation: admission.ai_recommendation,
    aiAnalysis: buildAnalysis(admission),
    rulesApplied: buildRules(admission),
    appearanceNotes: appearanceNotes || "Sin notas medicas.",
    fingerprintsScanned: admission.has_id_card,
    aboutYourself: admission.about_yourself,
    skills: admission.skills,
    medicalInfo: admission.medical_info,
    hasPhoto: admission.has_photo,
  }
}

const buildUsername = (name: string) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return normalized.replace(/\s+/g, ".").replace(/[^a-z0-9._-]/g, "")
}

export default function AdmissionsBook() {
  const { activeCampId, camps } = useCamp()
  const [admissions, setAdmissions] = useState<AdmissionSummary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [detailData, setDetailData] = useState<AdmissionDetail | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [listError, setListError] = useState("")
  const [reviewError, setReviewError] = useState("")
  const [decision, setDecision] = useState<"ACCEPT" | "REJECT" | null>(null)
  const [showingProcessed, setShowingProcessed] = useState(false)
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    username: "",
    password: "",
    role: "",
    campId: activeCampId,
  })
  const [accountError, setAccountError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true

    const loadAdmissions = async () => {
      setIsLoadingList(true)
      setListError("")
      try {
        const items = await getPendingAdmissions({ campId: activeCampId, page: 1, limit: 50 })
        if (!isMounted) return
        setAdmissions(items.map(mapAdmissionSummary))
        setCurrentIndex(0)
      } catch {
        if (!isMounted) return
        setListError("No se pudo cargar las admisiones pendientes.")
        setAdmissions([])
      } finally {
        if (isMounted) setIsLoadingList(false)
      }
    }

    void loadAdmissions()

    return () => {
      isMounted = false
    }
  }, [activeCampId])

  useEffect(() => {
    if (!admissions[currentIndex]) {
      setDetailData(null)
      return
    }

    let isMounted = true

    const loadDetail = async () => {
      setIsLoadingDetail(true)
      try {
        const admission = await getAdmissionById(admissions[currentIndex].id)
        if (!isMounted) return
        setDetailData(mapAdmissionDetail(admission))
      } catch {
        if (!isMounted) return
        setReviewError("No se pudo cargar el expediente seleccionado.")
      } finally {
        if (isMounted) setIsLoadingDetail(false)
      }
    }

    void loadDetail()

    return () => {
      isMounted = false
    }
  }, [admissions, currentIndex])

  useEffect(() => {
    setDecision(null)
    setShowingProcessed(false)
    setAdminNotes("")
    setAccountError("")
    setReviewError("")
    setIsProcessing(false)

    if (!detailData) return
    setAccountForm((previous) => ({
      ...previous,
      username: previous.username || buildUsername(detailData.applicantName),
      campId: activeCampId || previous.campId,
    }))
  }, [detailData, activeCampId])

  useEffect(() => {
    if (!activeCampId) return
    setAccountForm((previous) => ({
      ...previous,
      campId: activeCampId,
    }))
  }, [activeCampId])

  const handleNextPage = () => {
    if (currentIndex < admissions.length - 1 && !turnDirection && !decision) {
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
    if (currentIndex > 0 && !turnDirection && !decision) {
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
    setAdminNotes("")
  }

  const handleDecision = async (nextDecision: "ACCEPT" | "REJECT") => {
    if (!detailData) return
    setDecision(nextDecision)
    setIsProcessing(true)
    setReviewError("")

    try {
      const decisionValue = nextDecision === "ACCEPT" ? "accepted" : "rejected"
      const recommended = detailData.aiRecommendation
      const decisionKey = nextDecision === "ACCEPT" ? "accept" : "reject"
      const overrideReason =
        recommended && recommended !== "review" && recommended !== decisionKey
          ? "Decision manual diferente a la recomendacion de IA."
          : undefined

      await reviewAdmission(detailData.id, {
        decision: decisionValue,
        admin_notes: adminNotes.trim() || undefined,
        override_reason: overrideReason,
      })

      if (nextDecision === "ACCEPT") {
        setShowingProcessed(true)
      } else {
        archiveAdmission()
      }
    } catch {
      setReviewError("No se pudo registrar la decision.")
      setDecision(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAccountChange = (field: keyof AccountFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setAccountForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }))
    }

  const handleArchive = async () => {
    if (!detailData) return
    setAccountError("")

    if (!accountForm.username.trim() || !accountForm.password.trim() || !accountForm.role.trim()) {
      setAccountError("Completa usuario, contrasena y rol antes de archivar.")
      return
    }

    setIsCreatingAccount(true)
    try {
      await createAdmissionAccount(detailData.id, {
        username: accountForm.username.trim(),
        password: accountForm.password.trim(),
        role: accountForm.role.trim(),
        camp_id: accountForm.campId || activeCampId,
      })
      archiveAdmission()
    } catch {
      setAccountError("No se pudo crear la cuenta. Intenta nuevamente.")
    } finally {
      setIsCreatingAccount(false)
    }
  }

  if (isLoadingList) {
    return <div className="admissions-container">BUSCANDO ARCHIVOS...</div>
  }

  if (listError) {
    return <div className="admissions-container admissions-error">{listError}</div>
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
    <div className="admissions-container">
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>LIBRO MAYOR DE ADMISIONES</h2>
      <div style={{ fontFamily: "var(--font-mono)", marginBottom: "30px", opacity: 0.8 }}>
        EXPEDIENTE {currentCount} DE {totalCount}
      </div>

      <div
        className={`physical-book-cover ${
          turnDirection === "next" ? "is-turning-next" : turnDirection === "prev" ? "is-turning-prev" : ""
        }`}
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
          className={`flips-layer ${
            turnDirection ? (turnDirection === "next" ? "is-turning-next" : "is-turning-prev") : ""
          }`}
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
                    <svg viewBox="0 0 24 24" fill="var(--ink)" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                    </svg>
                  </div>
                </div>
                <div className="form-field">
                  <label>FILE NO:</label> <span>{detailData.fileNumber}</span>
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
                  <label>BIOMETRIA:</label>
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
                    {decision === "ACCEPT" ? "ACCEPTED" : "REJECTED"}
                  </div>
                ) : null}
              </div>

              <div className="portfolio-page right-page">
                {isLoadingDetail ? (
                  <div style={{ fontFamily: "var(--font-mono)", opacity: 0.7 }}>CARGANDO EXPEDIENTE...</div>
                ) : showingProcessed ? (
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
                      PROCESSED
                    </div>

                    <div
                      style={{
                        fontFamily: "var(--font-typewriter)",
                        marginTop: "80px",
                        textAlign: "center",
                        fontSize: "1.1rem",
                        color: "var(--ink)",
                      }}
                    >
                      CUENTA PENDIENTE DE CREACION
                    </div>

                    <div className="account-section">
                      <div className="account-row">
                        <input
                          className="vintage-input"
                          value={accountForm.username}
                          onChange={handleAccountChange("username")}
                          placeholder="Usuario"
                        />
                        <input
                          className="vintage-input"
                          type="password"
                          value={accountForm.password}
                          onChange={handleAccountChange("password")}
                          placeholder="Contrasena"
                        />
                      </div>
                      <div className="account-row">
                        <input
                          className="vintage-input"
                          value={accountForm.role}
                          onChange={handleAccountChange("role")}
                          placeholder="Rol asignado"
                        />
                        <select
                          className="vintage-input"
                          value={accountForm.campId}
                          onChange={handleAccountChange("campId")}
                        >
                          {camps.map((camp) => (
                            <option key={camp.id} value={camp.id}>
                              {camp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="account-hint">Rol y campamento deben coincidir con la politica del sistema.</div>
                      {accountError ? <div className="admissions-error">{accountError}</div> : null}
                    </div>

                    <div className="binder-footer" style={{ bottom: "40px", justifyContent: "center" }}>
                      <button className="archive-btn" onClick={handleArchive} disabled={isCreatingAccount}>
                        {isCreatingAccount ? "PROCESANDO..." : "CREAR CUENTA Y ARCHIVAR"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="binder-header">REVISION DE IA</div>
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
                        <label>SUGERENCIA:</label> <span>{detailData.suggestedDecision}</span>
                      </div>
                      <div className="form-field">
                        <label>ANALISIS:</label>
                        <span style={{ fontFamily: "var(--font-typewriter)" }}>{detailData.aiAnalysis}</span>
                      </div>
                      <div className="form-field">
                        <label>REGLAS:</label>
                        <ul style={{ fontSize: "0.9em", paddingLeft: "20px", fontFamily: "var(--font-mono)" }}>
                          {detailData.rulesApplied.length > 0 ? (
                            detailData.rulesApplied.map((rule) => <li key={rule}>{rule}</li>)
                          ) : (
                            <li>Ninguna</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="binder-header" style={{ marginTop: "20px" }}>
                      RESOLUCION OFICIAL
                    </div>

                    <div className="form-field" style={{ marginTop: "10px" }}>
                      <label style={{ display: "block", marginBottom: "5px" }}>
                        COMENTARIOS (OPCIONAL):
                      </label>
                      <textarea
                        className="vintage-input"
                        placeholder="Escriba observaciones..."
                        style={{ width: "100%", height: "60px", resize: "none" }}
                        value={adminNotes}
                        onChange={(event) => setAdminNotes(event.target.value)}
                      ></textarea>
                    </div>

                    {reviewError ? <div className="admissions-error">{reviewError}</div> : null}

                    <div className="binder-footer">
                      <StampButton
                        label="REJECT"
                        type="reject"
                        onClick={() => handleDecision("REJECT")}
                        disabled={!!decision || isProcessing}
                      />
                      <StampButton
                        label="ACCEPT"
                        type="accept"
                        onClick={() => handleDecision("ACCEPT")}
                        disabled={!!decision || isProcessing}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="page-controls" style={{ display: "flex", gap: "30px", marginTop: "40px" }}>
        <button className="arrow-btn" onClick={handlePrevPage} disabled={currentIndex === 0 || !!decision}>
          ← PASAR PAG. ANTERIOR
        </button>
        <button
          className="arrow-btn"
          onClick={handleNextPage}
          disabled={currentIndex === admissions.length - 1 || !!decision}
        >
          PASAR PAG. SIGUIENTE →
        </button>
      </div>
    </div>
  )
}
