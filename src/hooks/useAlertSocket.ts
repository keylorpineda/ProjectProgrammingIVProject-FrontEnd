import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { useSocket } from "./useSocket"

import {
  useAlertsStore,
  type InventoryAlertEvent,
  type TransferAlertItem,
} from "@/store/useAlertsStore"

export const useAlertSocket = (activeCampId: string) => {
  const socket = useSocket()
  const setInventoryAlerts = useAlertsStore((s) => s.setInventoryAlerts)
  const addTransferAlert = useAlertsStore((s) => s.addTransferAlert)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    const handleInventoryAlert = (payload: InventoryAlertEvent) => {
      const campId = String(payload.campId)
      setInventoryAlerts(campId, payload.alerts ?? [])
      // Invalidate dashboard query so metrics refresh
      void queryClient.invalidateQueries({ queryKey: ["adminDashboard", campId] })
    }

    const handleTransferRequested = (payload: Omit<TransferAlertItem, "receivedAt">) => {
      addTransferAlert({ ...payload, campId: activeCampId })
      void queryClient.invalidateQueries({ queryKey: ["transfers"] })
    }

    socket.on("inventory.alert", handleInventoryAlert)
    socket.on("transfer.requested", handleTransferRequested)

    return () => {
      socket.off("inventory.alert", handleInventoryAlert)
      socket.off("transfer.requested", handleTransferRequested)
    }
  }, [socket, activeCampId, setInventoryAlerts, addTransferAlert, queryClient])
}
