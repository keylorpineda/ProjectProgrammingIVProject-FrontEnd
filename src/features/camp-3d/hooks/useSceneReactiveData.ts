import { useEffect, useRef } from "react"

import type { SceneHandles } from "../types/scene.types"
import type * as THREE from "three"

import { getPendingAdmissions } from "@/features/admissions/services/admissions.service"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { getExplorations } from "@/features/explorations/services/explorations.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"

/** Polling interval in ms — 8 seconds keeps the scene alive without hammering the API. */
const POLL_MS = 8_000

/**
 * Reactive data bridge: polls backend endpoints and drives the 3D scene's
 * visual cues (lights, colors, animations) based on real camp state.
 *
 * Consumes the `reactiveRefs` + animation functions exposed by `SceneHandles`.
 * Safe to call before the scene is ready — it no-ops until `handles` is set.
 */
export function useSceneReactiveData(
  campId: string,
  handlesRef: React.RefObject<SceneHandles | null>,
) {
  // Track previous state to avoid re-triggering animations.
  const prevExploActive = useRef(false)
  const prevTransferActive = useRef(false)

  useEffect(() => {
    if (!campId) return

    let cancelled = false

    const poll = async () => {
      const handles = handlesRef.current
      if (!handles || cancelled) return

      const refs = handles.reactiveRefs

      // ---- 1. DASHBOARD → Cuartel General (danger_level) ----
      try {
        const metrics = await getDashboardMetrics(campId)
        // Derive danger_level heuristic: critical resources or high unavailable people
        const criticalResources = metrics.warehouse?.resources_with_alerts ?? 0
        const occupancy = metrics.camp?.occupancy_rate ?? 0
        const unavailable = metrics.camp?.unavailable_people ?? 0
        const total = metrics.camp?.total_people ?? 1

        let dangerLevel: "critical" | "high" | "low" = "low"
        if (criticalResources >= 3 || occupancy > 95) dangerLevel = "critical"
        else if (criticalResources >= 1 || unavailable / total > 0.3) dangerLevel = "high"

        // Flag color: CRITICAL → red, else blue (original)
        const flagMat = refs.hqFlag.material as THREE.MeshStandardMaterial
        if (dangerLevel === "critical") {
          flagMat.color.setHex(0xff1100)
          flagMat.emissive.setHex(0xff1100)
          flagMat.emissiveIntensity = 0.6
        } else {
          flagMat.color.setHex(0x223388)
          flagMat.emissive.setHex(0x112266)
          flagMat.emissiveIntensity = 0.1
        }

        // Interior light: HIGH → reduced intensity (flicker handled in animate loop);
        // LOW → stable warm glow.
        if (dangerLevel === "high") {
          refs.hqInteriorLight.intensity = 1.2
        } else if (dangerLevel === "critical") {
          refs.hqInteriorLight.intensity = 0.6
        } else {
          refs.hqInteriorLight.intensity = 2.5
        }
      } catch {
        /* Dashboard API may 404 on some roles — leave defaults */
      }

      // ---- 2. ADMISSIONS → Garita del Guardia ----
      try {
        const admissions = await getPendingAdmissions({ campId })
        const pendingCount = admissions.total ?? admissions.data?.length ?? 0

        if (pendingCount > 0) {
          // Red emergency lamp
          refs.gateEmergencyLamp.color.setHex(0xff2200)
          refs.gateEmergencyLamp.intensity = 3.0
        } else {
          // Green stable
          refs.gateEmergencyLamp.color.setHex(0x44ff44)
          refs.gateEmergencyLamp.intensity = 1.5
        }
      } catch {
        /* silent */
      }

      // ---- 3. EXPLORATIONS → Torre de Vigilancia ----
      try {
        const explorations = await getExplorations({ campId })
        const hasActive = explorations.some(
          (e) => e.status === "in_progress" || e.status === "en_route",
        )
        const hasOverdue = explorations.some((e) => e.status === "overdue")

        if (hasOverdue) {
          // Reflector blinks orange (handled via intensity toggle)
          refs.watchtowerSpot.color.setHex(0xff6600)
        } else if (hasActive) {
          // Spot fixed towards gate
          refs.watchtowerSpot.target.position.set(0, 0, 14.4)
          refs.watchtowerSpot.target.updateMatrixWorld()
          refs.watchtowerSpot.color.setHex(0xdde8ff)
        } else {
          refs.watchtowerSpot.color.setHex(0xdde8ff)
          // Sweep handled in animate loop
        }

        // Trigger exploration animation only on transition false → true
        if (hasActive && !prevExploActive.current) {
          handles.playExplorationAnimation()
        }
        prevExploActive.current = hasActive
      } catch {
        /* silent */
      }

      // ---- 4. INVENTORY → Almacén + Depósito ----
      try {
        const inventory = await getInventory(campId)
        const hasAlert = inventory.some((item) => item.alert_active)

        // Fuel-specific check
        const fuelItem = inventory.find(
          (item) =>
            item.resource?.category === "fuel" ||
            item.resource?.name?.toLowerCase().includes("combustible"),
        )
        const fuelCritical = fuelItem && fuelItem.current_quantity < fuelItem.minimum_stock_required

        // Red alert light on warehouse roof
        refs.warehouseAlertLight.intensity = hasAlert ? 4.0 : 0

        // Warehouse interior light: high inventory → warm glow
        const totalQty = inventory.reduce((sum, i) => sum + i.current_quantity, 0)
        const totalMin = inventory.reduce((sum, i) => sum + i.minimum_stock_required, 0)
        const ratio = totalMin > 0 ? totalQty / totalMin : 1
        if (ratio > 1.5) {
          // Bonanza — extra warm
          refs.warehouseLight.intensity = 5.0
          refs.warehouseLight.color.setHex(0xffcc88)
        } else {
          refs.warehouseLight.intensity = 3.0
          refs.warehouseLight.color.setHex(0xffcc88)
        }

        // Fuel tank visual feedback (handled via alert light color tint)
        if (fuelCritical) {
          refs.warehouseAlertLight.color.setHex(0xff6600)
        } else if (hasAlert) {
          refs.warehouseAlertLight.color.setHex(0xff2200)
        }
      } catch {
        /* silent */
      }

      // ---- 5. TRANSFERS → Garaje ----
      try {
        const transfers = await getCampTransfers(campId)
        const hasInTransit = transfers.some((t) => t.status === "in_transit")
        const hasPending = transfers.some((t) => t.status === "pending")
        const hasApproved = transfers.some((t) => t.status === "approved")

        // Trigger truck animation only on transition false → true
        if ((hasInTransit || hasApproved) && !prevTransferActive.current) {
          handles.playTransferAnimation()
        }
        prevTransferActive.current = hasInTransit || hasApproved

        // If pending → door stays closed (default), handled by animate loop
        void hasPending
      } catch {
        /* silent */
      }

      // ---- 6. PERSONS → Apartamentos (ventanas iluminadas) ----
      try {
        const persons = await getPersons({ campId, limit: 9999 })
        const allPeople = persons.data ?? []
        const total = allPeople.length || 1
        const canWork = allPeople.filter((p) => p.can_work).length
        const ratio = canWork / total

        // emissiveIntensity 0.0–1.2 proportional to active worker ratio
        refs.apartmentsLitWindows.emissiveIntensity = 0.1 + ratio * 1.1
      } catch {
        /* silent */
      }
    }

    // Initial poll
    void poll()

    // Recurring poll
    const id = window.setInterval(() => void poll(), POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [campId, handlesRef])
}
