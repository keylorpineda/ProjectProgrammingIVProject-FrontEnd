/**
 * Derives a deterministic visual theme for a camp from its ID.
 * No backend changes required — the campId UUID hashes to one of 4 themes,
 * so each camp always renders identically for every user.
 */

export type CampTheme = "temperate" | "arid" | "arctic" | "industrial"

export interface CampVisuals {
  seed: number
  theme: CampTheme
  weathering: number // 0 (pristine) → 1 (heavily worn)
  colors: {
    fog: number
    ground: number
    grass: number
    dirt: number
    brick: number
    concrete: number
    wood: number
    woodDark: number
    metal: number
    rust: number
  }
  lighting: {
    ambientColor: number
    ambientIntensity: number
    moonColor: number
    moonIntensity: number
    skyColor: number
    skyIntensity: number
  }
  fog: { near: number; far: number }
}

// FNV-1a hash — deterministic across browsers
function fnv1a(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  }
  return h
}

// ---- Theme templates ----

const TEMPERATE: Omit<CampVisuals, "seed" | "theme" | "weathering"> = {
  colors: {
    fog: 0x04080a,
    ground: 0x1a2010,
    grass: 0x162e0c,
    dirt: 0x2a1e0e,
    brick: 0x5a3825,
    concrete: 0x4a4a45,
    wood: 0x3d2e1e,
    woodDark: 0x241710,
    metal: 0x2a2a30,
    rust: 0x7a3518,
  },
  lighting: {
    ambientColor: 0x0c1410,
    ambientIntensity: 1.15,
    moonColor: 0x8899bb,
    moonIntensity: 1.45,
    skyColor: 0x334455,
    skyIntensity: 0.25,
  },
  fog: { near: 28, far: 55 },
}

// Dry, sun-baked camp — sandy tones, warm moonlight
const ARID: Omit<CampVisuals, "seed" | "theme" | "weathering"> = {
  colors: {
    fog: 0x0a0806,
    ground: 0x261a08,
    grass: 0x2e2008,
    dirt: 0x3a2a0e,
    brick: 0x7a5030,
    concrete: 0x5a5040,
    wood: 0x4a3420,
    woodDark: 0x332410,
    metal: 0x342c20,
    rust: 0x8a4820,
  },
  lighting: {
    ambientColor: 0x18100a,
    ambientIntensity: 1.25,
    moonColor: 0xccaa88,
    moonIntensity: 1.65,
    skyColor: 0x302418,
    skyIntensity: 0.22,
  },
  fog: { near: 32, far: 65 },
}

// Mountain / high-altitude camp — cold, icy, dim
const ARCTIC: Omit<CampVisuals, "seed" | "theme" | "weathering"> = {
  colors: {
    fog: 0x060810,
    ground: 0x0e141e,
    grass: 0x0c1218,
    dirt: 0x121822,
    brick: 0x3a3840,
    concrete: 0x384050,
    wood: 0x2a2830,
    woodDark: 0x1e2028,
    metal: 0x2a3040,
    rust: 0x504860,
  },
  lighting: {
    ambientColor: 0x080c18,
    ambientIntensity: 1.05,
    moonColor: 0x9aaac0,
    moonIntensity: 1.85,
    skyColor: 0x1a2030,
    skyIntensity: 0.3,
  },
  fog: { near: 20, far: 48 },
}

// Urban ruins — concrete, steel, almost no vegetation
const INDUSTRIAL: Omit<CampVisuals, "seed" | "theme" | "weathering"> = {
  colors: {
    fog: 0x060608,
    ground: 0x141412,
    grass: 0x0c0e0a,
    dirt: 0x181614,
    brick: 0x3a3530,
    concrete: 0x404040,
    wood: 0x302820,
    woodDark: 0x221c16,
    metal: 0x303034,
    rust: 0x684030,
  },
  lighting: {
    ambientColor: 0x0a0a10,
    ambientIntensity: 1.2,
    moonColor: 0x8899aa,
    moonIntensity: 1.5,
    skyColor: 0x202025,
    skyIntensity: 0.2,
  },
  fog: { near: 25, far: 52 },
}

const THEMES = [TEMPERATE, ARID, ARCTIC, INDUSTRIAL] as const
const THEME_NAMES: CampTheme[] = ["temperate", "arid", "arctic", "industrial"]

export function getCampVisuals(campId: string): CampVisuals {
  const seed = fnv1a(campId)
  const themeIdx = seed % 4
  const base = THEMES[themeIdx]
  // Extract a 0-1 weathering factor from another byte of the hash
  const weathering = ((seed >> 8) & 0xff) / 255
  return {
    seed,
    theme: THEME_NAMES[themeIdx],
    weathering,
    ...base,
  }
}
