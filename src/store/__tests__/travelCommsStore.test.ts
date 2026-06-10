import { beforeEach, describe, expect, it } from "vitest"

import { useTravelCommsStore } from "../travelCommsStore"

describe("travelCommsStore", () => {
  beforeEach(() => {
    useTravelCommsStore.setState({
      consultedCampId: "",
      explorationStatusFilter: "",
      explorationSearch: "",
      selectedExplorationId: null,
      transferStatusFilter: "all",
      transferRoleFilter: "all",
      transferSearch: "",
      selectedTransferId: null,
    })
  })

  it("updates camp, exploration, and transfer state", () => {
    const store = useTravelCommsStore.getState()

    store.setConsultedCampId("CAMP-2")
    store.setExplorationStatusFilter("scheduled")
    store.setExplorationSearch("north route")
    store.setSelectedExplorationId("EXP-1")
    store.setTransferStatusFilter("pending")
    store.setTransferRoleFilter("origin")
    store.setTransferSearch("Bravo")
    store.setSelectedTransferId("TR-1")

    expect(useTravelCommsStore.getState()).toMatchObject({
      consultedCampId: "CAMP-2",
      explorationStatusFilter: "scheduled",
      explorationSearch: "north route",
      selectedExplorationId: "EXP-1",
      transferStatusFilter: "pending",
      transferRoleFilter: "origin",
      transferSearch: "Bravo",
      selectedTransferId: "TR-1",
    })
  })

  it("resets filters without clearing the consulted camp", () => {
    const store = useTravelCommsStore.getState()

    store.setConsultedCampId("CAMP-9")
    store.setExplorationStatusFilter("active")
    store.setExplorationSearch("ridge")
    store.setSelectedExplorationId("EXP-9")
    store.setTransferStatusFilter("completed")
    store.setTransferRoleFilter("destination")
    store.setTransferSearch("Alpha")
    store.setSelectedTransferId("TR-9")

    store.resetFilters()

    expect(useTravelCommsStore.getState()).toMatchObject({
      consultedCampId: "CAMP-9",
      explorationStatusFilter: "",
      explorationSearch: "",
      selectedExplorationId: null,
      transferStatusFilter: "all",
      transferRoleFilter: "all",
      transferSearch: "",
      selectedTransferId: null,
    })
  })
})
