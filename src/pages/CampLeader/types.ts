// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profession {
  id: number;
  name: string;
  description?: string;
}

export type PersonStatus = 'active' | 'sick' | 'injured' | 'exploring' | 'deceased';

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  profession_id: number;
  status: PersonStatus;
  can_work: boolean;
  experience_level: number; // 1 to 5+
  experience_points: number;
  expeditionsSurvived: number;
  previous_skills: string;
  photo_url?: string;
  profession: Profession;
}

export interface Camp {
  id: number;
  name: string;
  location?: string;
  survival_score?: number;
}

export interface ExplorationPerson {
  exploration_id: number;
  person_id: number;
  is_leader: boolean;
  return_confirmed: boolean;
  person: Person;
}

export interface ExplorationResource {
  exploration_id: number;
  resource_id: number;
  quantity: number;
  resource: ResourceItem;
}

export type ExplorationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Exploration {
  id: number;
  camp_id: number;
  name: string;
  destination_description: string;
  departure_date: string; // ISO String or Date
  estimated_days: number;
  grace_days: number;
  real_return_date?: string;
  status: ExplorationStatus;
  notes?: string;
  user_create_id?: number;
  // Relations
  explorationPersons: ExplorationPerson[];
  explorationResources: ExplorationResource[];
  camp: Camp;
}

export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected' | 'cancelled';

export interface Transfer {
  id: number;
  origin_camp_id: number;
  destination_camp_id: number;
  resource_id: number;
  quantity: number;
  status: TransferStatus;
  requested_by_user_id: number;
  approved_by_user_id?: number;
  notes?: string;
  // Helper joined fields for readable render
  resource?: ResourceItem;
  origin_camp?: Camp;
  destination_camp?: Camp;
}

export type ResourceCategory = 'food' | 'water' | 'medicine' | 'tools' | 'weapons';

export interface ResourceItem {
  id: number;
  name: string;
  unit: string;
  category: ResourceCategory;
  image_url?: string;
}

export interface Inventory {
  camp_id: number;
  resource_id: number;
  current_quantity: number;
  minimum_stock_required: number;
  alert_active: boolean; // true if below minimum
  resource: ResourceItem;
}

export interface InventoryMovement {
  id: number;
  camp_id: number;
  resource_id: number;
  quantity: number; // Positive for addition, negative for subtraction
  type: string; // e.g., 'exploration_returned', 'transfer_sent', 'consumption', 'production'
  notes?: string;
  created_at: string;
}

export interface CampBalance {
  production: number;
  consumption: number;
  net: number;
  resource_id: number;
  resource_name: string;
}

export interface CampStatistics {
  total_persons: number;
  active_workers: number;
  injured_or_sick: number;
  exploring: number;
  deceased: number;
  occupancy_rate: number; // percentage
  explorations_completed: number;
  survival_score: number;
}

export interface User {
  id: number;
  username: string;
  role: 'encargado_viajes';
  campId: number;
}
