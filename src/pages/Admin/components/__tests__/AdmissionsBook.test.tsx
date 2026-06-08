import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import AdmissionsBook from "../AdmissionsBook"

import {
  createAdmissionAccount,
  getAdmissionById,
  getPendingAdmissions,
  reviewAdmission,
} from "@/features/admissions/services/admissions.service"
import { getCamps } from "@/features/camps/services/camps.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/admissions/services/admissions.service", () => ({
  getPendingAdmissions: vi.fn(),
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
const mockedGetById = getAdmissionById as unknown as ReturnType<typeof vi.fn>
const mockedReview = reviewAdmission as unknown as ReturnType<typeof vi.fn>
const mockedCreateAccount = createAdmissionAccount as unknown as ReturnType<typeof vi.fn>
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const fakeAdmission = {
  id: "555",
  tracking_code: "ADM-TEST-001",
  suggested_decision: "RECOMMEND_ACCEPT",
  score: 88,
  status: "PENDING_REVIEW",
  camp_id: "1",
  submission_date: "2026-02-01T00:00:00.000Z",
  review_date: null,
  raw_ai_response: { nestjs_evaluation: { factors: [{ category: "HEALTH_OK" }] } },
  justification: "Looks good",
  candidate_data: {
    first_name: "Sarah",
    last_name: "Connor",
    age: 28,
    skills: ["medicine", "first_aid"],
    medical_conditions: [],
    personal_history: "Former medic",
    contact_email: "sarah@test.com",
    id_card_url: null,
  },
}

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

describe("Admin → AdmissionsBook", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetPending.mockReset()
    mockedGetById.mockReset()
    mockedReview.mockReset()
    mockedCreateAccount.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetPending.mockResolvedValue({
      data: [fakeAdmission],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    })
    mockedGetById.mockResolvedValue(fakeAdmission)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("loading and listing", () => {
    it("loads the current admission detail via getAdmissionById", async () => {
      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalledWith("555"))
    })

    it("shows the applicant name from candidate_data", async () => {
      renderAdmissions()
      await waitFor(() =>
        expect(screen.getAllByText(/sarah connor/i).length).toBeGreaterThanOrEqual(1),
      )
    })

    it("falls back to demo data in DEV when the API returns an empty list", async () => {
      mockedGetPending.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      })
      renderAdmissions()
      await waitFor(() =>
        expect(screen.getAllByText(/mateo vargas/i).length).toBeGreaterThanOrEqual(1),
      )
    })

    it("shows loading skeleton while pending admissions are fetching", async () => {
      let resolveList: (v: unknown) => void = () => {}
      mockedGetPending.mockImplementation(
        () =>
          new Promise((r) => {
            resolveList = r
          }),
      )
      renderAdmissions()
      expect(
        screen.queryByRole("button", { name: /rechazar/i }) === null ||
          screen.queryByText(/sarah connor/i) === null,
      ).toBe(true)
      resolveList({ data: [], total: 0, page: 1, limit: 100, totalPages: 0 })
      await waitFor(() =>
        expect(screen.getAllByText(/mateo vargas/i).length).toBeGreaterThanOrEqual(1),
      )
    })
  })

  describe("pagination through admissions", () => {
    const secondAdmission = {
      ...fakeAdmission,
      id: "556",
      tracking_code: "ADM-TEST-002",
      candidate_data: { ...fakeAdmission.candidate_data, first_name: "John", last_name: "Doe" },
    }

    beforeEach(() => {
      mockedGetPending.mockResolvedValue({
        data: [fakeAdmission, secondAdmission],
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      })
      mockedGetById.mockImplementation(async (id: string) =>
        id === "556" ? secondAdmission : fakeAdmission,
      )
    })

    it("PASAR PÁG. SIGUIENTE loads the next admission detail (delayed by page-turn animation)", async () => {
      const user = userEvent.setup()

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalledWith("555"))

      const nextBtn = await screen.findByRole("button", { name: /PASAR PÁG\. SIGUIENTE/i })
      await user.click(nextBtn)

      // handleNextPage schedules setCurrentIndex inside a 400ms setTimeout
      await waitFor(() => expect(mockedGetById).toHaveBeenCalledWith("556"), { timeout: 2000 })
    })

    it("PASAR PÁG. ANTERIOR is disabled on the first admission", async () => {
      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())
      expect(screen.getByRole("button", { name: /PASAR PÁG\. ANTERIOR/i })).toBeDisabled()
    })

    it("PASAR PÁG. ANTERIOR navigates back after going to next", async () => {
      const user = userEvent.setup()

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalledWith("555"))

      const nextBtn = await screen.findByRole("button", { name: /PASAR PÁG\. SIGUIENTE/i })
      await user.click(nextBtn)

      await waitFor(() => expect(mockedGetById).toHaveBeenCalledWith("556"), { timeout: 2000 })

      const prevBtn = screen.getByRole("button", { name: /PASAR PÁG\. ANTERIOR/i })
      expect(prevBtn).not.toBeDisabled()
      await user.click(prevBtn)

      await waitFor(() => {
        const calls = mockedGetById.mock.calls.map(([id]: [string]) => id)
        expect(calls).toContain("555")
      })
    })
  })

  describe("reject flow", () => {
    it("RECHAZAR calls reviewAdmission(id, {decision: 'rejected'})", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({ admission: fakeAdmission, person: null })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      const rejectBtn = await screen.findByRole("button", { name: /rechazar/i })
      await user.click(rejectBtn)

      await waitFor(() => expect(mockedReview).toHaveBeenCalled())
      const [id, body] = mockedReview.mock.calls[0]
      expect(id).toBe("555")
      expect(body.decision).toBe("rejected")
    })

    it("shows decisionError when reviewAdmission rejects during RECHAZAR", async () => {
      const user = userEvent.setup()
      mockedReview.mockRejectedValue(new Error("server error"))

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())
      await user.click(await screen.findByRole("button", { name: /rechazar/i }))
      expect(await screen.findByText(/Error al procesar el rechazo/i)).toBeInTheDocument()
    })
  })

  describe("accept flow", () => {
    it("opens a camp picker and sends assign_to_camp_id as a NUMBER", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      const acceptBtn = await screen.findByRole("button", { name: /aceptar/i })
      await user.click(acceptBtn)

      await screen.findByText(/ASIGNAR CAMPAMENTO DESTINO/i)
      const radios = screen.getAllByRole("radio")
      await user.click(radios[1])
      const confirmBtn = await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i })
      await user.click(confirmBtn)

      await waitFor(() => expect(mockedReview).toHaveBeenCalled())
      const [id, body] = mockedReview.mock.calls[0]
      expect(id).toBe("555")
      expect(body.decision).toBe("accepted")
      expect(body.assign_to_camp_id).toBe(2)
      expect(typeof body.assign_to_camp_id).toBe("number")
    })

    it("shows decisionError when reviewAdmission rejects during ACEPTAR confirm", async () => {
      const user = userEvent.setup()
      mockedReview.mockRejectedValue(new Error("conflict"))

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())
      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await screen.findByText(/ASIGNAR CAMPAMENTO DESTINO/i)
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      expect(await screen.findByText(/Error al aprobar la admisión/i)).toBeInTheDocument()
    })
  })

  describe("account creation after accept", () => {
    it("createAdmissionAccount is called with the right shape (role_id=2 as NUMBER)", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
      mockedCreateAccount.mockResolvedValue({ id: "9999" })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))

      const createAccountBtn = await screen.findByRole("button", { name: /crear cuenta/i })
      await user.click(createAccountBtn)

      await waitFor(() => expect(mockedCreateAccount).toHaveBeenCalled())
      const [id, body] = mockedCreateAccount.mock.calls[0]
      expect(id).toBe("555")
      expect(body.email).toBe("sarah@test.com")
      expect(body.role_id).toBe(2)
      expect(typeof body.role_id).toBe("number")
      expect(typeof body.password).toBe("string")
      expect(body.password.length).toBeGreaterThanOrEqual(8)
    })

    it("hides the 'CREAR CUENTA' button when contactEmail is missing", async () => {
      const user = userEvent.setup()
      mockedGetById.mockResolvedValue({
        ...fakeAdmission,
        candidate_data: { ...fakeAdmission.candidate_data, contact_email: null },
      })
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))

      await screen.findByRole("button", { name: /ARCHIVAR/i })
      expect(screen.queryByRole("button", { name: /crear cuenta/i })).not.toBeInTheDocument()
      expect(mockedCreateAccount).not.toHaveBeenCalled()
    })

    it("shows 'Ya existe una cuenta' error when API returns duplicate message", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
      mockedCreateAccount.mockRejectedValue({
        response: { data: { message: "Email already exists in the system" } },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      await user.click(await screen.findByRole("button", { name: /crear cuenta/i }))

      expect(await screen.findByText(/Ya existe una cuenta/i)).toBeInTheDocument()
    })

    it("shows 'admisión no fue procesada' error when API returns not accepted message", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
      mockedCreateAccount.mockRejectedValue({
        response: { data: { message: "Person not created" } },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      await user.click(await screen.findByRole("button", { name: /crear cuenta/i }))

      expect(await screen.findByText(/admisión no fue procesada/i)).toBeInTheDocument()
    })

    it("marks account as done with warning when email failed to send", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
      mockedCreateAccount.mockRejectedValue({
        response: { data: { message: "correo no pudo enviarse al destinatario" } },
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      await user.click(await screen.findByRole("button", { name: /crear cuenta/i }))

      expect(await screen.findByText(/correo no se pudo enviar/i)).toBeInTheDocument()
    })

    it("shows generic accountError when axios message is present and no match", async () => {
      const user = userEvent.setup()
      mockedReview.mockResolvedValue({
        admission: { ...fakeAdmission, status: "ACCEPTED" },
        person: { id: "999" },
      })
      mockedCreateAccount.mockRejectedValue({
        message: "Network timeout",
      })

      renderAdmissions()
      await waitFor(() => expect(mockedGetById).toHaveBeenCalled())

      await user.click(await screen.findByRole("button", { name: /aceptar/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR INGRESO/i }))
      await user.click(await screen.findByRole("button", { name: /crear cuenta/i }))

      expect(await screen.findByText(/Network timeout/i)).toBeInTheDocument()
    })
  })
})
