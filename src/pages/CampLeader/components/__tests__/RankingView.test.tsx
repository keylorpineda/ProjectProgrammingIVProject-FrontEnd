import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import RankingView from "../RankingView"

vi.mock("@/features/camp-manager/components/ManagerRanking", () => ({
  default: ({ campId, refreshTrigger }: any) => (
    <div data-testid="mock-manager-ranking">
      CampId: {campId}, Trigger: {refreshTrigger}
    </div>
  ),
}))

describe("RankingView Component", () => {
  it("renders correctly and increments refreshTrigger on reload click", () => {
    render(<RankingView campId={5} />)

    expect(screen.getByText("TABLA DE HONOR DEL CAMPAMENTO")).toBeInTheDocument()

    const mockRanking = screen.getByTestId("mock-manager-ranking")
    expect(mockRanking).toHaveTextContent("CampId: 5, Trigger: 0")

    const refreshBtn = screen.getByRole("button", { name: /actualizar/i })
    fireEvent.click(refreshBtn)

    expect(mockRanking).toHaveTextContent("CampId: 5, Trigger: 1")
  })
})
