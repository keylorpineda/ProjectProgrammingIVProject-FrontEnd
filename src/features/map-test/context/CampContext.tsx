import { createContext, useContext, useEffect, useState } from "react"

import { campsService, TacticalMapApiError } from "../services/campsService"

import type { Camp, ExpeditionEvent, HazardArea, TransferLine } from "../types/camp"

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

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const fetchedCamps = await campsService.getCamps()
      const [fetchedTransfers, fetchedHazards] = await Promise.all([
        campsService.getTransfers(fetchedCamps),
        campsService.getHazardAreas(fetchedCamps),
      ])

      setCamps(fetchedCamps)
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCamps((currentCamps) => {
        if (Math.random() <= 0.7 || currentCamps.length === 0) return currentCamps

        const targetIndex = Math.floor(Math.random() * currentCamps.length)
        const next = [...currentCamps]
        const target = next[targetIndex]
        next[targetIndex] = {
          ...target,
          hasAlert: Math.random() > 0.5,
        }
        return next
      })

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
