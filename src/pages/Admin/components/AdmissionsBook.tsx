import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

import StampButton from "./StampButton"
import { useCamp } from "../context/CampContext"

import type { AiAdmission } from "@/types/api.types"

import {
  archiveAdmission as archiveAdmissionApi,
  createAdmissionAccount,
  getAdmissionById,
  getAutoDecidedAdmissions,
  getPendingAdmissions,
  reviewAdmission,
} from "@/features/admissions/services/admissions.service"
import "./AdmissionsBook.css"

type AdmissionSummary = {
  id: string
  applicantName: string
  fileNumber: string
  date: string
}

type AiRecommendation = "accept" | "reject" | "review"

type AdmissionDetail = AdmissionSummary & {
  campId: string
  appearanceNotes: string
  fingerprintsScanned: boolean
  aiScore: number
  suggestedDecision: "ACCEPT" | "REJECT"
  aiAnalysis: string
  rulesApplied: string[]
  aiRecommendation: AiRecommendation
  contactEmail: string | null
  admissionStatus: string
  photoUrl?: string | null
}

// Default role assigned to newly admitted survivors. Matches `worker` role in
// the seed (role_id=2). See docs/ALIGNMENT_SPEC.md §1.2 / P0-4.
const DEMO_ADMISSIONS_ENABLED =
  import.meta.env.VITE_DEMO_ADMISSIONS === "true" || import.meta.env.DEV

const DEMO_ADMISSIONS: AdmissionDetail[] = [
  {
    id: "DEMO-01",
    applicantName: "Mateo Vargas",
    fileNumber: "A2-17865",
    date: "2042-11-12",
    campId: "1",
    appearanceNotes: "Cicatriz en brazo derecho; signos de desnutricion.",
    fingerprintsScanned: true,
    aiScore: 84,
    suggestedDecision: "ACCEPT",
    aiAnalysis: "Evaluacion neuronal sugiere adaptacion estable en entornos cerrados.",
    rulesApplied: ["CRITICAL_ROLE_NEEDED", "HEALTH_SCORE_OK"],
    aiRecommendation: "accept",
    contactEmail: "mateo.vargas@demo.com",
    admissionStatus: "PENDING_REVIEW",
  },
  {
    id: "DEMO-02",
    applicantName: "Lucia Silva",
    fileNumber: "A2-17866",
    date: "2042-11-13",
    campId: "2",
    appearanceNotes: "Quemaduras leves y fatiga prolongada.",
    fingerprintsScanned: false,
    aiScore: 62,
    suggestedDecision: "REJECT",
    aiAnalysis: "Riesgo medico elevado y baja tolerancia al confinamiento.",
    rulesApplied: ["HEALTH_SCORE_OK"],
    aiRecommendation: "reject",
    contactEmail: null,
    admissionStatus: "PENDING_REVIEW",
  },
  {
    id: "DEMO-03",
    applicantName: "Hector Cruz",
    fileNumber: "A2-17867",
    date: "2042-11-14",
    campId: "1",
    appearanceNotes: "Exposicion a polvo radiactivo; requiere cuarentena.",
    fingerprintsScanned: true,
    aiScore: 76,
    suggestedDecision: "ACCEPT",
    aiAnalysis: "Adaptacion social alta; requiere seguimiento medico.",
    rulesApplied: ["CRITICAL_ROLE_NEEDED"],
    aiRecommendation: "review",
    contactEmail: "hector.cruz@demo.com",
    admissionStatus: "PENDING_REVIEW",
  },
]

const DEMO_SUMMARIES: AdmissionSummary[] = DEMO_ADMISSIONS.map(
  ({ id, applicantName, fileNumber, date }) => ({
    id,
    applicantName,
    fileNumber,
    date,
  }),
)

const DEMO_BY_ID = new Map(DEMO_ADMISSIONS.map((item) => [item.id, item]))

const formatDate = (value: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

const buildApplicantName = (admission: AiAdmission): string => {
  const candidate = admission.candidate_data ?? ({} as AiAdmission["candidate_data"])
  return [candidate.first_name, candidate.last_name, candidate.last_name2]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim()
}

const normalizeRecommendation = (suggested: string | null | undefined): AiRecommendation => {
  const value = (suggested ?? "").toUpperCase()
  if (value.includes("ACCEPT")) return "accept"
  if (value.includes("REJECT")) return "reject"
  return "review"
}

const formatAiAnalysis = (text: string) => {
  if (!text) return "Sin análisis detallado."
  let formatted = text
    // ── Structural / header phrases ──────────────────────────────────────
    .replace(/Overall assessment:/gi, "Evaluación general:")
    .replace(/Overall evaluation:/gi, "Evaluación general:")
    .replace(/Final assessment:/gi, "Evaluación final:")
    .replace(/Final evaluation:/gi, "Evaluación final:")
    .replace(/Evaluation Breakdown:/gi, "Desglose de Evaluación:")
    .replace(/Evaluation summary:/gi, "Resumen de evaluación:")
    .replace(/Detailed analysis:/gi, "Análisis detallado:")
    .replace(/Candidate assessment:/gi, "Evaluación del candidato:")
    .replace(/Applicant profile:/gi, "Perfil del solicitante:")
    .replace(/Candidate profile:/gi, "Perfil del candidato:")
    .replace(/Profile summary:/gi, "Resumen del perfil:")
    .replace(/Analysis:/gi, "Análisis:")
    .replace(/Summary:/gi, "Resumen:")
    .replace(/Recommendation:/gi, "Recomendación:")
    .replace(/Decision:/gi, "Decisión:")
    .replace(/Confidence:/gi, "Confianza:")
    .replace(/Status:/gi, "Estado:")
    .replace(/Score:/gi, "Puntaje:")
    .replace(/Points:/gi, "Puntos:")
    .replace(/Total score:/gi, "Puntaje total:")
    .replace(/\bNote:/gi, "Nota:")
    .replace(/Warning:/gi, "Advertencia:")
    // ── Sentence starters about the candidate ────────────────────────────
    .replace(
      /The (candidate|applicant) (has|is|shows|presents|demonstrates)/gi,
      (_, _p, verb) =>
        `El candidato ${verb === "has" ? "tiene" : verb === "is" ? "es" : verb === "shows" || verb === "presents" || verb === "demonstrates" ? "presenta" : verb}`,
    )
    .replace(
      /This (candidate|applicant) (has|is|shows|presents|demonstrates)/gi,
      (_, _p, verb) =>
        `Este candidato ${verb === "has" ? "tiene" : verb === "is" ? "es" : "presenta"}`,
    )
    .replace(/The applicant/gi, "El solicitante")
    .replace(/The candidate/gi, "El candidato")
    .replace(/This applicant/gi, "Este solicitante")
    .replace(/This candidate/gi, "Este candidato")
    .replace(
      /Based on the (evaluation|assessment|analysis|data|information|profile)/gi,
      "Basándose en la evaluación",
    )
    .replace(/Based on available (data|information)/gi, "En base a los datos disponibles")
    .replace(/According to the (evaluation|assessment|profile)/gi, "Según la evaluación")
    .replace(/Taking into account/gi, "Teniendo en cuenta")
    .replace(/It is (recommended|advised) (to|that)/gi, "Se recomienda")
    .replace(/It is not (recommended|advised)/gi, "No se recomienda")
    // ── Decision / recommendation tokens ─────────────────────────────────
    .replace(/RECOMMEND_REJECT/gi, "RECHAZO RECOMENDADO")
    .replace(/RECOMMEND_ACCEPT/gi, "INGRESO RECOMENDADO")
    .replace(/RECOMMEND_REVIEW/gi, "REVISIÓN RECOMENDADA")
    .replace(/HIGH confidence/gi, "Confianza ALTA")
    .replace(/MEDIUM confidence/gi, "Confianza MEDIA")
    .replace(/LOW confidence/gi, "Confianza BAJA")
    .replace(/\bApproved\b/gi, "Aprobado")
    .replace(/\bRejected\b/gi, "Rechazado")
    .replace(/\bApprove\b/gi, "Aprobar")
    .replace(/\bReject\b/gi, "Rechazar")
    .replace(/\bReview\b/gi, "Revisión")
    .replace(/\bReviewed\b/gi, "Revisado")
    .replace(/\bPending\b/gi, "Pendiente")
    .replace(/\bAccepted\b/gi, "Aceptado")
    .replace(/Suitable for (the )?camp/gi, "Apto para el campamento")
    .replace(/Not suitable for (the )?camp/gi, "No apto para el campamento")
    .replace(/\bSuitable\b/gi, "Apto")
    .replace(/\bUnsuitable\b/gi, "No apto")
    .replace(/Not suitable/gi, "No apto")
    .replace(
      /Further evaluation (needed|required|recommended)/gi,
      "Se requiere evaluación adicional",
    )
    .replace(
      /Additional (evaluation|assessment) (needed|required)/gi,
      "Evaluación adicional requerida",
    )
    .replace(/Meets (the )?requirements/gi, "Cumple los requisitos")
    .replace(/Does not meet (the )?requirements/gi, "No cumple los requisitos")
    // ── Field labels ──────────────────────────────────────────────────────
    .replace(/Profession Need:/gi, "Necesidad de Profesión:")
    .replace(/Profession:/gi, "Profesión:")
    .replace(/Skills:/gi, "Habilidades:")
    .replace(/Health:/gi, "Salud:")
    .replace(/Physical:/gi, "Físico:")
    .replace(/Physical condition:/gi, "Condición física:")
    .replace(/Health status:/gi, "Estado de salud:")
    .replace(/Resource Impact:/gi, "Impacto en Recursos:")
    .replace(/Family Bonus:/gi, "Bono Familiar:")
    .replace(/Criminal record:/gi, "Antecedentes penales:")
    .replace(/Criminal background:/gi, "Antecedentes penales:")
    .replace(/No criminal record/gi, "Sin antecedentes penales")
    .replace(/No criminal background/gi, "Sin antecedentes penales")
    .replace(/Criminal record: (none|no|false)/gi, "Antecedentes penales: Ninguno")
    .replace(/Criminal record: (yes|true)/gi, "Antecedentes penales: Registrado")
    .replace(/Years of experience:/gi, "Años de experiencia:")
    .replace(/Years experience:/gi, "Años de experiencia:")
    .replace(/Experience:/gi, "Experiencia:")
    .replace(/Previous profession:/gi, "Profesión anterior:")
    .replace(/Previous occupation:/gi, "Ocupación anterior:")
    .replace(/Occupation:/gi, "Ocupación:")
    .replace(/Age:/gi, "Edad:")
    .replace(/Background:/gi, "Antecedentes:")
    .replace(/Psychological evaluation:/gi, "Evaluación psicológica:")
    .replace(/Psychological score:/gi, "Puntaje psicológico:")
    .replace(/Medical conditions?:/gi, "Condiciones médicas:")
    .replace(/Medical history:/gi, "Historial médico:")
    .replace(/Personal history:/gi, "Historia personal:")
    // ── Qualitative descriptors ───────────────────────────────────────────
    .replace(/\bexcellent\b/gi, "excelente")
    .replace(/\bvery good\b/gi, "muy bueno")
    .replace(/\bgood\b/gi, "bueno")
    .replace(/\bfair\b/gi, "regular")
    .replace(/\bpoor\b/gi, "deficiente")
    .replace(/\bvery poor\b/gi, "muy deficiente")
    .replace(/\baverage\b/gi, "promedio")
    .replace(/\bbelow average\b/gi, "por debajo del promedio")
    .replace(/\babove average\b/gi, "por encima del promedio")
    .replace(/\bmoderate\b/gi, "moderado")
    .replace(/\bhigh\b/gi, "alto")
    .replace(/\bmedium\b/gi, "medio")
    .replace(/\blow\b/gi, "bajo")
    .replace(/\bstrong\b/gi, "sólido")
    .replace(/\bweak\b/gi, "débil")
    .replace(/\bhealthy\b/gi, "saludable")
    .replace(/\bunhealthy\b/gi, "con problemas de salud")
    .replace(/\bfit\b/gi, "en forma")
    .replace(/\bunfit\b/gi, "no apto físicamente")
    .replace(/\bstable\b/gi, "estable")
    .replace(/\bunstable\b/gi, "inestable")
    .replace(/\bcritical\b/gi, "crítico")
    .replace(/\bnormal\b/gi, "normal")
    .replace(/\boptimal\b/gi, "óptimo")
    .replace(/\bminimal\b/gi, "mínimo")
    .replace(/\bsignificant\b/gi, "significativo")
    .replace(/\blimited\b/gi, "limitado")
    .replace(/\bextensive\b/gi, "amplio")
    .replace(/\bspecialized\b/gi, "especializado")
    // ── Skill / profession assessment phrases ─────────────────────────────
    .replace(/Has generally useful skills/gi, "Posee habilidades genéricas útiles")
    .replace(/valuable skills identified/gi, "habilidades de valor identificadas")
    .replace(/valuable skill identified/gi, "habilidad de valor identificada")
    .replace(/No specific critical skills/gi, "Sin habilidades críticas específicas")
    .replace(/No relevant skills/gi, "Sin habilidades relevantes")
    .replace(/Relevant skills found/gi, "Habilidades relevantes encontradas")
    .replace(/High value profession for camp/gi, "Profesión de altísimo valor para el campamento")
    .replace(/Medium value profession/gi, "Profesión de valor regular")
    .replace(/Low value profession/gi, "Profesión de bajo valor")
    .replace(/No profession (listed|specified|provided)/gi, "Sin profesión registrada")
    .replace(/Profession (listed|specified): none/gi, "Sin profesión registrada")
    .replace(/No (previous )?work experience/gi, "Sin experiencia laboral previa")
    .replace(/No experience/gi, "Sin experiencia")
    // ── Camp / resource assessment phrases ───────────────────────────────
    .replace(/Camp in deficit, non-producer/gi, "Camp. en déficit, civil no productor")
    .replace(/Camp in surplus, producer/gi, "Camp. con superávit, civil productor")
    .replace(/Camp (is )?at capacity/gi, "Campamento al límite de capacidad")
    .replace(/Camp (has )?available space/gi, "Campamento con espacio disponible")
    .replace(/Resource (impact|burden):/gi, "Impacto en recursos:")
    .replace(/Will (consume|use) resources/gi, "Consumirá recursos del campamento")
    .replace(/Will (produce|contribute) resources/gi, "Aportará recursos al campamento")
    // ── Family / social phrases ───────────────────────────────────────────
    .replace(/No family connections/gi, "Sin conexiones familiares dentro")
    .replace(/Family member inside/gi, "Familiar refugiado en la estación")
    .replace(/Has family (at|in) (the )?camp/gi, "Tiene familia en el campamento")
    .replace(/No known family/gi, "Sin familia conocida en el campamento")
    // ── Risk and security ─────────────────────────────────────────────────
    .replace(/Risk level:/gi, "Nivel de riesgo:")
    .replace(/Risk:/gi, "Riesgo:")
    .replace(/High risk/gi, "Riesgo alto")
    .replace(/Medium risk/gi, "Riesgo medio")
    .replace(/Low risk/gi, "Riesgo bajo")
    .replace(/No risk/gi, "Sin riesgo identificado")
    .replace(/Security (risk|concern|threat)/gi, "Riesgo de seguridad")
    .replace(/No concerns/gi, "Sin observaciones")
    .replace(/Security concerns/gi, "Observaciones de seguridad")
    .replace(/Medical concerns/gi, "Observaciones médicas")
    .replace(/No medical history/gi, "Sin historial médico")
    .replace(/No medical conditions/gi, "Sin condiciones médicas")
    .replace(/Clean background/gi, "Antecedentes limpios")
    .replace(/No issues (found|detected|identified)/gi, "Sin problemas detectados")
    .replace(/Issues (found|detected|identified)/gi, "Problemas detectados")
    // ── State / progress words ────────────────────────────────────────────
    .replace(/Under review/gi, "En revisión")
    .replace(/In progress/gi, "En proceso")
    .replace(/Completed/gi, "Completado")
    .replace(/\bNone\b/g, "Ninguno")
    .replace(/\bN\/A\b/gi, "N/A")
    .replace(/\bUnknown\b/gi, "Desconocido")
    .replace(/Not specified/gi, "No especificado")
    .replace(/Not provided/gi, "No proporcionado")
    .replace(/Not available/gi, "No disponible")
    .replace(/Not applicable/gi, "No aplica")
    .replace(/\bYes\b/g, "Sí")
    .replace(/\bNo\b/g, "No")
    .replace(/\bTrue\b/gi, "Verdadero")
    .replace(/\bFalse\b/gi, "Falso")
    // ── Miscellaneous ─────────────────────────────────────────────────────
    .replace(/\bpoints\b/gi, "puntos")
    .replace(/\bof\b/g, "de")
    .replace(/years? of experience/gi, "años de experiencia")
    .replace(/(\d+) year[s]? old/gi, "$1 años de edad")
    .replace(/Age: (\d+)/gi, "Edad: $1")

  formatted = formatted.replace(/Decisión:/gi, "\n\nDecisión:")
  formatted = formatted.replace(/Desglose de Evaluación:/gi, "\n\nDesglose de Evaluación:\n")
  formatted = formatted.replace(/- \[\d+\/\d+\]/g, (match) => `\n${match}`)

  return formatted.split("\n").map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return null

    if (trimmed.startsWith("- [")) {
      const parts = trimmed.split(":")
      if (parts.length > 1) {
        const bulletTitle = parts[0]
        const bulletDesc = parts.slice(1).join(":")
        return (
          <span
            key={index}
            style={{
              display: "block",
              marginBottom: "8px",
              marginLeft: "10px",
              paddingLeft: "10px",
              borderLeft: "2px solid #555",
            }}
          >
            <strong style={{ color: "var(--accent-mil)" }}>{bulletTitle}:</strong>
            {bulletDesc}
          </span>
        )
      }
    }

    if (trimmed.startsWith("Desglose")) {
      return (
        <strong
          key={index}
          style={{
            display: "block",
            marginBottom: "10px",
            marginTop: "15px",
            borderBottom: "1px dashed #555",
            paddingBottom: "4px",
          }}
        >
          {trimmed}
        </strong>
      )
    }

    if (trimmed.startsWith("Decisión:") || trimmed.startsWith("Puntaje:")) {
      return (
        <span key={index} style={{ display: "block", marginBottom: "6px" }}>
          <strong>{trimmed.split(":")[0]}:</strong>{" "}
          <span style={{ color: "var(--accent-critical)" }}>
            {trimmed.split(":").slice(1).join(":")}
          </span>
        </span>
      )
    }

    return (
      <span key={index} style={{ display: "block", marginBottom: "6px" }}>
        {trimmed}
      </span>
    )
  })
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
  const appearanceNotes = [candidate.medical_conditions?.join(", "), candidate.personal_history]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" | ")

  return {
    ...mapAdmissionSummary(admission),
    campId: admission.camp_id ?? "",
    appearanceNotes: appearanceNotes || "Sin observaciones adicionales.",
    fingerprintsScanned: Boolean(candidate.id_card_url),
    photoUrl: candidate.photo_url ?? null,
    aiScore: admission.score ?? 0,
    suggestedDecision,
    aiAnalysis: analysis,
    rulesApplied,
    aiRecommendation,
    contactEmail: candidate.contact_email ?? null,
    admissionStatus: admission.status ?? "PENDING_REVIEW",
  }
}

export default function AdmissionsBook() {
  const { camps } = useCamp()
  const [admissions, setAdmissions] = useState<AdmissionSummary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailData, setDetailData] = useState<AdmissionDetail | null>(null)
  const [decision, setDecision] = useState<"ACCEPT" | "REJECT" | null>(null)
  const [showingProcessed, setShowingProcessed] = useState(false)
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [decisionError, setDecisionError] = useState("")
  const [isDemoData, setIsDemoData] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")

  // Camp assignment modal
  const [showCampModal, setShowCampModal] = useState(false)
  const [selectedCampId, setSelectedCampId] = useState<string>("")

  // Account creation (processed view)
  const [accountUsername, setAccountUsername] = useState("")
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [accountDone, setAccountDone] = useState(false)

  // Load pending (human review) + auto-decided admissions
  useEffect(() => {
    let isMounted = true

    const loadAdmissions = async () => {
      setLoading(true)
      try {
        const [pendingResponse, autoDecided] = await Promise.all([
          getPendingAdmissions({ page: 1, limit: 100 }),
          getAutoDecidedAdmissions(),
        ])
        if (!isMounted) return
        const all = [...(pendingResponse.data ?? []), ...autoDecided]
        if (all.length > 0) {
          setAdmissions(all.map(mapAdmissionSummary))
          setIsDemoData(false)
          setCurrentIndex(0)
        } else if (DEMO_ADMISSIONS_ENABLED) {
          setAdmissions(DEMO_SUMMARIES)
          setIsDemoData(true)
        } else {
          setAdmissions([])
          setIsDemoData(false)
        }
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
  }, [])

  useEffect(() => {
    if (!admissions[currentIndex]) return
    let isMounted = true

    const loadDetail = async () => {
      setLoading(true)
      setAdminNotes("")
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
          campId: "",
          appearanceNotes: "Sin observaciones adicionales.",
          fingerprintsScanned: false,
          aiScore: 0,
          suggestedDecision: "REJECT",
          aiAnalysis: "Evaluación automática registrada.",
          rulesApplied: [],
          aiRecommendation: "review",
          contactEmail: null,
          admissionStatus: "PENDING_REVIEW",
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

  const archiveAdmission = (callBackendArchive = false) => {
    if (callBackendArchive && detailData && !isDemoData) {
      void archiveAdmissionApi(detailData.id).catch(() => {
        // already-archived errors are acceptable here
      })
    }
    setAdmissions((previous) => {
      const next = [...previous]
      next.splice(currentIndex, 1)
      const nextIndex = Math.min(currentIndex, Math.max(0, next.length - 1))
      setCurrentIndex(nextIndex)
      return next
    })
    setDecision(null)
    setShowingProcessed(false)
    setAccountDone(false)
    setAccountError("")
    setAccountUsername("")
  }

  // ARCHIVE — for auto-decided admissions (AUTO_ACCEPTED / AUTO_REJECTED)
  const handleArchiveAutoDecided = async () => {
    if (!detailData) return
    setIsProcessing(true)
    setDecisionError("")
    if (!isDemoData) {
      try {
        await archiveAdmissionApi(detailData.id)
      } catch {
        setDecisionError("Error al archivar el expediente. Intente de nuevo.")
        setIsProcessing(false)
        return
      }
    }
    setIsProcessing(false)
    archiveAdmission()
  }

  // REJECT — immediate, no camp picker needed
  const handleReject = async () => {
    if (!detailData) return
    setDecision("REJECT")
    setDecisionError("")
    setIsProcessing(true)
    if (isDemoData) {
      setTimeout(() => {
        archiveAdmission()
        setIsProcessing(false)
      }, 1000)
      return
    }
    try {
      await reviewAdmission(detailData.id, {
        decision: "rejected",
        notes: adminNotes.trim() || "Revisado",
      })
      setTimeout(() => archiveAdmission(), 900)
    } catch {
      setDecision(null)
      setDecisionError("Error al procesar el rechazo. Intente de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  // ACCEPT step 1 — open camp picker
  const handleAcceptClick = () => {
    if (!detailData) return
    // Pre-select the camp they originally applied to
    setSelectedCampId(detailData.campId || (camps[0]?.id ?? ""))
    setShowCampModal(true)
  }

  // ACCEPT step 2 — confirmed with camp selection
  const handleAcceptConfirm = async () => {
    if (!detailData) return
    setShowCampModal(false)
    setDecision("ACCEPT")
    setDecisionError("")
    setIsProcessing(true)

    // Pre-fill username from name
    const nameParts = detailData.applicantName.toLowerCase().replace(/\s+/g, ".")
    setAccountUsername(nameParts.slice(0, 20) || "sobreviviente")

    if (isDemoData) {
      setTimeout(() => {
        setShowingProcessed(true)
        setIsProcessing(false)
      }, 1000)
      return
    }
    try {
      const result = await reviewAdmission(detailData.id, {
        decision: "accepted",
        notes: adminNotes.trim() || "Revisado",
        ...(selectedCampId ? { assign_to_camp_id: Number(selectedCampId) } : {}),
      })
      void result
      setTimeout(() => setShowingProcessed(true), 900)
    } catch {
      setDecision(null)
      setDecisionError("Error al aprobar la admisión. Intente de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Account creation after ACCEPT
  const handleCreateAccount = async () => {
    if (!detailData?.contactEmail) {
      setAccountError("No hay correo de contacto registrado para este solicitante.")
      return
    }
    if (!accountUsername.trim()) {
      setAccountError("El nombre de usuario no puede estar vacío.")
      return
    }
    setIsCreatingAccount(true)
    setAccountError("")
    const tempPassword = `Alfa${Math.random().toString(36).slice(2, 8)}!`
    try {
      await createAdmissionAccount(detailData.id, {
        username: accountUsername.trim(),
        email: detailData.contactEmail,
        password: tempPassword,
        role_id: 2,
      })
      setAccountDone(true)
    } catch (err: unknown) {
      // Extract the real error from the API response
      let msg = "No se pudo crear la cuenta."
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } }
        message?: string
      }
      const backendMsg = axiosErr?.response?.data?.message
      if (backendMsg) {
        const raw = Array.isArray(backendMsg) ? backendMsg.join(", ") : backendMsg
        if (
          raw.toLowerCase().includes("already exists") ||
          raw.toLowerCase().includes("duplicate") ||
          raw.toLowerCase().includes("ya existe")
        ) {
          msg =
            "⚠ Ya existe una cuenta con ese usuario o correo. Cambia el nombre de usuario e intenta de nuevo."
        } else if (
          raw.toLowerCase().includes("not accepted") ||
          raw.toLowerCase().includes("person not created")
        ) {
          msg =
            "⚠ La admisión no fue procesada correctamente. Recarga la página e intenta aceptar de nuevo."
        } else if (
          raw.toLowerCase().includes("correo no pudo enviarse") ||
          raw.toLowerCase().includes("correo no pudo")
        ) {
          // La cuenta SI fue creada, solo falló el email — marcar como done con advertencia
          setAccountDone(true)
          setAccountError(
            "⚠ Cuenta creada, pero el correo no se pudo enviar. Comunica las credenciales al candidato manualmente.",
          )
          return
        } else {
          msg = `⚠ Error: ${raw}`
        }
      } else if (axiosErr?.message) {
        msg = `⚠ ${axiosErr.message}`
      }
      setAccountError(msg)
    } finally {
      setIsCreatingAccount(false)
    }
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
          [ ALERTA ] NO HAY ADMISIONES PENDIENTES EN EL SISTEMA
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

          {/* The physical page-turn (CSS flip) is the transition. The content
              swap is instant and happens while the flip overlay covers the
              spread, so no opacity cross-fade is needed — a fade here finished
              after the flip lifted, which read as a flicker on every turn. */}
          {detailData ? (
            <div
              key={detailData.id + (showingProcessed ? "-processed" : "-review")}
              className="portfolio-spread"
            >
              <div className="portfolio-page left-page">
                <div className="binder-header">PERFIL DE INTELIGENCIA</div>
                <div className="profile-photo">
                  {detailData.photoUrl ? (
                    <img
                      src={detailData.photoUrl}
                      alt="Foto del solicitante"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <svg viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                      </svg>
                      <span
                        style={{
                          fontSize: "0.55rem",
                          color: "#666",
                          fontFamily: "var(--font-mono)",
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        SIN FOTO
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <span>EXPEDIENTE:</span> <span>{detailData.fileNumber}</span>
                </div>
                <div className="form-field">
                  <span>NOMBRE:</span> <span>{detailData.applicantName}</span>
                </div>
                <div className="form-field">
                  <span>FECHA:</span> <span>{detailData.date}</span>
                </div>
                <div className="form-field">
                  <span>NOTAS:</span>
                  <span style={{ fontFamily: "var(--font-marker)" }}>
                    {detailData.appearanceNotes}
                  </span>
                </div>
                <div className="form-field">
                  <span>BIOMETRÍA:</span>
                  <span className={detailData.fingerprintsScanned ? "biometrics-ok" : ""}>
                    {detailData.fingerprintsScanned ? "VERIFICADO" : "PENDIENTE"}
                  </span>
                </div>
                <div className="form-field">
                  <span>CAMPAMENTO:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {camps.find((c) => String(c.id) === String(detailData.campId))?.name ??
                      `BASE #${detailData.campId || "?"}`}
                  </span>
                </div>

                {decision ? (
                  <div
                    className="decision-stamp-overlay"
                    style={{
                      color: decision === "ACCEPT" ? "var(--accent-mil)" : "var(--accent-critical)",
                      borderColor:
                        decision === "ACCEPT" ? "var(--accent-mil)" : "var(--accent-critical)",
                    }}
                  >
                    {decision === "ACCEPT" ? "ACEPTADO" : "RECHAZADO"}
                  </div>
                ) : null}
              </div>

              <div className="portfolio-page right-page" style={{ padding: "20px 30px" }}>
                {!showingProcessed ? (
                  <>
                    <div className="binder-header" style={{ marginBottom: "10px" }}>
                      {detailData.admissionStatus === "AUTO_ACCEPTED" ||
                      detailData.admissionStatus === "AUTO_REJECTED"
                        ? "DECISIÓN AUTOMÁTICA"
                        : "REVISIÓN DE IA"}
                    </div>

                    {(detailData.admissionStatus === "AUTO_ACCEPTED" ||
                      detailData.admissionStatus === "AUTO_REJECTED") && (
                      <div
                        style={{
                          background:
                            detailData.admissionStatus === "AUTO_ACCEPTED"
                              ? "rgba(76,99,81,0.15)"
                              : "rgba(156,39,32,0.12)",
                          border: `1px solid ${detailData.admissionStatus === "AUTO_ACCEPTED" ? "var(--accent-mil)" : "var(--accent-critical)"}`,
                          color:
                            detailData.admissionStatus === "AUTO_ACCEPTED"
                              ? "var(--accent-mil)"
                              : "var(--accent-critical)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          padding: "6px 10px",
                          marginBottom: "10px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {detailData.admissionStatus === "AUTO_ACCEPTED"
                          ? "⚡ El sistema aprobó esta solicitud automáticamente. Solo puede archivarla."
                          : "⛔ El sistema rechazó esta solicitud automáticamente. Solo puede archivarla."}
                      </div>
                    )}

                    {/* Contenedor escroleable para que los botones nunca se escondan */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        paddingRight: "10px",
                        marginBottom: "10px",
                      }}
                      className="scrollbar-thin"
                    >
                      <div className="ai-evaluation-section">
                        <div className="form-field">
                          <span>SCORE IA:</span>
                          <span
                            style={{
                              color:
                                detailData.aiScore >= 80
                                  ? "var(--accent-mil)"
                                  : "var(--accent-critical)",
                              fontSize: "1.2em",
                            }}
                          >
                            {detailData.aiScore}/100
                          </span>
                        </div>
                        <div className="form-field">
                          <span>SUGERENCIA:</span>
                          <span>
                            {detailData.suggestedDecision === "ACCEPT" ? "ACEPTAR" : "RECHAZAR"}
                          </span>
                        </div>
                        <div
                          className="form-field"
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div style={{ marginBottom: "5px" }}>ANÁLISIS:</div>
                          <span
                            style={{
                              fontFamily: "var(--font-typewriter)",
                              fontSize: "0.95em",
                              lineHeight: "1.3",
                            }}
                          >
                            {formatAiAnalysis(detailData.aiAnalysis)}
                          </span>
                        </div>
                        <div className="form-field">
                          <span>REGLAS:</span>
                          <ul
                            style={{
                              fontSize: "0.9em",
                              paddingLeft: "20px",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
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

                      {detailData.admissionStatus === "PENDING_REVIEW" && (
                        <>
                          <div className="binder-header" style={{ marginTop: "12px" }}>
                            RESOLUCIÓN OFICIAL
                          </div>
                          <div className="form-field comments-field" style={{ marginTop: "10px" }}>
                            <label
                              htmlFor="field-912"
                              style={{ display: "block", marginBottom: "5px" }}
                            >
                              COMENTARIOS (OPCIONAL):
                            </label>
                            <textarea
                              id="field-912"
                              className="vintage-input"
                              value={adminNotes}
                              onChange={(event) => setAdminNotes(event.target.value)}
                              placeholder="Escriba observaciones..."
                              style={{ width: "100%", height: "48px", resize: "none" }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {decisionError && (
                      <div
                        style={{
                          background: "rgba(156,39,32,0.12)",
                          border: "1px solid #9c2720",
                          color: "#9c2720",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          padding: "6px 10px",
                          marginBottom: "8px",
                          borderRadius: "3px",
                        }}
                      >
                        ⚠ {decisionError}
                      </div>
                    )}

                    {detailData.admissionStatus === "PENDING_REVIEW" ? (
                      <div className="binder-footer decision-footer">
                        <StampButton
                          label="RECHAZAR"
                          type="reject"
                          onClick={handleReject}
                          disabled={!!decision || isProcessing}
                        />
                        <StampButton
                          label="ACEPTAR"
                          type="accept"
                          onClick={handleAcceptClick}
                          disabled={!!decision || isProcessing}
                        />
                      </div>
                    ) : (
                      <div
                        className="binder-footer"
                        style={{ justifyContent: "center", gap: "12px" }}
                      >
                        {detailData.admissionStatus === "AUTO_ACCEPTED" &&
                          detailData.contactEmail && (
                            <button
                              className="book-archive-btn"
                              onClick={() => setShowingProcessed(true)}
                              disabled={isProcessing}
                            >
                              CREAR CUENTA Y ARCHIVAR
                            </button>
                          )}
                        <button
                          className="book-archive-btn book-archive-btn--secondary"
                          onClick={() => void handleArchiveAutoDecided()}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "ARCHIVANDO..." : "ARCHIVAR EXPEDIENTE"}
                        </button>
                      </div>
                    )}
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

                    {!accountDone ? (
                      <div
                        style={{
                          width: "100%",
                          marginTop: "60px",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#444",
                            marginBottom: "16px",
                            textAlign: "center",
                          }}
                        >
                          CREAR CUENTA DE ACCESO Y ENVIAR CREDENCIALES AL CORREO REGISTRADO
                        </p>
                        {detailData.contactEmail ? (
                          <>
                            <div style={{ marginBottom: "12px" }}>
                              <div
                                style={{
                                  display: "block",
                                  fontSize: "0.7rem",
                                  fontWeight: "bold",
                                  marginBottom: "4px",
                                  color: "#333",
                                }}
                              >
                                CORREO DESTINO
                              </div>
                              <div
                                style={{
                                  background: "#e8e0d4",
                                  border: "1px solid #bbb",
                                  padding: "6px 10px",
                                  fontSize: "0.8rem",
                                  color: "#555",
                                }}
                              >
                                {detailData.contactEmail}
                              </div>
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                              <div
                                style={{
                                  display: "block",
                                  fontSize: "0.7rem",
                                  fontWeight: "bold",
                                  marginBottom: "4px",
                                  color: "#333",
                                }}
                              >
                                NOMBRE DE USUARIO
                              </div>
                              <input
                                className="vintage-input"
                                value={accountUsername}
                                onChange={(e) => setAccountUsername(e.target.value)}
                                style={{
                                  width: "100%",
                                  boxSizing: "border-box",
                                  fontSize: "0.85rem",
                                }}
                                maxLength={30}
                              />
                            </div>
                            {accountError && (
                              <div
                                style={{
                                  color: "#9c2720",
                                  fontSize: "0.7rem",
                                  marginBottom: "10px",
                                }}
                              >
                                ⚠ {accountError}
                              </div>
                            )}
                            <div
                              className="binder-footer"
                              style={{
                                position: "static",
                                marginTop: "16px",
                                gap: "12px",
                                flexDirection: "column",
                              }}
                            >
                              <button
                                className="book-archive-btn"
                                onClick={() => void handleCreateAccount()}
                                disabled={isCreatingAccount}
                              >
                                {isCreatingAccount
                                  ? "CREANDO CUENTA..."
                                  : "CREAR CUENTA Y ENVIAR EMAIL"}
                              </button>
                              <button
                                className="book-archive-btn book-archive-btn--secondary"
                                onClick={() =>
                                  archiveAdmission(detailData?.admissionStatus === "AUTO_ACCEPTED")
                                }
                              >
                                ARCHIVAR SIN CUENTA
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p
                              style={{
                                color: "#9c2720",
                                fontSize: "0.75rem",
                                textAlign: "center",
                                marginBottom: "16px",
                              }}
                            >
                              ⚠ Sin correo registrado — no se puede crear cuenta automáticamente.
                            </p>
                            <div
                              className="binder-footer"
                              style={{
                                position: "static",
                                marginTop: "8px",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                className="book-archive-btn"
                                onClick={() =>
                                  archiveAdmission(detailData?.admissionStatus === "AUTO_ACCEPTED")
                                }
                              >
                                ARCHIVAR EXPEDIENTE
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: "60px",
                          textAlign: "center",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "2rem",
                            color: accountError ? "var(--accent-warning)" : "var(--accent-mil)",
                            marginBottom: "12px",
                          }}
                        >
                          {accountError ? "⚠" : "✓"}
                        </div>
                        <p style={{ fontWeight: "bold", color: "#333", marginBottom: "6px" }}>
                          CUENTA CREADA EXITOSAMENTE
                        </p>
                        {accountError ? (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#9c2720",
                              border: "1px solid #9c2720",
                              padding: "8px",
                              marginBottom: "12px",
                            }}
                          >
                            {accountError}
                          </p>
                        ) : (
                          <p style={{ fontSize: "0.75rem", color: "#666" }}>
                            Se enviaron las credenciales a {detailData.contactEmail}
                          </p>
                        )}
                        <div
                          className="binder-footer"
                          style={{
                            position: "static",
                            marginTop: "20px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="book-archive-btn"
                            onClick={() =>
                              archiveAdmission(detailData?.admissionStatus === "AUTO_ACCEPTED")
                            }
                          >
                            ARCHIVAR Y CONTINUAR
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="page-controls"
        style={{
          display: "flex",
          gap: "30px",
          marginTop: "20px",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <button
          className="arrow-btn"
          onClick={handlePrevPage}
          disabled={currentIndex === 0 || !!decision}
        >
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

      {/* ── CAMP ASSIGNMENT MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showCampModal && detailData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              style={{
                background: "#0e0d0c",
                border: "2px solid #c27c2f",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                width: "100%",
                maxWidth: "520px",
                boxShadow: "0 0 40px rgba(194,124,47,0.2)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: "#1a160f",
                  borderBottom: "2px solid #c27c2f",
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#c27c2f",
                      letterSpacing: "0.15em",
                      marginBottom: "2px",
                    }}
                  >
                    APROBACIÓN — {detailData.applicantName.toUpperCase()}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#fca311",
                      fontSize: "1rem",
                      fontFamily: "var(--font-typewriter)",
                    }}
                  >
                    ASIGNAR CAMPAMENTO DESTINO
                  </h3>
                </div>
                <button
                  onClick={() => setShowCampModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Score bar */}
              <div
                style={{
                  padding: "12px 24px",
                  background: "#161310",
                  borderBottom: "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#ab9e8b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Puntuación IA:
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    background: "#2a2520",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${detailData.aiScore}%`,
                      background:
                        detailData.aiScore >= 70
                          ? "#4c6351"
                          : detailData.aiScore >= 50
                            ? "#c27c2f"
                            : "#9c2720",
                      transition: "width 0.6s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: detailData.aiScore >= 70 ? "#6abf7b" : "#fca311",
                    minWidth: "36px",
                    textAlign: "right",
                  }}
                >
                  {detailData.aiScore}/100
                </span>
              </div>

              {/* Camps list */}
              <div style={{ padding: "16px 24px", maxHeight: "320px", overflowY: "auto" }}>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "#ab9e8b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginTop: 0,
                    marginBottom: "12px",
                  }}
                >
                  Seleccione el campamento de destino — el indicado es donde el solicitante aplicó
                  originalmente:
                </p>
                {camps.map((camp) => {
                  const isOriginal = String(camp.id) === String(detailData.campId)
                  const isSelected = String(camp.id) === String(selectedCampId)
                  // Compatibility: original camp = aiScore, others scale down slightly
                  const compat = isOriginal
                    ? detailData.aiScore
                    : Math.max(30, Math.round(detailData.aiScore * 0.75))
                  const compatColor =
                    compat >= 70 ? "#6abf7b" : compat >= 50 ? "#fca311" : "#e06050"
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedCampId(String(camp.id))}
                      key={camp.id}
                      onClick={() => setSelectedCampId(String(camp.id))}
                      style={{
                        padding: "12px 14px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        borderRadius: "3px",
                        border: isSelected ? "2px solid #c27c2f" : "1px solid #333",
                        background: isSelected ? "#1e1710" : "#141210",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedCampId(String(camp.id))}
                        style={{ accentColor: "#c27c2f" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                              color: isSelected ? "#fca311" : "#ddd",
                            }}
                          >
                            {camp.name?.toUpperCase() ?? `CAMPAMENTO ${camp.id}`}
                          </span>
                          {isOriginal && (
                            <span
                              style={{
                                fontSize: "0.6rem",
                                background: "#c27c2f",
                                color: "#000",
                                padding: "1px 6px",
                                borderRadius: "2px",
                                fontWeight: "bold",
                              }}
                            >
                              SOLICITADO
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              background: "#2a2520",
                              borderRadius: "2px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${compat}%`,
                                background: compatColor,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: compatColor,
                              minWidth: "36px",
                              textAlign: "right",
                            }}
                          >
                            {compat}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer buttons */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid #333",
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => {
                    setShowCampModal(false)
                    setDecision(null)
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: "#aaa",
                    border: "1px solid #555",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                  }}
                >
                  CANCELAR
                </button>
                <button
                  disabled={!selectedCampId}
                  onClick={() => void handleAcceptConfirm()}
                  style={{
                    padding: "10px 24px",
                    background: selectedCampId ? "#c27c2f" : "#2a2520",
                    color: selectedCampId ? "#000" : "#555",
                    border: "none",
                    fontWeight: "bold",
                    cursor: selectedCampId ? "pointer" : "not-allowed",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    borderRadius: "2px",
                  }}
                >
                  CONFIRMAR INGRESO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
