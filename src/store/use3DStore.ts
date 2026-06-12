import { create } from "zustand"

import type { Scene3DState } from "@/features/camp-3d/types/scene.types"

/**
 * Estado global de la vista 3D del campamento.
 *
 * Sin persistencia: la vista 3D es efímera y siempre arranca apagada al
 * recargar. La transición desde el mapa (Paso 8) y el botón "Vista 3D"
 * (Paso 0) escriben aquí; Admin/Worker/CampLeader leen `is3DActive` para
 * decidir si montan la escena.
 */
export const use3DStore = create<Scene3DState>((set) => ({
  is3DActive: false,
  activeCamp3DId: null,
  setIs3DActive: (value) => set({ is3DActive: value }),
  setActiveCamp: (id) => set({ activeCamp3DId: id }),
}))
