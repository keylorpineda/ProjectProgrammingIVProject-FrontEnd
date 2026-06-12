import { fireEvent } from "@testing-library/dom"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import Sidebar from "../Sidebar"

describe("Sidebar Component", () => {
  it("renders the sidebar brand and all tabs", () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} />)

    expect(screen.getByText("LIDER CENTRAL")).toBeInTheDocument()
    expect(screen.getByText("TABLERO")).toBeInTheDocument()
    expect(screen.getByText("EXPLORACIONES")).toBeInTheDocument()
    expect(screen.getByText("TRASLADOS")).toBeInTheDocument()
    expect(screen.getByText("INVENTARIO")).toBeInTheDocument()
    expect(screen.getByText("RANKING")).toBeInTheDocument()
    expect(screen.getByText("MIEMBROS")).toBeInTheDocument()
    expect(screen.getByText("OCUPACIONES")).toBeInTheDocument()
    expect(screen.getByText("PERFIL")).toBeInTheDocument()
  })

  it("applies active styles correctly using activeTab prop", () => {
    render(<Sidebar activeTab="explorations" setActiveTab={() => {}} />)

    const tab = screen.getByRole("button", { name: "EXPLORACIONES" })
    expect(tab).toHaveAttribute("aria-pressed", "true")

    const otherTab = screen.getByRole("button", { name: "TABLERO" })
    expect(otherTab).toHaveAttribute("aria-pressed", "false")
  })

  it("calls setActiveTab when a tab is clicked", () => {
    const setActiveTab = vi.fn()
    render(<Sidebar activeTab="dashboard" setActiveTab={setActiveTab} />)

    fireEvent.click(screen.getByRole("button", { name: "INVENTARIO" }))
    expect(setActiveTab).toHaveBeenCalledWith("inventory")
  })
})
