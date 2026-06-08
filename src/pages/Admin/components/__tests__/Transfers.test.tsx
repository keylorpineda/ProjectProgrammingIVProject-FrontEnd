import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps, personsPage, resources, transfers } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import Transfers from "../Transfers"

vi.mock("@/features/transfers/services/transfers.service", () => ({
  createTransferRequest: vi.fn(),
  getCampTransfers: vi.fn(),
  getPendingCampTransfers: vi.fn(),
  getTransferById: vi.fn(),
  approveOrRejectTransfer: vi.fn(),
  cancelTransfer: vi.fn(),
  confirmTransferArrival: vi.fn(),
  getTransferStatistics: vi.fn(),
}))
vi.mock("@/features/inventory/services/inventory.service", () => ({
  getResources: vi.fn(),
  getInventory: vi.fn(),
  updateInventoryItem: vi.fn(),
  createMovement: vi.fn(),
  getMovements: vi.fn(),
  runDailyProcess: vi.fn(),
}))
vi.mock("@/features/persons/services/persons.service", () => ({
  getPersons: vi.fn(),
}))
vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))
vi.mock("@/features/map-test/components/TransferRouteMap", () => ({
  TransferRouteMap: () => <div data-testid="transfer-map" />,
}))

const mockedGetTransfers = getCampTransfers as unknown as ReturnType<typeof vi.fn>
const mockedGetResources = getResources as unknown as ReturnType<typeof vi.fn>
const mockedGetPersons = getPersons as unknown as ReturnType<typeof vi.fn>
const mockedApprove = approveOrRejectTransfer as unknown as ReturnType<typeof vi.fn>
const mockedCancel = cancelTransfer as unknown as ReturnType<typeof vi.fn>

import { getCamps } from "@/features/camps/services/camps.service"
import { getResources } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import {
  approveOrRejectTransfer,
  cancelTransfer,
  getCampTransfers,
} from "@/features/transfers/services/transfers.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"
const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>

const renderTransfers = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <Transfers />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → Transfers (read + approve/reject + cancel)", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetTransfers.mockReset()
    mockedGetResources.mockReset()
    mockedGetPersons.mockReset()
    mockedApprove.mockReset()
    mockedCancel.mockReset()
    mockedGetCamps.mockReset()

    mockedGetCamps.mockResolvedValue(camps)
    mockedGetResources.mockResolvedValue(resources)
    mockedGetPersons.mockResolvedValue(personsPage)
    mockedGetTransfers.mockResolvedValue(transfers)
  })

  describe("listing", () => {
    it("renders the page heading", async () => {
      renderTransfers()
      expect(
        await screen.findByRole("heading", { name: /MANIFIESTOS DE TRANSPORTE/i }),
      ).toBeInTheDocument()
    })

    it("shows the pending transfer card from the API", async () => {
      renderTransfers()
      expect(await screen.findByText(/TRASLADO #/i)).toBeInTheDocument()
      expect(screen.getAllByText(/PENDIENTE/i).length).toBeGreaterThanOrEqual(1)
    })

    it("filters the in-memory list by status select", async () => {
      const user = userEvent.setup()
      renderTransfers()
      await screen.findByText(/TRASLADO #/i)
      await user.selectOptions(screen.getByRole("combobox"), "approved")
      expect(screen.queryByText(/TRASLADO #/i)).not.toBeInTheDocument()
    })

    it("renders 'SIN TRASLADOS REGISTRADOS' for an empty list", async () => {
      mockedGetTransfers.mockResolvedValue([])
      renderTransfers()
      expect(await screen.findByText(/SIN TRASLADOS REGISTRADOS/i)).toBeInTheDocument()
    })
  })

  describe("approve / reject flow on pending requests (regression: NEVER 'denied')", () => {
    it("APROBAR sends status='approved'", async () => {
      const user = userEvent.setup()
      mockedApprove.mockResolvedValue(transfers[0])
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /^APROBAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR APROBACIÓN/i }))
      await waitFor(() => expect(mockedApprove).toHaveBeenCalled())
      const [id, body] = mockedApprove.mock.calls[0]
      expect(id).toBe("100")
      expect(body.status).toBe("approved")
    })

    it("RECHAZAR sends status='rejected' (never 'denied')", async () => {
      const user = userEvent.setup()
      mockedApprove.mockResolvedValue(transfers[0])
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /^RECHAZAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR RECHAZO/i }))
      await waitFor(() => expect(mockedApprove).toHaveBeenCalled())
      const body = mockedApprove.mock.calls[0][1]
      expect(body.status).toBe("rejected")
      expect(body.status).not.toBe("denied")
    })

    it("CANCELAR TRASLADO calls the cancel service", async () => {
      const user = userEvent.setup()
      mockedCancel.mockResolvedValue(transfers[0])
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /CANCELAR TRASLADO/i }))
      await waitFor(() => expect(mockedCancel).toHaveBeenCalledWith("100"))
    })

    it("shows an error message when approval API rejects", async () => {
      const user = userEvent.setup()
      mockedApprove.mockRejectedValue(new Error("400"))
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /^APROBAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR APROBACIÓN/i }))
      expect(await screen.findByText(/No se pudo aprobar el traslado/i)).toBeInTheDocument()
    })
  })
})
