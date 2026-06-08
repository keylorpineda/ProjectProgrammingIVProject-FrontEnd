import { create } from "zustand"

export interface InventoryAlertItem {
  resource_id: number
  resource_name: string
  current_quantity: number
  minimum_stock_required: number
}

export interface InventoryAlertEvent {
  campId: number | string
  alerts: InventoryAlertItem[]
  timestamp: string
}

export interface TransferAlertItem {
  id: string
  type: string
  originCamp: string
  requestDate: string
  campId: number | string
  receivedAt: string
}

interface AlertsState {
  inventoryAlerts: Record<string, InventoryAlertItem[]> // keyed by campId string
  transferAlerts: TransferAlertItem[]
  setInventoryAlerts: (campId: string, alerts: InventoryAlertItem[]) => void
  addTransferAlert: (alert: Omit<TransferAlertItem, "receivedAt">) => void
  dismissTransferAlert: (id: string) => void
  clearTransferAlerts: () => void
  totalCritical: (campId: string) => number
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  inventoryAlerts: {},
  transferAlerts: [],

  setInventoryAlerts: (campId, alerts) =>
    set((state) => ({
      inventoryAlerts: { ...state.inventoryAlerts, [campId]: alerts },
    })),

  addTransferAlert: (alert) =>
    set((state) => ({
      transferAlerts: [
        { ...alert, receivedAt: new Date().toISOString() },
        ...state.transferAlerts.slice(0, 19), // keep last 20
      ],
    })),

  dismissTransferAlert: (id) =>
    set((state) => ({
      transferAlerts: state.transferAlerts.filter((a) => a.id !== id),
    })),

  clearTransferAlerts: () => set({ transferAlerts: [] }),

  totalCritical: (campId) => get().inventoryAlerts[campId]?.length ?? 0,
}))
