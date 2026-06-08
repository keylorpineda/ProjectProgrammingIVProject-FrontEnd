/**
 * Shared prop-type exports for CampLeader components.
 * Used by tests that need to reference component prop shapes without
 * importing the components themselves.
 */

import type {
  Camp,
  CampBalance,
  CampStatistics,
  Exploration,
  Inventory,
  InventoryMovement,
  Person,
  ResourceItem,
  Transfer,
} from "../types"

export interface DashboardViewProps {
  explorations: Exploration[]
  transfers: Transfer[]
  inventory: Inventory[]
  balances: CampBalance[]
  movements: InventoryMovement[]
  statistics: CampStatistics
  onNavigate: (tab: string) => void
}

export interface ExplorationsViewProps {
  explorations: Exploration[]
  activePersons: Person[]
  inventory: Inventory[]
  resources: ResourceItem[]
  camps: Camp[]
  myCampId: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateExploration: (data: any) => Promise<void>
  onDepartExploration: (id: number) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReturnExploration: (id: number, data: any) => Promise<void>
  onCancelExploration: (id: number) => Promise<void>
}

export interface TransfersViewProps {
  transfers: Transfer[]
  camps: Camp[]
  resources: ResourceItem[]
  inventory: Inventory[]
  myCampId: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateTransferRequest: (data: any) => Promise<void>
  onApproveTransferRequest: (id: number, approved: boolean) => Promise<void>
  onCancelTransferRequest: (id: number) => Promise<void>
  onArriveTransferRequest: (id: number) => Promise<void>
}

export interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  survivalScore?: number
}

export interface TopbarProps {
  survivalScore: number
}
