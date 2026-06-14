import { useEffect, useRef } from "react"
import * as THREE from "three"

import type { RefObject } from "react"

/** Estado de la cámara orbital (drag + WASD), compartido con el minimapa. */
export interface CameraState {
  theta: number
  phi: number
  radius: number
  target: THREE.Vector3
}

/** Contexto de Three.js que la escena necesita para construirse y animarse. */
export interface ThreeContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  camState: CameraState
}

interface UseThreeSceneOptions {
  /** Se llama una vez tras crear renderer/scene/camera, antes de arrancar el loop. */
  onReady?: (ctx: ThreeContext) => void
  /** Se llama en cada frame tras actualizar la cámara y antes de renderizar. */
  onFrame?: (t: number, ctx: ThreeContext) => void
}

const SPEED = 0.18
const MOVE_KEYS = new Set([
  "w",
  "W",
  "a",
  "A",
  "s",
  "S",
  "d",
  "D",
  "q",
  "Q",
  "e",
  "E",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
])

/**
 * Configura renderer, escena, cámara, controles de cámara (drag/rueda/WASD/touch),
 * el loop de animación y el cleanup completo (cancelAnimationFrame, dispose del
 * renderer, retirada de listeners). Es agnóstico al contenido de la escena: ésta
 * se construye en `onReady` y se anima en `onFrame`.
 *
 * Devuelve un ref al `ThreeContext` (null hasta que la escena está lista), útil
 * para el raycaster y overlays como el minimapa.
 */
export function useThreeScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { onReady, onFrame }: UseThreeSceneOptions = {},
) {
  const contextRef = useRef<ThreeContext | null>(null)
  // Mantenemos callbacks en refs para no re-montar la escena si cambian.
  const onReadyRef = useRef(onReady)
  const onFrameRef = useRef(onFrame)
  onReadyRef.current = onReady
  onFrameRef.current = onFrame

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ---- RENDERER ----
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    })
    const initialW = canvas.clientWidth || window.innerWidth
    const initialH = canvas.clientHeight || window.innerHeight
    renderer.setSize(initialW, initialH, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.58

    // ---- SCENE ----
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x04080a)
    scene.fog = new THREE.Fog(0x04080a, 28, 55)

    // ---- CAMERA ----
    const camera = new THREE.PerspectiveCamera(58, initialW / initialH, 0.1, 150)
    camera.position.set(0, 22, 20)
    camera.lookAt(0, 0, 0)

    const camState: CameraState = {
      theta: 0.25,
      phi: 0.68,
      radius: 30,
      target: new THREE.Vector3(0, 0, 0),
    }

    const ctx: ThreeContext = { scene, camera, renderer, camState }
    contextRef.current = ctx
    onReadyRef.current?.(ctx)

    // ---- CONTROLS ----
    const keys: Record<string, boolean> = {}
    let isDragging = false
    let prevM = { x: 0, y: 0 }
    let touchStart: { x: number; y: number } | null = null
    let pinch0: number | null = null

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevM = { x: e.clientX, y: e.clientY }
    }
    const onMouseUp = () => {
      isDragging = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      camState.theta -= (e.clientX - prevM.x) * 0.006
      camState.phi = Math.max(0.1, Math.min(1.38, camState.phi + (e.clientY - prevM.y) * 0.006))
      prevM = { x: e.clientX, y: e.clientY }
    }
    const onWheel = (e: WheelEvent) => {
      camState.radius = Math.max(5, Math.min(60, camState.radius + e.deltaY * 0.04))
      e.preventDefault()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true
      if (MOVE_KEYS.has(e.key)) e.preventDefault()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false
    }
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        isDragging = true
      }
      if (e.touches.length === 2) {
        const d = e.touches
        pinch0 = Math.hypot(d[0].clientX - d[1].clientX, d[0].clientY - d[1].clientY)
      }
      e.preventDefault()
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchStart) {
        camState.theta -= (e.touches[0].clientX - touchStart.x) * 0.008
        camState.phi = Math.max(
          0.1,
          Math.min(1.38, camState.phi + (e.touches[0].clientY - touchStart.y) * 0.008),
        )
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
      if (e.touches.length === 2 && pinch0) {
        const d = e.touches
        const dist = Math.hypot(d[0].clientX - d[1].clientX, d[0].clientY - d[1].clientY)
        camState.radius = Math.max(5, Math.min(60, camState.radius * (pinch0 / dist)))
        pinch0 = dist
      }
      e.preventDefault()
    }
    const onTouchEnd = () => {
      isDragging = false
      touchStart = null
      pinch0 = null
    }

    canvas.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    canvas.addEventListener("touchstart", onTouchStart, { passive: false })
    canvas.addEventListener("touchmove", onTouchMove, { passive: false })
    canvas.addEventListener("touchend", onTouchEnd)

    // ---- RESIZE ----
    const resize = () => {
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener("resize", resize)

    // ---- LOOP ----
    let rafId = 0
    let t = 0
    const fw = new THREE.Vector3()
    const rt = new THREE.Vector3()

    const loop = () => {
      rafId = requestAnimationFrame(loop)
      t += 0.016

      fw.set(Math.sin(camState.theta), 0, -Math.cos(camState.theta))
      rt.set(Math.cos(camState.theta), 0, Math.sin(camState.theta))
      if (keys["w"] || keys["W"] || keys["ArrowUp"]) camState.target.addScaledVector(fw, SPEED)
      if (keys["s"] || keys["S"] || keys["ArrowDown"]) camState.target.addScaledVector(fw, -SPEED)
      if (keys["a"] || keys["A"] || keys["ArrowLeft"]) camState.target.addScaledVector(rt, -SPEED)
      if (keys["d"] || keys["D"] || keys["ArrowRight"]) camState.target.addScaledVector(rt, SPEED)
      if (keys["q"] || keys["Q"]) camState.radius = Math.max(5, camState.radius - 0.25)
      if (keys["e"] || keys["E"]) camState.radius = Math.min(60, camState.radius + 0.25)
      camState.target.x = Math.max(-22, Math.min(22, camState.target.x))
      camState.target.z = Math.max(-16, Math.min(16, camState.target.z))

      camera.position.x =
        camState.target.x + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta)
      camera.position.y = camState.target.y + camState.radius * Math.cos(camState.phi)
      camera.position.z =
        camState.target.z + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta)
      camera.lookAt(camState.target)

      onFrameRef.current?.(t, ctx)
      renderer.render(scene, camera)
    }
    loop()

    // ---- CLEANUP ----
    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      canvas.removeEventListener("touchend", onTouchEnd)
      renderer.dispose()
      contextRef.current = null
    }
  }, [canvasRef])

  return contextRef
}
