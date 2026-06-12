import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useRaycaster } from "../hooks/useRaycaster"
import { useThreeScene } from "../hooks/useThreeScene"
import { buildCampScene } from "../services/sceneBuilder"

import type { CameraState } from "../hooks/useThreeScene"
import type { BuildingConfig, CampScene3DProps, SceneHandles } from "../types/scene.types"
import type * as THREE from "three"

import "./CampScene3D.css"

type Props = CampScene3DProps & {
  /** Se dispara cuando la escena Three.js ha terminado de construirse. */
  onReady?: () => void
}

// Huella de los edificios en el minimapa (coordenadas mundo → minimapa).
const MINIMAP_BUILDINGS = [
  { x: -14, z: 4, w: 16, h: 10, col: "#b8b8a8" },
  { x: 0, z: -10, w: 18, h: 13, col: "#303828" },
  { x: 12, z: 3, w: 16, h: 12, col: "#686858" },
  { x: -17, z: 11, w: 8, h: 8, col: "#4a3020" },
  { x: 10, z: -6, w: 18, h: 10, col: "#5a3820" },
  { x: 0, z: 9, w: 10, h: 8, col: "#3a4450" },
  { x: 6, z: 11, w: 16, h: 6, col: "#4a3020" },
  { x: -8, z: -8, w: 12, h: 8, col: "#686858" },
]
const MINIMAP_ZONES = [
  { x: 0, z: -5, col: 0x44ff44 },
  { x: -11, z: 2, col: 0xff3333 },
  { x: 10, z: 4, col: 0xffbb00 },
]

const drawMinimap = (mmX: CanvasRenderingContext2D, cam: CameraState) => {
  mmX.clearRect(0, 0, 140, 140)
  mmX.fillStyle = "#030703"
  mmX.fillRect(0, 0, 140, 140)
  // zone tints
  const ztc = [
    [70, 51, 0x44ff44],
    [70 + -11 * 3.2, 70 + 2 * 3.8, 0xff3333],
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

  const navigate = useNavigate()
  const [hovered, setHovered] = useState<BuildingConfig | null>(null)

  const contextRef = useThreeScene(canvasRef, {
    onReady: (ctx) => {
      const handles = buildCampScene(ctx.scene)
      handlesRef.current = handles
      targetsRef.current = handles.buildingMeshes
      onReady?.()
    },
    onFrame: (t, ctx) => {
      handlesRef.current?.animate(t)
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

  useRaycaster(canvasRef, contextRef, targetsRef, {
    onBuildingClick: (building) => {
      onClose()
      navigate(building.route)
    },
    onHoverChange: setHovered,
  })

  // Libera la escena al desmontar (el renderer lo libera useThreeScene).
  useEffect(() => {
    return () => {
      handlesRef.current?.dispose()
      handlesRef.current = null
      targetsRef.current = []
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
