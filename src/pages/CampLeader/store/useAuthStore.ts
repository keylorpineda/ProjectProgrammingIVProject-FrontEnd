// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  login: (username: string, campId: number) => void;
}

// Simple pub-sub store for global authentication state simulation
class AuthStore {
  private state: { user: User | null; isAuthenticated: boolean };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      user: {
        id: 77,
        username: "COMANDANTE_M_VANCE",
        role: "camp_leader",
        campId: 1 // Refugio Alfa (Búnker Central)
      },
      isAuthenticated: true
    };
  }

  getState() {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  login(username: string, campId: number) {
    this.state = {
      user: {
        id: Math.floor(Math.random() * 900) + 100,
        username: username.toUpperCase(),
        role: "camp_leader",
        campId: campId
      },
      isAuthenticated: true
    };
    this.notify();
  }

  logout() {
    this.state = {
      user: null,
      isAuthenticated: false
    };
    this.notify();
  }
}

const globalAuthStore = new AuthStore();

export function useAuthStore(): AuthState {
  const [state, setState] = useState(globalAuthStore.getState());

  useEffect(() => {
    return globalAuthStore.subscribe(() => {
      setState({ ...globalAuthStore.getState() });
    });
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login: (username: string, campId: number) => globalAuthStore.login(username, campId),
    logout: () => globalAuthStore.logout()
  };
}
