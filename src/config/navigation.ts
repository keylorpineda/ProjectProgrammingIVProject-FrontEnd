import {
  LayoutDashboard,
  Users,
  Box,
  Map,
  Truck,
  ShieldAlert,
  
  UserCircle
} from 'lucide-react';
import React from 'react';

export type Role = 'admin' | 'camp_leader' | 'resource_manager' | 'travel_manager' | 'worker';

export interface NavItem {
  id: string;
  label: string;
  roleLabels?: Partial<Record<Role, string>>;
  path: string;
  icon: React.ElementType;
  allowedRoles: Role[];
}

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    id: 'dashboard',
    label: 'TABLERO',
    roleLabels: {
      admin: 'TABLERO',
      travel_manager: 'TABLERO',
      camp_leader: 'TABLERO',
      worker: 'TABLERO'
    },
    path: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager', 'worker'],
  },
  {
    id: 'personnel',
    label: 'PERSONAL',
    roleLabels: {
      admin: 'PERSONAL',
      travel_manager: 'PERSONAL',
      camp_leader: 'PERFIL',
      worker: 'PERFIL'
    },
    path: '/personnel',
    icon: Users,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager', 'worker'],
  },
  {
    id: 'inventory',
    label: 'RECURSOS',
    roleLabels: {
      admin: 'RECURSOS',
      travel_manager: 'RECURSOS',
      camp_leader: 'INVENTARIO',
      worker: 'INVENTARIO'
    },
    path: '/inventory',
    icon: Box,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager', 'worker'],
  },
  {
    id: 'expeditions',
    label: 'EXPLORACIONES',
    roleLabels: {
      admin: 'EXPLORACIONES',
      travel_manager: 'EXPLORACIONES',
      camp_leader: 'EXPLORACIONES'
    },
    path: '/expeditions',
    icon: Map,
    allowedRoles: ['admin', 'camp_leader', 'travel_manager'],
  },
  {
    id: 'transfers',
    label: 'TRASLADOS',
    roleLabels: {
      admin: 'TRASLADOS',
      travel_manager: 'TRASLADOS',
      camp_leader: 'TRASLADOS'
    },
    path: '/transfers',
    icon: Truck,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager'],
  },
  {
    id: 'refugees',
    label: 'ADMISIONES',
    roleLabels: {
      admin: 'ADMISIONES'
    },
    path: '/refugees',
    icon: ShieldAlert,
    allowedRoles: ['admin', 'resource_manager'],
  },
];
