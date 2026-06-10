import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

  it("approves an incoming transfer", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    mockGet.mockResolvedValue({ data: [...mockIncoming] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("PENDIENTE"))

    // Click [AUTORIZAR]
    const authorizeBtn = screen.getByText(/\[AUTORIZAR\]/i)
    await user.click(authorizeBtn)

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/transfers/requests/req1/approval", {
        status: "approved",
      })
    })
  })

  it("rejects an incoming transfer", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    mockGet.mockResolvedValue({ data: [...mockIncoming] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("PENDIENTE"))

    // Click [RECHAZAR]
    const rejectBtn = screen.getByText(/\[RECHAZAR\]/i)
    await user.click(rejectBtn)

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/transfers/requests/req1/approval", {
        status: "rejected",
      })
    })
  })

  it("handles errors when approving or rejecting fails", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockRejectedValue(new Error("Error al autorizar"))
    const user = userEvent.setup()
    mockGet.mockResolvedValue({ data: [...mockIncoming] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("PENDIENTE"))

    const authorizeBtn = screen.getByText(/\[AUTORIZAR\]/i)
    await user.click(authorizeBtn)

    expect(await screen.findByText(/Error al autorizar/i)).toBeInTheDocument()
  })

  it("handles error on arrive action", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockRejectedValue(new Error("API Error on Arrive"))
    const user = userEvent.setup()

    const approvedTransfer = { ...mockIncoming[0], id: "req2", status: "approved" }
    mockGet.mockResolvedValue({ data: [approvedTransfer] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("AUTORIZADO"))

    const arriveBtn = screen.getByText(/REGISTRAR LLEGADA FÍSICA Y TRANSBORDO/i)
    await user.click(arriveBtn)

    expect(await screen.findByText(/API Error on Arrive/i)).toBeInTheDocument()
  })

  it("registers physical arrival for approved transfer", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    const approvedTransfer = { ...mockIncoming[0], id: "req2", status: "approved" }
    mockGet.mockResolvedValue({ data: [approvedTransfer] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("AUTORIZADO"))

    const arriveBtn = screen.getByText(/REGISTRAR LLEGADA FÍSICA Y TRANSBORDO/i)
    await user.click(arriveBtn)

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/transfers/requests/req2/arrive")
    })
  })

  it("opens modal and submits new request", async () => {
    const mockPost = api.post as ReturnType<typeof vi.fn>
    mockPost.mockResolvedValue({ data: {} })
    const mockOnModalClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={mockOnModalClose}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

    const numberInput = screen.getByRole("spinbutton")
    await user.clear(numberInput)
    await user.type(numberInput, "100")

    const notesInput = screen.getByPlaceholderText(/JUSTIFIQUE EL PROTOCOLO DE TRASLADO MRE/i)
    await user.type(notesInput, "Need more supplies")

    const submitBtn = screen.getByText(/FIRMAR ORDEN/i)
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/transfers/requests",
        expect.objectContaining({
          notes: "Need more supplies",
          camp_destination_id: 7,
        }),
      )
      expect(mockOnModalClose).toHaveBeenCalled()
    })
  })

  it("shows error when submitting new request fails", async () => {
    const mockPost = api.post as ReturnType<typeof vi.fn>
    mockPost.mockRejectedValue(new Error("Error al enviar solicitud"))
    const mockOnModalClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={mockOnModalClose}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

    const submitBtn = screen.getByText(/FIRMAR ORDEN/i)
    await user.click(submitBtn)

    expect((await screen.findAllByText(/Error al enviar solicitud/i)).length).toBeGreaterThan(0)
  })

  it("closes the new request modal", async () => {
    const mockOnModalClose = vi.fn()

    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={mockOnModalClose}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

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

  it("approves an incoming transfer", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    mockGet.mockResolvedValue({ data: [...mockIncoming] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("PENDIENTE"))

    // Click [AUTORIZAR]
    const authorizeBtn = screen.getByText(/\[AUTORIZAR\]/i)
    await user.click(authorizeBtn)

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/transfers/requests/req1/approval", {
        status: "approved",
      })
    })
  })

  it("rejects an incoming transfer", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    mockGet.mockResolvedValue({ data: [...mockIncoming] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("PENDIENTE"))

    // Click [RECHAZAR]
    const rejectBtn = screen.getByText(/\[RECHAZAR\]/i)
    await user.click(rejectBtn)

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/transfers/requests/req1/approval", {
        status: "rejected",
      })
    })
  })

  it("handles errors when approving or rejecting fails", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockRejectedValue(new Error("Error al autorizar"))
    const user = userEvent.setup()
    mockGet.mockResolvedValue({ data: [...mockIncoming] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("PENDIENTE"))

    const authorizeBtn = screen.getByText(/\[AUTORIZAR\]/i)
    await user.click(authorizeBtn)

    expect(await screen.findByText(/Error al autorizar/i)).toBeInTheDocument()
  })

  it("handles error on arrive action", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockRejectedValue(new Error("API Error on Arrive"))
    const user = userEvent.setup()

    const approvedTransfer = { ...mockIncoming[0], id: "req2", status: "approved" }
    mockGet.mockResolvedValue({ data: [approvedTransfer] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("AUTORIZADO"))

    const arriveBtn = screen.getByText(/REGISTRAR LLEGADA FÍSICA Y TRANSBORDO/i)
    await user.click(arriveBtn)

    expect(await screen.findByText(/API Error on Arrive/i)).toBeInTheDocument()
  })

  it("registers physical arrival for approved transfer", async () => {
    const mockPatch = api.patch as ReturnType<typeof vi.fn>
    mockPatch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    const approvedTransfer = { ...mockIncoming[0], id: "req2", status: "approved" }
    mockGet.mockResolvedValue({ data: [approvedTransfer] })

    render(<ManagerLogistics campId="7" onDataChanged={vi.fn()} refreshTrigger={0} />, {
      wrapper: wrapper(),
    })

    await waitFor(() => screen.getByText("AUTORIZADO"))

    const arriveBtn = screen.getByText(/REGISTRAR LLEGADA FÍSICA Y TRANSBORDO/i)
    await user.click(arriveBtn)

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith("/transfers/requests/req2/arrive")
    })
  })

  it("opens modal and submits new request", async () => {
    const mockPost = api.post as ReturnType<typeof vi.fn>
    mockPost.mockResolvedValue({ data: {} })
    const mockOnModalClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={mockOnModalClose}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

    const numberInput = screen.getByRole("spinbutton")
    await user.clear(numberInput)
    await user.type(numberInput, "100")

    const notesInput = screen.getByPlaceholderText(/JUSTIFIQUE EL PROTOCOLO DE TRASLADO MRE/i)
    await user.type(notesInput, "Need more supplies")

    const submitBtn = screen.getByText(/FIRMAR ORDEN/i)
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/transfers/requests",
        expect.objectContaining({
          notes: "Need more supplies",
          camp_destination_id: 7,
        }),
      )
      expect(mockOnModalClose).toHaveBeenCalled()
    })
  })

  it("shows error when submitting new request fails", async () => {
    const mockPost = api.post as ReturnType<typeof vi.fn>
    mockPost.mockRejectedValue(new Error("Error al enviar solicitud"))
    const mockOnModalClose = vi.fn()
    const user = userEvent.setup()

    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={mockOnModalClose}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

    const submitBtn = screen.getByText(/FIRMAR ORDEN/i)
    await user.click(submitBtn)

    expect((await screen.findAllByText(/Error al enviar solicitud/i)).length).toBeGreaterThan(0)
  })

  it("closes the new request modal", async () => {
    const mockOnModalClose = vi.fn()

    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={mockOnModalClose}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

    const cancelBtn = screen.getByText(/\[CANCELAR\]/i)
    await userEvent.click(cancelBtn)

    expect(mockOnModalClose).toHaveBeenCalled()
  })
  it("handles negative amount validation on modal", async () => {
    const mockPost = api.post as ReturnType<typeof vi.fn>
    mockPost.mockReset()
    mockPost.mockResolvedValue({ data: {} })
    await userEvent.setup()
    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={vi.fn()}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))
    const numberInput = screen.getByRole("spinbutton")
    fireEvent.change(numberInput, { target: { value: "0" } })

    const submitBtn = screen.getByText(/FIRMAR ORDEN/i)
    fireEvent.submit(submitBtn.closest("form")!)

    expect(
      await screen.findByText(/Especifique una cantidad de carga superior a cero/i),
    ).toBeInTheDocument()
  })

  it("handles select onChange for bunker and resource", async () => {
    const user = userEvent.setup()
    render(
      <ManagerLogistics
        campId="7"
        onDataChanged={vi.fn()}
        refreshTrigger={0}
        showModal={true}
        onModalClose={vi.fn()}
      />,
      {
        wrapper: wrapper(),
      },
    )

    await waitFor(() => screen.getByText(/SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA/i))

    const bunkerSelect = screen.getByLabelText(/BÚNKER ORIGEN:/i)
    await user.selectOptions(bunkerSelect, "req2")
    expect(bunkerSelect).toHaveValue("req2")

    const resourceSelect = screen.getByLabelText(/RECURSO SOLICITADO:/i)
    await user.selectOptions(resourceSelect, "req2")
    expect(resourceSelect).toHaveValue("req2")
  })
})
