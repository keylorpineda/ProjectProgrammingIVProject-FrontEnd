import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"

import WorkerGuard from "../WorkerGuard"

import { adminUser, campLeaderUser, workerUser } from "@/test/fixtures"
import { renderWithProviders } from "@/test/test-utils"

const tree = (
  <Routes>
    <Route
      path="/worker/dashboard"
      element={
        <WorkerGuard>
          <div>WORKER CONTENT</div>
        </WorkerGuard>
      }
    />
    <Route path="/login" element={<div>LOGIN PAGE</div>} />
    <Route path="/admin/dashboard" element={<div>ADMIN DASH</div>} />
    <Route path="/campleader/dashboard" element={<div>LEADER DASH</div>} />
    <Route path="/camp-manager" element={<div>MANAGER HOME</div>} />
    <Route path="/travel-manager/dashboard" element={<div>TRAVEL DASH</div>} />
  </Routes>
)

describe("WorkerGuard", () => {
  it("renders children for an authenticated worker", () => {
    renderWithProviders(tree, { user: workerUser, token: "tk", route: "/worker/dashboard" })
    expect(screen.getByText("WORKER CONTENT")).toBeInTheDocument()
  })

  it("redirects unauthenticated visitors to /login", () => {
    renderWithProviders(tree, { user: null, route: "/worker/dashboard" })
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument()
    expect(screen.queryByText("WORKER CONTENT")).toBeNull()
  })

  it("redirects an admin to the admin dashboard", () => {
    renderWithProviders(tree, { user: adminUser, token: "tk", route: "/worker/dashboard" })
    expect(screen.getByText("ADMIN DASH")).toBeInTheDocument()
    expect(screen.queryByText("WORKER CONTENT")).toBeNull()
  })

  it("redirects a camp leader to the camp leader dashboard", () => {
    renderWithProviders(tree, { user: campLeaderUser, token: "tk", route: "/worker/dashboard" })
    expect(screen.getByText("LEADER DASH")).toBeInTheDocument()
  })

  it("redirects a resource manager to the camp manager home", () => {
    renderWithProviders(tree, {
      user: { ...workerUser, id: "8", role: "resource_manager" },
      token: "tk",
      route: "/worker/dashboard",
    })
    expect(screen.getByText("MANAGER HOME")).toBeInTheDocument()
  })

  it("redirects a travel manager to the travel manager dashboard", () => {
    renderWithProviders(tree, {
      user: { ...workerUser, id: "9", role: "travel_manager" },
      token: "tk",
      route: "/worker/dashboard",
    })
    expect(screen.getByText("TRAVEL DASH")).toBeInTheDocument()
  })

  it("sends an unknown role back to login", () => {
    renderWithProviders(tree, {
      user: { ...workerUser, id: "10", role: "ghost" },
      token: "tk",
      route: "/worker/dashboard",
    })
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument()
    expect(screen.queryByText("WORKER CONTENT")).toBeNull()
  })

  it("sends an authenticated user without role back to login", () => {
    renderWithProviders(tree, {
      user: { ...workerUser, id: "11", role: undefined },
      token: "tk",
      route: "/worker/dashboard",
    })

    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument()
  })
})
