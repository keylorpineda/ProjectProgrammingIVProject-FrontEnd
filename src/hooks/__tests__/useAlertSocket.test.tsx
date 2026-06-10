import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAlertSocket } from "../useAlertSocket"
import { useSocket } from "../useSocket"

import { useAlertsStore } from "@/store/useAlertsStore"

vi.mock("../useSocket", () => ({
  useSocket: vi.fn(),
}))

describe("useAlertSocket", () => {
  const socket = {
    on: vi.fn(),
    off: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAlertsStore.setState({ inventoryAlerts: {}, transferAlerts: [] })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  )

  it("does nothing when there is no socket", () => {
    vi.mocked(useSocket).mockReturnValue(null)

    renderHook(() => useAlertSocket("3"), { wrapper })

    expect(socket.on).not.toHaveBeenCalled()
  })

  it("registers handlers, updates stores, invalidates queries, and cleans up", () => {
    vi.mocked(useSocket).mockReturnValue(socket as never)

    const { unmount } = renderHook(() => useAlertSocket("3"), { wrapper })

    const inventoryHandler = socket.on.mock.calls.find(
      ([event]) => event === "inventory.alert",
    )?.[1]
    const transferHandler = socket.on.mock.calls.find(
      ([event]) => event === "transfer.requested",
    )?.[1]

    inventoryHandler({
      campId: 3,
      alerts: [
        { resource_id: 1, resource_name: "Agua", current_quantity: 1, minimum_stock_required: 10 },
      ],
      timestamp: "now",
    })
    transferHandler({
      id: "tr-1",
      type: "RECURSOS",
      originCamp: "Camp A",
      requestDate: "today",
      campId: "ignored",
    })

    expect(useAlertsStore.getState().inventoryAlerts["3"]).toHaveLength(1)
    expect(useAlertsStore.getState().transferAlerts[0]).toMatchObject({
      id: "tr-1",
      campId: "3",
    })

    unmount()

    expect(socket.off).toHaveBeenCalledWith("inventory.alert", inventoryHandler)
    expect(socket.off).toHaveBeenCalledWith("transfer.requested", transferHandler)
  })
})
