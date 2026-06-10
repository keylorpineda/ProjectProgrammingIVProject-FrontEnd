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
  TransferRouteMap: ({
    fromCoords,
    toCoords,
  }: {
    fromCoords: [number, number]
    toCoords: [number, number]
  }) => (
    <div data-testid="transfer-map">
      {fromCoords.join(",")}|{toCoords.join(",")}
    </div>
  ),
}))

const mockedGetTransfers = getCampTransfers as unknown as ReturnType<typeof vi.fn>
const mockedGetResources = getResources as unknown as ReturnType<typeof vi.fn>
const mockedGetPersons = getPersons as unknown as ReturnType<typeof vi.fn>
const mockedApprove = approveOrRejectTransfer as unknown as ReturnType<typeof vi.fn>
const mockedCancel = cancelTransfer as unknown as ReturnType<typeof vi.fn>
const mockedArrive = confirmTransferArrival as unknown as ReturnType<typeof vi.fn>

import { getCamps } from "@/features/camps/services/camps.service"
import { getResources } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import {
  approveOrRejectTransfer,
  cancelTransfer,
  confirmTransferArrival,
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
    mockedArrive.mockReset()
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

    it("filters the in-memory list by status button", async () => {
      const user = userEvent.setup()
      renderTransfers()
      await screen.findByText(/TRASLADO #/i)
      await user.click(screen.getByRole("button", { name: /^APROBADO$/i }))
      expect(screen.queryByText(/TRASLADO #/i)).not.toBeInTheDocument()
    })

    it("renders 'SIN CONVOYES EN LA COLA' for an empty list", async () => {
      mockedGetTransfers.mockResolvedValue([])
      renderTransfers()
      expect(await screen.findByText(/SIN CONVOYES EN LA COLA/i)).toBeInTheDocument()
    })

    it("shows the query error banner when transfers fail to load", async () => {
      mockedGetTransfers.mockRejectedValue(new Error("network"))
      renderTransfers()
      expect(await screen.findByText(/No se pudieron cargar los manifiestos/i)).toBeInTheDocument()
    })

    it("renders fallback values for unknown transfer data and default route coordinates", async () => {
      mockedGetTransfers.mockResolvedValue([
        {
          ...transfers[0],
          id: "999",
          type: undefined,
          status: "mystery",
          camp_origin_id: "unknown-origin",
          camp_destination_id: "unknown-dest",
          request_date: "not-a-date",
          resourceDetails: [{ resource_id: "r-404", requested_quantity: 7, resource: null }],
          personDetails: [{ person_id: "p-404", is_leader: false, person: null }],
          notes: "sin referencias",
        },
      ])

      renderTransfers()

      expect(await screen.findByText(/MYSTERY/i)).toBeInTheDocument()
      expect(screen.getByText(/N\/D/i)).toBeInTheDocument()
      expect(screen.getByText(/not-a-date/i)).toBeInTheDocument()
      expect(screen.getByText(/Recurso #r-404/i)).toBeInTheDocument()
      expect(screen.getByText(/Persona #p-404/i)).toBeInTheDocument()
      expect(screen.getByTestId("transfer-map").textContent).toContain("9.9281,-84.0907")
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

    it("CANCELAR SOLICITUD calls the cancel service when admin is the origin", async () => {
      const user = userEvent.setup()
      mockedCancel.mockResolvedValue(transfers[0])
      // admin's camp_id is "1"; mount a transfer where camp "1" is the origin
      mockedGetTransfers.mockResolvedValue([
        { ...transfers[0], id: "101", camp_origin_id: "1", camp_destination_id: "2" },
      ])
      renderTransfers()
      await user.click(await screen.findByRole("button", { name: /CANCELAR SOLICITUD/i }))
      await waitFor(() => expect(mockedCancel).toHaveBeenCalledWith("101"))
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

    it("shows an error message when rejection API rejects", async () => {
      const user = userEvent.setup()
      mockedApprove.mockRejectedValue(new Error("400"))
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /^RECHAZAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR RECHAZO/i }))
      expect(await screen.findByText(/No se pudo rechazar el traslado/i)).toBeInTheDocument()
    })

    it("closes the approval modal with CANCELAR", async () => {
      const user = userEvent.setup()
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /^APROBAR$/i }))
      expect(await screen.findByText(/APROBAR TRASLADO/i)).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /^CANCELAR$/i }))

      await waitFor(() => expect(screen.queryByText(/APROBAR TRASLADO/i)).not.toBeInTheDocument())
    })

    it("typing in formNotes textarea includes notes in the approve payload", async () => {
      const user = userEvent.setup()
      mockedApprove.mockResolvedValue(transfers[0])
      renderTransfers()
      await user.click(await screen.findByText(/TRASLADO #/i))
      await user.click(await screen.findByRole("button", { name: /^APROBAR$/i }))
      const textarea = await screen.findByPlaceholderText(/Condiciones o comentarios/i)
      await user.type(textarea, "Todo en orden")
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR APROBACIÓN/i }))
      await waitFor(() => expect(mockedApprove).toHaveBeenCalled())
      const [, body] = mockedApprove.mock.calls[0]
      expect(body.notes).toBe("Todo en orden")
    })
  })

  describe("transfer status branches", () => {
    it("shows CONFIRMAR LLEGADA when status=approved and admin is destination", async () => {
      mockedGetTransfers.mockResolvedValue([
        {
          ...transfers[0],
          id: "200",
          status: "approved",
          camp_origin_id: "2",
          camp_destination_id: "1",
        },
      ])
      renderTransfers()
      expect(await screen.findByRole("button", { name: /CONFIRMAR LLEGADA/i })).toBeInTheDocument()
    })

    it("shows CONVOY EN RUTA when status=approved and admin is origin", async () => {
      mockedGetTransfers.mockResolvedValue([
        {
          ...transfers[0],
          id: "201",
          status: "approved",
          camp_origin_id: "1",
          camp_destination_id: "2",
        },
      ])
      renderTransfers()
      expect(await screen.findByText(/CONVOY EN RUTA/i)).toBeInTheDocument()
    })

    it("shows ENTREGADO — ARCHIVADO when status=completed", async () => {
      mockedGetTransfers.mockResolvedValue([{ ...transfers[0], id: "202", status: "completed" }])
      renderTransfers()
      expect(await screen.findByText(/ENTREGADO — ARCHIVADO/i)).toBeInTheDocument()
    })

    it("shows TRASLADO RECHAZADO when status=rejected", async () => {
      mockedGetTransfers.mockResolvedValue([{ ...transfers[0], id: "203", status: "rejected" }])
      renderTransfers()
      expect(await screen.findByText(/TRASLADO RECHAZADO/i)).toBeInTheDocument()
    })

    it("shows CONVOY CANCELADO when status=cancelled", async () => {
      mockedGetTransfers.mockResolvedValue([{ ...transfers[0], id: "204", status: "cancelled" }])
      renderTransfers()
      expect(await screen.findByText(/CONVOY CANCELADO/i)).toBeInTheDocument()
    })

    it("CONFIRMAR LLEGADA calls confirmTransferArrival with the transfer id", async () => {
      const user = userEvent.setup()
      mockedArrive.mockResolvedValue(transfers[0])
      mockedGetTransfers.mockResolvedValue([
        {
          ...transfers[0],
          id: "205",
          status: "approved",
          camp_origin_id: "2",
          camp_destination_id: "1",
        },
      ])
      renderTransfers()
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR LLEGADA/i }))
      await waitFor(() => expect(mockedArrive).toHaveBeenCalledWith("205"))
    })

    it("keeps the approved destination card visible when arrival confirmation rejects", async () => {
      const user = userEvent.setup()
      mockedArrive.mockRejectedValue(new Error("500"))
      mockedGetTransfers.mockResolvedValue([
        {
          ...transfers[0],
          id: "206",
          status: "approved",
          camp_origin_id: "2",
          camp_destination_id: "1",
        },
      ])
      renderTransfers()

      await user.click(await screen.findByRole("button", { name: /CONFIRMAR LLEGADA/i }))

      await waitFor(() => expect(mockedArrive).toHaveBeenCalledWith("206"))
      expect(screen.getByRole("button", { name: /CONFIRMAR LLEGADA/i })).toBeInTheDocument()
    })

    it("keeps the pending origin card visible when cancellation rejects", async () => {
      const user = userEvent.setup()
      mockedCancel.mockRejectedValue(new Error("500"))
      mockedGetTransfers.mockResolvedValue([
        { ...transfers[0], id: "207", camp_origin_id: "1", camp_destination_id: "2" },
      ])
      renderTransfers()

      await user.click(await screen.findByRole("button", { name: /CANCELAR SOLICITUD/i }))

      await waitFor(() => expect(mockedCancel).toHaveBeenCalledWith("207"))
      expect(screen.getByRole("button", { name: /CANCELAR SOLICITUD/i })).toBeInTheDocument()
    })
  })
})
