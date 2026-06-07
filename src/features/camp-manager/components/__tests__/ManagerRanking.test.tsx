import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../../config/api"
import ManagerRanking from "../ManagerRanking"

vi.mock("../../config/api", () => ({
  api: { get: vi.fn() },
}))

const mockApi = api.get as ReturnType<typeof vi.fn>

const mockRanking = [
  {
    rank: 1,
    person_id: 1,
    name: "Javier Perez",
    profession: "Aguatero",
    food_production: 0,
    water_production: 15,
    total_production: 15,
    experience_level: 1,
  },
  {
    rank: 2,
    person_id: 2,
    name: "Luis Martinez",
    profession: "Ingeniero",
    food_production: 0,
    water_production: 5,
    total_production: 5,
    experience_level: 1,
  },
  {
    rank: 3,
    person_id: 3,
    name: "Sofia Diaz",
    profession: "Ingeniero",
    food_production: 5,
    water_production: 0,
    total_production: 5,
    experience_level: 2,
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

describe("ManagerRanking", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders ranking entries with names", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("JAVIER PEREZ")).toBeInTheDocument()
      expect(screen.getByText("LUIS MARTINEZ")).toBeInTheDocument()
      expect(screen.getByText("SOFIA DIAZ")).toBeInTheDocument()
    })
  })

  it("renders ORO, PLATA and BRONCE medals for top 3", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("ORO")).toBeInTheDocument()
      expect(screen.getByText("PLATA")).toBeInTheDocument()
      expect(screen.getByText("BRONCE")).toBeInTheDocument()
    })
  })

  it("displays total production values", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("15")).toBeInTheDocument()
    })
  })

  it("displays profession for each entry", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText("Aguatero")).toBeInTheDocument()
    })
  })

  it("shows empty state when no workers", async () => {
    mockApi.mockResolvedValue({ data: [] })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/SIN TRABAJADORES ACTIVOS/i)).toBeInTheDocument()
    })
  })

  it("renders the refresh button", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/ACTUALIZAR DATOS/i)).toBeInTheDocument()
    })
  })

  it("shows error message when api fails", async () => {
    mockApi.mockRejectedValue(new Error("Network error"))

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it("shows NVL experience level badges", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => {
      expect(screen.getAllByText(/NVL/i).length).toBeGreaterThan(0)
    })
  })

  it("refetches data when refresh button is clicked", async () => {
    mockApi.mockResolvedValue({ data: mockRanking })
    const user = userEvent.setup()

    render(<ManagerRanking campId="7" refreshTrigger={0} />, { wrapper: wrapper() })

    await waitFor(() => screen.getByText(/ACTUALIZAR DATOS/i))
    await user.click(screen.getByText(/ACTUALIZAR DATOS/i))

    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledTimes(2)
    })
  })
})
