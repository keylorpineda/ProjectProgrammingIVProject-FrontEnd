import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminUser, camps } from "../../../../test/fixtures"
import { AuthProvider } from "../../context/AuthContext"
import { CampProvider } from "../../context/CampContext"
import Camps from "../Camps"

import {
  createCamp,
  deleteCamp,
  getCampById,
  getCamps,
  updateCamp,
} from "@/features/camps/services/camps.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

vi.mock("@/features/camps/services/camps.service", () => ({
  getCamps: vi.fn(),
  getCampById: vi.fn(),
  createCamp: vi.fn(),
  updateCamp: vi.fn(),
  deleteCamp: vi.fn(),
}))
vi.mock("@/features/auth/services/auth.service", () => ({
  switchCamp: vi.fn(),
}))
vi.mock("@/features/map-test/components/MapCoordPicker", () => ({
  MapCoordPicker: ({ onChange }: { onChange: (lat: number, lng: number) => void }) => (
    <button
      data-testid="map-coord-picker"
      type="button"
      onClick={() => onChange(10.123456, -84.123456)}
    >
      Pick coordinates
    </button>
  ),
}))

const mockedGetCamps = getCamps as unknown as ReturnType<typeof vi.fn>
const mockedGetCampById = getCampById as unknown as ReturnType<typeof vi.fn>
const mockedCreateCamp = createCamp as unknown as ReturnType<typeof vi.fn>
const mockedUpdateCamp = updateCamp as unknown as ReturnType<typeof vi.fn>
const mockedDeleteCamp = deleteCamp as unknown as ReturnType<typeof vi.fn>

const renderCamps = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <CampProvider>
            <Camps />
          </CampProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Admin → Camps", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTokenStore.getState().setToken("tk")
    useAuthStore.getState().setAuth("tk", adminUser)
    mockedGetCamps.mockReset()
    mockedGetCampById.mockReset()
    mockedCreateCamp.mockReset()
    mockedUpdateCamp.mockReset()
    mockedDeleteCamp.mockReset()
    mockedGetCamps.mockResolvedValue(camps)
    mockedGetCampById.mockResolvedValue({
      camp: camps[0],
      metrics: { totalResources: 0, resourcesWithAlerts: 0, inventorySummary: [] },
    })
  })

  describe("listing", () => {
    it("renders the page heading and create button", async () => {
      renderCamps()
      expect(
        await screen.findByRole("heading", { name: /RED DE CAMPAMENTOS AUTORIZADOS/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /\+ NUEVO CAMPAMENTO/i })).toBeInTheDocument()
    })

    it("shows camp cards from the API", async () => {
      renderCamps()
      expect(await screen.findByRole("heading", { name: /Campamento Alpha/i })).toBeInTheDocument()
      expect(screen.getByRole("heading", { name: /Refugio Beta/i })).toBeInTheDocument()
    })

    it("renders 'SIN CAMPAMENTOS REGISTRADOS' on empty list", async () => {
      mockedGetCamps.mockResolvedValue([])
      renderCamps()
      expect(await screen.findByText(/SIN CAMPAMENTOS REGISTRADOS/i)).toBeInTheDocument()
    })

    it("formats coordinates with 4 decimals", async () => {
      renderCamps()
      await screen.findByRole("heading", { name: /Campamento Alpha/i })
      expect(screen.getByText(/9\.9300/)).toBeInTheDocument()
    })
  })

  describe("inactive camps", () => {
    it("renders inactive camps with the 'FUERA DE LÍNEA' stamp", async () => {
      mockedGetCamps.mockResolvedValue([
        camps[0],
        { ...camps[1], id: "3", name: "Estación Echo", active: false },
      ])
      renderCamps()
      await screen.findByRole("heading", { name: /Estación Echo/i })
      expect(screen.getByText(/FUERA DE LÍNEA/i)).toBeInTheDocument()
    })

    it("applies the offline CSS class to inactive cards", async () => {
      mockedGetCamps.mockResolvedValue([
        { ...camps[0], id: "9", name: "Offline Camp", active: false },
      ])
      renderCamps()
      const card = (await screen.findByRole("heading", { name: /Offline Camp/i })).closest(
        ".camp-card",
      )
      expect(card?.className).toContain("offline")
    })

    it("shows N/D when max_capacity is null", async () => {
      mockedGetCamps.mockResolvedValue([
        { ...camps[0], id: "9", name: "NoCap", max_capacity: null },
      ])
      renderCamps()
      await screen.findByRole("heading", { name: /NoCap/i })
      expect(screen.getByText(/N\/D/)).toBeInTheDocument()
    })
  })

  describe("create camp modal", () => {
    it("opens the create modal", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      expect(
        await screen.findByRole("heading", { name: /^NUEVO CAMPAMENTO$/i }),
      ).toBeInTheDocument()
    })

    it("blocks submit when name is empty", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      await user.click(screen.getByRole("button", { name: /CREAR CAMPAMENTO/i }))
      expect(mockedCreateCamp).not.toHaveBeenCalled()
      expect(screen.getByText(/El nombre del campamento es obligatorio/i)).toBeInTheDocument()
    })

    it("converts max_capacity to a NUMBER before sending", async () => {
      const user = userEvent.setup()
      mockedCreateCamp.mockResolvedValue({ ...camps[0], id: "999" })
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO CAMPAMENTO$/i })).closest(
        ".modal-card",
      ) as HTMLElement

      await user.type(within(modal).getByPlaceholderText(/Nombre identificador/i), "Camp X")
      const capacityInput = within(modal).getByRole("spinbutton") as HTMLInputElement
      await user.type(capacityInput, "300")
      await user.click(within(modal).getByRole("button", { name: /CREAR CAMPAMENTO/i }))

      await waitFor(() => expect(mockedCreateCamp).toHaveBeenCalled())
      const body = mockedCreateCamp.mock.calls[0][0]
      expect(body.name).toBe("Camp X")
      expect(body.max_capacity).toBe(300)
      expect(typeof body.max_capacity).toBe("number")
    })

    it("omits empty coordinate/capacity fields", async () => {
      const user = userEvent.setup()
      mockedCreateCamp.mockResolvedValue({ ...camps[0], id: "999" })
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO CAMPAMENTO$/i })).closest(
        ".modal-card",
      ) as HTMLElement
      await user.type(within(modal).getByPlaceholderText(/Nombre identificador/i), "OnlyName")
      await user.click(within(modal).getByRole("button", { name: /CREAR CAMPAMENTO/i }))
      await waitFor(() => expect(mockedCreateCamp).toHaveBeenCalled())
      const body = mockedCreateCamp.mock.calls[0][0]
      expect(body.latitude).toBeUndefined()
      expect(body.longitude).toBeUndefined()
      expect(body.max_capacity).toBeUndefined()
    })

    it("sends location, foundation date and picked map coordinates", async () => {
      const user = userEvent.setup()
      mockedCreateCamp.mockResolvedValue({ ...camps[0], id: "999" })
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO CAMPAMENTO$/i })).closest(
        ".modal-card",
      ) as HTMLElement

      await user.type(within(modal).getByPlaceholderText(/Nombre identificador/i), "Camp Norte")
      await user.type(within(modal).getByPlaceholderText(/Sector norte/i), "Sector norte")
      await user.click(within(modal).getByTestId("map-coord-picker"))
      const dateInput = modal.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dateInput, "2026-01-15")
      await user.click(within(modal).getByRole("button", { name: /CREAR CAMPAMENTO/i }))

      await waitFor(() => expect(mockedCreateCamp).toHaveBeenCalled())
      const body = mockedCreateCamp.mock.calls[0][0]
      expect(body.location_description).toBe("Sector norte")
      expect(body.latitude).toBe(10.123456)
      expect(body.longitude).toBe(-84.123456)
      expect(body.foundation_date).toBe("2026-01-15")
    })

    it("closes the create modal with CANCELAR", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      expect(
        await screen.findByRole("heading", { name: /^NUEVO CAMPAMENTO$/i }),
      ).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /^CANCELAR$/i }))

      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: /^NUEVO CAMPAMENTO$/i }),
        ).not.toBeInTheDocument(),
      )
    })

    it("shows a friendly error when the create API rejects", async () => {
      const user = userEvent.setup()
      mockedCreateCamp.mockRejectedValue(new Error("server down"))
      renderCamps()
      await user.click(await screen.findByRole("button", { name: /\+ NUEVO CAMPAMENTO/i }))
      const modal = (await screen.findByRole("heading", { name: /^NUEVO CAMPAMENTO$/i })).closest(
        ".modal-card",
      ) as HTMLElement
      await user.type(within(modal).getByPlaceholderText(/Nombre identificador/i), "Camp X")
      await user.click(within(modal).getByRole("button", { name: /CREAR CAMPAMENTO/i }))
      expect(await within(modal).findByText(/No se pudo crear el campamento/i)).toBeInTheDocument()
    })
  })

  describe("detail / edit / delete", () => {
    it("opens the detail modal when a camp card is clicked", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      expect(
        await screen.findByRole("heading", { name: /DETALLES DEL CAMPAMENTO/i }),
      ).toBeInTheDocument()
    })

    it("EDITAR submit sends NUMERIC coordinates / capacity", async () => {
      const user = userEvent.setup()
      mockedUpdateCamp.mockResolvedValue(camps[0])
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^EDITAR$/i }))

      const editModal = (
        await screen.findByRole("heading", { name: /EDITAR CAMPAMENTO/i })
      ).closest(".modal-card") as HTMLElement
      await user.click(within(editModal).getByRole("button", { name: /GUARDAR CAMBIOS/i }))
      await waitFor(() => expect(mockedUpdateCamp).toHaveBeenCalled())
      const [id, body] = mockedUpdateCamp.mock.calls[0]
      expect(id).toBe("1")
      expect(typeof body.latitude).toBe("number")
      expect(typeof body.longitude).toBe("number")
    })

    it("EDITAR validates empty name before calling the API", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^EDITAR$/i }))

      const editModal = (
        await screen.findByRole("heading", { name: /EDITAR CAMPAMENTO/i })
      ).closest(".modal-card") as HTMLElement
      await user.clear(within(editModal).getByPlaceholderText(/Nombre identificador/i))
      await user.click(within(editModal).getByRole("button", { name: /GUARDAR CAMBIOS/i }))

      expect(
        within(editModal).getByText(/El nombre del campamento es obligatorio/i),
      ).toBeInTheDocument()
      expect(mockedUpdateCamp).not.toHaveBeenCalled()
    })

    it("EDITAR shows an error when updateCamp rejects", async () => {
      const user = userEvent.setup()
      mockedUpdateCamp.mockRejectedValue(new Error("500"))
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^EDITAR$/i }))

      const editModal = (
        await screen.findByRole("heading", { name: /EDITAR CAMPAMENTO/i })
      ).closest(".modal-card") as HTMLElement
      await user.click(within(editModal).getByRole("button", { name: /GUARDAR CAMBIOS/i }))

      expect(
        await within(editModal).findByText(/No se pudo actualizar el campamento/i),
      ).toBeInTheDocument()
    })

    it("returns from edit modal to detail with CANCELAR", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^EDITAR$/i }))

      const editModal = (
        await screen.findByRole("heading", { name: /EDITAR CAMPAMENTO/i })
      ).closest(".modal-card") as HTMLElement
      await user.click(within(editModal).getByRole("button", { name: /^CANCELAR$/i }))

      expect(
        await screen.findByRole("heading", { name: /DETALLES DEL CAMPAMENTO/i }),
      ).toBeInTheDocument()
    })

    it("DESACTIVAR flow calls the delete service with the camp id", async () => {
      const user = userEvent.setup()
      mockedDeleteCamp.mockResolvedValue(undefined)
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^DESACTIVAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR BAJA/i }))
      await waitFor(() => expect(mockedDeleteCamp).toHaveBeenCalledWith("1"))
    })

    it("DESACTIVAR shows an error when deleteCamp rejects", async () => {
      const user = userEvent.setup()
      mockedDeleteCamp.mockRejectedValue(new Error("500"))
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^DESACTIVAR$/i }))
      await user.click(await screen.findByRole("button", { name: /CONFIRMAR BAJA/i }))

      expect(await screen.findByText(/No se pudo desactivar el campamento/i)).toBeInTheDocument()
    })

    it("returns from delete modal to detail with CANCELAR", async () => {
      const user = userEvent.setup()
      renderCamps()
      await user.click(await screen.findByRole("heading", { name: /Campamento Alpha/i }))
      await user.click(await screen.findByRole("button", { name: /^DESACTIVAR$/i }))

      await user.click(await screen.findByRole("button", { name: /^CANCELAR$/i }))

      expect(
        await screen.findByRole("heading", { name: /DETALLES DEL CAMPAMENTO/i }),
      ).toBeInTheDocument()
    })
  })
})
