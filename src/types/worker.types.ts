import type { PersonStatus, Profession, Resource } from '@/types/api.types'

export interface WorkerProfile {
  id: string
  name: string
  role: string
  camp_id: string
  status: 'ACTIVE' | 'INACTIVE'
  laborStatus: string
  profession_id: string | null
  profession: Profession | null
  description: string
  createdAt: string
  updatedAt: string
}

export interface WorkerDashboardMetrics {
  totalPeople: number
  activeWorkers: number
  injuryRate: string
  resourceBalance: string
}

export interface WorkerInventoryItem {
  resourceId: string
  resource: Resource
  quantity: number
  status: 'OK' | 'LOW' | 'CRITICAL'
}

export type WorkerTab = 'profile' | 'professions' | 'resources' | 'transfers'

export interface WorkerLayoutProps {
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export interface WorkerDashboardProps {
  activeTab?: string
}
