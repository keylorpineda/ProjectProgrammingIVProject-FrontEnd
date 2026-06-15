import type { BuildingConfig } from "../types/scene.types"

/**
 * Catálogo de edificios interactivos del campamento 3D (plan TLoU2).
 *
 * Cada `meshNames` referencia los nombres que el constructor de escena
 * (services/sceneBuilder.ts) asigna a los meshes principales. `requiredRoles`
 * y `reactiveData` los consumen los pasos de rol y de datos reactivos.
 *
 * Las rutas son las de la vista Admin; las variantes por rol (camp_leader,
 * resource_manager, etc.) se resuelven en el paso de roles. La armería, la
 * radio y la torre de spotlight quedaron decorativas (sin entrada aquí); el
 * Paso 07 las reutiliza como marcadores de perfil.
 */
export const BUILDINGS: BuildingConfig[] = [
  {
    id: "hq",
    label: "Cuartel General",
    meshNames: ["hq_mesh"],
    route: "/admin/dashboard",
    requiredRoles: ["admin", "camp_leader"],
    reactiveData: null,
    position3D: { x: 0, y: 2.25, z: -10 },
  },
  {
    id: "gate",
    label: "Garita del Guardia",
    meshNames: ["gate_mesh"],
    route: "/admin/admissions",
    requiredRoles: ["admin", "camp_leader", "resource_manager"],
    reactiveData: "admissions_pending",
    position3D: { x: -6, y: 1.25, z: 12.5 },
  },
  {
    id: "barracks",
    label: "Apartamentos",
    meshNames: ["barracks_mesh"],
    route: "/admin/people",
    requiredRoles: ["admin", "camp_leader"],
    reactiveData: null,
    position3D: { x: 10, y: 3.75, z: -6 },
  },
  {
    id: "watchtower",
    label: "Torre de Vigilancia",
    meshNames: ["watchtower_mesh"],
    route: "/admin/explorations",
    requiredRoles: ["admin", "camp_leader", "travel_manager", "worker"],
    reactiveData: "exploration_active",
    position3D: { x: -17, y: 5.9, z: 11 },
  },
  {
    id: "warehouse",
    label: "Almacén",
    meshNames: ["warehouse_mesh"],
    route: "/admin/resources",
    requiredRoles: ["admin", "resource_manager", "camp_leader", "worker"],
    reactiveData: "inventory_alert",
    position3D: { x: -13, y: 2, z: 4 },
  },
  {
    id: "garage",
    label: "Garaje de Traslados",
    meshNames: ["garage_mesh"],
    route: "/admin/transfers",
    requiredRoles: ["admin", "travel_manager", "camp_leader"],
    reactiveData: "transfer_active",
    position3D: { x: 13.5, y: 2, z: 8.5 },
  },
]
