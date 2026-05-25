import { create } from "zustand"

interface TravelCommsState {
  // Camp filter state
  consultedCampId: string
  setConsultedCampId: (id: string) => void

  // Exploration UI filters
  explorationStatusFilter: string
  setExplorationStatusFilter: (status: string) => void
  explorationSearch: string
  setExplorationSearch: (query: string) => void
  selectedExplorationId: string | null
  setSelectedExplorationId: (id: string | null) => void

  // Transfer UI filters
  transferStatusFilter: string
  setTransferStatusFilter: (status: string) => void
  transferRoleFilter: string
  setTransferRoleFilter: (role: string) => void
  transferSearch: string
  setTransferSearch: (query: string) => void
  selectedTransferId: string | null
  setSelectedTransferId: (id: string | null) => void

  // Reset all filters
  resetFilters: () => void
}

export const useTravelCommsStore = create<TravelCommsState>((set) => ({
  consultedCampId: "",
  setConsultedCampId: (id) => set({ consultedCampId: id }),

  explorationStatusFilter: "",
  setExplorationStatusFilter: (status) => set({ explorationStatusFilter: status }),
  explorationSearch: "",
  setExplorationSearch: (query) => set({ explorationSearch: query }),
  selectedExplorationId: null,
  setSelectedExplorationId: (id) => set({ selectedExplorationId: id }),

  transferStatusFilter: "all",
  setTransferStatusFilter: (status) => set({ transferStatusFilter: status }),
  transferRoleFilter: "all",
  setTransferRoleFilter: (role) => set({ transferRoleFilter: role }),
  transferSearch: "",
  setTransferSearch: (query) => set({ transferSearch: query }),
  selectedTransferId: null,
  setSelectedTransferId: (id) => set({ selectedTransferId: id }),

  resetFilters: () =>
    set({
      explorationStatusFilter: "",
      explorationSearch: "",
      selectedExplorationId: null,
      transferStatusFilter: "all",
      transferRoleFilter: "all",
      transferSearch: "",
      selectedTransferId: null,
    }),
}))
