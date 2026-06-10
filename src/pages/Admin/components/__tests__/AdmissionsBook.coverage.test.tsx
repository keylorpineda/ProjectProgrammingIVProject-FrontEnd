import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import AdmissionsBook from "../AdmissionsBook"

import {
  archiveAdmission,
  createAdmissionAccount,
  getAdmissionById,
  getAutoDecidedAdmissions,
  getPendingAdmissions,
  reviewAdmission,
} from "@/features/admissions/services/admissions.service"
import { getCamps } from "@/features/camps/services/camps.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/admissions/services/admissions.service", () => ({
  getPendingAdmissions: vi.fn(),
  getAutoDecidedAdmissions: vi.fn(),
  archiveAdmission: vi.fn(),
  getAdmissionById: vi.fn(),
  reviewAdmission: vi.fn(),
  createAdmissionAccount: vi.fn(),
  submitAdmission: vi.fn(),
  trackAdmission: vi.fn(),
  completeRegistration: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))

const mockedGetPending = getPendingAdmissions as unknown as ReturnType<typeof vi.fn>
const mockedGetAutoDecided = getAutoDecidedAdmissions as unknown as ReturnType<typeof vi.fn>
const mockedArchive = archiveAdmission as unknown as ReturnType<typeof vi.fn>
const mockedGetById = getAdmissionById as unknown as ReturnType<typeof vi.fn>
const mockedReview = reviewAdmission as unknown as ReturnType<typeof vi.fn>
const mockedCreateAccount = createAdmissionAccount as unknown as ReturnType<typeof vi.fn>
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const baseCandidate = {
  first_name: "Sarah",
  last_name: "Connor",
  age: 28,
  skills: ["medicine"],
  medical_conditions: ["asma"],
  personal_history: "Former medic",
  contact_email: "sarah@test.com",
  id_card_url: "https://example.com/id.png",
}

const baseAdmission = {
  id: "555",
  tracking_code: "ADM-TEST-001",
  suggested_decision: "RECOMMEND_ACCEPT",
  score: 88,
  status: "PENDING_REVIEW",
  camp_id: "1",
  submission_date: "2026-02-01T00:00:00.000Z",
  review_date: null,
  raw_ai_response: { nestjs_evaluation: { factors: [{ category: "CRITICAL_ROLE_NEEDED" }] } },
  justification: "Looks good",
  candidate_data: baseCandidate,
}

const emptyPage = { data: [], total: 0, page: 1, limit: 100, totalPages: 0 }

const renderAdmissions = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <AdmissionsBook />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → AdmissionsBook (coverage of uncovered branches)", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)

    mockedGetPending.mockReset()
    mockedGetAutoDecided.mockReset()
    mockedArchive.mockReset()
    mockedGetById.mockReset()
    mockedReview.mockReset()
    mockedCreateAccount.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetAutoDecided.mockResolvedValue([])
    mockedArchive.mockResolvedValue(undefined)
    mockedGetPending.mockResolvedValue({
      data: [baseAdmission],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    })
    mockedGetById.mockResolvedValue(baseAdmission)
  })

  describe("auto-decided admissions", () => {
    const autoAccepted = {
      ...baseAdmission,
      id: "700",
      tracking_code: "ADM-AUTO-700",
      status: "AUTO_ACCEPTED",
    }

    beforeEach(() => {
      mockedGetPending.mockResolvedValue(emptyPage)
      mockedGetAutoDecided.mockResolvedValue([autoAccepted])
      mockedGetById.mockResolvedValue(autoAccepted)
    })

    it("renders the AUTO_ACCEPTED panel with an archive-with-account action", async () => {
      renderAdmissions()
      expect(await screen.findByText(/DECISIÓN AUTOMÁTICA/i)).toBeInTheDocument()
      expect(screen.getByText(/aprobó esta solicitud automáticamente/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /CREAR CUENTA Y ARCHIVAR/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /ARCHIVAR EXPEDIENTE/i })).toBeInTheDocument()
    })

    it("'CREAR CUENTA Y ARCHIVAR' opens the processed view, then 'ARCHIVAR SIN CUENTA' archives in the backend", async () => {
      const user = userEvent.setup()
      renderAdmissions()

      await user.click(await screen.findByRole("button", { name: /CREAR CUENTA Y ARCHIVAR/i }))

      // processed view appeared
      expect(await screen.findByText(/^RESULTADO$/i)).toBeInTheDocument()
      const archiveWithoutAccount = await screen.findByRole("button", {
        name: /ARCHIVAR SIN CUENTA/i,
      })
      await user.click(archiveWithoutAccount)

      // AUTO_ACCEPTED → archiveAdmission(true) hits the backend archive endpoint
      await waitFor(() => expect(mockedArchive).toHaveBeenCalledWith("700"))
    })

    it("'ARCHIVAR EXPEDIENTE' on an auto-decided file calls the backend archive endpoint", async () => {
      const user = userEvent.setup()
      renderAdmissions()

      const archiveBtn = await screen.findByRole("button", { name: /ARCHIVAR EXPEDIENTE/i })
      await user.click(archiveBtn)

      await waitFor(() => expect(mockedArchive).toHaveBeenCalledWith("700"))
    })

    it("AUTO_REJECTED shows the rejection notice and no account action", async () => {
      const autoRejected = {
        ...autoAccepted,
        id: "701",
        status: "AUTO_REJECTED",
        candidate_data: { ...baseCandidate, contact_email: null },
      }
      mockedGetAutoDecided.mockResolvedValue([autoRejected])
      mockedGetById.mockResolvedValue(autoRejected)

      renderAdmissions()

      expect(await screen.findByText(/rechazó esta solicitud automáticamente/i)).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /CREAR CUENTA Y ARCHIVAR/i }),
      ).not.toBeInTheDocument()
    })

    it("shows an error when the backend archive fails", async () => {
      const user = userEvent.setup()
      mockedArchive.mockRejectedValue(new Error("archive failed"))

      renderAdmissions()
      const archiveBtn = await screen.findByRole("button", { name: /ARCHIVAR EXPEDIENTE/i })
      await user.click(archiveBtn)

      expect(await screen.findByText(/Error al archivar el expediente/i)).toBeInTheDocument()
    })
  })

  describe("account creation success view", () => {
    beforeEach(() => {
      mockedReview.mockResolvedValue({
        admission: { ...baseAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
    })

    it("shows the success screen and archives via 'ARCHIVAR Y CONTINUAR' (empties the ledger)", async () => {
      const user = userEvent.setup()
      mockedCreateAccount.mockResolvedValue({ id: "9999" })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      await user.click(await screen.findByRole("button", { name: /crear cuenta/i }))

      expect(await screen.findByText(/CUENTA CREADA EXITOSAMENTE/i)).toBeInTheDocument()
      expect(screen.getByText(/Se enviaron las credenciales a sarah@test.com/i)).toBeInTheDocument()

      await user.click(await screen.findByRole("button", { name: /ARCHIVAR Y CONTINUAR/i }))

      // only admission removed → empty ledger placeholder
      expect(
        await screen.findByText(/NO HAY ADMISIONES PENDIENTES EN EL SISTEMA/i),
      ).toBeInTheDocument()
    })

    it("validates an empty username before calling the API", async () => {
      const user = userEvent.setup()

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))

      // processed view: clear the prefilled username then try to create the account
      const usernameInput = await screen.findByDisplayValue(/sarah\.connor/i)
      await user.clear(usernameInput)
      await user.click(await screen.findByRole("button", { name: /crear cuenta/i }))

      expect(
        await screen.findByText(/El nombre de usuario no puede estar vacío/i),
      ).toBeInTheDocument()
      expect(mockedCreateAccount).not.toHaveBeenCalled()
    })

    it("'ARCHIVAR SIN CUENTA' from the processed view archives a PENDING_REVIEW file locally", async () => {
      const user = userEvent.setup()

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      await user.click(await screen.findByRole("button", { name: /ARCHIVAR SIN CUENTA/i }))

      // PENDING_REVIEW → no backend archive call, just local removal → empty ledger
      expect(
        await screen.findByText(/NO HAY ADMISIONES PENDIENTES EN EL SISTEMA/i),
      ).toBeInTheDocument()
      expect(mockedArchive).not.toHaveBeenCalled()
    })
  })

  describe("official resolution notes", () => {
    it("passes the typed comments to reviewAdmission on RECHAZAR", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({ admission: baseAdmission, person: null })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      const notes = await screen.findByPlaceholderText(/Escriba observaciones/i)
      await user.type(notes, "Sospechoso")

      await user.click(await screen.findByRole("button", { name: /rechazar/i }))

      await waitFor(() => expect(mockedReview).toHaveBeenCalled())
      const [, body] = mockedReview.mock.calls[0]
      expect(body.notes).toBe("Sospechoso")
    })
  })

  describe("detail mapping fallbacks", () => {
    it("renders neutral defaults when the admission has no candidate data, score or rules", async () => {
      const minimal = {
        id: "800",
        tracking_code: "ADM-MIN-800",
        suggested_decision: "RECOMMEND_REJECT",
        score: null,
        status: "PENDING_REVIEW",
        camp_id: null,
        submission_date: "bad-date",
        review_date: null,
        raw_ai_response: null,
        justification: null,
        candidate_data: null,
      }
      mockedGetPending.mockResolvedValue({
        data: [minimal],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      mockedGetById.mockResolvedValue(minimal)

      renderAdmissions()

      expect(await screen.findByText(/Sin observaciones adicionales\./i)).toBeInTheDocument()
      expect(screen.getByText("0/100")).toBeInTheDocument()
      expect(screen.getByText("Ninguna")).toBeInTheDocument()
      // suggested_decision REJECT → suggestion label "RECHAZAR"
      expect(screen.getAllByText(/RECHAZAR/i).length).toBeGreaterThanOrEqual(1)
    })

    it("uses the summary fallback detail when getAdmissionById fails", async () => {
      mockedGetById.mockRejectedValue(new Error("boom"))

      renderAdmissions()

      // applicant name still rendered from the summary, score defaults to 0
      expect(await screen.findByText(/Sarah Connor/i)).toBeInTheDocument()
      expect(screen.getByText("0/100")).toBeInTheDocument()
    })
  })

  describe("loading failures", () => {
    it("falls back to demo data when the pending list request rejects", async () => {
      mockedGetPending.mockRejectedValue(new Error("network down"))

      renderAdmissions()

      expect(
        await screen.findByText(/mateo vargas/i, undefined, { timeout: 3000 }),
      ).toBeInTheDocument()
    })
  })

  describe("AI analysis formatting", () => {
    it("renders structured analysis: breakdown header, bullets (with and without colon) and decision line", async () => {
      const structured = {
        ...baseAdmission,
        id: "900",
        justification:
          "Desglose de Evaluación: - [3/5] Salud: estable - [1/5] Detalle general Decisión: ACEPTAR. Texto final adicional.",
      }
      mockedGetPending.mockResolvedValue({
        data: [structured],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      mockedGetById.mockResolvedValue(structured)

      renderAdmissions()

      // breakdown header branch
      expect(await screen.findByText(/Desglose de Evaluación:/i)).toBeInTheDocument()
      // bullet-with-colon branch (title rendered in <strong>)
      expect(screen.getByText(/- \[3\/5\] Salud/i)).toBeInTheDocument()
      // bullet-without-colon + plain decision line branches
      expect(screen.getByText(/Detalle general/i)).toBeInTheDocument()
      expect(screen.getByText(/Texto final adicional/i)).toBeInTheDocument()
    })

    it("translates common English AI phrases before rendering the analysis", async () => {
      const translated = {
        ...baseAdmission,
        id: "901",
        justification:
          "Overall assessment: The candidate has strong health. Recommendation: Approved. Warning: low confidence.",
      }
      mockedGetPending.mockResolvedValue({
        data: [translated],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      mockedGetById.mockResolvedValue(translated)

      renderAdmissions()

      expect(await screen.findByText(/general/i)).toBeInTheDocument()
      expect(screen.getByText(/El candidato tiene/i)).toBeInTheDocument()
      expect(screen.getByText(/Aprobado/i)).toBeInTheDocument()
      expect(screen.getByText(/Advertencia/i)).toBeInTheDocument()
    })
  })

  describe("camp assignment modal", () => {
    it("can close the camp picker with CANCELAR", async () => {
      const user = userEvent.setup()

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      expect(await screen.findByText(/ASIGNAR CAMPAMENTO DESTINO/i)).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /^CANCELAR$/i }))

      await waitFor(() =>
        expect(screen.queryByText(/ASIGNAR CAMPAMENTO DESTINO/i)).not.toBeInTheDocument(),
      )
      expect(screen.getByRole("button", { name: /aceptar/i })).toBeInTheDocument()
    })

    it("selects another camp from the keyboard before confirming", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...baseAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      const campOptions = await screen.findAllByRole("button")
      const campOption = campOptions.find((button) =>
        button.textContent?.toLowerCase().includes("campamento"),
      )
      expect(campOption).toBeTruthy()
      campOption?.focus()
      await user.keyboard("{Enter}")
      await user.click(screen.getByRole("button", { name: /CONFIRMAR INGRESO/i }))

      await waitFor(() => expect(mockedReview).toHaveBeenCalled())
      const [, body] = mockedReview.mock.calls[0]
      expect(body.decision).toBe("accepted")
      expect(body.assign_to_camp_id).toEqual(expect.any(Number))
    })
  })

  describe("account creation edge cases", () => {
    it("shows the no-email processed view and archives without calling createAdmissionAccount", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...baseAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
      mockedGetPending.mockResolvedValue({
        data: [
          {
            ...baseAdmission,
            candidate_data: { ...baseCandidate, contact_email: null },
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      mockedGetById.mockResolvedValue({
        ...baseAdmission,
        candidate_data: { ...baseCandidate, contact_email: null },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))

      expect(await screen.findByText(/Sin correo registrado/i)).toBeInTheDocument()
      await user.click(await screen.findByRole("button", { name: /ARCHIVAR EXPEDIENTE/i }))

      expect(
        await screen.findByText(/NO HAY ADMISIONES PENDIENTES EN EL SISTEMA/i),
      ).toBeInTheDocument()
      expect(mockedCreateAccount).not.toHaveBeenCalled()
    })
  })
})
