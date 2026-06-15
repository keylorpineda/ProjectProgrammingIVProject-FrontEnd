import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import Navbar from "../Navbar"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { username: "admin", id: "1" } }),
}))

vi.mock("../CampSelector", () => ({
  default: () => <div data-testid="camp-selector" />,
}))

const renderNavbar = (route = "/admin/dashboard") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Navbar utcTime="2026-06-15 00:00:00 UTC" onLogout={vi.fn()} />
    </MemoryRouter>,
  )

describe("Admin → Navbar", () => {
  beforeEach(() => mockNavigate.mockClear())

  it("renders the navigation tabs as links to /admin/<section>", () => {
    renderNavbar()
    const expected: Record<string, string> = {
      TABLERO: "/admin/dashboard",
      ADMISIONES: "/admin/admissions",
      PERSONAL: "/admin/people",
      CAMPAMENTOS: "/admin/camps",
      EXPLORACIONES: "/admin/explorations",
      RECURSOS: "/admin/resources",
      TRASLADOS: "/admin/transfers",
      MAPA: "/admin/mapa",
    }
    for (const [label, href] of Object.entries(expected)) {
      expect(screen.getByRole("link", { name: new RegExp(label, "i") })).toHaveAttribute(
        "href",
        href,
      )
    }
  })

  it("marks the active tab with the highlight background", () => {
    renderNavbar("/admin/people")
    const peopleLink = screen.getByRole("link", { name: /personal/i })
    expect(peopleLink.className).toContain("bg-[#c27c2f]")
    expect(peopleLink.className).not.toContain("bg-[#9a9080]")
  })

  it("opens the profile menu when the avatar is clicked", async () => {
    const user = userEvent.setup()
    renderNavbar()
    expect(screen.queryByRole("menuitem", { name: /ver perfil/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /opciones de perfil/i }))
    expect(screen.getByRole("menuitem", { name: /ver perfil/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it("navigates to the profile route from the menu", async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole("button", { name: /opciones de perfil/i }))
    await user.click(screen.getByRole("menuitem", { name: /ver perfil/i }))
    expect(mockNavigate).toHaveBeenCalledWith("/admin/profile")
  })

  it("calls onLogout from the menu", async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Navbar utcTime="x" onLogout={onLogout} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole("button", { name: /opciones de perfil/i }))
    await user.click(screen.getByRole("menuitem", { name: /cerrar sesión/i }))
    expect(onLogout).toHaveBeenCalled()
  })
})
