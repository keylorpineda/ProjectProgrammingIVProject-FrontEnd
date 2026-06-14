import type * as THREE from "three"

/**
 * Roles del sistema que pueden ver/interactuar con la vista 3D.
 * Coinciden con los `role` que emite el backend (ver guards en src/core/guards).
 */
export type Camp3DRole = "admin" | "resource_manager" | "travel_manager" | "camp_leader" | "worker"

/**
 * Claves de datos reactivos del backend que disparan animaciones en la escena
 * (ver useSceneAnimations en pasos posteriores). `null` = edificio sin reacción.
 */
export type ReactiveDataKey =
  | "inventory_alert"
  | "exploration_active"
  | "transfer_active"
  | "admissions_pending"

/** Configuración declarativa de un edificio interactivo de la escena. */
export interface BuildingConfig {
  /** Identificador estable, usado en userData y para navegación. */
  id: string
  /** Nombre visible en el tooltip/HUD. */
  label: string
  /** Nombres de los meshes de la escena que representan este edificio. */
  meshNames: string[]
  /** Ruta de la app a la que navega el click (vista admin por defecto). */
  route: string
  /** Roles que pueden ver e interactuar con el edificio. */
  requiredRoles: Camp3DRole[]
  /** Dato del backend que reacciona visualmente, o null. */
  reactiveData: ReactiveDataKey | null
  /** Posición aproximada en el mundo 3D (para tooltip / enfoque de cámara). */
  position3D: { x: number; y: number; z: number }
}

/** userData que llevan los meshes de edificio para el raycaster. */
export interface BuildingUserData {
  type: "building"
  /** Coincide con BuildingConfig.id. */
  id: string
  /** emissiveIntensity original, para restaurar tras el hover. */
  baseEmissiveIntensity: number
}

/** Props del componente de escena principal. */
export interface CampScene3DProps {
  /** Campamento cuyo estado se visualiza. */
  campId: string
  /** Cierra la vista 3D y vuelve a la vista anterior. */
  onClose: () => void
}

/**
 * Referencias a objetos de la escena que reaccionan a datos del backend
 * (las consume el paso de datos reactivos / useSceneAnimations).
 */
export interface SceneReactiveRefs {
  /** Bandera del Cuartel General (roja con danger_level CRITICAL). */
  hqFlag: THREE.Mesh
  /** Luz interior del CG (parpadea según danger_level). */
  hqInteriorLight: THREE.PointLight
  /** Brazo de la barrera de la garita (rotation.z con admisiones pendientes). */
  gateBarrierArm: THREE.Object3D
  /** Lámpara de emergencia de la garita (parpadea en rojo con pendientes). */
  gateEmergencyLamp: THREE.PointLight
  /** Reflector de la torre (apunta fijo al gate con exploración in_progress). */
  watchtowerSpot: THREE.SpotLight
  /** Luz interior del almacén (cálida estable con inventario > 90%). */
  warehouseLight: THREE.PointLight
  /** Luz roja de alerta sobre el almacén (intensity 0 por defecto). */
  warehouseAlertLight: THREE.PointLight
  /** Pivote de la puerta basculante del garaje (rotation.x al abrir). */
  garageDoor: THREE.Object3D
  /** Material compartido de las ventanas iluminadas de los Apartamentos. */
  apartmentsLitWindows: THREE.MeshStandardMaterial
}

/**
 * Handles que devuelve el constructor de escena para que el loop de animación
 * y el cleanup puedan operar sobre lo construido.
 */
export interface SceneHandles {
  /** Anima luces/partículas/spotlights en cada frame. `t` en segundos acumulados. */
  animate: (t: number) => void
  /** Libera geometrías, materiales y luces creados por el constructor. */
  dispose: () => void
  /** Meshes etiquetados con userData.type === 'building', objetivos del raycaster. */
  buildingMeshes: THREE.Object3D[]
  /** Salida de exploración: 3 figuras caminan de la torre al gate (~4s). */
  playExplorationAnimation: () => void
  /** Traslado: puerta del garaje sube y el camión sale por el gate (~6.5s). */
  playTransferAnimation: () => void
  /** Fija el comportamiento del reflector de la torre según los datos. */
  setWatchtowerMode: (mode: WatchtowerMode) => void
  /** Objetos que el paso de datos reactivos manipula directamente. */
  reactiveRefs: SceneReactiveRefs
}

/** Comportamiento del reflector de la torre según el estado de exploraciones. */
export type WatchtowerMode = "sweep" | "gate" | "overdue"

/** Estado global de la vista 3D (Zustand). */
export interface Scene3DState {
  is3DActive: boolean
  activeCamp3DId: string | null
  setIs3DActive: (value: boolean) => void
  setActiveCamp: (id: string | null) => void
}
