import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../../config/api"
import ManagerLogistics from "../ManagerLogistics"

vi.mock("../../config/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const mockGet = api.get as ReturnType<typeof vi.fn>

const mockIncoming = [
  {
    id: "req1",
    camp_origin_id: "5",
    camp_source_id: "Bunker-5",
    camp_destination_id: "7",
    type: "resources",
    status: "pending",
    requested_at: "2026-06-01T00:00:00Z",
    notes: "Envío de agua",
  },
]

const mockOutgoing = [
  {
    id: "req2",
    camp_origin_id: "7",
    camp_source_id: "7",
    camp_destination_id: "3",
    type: "resources",
    status: "approved",
    requested_at: "2026-06-02T00:00:00Z",
    notes: "Despacho de comida",
  },
]

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = "Wrapper"
  return Wrapper
}

describe("ManagerLogistics", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders incoming and outgoing columns", async () => {
    mockGet.mockResolvedValue({ data: [] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/CARGAS ENTRANTES/i)).toBeInTheDocument()
      expect(screen.getByText(/DESPACHOS SALIENTES/i)).toBeInTheDocument()
    })
  })

  it("shows empty state message when no transfers", async () => {
    mockGet.mockResolvedValue({ data: [] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/SIN TRÁNSITOS PENDIENTES/i)).toBeInTheDocument()
      expect(screen.getByText(/NINGÚN DESPACHO/i)).toBeInTheDocument()
    })
  })

  it("renders incoming transfer with PENDIENTE status", async () => {
    mockGet.mockResolvedValue({ data: [...mockIncoming, ...mockOutgoing] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText("PENDIENTE")).toBeInTheDocument()
    })
  })

  it("renders outgoing transfer with AUTORIZADO status", async () => {
    mockGet.mockResolvedValue({ data: [...mockIncoming, ...mockOutgoing] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText("AUTORIZADO")).toBeInTheDocument()
    })
  })

  it("shows error when api fails", async () => {
    mockGet.mockRejectedValue(new Error("Sin conexión"))

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText(/Sin conexión/i)).toBeInTheDocument()
    })
  })

  it("calls api with correct camp transfers endpoint", async () => {
    mockGet.mockResolvedValue({ data: [] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/7"))
    })
  })
})
