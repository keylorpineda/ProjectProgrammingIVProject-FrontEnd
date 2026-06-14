import * as THREE from "three"

import { getCampVisuals } from "./campVisuals"
import {
  makeBrickTex,
  makeCorrugateTex,
  makeWoodTex,
  makeConcreteTex,
  makeRustTex,
  makeGroundTex,
  makeSandbagTex,
  type TexPair,
} from "./textureBuilder"

import type { BuildingUserData, SceneHandles, WatchtowerMode } from "../types/scene.types"

/** Factor de escala global del campamento. Exportado para proyección de marcadores. */
export const SCENE_SCALE = 1.4

/**
 * Construye el campamento 3D completo dentro de `scene`, replicando fielmente
 * la escena de camp3d.html (terreno, vallas, edificios, props, luces y
 * partículas). Todo se agrupa bajo un único `THREE.Group` raíz para poder
 * liberarlo de golpe en `dispose()`.
 *
 * No gestiona cámara, controles ni minimapa — eso vive en useThreeScene y en el
 * componente. Sólo expone `animate(t)` (flicker de luces, sweep de focos y
 * partículas) y `dispose()`.
 */
export function buildCampScene(scene: THREE.Scene, campId = "default"): SceneHandles {
  const visuals = getCampVisuals(campId)
  const { seed, weathering } = visuals
  const C = visuals.colors
  const L = visuals.lighting

  // Apply per-camp fog and sky immediately
  scene.fog = new THREE.Fog(C.fog, visuals.fog.near, visuals.fog.far)
  scene.background = new THREE.Color(C.fog)

  const root = new THREE.Group()
  root.name = "camp-root"
  root.scale.setScalar(SCENE_SCALE)
  scene.add(root)
  // Scale fog so it clips at the same relative distance after root scaling
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.near *= SCENE_SCALE
    scene.fog.far *= SCENE_SCALE
  }

  // ---- GEOMETRY CACHE (reuse!) ----
  const GEO: Record<string, THREE.BufferGeometry> = {}
  const gBox = (w: number, h: number, d: number) => {
    const k = `b${w}_${h}_${d}`
    if (!GEO[k]) GEO[k] = new THREE.BoxGeometry(w, h, d)
    return GEO[k]
  }
  const gCyl = (rt: number, rb: number, h: number, s: number) => {
    const k = `c${rt}_${rb}_${h}_${s}`
    if (!GEO[k]) GEO[k] = new THREE.CylinderGeometry(rt, rb, h, s)
    return GEO[k]
  }
  const gSph = (r: number, s: number) => {
    const k = `s${r}_${s}`
    if (!GEO[k]) GEO[k] = new THREE.SphereGeometry(r, s, s)
    return GEO[k]
  }

  const mat = (col: number, em = 0, ei = 0, rg = 0.9, mt = 0) =>
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: em,
      emissiveIntensity: ei,
      roughness: rg,
      metalness: mt,
    })

  const matTex = (tp: TexPair, col: number, em = 0, ei = 0, rg = 0.88, mt = 0, ns = 1.2) =>
    new THREE.MeshStandardMaterial({
      color: col,
      map: tp.map,
      normalMap: tp.normalMap,
      normalScale: new THREE.Vector2(ns, ns),
      emissive: em,
      emissiveIntensity: ei,
      roughness: rg,
      metalness: mt,
    })

  // Procedural textures — seed + weathering make each camp unique
  const TX = {
    brick: makeBrickTex(2, seed, weathering),
    corrugat: makeCorrugateTex(3, seed, weathering),
    wood: makeWoodTex(2, seed, weathering),
    conc: makeConcreteTex(2, seed, weathering),
    rust: makeRustTex(3, seed, weathering),
    ground: makeGroundTex(8, seed, weathering),
    sandbag: makeSandbagTex(4, seed),
  }

  // Pre-built shared mats — colors driven by per-camp theme
  const M = {
    ground: matTex(TX.ground, C.ground, 0, 0, 0.96, 0, 1.6),
    dirt: matTex(TX.ground, C.dirt, 0, 0, 0.98, 0, 1.3),
    mud: mat(C.ground),
    grass: mat(C.grass),
    wood: matTex(TX.wood, C.wood, 0, 0, 0.9, 0, 1.2),
    woodD: matTex(TX.wood, C.woodDark, 0, 0, 0.93, 0, 1.0),
    plank: matTex(TX.wood, C.wood, 0, 0, 0.88, 0, 1.1),
    metal: mat(C.metal, 0, 0, 0.6, 0.7),
    rust: matTex(TX.rust, C.rust, 0, 0, 0.88, 0.18, 1.4),
    rust2: matTex(TX.rust, C.rust, 0, 0, 0.84, 0.12, 1.2),
    brl_g: mat(0x1e3818, 0x002200, 0.08),
    brl_r: mat(0x481808, 0x280000, 0.08),
    brl_y: mat(0x383008, 0x180a00, 0.06),
    tire: mat(0x101010, 0, 0, 1, 0),
    sandbag: matTex(TX.sandbag, 0x524830, 0, 0, 0.92, 0, 1.0),
    corrugat: matTex(TX.corrugat, C.metal, 0, 0, 0.62, 0.38, 2.8),
    corrugD: matTex(TX.corrugat, C.metal, 0, 0, 0.68, 0.32, 2.5),
    brick: matTex(TX.brick, C.brick, 0, 0, 0.84, 0, 2.2),
    chain: mat(C.metal, 0, 0, 0.5, 0.7),
    pipe: mat(C.metal, 0, 0, 0.4, 0.6),
    wireH: mat(0x909070, 0, 0, 0.5, 0.5),
    gravel: mat(C.concrete),
    sign: mat(0x0a0a0a),
    glass: new THREE.MeshStandardMaterial({
      color: 0x334455,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      metalness: 0.4,
    }),
    puddle: new THREE.MeshStandardMaterial({
      color: 0x0e1c10,
      transparent: true,
      opacity: 0.8,
      roughness: 0.01,
      metalness: 0.8,
    }),
    tarp: mat(0x3d3828, 0, 0, 1),
    tarpR: mat(0x3c1010, 0, 0, 1),
    tarpB: mat(0x101c3c, 0, 0, 1),
    medWall: mat(0xb8b8a8),
    redCross: mat(0xcc1111, 0xaa0000, 0.8),
    hqWall: mat(0x303828),
    rope: mat(0x4a4018),
  }
  const glowG = mat(0x44ff44, 0x44ff44, 3.5, 0.1)
  const glowR = mat(0xff3333, 0xff3333, 3.5, 0.1)
  const glowY = mat(0xffbb00, 0xffbb00, 3.5, 0.1)

  // ---- HELPERS ----
  const mk = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    ry = 0,
    rx = 0,
    rz = 0,
  ) => {
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.set(x, y, z)
    if (ry) mesh.rotation.y = ry
    if (rx) mesh.rotation.x = rx
    if (rz) mesh.rotation.z = rz
    mesh.castShadow = true
    mesh.receiveShadow = true
    root.add(mesh)
    return mesh
  }
  const box = (
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x?: number,
    y?: number,
    z?: number,
    ry?: number,
    rx?: number,
    rz?: number,
  ) => mk(gBox(w, h, d), m, x, y, z, ry, rx, rz)
  const cyl = (
    rt: number,
    rb: number,
    h: number,
    s: number,
    m: THREE.Material,
    x?: number,
    y?: number,
    z?: number,
  ) => mk(gCyl(rt, rb, h, s), m, x, y, z)
  const sph = (r: number, s: number, m: THREE.Material, x?: number, y?: number, z?: number) =>
    mk(gSph(r, s), m, x, y, z)
  const pln = (w: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, rz?: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m)
    mesh.rotation.x = -Math.PI / 2
    if (rz) mesh.rotation.z = rz
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    root.add(mesh)
    return mesh
  }
  const ptL = (col: number, i: number, dist: number, x: number, y: number, z: number) => {
    const l = new THREE.PointLight(col, i, dist)
    l.position.set(x, y, z)
    root.add(l)
    return l
  }

  const tmpM = new THREE.Matrix4()

  // ---- GROUND ----
  // Extended outer terrain (visible beyond fence when camera pans)
  pln(180, 160, mat(C.dirt, 0, 0, 0.99), 0, -0.04, 0)
  pln(56, 44, M.ground, 0, 0, 0)
  pln(4, 26, M.gravel, 0, 0.01, -1)
  pln(22, 4, M.gravel, 0, 0.01, 5)
  const dps = [
    [-6, 2, 4, 2.5],
    [-2, -3, 3, 2],
    [8, 1, 4, 2],
    [4, -7, 3, 2],
    [-10, -4, 4, 2.5],
    [12, 4, 3, 2],
    [-4, 8, 3.5, 2],
    [7, -3, 3, 2],
    [3, 10, 4, 2],
    [-8, -9, 3, 2],
    [15, -3, 3, 2],
    [-15, 6, 3, 2],
    [0, -12, 4, 2],
    [6, 11, 3, 2],
  ]
  dps.forEach((p) => pln(p[2], p[3], M.dirt, p[0], 0.011, p[1], Math.random() * Math.PI))
  const mps = [
    [-3, 4, 1.5, 0.8],
    [5, -2, 1, 0.6],
    [0, -7, 1.5, 0.7],
    [-8, 7, 1.2, 0.5],
    [11, -5, 1, 0.5],
    [3, 2, 0.9, 0.6],
  ]
  mps.forEach((p) => pln(p[2], p[3], M.puddle, p[0], 0.016, p[1], Math.random() * Math.PI))
  mps.forEach((p) =>
    pln(p[2] + 0.5, p[3] + 0.4, M.mud, p[0] + 0.2, 0.012, p[1] - 0.2, Math.random() * Math.PI),
  )
  // Grass - instanced (general camp floor)
  const grassGeo = new THREE.PlaneGeometry(0.15, 0.95)
  const grassMat = new THREE.MeshStandardMaterial({
    color: C.grass,
    roughness: 1.0,
    side: THREE.DoubleSide,
  })
  const iGrass = new THREE.InstancedMesh(grassGeo, grassMat, 320)
  iGrass.receiveShadow = true
  for (let gi = 0; gi < 320; gi++) {
    const gx = (Math.random() - 0.5) * 40
    const gz = (Math.random() - 0.5) * 32
    const gy = 0.475 + Math.random() * 0.12
    const sc2 = 0.7 + Math.random() * 0.7
    const lean = (Math.random() - 0.5) * 0.22
    tmpM
      .identity()
      .multiply(new THREE.Matrix4().setPosition(gx, gy * sc2, gz))
      .multiply(new THREE.Matrix4().makeRotationY(Math.random() * Math.PI))
      .multiply(new THREE.Matrix4().makeRotationZ(lean))
      .multiply(new THREE.Matrix4().makeScale(1, sc2, 1))
    iGrass.setMatrixAt(gi, tmpM)
  }
  iGrass.instanceMatrix.needsUpdate = true
  root.add(iGrass)

  // Zone grass patches — denser tufts in each zone area
  const zoneGrassData: [number, number, number, number][] = [
    // [x, z, colorR, colorG]
    // Green zone (0, -5) — lush grass
    [0, -5, 0.22, 0.72],
    [1.2, -4, 0.2, 0.68],
    [-1.0, -6, 0.24, 0.7],
    [0.5, -3.5, 0.18, 0.65],
    [-0.8, -4.5, 0.22, 0.72],
    [1.5, -5.5, 0.2, 0.68],
    [-1.5, -3.8, 0.25, 0.73],
    [0.8, -6.5, 0.19, 0.66],
    // Red zone (-11, -2) — sparse dead grass
    [-11, -2, 0.28, 0.22],
    [-12, -1, 0.26, 0.2],
    [-10, -3, 0.3, 0.24],
    [-11.5, -0.5, 0.27, 0.21],
    [-9.8, -2.5, 0.29, 0.23],
    // Yellow zone (10, 4) — dry yellowish grass
    [10, 4, 0.48, 0.45],
    [11, 3, 0.46, 0.43],
    [9, 5, 0.5, 0.46],
    [10.5, 5.5, 0.47, 0.44],
    [8.8, 3.5, 0.49, 0.45],
  ]
  const zGrassGeo = new THREE.PlaneGeometry(0.16, 1.15)
  const iZGrass = new THREE.InstancedMesh(
    zGrassGeo,
    new THREE.MeshStandardMaterial({
      roughness: 1,
      side: THREE.DoubleSide,
      color: 0x446633,
    }),
    zoneGrassData.length * 5,
  )
  let zgIdx = 0
  zoneGrassData.forEach(([zx, zz, cr, cg]) => {
    const col = new THREE.Color(cr, cg, 0.08)
    for (let k = 0; k < 5; k++) {
      const ox = (Math.random() - 0.5) * 1.6
      const oz = (Math.random() - 0.5) * 1.6
      const sc = 0.7 + Math.random() * 0.75
      const rotation = new THREE.Matrix4().makeRotationY(Math.random() * Math.PI)
      const scale = new THREE.Matrix4().makeScale(sc, sc, sc)
      const pos = new THREE.Matrix4().setPosition(zx + ox, 0.36 * sc, zz + oz)
      tmpM.identity().multiply(pos).multiply(rotation).multiply(scale)
      iZGrass.setMatrixAt(zgIdx, tmpM)
      iZGrass.setColorAt(zgIdx, col)
      zgIdx++
    }
  })
  iZGrass.count = zgIdx
  iZGrass.instanceMatrix.needsUpdate = true
  if (iZGrass.instanceColor) iZGrass.instanceColor.needsUpdate = true
  root.add(iZGrass)

  // ---- PERIMETER FENCE ----
  const postGeo = gCyl(0.09, 0.11, 3.1, 6)
  const postPositions: number[][] = []
  for (let px = -19; px <= 19; px += 2.1) postPositions.push([px, -15])
  for (let pz = -14; pz <= 14; pz += 2.1) {
    postPositions.push([-19, pz])
    postPositions.push([19, pz])
  }
  for (let px2 = -19; px2 <= -5; px2 += 2.1) postPositions.push([px2, 14])
  for (let px3 = 5; px3 <= 19; px3 += 2.1) postPositions.push([px3, 14])
  const iPosts = new THREE.InstancedMesh(postGeo, M.wood, postPositions.length)
  postPositions.forEach((p, i) => {
    tmpM.identity()
    tmpM.setPosition(p[0], 1.55, p[1])
    iPosts.setMatrixAt(i, tmpM)
  })
  iPosts.instanceMatrix.needsUpdate = true
  iPosts.castShadow = true
  root.add(iPosts)

  // Fence boards
  box(40, 2.8, 0.25, M.plank, 0, 1.4, -15)
  box(0.25, 2.8, 30, M.plank, -19, 1.4, 0)
  box(0.25, 2.8, 30, M.plank, 19, 1.4, 0)
  box(14, 2.8, 0.25, M.plank, -12, 1.4, 14)
  box(14, 2.8, 0.25, M.plank, 12, 1.4, 14)
  // rails
  box(40, 0.1, 0.1, M.wood, 0, 2.7, -15)
  box(40, 0.1, 0.1, M.wood, 0, 0.7, -15)
  box(0.1, 0.1, 30, M.wood, -19, 2.7, 0)
  box(0.1, 0.1, 30, M.wood, 19, 2.7, 0)
  // Gate
  cyl(0.22, 0.24, 3.8, 8, M.woodD, -5, 1.9, 14)
  cyl(0.22, 0.24, 3.8, 8, M.woodD, 5, 1.9, 14)
  box(10.6, 0.16, 0.2, M.wood, 0, 3.8, 14) // portón de valla (decorativo)
  // barbed wire
  box(40, 0.03, 0.03, M.wireH, 0, 3.05, -15)
  box(0.03, 0.03, 30, M.wireH, -19, 3.05, 0)
  box(0.03, 0.03, 30, M.wireH, 19, 3.05, 0)

  // ---- BG CITY BUILDINGS ----
  box(13, 9, 6, M.brick, -12, 4.5, -20.5)
  box(14, 12, 6, mat(0x5a4535), 13, 6, -20.5)
  box(8, 7.5, 5, mat(0x4a3a2a), 0, 3.75, -19)
  const winL = [
    [-17, 5],
    [-14, 5],
    [-11, 5],
    [-8, 5],
    [-17, 7.5],
    [-14, 7.5],
  ]
  winL.forEach((w) => {
    const lit = Math.random() > 0.4
    if (lit) box(1.3, 1.5, 0.1, mat(0xffcc66, 0xffaa33, 1.2, 0.1), w[0], w[1], -16.5)
    else box(1.3, 1.5, 0.1, M.glass, w[0], w[1], -16.5)
  })
  const winR = [
    [9, 5],
    [12, 5],
    [15, 5],
    [18, 5],
    [9, 8],
    [12, 8],
    [15, 8],
    [18, 8],
    [9, 10.5],
  ]
  winR.forEach((w) => {
    const lit = Math.random() > 0.5
    if (lit) box(1.3, 1.5, 0.1, mat(0xddeebb, 0xbbdd88, 0.8, 0.1), w[0], w[1], -16.5)
    else box(1.3, 1.5, 0.1, M.glass, w[0], w[1], -16.5)
  })
  box(13, 0.35, 6, mat(0x1c1c1a), -12, 9.2, -20.5)
  box(14, 0.35, 6, mat(0x1c1c1a), 13, 12.2, -20.5)
  for (let ci = 0; ci < 3; ci++) cyl(0.13, 0.15, 1.8, 6, M.pipe, -15 + ci * 2, 10, -20.5)
  for (let ci2 = 0; ci2 < 3; ci2++) cyl(0.14, 0.16, 2.2, 6, M.pipe, 10 + ci2 * 2.5, 12.6, -20.5)

  // ---- CAMP STRUCTURES ----

  // 1. ALMACÉN + DEPÓSITO DE COMBUSTIBLE (Paso 05 — Recursos, estilo TLoU2)
  // Nave industrial de chapa corrugada con el depósito de combustible adosado
  // lateralmente: tanques cilíndricos exteriores con tubos de venteo, valla de
  // cadena, letreros FUEL, pallets, barriles y tuberías en la zona de carga.
  // La luz roja de alerta (intensity 0) la enciende el paso de datos reactivos
  // cuando inventory.alert_active.
  const whRoof = matTex(TX.corrugat, C.metal, 0, 0, 0.68, 0.38, 1.5)
  const whDoor = matTex(TX.corrugat, C.metal, 0, 0, 0.55, 0.62, 1.2)
  const whTank = matTex(TX.rust, C.rust, 0, 0, 0.86, 0.15, 1.4)
  const whFence = mat(0x383840, 0, 0, 0.55, 0.65)
  const whSign = mat(0xffdd00, 0xffdd00, 0.8)

  const WHX = -13
  const WHZ = 4
  const warehouseMesh = box(10, 4, 6, M.corrugat, WHX, 2, WHZ)
  box(10.2, 0.15, 6.2, whRoof, WHX, 4.1, WHZ, 0, 0, 0.04)
  // Puerta corredera grande de metal + ventanas altas (estantería visible).
  box(3, 3.4, 0.15, whDoor, WHX, 1.7, WHZ + 3.05)
  for (let wvi = 0; wvi < 4; wvi++)
    box(1.2, 1.0, 0.12, M.glass, WHX - 3.6 + wvi * 2.4, 3.1, WHZ + 3.04)
  box(1.5, 2.0, 0.04, M.woodD, WHX + 1.2, 2.4, WHZ + 2.7)
  // Depósito de combustible adosado lateral + tanques con tubos de venteo.
  box(4, 3.5, 3.5, whTank, WHX + 7, 1.75, WHZ)
  box(4.2, 0.12, 3.7, whRoof, WHX + 7, 3.56, WHZ)
  cyl(0.8, 0.85, 2.2, 10, whTank, WHX + 8, 1.1, WHZ + 3)
  cyl(0.8, 0.85, 2.2, 10, whTank, WHX + 6.2, 1.1, WHZ + 3.3)
  cyl(0.06, 0.08, 2.5, 6, M.pipe, WHX + 8, 2.6, WHZ + 3)
  cyl(0.06, 0.08, 2.5, 6, M.pipe, WHX + 6.2, 2.6, WHZ + 3.3)
  // Valla de cadena alrededor del depósito + letreros de peligro FUEL.
  box(4.5, 1.8, 0.08, whFence, WHX + 7, 0.9, WHZ + 4.3)
  box(0.08, 1.8, 3.5, whFence, WHX + 9.2, 0.9, WHZ + 2.5)
  box(0.3, 0.4, 0.06, whSign, WHX + 6.2, 1.2, WHZ + 4.35)
  box(0.3, 0.4, 0.06, whSign, WHX + 8, 1.2, WHZ + 4.35)
  // Zona de carga: pallets, barriles apilados y tuberías en el suelo.
  box(0.95, 0.15, 0.95, M.plank, WHX - 0.8, 0.08, WHZ + 4.2)
  box(0.95, 0.15, 0.95, M.plank, WHX + 0.4, 0.08, WHZ + 4.5)
  box(0.95, 0.15, 0.95, M.plank, WHX - 0.2, 0.23, WHZ + 4.3)
  box(0.95, 0.15, 0.95, M.plank, WHX - 2, 0.08, WHZ + 4.0)
  cyl(0.35, 0.37, 0.92, 8, M.brl_g, WHX - 3.6, 0.46, WHZ + 3.8)
  cyl(0.35, 0.37, 0.92, 8, M.brl_g, WHX - 4.3, 0.46, WHZ + 3.6)
  cyl(0.35, 0.37, 0.92, 8, M.brl_r, WHX - 3.9, 0.46, WHZ + 4.5)
  cyl(0.35, 0.37, 0.92, 8, M.brl_r, WHX - 4.5, 0.46, WHZ + 4.4)
  cyl(0.35, 0.37, 0.92, 8, M.brl_g, WHX - 4.0, 1.38, WHZ + 4.1)
  cyl(0.35, 0.37, 0.92, 8, M.brl_y, WHX - 3.2, 0.46, WHZ + 4.3)
  box(8, 0.07, 0.07, M.pipe, WHX + 1, 0.05, WHZ + 3.6)
  box(7, 0.07, 0.07, M.pipe, WHX - 1, 0.05, WHZ + 3.32)
  // Escombros en la zona de carga.
  for (let wdi = 0; wdi < 4; wdi++)
    box(
      0.12,
      0.1,
      0.12,
      M.gravel,
      WHX - 3 + Math.random() * 6,
      0.05,
      WHZ + 3.4 + Math.random(),
      Math.random() * Math.PI,
    )
  // Luces: interior cálida, depósito tenue y alerta roja (apagada por defecto).
  const whLight = ptL(0xffcc88, 3.0, 12, WHX, 2.5, WHZ)
  ptL(0x332200, 0.6, 5, WHX + 7, 2, WHZ)
  const whAlertLight = ptL(0xff2200, 0, 10, WHX, 5, WHZ)

  // 2. CUARTEL GENERAL (Paso 01 — Dashboard, estilo TLoU2)
  // Edificio principal de 2 pisos en concreto envejecido, torre de ladrillo en
  // la esquina, sacos de arena perimetrales, antena de radio, mástil con bandera
  // destenida y generador ruidoso afuera. Paleta post-apocalíptica TLoU2.
  const cgConcrete = matTex(TX.conc, C.concrete, 0, 0, 0.86, 0, 1.3)
  const cgBrick = matTex(TX.brick, C.brick, 0, 0, 0.84, 0, 1.5)
  const cgRoof = matTex(TX.corrugat, C.metal, 0, 0, 0.9, 0.08, 1.0)
  const cgDoor = mat(0x2a2a30, 0, 0, 0.6, 0.7) // puerta reforzada de metal
  const cgGenMat = mat(0x404040, 0, 0, 0.55, 0.5) // generador
  const cgCable = mat(0x1a1a1a, 0, 0, 0.8, 0.3) // cables
  const cgMoss = mat(0x2d3d1a, 0, 0, 1, 0) // musgo reconquistando las paredes
  const cgWinLit = new THREE.MeshStandardMaterial({
    color: 0xff9944,
    emissive: 0xff9944,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.9,
    roughness: 0.3,
  })

  const CGX = 0
  const CGZ = -10
  // Cuerpo principal (2 pisos) + techo plano con bordillo.
  const hqMesh = box(8, 4.5, 6, cgConcrete, CGX, 2.25, CGZ)
  box(8.2, 0.2, 6.2, cgRoof, CGX, 4.6, CGZ)
  box(8.4, 0.25, 0.18, cgRoof, CGX, 4.7, CGZ - 3.1) // bordillo trasero
  box(8.4, 0.25, 0.18, cgRoof, CGX, 4.7, CGZ + 3.1) // bordillo frontal
  // Extensión lateral izquierda (sala de mapas).
  box(4, 2.5, 0.15, cgConcrete, CGX - 4.05, 1.25, CGZ, Math.PI / 2)
  box(4.1, 0.15, 0.2, cgRoof, CGX - 4.05, 2.55, CGZ, Math.PI / 2)
  // Torre de ladrillo en la esquina frontal derecha.
  box(2.2, 3.8, 2.2, cgBrick, CGX + 3.4, 1.9, CGZ + 1.9)
  box(2.35, 0.2, 2.35, cgRoof, CGX + 3.4, 3.9, CGZ + 1.9)

  // Puerta reforzada de metal (frente).
  box(1.2, 2.4, 0.15, cgDoor, CGX, 1.2, CGZ + 3.02)
  // Ventanas (6): 3 iluminadas (#ff9944) y 3 tapiadas (vidrio oscuro).
  const cgWindows: [number, number, boolean][] = [
    [-2.6, 1.6, true],
    [-2.6, 3.3, false],
    [2.0, 1.6, false],
    [2.0, 3.3, true],
    [-0.3, 3.3, true],
    [1.1, 1.6, false],
  ]
  cgWindows.forEach(([wx, wy, lit]) =>
    box(1.0, 0.9, 0.12, lit ? cgWinLit : M.glass, CGX + wx, wy, CGZ + 3.0),
  )

  // Sacos de arena perimetrales en el frente (8 + segunda fila parcial).
  for (let sgi = 0; sgi < 8; sgi++)
    box(0.7, 0.28, 0.4, M.sandbag, CGX - 2.45 + sgi * 0.72, 0.14, CGZ + 3.45)
  for (let sgi = 0; sgi < 5; sgi++)
    box(0.7, 0.28, 0.4, M.sandbag, CGX - 1.45 + sgi * 0.72, 0.42, CGZ + 3.45)

  // Mástil con bandera destenida (la bandera oscila al entrar a la vista 3D).
  cyl(0.04, 0.04, 5, 6, M.metal, CGX - 3, 7.1, CGZ)
  const cgFlag = box(1.4, 0.07, 0.8, mat(0x223388, 0x112266, 0.1), CGX - 2.25, 9.1, CGZ)
  // Antena de radio (x3) en la azotea.
  cyl(0.04, 0.04, 2.5, 5, M.metal, CGX + 2.6, 5.95, CGZ - 1.2)
  cyl(0.04, 0.04, 2.5, 5, M.metal, CGX + 3.1, 5.95, CGZ - 1.4)
  cyl(0.04, 0.04, 2.5, 5, M.metal, CGX + 2.1, 5.95, CGZ - 1.4)
  box(0.7, 0.08, 0.08, M.metal, CGX + 2.6, 6.9, CGZ - 1.2)
  // Alambre de púas en la azotea (postes + tramos).
  for (let wpi = 0; wpi < 4; wpi++)
    box(0.12, 0.5, 0.12, M.metal, CGX - 3.6 + wpi * 2.4, 4.95, CGZ - 3)
  box(7.6, 0.03, 0.03, M.wireH, CGX, 5.15, CGZ - 3)

  // Generador exterior ruidoso (vibra levemente) con tubo de escape y cables.
  const cgGenBaseY = 0.43
  const cgGenerator = box(1.4, 0.85, 0.9, cgGenMat, CGX - 5.6, cgGenBaseY, CGZ + 2.8)
  cyl(0.06, 0.08, 1.2, 6, M.rust, CGX - 5.0, 1.1, CGZ + 2.8)
  box(0.05, 0.05, 3, cgCable, CGX - 5.0, 1.4, CGZ + 1.6)

  // Musgo trepando por las fachadas.
  const cgMossSpots: [number, number, number][] = [
    [-3.9, 1.2, CGZ + 1.5],
    [-3.9, 2.4, CGZ - 1.2],
    [3.95, 1.6, CGZ - 0.5],
    [-1.2, 0.6, CGZ + 3.02],
    [1.8, 0.5, CGZ + 3.02],
    [4.5, 1.0, CGZ + 1.9],
  ]
  cgMossSpots.forEach(([mx, my, mz]) => box(0.04, 0.6, 0.04, cgMoss, mx, my, mz))
  // Escombros rotados en el suelo cerca del edificio.
  for (let dbi = 0; dbi < 5; dbi++)
    box(
      0.15,
      0.12,
      0.12,
      M.gravel,
      CGX - 3 + Math.random() * 6,
      0.06,
      CGZ + 3.5 + Math.random() * 1.2,
      Math.random() * Math.PI,
    )

  // Iluminación: foco interior cálido + foco exterior tenue.
  const cgInteriorLight = ptL(0xff9944, 2.5, 10, CGX, 2.5, CGZ)
  ptL(0x334422, 0.6, 6, CGX, 3, CGZ + 4)

  // 9. GARITA DEL GUARDIA (Paso 02 — Admisiones, estilo TLoU2)
  // Caseta de control en la entrada principal: madera con chapa oxidada,
  // ventana deslizable para revisar documentos, barrera vehicular abatible y
  // lámpara de emergencia. La barrera y la lámpara reaccionan a admisiones
  // PENDING en el paso de datos reactivos; aquí queda la geometría base.
  const gtWood = matTex(TX.wood, C.wood, 0, 0, 0.9, 0, 1.2)
  const gtRoof = matTex(TX.rust, C.rust, 0, 0, 0.88, 0.15, 1.3)
  const gtBarrier = matTex(TX.rust, C.rust, 0, 0, 0.88, 0.22, 1.2)
  const gtSign = mat(0xcc1111, 0xcc1111, 0.3)
  const gtStripe = mat(0xffcc00, 0xffcc00, 0.3)
  const gtChair = mat(0x404040, 0, 0, 0.9, 0.3)

  const GTX = -6
  const GTZ = 12.5
  // === PORTÓN DE ADMISIONES — checkpoint principal de entrada ===
  // Edificio de caseta ampliado (2.8 x 3.2) con arquería central
  const gateMesh = box(2.8, 3.0, 2.4, gtWood, GTX, 1.5, GTZ)
  box(3.0, 0.18, 2.6, gtRoof, GTX, 3.12, GTZ, 0, 0, 0.07)
  // Extensión trasera (sala de procesamiento)
  box(1.6, 2.2, 1.5, matTex(TX.conc, C.concrete, 0, 0, 0.9), GTX - 1.8, 1.1, GTZ - 0.6)
  box(1.65, 0.14, 1.55, gtRoof, GTX - 1.8, 2.25, GTZ - 0.6)
  // Ventana ancha hacia el carril de acceso
  box(1.0, 0.7, 0.1, M.glass, GTX + 1.41, 1.8, GTZ, Math.PI / 2)
  box(0.8, 0.55, 0.08, M.glass, GTX - 0.2, 2.2, GTZ - 0.6, Math.PI / 2)
  // Puerta doble frontal reforzada
  box(0.9, 2.4, 0.1, mat(0x282828, 0, 0, 0.6, 0.5), GTX - 0.5, 1.2, GTZ + 1.21)
  box(0.9, 2.4, 0.1, mat(0x282828, 0, 0, 0.6, 0.5), GTX + 0.5, 1.2, GTZ + 1.21)
  box(0.08, 2.4, 0.12, mat(0xcc9900, 0, 0, 0.5, 0.5), GTX, 1.2, GTZ + 1.21)
  // Marco decorativo de la puerta
  box(2.0, 0.22, 0.12, matTex(TX.conc, C.concrete, 0, 0, 0.88), GTX, 2.52, GTZ + 1.21)
  box(0.2, 2.56, 0.12, matTex(TX.conc, C.concrete, 0, 0, 0.88), GTX - 1.0, 1.24, GTZ + 1.21)
  box(0.2, 2.56, 0.12, matTex(TX.conc, C.concrete, 0, 0, 0.88), GTX + 1.0, 1.24, GTZ + 1.21)
  // Letrero ADMISIONES sobre la puerta (grande, iluminado)
  box(2.8, 0.65, 0.1, mat(0x0a0804, 0, 0, 0.98), GTX, 3.4, GTZ + 1.2)
  box(2.65, 0.5, 0.08, mat(0xdd8800, 0xcc6600, 0.55), GTX, 3.4, GTZ + 1.2)
  box(2.4, 0.08, 0.08, mat(0xffaa00, 0xffaa00, 1.8), GTX, 3.07, GTZ + 1.2)
  box(2.4, 0.08, 0.08, mat(0xffaa00, 0xffaa00, 1.8), GTX, 3.73, GTZ + 1.2)
  ptL(0xffcc44, 2.5, 7, GTX, 3.5, GTZ + 1.1)
  // Tablilla de registro y silla
  box(0.55, 0.55, 0.05, gtWood, GTX - 1.38, 1.7, GTZ, Math.PI / 2)
  box(0.4, 0.7, 0.4, gtChair, GTX + 0.4, 0.35, GTZ - 0.3)
  // Letreros de advertencia
  box(0.35, 0.45, 0.07, gtSign, GTX, 2.3, GTZ + 1.22)
  box(0.35, 0.45, 0.07, gtSign, GTX + 1.42, 1.2, GTZ - 0.4, Math.PI / 2)

  // EDIFICIO DE ADMISIONES CENTRAL — visible desde la entrada, 2 pisos
  const AHX = 0,
    AHZ = 8
  const ahConc = matTex(TX.conc, C.concrete, 0, 0, 0.88, 0, 1.8)
  const ahBrick = matTex(TX.brick, C.brick, 0, 0, 0.85, 0, 2.0)
  const ahRoof = matTex(TX.corrugat, C.metal, 0, 0, 0.7, 0.32, 2.2)
  // Cuerpo principal 2 pisos
  box(11, 5.8, 6.5, ahConc, AHX, 2.9, AHZ)
  // Franja de ladrillo en base
  box(11.1, 1.4, 6.6, ahBrick, AHX, 0.7, AHZ)
  // Techo plano con pretil
  box(11.4, 0.35, 6.8, ahRoof, AHX, 5.88, AHZ)
  box(11.4, 0.7, 0.28, ahConc, AHX, 6.23, AHZ + 3.4)
  box(11.4, 0.7, 0.28, ahConc, AHX, 6.23, AHZ - 3.4)
  box(0.28, 0.7, 6.8, ahConc, AHX - 5.7, 6.23, AHZ)
  box(0.28, 0.7, 6.8, ahConc, AHX + 5.7, 6.23, AHZ)
  // Torre de observación encima
  box(4.5, 2.8, 3.5, ahConc, AHX, 7.5, AHZ)
  box(4.8, 0.28, 3.8, ahRoof, AHX, 9.04, AHZ)
  box(4.8, 0.55, 0.22, ahConc, AHX, 9.35, AHZ + 1.9)
  box(4.8, 0.55, 0.22, ahConc, AHX, 9.35, AHZ - 1.9)
  box(0.22, 0.55, 3.8, ahConc, AHX - 2.4, 9.35, AHZ)
  box(0.22, 0.55, 3.8, ahConc, AHX + 2.4, 9.35, AHZ)
  // Ventanas planta baja (4 ventanales)
  for (let wi = 0; wi < 4; wi++) {
    box(1.6, 1.2, 0.1, M.glass, AHX - 3.9 + wi * 2.6, 2.1, AHZ + 3.3)
    box(1.6, 0.06, 0.12, mat(0x505040, 0, 0, 0.5, 0.4), AHX - 3.9 + wi * 2.6, 2.75, AHZ + 3.3)
  }
  // Ventanas 2do piso
  for (let wi2 = 0; wi2 < 5; wi2++)
    box(1.2, 1.0, 0.1, M.glass, AHX - 4.5 + wi2 * 2.2, 4.5, AHZ + 3.3)
  // Ventanas torre
  box(1.8, 1.2, 0.1, M.glass, AHX, 7.5, AHZ + 1.76)
  box(1.8, 1.2, 0.1, M.glass, AHX - 2.26, 7.5, AHZ)
  box(1.8, 1.2, 0.1, M.glass, AHX + 2.26, 7.5, AHZ)
  // Puerta principal doble
  box(2.2, 2.8, 0.12, mat(0x282828, 0, 0, 0.6, 0.5), AHX - 0.55, 1.4, AHZ + 3.3)
  box(2.2, 2.8, 0.12, mat(0x282828, 0, 0, 0.6, 0.5), AHX + 0.55, 1.4, AHZ + 3.3)
  box(4.6, 0.28, 0.14, ahConc, AHX, 2.94, AHZ + 3.3)
  // LETRERO ADMISIONES — grande, iluminado
  box(10.5, 2.0, 0.15, mat(0x080706, 0, 0, 0.98), AHX, 5.1, AHZ + 3.35)
  box(10.1, 1.62, 0.1, mat(0xcc7700, 0xaa5500, 0.55), AHX, 5.1, AHZ + 3.35)
  box(9.7, 0.1, 0.06, mat(0xff9900, 0xff7700, 3.5), AHX, 4.15, AHZ + 3.35)
  box(9.7, 0.1, 0.06, mat(0xff9900, 0xff7700, 3.5), AHX, 6.05, AHZ + 3.35)
  // Luces del edificio (iluminan la fachada)
  ptL(0xffdd88, 7.0, 22, AHX - 4, 7.5, AHZ + 6)
  ptL(0xffdd88, 7.0, 22, AHX + 4, 7.5, AHZ + 6)
  ptL(0xffaa44, 4.5, 14, AHX, 6.0, AHZ + 4)
  // Focos en pretil
  sph(0.13, 6, mat(0xffee88, 0xffcc44, 4.5), AHX - 4.5, 6.45, AHZ + 3.4)
  sph(0.13, 6, mat(0xffee88, 0xffcc44, 4.5), AHX + 4.5, 6.45, AHZ + 3.4)
  sph(0.13, 6, mat(0xffee88, 0xffcc44, 4.5), AHX, 6.45, AHZ + 3.4)
  // Cámaras de seguridad en esquinas
  box(0.18, 0.12, 0.32, mat(C.metal, 0, 0, 0.5, 0.65), AHX - 5.6, 5.5, AHZ + 3.45, -0.35)
  box(0.18, 0.12, 0.32, mat(C.metal, 0, 0, 0.5, 0.65), AHX + 5.6, 5.5, AHZ + 3.45, 0.35)

  // Barrera vehicular abatible (más robusta)
  cyl(0.07, 0.09, 3.0, 8, gtBarrier, GTX + 2.5, 1.5, GTZ + 0.4)
  cyl(0.07, 0.09, 2.2, 8, gtBarrier, GTX + 4.8, 1.1, GTZ + 0.4)
  const gtBarrierArm = new THREE.Group()
  gtBarrierArm.position.set(GTX + 2.5, 2.6, GTZ + 0.4)
  const gtArm = new THREE.Mesh(gBox(4.0, 0.1, 0.12), gtBarrier)
  gtArm.position.x = 2.0
  gtArm.castShadow = true
  gtBarrierArm.add(gtArm)
  for (let gsi = 0; gsi < 4; gsi++) {
    const stripe = new THREE.Mesh(gBox(0.6, 0.105, 0.125), gtStripe)
    stripe.position.x = 0.5 + gsi * 0.95
    gtBarrierArm.add(stripe)
  }
  root.add(gtBarrierArm)
  // Luz de semáforo en el poste de la barrera
  sph(0.1, 7, mat(0xff2200, 0xff0000, 4.0), GTX + 2.5, 2.85, GTZ + 0.35)

  // Lámpara de emergencia interior
  cyl(0.04, 0.04, 0.8, 5, M.metal, GTX, 2.5, GTZ)
  sph(0.12, 7, mat(0xff9933, 0xff9933, 3.5), GTX, 2.2, GTZ)
  const gtLamp = ptL(0xffaa44, 3.0, 8, GTX, 2.3, GTZ)

  // Muro de sacos de arena + concreto reforzado en el frente
  for (let sb = 0; sb < 8; sb++)
    box(0.65, 0.28, 0.4, M.sandbag, GTX - 2.8 + sb * 0.72, 0.14, GTZ + 2.0)
  for (let sb = 0; sb < 6; sb++)
    box(0.65, 0.28, 0.4, M.sandbag, GTX - 1.8 + sb * 0.72, 0.42, GTZ + 2.0)
  box(5.8, 0.2, 0.3, matTex(TX.conc, C.concrete, 0, 0, 0.9), GTX + 0.1, 0.68, GTZ + 2.0)
  // Cámaras de seguridad en el arco
  box(0.15, 0.1, 0.28, mat(C.metal, 0, 0, 0.5, 0.65), GTX + 3.95, 5.1, GTZ + 0.55, 0.3)
  box(0.15, 0.1, 0.28, mat(C.metal, 0, 0, 0.5, 0.65), GTX - 1.15, 5.1, GTZ + 0.55, -0.3)
  // Musgo y escombros
  box(0.04, 0.5, 0.04, cgMoss, GTX - 1.38, 1.2, GTZ + 0.5)
  box(0.04, 0.5, 0.04, cgMoss, GTX + 1.4, 1.4, GTZ - 0.45)
  for (let gdi = 0; gdi < 3; gdi++)
    box(0.1, 0.08, 0.08, M.gravel, GTX + 2 + gdi * 0.9, 0.05, GTZ + 1.0, gdi * 0.7)

  // 3. ARMERÍA — Edificio grande de armamento (Paso 07: locker soldado)
  box(8, 5, 6.5, M.corrugat, 12, 2.5, 0.8)
  box(4, 4.5, 5, M.brick, 12, 2.25, -4.2)
  box(8.5, 0.16, 7, M.corrugD, 12, 5.1, 0.8, 0, 0, 0.04)
  box(4.3, 0.16, 5.3, M.corrugD, 12, 4.58, -4.2, 0, 0, -0.03)
  box(0.16, 5, 0.16, M.metal, 8.9, 2.5, 4.1)
  box(0.16, 5, 0.16, M.metal, 15.1, 2.5, 4.1)
  box(0.16, 5, 0.16, M.metal, 8.9, 2.5, -2.45)
  box(0.16, 5, 0.16, M.metal, 15.1, 2.5, -2.45)
  box(1.05, 3.6, 0.1, mat(0x282820, 0, 0, 0.62, 0.55), 11.4, 1.8, 4.07)
  box(1.05, 3.6, 0.1, mat(0x282820, 0, 0, 0.62, 0.55), 12.6, 1.8, 4.07)
  box(2.3, 0.12, 0.1, mat(0x3a3a30, 0, 0, 0.6, 0.5), 12, 3.7, 4.07)
  box(3.2, 0.54, 0.08, mat(0x0a0a08, 0, 0, 0.98), 12, 4.55, 4.08)
  box(3.0, 0.4, 0.07, mat(0x993300, 0xcc4400, 0.72), 12, 4.55, 4.08)
  box(2.8, 0.06, 0.07, mat(0xdd5500, 0xdd5500, 2.2), 12, 4.3, 4.08)
  box(2.8, 0.06, 0.07, mat(0xdd5500, 0xdd5500, 2.2), 12, 4.78, 4.08)
  box(1.2, 0.82, 0.08, M.glass, 9.6, 3.3, 4.06)
  box(1.2, 0.82, 0.08, M.glass, 14.4, 3.3, 4.06)
  box(1.0, 0.7, 0.08, M.glass, 9.6, 1.9, 4.06)
  box(1.0, 0.7, 0.08, M.glass, 14.4, 1.9, 4.06)
  ptL(0xffaa55, 1.8, 14, 12, 2.8, 0.5)
  for (let sb = 0; sb < 6; sb++) box(0.95, 0.44, 0.44, M.sandbag, 9.2 + sb * 0.96, 0.22, 5.1)
  for (let sb = 0; sb < 6; sb++) box(0.95, 0.44, 0.44, M.sandbag, 9.2 + sb * 0.96, 0.66, 5.1)
  box(0.9, 0.9, 0.9, M.plank, 9.0, 0.45, 4.9)
  box(0.9, 0.9, 0.9, M.plank, 9.0, 1.35, 4.9)
  box(0.9, 0.9, 0.9, M.plank, 9.9, 0.45, 4.9)
  cyl(0.35, 0.36, 0.92, 8, M.brl_g, 15.2, 0.46, 4.9)
  cyl(0.35, 0.36, 0.92, 8, M.brl_r, 15.2, 0.46, 3.9)
  cyl(0.35, 0.36, 0.92, 8, M.brl_y, 14.3, 0.46, 4.5)
  box(0.08, 1.8, 0.08, M.metal, 15.8, 0.9, 1.8)
  box(0.08, 1.8, 0.08, M.metal, 15.8, 0.9, -0.8)
  box(0.06, 0.06, 3.0, M.metal, 15.8, 1.2, 0.5)
  box(0.06, 0.06, 3.0, M.metal, 15.8, 0.6, 0.5)

  // 4. TORRE DE VIGILANCIA (Paso 04 — Exploraciones, estilo TLoU2)
  // Torre de madera reforzada de ~6.5m: 4 postes inclinados, plataforma con
  // parapetos y sacos, techo inclinado, escalera de mano, reflector articulado
  // (spot1: hace sweep en reposo y sigue a las figuras de la exploración),
  // cuerdas tensadas, bitácora y binoculares en la plataforma.
  const wtPost = matTex(TX.wood, C.wood, 0, 0, 0.9, 0, 1.2)
  const wtPlat = matTex(TX.wood, C.woodDark, 0, 0, 0.93, 0, 1.0)
  const wtRoofM = matTex(TX.wood, C.wood, 0, 0, 0.9, 0, 1.1)
  const wtParap = matTex(TX.wood, C.woodDark, 0, 0, 0.91, 0, 1.1)
  const wtRefl = mat(0x383840, 0, 0, 0.5, 0.6)
  const wtRope = mat(0x4a4018, 0, 0, 0.9, 0)

  const WTX = -17
  const WTZ = 11
  const wtLegs: [number, number, number, number][] = [
    [WTX - 1.25, WTZ - 1.25, 0.03, -0.03],
    [WTX + 1.25, WTZ - 1.25, 0.03, 0.03],
    [WTX - 1.25, WTZ + 1.25, -0.03, -0.03],
    [WTX + 1.25, WTZ + 1.25, -0.03, 0.03],
  ]
  wtLegs.forEach(([lx, lz, rx, rz]) =>
    mk(gCyl(0.12, 0.16, 6.5, 6), wtPost, lx, 3.25, lz, 0, rx, rz),
  )
  box(3.5, 0.25, 3.5, wtPlat, WTX, 5.9, WTZ)
  // Parapetos frontal/trasero + laterales.
  box(3.7, 0.08, 0.1, wtParap, WTX, 6.55, WTZ - 1.8)
  box(3.7, 0.08, 0.1, wtParap, WTX, 6.55, WTZ + 1.8)
  box(0.08, 0.08, 3.0, wtParap, WTX - 1.8, 6.55, WTZ)
  box(0.08, 0.08, 3.0, wtParap, WTX + 1.8, 6.55, WTZ)
  // Postes del techo + techo inclinado de madera oscura (mesh clickeable).
  for (const [cx2, cz2] of [
    [WTX - 1.5, WTZ - 1.5],
    [WTX + 1.5, WTZ - 1.5],
    [WTX - 1.5, WTZ + 1.5],
    [WTX + 1.5, WTZ + 1.5],
  ])
    box(0.08, 1.5, 0.08, wtPost, cx2, 6.75, cz2)
  const watchtowerMesh = box(4.4, 0.18, 4.4, wtRoofM, WTX, 7.55, WTZ, 0, 0, 0.07)
  // Escalera de mano (largueros + 8 peldaños).
  box(0.04, 6, 0.04, wtPost, WTX + 0.95, 3, WTZ + 1.45)
  box(0.04, 6, 0.04, wtPost, WTX + 0.45, 3, WTZ + 1.45)
  for (let wli = 0; wli < 8; wli++)
    box(0.55, 0.04, 0.04, wtPost, WTX + 0.7, 0.6 + wli * 0.72, WTZ + 1.45)
  // Reflector articulado con lente cegadora (la luz direccional es spot1).
  box(0.5, 0.28, 0.4, wtRefl, WTX, 6.25, WTZ - 0.3, 0, 0.2)
  sph(0.14, 7, mat(0xffffff, 0xffffff, 4.0), WTX, 6.3, WTZ - 0.55)
  const spot1 = new THREE.SpotLight(0xdde8ff, 12, 45, Math.PI / 9, 0.2, 2)
  spot1.position.set(WTX, 6.2, WTZ - 0.4)
  spot1.target.position.set(0, 0, 0)
  spot1.castShadow = false
  root.add(spot1)
  root.add(spot1.target)
  // Sacos de arena en la plataforma (6) + bitácora + binoculares en repisa.
  for (let wsi = 0; wsi < 6; wsi++)
    box(0.65, 0.28, 0.4, M.sandbag, WTX - 1.45 + wsi * 0.58, 6.17, WTZ + 1.55)
  box(0.25, 0.3, 0.12, M.plank, WTX + 1.2, 6.17, WTZ - 1.2)
  box(0.08, 0.08, 0.08, M.metal, WTX - 1.3, 6.62, WTZ - 1.78)
  // Cuerdas tensadas desde la plataforma hacia anclajes en el suelo.
  box(0.04, 0.04, 7, wtRope, WTX + 1.2, 2.9, WTZ - 2.6, 0, 0.55)
  box(0.04, 0.04, 7, wtRope, WTX - 1.2, 2.9, WTZ - 2.6, 0, 0.55)
  box(0.04, 0.04, 7, wtRope, WTX + 2.4, 2.9, WTZ - 1.2, 0.5, 0.55)
  // Luz tenue en la base + escombros.
  ptL(0x331a00, 0.8, 6, WTX, 1, WTZ)
  for (let wdi2 = 0; wdi2 < 3; wdi2++)
    box(
      0.12,
      0.1,
      0.1,
      M.gravel,
      WTX - 1 + Math.random() * 2,
      0.05,
      WTZ - 2 + Math.random(),
      Math.random() * Math.PI,
    )

  // 5. APARTAMENTOS (Paso 03 — Personal, estilo TLoU2)
  // Edificio residencial de ladrillo de 3 pisos reconvertido en dormitorios
  // colectivos: ventanas mixtas (lit/tapiadas), balcones con ropa tendida (que
  // oscila en animate), escalera de emergencia lateral, vegetación desde el
  // tercer piso y grietas en la fachada. El número de ventanas iluminadas
  // reflejará el personal activo en el paso de datos reactivos.
  const aptBrick = matTex(TX.brick, C.brick, 0, 0, 0.84, 0, 1.5)
  const aptRoof = matTex(TX.corrugat, C.metal, 0, 0, 0.88, 0.08, 1.0)
  const aptBoard = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    transparent: true,
    opacity: 0.7,
    roughness: 0.95,
  })
  const aptBalcony = mat(0x2a2a30, 0, 0, 0.6, 0.5)
  const aptStairs = matTex(TX.rust, C.rust, 0, 0, 0.88, 0.15, 1.2)
  const aptCrack = mat(0x2a2000, 0, 0, 0.99, 0)
  const aptWinLit = new THREE.MeshStandardMaterial({
    color: 0xff9944,
    emissive: 0xff9944,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.85,
    roughness: 0.3,
  })

  const APX = 10
  const APZ = -6
  const barracksMesh = box(9, 7.5, 5, aptBrick, APX, 3.75, APZ)
  box(9.2, 0.2, 5.2, aptRoof, APX, 7.6, APZ)
  // Ventanas x9 (3 por piso): mixtas iluminadas / tapiadas con tablones.
  const aptLitPattern = [true, false, true, true, false, true, false, true, false]
  for (let api = 0; api < 9; api++) {
    const fx = APX - 2.8 + (api % 3) * 2.8
    const fy = 1.5 + Math.floor(api / 3) * 2.4
    box(1.1, 1.2, 0.12, aptLitPattern[api] ? aptWinLit : aptBoard, fx, fy, APZ + 2.56)
  }
  // Balcones x4 (pisos 2-3) con barandal, cuerdas y ropa tendida.
  const aptClothes: THREE.Mesh[] = []
  const prendaCols = [0x3a2a1a, 0x223344, 0x442200, 0x3a2a1a, 0x223344, 0x442200]
  const aptBalconies: [number, number][] = [
    [APX - 2.5, 3.6],
    [APX + 2.5, 3.6],
    [APX - 2.5, 6.0],
    [APX + 2.5, 6.0],
  ]
  aptBalconies.forEach(([bx, by], bi) => {
    box(1.8, 0.1, 0.5, aptBalcony, bx, by - 0.65, APZ + 2.75)
    box(1.9, 0.08, 0.52, aptBalcony, bx, by - 0.1, APZ + 2.98)
    box(1.7, 0.02, 0.02, wtRope, bx, by - 0.2, APZ + 2.9)
    if (bi < 3)
      for (let pci = 0; pci < 2; pci++)
        aptClothes.push(
          box(
            0.25,
            0.35,
            0.02,
            mat(prendaCols[bi * 2 + pci], 0, 0, 1),
            bx - 0.4 + pci * 0.8,
            by - 0.38,
            APZ + 2.9,
          ),
        )
  })
  // Escalera de emergencia en la fachada lateral (12 peldaños).
  box(0.04, 5, 0.04, aptStairs, APX + 4.56, 3.4, APZ - 0.3)
  box(0.04, 5, 0.04, aptStairs, APX + 4.56, 3.4, APZ + 0.3)
  for (let asi = 0; asi < 12; asi++)
    box(0.04, 0.04, 0.65, aptStairs, APX + 4.56, 1.1 + asi * 0.42, APZ)
  // Entrada reforzada con sacos de arena.
  box(1.2, 2.4, 0.15, cgDoor, APX, 1.2, APZ + 2.58)
  box(6, 0.28, 0.4, M.sandbag, APX, 0.14, APZ + 2.95)
  box(4.5, 0.28, 0.4, M.sandbag, APX, 0.42, APZ + 2.95)
  // Vegetación desde el tercer piso + grietas oscuras + letrero despintado.
  for (let avi = 0; avi < 8; avi++)
    box(0.04, 0.6, 0.04, cgMoss, APX - 4 + Math.random() * 8, 4.5 + Math.random() * 2.5, APZ + 2.56)
  const aptCracks: [number, number][] = [
    [APX - 3.8, 2.2],
    [APX - 1.4, 5.0],
    [APX + 0.8, 3.2],
    [APX + 2.9, 6.2],
    [APX + 3.9, 1.6],
  ]
  aptCracks.forEach(([cx3, cy3]) => box(0.04, 0.8, 0.04, aptCrack, cx3, cy3, APZ + 2.55, 0, 0, 0.3))
  box(2, 0.4, 0.1, mat(0x3a3a32, 0, 0, 0.98), APX, 7.1, APZ + 2.6)
  // Luces interiores por piso + escombros perimetrales.
  ptL(0xff9944, 1.5, 7, APX, 1.5, APZ)
  ptL(0xff9944, 1.5, 7, APX, 3.9, APZ)
  ptL(0xff9944, 1.5, 7, APX, 6.3, APZ)
  for (let adi = 0; adi < 6; adi++)
    box(
      0.12,
      0.1,
      0.12,
      M.gravel,
      APX - 4 + Math.random() * 8,
      0.05,
      APZ + 2.9 + Math.random() * 0.8,
      Math.random() * Math.PI,
    )

  // 6. RADIO STATION (decorativa en el plan TLoU2)
  box(3, 2.8, 2.8, mat(0x3a4450), 0, 1.4, 9)
  box(3.2, 0.1, 3.0, M.corrugat, 0, 2.86, 9)
  cyl(0.035, 0.035, 1.8, 5, M.metal, 0, 3.0, 9)
  box(1.0, 0.05, 0.85, M.metal, 0, 3.95, 9, 0.35, 0.45)
  for (let ra = 0; ra < 3; ra++)
    cyl(0.02, 0.02, 2.2 + ra * 0.35, 4, M.metal, -0.8 + ra * 0.7, 4.5, 9)
  box(0.02, 0.02, 1.5, M.wireH, 0, 5.4, 9, Math.PI / 2)
  box(0.8, 2.0, 0.1, M.metal, -1.56, 1.0, 9)
  box(0.5, 0.4, 0.08, mat(0x112211, 0x00ff44, 0.8), -1.56, 1.8, 9)
  ptL(0x22ff44, 0.9, 5, 0, 1.5, 9)

  // 7. COCINA / CANTINA — edificio cerrado con área de comedor exterior
  // Nave cocina (madera + chapa)
  box(6, 3.2, 5, M.plank, 5.5, 1.6, 10.2)
  box(6.2, 0.14, 5.2, M.corrugat, 5.5, 3.28, 10.2, 0, 0, 0.04)
  // Puerta cocina y ventana de servicio
  box(1.0, 2.2, 0.08, M.woodD, 5.5, 1.1, 12.72)
  box(1.8, 0.65, 0.06, M.glass, 4.3, 2.1, 12.72)
  // Chimenea de ladrillo (doble)
  cyl(0.28, 0.32, 3.8, 8, M.brick, 4.4, 1.6 + 1.9, 9.3)
  cyl(0.35, 0.28, 0.35, 8, M.rust, 4.4, 5.55, 9.3)
  cyl(0.22, 0.26, 2.9, 8, M.brick, 5.9, 1.6 + 1.45, 9.3)
  cyl(0.3, 0.22, 0.28, 8, M.rust, 5.9, 4.95, 9.3)
  // Calderas / cocinas de leña
  box(0.7, 0.7, 0.7, M.rust, 4.5, 0.35, 10.5)
  box(0.7, 0.7, 0.7, M.rust, 5.8, 0.35, 10.5)
  sph(0.14, 7, mat(0xff6600, 0xff4400, 6.0), 5.1, 0.85, 10.5)
  const kFireL = ptL(0xff5500, 3.5, 10, 5.5, 1.2, 10.5)
  // Área de comedor exterior (techo de tela sobre postes)
  box(5, 0.07, 3.5, M.tarpB, 8.8, 2.85, 11.5)
  box(0.1, 2.85, 0.1, M.wood, 7.0, 1.42, 10.0)
  box(0.1, 2.85, 0.1, M.wood, 7.0, 1.42, 13.0)
  box(0.1, 2.85, 0.1, M.wood, 10.6, 1.42, 10.0)
  box(0.1, 2.85, 0.1, M.wood, 10.6, 1.42, 13.0)
  // Mesas y bancos exteriores
  box(1.5, 0.06, 0.55, M.woodD, 8.8, 0.72, 11.0)
  box(1.5, 0.06, 0.55, M.woodD, 8.8, 0.72, 12.2)
  box(1.4, 0.06, 0.22, M.wood, 8.8, 0.42, 10.7)
  box(1.4, 0.06, 0.22, M.wood, 8.8, 0.42, 11.3)
  box(1.4, 0.06, 0.22, M.wood, 8.8, 0.42, 11.9)
  box(1.4, 0.06, 0.22, M.wood, 8.8, 0.42, 12.5)
  // Barriles de agua y provisiones
  cyl(0.38, 0.4, 0.9, 9, M.brl_y, 3.0, 0.45, 12.5)
  cyl(0.38, 0.4, 0.9, 9, M.brl_y, 3.0, 1.35, 12.5)
  cyl(0.38, 0.4, 0.9, 9, M.brl_g, 2.2, 0.45, 12.5)

  // 8. ENFERMERÍA — Centro médico del campamento (x=-7, z=-7)
  box(6, 3.5, 5.5, mat(0xa0a890), -7, 1.75, -7) // nave principal (lona verde militar)
  box(6.3, 0.13, 5.8, mat(0x7a8860, 0, 0, 0.96), -7, 3.57, -7, 0, 0, 0.03) // techo lona
  box(2.5, 3.5, 0.08, mat(0xc8d0b8), -7, 1.75, -4.24) // pared frontal blanca
  // Cruz roja en fachada
  box(1.5, 1.5, 0.06, mat(0xfafafa), -7, 2.2, -4.23)
  box(0.38, 1.5, 0.06, mat(0xcc0a0a, 0xaa0000, 1.1), -7, 2.2, -4.22)
  box(1.5, 0.38, 0.06, mat(0xcc0a0a, 0xaa0000, 1.1), -7, 2.2, -4.22)
  ptL(0xcc0000, 2.5, 8, -7, 2.5, -4.1)
  // Puerta y ventanas
  box(1.0, 2.3, 0.07, mat(0xc8d0b8), -7, 1.15, -4.23)
  box(1.2, 0.75, 0.07, M.glass, -8.8, 2.3, -4.23)
  box(1.2, 0.75, 0.07, M.glass, -5.2, 2.3, -4.23)
  // Postes de esquina
  box(0.14, 3.5, 0.14, M.metal, -9.95, 1.75, -4.24)
  box(0.14, 3.5, 0.14, M.metal, -4.05, 1.75, -4.24)
  // Luz interior (blanca-fría)
  ptL(0xddeeff, 2.2, 10, -7, 2.0, -7)
  // Camilla + suministros médicos
  box(2.0, 0.12, 0.7, mat(0xfafafa), -7, 0.66, -6.5) // camilla
  box(0.06, 0.66, 0.06, M.metal, -6.1, 0.33, -6.2)
  box(0.06, 0.66, 0.06, M.metal, -7.9, 0.33, -6.2)
  box(0.06, 0.66, 0.06, M.metal, -6.1, 0.33, -6.8)
  box(0.06, 0.66, 0.06, M.metal, -7.9, 0.33, -6.8)
  box(0.5, 0.42, 0.36, mat(0xfafafa), -9.2, 0.21, -6.0) // caja médica
  box(0.5, 0.42, 0.36, mat(0xfafafa), -9.2, 0.63, -6.0) // caja apilada
  box(0.06, 0.42, 0.06, mat(0xee1111, 0xcc0000, 1.8), -9.2, 0.21, -6.0) // cruz pequeña
  box(0.5, 0.42, 0.36, mat(0xd0e8e0), -4.8, 0.21, -4.6) // botiquín verde
  // Poste con bandera de emergencia
  cyl(0.04, 0.04, 4.5, 5, M.metal, -9.5, 2.25, -4.5)
  box(0.9, 0.5, 0.04, mat(0xfafafa, 0, 0, 0.85), -9.1, 4.0, -4.5) // bandera blanca
  box(0.36, 0.5, 0.04, mat(0xcc0a0a, 0xaa0000, 0.9), -9.1, 4.0, -4.5) // cruz bandera

  // (El antiguo FUEL DEPOT se fusionó con el Almacén — Paso 05.)

  // ---- ZONE MARKERS ----
  const zoneData = [
    { x: 0, z: -5, col: 0x44ff44, ec: 0x00cc00, gM: glowG },
    { x: -11, z: -2, col: 0xff3333, ec: 0xcc0000, gM: glowR },
    { x: 10, z: 4, col: 0xffbb00, ec: 0xcc7700, gM: glowY },
  ]
  const zoneLights: { l: THREE.PointLight; b: number }[] = []
  zoneData.forEach((z) => {
    cyl(0.06, 0.08, 7, 8, M.pipe, z.x, 3.5, z.z)
    box(3.2, 0.72, 0.14, M.sign, z.x, 6.8, z.z)
    box(3.3, 0.78, 0.06, mat(z.col, z.ec, 0.5), z.x, 6.8, z.z)
    box(0.65, 0.65, 0.18, mat(z.col, z.ec, 1.5), z.x - 1.75, 6.8, z.z)
    sph(0.26, 8, z.gM, z.x, 7.6, z.z)
    const pl = new THREE.PointLight(z.col, 5, 16)
    pl.position.set(z.x, 7, z.z)
    root.add(pl)
    zoneLights.push({ l: pl, b: 5 })
    pln(
      3,
      3,
      new THREE.MeshBasicMaterial({ color: z.col, transparent: true, opacity: 0.04 }),
      z.x,
      0.02,
      z.z,
    )
  })

  // ---- CHAIN FENCES ----
  const chFence = (x: number, z: number, len: number, ry = 0) => {
    const c = Math.cos(ry)
    const s = Math.sin(ry)
    box(len, 0.05, 0.05, M.chain, x, 0.5, z, ry)
    box(len, 0.05, 0.05, M.chain, x, 1.5, z, ry)
    box(len, 0.05, 0.05, M.chain, x, 2.3, z, ry)
    const n = Math.ceil(len / 0.5)
    for (let i = 0; i <= n; i++) {
      const tt = (i / n - 0.5) * len
      cyl(0.02, 0.02, 2.35, 4, M.chain, x + c * tt, 1.15, z + s * tt)
    }
    cyl(0.07, 0.08, 2.5, 6, M.metal, x - (c * len) / 2, 1.25, z - (s * len) / 2)
    cyl(0.07, 0.08, 2.5, 6, M.metal, x + (c * len) / 2, 1.25, z + (s * len) / 2)
  }
  chFence(-7, -3, 6, Math.PI / 2)
  chFence(7, 2, 8, Math.PI / 2)

  // ---- PORTÓN DE TRASLADOS (salida sur — GJX=13.5, GJZ=8.5) ----
  // Carretera de grava saliendo hacia el sur (GJZ+11 = z=19.5 root-local)
  pln(7.5, 24, M.gravel, 13.5, 0.012, 19.5)
  for (let rm = 0; rm < 5; rm++)
    box(0.18, 0.02, 1.4, mat(0xddcc88, 0, 0, 0.85), 13.5, 0.022, 13.5 + rm * 4.2)
  // Postes del portón (hormigón + metal)
  box(0.55, 5.8, 0.55, matTex(TX.conc, C.concrete, 0, 0, 0.88), 9.7, 2.9, 12.1)
  box(0.55, 5.8, 0.55, matTex(TX.conc, C.concrete, 0, 0, 0.88), 17.3, 2.9, 12.1)
  box(0.72, 0.22, 0.72, M.metal, 9.7, 5.9, 12.1)
  box(0.72, 0.22, 0.72, M.metal, 17.3, 5.9, 12.1)
  // Luces rojas de advertencia
  sph(0.18, 7, mat(0xff2200, 0xff2200, 4.0), 9.7, 5.7, 11.9)
  sph(0.18, 7, mat(0xff2200, 0xff2200, 4.0), 17.3, 5.7, 11.9)
  ptL(0xff1100, 3.0, 8, 9.7, 5.5, 11.8)
  ptL(0xff1100, 3.0, 8, 17.3, 5.5, 11.8)
  // Hoja derecha (pivota en x=17, z=12.1)
  const portonPivotR = new THREE.Group()
  portonPivotR.position.set(17.0, 0, 12.1)
  const portonPanelR = new THREE.Mesh(
    gBox(3.4, 4.8, 0.12),
    matTex(TX.corrugat, C.metal, 0, 0, 0.55, 0.45),
  )
  portonPanelR.position.set(-1.7, 2.4, 0)
  portonPanelR.castShadow = true
  portonPivotR.add(portonPanelR)
  root.add(portonPivotR)
  // Hoja izquierda (pivota en x=10, z=12.1)
  const portonPivotL = new THREE.Group()
  portonPivotL.position.set(10.0, 0, 12.1)
  const portonPanelL = new THREE.Mesh(
    gBox(3.4, 4.8, 0.12),
    matTex(TX.corrugat, C.metal, 0, 0, 0.55, 0.45),
  )
  portonPanelL.position.set(1.7, 2.4, 0)
  portonPanelL.castShadow = true
  portonPivotL.add(portonPanelL)
  root.add(portonPivotL)
  // Travesaños horizontales (barra de cierre)
  box(7.2, 0.22, 0.14, M.metal, 13.5, 3.6, 12.1)
  box(7.2, 0.22, 0.14, M.metal, 13.5, 1.4, 12.1)
  box(3.2, 0.14, 0.12, mat(0xddcc00, 0xbbaa00, 0.3), 13.5, 0.8, 12.1)
  box(2.0, 0.5, 0.08, mat(0x0a0808, 0, 0, 0.98), 13.5, 4.5, 12.08)
  box(1.85, 0.36, 0.07, mat(0xdd2200, 0xaa1100, 0.65), 13.5, 4.5, 12.07)
  // Valla a ambos lados de la carretera exterior
  chFence(7.0, 18.5, 8)
  chFence(20.0, 18.5, 8)

  // ---- SANDBAGS (instanced) ----
  const sbGeo = gBox(0.68, 0.3, 0.4)
  const sbData: number[][] = []
  const sbRow = (x: number, z: number, n: number, ry = 0, stacks = 2) => {
    const c = Math.cos(ry)
    const s = Math.sin(ry)
    for (let r = 0; r < stacks; r++)
      for (let i = 0; i < n; i++) {
        const tt = (i - n / 2 + 0.5) * 0.72
        sbData.push([x + c * tt, 0.15 + r * 0.29, z + s * tt, ry + (Math.random() - 0.5) * 0.08])
      }
  }
  // Berm frontal del almacén (a la izq. de su puerta, sin taparla).
  sbRow(-16.5, 8, 4, 0, 2)
  sbRow(4, -4, 4, Math.PI / 2, 2)
  sbRow(-4, -8, 6, 0.3, 1)
  sbRow(12, -2, 4, Math.PI / 2, 3)
  sbRow(-13, -6, 5, 0, 2)
  // (Antes había una fila en (0,13) que tapaba el portón principal — eliminada.)
  const iSB = new THREE.InstancedMesh(sbGeo, M.sandbag, sbData.length)
  sbData.forEach((p, i) => {
    tmpM.makeRotationY(p[3])
    tmpM.setPosition(p[0], p[1], p[2])
    iSB.setMatrixAt(i, tmpM)
  })
  iSB.instanceMatrix.needsUpdate = true
  iSB.castShadow = true
  root.add(iSB)

  // ---- BARRELS (instanced manualmente) ----
  const brlGeo = gCyl(0.34, 0.36, 0.92, 8)
  const brlBand = gCyl(0.375, 0.375, 0.05, 8)
  const brlData: [number, number, THREE.Material][] = [
    // Junto al depósito de combustible (a su costado este, no dentro).
    [-3.4, 3, M.brl_r],
    [-3.4, 4, M.brl_r],
    [-2.7, 3.5, M.brl_g],
    [6, 1.5, M.brl_g],
    [6.8, 1.5, M.brl_y],
    [14, -2, M.brl_r],
    [14.8, -2, M.brl_r],
    [-14, -3, M.brl_y],
    [-13.3, -3, M.brl_g],
    [-14.8, -4, M.brl_r],
    // Junto a los generadores, a la izq. del Cuartel General (no dentro).
    [-8, -9, M.brl_g],
    [-8.8, -9, M.brl_g],
    [-8.4, -9.8, M.brl_y],
    [8, 8, M.brl_r],
    [8.8, 8, M.brl_g],
  ]
  brlData.forEach((b) => {
    mk(brlGeo, b[2], b[0], 0.46, b[1])
    mk(brlBand, M.rust, b[0], 0.16, b[1])
    mk(brlBand, M.rust, b[0], 0.76, b[1])
  })
  // Toxic barrel
  mk(brlGeo, mat(0x1e3818, 0x00ff44, 0.5), -1.5, 0.46, -3.5)
  mk(brlBand, M.rust, -1.5, 0.16, -3.5)
  mk(brlBand, M.rust, -1.5, 0.76, -3.5)
  const toxL = ptL(0x22ff44, 2.0, 6, -1.5, 1.2, -3.5)
  pln(
    1.5,
    1.0,
    new THREE.MeshBasicMaterial({ color: 0x002200, transparent: true, opacity: 0.8 }),
    -1.5,
    0.017,
    -3,
  )

  // ---- TIRES (instanced) ----
  const tireGeo = gCyl(0.52, 0.52, 0.3, 12)
  const tireData = [
    [-8, 7],
    [-8, 7.3],
    [-8, 7.6],
    [-9, 7],
    [-9, 7.3],
    [-8.5, 8.2],
    [-16.5, 8.8],
    [-16.5, 9.1],
  ]
  const iTires = new THREE.InstancedMesh(tireGeo, M.tire, tireData.length)
  tireData.forEach((p, i) => {
    tmpM.identity()
    tmpM.setPosition(p[0], 0.15, p[1])
    iTires.setMatrixAt(i, tmpM)
  })
  iTires.instanceMatrix.needsUpdate = true
  iTires.castShadow = true
  root.add(iTires)

  // ---- CRATES ----
  const crtData = [
    [-12, -6],
    [-13, -5.3],
    [-11.5, -5],
    [16, -7],
    [16.8, -6.4],
    [-9, -12],
    [-8, -12.4],
    [-10, -11.6],
    [-4, 10],
    [-3.2, 10.4],
    [17.8, 12.9],
    [-7, -12],
    [-6, -11.5],
  ]
  crtData.forEach((p) => {
    const h = 0.7 + Math.random() * 0.5
    const ry = Math.random() * 0.4 - 0.2
    box(0.95, h, 0.95, M.plank, p[0], h / 2, p[1], ry)
    box(0.96, 0.05, 0.05, M.woodD, p[0], h * 0.35, p[1], ry)
    box(0.96, 0.05, 0.05, M.woodD, p[0], h * 0.65, p[1], ry)
  })

  // ---- 7. GARAJE DE TRASLADOS (Paso 06 — Transfers, estilo TLoU2) ----
  // Garaje industrial de chapa y concreto: puerta basculante con pivote en el
  // dintel (rotation.x 0 → -PI/2 al abrir), camioneta vieja visible adentro,
  // herramientas colgadas, bidones de aceite, manchas brillantes en el suelo y
  // señalización pintada. El camión de traslado (oculto) sale por el gate al
  // disparar playTransferAnimation.
  const gjWall = matTex(TX.corrugat, C.metal, 0, 0, 0.78, 0.28, 1.4)
  const gjRoof = matTex(TX.corrugat, C.metal, 0, 0, 0.62, 0.48, 1.2)
  const gjVan = mat(0x5a3020, 0, 0, 0.95, 0.1)
  const gjTools = mat(0x4a4040, 0, 0, 0.6, 0.55)
  const gjOil = new THREE.MeshStandardMaterial({
    color: 0x0a0a08,
    roughness: 0.02,
    metalness: 0.7,
  })
  const gjSignal = mat(0xffdd00, 0xffdd00, 0.2)

  const GJX = 13.5
  const GJZ = 8.5
  const garageMesh = box(8, 4, 7, gjWall, GJX, 2, GJZ)
  box(8.2, 0.15, 7.2, gjRoof, GJX, 4.1, GJZ, 0, 0, 0.03)
  // Puerta basculante (grupo con pivote en el dintel) + panel inferior.
  const gjDoorPivot = new THREE.Group()
  gjDoorPivot.position.set(GJX, 3.75, GJZ + 3.52)
  const gjDoor = new THREE.Mesh(gBox(7, 3.5, 0.15), mat(0x383830, 0, 0, 0.65, 0.45))
  gjDoor.position.y = -1.75
  gjDoor.castShadow = true
  gjDoorPivot.add(gjDoor)
  root.add(gjDoorPivot)
  box(7, 0.12, 0.15, gjWall, GJX, 0.06, GJZ + 3.52)
  // Camioneta vieja en el interior (cabina + ruedas).
  const gjVanX = GJX - 1.8
  box(2.2, 0.9, 4.6, gjVan, gjVanX, 0.75, GJZ - 0.4)
  box(2.0, 0.7, 1.4, gjVan, gjVanX, 1.5, GJZ + 1)
  for (const [wx2, wz2] of [
    [gjVanX - 1.15, GJZ - 2],
    [gjVanX + 1.15, GJZ - 2],
    [gjVanX - 1.15, GJZ + 1.2],
    [gjVanX + 1.15, GJZ + 1.2],
  ])
    mk(gCyl(0.42, 0.42, 0.22, 10), M.tire, wx2, 0.42, wz2, 0, 0, Math.PI / 2)
  // Herramientas colgadas, cables, bidones de aceite y manchas en el suelo.
  box(0.04, 2, 0.04, cgCable, GJX + 3.9, 2, GJZ - 2)
  for (let gti = 0; gti < 4; gti++)
    box(0.25, 0.3, 0.04, gjTools, GJX + 1 + gti * 0.6, 2.2, GJZ - 3.4)
  cyl(0.2, 0.22, 0.5, 8, M.brl_y, GJX + 3.2, 0.25, GJZ + 2.5)
  cyl(0.2, 0.22, 0.5, 8, M.brl_y, GJX + 2.7, 0.25, GJZ + 2.8)
  cyl(0.2, 0.22, 0.5, 8, M.brl_y, GJX + 2.95, 0.75, GJZ + 2.65)
  box(6, 0.04, 0.3, gjSignal, GJX, 0.03, GJZ + 4.5)
  for (const [ox, oz] of [
    [GJX - 1, GJZ + 2],
    [GJX + 0.8, GJZ + 1],
    [GJX - 2.5, GJZ + 3],
    [GJX + 1.8, GJZ + 4.3],
  ])
    pln(0.8, 0.6, gjOil, ox, 0.018, oz, Math.random() * Math.PI)
  ptL(0xff9944, 4.0, 10, GJX, 2.5, GJZ)

  // ---- FIRE PIT ----
  cyl(0.62, 0.72, 0.18, 10, mat(0x2a2a20), -3, 0.09, 8)
  for (let fi = 0; fi < 4; fi++)
    box(
      0.07,
      0.55,
      0.07,
      M.wood,
      -3 + Math.cos(fi * 1.57) * 0.2,
      0.25,
      8 + Math.sin(fi * 1.57) * 0.2,
      fi * 0.785,
    )
  sph(0.18, 7, mat(0xff6600, 0xff4400, 5.5), -3, 0.38, 8)
  sph(0.09, 6, mat(0xffcc00, 0xffcc00, 7.0), -3, 0.5, 8)
  const fireP = ptL(0xff5500, 4.5, 12, -3, 0.8, 8)
  // Fogata secundaria movida a (-2.5,10) para dejar libre el carril del portón.
  cyl(0.4, 0.5, 0.14, 8, mat(0x2a2a20), -2.5, 0.07, 10)
  sph(0.13, 7, mat(0xff6600, 0xff4400, 5.0), -2.5, 0.32, 10)
  const fireP2 = ptL(0xff5500, 3.0, 8, -2.5, 0.6, 10)

  // ---- LANTERNS ----
  const lantern = (x: number, y: number, z: number, col = 0xffaa33) => {
    cyl(0.05, 0.05, 0.28, 6, M.metal, x, y, z)
    cyl(0.13, 0.13, 0.26, 7, mat(col, col, 2.5, 0.1), x, y - 0.18, z)
    ptL(col, 1.6, 5, x, y - 0.18, z)
  }
  lantern(0, 3.9, -15, 0xffcc44)
  lantern(-8, 3.6, -15, 0xffaa33)
  lantern(8, 3.6, -15, 0xffaa33)
  lantern(-5, 3.0, 14, 0xffcc55)
  lantern(5, 3.0, 14, 0xffcc55)
  lantern(-13, 3.0, 8, 0xffeedd)
  lantern(0, 3.5, -7.5, 0xaaffaa)
  lantern(10, 3.2, 3.0, 0xffddaa)
  lantern(6, 3.0, 11.5, 0xffcc88)
  lantern(-3, 3.2, 9.5, 0x44ff88)

  // Laundry line (detrás del Cuartel General, entre el edificio y la valla)
  box(0.03, 0.03, 14, M.rope, 0, 2.92, -14.2, Math.PI / 2)
  for (let li2 = 0; li2 < 6; li2++)
    box(0.22, 0.35, 0.02, mat(0x3a2a1a + li2 * 0x030303), (li2 - 2.5) * 1.5, 2.65, -14.2)

  // Warning tapes
  const tape = (x1: number, z1: number, x2: number, z2: number, col: number) => {
    const mx = (x1 + x2) / 2
    const mz = (z1 + z2) / 2
    const dx = x2 - x1
    const dz = z2 - z1
    const len = Math.sqrt(dx * dx + dz * dz)
    const ry = Math.atan2(dx, dz)
    box(len, 0.04, 0.04, mat(col, col, 0.5), mx, 0.9, mz, ry)
    box(len, 0.04, 0.04, mat(col, col, 0.5), mx, 1.1, mz, ry)
    cyl(0.03, 0.03, 1.2, 4, M.metal, x1, 0.6, z1)
    cyl(0.03, 0.03, 1.2, 4, M.metal, x2, 0.6, z2)
  }
  tape(-7, 0, -7, 4, 0xff2200)
  tape(7, 0, 7, 6, 0xffaa00)
  tape(-2, -8, 2, -8, 0xffdd00)
  tape(0, 13, 0, 14, 0xff2200)

  // Rocks (instanced)
  const rGeo = gSph(0.12, 5)
  const iRocks = new THREE.InstancedMesh(rGeo, mat(0x303028), 35)
  for (let ri = 0; ri < 35; ri++) {
    const rx = (Math.random() - 0.5) * 38
    const rz = (Math.random() - 0.5) * 28
    const rs = 0.5 + Math.random() * 0.8
    tmpM.makeScale(rs, rs * 0.6, rs)
    tmpM.setPosition(rx, 0.07 * rs, rz)
    iRocks.setMatrixAt(ri, tmpM)
  }
  iRocks.instanceMatrix.needsUpdate = true
  root.add(iRocks)

  // Generator
  // (el escape no se rota: el helper cyl del HTML original ignoraba los args de rotación)
  box(1.3, 0.85, 0.75, M.metal, -6.5, 0.43, -8.5)
  cyl(0.12, 0.12, 0.8, 6, M.rust, -5.82, 0.43, -8.5)
  const genL = ptL(0x88ffaa, 0.6, 5, -6.5, 1.3, -8.5)

  // Spotlight tower (decorativa en el plan TLoU2)
  cyl(0.1, 0.13, 5.5, 7, M.metal, 16, 2.75, -12)
  box(0.7, 0.32, 0.55, M.metal, 16, 5.5, -12)
  sph(0.14, 7, mat(0xffffff, 0xffffff, 4.0), 16, 5.68, -12)
  const spot2 = new THREE.SpotLight(0xddeeff, 14, 50, Math.PI / 9, 0.2, 2)
  spot2.position.set(16, 5.5, -12)
  spot2.target.position.set(0, 0, 0)
  spot2.castShadow = false
  root.add(spot2)
  root.add(spot2.target)

  // Pipes on ground
  const phGeo = gCyl(0.08, 0.08, 12, 6)
  const ph = new THREE.Mesh(phGeo, M.pipe)
  ph.rotation.z = Math.PI / 2
  ph.position.set(-7, 0.1, -7)
  ph.castShadow = true
  root.add(ph)
  cyl(0.12, 0.14, 4.2, 7, M.rust, -12, 2.1, -10)

  // ---- EXTERIOR ENVIRONMENT ----
  // Materials
  const extTree = matTex(TX.wood, C.woodDark, 0, 0, 0.98, 0, 0.8)
  const extBush = new THREE.MeshStandardMaterial({
    color: new THREE.Color(C.grass).multiplyScalar(0.72),
    roughness: 1.0,
  })
  const extLamp = mat(0x28282e, 0, 0, 0.45, 0.8)
  const extBulb = mat(0xffdd88, 0xffdd88, 2.8)
  const wrkMat = matTex(TX.rust, C.rust, 0, 0, 0.94, 0.06, 1.2)
  const wtLegMat = mat(C.metal, 0, 0, 0.6, 0.55)
  const wtTankM = matTex(TX.rust, C.rust, 0, 0, 0.85, 0.1, 1.3)
  const ctnBlue = matTex(TX.corrugat, 0x2a5080, 0, 0, 0.75, 0.28, 1.4)
  const ctnRed = matTex(TX.corrugat, 0x7a3028, 0, 0, 0.74, 0.28, 1.4)
  const ivyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(C.grass).multiplyScalar(0.78),
    roughness: 1.0,
    transparent: true,
    opacity: 0.88,
  })

  // FOREST — dense ring of pines + dead trees + undergrowth around camp
  const pineCan = new THREE.MeshStandardMaterial({
    color:
      visuals.theme === "arctic"
        ? 0x1a2e1a
        : visuals.theme === "arid"
          ? 0x3a2c0c
          : visuals.theme === "industrial"
            ? 0x141810
            : 0x0c2006,
    roughness: 1.0,
    flatShading: true,
    side: THREE.FrontSide,
  })
  const pineTrk = mat(C.woodDark, 0, 0, 0.98, 0)

  // Instanced pine geometry — 4 layers: trunk + 3 cones (flatShading for organic look)
  const PINE_MAX = 100
  const iTrunkF = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.13, 0.22, 1, 6),
    pineTrk,
    PINE_MAX,
  )
  const iConeL = new THREE.InstancedMesh(new THREE.ConeGeometry(1.65, 1, 8), pineCan, PINE_MAX)
  const iConeM = new THREE.InstancedMesh(new THREE.ConeGeometry(1.15, 1, 7), pineCan, PINE_MAX)
  const iConeU = new THREE.InstancedMesh(new THREE.ConeGeometry(0.68, 1, 6), pineCan, PINE_MAX)
  iTrunkF.castShadow = true
  iConeL.castShadow = true
  iConeM.castShadow = true
  iConeU.castShadow = true
  iTrunkF.receiveShadow = true
  iConeL.receiveShadow = true

  // Seeded pseudo-random — no Math.random() so every camp renders identically
  let fs = seed
  const frand = () => {
    fs = (fs * 1664525 + 1013904223) >>> 0
    return (fs >>> 0) / 0x100000000
  }

  const pineRings = [
    { r: 23, spacing: 4.8, clearFront: 0.42 },
    { r: 30, spacing: 5.5, clearFront: 0.28 },
    { r: 38, spacing: 6.2, clearFront: 0.18 },
    { r: 47, spacing: 7.0, clearFront: 0.0 },
  ]
  let pi2 = 0
  pineRings.forEach(({ r, spacing, clearFront }) => {
    const count = Math.floor((2 * Math.PI * r) / spacing)
    for (let i = 0; i < count && pi2 < PINE_MAX; i++) {
      const ang = (i / count) * Math.PI * 2 + pi2 * 0.07
      // Clear the front arc so the camera has an open view of the camp entrance
      const sinA = Math.sin(ang)
      if (clearFront > 0 && sinA > clearFront) continue
      const jr = (frand() - 0.5) * 5
      const jx2 = (frand() - 0.5) * 3.5
      const jz2 = (frand() - 0.5) * 3.5
      const px2 = Math.cos(ang) * (r + jr) + jx2
      const pz2 = Math.sin(ang) * (r + jr) + jz2
      const th = 5.0 + (pi2 % 7) * 1.2
      const sc = 0.72 + (pi2 % 5) * 0.12
      // Trunk
      tmpM.makeScale(1, th, 1)
      tmpM.setPosition(px2, th * 0.5, pz2)
      iTrunkF.setMatrixAt(pi2, tmpM)
      // Lower canopy
      tmpM.makeScale(sc * 1.42, 2.2 * sc, sc * 1.42)
      tmpM.setPosition(px2, th * 0.4, pz2)
      iConeL.setMatrixAt(pi2, tmpM)
      // Mid canopy
      tmpM.makeScale(sc * 0.98, 1.9 * sc, sc * 0.98)
      tmpM.setPosition(px2, th * 0.58, pz2)
      iConeM.setMatrixAt(pi2, tmpM)
      // Upper canopy
      tmpM.makeScale(sc * 0.58, 1.7 * sc, sc * 0.58)
      tmpM.setPosition(px2, th * 0.75, pz2)
      iConeU.setMatrixAt(pi2, tmpM)
      pi2++
    }
  })
  iTrunkF.count = pi2
  iConeL.count = pi2
  iConeM.count = pi2
  iConeU.count = pi2
  iTrunkF.instanceMatrix.needsUpdate = true
  iConeL.instanceMatrix.needsUpdate = true
  iConeM.instanceMatrix.needsUpdate = true
  iConeU.instanceMatrix.needsUpdate = true
  root.add(iTrunkF)
  root.add(iConeL)
  root.add(iConeM)
  root.add(iConeU)

  // DEAD TREES — leafless silhouettes mixed into forest + inside camp corners
  const deadPosList: [number, number, number][] = [
    // forest edge dead trees
    [-22, -13, 5.8],
    [-26, -4, 4.4],
    [-23, 8, 6.2],
    [-25, 0, 3.9],
    [22, -10, 5.2],
    [24, 2, 4.6],
    [22, 11, 5.5],
    [26, -4, 3.8],
    [-6, -20, 4.0],
    [7, -19, 5.4],
    [-14, -19, 4.7],
    [2, -21, 3.6],
    [3, 17, 3.7],
    [-9, 17, 4.2],
    [-16, 16, 5.0],
    [11, 18, 3.5],
    [28, 8, 4.8],
    [-28, 12, 5.2],
    [32, -6, 3.9],
    [-30, -8, 6.1],
    // inside camp — empty corners
    [-3.5, -7.5, 3.2],
    [16.5, -12.5, 3.8],
    [-6.5, -12.5, 2.9],
    [17, 5, 3.4],
  ]
  deadPosList.forEach(([tx, tz, th], ti) => {
    cyl(0.13 + (ti % 3) * 0.035, 0.19 + (ti % 2) * 0.035, th, 7, extTree, tx, th / 2, tz)
    const bCount = 3 + (ti % 4)
    for (let b = 0; b < bCount; b++) {
      const bh = th * (0.4 + b * 0.16)
      const bl = 0.9 + ((ti * 7 + b * 11) % 10) * 0.15
      const bry2 = (ti * 1.9 + b * 2.1) % (Math.PI * 2)
      const brz2 = 0.5 + ((ti * 3 + b * 5) % 10) * 0.04
      mk(
        gCyl(0.022, 0.06, bl, 5),
        extTree,
        tx + Math.sin(bry2) * bl * 0.44,
        bh,
        tz + Math.cos(bry2) * bl * 0.44,
        bry2,
        0,
        -brz2,
      )
      if (b === 0 && ti % 2 === 0) {
        const sbl = bl * 0.52
        const sbry = bry2 + 0.85
        mk(
          gCyl(0.016, 0.038, sbl, 4),
          extTree,
          tx + Math.sin(bry2) * bl * 0.76 + Math.sin(sbry) * sbl * 0.36,
          bh + sbl * 0.2,
          tz + Math.cos(bry2) * bl * 0.76 + Math.cos(sbry) * sbl * 0.36,
          sbry,
          0,
          -brz2 * 0.7,
        )
      }
    }
  })

  // FALLEN LOGS in forest floor
  for (let li = 0; li < 16; li++) {
    const la = frand() * Math.PI * 2
    const lr = 22 + frand() * 28
    const lx2 = Math.cos(la) * lr
    const lz2 = Math.sin(la) * lr
    const ll = 2.2 + frand() * 4.0
    mk(gCyl(0.13, 0.2, ll, 7), pineTrk, lx2, 0.15, lz2, la + Math.PI / 2, 0, Math.PI / 2)
  }

  // ROCK CLUSTERS — scattered outside fence and forest floor
  const rockMat2 = mat(0x383430, 0, 0, 0.96, 0)
  const iRock2 = new THREE.InstancedMesh(gSph(0.35, 5), rockMat2, 100)
  for (let ri2 = 0; ri2 < 100; ri2++) {
    const ra = frand() * Math.PI * 2
    const rr = 18 + frand() * 38
    const rx2 = Math.cos(ra) * rr
    const rz2 = Math.sin(ra) * rr
    const rsc = 0.28 + frand() * 1.15
    const rsy = rsc * (0.42 + frand() * 0.6)
    tmpM.makeScale(rsc, rsy, rsc * (0.5 + frand() * 0.7))
    tmpM.setPosition(rx2, rsy * 0.45, rz2)
    iRock2.setMatrixAt(ri2, tmpM)
  }
  iRock2.instanceMatrix.needsUpdate = true
  root.add(iRock2)

  // FOREST UNDERGROWTH — dense low spheres on forest floor
  const iUnder = new THREE.InstancedMesh(gSph(0.2, 4), extBush, 180)
  for (let ui = 0; ui < 180; ui++) {
    const ua = frand() * Math.PI * 2
    const ur = 21 + frand() * 35
    const ux = Math.cos(ua) * ur
    const uz2 = Math.sin(ua) * ur
    const usc = 0.45 + frand() * 1.1
    tmpM.makeScale(usc, usc * 0.55, usc)
    tmpM.setPosition(ux, 0.11 * usc, uz2)
    iUnder.setMatrixAt(ui, tmpM)
  }
  iUnder.instanceMatrix.needsUpdate = true
  root.add(iUnder)

  // INTERIOR CAMP BUSHES
  const campBushPts: [number, number][] = [
    [4.0, 2.0],
    [5.4, 3.2],
    [3.6, 1.2],
    [-2.0, 3.4],
    [-1.2, 2.2],
    [-10.0, -8.0],
    [-11.5, -7.4],
    [-10.8, -9.0],
    [12.0, -10.0],
    [13.4, -11.0],
    [11.0, -11.4],
    [-15.0, -10.0],
    [-16.5, -8.8],
    [2.0, 11.0],
    [-4.0, 11.5],
    [-5.5, 12.8],
    [-4.0, -13.0],
    [-5.5, -13.8],
    [-3.0, -14.2],
    [15.0, 10.0],
    [16.5, 11.2],
    [-8.0, -4.0],
    [-7.5, -5.0],
    [-9.0, -5.5],
  ]
  const bushMax =
    visuals.theme === "arid"
      ? 10
      : visuals.theme === "arctic"
        ? 6
        : visuals.theme === "industrial"
          ? 4
          : 24
  const iBush2 = new THREE.InstancedMesh(
    gSph(0.28, 5),
    extBush,
    Math.min(campBushPts.length, bushMax) * 3,
  )
  let bIdx = 0
  for (let bi = 0; bi < Math.min(campBushPts.length, bushMax) && bIdx < iBush2.count; bi++) {
    const [bx, bz] = campBushPts[bi]
    for (let bj = 0; bj < 3 && bIdx < iBush2.count; bj++) {
      const ox = ((bi * 7 + bj * 3) % 7) * 0.22 - 0.33
      const oz = ((bi * 5 + bj * 4) % 7) * 0.2 - 0.3
      const sc = 0.65 + bj * 0.22
      tmpM.makeScale(sc, sc * 0.72, sc)
      tmpM.setPosition(bx + ox, 0.19 * sc, bz + oz)
      iBush2.setMatrixAt(bIdx++, tmpM)
    }
  }
  iBush2.instanceMatrix.needsUpdate = true
  iBush2.castShadow = true
  root.add(iBush2)

  // STREET LAMP POSTS — sodium-orange warm lamps
  const lampLights: THREE.PointLight[] = []
  const addLamp = (lx: number, lz: number) => {
    cyl(0.055, 0.068, 4.8, 7, extLamp, lx, 2.4, lz)
    box(1.1, 0.05, 0.05, extLamp, lx + 0.55, 4.82, lz)
    cyl(0.13, 0.11, 0.24, 7, extLamp, lx + 1.1, 4.68, lz)
    sph(0.09, 8, extBulb, lx + 1.1, 4.6, lz)
    const ll = ptL(0xffcc77, 4.2, 16, lx + 1.1, 4.52, lz)
    lampLights.push(ll)
  }
  addLamp(-15, -10)
  addLamp(15, -10)
  addLamp(-15, 5)
  addLamp(15, 5)
  addLamp(-8, -13)
  addLamp(8, -13)

  // ABANDONED CAR WRECK — crushed outside the gate
  const WRX = 9,
    WRZ = 16.6
  box(3.8, 0.65, 1.8, wrkMat, WRX, 0.33, WRZ, 0.08)
  box(2.6, 0.46, 1.6, wrkMat, WRX - 0.3, 0.82, WRZ, 0.05)
  mk(gCyl(0.35, 0.35, 0.2, 10), M.tire, WRX - 1.55, 0.17, WRZ - 0.85, 0, 0, Math.PI / 2)
  mk(gCyl(0.35, 0.35, 0.2, 10), M.tire, WRX - 1.55, 0.17, WRZ + 0.85, 0, 0, Math.PI / 2)
  mk(gCyl(0.35, 0.35, 0.2, 10), M.tire, WRX + 1.55, 0.17, WRZ - 0.85, 0, 0, Math.PI / 2)
  mk(gCyl(0.35, 0.35, 0.2, 10), M.tire, WRX + 1.55, 0.17, WRZ + 0.85, 0, 0, Math.PI / 2)
  box(1.55, 0.62, 0.06, M.glass, WRX - 0.3, 0.74, WRZ - 0.84, 0, 0, 0.28)
  pln(2.4, 1.5, M.puddle, WRX + 0.6, 0.016, WRZ + 0.7, 0.3)

  // WATER TOWER — landmark near center-left
  const WTW_X = -6,
    WTW_Z = -4
  const wLegPts: [number, number][] = [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
  ]
  wLegPts.forEach(([lx2, lz2]) => {
    mk(
      gCyl(0.07, 0.09, 5.5, 6),
      wtLegMat,
      WTW_X + lx2,
      2.75,
      WTW_Z + lz2,
      0,
      -lx2 * 0.04,
      lz2 * 0.04,
    )
  })
  box(2.55, 0.06, 0.06, wtLegMat, WTW_X, 1.1, WTW_Z - 0.9)
  box(2.55, 0.06, 0.06, wtLegMat, WTW_X, 1.1, WTW_Z + 0.9)
  box(0.06, 0.06, 2.55, wtLegMat, WTW_X - 0.9, 2.4, WTW_Z)
  box(0.06, 0.06, 2.55, wtLegMat, WTW_X + 0.9, 2.4, WTW_Z)
  box(2.8, 0.05, 0.05, wtLegMat, WTW_X, 1.75, WTW_Z, 0.78)
  box(2.8, 0.05, 0.05, wtLegMat, WTW_X, 1.75, WTW_Z, -0.78)
  box(2.15, 0.12, 0.12, wtLegMat, WTW_X, 5.55, WTW_Z - 0.9)
  box(2.15, 0.12, 0.12, wtLegMat, WTW_X, 5.55, WTW_Z + 0.9)
  box(0.12, 0.12, 2.15, wtLegMat, WTW_X - 0.9, 5.55, WTW_Z)
  box(0.12, 0.12, 2.15, wtLegMat, WTW_X + 0.9, 5.55, WTW_Z)
  cyl(1.1, 1.15, 2.2, 12, wtTankM, WTW_X, 6.9, WTW_Z)
  cyl(0, 1.12, 0.5, 12, wtTankM, WTW_X, 8.05, WTW_Z)
  cyl(1.18, 1.18, 0.08, 12, wtLegMat, WTW_X, 5.98, WTW_Z)
  cyl(1.18, 1.18, 0.08, 12, wtLegMat, WTW_X, 7.82, WTW_Z)
  cyl(0.055, 0.055, 5.6, 6, M.pipe, WTW_X + 0.82, 2.8, WTW_Z)
  for (let wr = 0; wr < 10; wr++)
    box(0.42, 0.04, 0.04, wtLegMat, WTW_X - 1.2, 0.45 + wr * 0.55, WTW_Z, 0, 0, Math.PI / 2)
  box(0.06, 1.6, 0.04, mat(0xbb3a0e, 0, 0, 0.98), WTW_X + 1.14, 6.9, WTW_Z)

  // UTILITY POLES — along left fence with sagging wire
  const upMat = mat(C.woodDark, 0, 0, 0.98, 0)
  const polePts2: [number, number][] = [
    [-19.5, -8],
    [-19.5, 2],
    [-19.5, -2.5],
  ]
  polePts2.forEach(([px, pz]) => {
    cyl(0.07, 0.09, 5.5, 6, upMat, px, 2.75, pz)
    box(1.05, 0.06, 0.06, upMat, px, 5.42, pz)
    cyl(0.04, 0.04, 0.12, 5, M.pipe, px - 0.38, 5.4, pz)
    cyl(0.04, 0.04, 0.12, 5, M.pipe, px + 0.38, 5.4, pz)
  })
  // Sagging wire between first two poles (9 segments)
  for (let wi = 0; wi < 8; wi++) {
    const wt1 = wi / 8,
      wt2 = (wi + 1) / 8
    const wy1 = 5.38 - Math.sin(wt1 * Math.PI) * 0.42
    const wy2 = 5.38 - Math.sin(wt2 * Math.PI) * 0.42
    const wz1 = -8 + wt1 * 10,
      wz2 = -8 + wt2 * 10
    const dz2 = wz2 - wz1,
      dy2 = wy2 - wy1
    const wLen = Math.sqrt(dz2 * dz2 + dy2 * dy2)
    box(
      0.018,
      0.018,
      wLen,
      mat(0x161618, 0, 0, 0.9, 0.2),
      -19.5,
      (wy1 + wy2) / 2,
      (wz1 + wz2) / 2,
      0,
      -Math.atan2(dy2, dz2),
      0,
    )
  }

  // GROUND MARKINGS — painted path guides
  const yMark = new THREE.MeshStandardMaterial({
    color: 0xccbb33,
    emissive: 0xccbb33,
    emissiveIntensity: 0.18,
    roughness: 0.96,
  })
  const rMark = new THREE.MeshStandardMaterial({
    color: 0xbb2211,
    emissive: 0xbb2211,
    emissiveIntensity: 0.14,
    roughness: 0.96,
  })
  for (let ml = 0; ml < 8; ml++) pln(0.12, 0.9, yMark, 0, 0.018, -10 + ml * 1.55)
  pln(0.5, 1.2, yMark, 0, 0.018, 11.5)
  pln(4, 0.18, rMark, 0, 0.018, 13.2)
  pln(
    2.5,
    2.5,
    new THREE.MeshBasicMaterial({ color: 0x440000, transparent: true, opacity: 0.16 }),
    -13,
    0.016,
    7.5,
  )
  for (let ds = 0; ds < 5; ds++) pln(2.5, 0.2, yMark, -1.5, 0.018, -3 + ds * 0.48, ds * 0.2 + 0.1)

  // SHIPPING CONTAINERS — stacked near left fence / warehouse
  box(6, 2.4, 2.4, ctnBlue, -16.5, 1.2, -3)
  box(6, 2.4, 2.4, ctnRed, -16.5, 3.6, -3)
  box(6, 2.4, 2.4, ctnBlue, -16.5, 1.2, -6.5)
  for (const cx4 of [-19.52, -13.48])
    for (const cz4 of [-1.78, -4.22, -5.28, -7.72]) {
      box(0.12, 2.45, 0.12, mat(C.metal, 0, 0, 0.5, 0.7), cx4, 1.22, cz4)
      box(0.12, 2.45, 0.12, mat(C.metal, 0, 0, 0.5, 0.7), cx4, 3.62, cz4)
    }
  box(5.8, 0.06, 0.06, mat(C.metal, 0, 0, 0.4, 0.6), -16.5, 0.99, -1.78)
  box(5.8, 0.06, 0.06, mat(C.metal, 0, 0, 0.4, 0.6), -16.5, 2.41, -1.78)
  box(0.06, 2.42, 0.06, mat(C.metal, 0, 0, 0.4, 0.6), -16.5, 1.21, -1.78)

  // BUILDING DETAILS — architectural enrichment on existing structures

  // HQ — flag pole with flag
  cyl(0.038, 0.05, 7.2, 6, mat(C.metal, 0, 0, 0.45, 0.7), CGX - 3.8, 3.6, CGZ + 3.8)
  box(1.55, 0.44, 0.02, mat(0x8b1a1a, 0xaa0000, 0.55), CGX - 3.05, 6.82, CGZ + 3.82)
  box(0.5, 0.44, 0.02, mat(0xcccccc, 0, 0, 0.9), CGX - 2.28, 6.82, CGZ + 3.82)
  // HQ — antenna mast + blinking light + dishes
  cyl(0.022, 0.022, 3.8, 5, mat(C.metal, 0, 0, 0.45, 0.8), CGX + 2.4, 9.75, CGZ - 0.8)
  box(1.1, 0.018, 0.018, mat(C.metal, 0, 0, 0.4, 0.7), CGX + 2.4, 10.5, CGZ - 0.8)
  box(0.018, 0.018, 0.85, mat(C.metal, 0, 0, 0.4, 0.7), CGX + 2.4, 10.2, CGZ - 0.8)
  sph(0.075, 5, mat(0xff3300, 0xff3300, 3.8), CGX + 2.4, 11.55, CGZ - 0.8)
  // satellite dish
  mk(
    new THREE.SphereGeometry(0.52, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(C.metal, 0, 0, 0.38, 0.5),
    CGX - 2.4,
    8.55,
    CGZ - 0.6,
    0,
    Math.PI * 0.28,
    0,
  )
  cyl(0.022, 0.022, 0.65, 4, mat(C.metal, 0, 0, 0.48, 0.8), CGX - 2.4, 8.2, CGZ - 0.6)
  // HQ — bollards at entrance
  for (let bo = 0; bo < 5; bo++)
    cyl(0.075, 0.085, 0.75, 8, mat(0xcc9900, 0xaa7700, 0.25), CGX - 2.0 + bo, 0.38, CGZ + 3.5)
  // HQ — security camera
  box(0.13, 0.09, 0.24, mat(C.metal, 0, 0, 0.5, 0.65), CGX + 3.58, 6.65, CGZ + 3.0, 0.24)
  mk(
    gCyl(0.022, 0.032, 0.16, 5),
    mat(0x0a0a10, 0, 0, 0.3, 0.2),
    CGX + 3.62,
    6.65,
    CGZ + 3.15,
    0,
    Math.PI / 2,
  )

  // Watchtower — searchlight + proper ladder rungs
  box(0.34, 0.2, 0.24, mat(C.metal, 0, 0, 0.48, 0.6), WTX, 8.9, WTZ + 0.22, 0.32)
  sph(0.11, 7, mat(0xffffcc, 0xffffcc, 4.0), WTX + 0.06, 8.9, WTZ + 0.4)
  cyl(0.024, 0.024, 7.6, 5, mat(C.metal, 0, 0, 0.5, 0.65), WTX + 0.35, 3.8, WTZ - 0.65)
  cyl(0.024, 0.024, 7.6, 5, mat(C.metal, 0, 0, 0.5, 0.65), WTX - 0.15, 3.8, WTZ - 0.65)
  for (let rl = 0; rl < 13; rl++)
    box(0.52, 0.028, 0.028, mat(C.metal, 0, 0, 0.55, 0.6), WTX + 0.1, 0.4 + rl * 0.58, WTZ - 0.65)

  // Warehouse — loading dock ramp + exhaust fan + roof AC
  box(5.8, 0.24, 1.85, matTex(TX.conc, C.concrete, 0, 0, 0.94), WHX + 1.2, 0.12, WHZ + 4.0)
  box(5.8, 0.06, 0.08, mat(0xffcc00, 0xaa8800, 0.22), WHX + 1.2, 0.25, WHZ + 3.1)
  for (let ds2 = 0; ds2 < 3; ds2++)
    cyl(
      0.065,
      0.075,
      0.58,
      7,
      mat(C.metal, 0, 0, 0.45, 0.6),
      WHX - 1.2 + ds2 * 1.5,
      0.29,
      WHZ + 4.92,
    )
  cyl(0.58, 0.58, 0.16, 10, mat(C.metal, 0, 0, 0.55, 0.45), WHX + 4.5, 7.22, WHZ - 0.4)
  cyl(0.46, 0.46, 0.08, 8, mat(0x0e0e0e, 0, 0, 0.9, 0), WHX + 4.5, 7.32, WHZ - 0.4)
  box(1.0, 0.55, 0.62, mat(C.metal, 0, 0, 0.52, 0.5), WHX - 2.5, 7.12, WHZ - 0.5)
  for (let p3 = 0; p3 < 3; p3++)
    cyl(
      0.03,
      0.03,
      1.1,
      5,
      mat(C.metal, 0, 0, 0.42, 0.55),
      WHX - 2.5 + (p3 - 1) * 0.28,
      7.68,
      WHZ - 0.5,
    )

  // MODULE-BASED BUILDING IDENTITIES
  // Each building owns a system role: COMANDO, ADMISIONES, RECURSOS, PERSONAL, TRASLADOS, VIGILANCIA.
  // Signs: dark board + colored emissive strip + accent glow dots.

  const modSign = (
    x: number,
    y: number,
    z: number,
    w: number,
    col: number,
    glowCol: number,
    ry = 0,
  ) => {
    box(w + 0.14, 0.72, 0.1, mat(0x0c0c0a, 0, 0, 0.98), x, y, z, ry)
    box(w, 0.56, 0.07, mat(col, glowCol, 0.58), x, y, z, ry)
    box(w * 0.88, 0.07, 0.07, mat(glowCol, glowCol, 1.6), x, y - 0.37, z, ry)
    box(w * 0.88, 0.07, 0.07, mat(glowCol, glowCol, 1.6), x, y + 0.37, z, ry)
  }

  // ── COMANDO — HQ: camp dashboard & leadership ──────────────────────
  modSign(CGX, 5.5, CGZ + 3.15, 4.0, 0x0a1830, 0x2255cc)
  // tactical map table
  box(2.6, 0.14, 1.6, mat(C.woodDark, 0, 0, 0.88), CGX, 0.72, CGZ - 0.4)
  box(2.4, 0.06, 1.4, mat(0x0a1a0a, 0x153015, 0.55), CGX, 0.8, CGZ - 0.4)
  // comms terminal
  box(0.52, 0.78, 0.28, mat(0x1a1a20, 0, 0, 0.7, 0.35), CGX + 2.85, 1.44, CGZ - 2.5)
  box(0.44, 0.32, 0.05, mat(0x0a180a, 0x0a440a, 0.55), CGX + 2.85, 1.52, CGZ - 2.24)
  // sandbag protection on entrance
  for (let sb = 0; sb < 5; sb++)
    box(0.7, 0.42, 0.44, M.sandbag, CGX - 2.1 + sb * 1.08, 0.21, CGZ + 3.65)

  // ── ADMISIONES — Gate: intake & AI decision processing ─────────────
  modSign(GTX + 3.5, 3.25, GTZ - 1.25, 3.2, 0x281800, 0xdd8800)
  // processing kiosk
  box(1.4, 2.15, 1.4, matTex(TX.conc, C.concrete, 0, 0, 0.88), GTX + 3.5, 1.08, GTZ - 1.8)
  box(1.44, 0.13, 1.44, matTex(TX.corrugat, C.metal, 0, 0, 0.6, 0.42), GTX + 3.5, 2.16, GTZ - 1.8)
  box(0.72, 0.88, 0.06, M.glass, GTX + 3.5, 1.38, GTZ - 1.08)
  // status indicators (amber = applicants pending)
  for (let si = 0; si < 3; si++)
    sph(0.08, 5, mat(0xffaa00, 0xff8800, 2.4), GTX + 2.45 + si * 0.55, 3.7, GTZ - 1.25)
  // queue poles + rope
  for (let qb = 0; qb < 5; qb++) {
    cyl(0.042, 0.042, 1.1, 5, mat(0xcc8800, 0, 0, 0.5, 0.6), GTX + 0.6 + qb * 0.9, 0.55, GTZ - 2.5)
    if (qb < 4)
      box(0.9, 0.04, 0.04, mat(0xcc6600, 0, 0, 0.55, 0.1), GTX + 1.05 + qb * 0.9, 0.65, GTZ - 2.5)
  }
  // document clipboard on post
  cyl(0.03, 0.03, 2.2, 5, mat(C.metal, 0, 0, 0.45, 0.6), GTX + 5.6, 1.1, GTZ - 2.5)
  box(0.64, 0.85, 0.04, mat(0xd8d0b0, 0, 0, 0.88), GTX + 5.6, 1.85, GTZ - 2.46)
  box(0.64, 0.06, 0.04, mat(0x884400, 0, 0, 0.75), GTX + 5.6, 2.34, GTZ - 2.46)
  // waiting benches
  for (let wb = 0; wb < 3; wb++)
    box(0.9, 0.28, 0.36, mat(C.woodDark, 0, 0, 0.92), GTX + 1.2 + wb * 1.1, 0.14, GTZ - 3.8)

  // ── RECURSOS — Warehouse: inventory & supply chain ─────────────────
  modSign(WHX + 1.2, 5.65, WHZ + 3.18, 4.2, 0x081808, 0x22aa22)
  // inventory level bars: low=red, medium=amber, high=green
  for (let bar = 0; bar < 6; bar++) {
    const bh = 0.18 + bar * 0.14
    const bc = bar < 2 ? 0xcc2211 : bar < 4 ? 0xcc8811 : 0x22aa22
    const bg = bar < 2 ? 0xaa1100 : bar < 4 ? 0xaa6600 : 0x119900
    box(0.25, bh, 0.07, mat(bc, bg, 0.5), WHX - 1.35 + bar * 0.58, 4.02 + bh * 0.5, WHZ + 3.2)
  }
  // color-coded crate stacks: green=food, red=weapons, white=medical
  const cStacks: [number, number, number, number][] = [
    [WHX + 6.9, WHZ - 2.1, 3, 0x1a5018],
    [WHX + 7.6, WHZ - 2.1, 2, 0x1a5018],
    [WHX + 6.9, WHZ - 3.6, 2, 0x7a1010],
    [WHX + 7.6, WHZ - 3.6, 3, 0x7a1010],
    [WHX + 6.9, WHZ - 5.1, 2, 0xbebeb6],
    [WHX + 7.6, WHZ - 5.1, 2, 0xbebeb6],
  ]
  cStacks.forEach(([cx, cz2, stk, cc2]) => {
    for (let ck = 0; ck < stk; ck++)
      box(0.7, 0.64, 0.7, mat(cc2, 0, 0, 0.84), cx, 0.32 + ck * 0.65, cz2)
  })
  // color marker tabs on crate stacks
  box(0.06, 0.4, 0.55, mat(0x22aa22, 0x0a8a0a, 0.4), WHX + 6.52, 0.56, WHZ - 2.1)
  box(0.06, 0.4, 0.55, mat(0xcc2211, 0xaa1100, 0.4), WHX + 6.52, 0.56, WHZ - 3.6)
  box(0.06, 0.4, 0.55, mat(0xdddddd, 0xaaaaaa, 0.3), WHX + 6.52, 0.56, WHZ - 5.1)

  // ── PERSONAL — Barracks: person roster & status tracking ───────────
  modSign(APX, 5.65, APZ + 2.68, 4.0, 0x0a1428, 0x2266cc)
  // roster board on post
  cyl(0.032, 0.036, 2.6, 5, mat(C.metal, 0, 0, 0.45, 0.65), APX - 5.8, 1.3, APZ + 2.9)
  box(1.3, 1.75, 0.06, mat(0x0e1420, 0x1a2a44, 0.52), APX - 5.8, 1.55, APZ + 2.9)
  // status dot legend: active (green), exploring (amber), injured (red)
  const personDots: [number, number][] = [
    [0x22bb22, 0x11aa11],
    [0x22bb22, 0x11aa11],
    [0x22bb22, 0x11aa11],
    [0xcc8811, 0xaa6600],
    [0xcc8811, 0xaa6600],
    [0xcc2222, 0xaa1100],
  ]
  personDots.forEach(([dc, dg], di) => {
    sph(0.07, 5, mat(dc, dg, 1.8), APX - 6.2, 1.85 - di * 0.22, APZ + 2.9)
  })
  // bunk frame suggestion (outside under awning)
  for (let bk = 0; bk < 3; bk++) {
    box(1.1, 0.12, 2.2, mat(C.woodDark, 0, 0, 0.9), APX - 2.4 + bk * 1.5, 0.46, APZ - 2.5)
    for (const leg of [-1.0, 1.0]) {
      cyl(
        0.04,
        0.04,
        0.46,
        4,
        mat(C.metal, 0, 0, 0.45, 0.6),
        APX - 2.4 + bk * 1.5 + leg * 0.5,
        0.23,
        APZ - 3.5,
      )
      cyl(
        0.04,
        0.04,
        0.46,
        4,
        mat(C.metal, 0, 0, 0.45, 0.6),
        APX - 2.4 + bk * 1.5 + leg * 0.5,
        0.23,
        APZ - 1.5,
      )
    }
  }
  // uniform/equipment rack
  box(2.2, 1.25, 0.12, mat(C.metal, 0, 0, 0.45, 0.55), APX + 5.3, 1.68, APZ + 2.65)
  for (let uf = 0; uf < 5; uf++)
    mk(
      gCyl(0.018, 0.018, 0.48, 4),
      mat(C.metal, 0, 0, 0.5, 0.5),
      APX + 4.1 + uf * 0.46,
      2.0,
      APZ + 2.6,
      0,
      Math.PI / 2,
    )

  // ── TRASLADOS — Garage: inter-camp transfer dispatch ───────────────
  modSign(GJX, 5.25, GJZ + 2.9, 3.6, 0x1a1600, 0xddcc00)
  // dispatch board on post
  cyl(0.03, 0.035, 2.6, 5, mat(C.metal, 0, 0, 0.45, 0.65), GJX + 5.2, 1.3, GJZ - 0.5)
  box(1.45, 1.85, 0.05, mat(0x141408, 0x303010, 0.5), GJX + 5.2, 1.52, GJZ - 0.5)
  // departure status dots: green=ready, amber=loading, grey=idle
  const deptDots: [number, number][] = [
    [0x22cc22, 0x11aa11],
    [0xddcc00, 0xbbaa00],
    [0x888888, 0x555555],
    [0x888888, 0x555555],
  ]
  deptDots.forEach(([dc2, dg2], di2) => {
    sph(0.065, 5, mat(dc2, dg2, 1.8), GJX + 4.55, 1.9 - di2 * 0.36, GJZ - 0.5)
  })
  // cargo staging pallets
  for (let cp = 0; cp < 2; cp++)
    box(1.45, 0.1, 1.0, mat(C.woodDark, 0, 0, 0.92), GJX + 4.0, 0.05 + cp * 0.12, GJZ - 3.2)
  box(1.1, 0.75, 0.82, matTex(TX.corrugat, C.metal, 0, 0, 0.7, 0.3), GJX + 4.0, 0.52, GJZ - 3.2)
  // fuel barrels
  for (let fb = 0; fb < 4; fb++)
    cyl(
      0.22,
      0.24,
      0.88,
      10,
      mat(fb % 2 === 0 ? 0x882200 : 0x222244, 0, 0, 0.72),
      GJX + 6.4 + (fb % 2) * 0.55,
      0.44,
      GJZ + Math.floor(fb / 2) * 0.65 - 0.25,
    )

  // ── VIGILANCIA — Watchtower: security & monitoring ─────────────────
  modSign(WTX + 0.5, 3.65, WTZ - 0.68, 2.2, 0x200808, 0xcc2222, -Math.PI / 2)
  // guard station bulletin at base
  cyl(0.03, 0.03, 1.85, 5, mat(C.metal, 0, 0, 0.45, 0.6), WTX + 2.6, 0.93, WTZ - 1.0)
  box(0.88, 1.25, 0.05, mat(0x0e0e08, 0x2a2010, 0.5), WTX + 2.6, 1.12, WTZ - 0.96)
  sph(0.1, 6, mat(0xff2200, 0xff1100, 3.5), WTX + 2.6, 2.17, WTZ - 0.96)
  // corner guard posts at fence (Guardia profession stations)
  const guardPosts2: [number, number, number][] = [
    [18.2, -13.5, Math.PI * 1.25],
    [-18.2, -13.5, Math.PI * 0.75],
    [18.2, 12.3, Math.PI * 1.75],
  ]
  guardPosts2.forEach(([gpx, gpz, gpry]) => {
    box(1.65, 2.2, 1.65, matTex(TX.conc, C.concrete, 0, 0, 0.88), gpx, 1.1, gpz)
    box(1.75, 0.12, 1.75, matTex(TX.corrugat, C.metal, 0, 0, 0.62, 0.42), gpx, 2.22, gpz)
    box(0.68, 0.85, 0.06, M.glass, gpx + Math.sin(gpry) * 0.84, 1.26, gpz + Math.cos(gpry) * 0.84)
    for (let sb = 0; sb < 4; sb++)
      box(
        0.76,
        0.4,
        0.42,
        M.sandbag,
        gpx + Math.sin(gpry + Math.PI) * 0.72 + (sb - 1.5) * 0.8,
        0.2,
        gpz + Math.cos(gpry + Math.PI) * 0.72,
        gpry,
      )
    sph(0.08, 5, mat(0xcc2200, 0xaa1100, 2.8), gpx, 2.55, gpz)
  })

  // IVY / CLIMBING PLANTS on building exteriors (temperate + industrial only)
  if (visuals.theme === "temperate" || visuals.theme === "industrial") {
    const ivyPts: [number, number, number, number, number][] = [
      [CGX - 3.5, 1.2, CGZ + 3.04, 0.9, 0],
      [CGX - 3.5, 2.8, CGZ + 3.04, 0.7, 0],
      [CGX + 3.2, 0.8, CGZ + 3.04, 0.65, 0],
      [CGX + 3.2, 2.1, CGZ + 3.04, 0.55, 0],
      [CGX - 3.9, 1.5, CGZ - 3.04, 0.8, Math.PI],
      [APX - 3.8, 2.2, APZ + 2.59, 0.7, 0],
      [APX - 1.4, 4.5, APZ + 2.59, 0.55, 0],
      [APX + 1.2, 3.0, APZ + 2.59, 0.6, 0],
      [APX + 3.6, 1.8, APZ + 2.59, 0.5, 0],
    ]
    ivyPts.forEach(([ix, iy, iz, isc, iry]) => {
      const im = new THREE.Mesh(new THREE.PlaneGeometry(isc * 0.95, isc * 1.45), ivyMat)
      im.position.set(ix, iy, iz)
      im.rotation.y = iry
      root.add(im)
    })
  }

  // MOSS CARPET along inner fence base
  const mossFenceGeo = gSph(0.1, 4)
  const iMossF = new THREE.InstancedMesh(mossFenceGeo, mat(C.grass, 0, 0, 1.0, 0), 60)
  for (let mi = 0; mi < 60; mi++) {
    const side = mi % 2 === 0 ? -19.1 : 19.1
    const mz3 = (Math.random() - 0.5) * 27
    const ms3 = 0.55 + Math.random() * 0.75
    tmpM.makeScale(ms3, ms3 * 0.38, ms3)
    tmpM.setPosition(side + (Math.random() - 0.5) * 0.5, 0.04 * ms3, mz3)
    iMossF.setMatrixAt(mi, tmpM)
  }
  iMossF.instanceMatrix.needsUpdate = true
  root.add(iMossF)

  // CAMP ENTRANCE SIGN — above gate
  box(5.5, 0.55, 0.1, mat(0x1a1208, 0, 0, 0.98), 0, 4.5, 14.05)
  box(5.6, 0.62, 0.06, mat(0xcc9922, 0xbb8811, 0.35), 0, 4.5, 14.1)
  box(5.52, 0.12, 0.08, mat(0xcc3311, 0xaa2200, 0.4), 0, 4.2, 14.05)
  box(5.52, 0.12, 0.08, mat(0xcc3311, 0xaa2200, 0.4), 0, 4.8, 14.05)

  // ---- LIGHTING — driven by per-camp theme ----
  // Hemisphere light gives realistic sky/ground separation (sky color from above, ground bounce from below)
  const hemi = new THREE.HemisphereLight(L.moonColor, L.ambientColor, L.ambientIntensity * 0.55)
  root.add(hemi)
  root.add(new THREE.AmbientLight(L.ambientColor, L.ambientIntensity * 0.65))
  const moon = new THREE.DirectionalLight(L.moonColor, L.moonIntensity)
  moon.position.set(5, 20, 8)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  moon.shadow.camera.left = -45
  moon.shadow.camera.right = 45
  moon.shadow.camera.top = 45
  moon.shadow.camera.bottom = -45
  moon.shadow.camera.far = 110
  moon.shadow.bias = -0.002
  root.add(moon)
  const skyBounce = new THREE.DirectionalLight(L.skyColor, L.skyIntensity)
  skyBounce.position.set(-8, 15, -5)
  root.add(skyBounce)
  // Warm front fill — subtler, preserves perf
  const fillFront = new THREE.DirectionalLight(0xffcc88, 0.28)
  fillFront.position.set(2, 10, 30)
  root.add(fillFront)
  // Zone color fills
  ptL(0xff1100, 1.2, 20, -11, 5, -2)
  ptL(0x33cc22, 0.9, 15, 0, 5, -5)
  ptL(0xffbb00, 1.1, 17, 10, 5, 4)
  // Building glow from lit windows
  ptL(0xffcc66, 0.6, 14, -12, 4, -16)
  ptL(0xccddaa, 0.4, 12, 13, 5, -16)

  // ---- PARTICLES ----
  // Ambient dust/spores
  const PC = 120
  const pGeo = new THREE.BufferGeometry()
  const pPos = new Float32Array(PC * 3)
  const pV = new Float32Array(PC * 3)
  for (let pi = 0; pi < PC; pi++) {
    pPos[pi * 3] = (Math.random() - 0.5) * 40
    pPos[pi * 3 + 1] = Math.random() * 7 + 0.2
    pPos[pi * 3 + 2] = (Math.random() - 0.5) * 30
    pV[pi * 3] = (Math.random() - 0.5) * 0.008
    pV[pi * 3 + 1] = Math.random() * 0.003 + 0.001
    pV[pi * 3 + 2] = (Math.random() - 0.5) * 0.008
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3))
  const parts = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0x88cc99,
      size: 0.07,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    }),
  )
  root.add(parts)

  // Fire embers — orange/red sparks rising from fire pit
  const embrN = 60
  const embrGeo = new THREE.BufferGeometry()
  const embrPos = new Float32Array(embrN * 3)
  const embrV = new Float32Array(embrN * 3)
  for (let ei = 0; ei < embrN; ei++) {
    embrPos[ei * 3] = -3 + (Math.random() - 0.5) * 0.6
    embrPos[ei * 3 + 1] = 0.4 + Math.random() * 3.5
    embrPos[ei * 3 + 2] = 8 + (Math.random() - 0.5) * 0.6
    embrV[ei * 3] = (Math.random() - 0.5) * 0.018
    embrV[ei * 3 + 1] = 0.022 + Math.random() * 0.018
    embrV[ei * 3 + 2] = (Math.random() - 0.5) * 0.018
  }
  embrGeo.setAttribute("position", new THREE.BufferAttribute(embrPos, 3))
  const embers = new THREE.Points(
    embrGeo,
    new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    }),
  )
  root.add(embers)

  // Fire smoke particles
  const smkN = 55
  const smkGeo = new THREE.BufferGeometry()
  const smkPos = new Float32Array(smkN * 3)
  const smkV = new Float32Array(smkN * 3)
  for (let si = 0; si < smkN; si++) {
    smkPos[si * 3] = -3 + (Math.random() - 0.5) * 0.6
    smkPos[si * 3 + 1] = 0.5 + Math.random() * 4
    smkPos[si * 3 + 2] = 8 + (Math.random() - 0.5) * 0.6
    smkV[si * 3] = (Math.random() - 0.5) * 0.006
    smkV[si * 3 + 1] = 0.012 + Math.random() * 0.01
    smkV[si * 3 + 2] = (Math.random() - 0.5) * 0.005
  }
  smkGeo.setAttribute("position", new THREE.BufferAttribute(smkPos, 3))
  const smoke = new THREE.Points(
    smkGeo,
    new THREE.PointsMaterial({
      color: 0x606055,
      size: 0.42,
      transparent: true,
      opacity: 0.22,
      sizeAttenuation: true,
    }),
  )
  root.add(smoke)

  // Kitchen chimney smoke — both chimneys
  const ksmkN = 50
  const ksmkGeo = new THREE.BufferGeometry()
  const ksmkPos = new Float32Array(ksmkN * 3)
  const ksmkV = new Float32Array(ksmkN * 3)
  const ksmkSrcs = [
    [4.4, 5.7, 9.3],
    [5.9, 5.0, 9.3],
  ]
  for (let ki = 0; ki < ksmkN; ki++) {
    const src = ksmkSrcs[ki % 2]
    ksmkPos[ki * 3] = src[0] + (Math.random() - 0.5) * 0.5
    ksmkPos[ki * 3 + 1] = src[1] + Math.random() * 3.5
    ksmkPos[ki * 3 + 2] = src[2] + (Math.random() - 0.5) * 0.4
    ksmkV[ki * 3] = (Math.random() - 0.5) * 0.005
    ksmkV[ki * 3 + 1] = 0.013 + Math.random() * 0.009
    ksmkV[ki * 3 + 2] = (Math.random() - 0.5) * 0.003
  }
  ksmkGeo.setAttribute("position", new THREE.BufferAttribute(ksmkPos, 3))
  const ksmoke = new THREE.Points(
    ksmkGeo,
    new THREE.PointsMaterial({
      color: 0x707068,
      size: 0.38,
      transparent: true,
      opacity: 0.2,
      sizeAttenuation: true,
    }),
  )
  root.add(ksmoke)

  // ---- MUSGO GLOBAL EN FACHADAS (P1 — naturaleza reconquistando) ----
  const mossGeo = new THREE.PlaneGeometry(0.05, 0.6)
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x2d3d1a,
    roughness: 1,
    side: THREE.DoubleSide,
  })
  // Tramos de fachada [x1, z1, x2, z2] sobre los que brota el musgo.
  const mossWalls: [number, number, number, number][] = [
    [-3.5, -6.95, 3.5, -6.95], // CG frente
    [-3.5, -13.05, 3.5, -13.05], // CG atrás
    [-17.5, 7.07, -8.5, 7.07], // nave frente
    [-17.97, 1.5, -17.97, 6.5], // nave lateral
    [6, -3.42, 14, -3.42], // apartamentos frente
    [14.53, -8, 14.53, -4], // apartamentos lateral
    [10, 12.06, 17, 12.06], // garaje frente
    [9.47, 5.5, 9.47, 11.5], // garaje lateral
    [9.5, 3.78, 14.5, 3.78], // armería frente
    [-6.8, 13.42, -5.2, 13.42], // garita
  ]
  const MOSS_N = 140
  const iMoss = new THREE.InstancedMesh(mossGeo, mossMat, MOSS_N)
  for (let mi = 0; mi < MOSS_N; mi++) {
    const wSeg = mossWalls[mi % mossWalls.length]
    const mu = Math.random()
    const mwx = wSeg[0] + (wSeg[2] - wSeg[0]) * mu
    const mwz = wSeg[1] + (wSeg[3] - wSeg[1]) * mu
    tmpM.makeRotationY(Math.abs(wSeg[2] - wSeg[0]) < 0.01 ? Math.PI / 2 : 0)
    tmpM.setPosition(mwx, 0.4 + Math.random() * 1.9, mwz)
    iMoss.setMatrixAt(mi, tmpM)
  }
  iMoss.instanceMatrix.needsUpdate = true
  root.add(iMoss)

  // ---- ANIMACIONES PROGRAMADAS (exploración y traslado) ----
  const tmpV = new THREE.Vector3()
  const tmpV2 = new THREE.Vector3()

  // Figuras humanoides (torso + cabeza + 4 extremidades) que caminan de la
  // torre al gate cuando se crea una exploración. Genera incertidumbre: no
  // sabes si vuelven.
  const figMat = mat(0x3a3a35, 0, 0, 0.95, 0)
  const exploFigures: THREE.Group[] = []
  for (let fgi = 0; fgi < 3; fgi++) {
    const fig = new THREE.Group()
    const torso = new THREE.Mesh(gBox(0.32, 0.62, 0.2), figMat)
    torso.position.y = 0.78
    const head = new THREE.Mesh(gCyl(0.1, 0.11, 0.22, 6), figMat)
    head.position.y = 1.2
    fig.add(torso, head)
    for (const [lmx, lmy] of [
      [-0.1, 0.24],
      [0.1, 0.24],
      [-0.24, 0.78],
      [0.24, 0.78],
    ]) {
      const limb = new THREE.Mesh(gBox(0.09, 0.45, 0.09), figMat)
      limb.position.set(lmx, lmy, 0)
      fig.add(limb)
    }
    fig.visible = false
    root.add(fig)
    exploFigures.push(fig)
  }
  const exploCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-15.5, 0, 11.5),
    new THREE.Vector3(-11, 0, 12.2),
    new THREE.Vector3(-5, 0, 11.4),
    new THREE.Vector3(0, 0, 14.4),
  ])
  let exploStart = -1
  let exploQueued = false
  // Modo del reflector de la torre, fijado por los datos reactivos:
  // 'sweep' (sin exploración activa), 'gate' (in_progress) u 'overdue' (vencida).
  let watchtowerMode: WatchtowerMode = "sweep"
  const playExplorationAnimation = () => {
    exploQueued = true
  }
  const setWatchtowerMode = (mode: WatchtowerMode) => {
    watchtowerMode = mode
  }

  // Camión de traslado (oculto hasta playTransferAnimation).
  const truckGroup = new THREE.Group()
  const tkBody = new THREE.Mesh(gBox(2, 1.2, 4), mat(0x6b5030, 0, 0, 0.92, 0.15))
  tkBody.position.set(0, 1.3, -0.6)
  const tkCab = new THREE.Mesh(gBox(1.8, 1.0, 1.9), mat(0x5a4528, 0, 0, 0.9, 0.15))
  tkCab.position.set(0, 1.1, 1.9)
  const tkGlass = new THREE.Mesh(gBox(1.5, 0.45, 0.08), M.glass)
  tkGlass.position.set(0, 1.35, 2.86)
  truckGroup.add(tkBody, tkCab, tkGlass)
  for (const [twx, twz] of [
    [-0.85, 1.2],
    [0.85, 1.2],
    [-0.85, -1.6],
    [0.85, -1.6],
  ]) {
    const wheel = new THREE.Mesh(gCyl(0.45, 0.45, 0.25, 10), M.tire)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(twx, 0.45, twz)
    truckGroup.add(wheel)
  }
  const tkLight = new THREE.PointLight(0xddddff, 0, 20)
  tkLight.position.set(0, 1.1, 2.6)
  truckGroup.add(tkLight)
  truckGroup.visible = false
  root.add(truckGroup)
  const transferCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(15.3, 0, 8.5),
    new THREE.Vector3(15.3, 0, 12.6),
    new THREE.Vector3(8, 0, 13.2),
    new THREE.Vector3(1, 0, 14.6),
  ])
  let transferStart = -1
  let transferQueued = false
  const playTransferAnimation = () => {
    transferQueued = true
  }

  // ---- TAG BUILDING MESHES (raycaster targets) ----
  const buildingMeshes: THREE.Object3D[] = []
  const tagBuilding = (mesh: THREE.Mesh, id: string, name: string) => {
    mesh.name = name
    // Clonamos el material para que el highlight de hover no contamine otros
    // meshes que compartan el material original.
    const cloned = (mesh.material as THREE.MeshStandardMaterial).clone()
    mesh.material = cloned
    const data: BuildingUserData = {
      type: "building",
      id,
      baseEmissiveIntensity: cloned.emissiveIntensity ?? 0,
    }
    mesh.userData = data
    buildingMeshes.push(mesh)
  }
  tagBuilding(hqMesh, "hq", "hq_mesh")
  tagBuilding(gateMesh, "gate", "gate_mesh")
  tagBuilding(barracksMesh, "barracks", "barracks_mesh")
  tagBuilding(watchtowerMesh, "watchtower", "watchtower_mesh")
  tagBuilding(warehouseMesh, "warehouse", "warehouse_mesh")
  tagBuilding(garageMesh, "garage", "garage_mesh")

  // ---- ANIMATE (per-frame) ----
  const animate = (t: number) => {
    // Cuartel General: la bandera ondea y el generador vibra levemente.
    cgFlag.rotation.z = Math.sin(t * 1.2) * 0.08
    cgGenerator.position.y = cgGenBaseY + Math.sin(t * 48) * 0.002
    // Apartamentos: la ropa tendida oscila y las ventanas iluminadas titilan.
    aptClothes.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 0.8 + i * 1.3) * 0.12
    })
    aptWinLit.emissiveIntensity = 0.9 + Math.sin(t * 3.5) * 0.08
    // Garita: la lámpara de emergencia parpadea suavemente (siempre encendida).
    gtLamp.intensity = 2.0 + Math.sin(t * 5) * 0.22 + Math.sin(t * 11) * 0.1
    // Almacén: la luz interior cálida fluctúa muy levemente (generador propio).
    whLight.intensity = 3.0 + Math.sin(t * 1.8) * 0.22
    zoneLights.forEach((zl, i) => {
      zl.l.intensity = zl.b * (0.82 + Math.sin(t * 2.0 + i * 2.1) * 0.18)
    })
    const ff = 3.8 + Math.sin(t * 8.7) * 0.9 + Math.sin(t * 16.3) * 0.5 + Math.sin(t * 31.7) * 0.2
    fireP.intensity = ff
    fireP.color.setHSL(0.065 + Math.sin(t * 4.5) * 0.015, 1, 0.52)
    fireP2.intensity = ff * 0.7 + Math.sin(t * 11) * 0.4
    kFireL.intensity = 2.5 + Math.sin(t * 7.2) * 0.6 + Math.sin(t * 13.5) * 0.3
    toxL.intensity = 1.6 + Math.sin(t * 2.8) * 0.6
    genL.intensity = 0.5 + Math.sin(t * 48) * 0.15

    // ANIMACIÓN DE SALIDA (exploración): 3 figuras caminan de la torre al
    // gate por la curva, el reflector las sigue y desaparecen al cruzar.
    if (exploQueued) {
      exploQueued = false
      exploStart = t
      exploFigures.forEach((f) => (f.visible = true))
    }
    if (exploStart >= 0) {
      const ep = (t - exploStart) / 4
      if (ep >= 1.3) {
        exploStart = -1
        exploFigures.forEach((f) => (f.visible = false))
      } else {
        exploFigures.forEach((f, i) => {
          const fu = Math.min(Math.max(ep * 1.15 - i * 0.07, 0), 1)
          if (fu >= 1) {
            f.visible = false
            return
          }
          exploCurve.getPoint(fu, tmpV)
          f.position.set(tmpV.x, Math.abs(Math.sin(t * 9 + i * 2)) * 0.05, tmpV.z)
          exploCurve.getPoint(Math.min(fu + 0.02, 1), tmpV2)
          f.lookAt(tmpV2.x, f.position.y, tmpV2.z)
        })
        if (exploFigures[0].visible) {
          spot1.target.position.set(exploFigures[0].position.x, 0, exploFigures[0].position.z)
          spot1.target.updateMatrixWorld()
        }
      }
    }
    if (exploStart < 0) {
      // Sin animación de salida en curso: el reflector reacciona a los datos.
      if (watchtowerMode === "sweep") {
        spot1.target.position.x = Math.sin(t * 0.22) * 14
        spot1.target.position.z = Math.cos(t * 0.22) * 10
        spot1.intensity = 12
      } else {
        // 'gate'/'overdue' → apunta fijo a la salida del campamento; 'overdue'
        // además parpadea para señalar urgencia.
        spot1.target.position.set(0, 0, 14.4)
        spot1.intensity = watchtowerMode === "overdue" ? 9 + Math.abs(Math.sin(t * 4)) * 8 : 12
      }
      spot1.target.updateMatrixWorld()
    }

    // ANIMACIÓN DE TRASLADO: puerta basculante sube (1.5s), faros encienden
    // (0.5-1s), el camión avanza al gate (3s), se encoge al salir y la puerta
    // se cierra al final. Duración total ~6.5s.
    if (transferQueued) {
      transferQueued = false
      transferStart = t
      truckGroup.visible = true
      truckGroup.scale.setScalar(1)
      transferCurve.getPoint(0, tmpV)
      truckGroup.position.copy(tmpV)
      truckGroup.lookAt(tmpV.x, 0, tmpV.z + 1)
    }
    if (transferStart >= 0) {
      const tk = t - transferStart
      if (tk <= 1.5) {
        const prog = tk / 1.5
        gjDoorPivot.rotation.x = (-Math.PI / 2) * prog
        portonPivotR.rotation.y = (Math.PI / 2) * prog
        portonPivotL.rotation.y = -(Math.PI / 2) * prog
      } else if (tk >= 5) {
        const prog = Math.max(1 - (tk - 5) / 1.5, 0)
        gjDoorPivot.rotation.x = (-Math.PI / 2) * prog
        portonPivotR.rotation.y = (Math.PI / 2) * prog
        portonPivotL.rotation.y = -(Math.PI / 2) * prog
      }
      tkLight.intensity = truckGroup.visible ? Math.min(Math.max((tk - 0.5) / 0.5, 0), 1) * 8 : 0
      if (tk >= 1.5 && tk < 4.5) {
        const tu = (tk - 1.5) / 3
        transferCurve.getPoint(tu, tmpV)
        truckGroup.position.copy(tmpV)
        transferCurve.getPoint(Math.min(tu + 0.02, 1), tmpV2)
        truckGroup.lookAt(tmpV2.x, 0, tmpV2.z)
        if (tu > 0.85) truckGroup.scale.setScalar(Math.max(1 - (tu - 0.85) / 0.15, 0.001))
      }
      if (tk >= 4.5 && truckGroup.visible) truckGroup.visible = false
      if (tk >= 6.5) transferStart = -1
    }

    lampLights.forEach((ll, li) => {
      ll.intensity = 3.8 + Math.sin(t * 1.1 + li * 1.8) * 0.3 + Math.sin(t * 4.7 + li * 0.9) * 0.15
    })

    spot2.target.position.x = Math.sin(t * 0.29 + 1.8) * 12
    spot2.target.position.z = Math.cos(t * 0.29 + 1.8) * 9
    spot2.target.updateMatrixWorld()

    for (let pi = 0; pi < PC; pi++) {
      pPos[pi * 3] += pV[pi * 3]
      pPos[pi * 3 + 1] += pV[pi * 3 + 1]
      pPos[pi * 3 + 2] += pV[pi * 3 + 2]
      if (pPos[pi * 3 + 1] > 7) {
        pPos[pi * 3] = (Math.random() - 0.5) * 42
        pPos[pi * 3 + 1] = 0.2
        pPos[pi * 3 + 2] = (Math.random() - 0.5) * 32
      }
      if (Math.abs(pPos[pi * 3]) > 21) pV[pi * 3] *= -1
      if (Math.abs(pPos[pi * 3 + 2]) > 16) pV[pi * 3 + 2] *= -1
    }
    pGeo.attributes.position.needsUpdate = true

    for (let si2 = 0; si2 < smkN; si2++) {
      smkPos[si2 * 3] += smkV[si2 * 3]
      smkPos[si2 * 3 + 1] += smkV[si2 * 3 + 1]
      if (smkPos[si2 * 3 + 1] > 5) {
        smkPos[si2 * 3] = -3 + (Math.random() - 0.5) * 0.5
        smkPos[si2 * 3 + 1] = 0.5
      }
    }
    smkGeo.attributes.position.needsUpdate = true

    for (let ki2 = 0; ki2 < ksmkN; ki2++) {
      ksmkPos[ki2 * 3] += ksmkV[ki2 * 3]
      ksmkPos[ki2 * 3 + 1] += ksmkV[ki2 * 3 + 1]
      if (ksmkPos[ki2 * 3 + 1] > 10) {
        const src2 = ksmkSrcs[ki2 % 2]
        ksmkPos[ki2 * 3] = src2[0] + (Math.random() - 0.5) * 0.5
        ksmkPos[ki2 * 3 + 1] = src2[1]
        ksmkPos[ki2 * 3 + 2] = src2[2] + (Math.random() - 0.5) * 0.4
      }
    }
    ksmkGeo.attributes.position.needsUpdate = true

    // Embers — drift upward with slight turbulence, reset when too high
    for (let ei2 = 0; ei2 < embrN; ei2++) {
      embrPos[ei2 * 3] += embrV[ei2 * 3] * (0.9 + Math.sin(t * 3.7 + ei2) * 0.2)
      embrPos[ei2 * 3 + 1] += embrV[ei2 * 3 + 1]
      embrPos[ei2 * 3 + 2] += embrV[ei2 * 3 + 2] * (0.9 + Math.cos(t * 2.9 + ei2) * 0.2)
      if (embrPos[ei2 * 3 + 1] > 5.5) {
        embrPos[ei2 * 3] = -3 + (Math.random() - 0.5) * 0.6
        embrPos[ei2 * 3 + 1] = 0.4
        embrPos[ei2 * 3 + 2] = 8 + (Math.random() - 0.5) * 0.6
      }
    }
    embrGeo.attributes.position.needsUpdate = true
  }

  // ---- DISPOSE ----
  const dispose = () => {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = (mesh as THREE.Mesh).material
      if (Array.isArray(material)) material.forEach((mm) => mm.dispose())
      else if (material) (material as THREE.Material).dispose()
      const maybeLight = obj as unknown as { isLight?: boolean; dispose?: () => void }
      if (maybeLight.isLight && typeof maybeLight.dispose === "function") maybeLight.dispose()
    })
    scene.remove(root)
  }

  return {
    animate,
    dispose,
    buildingMeshes,
    playExplorationAnimation,
    playTransferAnimation,
    setWatchtowerMode,
    reactiveRefs: {
      hqFlag: cgFlag,
      hqInteriorLight: cgInteriorLight,
      gateBarrierArm: gtBarrierArm,
      gateEmergencyLamp: gtLamp,
      watchtowerSpot: spot1,
      warehouseLight: whLight,
      warehouseAlertLight: whAlertLight,
      garageDoor: gjDoorPivot,
      apartmentsLitWindows: aptWinLit,
    },
  }
}
