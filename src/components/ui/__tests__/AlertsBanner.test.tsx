import { fireEvent } from "@testing-library/dom"
import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import AlertsBanner from "../AlertsBanner"

import { useAlertsStore } from "@/store/useAlertsStore"

describe("AlertsBanner", () => {
  beforeEach(() => {
    useAlertsStore.setState({
      inventoryAlerts: {},
      transferAlerts: [],
    })
  })

  it("renders nothing when there are no alerts for the camp", () => {
    const { container } = render(<AlertsBanner campId="1" />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders up to three inventory alerts for the selected camp", () => {
    useAlertsStore.getState().setInventoryAlerts("7", [
      { resource_id: 1, resource_name: "Agua", current_quantity: 2, minimum_stock_required: 10 },
      { resource_id: 2, resource_name: "Comida", current_quantity: 1, minimum_stock_required: 8 },
      { resource_id: 3, resource_name: "Medicina", current_quantity: 0, minimum_stock_required: 5 },
      { resource_id: 4, resource_name: "Baterias", current_quantity: 3, minimum_stock_required: 9 },
    ])

    render(<AlertsBanner campId={7} />)

    expect(screen.getByText("Agua")).toBeInTheDocument()
    expect(screen.getByText("Comida")).toBeInTheDocument()
    expect(screen.getByText("Medicina")).toBeInTheDocument()
    expect(screen.queryByText("Baterias")).not.toBeInTheDocument()
    expect(screen.getByText("2 / 10")).toBeInTheDocument()
  })

  it("renders transfer alerts for the camp and allows dismissing one", () => {
    useAlertsStore.setState({
      transferAlerts: [
        {
          id: "visible",
          type: "RECURSOS",
          originCamp: "Camp Norte",
          requestDate: "2026-06-01",
          campId: "4",
          receivedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "hidden",
          type: "PERSONAS",
          originCamp: "Camp Sur",
          requestDate: "2026-06-01",
          campId: "5",
          receivedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    })

    render(<AlertsBanner campId="4" />)

    expect(screen.getByText(/Camp Norte/i)).toBeInTheDocument()
    expect(screen.queryByText(/Camp Sur/i)).not.toBeInTheDocument()

    const alert = screen.getByText(/Camp Norte/i).closest("div")?.parentElement?.parentElement
    expect(alert).toBeTruthy()
    fireEvent.click(within(alert as HTMLElement).getByRole("button"))

    expect(useAlertsStore.getState().transferAlerts).toHaveLength(1)
    expect(useAlertsStore.getState().transferAlerts[0].id).toBe("hidden")
  })
})
