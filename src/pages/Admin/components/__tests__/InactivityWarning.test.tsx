import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import * as SessionContext from "../../context/SessionContext"
import InactivityWarning from "../InactivityWarning"

describe("Admin → InactivityWarning", () => {
  it("renders nothing when isWarning is false", () => {
    vi.spyOn(SessionContext, "useSession").mockReturnValue({
      isWarning: false,
      secondsUntilLogout: 1200,
      lastActivity: Date.now(),
      resetActivity: () => {},
    })
    const { container } = render(<InactivityWarning />)
    expect(container.firstChild).toBeNull()
  })

  it("renders the warning overlay when isWarning is true", () => {
    vi.spyOn(SessionContext, "useSession").mockReturnValue({
      isWarning: true,
      secondsUntilLogout: 42,
      lastActivity: Date.now(),
      resetActivity: () => {},
    })
    render(<InactivityWarning />)
    expect(screen.getByRole("heading", { name: /PÉRDIDA DE SEÑAL INMINENTE/i })).toBeInTheDocument()
    expect(screen.getByText(/42s/)).toBeInTheDocument()
    expect(screen.getByText(/MUEVA EL CURSOR PARA ABORTAR/i)).toBeInTheDocument()
  })
})
