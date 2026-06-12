import type { BuildingConfig } from "../types/scene.types"

/**
 * Catálogo de edificios interactivos del campamento 3D.
 *
 * Cada `meshNames` referencia los nombres que el constructor de escena
 * (services/sceneBuilder.ts) asigna a los meshes principales. `requiredRoles`
 * y `reactiveData` los consumen los pasos de rol y animación posteriores; en el
 * Paso 0 sólo se usan para etiquetar los meshes y habilitar el raycaster.
 *
 * Las rutas son las de la vista Admin (Día 1). Las variantes por rol se
 * resuelven en los pasos de cada rol.
 */
export const BUILDINGS: BuildingConfig[] = [
  {
    id: "warehouse",
    label: "Almacén",
    meshNames: ["warehouse_mesh"],
    route: "/admin/resources",
    requiredRoles: ["admin", "resource_manager", "camp_leader"],
    reactiveData: "inventory_alert",
    position3D: { x: -14, y: 1.6, z: 4 },
  },
  {
    id: "watchtower",
    label: "Torre Vigilancia",
    meshNames: ["watchtower_mesh"],
    route: "/admin/explorations",
    requiredRoles: ["admin", "travel_manager", "camp_leader"],
    reactiveData: "exploration_active",
    position3D: { x: -17, y: 5.2, z: 11 },
  },
  {
    id: "gate",
    label: "Garita Admisiones",
    meshNames: ["gate_mesh"],
    route: "/admin/admissions",
    requiredRoles: ["admin", "camp_leader", "resource_manager"],
    reactiveData: "admissions_pending",
    position3D: { x: 0, y: 3.8, z: 14 },
  },
  {
    id: "barracks",
    label: "Barracas",
    meshNames: ["barracks_mesh"],
    route: "/admin/people",
    requiredRoles: ["admin", "camp_leader"],
    reactiveData: null,
    position3D: { x: 10, y: 1, z: -6 },
  },
  {
    id: "hq",
    label: "Cuartel General",
    meshNames: ["hq_mesh"],
    route: "/admin/dashboard",
    requiredRoles: ["admin", "travel_manager", "camp_leader"],
    reactiveData: null,
    position3D: { x: 0, y: 1.75, z: -10 },
  },
  {
    id: "command_tower",
    label: "Torre de Mando",
    meshNames: ["command_tower_mesh"],
    route: "/admin/transfers",
    requiredRoles: ["admin", "travel_manager"],
    reactiveData: "transfer_active",
    position3D: { x: 16, y: 5.5, z: -12 },
  },
  {
    id: "armory",
    label: "Armería",
    meshNames: ["armory_mesh"],
    route: "/admin/resources",
    requiredRoles: ["admin", "resource_manager"],
    reactiveData: "inventory_alert",
    position3D: { x: 12, y: 1.5, z: 3 },
  },
  {
    id: "fuel_depot",
    label: "Depósito Fuel",
    meshNames: ["fuel_mesh"],
    route: "/admin/resources",
    requiredRoles: ["admin", "resource_manager"],
    reactiveData: "inventory_alert",
    position3D: { x: -8, y: 1, z: -8 },
  },
  {
    id: "radio",
    label: "Estación Radio",
    meshNames: ["radio_mesh"],
    route: "/admin/dashboard",
    requiredRoles: ["admin", "travel_manager"],
    reactiveData: null,
    position3D: { x: 0, y: 1.4, z: 9 },
  },
  {
    id: "truck",
    label: "Camión",
    meshNames: ["truck_mesh"],
    route: "/admin/transfers",
    requiredRoles: ["admin", "travel_manager"],
    reactiveData: "transfer_active",
    position3D: { x: 15, y: 0.9, z: 7 },
  },
]
