import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as THREE from "three"

import { BUILDINGS } from "../constants/buildings.config"
import { useRaycaster } from "../hooks/useRaycaster"
import { useSceneReactiveData } from "../hooks/useSceneReactiveData"
import { useThreeScene } from "../hooks/useThreeScene"
import { buildCampScene } from "../services/sceneBuilder"

import type { CameraState } from "../hooks/useThreeScene"
import type {
  BuildingConfig,
  BuildingUserData,
  Camp3DRole,
  CampScene3DProps,
  SceneHandles,
} from "../types/scene.types"

import { workerService } from "@/features/worker/services/workerService"
import { useAuthStore } from "@/store/useAuthStore"

import "./CampScene3D.css"

type Props = CampScene3DProps & {
  /** Se dispara cuando la escena Three.js ha terminado de construirse. */
  onReady?: () => void
}

/** Normaliza el role del backend a los roles que entiende la escena. */
const normalizeRole = (role?: string): Camp3DRole => {
  const r = (role ?? "").toLowerCase()
  if (r.includes("admin")) return "admin"
  if (r === "camp_leader" || r === "resource_manager" || r === "travel_manager") return r
  return "worker"
}

/**
 * Paso 07 — marcador de perfil: cada rol tiene "su" espacio en el campamento.
 * Una luz azulada pulsa sobre esa zona; el click navega al perfil del usuario.
 */
const PROFILE_MARKERS: Record<Camp3DRole, { pos: [number, number, number]; route: string }> = {
  admin: { pos: [0, 3.3, -6.6], route: "/admin/profile" }, // ventana 2do piso CG
  camp_leader: { pos: [-4.4, 1.8, -10], route: "/campleader/dashboard" }, // ala lateral CG
  resource_manager: { pos: [-8.3, 2.2, 4], route: "/camp-manager" }, // oficina del almacén
  travel_manager: { pos: [10.2, 2, 11.6], route: "/travel-manager/dashboard" }, // despacho garaje
  worker: { pos: [12.8, 1.5, -3.1], route: "/worker/dashboard" }, // default: apartamentos
}

/**
 * Paso 07 — sub-categorías de worker según profesión:
 *  - soldado → Armería (locker room)
 *  - explorador → Torre de Vigilancia (plataforma superior)
 *  - otro → Apartamentos (su unidad — default)
 */
const WORKER_SUB_MARKERS: Record<string, { pos: [number, number, number]; route: string }> = {
  soldier: { pos: [12, 1.5, 1.5], route: "/worker/profile" }, // armería locker
  explorer: { pos: [-17, 6.2, 11], route: "/worker/profile" }, // torre plataforma
  other: { pos: [12.8, 1.5, -3.1], route: "/worker/dashboard" }, // apartamentos
}

/** Resuelve la posición del perfil para workers según su profesión. */
const resolveWorkerSubType = (professionName?: string): string => {
  const name = (professionName ?? "").toLowerCase()
  if (
    name.includes("soldado") ||
    name.includes("soldier") ||
    name.includes("guardia") ||
    name.includes("guard")
  )
    return "soldier"
  if (name.includes("explorador") || name.includes("explorer") || name.includes("scout"))
    return "explorer"
  return "other"
}

// Huella de los edificios en el minimapa (coordenadas mundo → minimapa).
const MINIMAP_BUILDINGS = [
  { x: -13, z: 4, w: 32, h: 23, col: "#686858" }, // almacén
  { x: -6, z: 4, w: 13, h: 13, col: "#6b3520" }, // depósito fuel
  { x: 0, z: -10, w: 26, h: 23, col: "#4a4a45" }, // cuartel general
  { x: 10, z: -6, w: 29, h: 19, col: "#5a3825" }, // apartamentos
  { x: 13.5, z: 8.5, w: 26, h: 27, col: "#404038" }, // garaje
  { x: -17, z: 11, w: 14, h: 17, col: "#4a3020" }, // torre vigilancia
  { x: -6, z: 12.5, w: 6, h: 7, col: "#3d2e1e" }, // garita
  { x: 12, z: 3, w: 19, h: 17, col: "#686858" }, // armería
  { x: 6, z: 11, w: 19, h: 9, col: "#4a3020" }, // cocina
  { x: 0, z: 9, w: 10, h: 11, col: "#3a4450" }, // radio
]
const MINIMAP_ZONES = [
  { x: 0, z: -5, col: 0x44ff44 },
  { x: -11, z: -2, col: 0xff3333 },
  { x: 10, z: 4, col: 0xffbb00 },
]

const drawMinimap = (mmX: CanvasRenderingContext2D, cam: CameraState) => {
  mmX.clearRect(0, 0, 140, 140)
  mmX.fillStyle = "#030703"
  mmX.fillRect(0, 0, 140, 140)
  // zone tints
  const ztc = [
    [70, 51, 0x44ff44],
    [70 + -11 * 3.2, 70 + -2 * 3.8, 0xff3333],
    [70 + 10 * 3.2, 70 + 4 * 3.8, 0xffbb00],
  ]
  ztc.forEach((z) => {
    const g = mmX.createRadialGradient(z[0], z[1], 1, z[0], z[1], 20)
    const h = "#" + z[2].toString(16).padStart(6, "0")
    g.addColorStop(0, h + "77")
    g.addColorStop(1, h + "00")
    mmX.fillStyle = g
    mmX.fillRect(0, 0, 140, 140)
  })
  mmX.strokeStyle = "rgba(100,80,40,0.6)"
  mmX.lineWidth = 1.5
  mmX.strokeRect(1, 1, 138, 138)
  // bg buildings
  mmX.fillStyle = "rgba(50,35,25,0.9)"
  mmX.fillRect(2, 2, 50, 24)
  mmX.fillRect(88, 2, 50, 28)
  mmX.fillRect(52, 2, 32, 20)
  // paths
  mmX.fillStyle = "rgba(40,38,30,0.7)"
  mmX.fillRect(66, 2, 8, 136)
  mmX.fillRect(2, 94, 136, 8)
  // camp buildings
  MINIMAP_BUILDINGS.forEach((b) => {
    const mx = 70 + b.x * 3.2
    const my = 70 + b.z * 3.8
    mmX.fillStyle = b.col
    mmX.fillRect(mx - b.w / 2, my - b.h / 2, b.w, b.h)
    mmX.strokeStyle = "rgba(200,200,150,0.35)"
    mmX.lineWidth = 0.7
    mmX.strokeRect(mx - b.w / 2, my - b.h / 2, b.w, b.h)
  })
  // zones
  MINIMAP_ZONES.forEach((z) => {
    const mx = 70 + z.x * 3.2
    const my = 70 + z.z * 3.8
    mmX.beginPath()
    mmX.arc(mx, my, 4, 0, Math.PI * 2)
    mmX.fillStyle = "#" + z.col.toString(16).padStart(6, "0")
    mmX.fill()
  })
  // fires
  mmX.beginPath()
  mmX.arc(70 + -3 * 3.2, 70 + 8 * 3.8, 3, 0, Math.PI * 2)
  mmX.fillStyle = "#ff5500"
  mmX.fill()
  mmX.beginPath()
  mmX.arc(70 + 5.6 * 3.2, 70 + 11 * 3.8, 2, 0, Math.PI * 2)
  mmX.fillStyle = "#ff7700"
  mmX.fill()
  // camera indicator
  const cx = Math.max(5, Math.min(135, 70 + cam.target.x * 3.2))
  const cy = Math.max(5, Math.min(135, 70 + cam.target.z * 3.8))
  mmX.beginPath()
  mmX.arc(cx, cy, 3.5, 0, Math.PI * 2)
  mmX.fillStyle = "#fff"
  mmX.fill()
  mmX.beginPath()
  mmX.moveTo(cx, cy)
  mmX.lineTo(cx + Math.sin(cam.theta) * 13, cy + Math.cos(cam.theta) * 13)
  mmX.strokeStyle = "rgba(255,255,255,0.6)"
  mmX.lineWidth = 1.5
  mmX.stroke()
}

/**
 * Escena 3D del campamento migrada de camp3d.html. Monta el canvas Three.js,
 * construye la escena en `onReady`, la anima cada frame, dibuja el minimapa y
 * conecta el raycaster (hover + click → navegación). Limpia todo al desmontar.
 */
export default function CampScene3D({ campId, onClose, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const minimapRef = useRef<HTMLCanvasElement | null>(null)
  const posRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef<HTMLDivElement | null>(null)

  const handlesRef = useRef<SceneHandles | null>(null)
  const targetsRef = useRef<THREE.Object3D[]>([])
  const frameRef = useRef(0)
  const profileRef = useRef<{ group: THREE.Group; light: THREE.PointLight } | null>(null)

  const navigate = useNavigate()
  const [hovered, setHovered] = useState<BuildingConfig | null>(null)

  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.role)
  const [workerSubType, setWorkerSubType] = useState<string>("other")

  // Fetch worker profession for sub-type placement
  useEffect(() => {
    if (role === "worker") {
      workerService
        .getMyProfile()
        .then((profile: any) => {
          const profName = profile.person?.profession?.name
          setWorkerSubType(resolveWorkerSubType(profName))
        })
        .catch(() => setWorkerSubType("other"))
    }
  }, [role])

  // Update marker position dynamically if worker profile is fetched after scene load
  useEffect(() => {
    if (role === "worker" && profileRef.current) {
      const pos = WORKER_SUB_MARKERS[workerSubType].pos
      const { group, light } = profileRef.current
      // zone is the first child
      group.children[0].position.set(pos[0], pos[1], pos[2])
      light.position.set(pos[0], pos[1] + 0.5, pos[2])
    }
  }, [role, workerSubType])

  // Config sintética del marcador de perfil (Paso 07) para tooltip y click.
  const profileBuilding = useMemo<BuildingConfig>(() => {
    const marker = role === "worker" ? WORKER_SUB_MARKERS[workerSubType] : PROFILE_MARKERS[role]
    return {
      id: "profile",
      label: `Tu Perfil — ${user?.username ?? role}`,
      meshNames: [],
      route: marker.route,
      requiredRoles: [role],
      reactiveData: null,
      position3D: { x: marker.pos[0], y: marker.pos[1], z: marker.pos[2] },
    }
  }, [role, user?.username, workerSubType])

  const contextRef = useThreeScene(canvasRef, {
    onReady: (ctx) => {
      const handles = buildCampScene(ctx.scene)
      handlesRef.current = handles

      // Paso 09 — filtro por rol: los edificios sin acceso se oscurecen y
      // dejan de ser objetivos del raycaster (admin ve todo sin cambios).
      const allowed = new Set(
        BUILDINGS.filter((b) => b.requiredRoles.includes(role)).map((b) => b.id),
      )
      const targets: THREE.Object3D[] = []
      handles.buildingMeshes.forEach((meshObj) => {
        const data = meshObj.userData as BuildingUserData
        if (allowed.has(data.id)) {
          targets.push(meshObj)
        } else {
          const m = (meshObj as THREE.Mesh).material as THREE.MeshStandardMaterial
          m.color.multiplyScalar(0.35)
          m.emissiveIntensity = 0
        }
      })

      // Paso 07 — marcador de perfil: zona translúcida clickeable + luz que
      // pulsa lentamente sobre el espacio del usuario.
      const markerPos =
        role === "worker" ? WORKER_SUB_MARKERS[workerSubType].pos : PROFILE_MARKERS[role].pos
      const group = new THREE.Group()
      const zone = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.1),
        new THREE.MeshStandardMaterial({
          color: 0xaaddff,
          emissive: 0xaaddff,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.22,
          roughness: 0.5,
        }),
      )
      zone.position.set(markerPos[0], markerPos[1], markerPos[2])
      const profileData: BuildingUserData = {
        type: "building",
        id: "profile",
        baseEmissiveIntensity: 0.35,
      }
      zone.userData = profileData
      const light = new THREE.PointLight(0xaaddff, 0.9, 6)
      light.position.set(markerPos[0], markerPos[1] + 0.5, markerPos[2])
      group.add(zone, light)
      ctx.scene.add(group)
      profileRef.current = { group, light }
      targets.push(zone)

      targetsRef.current = targets
      onReady?.()
    },
    onFrame: (t, ctx) => {
      handlesRef.current?.animate(t)
      const profile = profileRef.current
      if (profile) profile.light.intensity = 0.7 + Math.sin(t * 2.2) * 0.35
      // Minimapa + HUD cada 3 frames (como el original).
      frameRef.current += 1
      if (frameRef.current % 3 === 0) {
        const mm = minimapRef.current?.getContext("2d")
        if (mm) drawMinimap(mm, ctx.camState)
        if (posRef.current) {
          posRef.current.textContent = `POS: ${ctx.camState.target.x.toFixed(1)},${ctx.camState.target.z.toFixed(1)}`
        }
        if (zoomRef.current) {
          zoomRef.current.textContent = `ZOOM: ${ctx.camState.radius.toFixed(0)}m`
        }
      }
    },
  })

  // Paso Reactivo — conecta endpoints del backend con las refs visuales.
  useSceneReactiveData(campId, handlesRef)

  useRaycaster(canvasRef, contextRef, targetsRef, {
    onBuildingClick: (building) => {
      onClose()
      navigate(building.route)
    },
    onHoverChange: setHovered,
    extraBuildings: [profileBuilding],
  })

  // Libera la escena al desmontar (el renderer lo libera useThreeScene).
  useEffect(() => {
    return () => {
      handlesRef.current?.dispose()
      handlesRef.current = null
      targetsRef.current = []
      const profile = profileRef.current
      if (profile) {
        profile.group.traverse((obj) => {
          const m = obj as THREE.Mesh
          if (m.geometry) m.geometry.dispose()
          if (m.material) (m.material as THREE.Material).dispose()
        })
        profile.group.removeFromParent()
        profile.light.dispose()
        profileRef.current = null
      }
    }
  }, [])

  return (
    <div className="camp3d-root" data-camp-id={campId}>
      <canvas ref={canvasRef} className="camp3d-canvas" />

      <button type="button" className="camp3d-back" onClick={onClose}>
        ◄ Volver al Mapa
      </button>

      <div className="camp3d-hud">
        <div className="camp3d-zp camp3d-zr">☢ Red Zone</div>
        <div className="camp3d-zp camp3d-zg">✦ Green Zone</div>
        <div className="camp3d-zp camp3d-zy">⚠ Quarantine</div>
      </div>

      <div className="camp3d-minimap">
        <canvas ref={minimapRef} width={140} height={140} />
      </div>

      {hovered ? <div className="camp3d-hover-label">{hovered.label}</div> : null}

      <div className="camp3d-ctrl">
        WASD/Flechas Mover &nbsp;|&nbsp; Drag Rotar &nbsp;|&nbsp; Scroll Zoom &nbsp;|&nbsp; Q/E
        Altura
      </div>
      <div className="camp3d-inf">
        <div ref={posRef}>POS: 0,0</div>
        <div ref={zoomRef}>ZOOM: 30m</div>
      </div>
    </div>
  )
}
