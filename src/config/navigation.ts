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
  path: string;
  icon: React.ElementType;
  allowedRoles: Role[];
}

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    id: 'dashboard',
    label: 'COMANDO CENTRAL',
    path: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager', 'worker'],
  },
  {
    id: 'personnel',
    label: 'PERSONAL',
    path: '/personnel',
    icon: Users,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager', 'worker'],
  },
  {
    id: 'inventory',
    label: 'BODEGA Y LOGÍSTICA',
    path: '/inventory',
    icon: Box,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager', 'worker'],
  },
  {
    id: 'expeditions',
    label: 'EXPEDICIONES',
    path: '/expeditions',
    icon: Map,
    allowedRoles: ['admin', 'camp_leader', 'travel_manager'],
  },
  {
    id: 'transfers',
    label: 'TRASLADOS',
    path: '/transfers',
    icon: Truck,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager'],
  },
  {
    id: 'refugees',
    label: 'AUDITORÍA IA',
    path: '/refugees',
    icon: ShieldAlert,
    allowedRoles: ['admin', 'camp_leader', 'resource_manager', 'travel_manager'],
  },
];
