/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand"

interface User {
  id: string
  name: string
  email: string
  role: "camp_leader" | "scout" | "soldier"
  campId: string | null
}

interface AuthStore {
  user: User | null
  setCampId: (campId: string | null) => void
  logout: () => void
  login: (user: User) => void
}

const DEFAULT_USER: User = {
  id: "usr-928",
  name: "Commander J. Abarca",
  email: "jabarca840@gmail.com",
  role: "camp_leader",
  campId: "1", // Default bunker
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: DEFAULT_USER,
  setCampId: (campId) =>
    set((state) => ({
      user: state.user ? { ...state.user, campId } : null,
    })),
  logout: () => set({ user: null }),
  login: (user) => set({ user }),
}))
