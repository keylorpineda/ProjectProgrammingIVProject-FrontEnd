import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import WorkerSidebar from "../WorkerSidebar"

import { userEvent } from "@/test/test-utils"

const setup = (activeTab = "dashboard") => {
  const setActiveTab = vi.fn()
  render(<WorkerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />)
  return { setActiveTab }
}

describe("WorkerSidebar", () => {
  it("renders the brand header", () => {
    setup()
    expect(screen.getByText("GESTIÓN DEL FIN")).toBeInTheDocument()
    expect(screen.getByText("TERMINAL PERSONAL")).toBeInTheDocument()
  })

  it("renders every navigation tab", () => {
    setup()
    for (const label of ["TABLERO", "MI EXPEDIENTE", "OCUPACIONES", "ALMACEN", "EXPEDICIONES"]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it("calls setActiveTab with the tab id when a tab is clicked", async () => {
    const { setActiveTab } = setup()
    await userEvent.click(screen.getByText("ALMACEN"))
    expect(setActiveTab).toHaveBeenCalledWith("resources")
  })

  it("paints the active tab with the orange accent and others with paper", () => {
    setup("resources")
    const active = screen.getByText("ALMACEN").closest("button")!
    const inactive = screen.getByText("TABLERO").closest("button")!
    expect(active.style.backgroundColor).toBe("rgb(194, 124, 47)") // #c27c2f
    expect(inactive.style.backgroundColor).toBe("rgb(154, 144, 128)") // #9a9080
  })
})
