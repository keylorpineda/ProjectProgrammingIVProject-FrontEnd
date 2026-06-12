import { useEffect, useRef } from "react"
import * as THREE from "three"

import { BUILDINGS } from "../constants/buildings.config"

import type { ThreeContext } from "./useThreeScene"
import type { BuildingConfig, BuildingUserData } from "../types/scene.types"
import type { RefObject } from "react"

const HIGHLIGHT_HEX = 0x6eff44
const HIGHLIGHT_INTENSITY = 0.6
// Umbral en px para distinguir un click de un drag de cámara.
const CLICK_DRAG_THRESHOLD = 6

const buildingById = new Map<string, BuildingConfig>(BUILDINGS.map((b) => [b.id, b]))

interface UseRaycasterOptions {
  /** Click sobre un edificio interactivo. */
  onBuildingClick?: (building: BuildingConfig) => void
  /** Cambio de edificio bajo el cursor (null al salir). Útil para el tooltip. */
  onHoverChange?: (building: BuildingConfig | null) => void
}

interface SavedEmissive {
  hex: number
  intensity: number
}

/**
 * Raycaster de hover/click sobre los meshes de edificio (userData.type ===
 * 'building'). En hover sube el emissive del mesh (resaltado verde) y lo
 * restaura al salir; en click resuelve el BuildingConfig y dispara
 * `onBuildingClick`. Distingue click de drag de cámara por desplazamiento.
 *
 * Lee cámara/escena de `contextRef` y los objetivos de `targetsRef` en tiempo
 * de evento, por lo que tolera que la escena aún no esté construida.
 */
export function useRaycaster(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  contextRef: RefObject<ThreeContext | null>,
  targetsRef: RefObject<THREE.Object3D[]>,
  { onBuildingClick, onHoverChange }: UseRaycasterOptions = {},
) {
  const onClickRef = useRef(onBuildingClick)
  const onHoverRef = useRef(onHoverChange)
  onClickRef.current = onBuildingClick
  onHoverRef.current = onHoverChange

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hovered: THREE.Mesh | null = null
    let saved: SavedEmissive | null = null
    let downPos: { x: number; y: number } | null = null

    const pick = (e: MouseEvent): THREE.Mesh | null => {
      const ctx = contextRef.current
      const targets = targetsRef.current
      if (!ctx || !targets || targets.length === 0) return null
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, ctx.camera)
      const hits = raycaster.intersectObjects(targets, false)
      return hits.length > 0 ? (hits[0].object as THREE.Mesh) : null
    }

    const restore = () => {
      if (hovered && saved) {
        const mat = hovered.material as THREE.MeshStandardMaterial
        mat.emissive.setHex(saved.hex)
        mat.emissiveIntensity = saved.intensity
      }
      hovered = null
      saved = null
    }

    const onMouseMove = (e: MouseEvent) => {
      const mesh = pick(e)
      if (mesh === hovered) return
      restore()
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        saved = { hex: mat.emissive.getHex(), intensity: mat.emissiveIntensity }
        mat.emissive.setHex(HIGHLIGHT_HEX)
        mat.emissiveIntensity = HIGHLIGHT_INTENSITY
        hovered = mesh
        canvas.style.cursor = "pointer"
        const id = (mesh.userData as BuildingUserData).id
        onHoverRef.current?.(buildingById.get(id) ?? null)
      } else {
        canvas.style.cursor = ""
        onHoverRef.current?.(null)
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      downPos = { x: e.clientX, y: e.clientY }
    }
    const onClick = (e: MouseEvent) => {
      if (!downPos) return
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y)
      downPos = null
      if (moved > CLICK_DRAG_THRESHOLD) return // fue un drag de cámara
      const mesh = pick(e)
      if (!mesh) return
      const id = (mesh.userData as BuildingUserData).id
      const building = buildingById.get(id)
      if (building) onClickRef.current?.(building)
    }

    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("mousedown", onMouseDown)
    canvas.addEventListener("click", onClick)

    return () => {
      restore()
      canvas.style.cursor = ""
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("mousedown", onMouseDown)
      canvas.removeEventListener("click", onClick)
    }
  }, [canvasRef, contextRef, targetsRef])
}
