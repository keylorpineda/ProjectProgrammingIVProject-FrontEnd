import * as THREE from "three"

export interface TexPair {
  map: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
}

// Module-level cache: avoid regenerating expensive procedural textures when the
// 3D overlay is closed and reopened. Key encodes all parameters that affect output.
const _texCache = new Map<string, TexPair>()

// ---- Noise helpers ----

// Deterministic hash — shifted by seed so each camp gets different patterns
function h(x: number, y: number, seed = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453
  return n - Math.floor(n)
}

// Value noise with bilinear interpolation — much smoother than raw hash
function vn(x: number, y: number, seed = 0): number {
  const ix = Math.floor(x),
    iy = Math.floor(y)
  const fx = x - ix,
    fy = y - iy
  const ux = fx * fx * (3 - 2 * fx) // smoothstep
  const uy = fy * fy * (3 - 2 * fy)
  const a = h(ix, iy, seed)
  const b = h(ix + 1, iy, seed)
  const c = h(ix, iy + 1, seed)
  const d = h(ix + 1, iy + 1, seed)
  return a + (b - a) * ux + (c - a) * uy + (b - a + d - c - b + a) * ux * uy
}

// Fractal Brownian Motion — 5 octaves for natural-looking noise
function fbm(x: number, y: number, seed = 0, octaves = 5): number {
  let v = 0,
    amp = 0.5,
    freq = 1,
    max = 0
  for (let i = 0; i < octaves; i++) {
    v += vn(x * freq, y * freq, seed + i * 7) * amp
    max += amp
    amp *= 0.5
    freq *= 2.1
  }
  return v / max
}

// ---- Canvas helpers ----

function makeCtx(w: number, ht: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas")
  c.width = w
  c.height = ht
  return [c, c.getContext("2d")!]
}

function toTex(canvas: HTMLCanvasElement, rep = 2): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rep, rep)
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

// Sobel-operator normal map — proper clamped edge handling
function sobelNormal(src: ImageData, W: number, H: number, str = 2): ImageData {
  const out = new ImageData(W, H)
  const g = (px: number, py: number) =>
    src.data[(Math.max(0, Math.min(H - 1, py)) * W + Math.max(0, Math.min(W - 1, px))) * 4] / 255
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx =
        g(x + 1, y - 1) +
        2 * g(x + 1, y) +
        g(x + 1, y + 1) -
        (g(x - 1, y - 1) + 2 * g(x - 1, y) + g(x - 1, y + 1))
      const dy =
        g(x - 1, y + 1) +
        2 * g(x, y + 1) +
        g(x + 1, y + 1) -
        (g(x - 1, y - 1) + 2 * g(x, y - 1) + g(x + 1, y - 1))
      const nx = dx * str,
        ny = dy * str
      const len = Math.sqrt(nx * nx + ny * ny + 1)
      const i = (y * W + x) * 4
      out.data[i] = Math.floor((nx / len) * 127 + 128)
      out.data[i + 1] = Math.floor((ny / len) * 127 + 128)
      out.data[i + 2] = Math.floor((1 / len) * 127 + 128)
      out.data[i + 3] = 255
    }
  }
  return out
}

// ---- BRICK ----
// Realistic English-bond brick with seed-varied color + weathering level
export function makeBrickTex(rep = 2, seed = 0, weathering = 0.5): TexPair {
  const key = `brick:${rep}:${seed}:${weathering}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 512,
    H = 512
  const [c, ctx] = makeCtx(W, H)

  // Mortar — slightly recessed look via darker gap
  ctx.fillStyle = "#221a16"
  ctx.fillRect(0, 0, W, H)

  const bW = 60,
    bH = 24,
    gap = 5
  const rows = Math.ceil(H / (bH + gap)) + 1
  const cols = Math.ceil(W / (bW + gap)) + 2

  for (let r = 0; r < rows; r++) {
    const ox = r % 2 === 0 ? 0 : (bW + gap) / 2
    const y = r * (bH + gap)
    for (let col = -1; col < cols; col++) {
      const x = col * (bW + gap) - ox
      // Per-brick color variation using fbm
      const n = fbm(col * 0.4, r * 0.6, seed)
      const dark = fbm(col * 0.7 + 5, r * 0.9 + 3, seed + 1)
      const rr = Math.floor(75 + n * 35)
      const gg = Math.floor(42 + n * 20)
      const bb = Math.floor(25 + n * 14)
      ctx.fillStyle = `rgb(${rr},${gg},${bb})`
      ctx.fillRect(x + gap / 2, y + gap / 2, bW - 1, bH - 1)

      // Darker surface patch — varies with seed
      if (dark > 0.5) {
        ctx.fillStyle = `rgba(0,0,0,${(dark - 0.5) * 0.5})`
        ctx.fillRect(x + gap / 2, y + gap / 2, (bW - 1) * (dark - 0.3), bH - 1)
      }

      // Moss / bio weathering at lower part of brick — more when weathering high
      const mossChance = 0.6 + weathering * 0.25
      if (h(col * 2, r * 5 + 3, seed) > mossChance) {
        ctx.fillStyle = `rgba(12,30,6,${0.3 + weathering * 0.3})`
        const mh = (bH - 1) * (0.35 + h(col, r + 1, seed) * 0.3)
        ctx.fillRect(x + gap / 2, y + bH - mh, (bW - 1) * 0.7, mh)
      }

      // Salt efflorescence / white staining on upper edge
      if (h(col * 3, r * 2 + 7, seed) > 0.8) {
        ctx.fillStyle = `rgba(210,200,185,${0.08 + h(col, r, seed + 2) * 0.08})`
        ctx.fillRect(x + gap / 2, y + gap / 2, bW - 1, 2)
      }

      // Chipped corner — more chips when weathering high
      if (h(col * 5, r * 3 + 1, seed) > 0.88 - weathering * 0.1) {
        ctx.fillStyle = "#221a16"
        const cs = 2 + h(col, r + 10, seed) * 5
        ctx.fillRect(x + gap / 2, y + gap / 2, cs, cs)
      }
    }
  }

  // Subtle vignette to break up the tiling
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7)
  vg.addColorStop(0, "rgba(0,0,0,0)")
  vg.addColorStop(1, "rgba(0,0,0,0.12)")
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 6.5), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}

// ---- CORRUGATED METAL ----
// Horizontal ridges, seed-placed rust streaks + dents, metallic sheen
export function makeCorrugateTex(rep = 3, seed = 0, weathering = 0.5): TexPair {
  const key = `corrugate:${rep}:${seed}:${weathering}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 256,
    H = 512
  const [c, ctx] = makeCtx(W, H)

  ctx.fillStyle = "#545444"
  ctx.fillRect(0, 0, W, H)

  const ridgeH = 13
  const ridges = Math.ceil(H / ridgeH)

  // Ridge profile — trapezoidal gradient per ridge
  for (let r = 0; r < ridges; r++) {
    const y = r * ridgeH
    const noise = fbm(r * 0.5, 0, seed) * 0.08 // slight per-ridge brightness variation
    const grad = ctx.createLinearGradient(0, y, 0, y + ridgeH)
    grad.addColorStop(
      0,
      `rgba(${140 + Math.floor(noise * 40)},${136 + Math.floor(noise * 38)},${112 + Math.floor(noise * 30)},0.90)`,
    )
    grad.addColorStop(0.18, "rgba(88,84,68,0.92)")
    grad.addColorStop(0.5, "rgba(48,46,36,0.94)")
    grad.addColorStop(0.82, "rgba(68,66,52,0.88)")
    grad.addColorStop(1, "rgba(118,114,92,0.82)")
    ctx.fillStyle = grad
    ctx.fillRect(0, y, W, ridgeH)
  }

  // Rust streaks — flow downward from ridge crests
  const streakCount = Math.floor(18 + weathering * 20)
  for (let i = 0; i < streakCount; i++) {
    const rx = h(i, 0, seed) * W
    const ry = h(i, 1, seed) * H * 0.2
    const rh2 = 20 + h(i, 2, seed) * 90
    const rw2 = 0.8 + h(i, 3, seed) * 5
    const alpha = (0.08 + weathering * 0.2) * (0.5 + h(i, 4, seed) * 0.5)
    const rv = Math.floor(120 + h(i, 5, seed) * 45)
    const gv = Math.floor(32 + h(i, 6, seed) * 24)
    ctx.fillStyle = `rgba(${rv},${gv},8,${alpha})`
    // Taper the streak
    for (let s = 0; s < rh2; s++) {
      const tapW = rw2 * (1 - (s / rh2) * 0.7)
      ctx.fillRect(rx - tapW / 2, ry + s, tapW, 1)
    }
  }

  // Dents / impact marks
  const dentCount = Math.floor(12 + weathering * 18)
  for (let i = 0; i < dentCount; i++) {
    ctx.fillStyle = `rgba(15,14,10,${0.15 + h(i, 20, seed) * 0.4})`
    ctx.beginPath()
    ctx.ellipse(
      h(i, 20, seed) * W,
      h(i, 21, seed) * H,
      2 + h(i, 22, seed) * 12,
      1 + h(i, 23, seed) * 5,
      h(i, 24, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Metallic sheen highlights on ridge crests
  for (let i = 0; i < 14; i++) {
    const hy2 = Math.floor(h(i, 30, seed) * ridges) * ridgeH
    ctx.fillStyle = `rgba(195,190,160,${0.04 + h(i, 31, seed) * 0.07})`
    ctx.fillRect(h(i, 32, seed) * W * 0.6, hy2 + 1, 6 + h(i, 33, seed) * 32, 2)
  }

  // Grime accumulation in ridge valleys
  for (let r = 0; r < ridges; r++) {
    const y = r * ridgeH + ridgeH * 0.45
    ctx.fillStyle = `rgba(5,4,3,${0.08 + fbm(r * 0.8, 0, seed) * 0.12})`
    ctx.fillRect(0, y, W, ridgeH * 0.15)
  }

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 7), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}

// ---- WOOD ----
// Organic grain with fbm, realistic knots with annual rings
export function makeWoodTex(rep = 2, seed = 0, weathering = 0.5): TexPair {
  const key = `wood:${rep}:${seed}:${weathering}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 256,
    H = 512
  const [c, ctx] = makeCtx(W, H)

  ctx.fillStyle = "#342415"
  ctx.fillRect(0, 0, W, H)

  // Base fbm grain texture
  const id = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.025, y * 0.012, seed, 4)
      const i = (y * W + x) * 4
      const v = Math.floor(n * 28)
      id.data[i] = 48 + v
      id.data[i + 1] = 32 + v
      id.data[i + 2] = 16 + Math.floor(v * 0.5)
      id.data[i + 3] = 255
    }
  }
  ctx.putImageData(id, 0, 0)

  // Wavy grain lines
  for (let i = 0; i < 90; i++) {
    const x = h(i, 0, seed) * W
    const lw = 0.3 + h(i, 1, seed) * 1.8
    const isDark = h(i, 2, seed) > 0.45
    const alpha = 0.2 + h(i, 4, seed) * 0.25
    ctx.strokeStyle = isDark ? `rgba(10,5,1,${alpha})` : `rgba(68,48,22,${alpha})`
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(x, 0)
    for (let seg = 0; seg <= H; seg += 6) {
      ctx.lineTo(
        x + Math.sin(seg * 0.036 + i * 0.6) * 3.5 + fbm(i * 0.3, seg * 0.02, seed) * 2,
        seg,
      )
    }
    ctx.stroke()
  }

  // Knots with concentric annual rings
  const knotCount = 2 + Math.floor(h(seed, 0) * 4)
  for (let k = 0; k < knotCount; k++) {
    const kx = h(k, 10, seed) * W
    const ky = h(k, 11, seed) * H
    const kr = 3 + h(k, 12, seed) * 9
    const angle = h(k, 13, seed) * Math.PI
    // Dark core
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 3)
    grad.addColorStop(0, "rgba(8,4,1,0.98)")
    grad.addColorStop(0.25, "rgba(28,15,5,0.75)")
    grad.addColorStop(0.6, "rgba(50,30,10,0.35)")
    grad.addColorStop(1, "rgba(50,30,10,0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(kx, ky, kr, kr * 0.5, angle, 0, Math.PI * 2)
    ctx.fill()
    // Annual rings
    for (let ring = 1; ring <= 5; ring++) {
      const a = Math.max(0, 0.2 - ring * 0.03)
      ctx.strokeStyle = `rgba(14,8,2,${a})`
      ctx.lineWidth = 0.45
      ctx.beginPath()
      ctx.ellipse(kx, ky, kr * (1 + ring * 0.5), kr * (0.5 + ring * 0.3), angle, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // End-grain checks (splits along grain)
  const splitCount = Math.floor(4 + weathering * 8)
  for (let s = 0; s < splitCount; s++) {
    ctx.strokeStyle = `rgba(6,3,1,${0.18 + h(s, 30, seed) * 0.28})`
    ctx.lineWidth = 0.3 + h(s, 31, seed) * 0.8
    ctx.beginPath()
    const sx = h(s, 32, seed) * W
    ctx.moveTo(sx, h(s, 33, seed) * H * 0.2)
    ctx.lineTo(sx + (h(s, 34, seed) - 0.5) * 10, H * (0.5 + h(s, 35, seed) * 0.5))
    ctx.stroke()
  }

  // Weathering/dark staining near edges
  const eg = ctx.createLinearGradient(0, 0, 0, H)
  eg.addColorStop(0, "rgba(0,0,0,0.38)")
  eg.addColorStop(0.06, "rgba(0,0,0,0)")
  eg.addColorStop(0.94, "rgba(0,0,0,0)")
  eg.addColorStop(1, "rgba(0,0,0,0.38)")
  ctx.fillStyle = eg
  ctx.fillRect(0, 0, W, H)

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 2), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}

// ---- CONCRETE ----
// Multi-layer fbm noise, realistic crack network, aggregate pebbles visible
export function makeConcreteTex(rep = 2, seed = 0, weathering = 0.5): TexPair {
  const key = `concrete:${rep}:${seed}:${weathering}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 512,
    H = 512
  const [c, ctx] = makeCtx(W, H)

  // fbm base
  const id = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.015, y * 0.015, seed, 5)
      const i = (y * W + x) * 4
      const v = Math.floor(n * 35)
      id.data[i] = 48 + v
      id.data[i + 1] = 56 + v + 6
      id.data[i + 2] = 40 + v
      id.data[i + 3] = 255
    }
  }
  ctx.putImageData(id, 0, 0)

  // Aggregate — small pebble-like inclusions visible in concrete surface
  for (let a = 0; a < 60; a++) {
    const av = h(a, 0, seed)
    const bright = av > 0.5
    ctx.fillStyle = bright
      ? `rgba(${90 + Math.floor(av * 30)},${100 + Math.floor(av * 28)},${80 + Math.floor(av * 20)},0.55)`
      : `rgba(${28 + Math.floor(av * 20)},${32 + Math.floor(av * 20)},${24 + Math.floor(av * 14)},0.65)`
    ctx.beginPath()
    ctx.ellipse(
      h(a, 1, seed) * W,
      h(a, 2, seed) * H,
      1.5 + h(a, 3, seed) * 4,
      1 + h(a, 4, seed) * 3,
      h(a, 5, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Crack network — more cracks with higher weathering
  const crackCount = Math.floor(6 + weathering * 12)
  for (let cr = 0; cr < crackCount; cr++) {
    const baseAlpha = 0.28 + weathering * 0.35
    ctx.strokeStyle = `rgba(8,10,6,${baseAlpha * (0.6 + h(cr, 40, seed) * 0.4)})`
    ctx.lineWidth = 0.4 + h(cr, 41, seed) * 0.9
    ctx.beginPath()
    let cx2 = h(cr, 42, seed) * W
    let cy2 = h(cr, 43, seed) * H * 0.25
    ctx.moveTo(cx2, cy2)
    // Branch crack pattern
    for (let step = 0; step < 12; step++) {
      cx2 += (h(cr * 3, step, seed) - 0.5) * 24
      cy2 += 8 + h(cr, step + 44, seed) * 22
      ctx.lineTo(cx2, cy2)
      // Occasional branch
      if (h(cr, step + 100, seed) > 0.75 && step > 2) {
        ctx.save()
        ctx.strokeStyle = `rgba(8,10,6,${baseAlpha * 0.5})`
        ctx.lineWidth *= 0.55
        ctx.beginPath()
        ctx.moveTo(cx2, cy2)
        ctx.lineTo(cx2 + (h(cr, step + 50, seed) - 0.5) * 30, cy2 + h(cr, step + 51, seed) * 25)
        ctx.stroke()
        ctx.restore()
      }
    }
    ctx.stroke()
  }

  // Water stains / leaching streaks
  for (let st = 0; st < 16; st++) {
    const a2 = 0.05 + h(st, 60, seed) * 0.14
    ctx.fillStyle = h(st, 61, seed) > 0.5 ? `rgba(0,0,0,${a2})` : `rgba(165,150,90,${a2 * 0.55})`
    ctx.beginPath()
    ctx.ellipse(
      h(st, 62, seed) * W,
      h(st, 63, seed) * H,
      8 + h(st, 64, seed) * 38,
      6 + h(st, 65, seed) * 30,
      h(st, 66, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 3.5), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}

// ---- RUST ----
// Layered oxidation patterns, dark metal showing through
export function makeRustTex(rep = 3, seed = 0, weathering = 0.5): TexPair {
  const key = `rust:${rep}:${seed}:${weathering}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 256,
    H = 256
  const [c, ctx] = makeCtx(W, H)

  // Base fbm rust
  const id = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.05, y * 0.05, seed, 4)
      const i = (y * W + x) * 4
      id.data[i] = Math.floor(88 + n * 92)
      id.data[i + 1] = Math.floor(24 + n * 32)
      id.data[i + 2] = Math.floor(4 + n * 16)
      id.data[i + 3] = 255
    }
  }
  ctx.putImageData(id, 0, 0)

  // Dark base metal showing through — increases with inverse weathering
  const patchCount = Math.floor(14 + (1 - weathering) * 16)
  for (let i = 0; i < patchCount; i++) {
    const alpha = 0.18 + h(i, 70, seed) * 0.52
    ctx.fillStyle = `rgba(18,12,8,${alpha})`
    ctx.beginPath()
    ctx.ellipse(
      h(i, 70, seed) * W,
      h(i, 71, seed) * H,
      3 + h(i, 72, seed) * 22,
      2 + h(i, 73, seed) * 16,
      h(i, 74, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Bright orange/red rust bloom highlights
  const bloomCount = Math.floor(10 + weathering * 15)
  for (let i = 0; i < bloomCount; i++) {
    ctx.fillStyle = `rgba(210,80,15,${0.14 + weathering * 0.2 + h(i, 80, seed) * 0.2})`
    ctx.beginPath()
    ctx.ellipse(
      h(i, 80, seed) * W,
      h(i, 81, seed) * H,
      1.5 + h(i, 82, seed) * 10,
      1 + h(i, 83, seed) * 8,
      h(i, 84, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Gravitational rust streaks
  for (let i = 0; i < 14; i++) {
    const startX = h(i, 90, seed) * W
    const startY = h(i, 91, seed) * H * 0.4
    const len = 15 + h(i, 92, seed) * 50
    const alpha = 0.15 + weathering * 0.2 + h(i, 93, seed) * 0.18
    for (let s = 0; s < len; s++) {
      const sw = (1.2 + h(i, 94, seed) * 2.5) * (1 - (s / len) * 0.65)
      const xOff = Math.sin(s * 0.15 + i) * 1.5
      ctx.fillStyle = `rgba(160,52,10,${alpha * (1 - (s / len) * 0.4)})`
      ctx.fillRect(startX + xOff - sw / 2, startY + s, sw, 1)
    }
  }

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 3), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}

// ---- GROUND ----
// 6-octave fbm terrain with stronger contrast, more pebbles, mud ruts, vegetation patches
export function makeGroundTex(rep = 8, seed = 0, _weathering = 0.5): TexPair {
  const key = `ground:${rep}:${seed}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 512,
    H = 512
  const [c, ctx] = makeCtx(W, H)

  const id = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.022, y * 0.022, seed, 6)
      const n2 = fbm(x * 0.055, y * 0.055, seed + 3, 3)
      const i = (y * W + x) * 4
      const v = Math.floor(n * 38 + n2 * 12)
      id.data[i] = 18 + v
      id.data[i + 1] = 24 + v + 6
      id.data[i + 2] = 10 + v
      id.data[i + 3] = 255
    }
  }
  ctx.putImageData(id, 0, 0)

  // Embedded stones / pebbles of varied sizes
  for (let r = 0; r < 90; r++) {
    const rv = h(r, 90, seed)
    const size = 0.8 + h(r, 95, seed) * 7
    const bright = rv > 0.5
    ctx.fillStyle = bright
      ? `rgba(${42 + Math.floor(rv * 25)},${48 + Math.floor(rv * 24)},${32 + Math.floor(rv * 18)},0.72)`
      : `rgba(${18 + Math.floor(rv * 14)},${22 + Math.floor(rv * 14)},${12 + Math.floor(rv * 10)},0.78)`
    ctx.beginPath()
    ctx.ellipse(
      h(r, 90, seed) * W,
      h(r, 91, seed) * H,
      size,
      size * 0.65,
      h(r, 94, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    // Stone shadow
    ctx.fillStyle = `rgba(0,0,0,${0.12 + rv * 0.1})`
    ctx.beginPath()
    ctx.ellipse(
      h(r, 90, seed) * W + size * 0.3,
      h(r, 91, seed) * H + size * 0.2,
      size * 0.8,
      size * 0.4,
      h(r, 94, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Mud ruts / tire tracks
  for (let t = 0; t < 5; t++) {
    ctx.strokeStyle = `rgba(10,7,4,${0.18 + h(t, 100, seed) * 0.22})`
    ctx.lineWidth = 2 + h(t, 101, seed) * 6
    ctx.beginPath()
    ctx.moveTo(h(t, 102, seed) * W, 0)
    ctx.bezierCurveTo(
      h(t, 103, seed) * W,
      H * 0.35,
      h(t, 104, seed) * W,
      H * 0.65,
      h(t, 105, seed) * W,
      H,
    )
    ctx.stroke()
  }

  // Scattered leaf / debris patches
  for (let d = 0; d < 30; d++) {
    const dv = h(d, 110, seed)
    ctx.fillStyle = `rgba(${30 + Math.floor(dv * 20)},${35 + Math.floor(dv * 18)},${10 + Math.floor(dv * 12)},${0.2 + dv * 0.25})`
    ctx.beginPath()
    ctx.ellipse(
      h(d, 110, seed) * W,
      h(d, 111, seed) * H,
      2 + h(d, 112, seed) * 8,
      1 + h(d, 113, seed) * 4,
      h(d, 114, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 7), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}

// ---- SANDBAG ----
// Burlap weave pattern with dirt, compact variation
export function makeSandbagTex(rep = 4, seed = 0): TexPair {
  const key = `sandbag:${rep}:${seed}`
  const cached = _texCache.get(key)
  if (cached) return cached
  const W = 128,
    H = 128
  const [c, ctx] = makeCtx(W, H)

  const id = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.1, y * 0.1, seed, 3)
      const i = (y * W + x) * 4
      const v = Math.floor(n * 25)
      id.data[i] = 78 + v
      id.data[i + 1] = 70 + v
      id.data[i + 2] = 44 + v
      id.data[i + 3] = 255
    }
  }
  ctx.putImageData(id, 0, 0)

  // Horizontal weave threads
  for (let r = 0; r < H; r += 5) {
    ctx.strokeStyle = `rgba(0,0,0,${0.06 + h(r, 0, seed) * 0.07})`
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(0, r)
    ctx.lineTo(W, r)
    ctx.stroke()
  }
  // Vertical weave threads
  for (let col = 0; col < W; col += 7) {
    ctx.strokeStyle = `rgba(0,0,0,${0.04 + h(col, 1, seed) * 0.04})`
    ctx.lineWidth = 0.4
    ctx.beginPath()
    ctx.moveTo(col, 0)
    ctx.lineTo(col, H)
    ctx.stroke()
  }

  // Dirt / stain patches
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(28,20,8,${0.12 + h(i, 50, seed) * 0.18})`
    ctx.beginPath()
    ctx.ellipse(
      h(i, 50, seed) * W,
      h(i, 51, seed) * H,
      4 + h(i, 52, seed) * 18,
      3 + h(i, 53, seed) * 14,
      h(i, 54, seed) * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  const [nc, nctx] = makeCtx(W, H)
  nctx.putImageData(sobelNormal(ctx.getImageData(0, 0, W, H), W, H, 1.5), 0, 0)
  const result: TexPair = { map: toTex(c, rep), normalMap: toTex(nc, rep) }
  _texCache.set(key, result)
  return result
}
