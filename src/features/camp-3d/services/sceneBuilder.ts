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
    dirt: mat(0x2e1e0e),
    mud: mat(0x1a1008),
    grass: mat(0x162e0c),
    wood: mat(0x4a3020),
    woodD: mat(0x2a1508),
    plank: mat(0x5a3820),
    metal: mat(0x404050, 0, 0, 0.5, 0.5),
    rust: mat(0x6a2e10, 0, 0, 0.95, 0.1),
    rust2: mat(0x4a1e08),
    brl_g: mat(0x1e3818, 0x002200, 0.08),
    brl_r: mat(0x481808, 0x280000, 0.08),
    brl_y: mat(0x383008, 0x180a00, 0.06),
    tire: mat(0x101010, 0, 0, 1, 0),
    sandbag: mat(0x524830),
    corrugat: mat(0x686858, 0, 0, 0.7, 0.3),
    corrugD: mat(0x404030, 0, 0, 0.75, 0.3),
    brick: mat(0x6a3820),
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
    tarp: mat(0x283c28, 0, 0, 1),
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
  const gateMesh = box(10.6, 0.16, 0.2, M.wood, 0, 3.8, 14)
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

  // 1. MEDICAL HUT (mapeado a "Almacén" / warehouse en buildings.config)
  const warehouseMesh = box(5, 3.2, 4, M.medWall, -14, 1.6, 4)
  box(5.2, 0.1, 4.2, M.corrugat, -14, 3.26, 4)
  box(1.5, 0.4, 0.12, mat(0xcc1111, 0xaa0000, 1.2), -14, 2.3, 6.07)
  box(0.4, 1.5, 0.12, mat(0xcc1111, 0xaa0000, 1.2), -14, 2.3, 6.07)
  box(0.9, 2.4, 0.12, M.woodD, -14, 1.2, 6.09)
  box(0.9, 0.7, 0.12, mat(0xeeffcc, 0xccffaa, 0.5, 0.1), -11.56, 1.9, 4)
  ptL(0xaaffcc, 2.0, 7, -14, 1.5, 4)
  cyl(0.025, 0.025, 1.8, 5, M.metal, -12.4, 0.9, 5.6)
  box(0.55, 0.04, 0.04, M.metal, -12.4, 1.82, 5.6)
  box(0.75, 0.25, 1.9, mat(0xaaaaaa), -14.4, 0.25, 3.5)
  box(0.75, 0.25, 1.9, mat(0xaaaaaa), -13.4, 0.25, 3.5)
  cyl(0.035, 0.035, 2.5, 5, M.metal, -11.2, 1.25, 6.6)
  box(1.3, 0.45, 0.1, mat(0xcc1111, 0xaa0000, 0.6), -11.2, 2.7, 6.6)

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
  ptL(0xff9944, 2.5, 10, CGX, 2.5, CGZ)
  ptL(0x334422, 0.6, 6, CGX, 3, CGZ + 4)

  // 3. ARMORY
  const armoryMesh = box(6, 3, 4.5, M.corrugat, 12, 1.5, 3)
  box(6.2, 0.1, 4.7, M.corrugD, 12, 3.06, 3)
  box(6.6, 0.06, 5, M.tarp, 12, 3.38, 3, 0, 0, 0.07)
  box(1.4, 2.2, 0.1, M.metal, 12, 1.1, 5.28)
  box(0.9, 0.9, 0.9, M.plank, 11, 0.45, 3)
  box(0.9, 0.9, 0.9, M.plank, 11, 1.35, 3)
  box(0.9, 0.9, 0.9, M.plank, 12, 0.45, 3)
  cyl(0.35, 0.36, 0.92, 8, M.brl_g, 14.5, 0.46, 1)
  cyl(0.35, 0.36, 0.92, 8, M.brl_g, 15.2, 0.46, 1)
  cyl(0.35, 0.36, 0.92, 8, M.brl_r, 14.5, 0.46, 2)

  // 4. WATCHTOWER
  const wtp = [
    [-15.75, 11.25],
    [-15.75, 9.75],
    [-18.25, 11.25],
    [-18.25, 9.75],
  ]
  wtp.forEach((p) => cyl(0.11, 0.14, 4.8, 6, M.wood, p[0], 2.4, p[1]))
  box(3.5, 0.28, 3.5, M.wood, -17, 4.24, 11)
  box(3.5, 0.08, 0.08, M.wood, -17, 4.5, 9.76)
  box(3.5, 0.08, 0.08, M.wood, -17, 4.5, 12.24)
  box(0.08, 0.08, 2.5, M.wood, -15.76, 4.5, 11)
  box(0.08, 0.08, 2.5, M.wood, -18.24, 4.5, 11)
  const watchtowerMesh = box(4.4, 0.18, 4.4, M.woodD, -17, 5.2, 11, 0.07)
  for (let si = 0; si < 5; si++)
    box(0.65, 0.28, 0.38, M.sandbag, -15.75, 4.58, -15.75 + si * 0.7 + 11.25)
  box(0.04, 4.2, 0.04, M.wood, -16.0, 2.1, 12.3)
  box(0.04, 4.2, 0.04, M.wood, -16.4, 2.1, 12.3)
  for (let li = 0; li < 5; li++) box(0.04, 0.04, 0.42, M.wood, -16.2, 0.8 + li * 0.78, 12.3)
  box(0.4, 0.25, 0.5, M.metal, -17, 5.5, 11, 0.2)
  sph(0.12, 7, mat(0xffffff, 0xffffff, 3.5), -17, 5.65, 10.8)
  const spot1 = new THREE.SpotLight(0xdde8ff, 12, 45, Math.PI / 9, 0.2, 2)
  spot1.position.set(-17, 5.4, 11)
  spot1.target.position.set(0, 0, 0)
  spot1.castShadow = false
  root.add(spot1)
  root.add(spot1.target)

  // 5. BARRACKS
  const barracksMesh = box(7, 2.6, 4, M.plank, 10, -0.2, -6)
  box(7.2, 0.1, 4.2, M.corrugat, 10, 2.56, -6)
  box(1.0, 2.0, 0.1, M.woodD, 6.55, 1.0, -6)
  for (let bi = 0; bi < 3; bi++) {
    box(0.8, 0.3, 1.9, mat(0x3a2a18), 8.5 + bi * 1.8, 0.3, -6, 0.04)
    box(0.8, 0.12, 0.38, mat(0x6a5040), 8.5 + bi * 1.8, 0.44, -7)
  }
  box(0.9, 0.6, 0.1, mat(0x334455, 0x223344, 0.3, 0.1), 13.5, 1.5, -6)
  ptL(0xffaa66, 1.0, 6, 10, 1.4, -6)
  box(0.04, 0.04, 8, M.rope, 10, 2.5, -3.75, Math.PI / 2)
  for (let cl = 0; cl < 5; cl++)
    box(0.22, 0.35, 0.02, mat(0x3a2a1a + cl * 0x020202), 7.5 + cl * 1.4, 2.28, -3.75)

  // 6. RADIO STATION
  const radioMesh = box(3, 2.8, 2.8, mat(0x3a4450), 0, 1.4, 9)
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

  // 8. FUEL DEPOT
  const fuelMesh = box(4, 2.2, 3, M.corrugat, -8, -0.4, -8)
  box(4.2, 0.1, 3.2, M.corrugD, -8, 2.09, -8)
  cyl(0.35, 0.36, 0.92, 8, M.brl_y, -9.2, 0.46, -8)
  cyl(0.35, 0.36, 0.92, 8, M.brl_y, -8.4, 0.46, -8)
  cyl(0.35, 0.36, 0.92, 8, M.brl_r, -9.2, 0.46, -9)
  box(4.1, 0.08, 0.08, mat(0xffdd00, 0xffcc00, 0.5), -8, 0.8, -6.6)
  box(4.1, 0.08, 0.08, mat(0xffdd00, 0xffcc00, 0.5), -8, 1.4, -6.6)
  box(0.65, 0.65, 0.1, mat(0xffdd00, 0xffcc00, 0.3), -8, 1.9, -6.6)

  // ---- ZONE MARKERS ----
  const zoneData = [
    { x: 0, z: -5, col: 0x44ff44, ec: 0x00cc00, gM: glowG },
    { x: -11, z: 2, col: 0xff3333, ec: 0xcc0000, gM: glowR },
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
  chFence(-7, -1, 10, Math.PI / 2)
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
  sbRow(8, -4, 4, Math.PI / 2, 2)
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
    [13, 9],
    [13, 9.3],
    [14, 9],
    [14, 9.3],
    [14, 9.6],
    [13.5, 8.8],
    [16, 5],
    [16, 5.3],
    [-16, 4],
    [-16, 4.3],
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
    [12, -7],
    [12.8, -6.5],
    [0, -10],
    [1, -10.4],
    [-1, -9.8],
    [-4, 10],
    [-3.2, 10.4],
    [14, 10],
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

  // ---- WRECKED CAR (mapeado a "Camión" / truck) ----
  const truckMesh = box(3.5, 0.9, 1.8, M.rust, 15, 0.45, 7, -0.15)
  box(1.8, 0.8, 1.7, M.rust2, 15.5, 1.0, 7, -0.15)
  box(1.5, 0.6, 0.12, M.glass, 16.15, 1.1, 7.1, -0.15)
  ;[
    [14, 6],
    [16.2, 6],
    [14, 8],
    [16.2, 8],
  ].forEach((p) => mk(gCyl(0.42, 0.42, 0.22, 10), M.tire, p[0], 0.22, p[1]))

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
  lantern(-14, 3.0, 6.5, 0xffeedd)
  lantern(0, 3.5, -7.5, 0xaaffaa)
  lantern(10, 3.2, 3.0, 0xffddaa)
  lantern(6, 3.0, 11.5, 0xffcc88)
  lantern(-3, 3.2, 9.5, 0x44ff88)

  // Laundry line
  box(0.03, 0.03, 14, M.rope, 0, 2.92, -12.5, Math.PI / 2)
  for (let li2 = 0; li2 < 6; li2++)
    box(0.22, 0.35, 0.02, mat(0x3a2a1a + li2 * 0x030303), (li2 - 2.5) * 1.5, 2.65, -12.5)

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

  // Spotlight tower (mapeado a "Torre de Mando" / command_tower)
  cyl(0.1, 0.13, 5.5, 7, M.metal, 16, 2.75, -12)
  const commandTowerMesh = box(0.7, 0.32, 0.55, M.metal, 16, 5.5, -12)
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
  root.add(new THREE.AmbientLight(0x060c08, 1.0))
  const moon = new THREE.DirectionalLight(0x8899bb, 1.2)
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
  ptL(0xff1100, 1.2, 20, -11, 5, 2)
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
  tagBuilding(warehouseMesh, "warehouse", "warehouse_mesh")
  tagBuilding(watchtowerMesh, "watchtower", "watchtower_mesh")
  tagBuilding(gateMesh, "gate", "gate_mesh")
  tagBuilding(barracksMesh, "barracks", "barracks_mesh")
  tagBuilding(hqMesh, "hq", "hq_mesh")
  tagBuilding(commandTowerMesh, "command_tower", "command_tower_mesh")
  tagBuilding(armoryMesh, "armory", "armory_mesh")
  tagBuilding(fuelMesh, "fuel_depot", "fuel_mesh")
  tagBuilding(radioMesh, "radio", "radio_mesh")
  tagBuilding(truckMesh, "truck", "truck_mesh")

  // ---- ANIMATE (per-frame) ----
  const animate = (t: number) => {
    // Cuartel General: la bandera ondea y el generador vibra levemente.
    cgFlag.rotation.z = Math.sin(t * 1.2) * 0.08
    cgGenerator.position.y = cgGenBaseY + Math.sin(t * 48) * 0.002
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
    spot1.target.position.x = Math.sin(t * 0.22) * 14
    spot1.target.position.z = Math.cos(t * 0.22) * 10
    spot1.target.updateMatrixWorld()
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

  return { animate, dispose, buildingMeshes }
}
