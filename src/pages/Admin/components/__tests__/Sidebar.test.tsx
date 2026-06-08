import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import Sidebar from "../Sidebar"

const renderSidebar = (route = "/admin/dashboard") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Sidebar />
    </MemoryRouter>,
  )

describe("Admin → Sidebar", () => {
  it("renders all 7 admin tabs", () => {
    renderSidebar()
    expect(screen.getByRole("link", { name: /tablero/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /admisiones/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /personal/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /campamentos/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /exploraciones/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /recursos/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /traslados/i })).toBeInTheDocument()
  })

  it("each tab points to its own /admin/<section> route", () => {
    renderSidebar()
    const expected: Record<string, string> = {
      TABLERO: "/admin/dashboard",
      ADMISIONES: "/admin/admissions",
      PERSONAL: "/admin/people",
      CAMPAMENTOS: "/admin/camps",
      EXPLORACIONES: "/admin/explorations",
      RECURSOS: "/admin/resources",
      TRASLADOS: "/admin/transfers",
    }
    for (const [label, href] of Object.entries(expected)) {
      const link = screen.getByRole("link", { name: new RegExp(label, "i") })
      expect(link).toHaveAttribute("href", href)
    }
  })

  it("marks the active tab with the highlight background", () => {
    renderSidebar("/admin/people")
    const peopleLink = screen.getByRole("link", { name: /personal/i })
    expect(peopleLink.className).toContain("bg-[#c27c2f]")
    expect(peopleLink.className).not.toContain("bg-[#9a9080]")
  })

  it("does NOT mark other tabs as active", () => {
    renderSidebar("/admin/people")
    const dashboardLink = screen.getByRole("link", { name: /tablero/i })
    expect(dashboardLink.className).toContain("bg-[#9a9080]")
    expect(dashboardLink.className).not.toContain("bg-[#c27c2f]")
  })
})
