import * as THREE from "three"

import type { BuildingUserData, SceneHandles } from "../types/scene.types"

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
export function buildCampScene(scene: THREE.Scene): SceneHandles {
  const root = new THREE.Group()
  root.name = "camp-root"
  scene.add(root)

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

  // Pre-built shared mats
  const M = {
    ground: mat(0x1a2010),
    dirt: mat(0x2a1e0e),
    mud: mat(0x1a1008),
    grass: mat(0x162e0c),
    wood: mat(0x3d2e1e, 0, 0, 0.98, 0),
    woodD: mat(0x241710, 0, 0, 0.98, 0),
    plank: mat(0x4a3525, 0, 0, 0.97, 0),
    metal: mat(0x2a2a30, 0, 0, 0.6, 0.7),
    rust: mat(0x7a3518, 0, 0, 0.95, 0.15),
    rust2: mat(0xa04820, 0, 0, 0.9, 0.1),
    brl_g: mat(0x1e3818, 0x002200, 0.08),
    brl_r: mat(0x481808, 0x280000, 0.08),
    brl_y: mat(0x383008, 0x180a00, 0.06),
    tire: mat(0x101010, 0, 0, 1, 0),
    sandbag: mat(0x524830),
    corrugat: mat(0x686858, 0, 0, 0.7, 0.3),
    corrugD: mat(0x404030, 0, 0, 0.75, 0.3),
    brick: mat(0x5a3825, 0, 0, 0.97, 0),
    chain: mat(0x707060, 0, 0, 0.5, 0.7),
    pipe: mat(0x383840, 0, 0, 0.4, 0.6),
    wireH: mat(0x909070, 0, 0, 0.5, 0.5),
    gravel: mat(0x2e2c28),
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
  // Grass - instanced
  const grassGeo = new THREE.PlaneGeometry(0.06, 0.55)
  const grassMat = mat(0x162e0c)
  const iGrass = new THREE.InstancedMesh(grassGeo, grassMat, 200)
  iGrass.receiveShadow = true
  for (let gi = 0; gi < 200; gi++) {
    const gx = (Math.random() - 0.5) * 36
    const gz = (Math.random() - 0.5) * 28
    const gy = 0.275 + Math.random() * 0.15
    tmpM.makeRotationY(Math.random() * Math.PI)
    tmpM.setPosition(gx, gy, gz)
    iGrass.setMatrixAt(gi, tmpM)
  }
  iGrass.instanceMatrix.needsUpdate = true
  root.add(iGrass)

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
  const whRoof = mat(0x505048, 0, 0, 0.78, 0.3)
  const whDoor = mat(0x404040, 0, 0, 0.55, 0.6)
  const whTank = mat(0x6b3520, 0, 0, 0.92, 0.12)
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
  const cgConcrete = mat(0x4a4a45, 0, 0, 0.95, 0) // concreto envejecido
  const cgBrick = mat(0x5a3825, 0, 0, 0.97, 0) // ladrillo desgastado (torre)
  const cgRoof = mat(0x383830, 0, 0, 0.98, 0) // techo plano manchado
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
  const gtWood = mat(0x3d2e1e, 0, 0, 0.98, 0)
  const gtRoof = mat(0x6b3520, 0, 0, 0.95, 0.15)
  const gtBarrier = mat(0x7a3518, 0, 0, 0.95, 0.2)
  const gtSign = mat(0xcc1111, 0xcc1111, 0.3)
  const gtStripe = mat(0xffcc00, 0xffcc00, 0.3)
  const gtChair = mat(0x404040, 0, 0, 0.9, 0.3)

  const GTX = -6
  const GTZ = 12.5
  // Cuerpo de la caseta + techo inclinado de chapa.
  const gateMesh = box(1.8, 2.5, 1.8, gtWood, GTX, 1.25, GTZ)
  box(1.9, 0.15, 1.9, gtRoof, GTX, 2.6, GTZ, 0, 0, 0.08)
  // Ventana lateral deslizable (hacia el camino) + puerta frontal angosta.
  box(0.65, 0.55, 0.12, M.glass, GTX + 0.91, 1.55, GTZ, Math.PI / 2)
  box(0.6, 1.8, 0.12, gtWood, GTX, 0.9, GTZ + 0.91)
  // Tablilla de registro en la pared y silla oxidada visible por el vidrio.
  box(0.5, 0.5, 0.04, gtWood, GTX - 0.88, 1.5, GTZ, Math.PI / 2)
  box(0.35, 0.6, 0.35, gtChair, GTX - 0.2, 0.3, GTZ - 0.2)
  // Letreros de advertencia pintados a mano.
  box(0.3, 0.4, 0.06, gtSign, GTX, 1.9, GTZ + 0.92)
  box(0.3, 0.4, 0.06, gtSign, GTX + 0.92, 1.0, GTZ - 0.4, Math.PI / 2)

  // Barrera vehicular abatible sobre la entrada. El brazo vive en un grupo con
  // pivote en el poste para poder animar rotation.z (sube/baja con admisiones).
  cyl(0.05, 0.06, 2.5, 6, gtBarrier, GTX + 2.2, 1.25, GTZ + 0.5)
  cyl(0.05, 0.06, 1.9, 6, gtBarrier, GTX + 5.7, 0.95, GTZ + 0.5)
  const gtBarrierArm = new THREE.Group()
  gtBarrierArm.position.set(GTX + 2.2, 1.9, GTZ + 0.5)
  const gtArm = new THREE.Mesh(gBox(3.5, 0.08, 0.1), gtBarrier)
  gtArm.position.x = 1.75
  gtArm.castShadow = true
  gtBarrierArm.add(gtArm)
  for (let gsi = 0; gsi < 3; gsi++) {
    const stripe = new THREE.Mesh(gBox(0.55, 0.085, 0.105), gtStripe)
    stripe.position.x = 0.5 + gsi * 1.1
    gtBarrierArm.add(stripe)
  }
  root.add(gtBarrierArm)

  // Lámpara de emergencia interior (parpadeará con admisiones PENDING).
  cyl(0.04, 0.04, 0.8, 5, M.metal, GTX, 2.0, GTZ)
  sph(0.1, 7, mat(0xff9933, 0xff9933, 3.0), GTX, 1.6, GTZ)
  const gtLamp = ptL(0xffaa44, 2.0, 5, GTX, 1.7, GTZ)

  // Sacos de arena apilados en las esquinas + musgo + escombros.
  const gtCorners: [number, number][] = [
    [GTX - 0.8, GTZ - 0.8],
    [GTX + 0.8, GTZ - 0.8],
    [GTX - 0.8, GTZ + 0.8],
    [GTX + 0.8, GTZ + 0.8],
  ]
  gtCorners.forEach(([cx, cz]) => {
    box(0.6, 0.26, 0.36, M.sandbag, cx, 0.13, cz)
    box(0.6, 0.26, 0.36, M.sandbag, cx, 0.39, cz, 0.2)
  })
  box(0.04, 0.5, 0.04, cgMoss, GTX - 0.9, 1.0, GTZ + 0.4)
  box(0.04, 0.5, 0.04, cgMoss, GTX + 0.9, 1.2, GTZ - 0.3)
  for (let gdi = 0; gdi < 3; gdi++)
    box(
      0.1,
      0.08,
      0.08,
      M.gravel,
      GTX + 1 + Math.random() * 2,
      0.05,
      GTZ + Math.random() * 1.5,
      Math.random() * Math.PI,
    )

  // 3. ARMORY (decorativa; en el Paso 07 será el locker del worker-soldado)
  box(6, 3, 4.5, M.corrugat, 12, 1.5, 3)
  box(6.2, 0.1, 4.7, M.corrugD, 12, 3.06, 3)
  box(6.6, 0.06, 5, M.tarp, 12, 3.38, 3, 0, 0, 0.07)
  box(1.4, 2.2, 0.1, M.metal, 12, 1.1, 5.28)
  box(0.9, 0.9, 0.9, M.plank, 11, 0.45, 3)
  box(0.9, 0.9, 0.9, M.plank, 11, 1.35, 3)
  box(0.9, 0.9, 0.9, M.plank, 12, 0.45, 3)
  cyl(0.35, 0.36, 0.92, 8, M.brl_g, 14.5, 0.46, 1)
  cyl(0.35, 0.36, 0.92, 8, M.brl_g, 15.2, 0.46, 1)
  cyl(0.35, 0.36, 0.92, 8, M.brl_r, 14.5, 0.46, 2)

  // 4. TORRE DE VIGILANCIA (Paso 04 — Exploraciones, estilo TLoU2)
  // Torre de madera reforzada de ~6.5m: 4 postes inclinados, plataforma con
  // parapetos y sacos, techo inclinado, escalera de mano, reflector articulado
  // (spot1: hace sweep en reposo y sigue a las figuras de la exploración),
  // cuerdas tensadas, bitácora y binoculares en la plataforma.
  const wtPost = mat(0x3d2e1e, 0, 0, 0.98, 0)
  const wtPlat = mat(0x2a1e10, 0, 0, 0.99, 0)
  const wtRoofM = mat(0x4a3020, 0, 0, 0.98, 0)
  const wtParap = mat(0x3a2818, 0, 0, 0.98, 0)
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
  const aptBrick = mat(0x5a3825, 0, 0, 0.97, 0)
  const aptRoof = mat(0x383830, 0, 0, 0.98, 0)
  const aptBoard = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    transparent: true,
    opacity: 0.7,
    roughness: 0.95,
  })
  const aptBalcony = mat(0x2a2a30, 0, 0, 0.6, 0.5)
  const aptStairs = mat(0x6b3520, 0, 0, 0.95, 0.15)
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

  // 7. KITCHEN
  box(6, 2.5, 0.1, M.plank, 6, 1.25, 12)
  box(0.1, 2.5, 2.2, M.plank, 3.1, 1.25, 11)
  box(0.1, 2.5, 2.2, M.plank, 8.9, 1.25, 11)
  box(6.2, 0.1, 2.4, M.corrugat, 6, 2.56, 11)
  cyl(0.4, 0.45, 0.6, 8, M.rust, 5, 0.3, 11)
  cyl(0.4, 0.45, 0.6, 8, M.rust, 6.2, 0.3, 11)
  sph(0.16, 8, mat(0xff6600, 0xff4400, 5.5), 5.6, 0.78, 11)
  sph(0.08, 6, mat(0xffcc00, 0xffbb00, 6.5), 5.6, 0.9, 11)
  const kFireL = ptL(0xff5500, 3.5, 8, 5.6, 1.0, 11)
  box(2.5, 0.8, 0.8, M.wood, 6, 0.4, 11.2)
  cyl(0.28, 0.28, 0.35, 7, M.metal, 6, 0.95, 11.2)

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
  sbRow(-8, 2, 5, 0, 2)
  sbRow(4, -4, 4, Math.PI / 2, 2)
  sbRow(-4, -8, 6, 0.3, 1)
  sbRow(12, -2, 4, Math.PI / 2, 3)
  sbRow(-13, -6, 5, 0, 2)
  sbRow(0, 13, 6, 0, 2)
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
    [-5, 3, M.brl_r],
    [-4.2, 3, M.brl_r],
    [-5, 4.2, M.brl_g],
    [6, 1.5, M.brl_g],
    [6.8, 1.5, M.brl_y],
    [14, -2, M.brl_r],
    [14.8, -2, M.brl_r],
    [-14, -3, M.brl_y],
    [-13.3, -3, M.brl_g],
    [-14.8, -4, M.brl_r],
    [2, -9, M.brl_g],
    [2.8, -9, M.brl_g],
    [3.6, -9.4, M.brl_y],
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
    [0, -10],
    [1, -10.4],
    [-1, -9.8],
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
  const gjWall = mat(0x404038, 0, 0, 0.88, 0.22)
  const gjRoof = mat(0x383830, 0, 0, 0.65, 0.45)
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
  cyl(0.4, 0.5, 0.14, 8, mat(0x2a2a20), 0, 0.07, 11.5)
  sph(0.13, 7, mat(0xff6600, 0xff4400, 5.0), 0, 0.32, 11.5)
  const fireP2 = ptL(0xff5500, 3.0, 8, 0, 0.6, 11.5)

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

  // ---- LIGHTING - REALISTIC DARK NIGHT ----
  root.add(new THREE.AmbientLight(0x0c1410, 1.15))
  const moon = new THREE.DirectionalLight(0x8899bb, 1.45)
  moon.position.set(5, 20, 8)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  moon.shadow.camera.left = -30
  moon.shadow.camera.right = 30
  moon.shadow.camera.top = 30
  moon.shadow.camera.bottom = -30
  moon.shadow.camera.far = 80
  moon.shadow.bias = -0.002
  root.add(moon)
  const skyBounce = new THREE.DirectionalLight(0x334455, 0.25)
  skyBounce.position.set(-8, 15, -5)
  root.add(skyBounce)
  // Zone color fills
  ptL(0xff1100, 1.2, 20, -11, 5, -2)
  ptL(0x33cc22, 0.9, 15, 0, 5, -5)
  ptL(0xffbb00, 1.1, 17, 10, 5, 4)
  // Building glow from lit windows
  ptL(0xffcc66, 0.6, 14, -12, 4, -16)
  ptL(0xccddaa, 0.4, 12, 13, 5, -16)

  // ---- PARTICLES ----
  const PC = 200
  const pGeo = new THREE.BufferGeometry()
  const pPos = new Float32Array(PC * 3)
  const pV = new Float32Array(PC * 3)
  for (let pi = 0; pi < PC; pi++) {
    pPos[pi * 3] = (Math.random() - 0.5) * 42
    pPos[pi * 3 + 1] = Math.random() * 6 + 0.2
    pPos[pi * 3 + 2] = (Math.random() - 0.5) * 32
    pV[pi * 3] = (Math.random() - 0.5) * 0.009
    pV[pi * 3 + 1] = Math.random() * 0.003 + 0.001
    pV[pi * 3 + 2] = (Math.random() - 0.5) * 0.009
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3))
  const parts = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0x66bb88,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    }),
  )
  root.add(parts)

  // Fire smoke particles
  const smkN = 60
  const smkGeo = new THREE.BufferGeometry()
  const smkPos = new Float32Array(smkN * 3)
  const smkV = new Float32Array(smkN * 3)
  for (let si = 0; si < smkN; si++) {
    smkPos[si * 3] = -3 + (Math.random() - 0.5) * 0.5
    smkPos[si * 3 + 1] = 0.5 + Math.random() * 3
    smkPos[si * 3 + 2] = 8 + (Math.random() - 0.5) * 0.5
    smkV[si * 3] = (Math.random() - 0.5) * 0.005
    smkV[si * 3 + 1] = 0.015 + Math.random() * 0.01
    smkV[si * 3 + 2] = (Math.random() - 0.5) * 0.004
  }
  smkGeo.setAttribute("position", new THREE.BufferAttribute(smkPos, 3))
  const smoke = new THREE.Points(
    smkGeo,
    new THREE.PointsMaterial({
      color: 0x555550,
      size: 0.32,
      transparent: true,
      opacity: 0.18,
      sizeAttenuation: true,
    }),
  )
  root.add(smoke)

  // Kitchen smoke
  const ksmkN = 40
  const ksmkGeo = new THREE.BufferGeometry()
  const ksmkPos = new Float32Array(ksmkN * 3)
  const ksmkV = new Float32Array(ksmkN * 3)
  for (let ki = 0; ki < ksmkN; ki++) {
    ksmkPos[ki * 3] = 5.6 + (Math.random() - 0.5) * 0.4
    ksmkPos[ki * 3 + 1] = 1.0 + Math.random() * 2.5
    ksmkPos[ki * 3 + 2] = 11 + (Math.random() - 0.5) * 0.4
    ksmkV[ki * 3] = (Math.random() - 0.5) * 0.004
    ksmkV[ki * 3 + 1] = 0.014 + Math.random() * 0.008
    ksmkV[ki * 3 + 2] = 0
  }
  ksmkGeo.setAttribute("position", new THREE.BufferAttribute(ksmkPos, 3))
  const ksmoke = new THREE.Points(
    ksmkGeo,
    new THREE.PointsMaterial({
      color: 0x666660,
      size: 0.25,
      transparent: true,
      opacity: 0.14,
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
    [9.5, 5.27, 14.5, 5.27], // armería frente
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
  const playExplorationAnimation = () => {
    exploQueued = true
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
      // Sweep automático del reflector cuando no hay salida en curso.
      spot1.target.position.x = Math.sin(t * 0.22) * 14
      spot1.target.position.z = Math.cos(t * 0.22) * 10
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
      if (tk <= 1.5) gjDoorPivot.rotation.x = (-Math.PI / 2) * (tk / 1.5)
      else if (tk >= 5) gjDoorPivot.rotation.x = (-Math.PI / 2) * Math.max(1 - (tk - 5) / 1.5, 0)
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
      if (ksmkPos[ki2 * 3 + 1] > 4) {
        ksmkPos[ki2 * 3] = 5.6 + (Math.random() - 0.5) * 0.4
        ksmkPos[ki2 * 3 + 1] = 1.0
      }
    }
    ksmkGeo.attributes.position.needsUpdate = true
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
