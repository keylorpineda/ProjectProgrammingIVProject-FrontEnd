import type {
  InventoryItem,
  InventoryMovement,
  Profession,
  WorkerAssignedResource,
} from '@/types/worker.api.types'

export const fallbackAssignedResources: WorkerAssignedResource[] = [
  {
    id: 1,
    name: 'Racion semanal',
    unit: 'uds',
    category: 'alimentos',
    current_quantity: 1,
    image_url: '',
    description: 'Asignacion basica de supervivencia para turno activo.',
  },
  {
    id: 2,
    name: 'Cantimplora',
    unit: 'uds',
    category: 'agua',
    current_quantity: 1,
    image_url: '',
    description: 'Equipo personal para hidratacion en ruta.',
  },
  {
    id: 3,
    name: 'Kit primeros auxilios',
    unit: 'uds',
    category: 'medico',
    current_quantity: 1,
    image_url: '',
    description: 'Suministro compacto para incidentes menores.',
  },
]

export const fallbackProfessions: Profession[] = [
  {
    id: 1,
    name: 'Aguatero',
    can_explore: false,
    minimum_active_required: 2,
    persons: [
      {
        id: 101,
        first_name: 'Jorge',
        last_name: 'Reyes',
        status: 'activo',
        experience_level: 2,
        can_work: true,
      },
      {
        id: 102,
        first_name: 'Mara',
        last_name: 'Solano',
        status: 'activo',
        experience_level: 1,
        can_work: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Guardia',
    can_explore: false,
    minimum_active_required: 3,
    persons: [
      {
        id: 201,
        first_name: 'Elena',
        last_name: 'Mora',
        status: 'activo',
        experience_level: 3,
        can_work: true,
      },
    ],
  },
  {
    id: 3,
    name: 'Explorador',
    can_explore: true,
    minimum_active_required: 1,
    persons: [
      {
        id: 301,
        first_name: 'Noah',
        last_name: 'Vargas',
        status: 'activo',
        experience_level: 4,
        can_work: true,
      },
    ],
  },
  {
    id: 4,
    name: 'Cocinero',
    can_explore: false,
    minimum_active_required: 2,
    persons: [],
  },
]

export const fallbackInventory: InventoryItem[] = [
  {
    camp_id: 4,
    resource_id: 1,
    resource_name: 'Raciones comida',
    current_quantity: 1240,
    minimum_stock_required: 600,
    alert_active: false,
    last_update: new Date().toISOString(),
    unit: 'uds',
  },
  {
    camp_id: 4,
    resource_id: 2,
    resource_name: 'Agua potable',
    current_quantity: 450,
    minimum_stock_required: 500,
    alert_active: false,
    last_update: new Date().toISOString(),
    unit: 'L',
  },
  {
    camp_id: 4,
    resource_id: 3,
    resource_name: 'Municion 9mm',
    current_quantity: 82,
    minimum_stock_required: 120,
    alert_active: true,
    last_update: new Date().toISOString(),
    unit: 'packs',
  },
  {
    camp_id: 4,
    resource_id: 4,
    resource_name: 'Kits medicos',
    current_quantity: 12,
    minimum_stock_required: 8,
    alert_active: false,
    last_update: new Date().toISOString(),
    unit: 'uds',
  },
]

export const fallbackMovements: InventoryMovement[] = [
  {
    id: 1,
    resource_id: 2,
    resource_name: 'Agua potable',
    camp_id: 4,
    quantity: -40,
    type: 'salida',
    description: 'Consumo diario',
    date: new Date().toISOString(),
    user_id: null,
    user_name: 'J. Reyes',
  },
  {
    id: 2,
    resource_id: 1,
    resource_name: 'Raciones comida',
    camp_id: 4,
    quantity: 200,
    type: 'entrada',
    description: 'Reposicion semanal',
    date: new Date().toISOString(),
    user_id: null,
    user_name: 'Admin',
  },
]
