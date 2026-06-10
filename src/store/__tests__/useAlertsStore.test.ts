import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAlertsStore } from "../useAlertsStore"

describe("useAlertsStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
    useAlertsStore.setState({ inventoryAlerts: {}, transferAlerts: [] })
  })

  it("stores inventory alerts by camp and counts critical items", () => {
    useAlertsStore.getState().setInventoryAlerts("7", [
      {
        resource_id: 1,
        resource_name: "Water",
        current_quantity: 2,
        minimum_stock_required: 10,
      },
    ])

    expect(useAlertsStore.getState().inventoryAlerts["7"]).toHaveLength(1)
    expect(useAlertsStore.getState().totalCritical("7")).toBe(1)
    expect(useAlertsStore.getState().totalCritical("missing")).toBe(0)
  })

  it("adds, caps, dismisses, and clears transfer alerts", () => {
    Array.from({ length: 25 }, (_, index) => {
      useAlertsStore.getState().addTransferAlert({
        id: `transfer-${index}`,
        type: "resources",
        originCamp: "North",
        requestDate: "2026-01-01",
        campId: "7",
      })
    })

    expect(useAlertsStore.getState().transferAlerts).toHaveLength(20)
    expect(useAlertsStore.getState().transferAlerts[0]).toMatchObject({
      id: "transfer-24",
      receivedAt: "2026-01-01T00:00:00.000Z",
    })

    useAlertsStore.getState().dismissTransferAlert("transfer-24")
    expect(useAlertsStore.getState().transferAlerts[0].id).toBe("transfer-23")

    useAlertsStore.getState().clearTransferAlerts()
    expect(useAlertsStore.getState().transferAlerts).toEqual([])
  })
})
