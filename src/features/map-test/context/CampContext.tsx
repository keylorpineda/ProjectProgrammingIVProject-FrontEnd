import { createContext, useContext, useEffect, useState } from "react"

import { campsService, TacticalMapApiError } from "../services/campsService"

import type { Camp, ExpeditionEvent, HazardArea, TransferLine } from "../types/camp"

import api from "@/config/api"
import { useAlertsStore } from "@/store/useAlertsStore"

interface RawInventoryAlert {
  resource_id: number
  resource_name?: string
  current_quantity: number
  minimum_stock_required: number
}

interface CampContextType {
  camps: Camp[]
  transfers: TransferLine[]
  expeditions: ExpeditionEvent[]
  hazardAreas: HazardArea[]
  selectedCamp: Camp | null
  setSelectedCamp: (camp: Camp | null) => void
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const CampContext = createContext<CampContextType | undefined>(undefined)

export const CampProvider = ({ children }: { children: React.ReactNode }) => {
  const [camps, setCamps] = useState<Camp[]>([])
  const [transfers, setTransfers] = useState<TransferLine[]>([])
  const [expeditions, setExpeditions] = useState<ExpeditionEvent[]>([])
  const [hazardAreas, setHazardAreas] = useState<HazardArea[]>([])
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setInventoryAlerts = useAlertsStore((s) => s.setInventoryAlerts)

  const applyAlertsToCamps = (
    campList: Camp[],
    alertsByCampId: Record<string, RawInventoryAlert[]>,
  ): Camp[] =>
    campList.map((camp) => {
      const campAlerts = alertsByCampId[String(camp.id)] ?? []
      return {
        ...camp,
        hasAlert: campAlerts.length > 0,
        dangerLevel:
          campAlerts.length >= 3 ? "critical" : campAlerts.length >= 1 ? "high" : camp.dangerLevel,
      }
    })

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Tres requests en paralelo en lugar de 1 + N + N
      const [fetchedCamps, alertsResponse] = await Promise.all([
        campsService.getCamps(),
        api
          .get<Record<string, RawInventoryAlert[]>>("/resources/inventory/alerts/all")
          .catch(() => ({ data: {} as Record<string, RawInventoryAlert[]> })),
      ])

      const rawAlerts = alertsResponse.data ?? {}
      const alertsByCampId: Record<string, RawInventoryAlert[]> = {}

      for (const [campId, alerts] of Object.entries(rawAlerts)) {
        const normalized = (Array.isArray(alerts) ? alerts : []).map((a) => ({
          ...a,
          resource_name: a.resource_name ?? `Recurso ${a.resource_id}`,
        }))
        alertsByCampId[campId] = normalized
        setInventoryAlerts(campId, normalized)
      }

      const campsWithAlerts = applyAlertsToCamps(fetchedCamps, alertsByCampId)

      const [fetchedTransfers, fetchedHazards] = await Promise.all([
        campsService.getTransfers(campsWithAlerts),
        campsService.getHazardAreas(campsWithAlerts),
      ])

      setCamps(campsWithAlerts)
      setTransfers(fetchedTransfers)
      setHazardAreas(fetchedHazards)
    } catch (err) {
      const message =
        err instanceof TacticalMapApiError
          ? err.message
          : "No se pudo inicializar el modulo tactico."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Sync camp alert state whenever the global store receives socket events
  const inventoryAlerts = useAlertsStore((s) => s.inventoryAlerts)
  useEffect(() => {
    if (Object.keys(inventoryAlerts).length === 0) return
    setCamps((currentCamps) => {
      if (currentCamps.length === 0) return currentCamps
      return applyAlertsToCamps(currentCamps, inventoryAlerts)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryAlerts])

  useEffect(() => {
    const interval = window.setInterval(() => {
      // Expedition simulation (visual only — no fake alerts)
      setExpeditions((currentExpeditions) => {
        if (Math.random() <= 0.65 || camps.length === 0) return currentExpeditions

        const origin = camps[Math.floor(Math.random() * camps.length)]
        const newExpedition: ExpeditionEvent = {
          id: Math.random().toString(36).slice(2, 11),
          originId: origin.id,
          type: "Expedicion",
          coords: [
            origin.coords[0] + (Math.random() - 0.5) * 0.02,
            origin.coords[1] + (Math.random() - 0.5) * 0.02,
          ],
          label: "Mision de Exploracion",
          status: "active",
        }

        window.setTimeout(() => {
          setExpeditions((active) => active.filter((item) => item.id !== newExpedition.id))
        }, 10000)

        return [...currentExpeditions, newExpedition]
      })
    }, 15000)

    return () => window.clearInterval(interval)
  }, [camps])

  return (
    <CampContext.Provider
      value={{
        camps,
        transfers,
        expeditions,
        hazardAreas,
        selectedCamp,
        setSelectedCamp,
        loading,
        error,
        reload: loadData,
      }}
    >
      {children}
    </CampContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCamps = () => {
  const context = useContext(CampContext)
  if (!context) throw new Error("useCamps must be used within a CampProvider")
  return context
}
