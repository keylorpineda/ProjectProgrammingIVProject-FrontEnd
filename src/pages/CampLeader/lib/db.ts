// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Person, 
  Profession, 
  Exploration, 
  Transfer, 
  ResourceItem, 
  Inventory, 
  InventoryMovement, 
  CampBalance,
  Camp,
  CampStatistics
} from '../types';

// Storage keys
const DB_PREFIX = 'DOOMSDAY_SYS_';
const KEYS = {
  CAMPS: DB_PREFIX + 'CAMPS',
  PROFESSIONS: DB_PREFIX + 'PROFESSIONS',
  PERSONS: DB_PREFIX + 'PERSONS',
  RESOURCES: DB_PREFIX + 'RESOURCES',
  INVENTORIES: DB_PREFIX + 'INVENTORIES',
  EXPLORATIONS: DB_PREFIX + 'EXPLORATIONS',
  TRANSFERS: DB_PREFIX + 'TRANSFERS',
  MOVEMENTS: DB_PREFIX + 'MOVEMENTS',
};

// Help simulate delay
export const simulateLatency = <T>(data: T, delayMs: number = 400): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
};

// --- INITIAL SEED SEED DATA ---
const INITIAL_CAMPS: Camp[] = [
  { id: 1, name: "REFUGIO ALFA (BÚNKER CENTRAL)", location: "SECTOR DE LA COSTA GRIS", survival_score: 1200 },
  { id: 2, name: "LA CANTERA (SILO DE SUMINISTROS)", location: "REBAJO ROCOSO DE SION", survival_score: 850 },
  { id: 3, name: "ESTACIÓN ÉPSILON (PUESTO DE AVANZADA)", location: "ZONA SUR DE ESCORIAS", survival_score: 550 },
];

const INITIAL_PROFESSIONS: Profession[] = [
  { id: 1, name: "RASTREADOR DE RUINAS", description: "ESPECIALISTA EN ENTRAR A ZONAS ALTAMENTE RADIACTIVAS." },
  { id: 2, name: "MÉDICO DE COMBATE", description: "ESTABILIZA EXCURSIONISTAS HERIDOS Y SUTURA EN EL CAMPO." },
  { id: 3, name: "MECÃNICO DE CHATARRA", description: "REPARA VEHÍCULOS DE ASALTO Y HERRAMIENTAS MECÃNICAS." },
  { id: 4, name: "SOLDADO DE DEFENSA", description: "SEGURIDAD ARMADA CONTRA MUTANTES Y CARROÑEROS." },
  { id: 5, name: "SABIO QUÍMICO", description: "FILTRADO DE AGUAS ÃCIDAS Y CONTROL DE INGREDIENTES QUÍMICOS." },
];

const INITIAL_RESOURCES: ResourceItem[] = [
  { id: 1, name: "RACIONES DE COMBALIDA", unit: "LATA", category: "food" },
  { id: 2, name: "AGUA DESPERCUDIDA", unit: "LITRO", category: "water" },
  { id: 3, name: "KIT MÉDICO ESTRELLA", unit: "KIT", category: "medicine" },
  { id: 4, name: "REPUESTOS DE VEHÍCULO", unit: "UNIDAD", category: "tools" },
  { id: 5, name: "MUNICIÓN 9MM COBRE", unit: "CORTUCHERA", category: "weapons" },
];

const INITIAL_PERSONS = (professions: Profession[]): Person[] => {
  const findProf = (id: number) => professions.find(p => p.id === id) || professions[0];
  return [
    {
      id: 101,
      first_name: "MARCUS",
      last_name: "VANCE",
      profession_id: 1,
      status: "active",
      can_work: true,
      experience_level: 4,
      experience_points: 340,
      expeditionsSurvived: 12,
      previous_skills: "FUE RASTREADOR MILITAR EN EL DESIERTO NEGRO EN 2024.",
      photo_url: "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=150&auto=format&fit=crop",
      profession: findProf(1),
    },
    {
      id: 102,
      first_name: "ELENA",
      last_name: "ROSTOVA",
      profession_id: 2,
      status: "active",
      can_work: true,
      experience_level: 5,
      experience_points: 490,
      expeditionsSurvived: 24,
      previous_skills: "CIRUJANA CARDÍACA. ESPECIALISTA EN TOXINAS MUTANTES.",
      photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop",
      profession: findProf(2),
    },
    {
      id: 103,
      first_name: "KALEB",
      last_name: "DEXTER",
      profession_id: 3,
      status: "active",
      can_work: true,
      experience_level: 3,
      experience_points: 210,
      expeditionsSurvived: 7,
      previous_skills: "SOLDADOR ELÉCTRICO SUBMARINO Y FORJADOR DE RIFLES.",
      photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
      profession: findProf(3),
    },
    {
      id: 104,
      first_name: "SARAH",
      last_name: "KERRIGAN",
      profession_id: 4,
      status: "active",
      can_work: true,
      experience_level: 5,
      experience_points: 520,
      expeditionsSurvived: 31,
      previous_skills: "EX-TTE. DE INFANTERÍA PESADA. PUNTERÍA ABSOLUTA CON FUSIL.",
      photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop",
      profession: findProf(4),
    },
    {
      id: 105,
      first_name: "ALEXANDER",
      last_name: "FINCH",
      profession_id: 5,
      status: "sick",
      can_work: false,
      experience_level: 2,
      experience_points: 120,
      expeditionsSurvived: 3,
      previous_skills: "EXPERT IN BIO-RECONSTRUCTION AND DISTILLER OF ACID SLUDGE.",
      photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop",
      profession: findProf(5),
    },
    {
      id: 106,
      first_name: "RAMÓN",
      last_name: "GÓMEZ",
      profession_id: 1,
      status: "injured",
      can_work: false,
      experience_level: 3,
      experience_points: 180,
      expeditionsSurvived: 9,
      previous_skills: "CONOCEDOR DETALLADO DEL METRO INUNDADO Y TÚNELES ALFA.",
      photo_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop",
      profession: findProf(1),
    },
    {
      id: 107,
      first_name: "DIANA",
      last_name: "SHARP",
      profession_id: 4,
      status: "active",
      can_work: true,
      experience_level: 2,
      experience_points: 95,
      expeditionsSurvived: 2,
      previous_skills: "NATIVA DEL SUBTERRÃNEO. SENTIDO AGUDO CONTRA ASALTIADOS.",
      photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
      profession: findProf(4),
    },
  ];
};

const INITIAL_INVENTORIES: Inventory[] = [
  // Camp 1 (our camp)
  { camp_id: 1, resource_id: 1, current_quantity: 450, minimum_stock_required: 200, alert_active: false, resource: INITIAL_RESOURCES[0] },
  { camp_id: 1, resource_id: 2, current_quantity: 80, minimum_stock_required: 150, alert_active: true, resource: INITIAL_RESOURCES[1] }, // CRITICAL WARNING
  { camp_id: 1, resource_id: 3, current_quantity: 42, minimum_stock_required: 30, alert_active: false, resource: INITIAL_RESOURCES[2] },
  { camp_id: 1, resource_id: 4, current_quantity: 15, minimum_stock_required: 10, alert_active: false, resource: INITIAL_RESOURCES[3] },
  { camp_id: 1, resource_id: 5, current_quantity: 600, minimum_stock_required: 500, alert_active: false, resource: INITIAL_RESOURCES[4] },
  // Camp 2
  { camp_id: 2, resource_id: 1, current_quantity: 280, minimum_stock_required: 100, alert_active: false, resource: INITIAL_RESOURCES[0] },
  { camp_id: 2, resource_id: 2, current_quantity: 420, minimum_stock_required: 100, alert_active: false, resource: INITIAL_RESOURCES[1] },
  { camp_id: 2, resource_id: 3, current_quantity: 10, minimum_stock_required: 20, alert_active: true, resource: INITIAL_RESOURCES[2] },
  // Camp 3
  { camp_id: 3, resource_id: 1, current_quantity: 50, minimum_stock_required: 80, alert_active: true, resource: INITIAL_RESOURCES[0] },
  { camp_id: 3, resource_id: 2, current_quantity: 75, minimum_stock_required: 80, alert_active: true, resource: INITIAL_RESOURCES[1] },
];

const INITIAL_EXPLORATIONS = (persons: Person[], camps: Camp[]): Exploration[] => {
  const findCamp = (id: number) => camps.find(c => c.id === id) || camps[0];
  const findPerson = (id: number) => persons.find(p => p.id === id) || persons[0];

  return [
    {
      id: 501,
      camp_id: 1,
      name: "BÚSQUEDA DE COMBUSTIBLE EN METRO CERO",
      destination_description: "ESTACIÓN INDUSTRIAL SUBTERRÃNEA BAJO ESCOMBROS RADIACTIVOS.",
      departure_date: "2026-05-20T08:00:00Z",
      estimated_days: 4,
      grace_days: 2,
      status: "in_progress",
      notes: "CUIDADO CON FILTRACIONES ÃCIDAS EN NIVEL B3.",
      explorationPersons: [
        { exploration_id: 501, person_id: 101, is_leader: true, return_confirmed: false, person: findPerson(101) },
        { exploration_id: 501, person_id: 103, is_leader: false, return_confirmed: false, person: findPerson(103) },
      ],
      explorationResources: [
        { exploration_id: 501, resource_id: 1, quantity: 20, resource: INITIAL_RESOURCES[0] },
        { exploration_id: 501, resource_id: 2, quantity: 15, resource: INITIAL_RESOURCES[1] },
      ],
      camp: findCamp(1),
    },
    {
      id: 502,
      camp_id: 1,
      name: "RECONOCIMIENTO DEL SILO ABANDONADO",
      destination_description: "BÚNKER DE LA COMPAÑÍA DAWNTECH AL NORTE.",
      departure_date: "2026-05-25T06:00:00Z",
      estimated_days: 3,
      grace_days: 1,
      status: "scheduled",
      notes: "POSIBLE HÃBITAT DE CARROÑEROS AGRESIVOS. LLEVAR DEFENSA PESADA.",
      explorationPersons: [
        { exploration_id: 502, person_id: 104, is_leader: true, return_confirmed: false, person: findPerson(104) },
        { exploration_id: 502, person_id: 107, is_leader: false, return_confirmed: false, person: findPerson(107) },
      ],
      explorationResources: [
        { exploration_id: 502, resource_id: 1, quantity: 15, resource: INITIAL_RESOURCES[0] },
        { exploration_id: 502, resource_id: 2, quantity: 10, resource: INITIAL_RESOURCES[1] },
      ],
      camp: findCamp(1),
    },
    {
      id: 503,
      camp_id: 1,
      name: "RECOLECCIÓN SÉPTICA EN LA PLANTA QUÍMICA",
      destination_description: "PLANTA DE PROCESADO DE SULFATOS CERCA AL PUERTO GRIS.",
      departure_date: "2026-05-15T07:00:00Z",
      estimated_days: 2,
      grace_days: 1,
      real_return_date: "2026-05-17T15:30:00Z",
      status: "completed",
      notes: "EXITOSA RECOLECCIÓN DE ADITIVOS DE RE-FILTRACIÓN.",
      explorationPersons: [
        { exploration_id: 503, person_id: 101, is_leader: true, return_confirmed: true, person: findPerson(101) },
      ],
      explorationResources: [
        { exploration_id: 503, resource_id: 1, quantity: 8, resource: INITIAL_RESOURCES[0] },
      ],
      camp: findCamp(1),
    }
  ];
};

const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: 901,
    origin_camp_id: 2,
    destination_camp_id: 1,
    resource_id: 2, // Agua desperate needed in Alfa (80 vs 150)
    quantity: 120,
    status: "pending",
    requested_by_user_id: 1,
    notes: "NUESTRO INVENTARIO DE AGUA ESTÃ POR DEBAJO DEL MÍNIMO ESTABLECIDO.",
    resource: INITIAL_RESOURCES[1],
    origin_camp: INITIAL_CAMPS[1],
    destination_camp: INITIAL_CAMPS[0]
  },
  {
    id: 902,
    origin_camp_id: 1,
    destination_camp_id: 3,
    resource_id: 1, // Comida from Alfa to control post
    quantity: 50,
    status: "in_transit",
    requested_by_user_id: 3,
    notes: "APOYO ALIMENTARIO ADICIONAL DE EMERGENCIA.",
    resource: INITIAL_RESOURCES[0],
    origin_camp: INITIAL_CAMPS[0],
    destination_camp: INITIAL_CAMPS[2]
  },
  {
    id: 903,
    origin_camp_id: 2,
    destination_camp_id: 1,
    resource_id: 3, // Medicine
    quantity: 15,
    status: "completed",
    requested_by_user_id: 1,
    approved_by_user_id: 2,
    notes: "REABSTECIMIENTO DE KITS MÉDICOS TRAS EPIDEMIA INVERNAL.",
    resource: INITIAL_RESOURCES[2],
    origin_camp: INITIAL_CAMPS[1],
    destination_camp: INITIAL_CAMPS[0]
  }
];

const INITIAL_MOVEMENTS: InventoryMovement[] = [
  { id: 1001, camp_id: 1, resource_id: 1, quantity: -40, type: 'consumo_diario', notes: 'RACIONES DIARIAS DE COMIDA PARA LA POBLACIÓN.', created_at: '2026-05-22T20:00:00Z' },
  { id: 1002, camp_id: 1, resource_id: 2, quantity: -50, type: 'consumo_diario', notes: 'CONSUMO BÚNKER COSTA GRIS.', created_at: '2026-05-22T21:00:00Z' },
  { id: 1003, camp_id: 1, resource_id: 3, quantity: 15, type: 'transfer_arrive', notes: 'LLEGADA DE CARGAMENTO DE TRASLADO DESDE SILO SION.', created_at: '2026-05-21T11:45:00Z' },
  { id: 1004, camp_id: 1, resource_id: 5, quantity: 200, type: 'produccion_taller', notes: 'MUNICIONES FABRICADAS EN EL ARMERÍA.', created_at: '2026-05-22T08:00:00Z' }
];

// --- INITIALIZER ---
export const initDb = () => {
  if (!localStorage.getItem(KEYS.CAMPS)) {
    localStorage.setItem(KEYS.CAMPS, JSON.stringify(INITIAL_CAMPS));
    localStorage.setItem(KEYS.PROFESSIONS, JSON.stringify(INITIAL_PROFESSIONS));
    
    const persons = INITIAL_PERSONS(INITIAL_PROFESSIONS);
    localStorage.setItem(KEYS.PERSONS, JSON.stringify(persons));
    localStorage.setItem(KEYS.RESOURCES, JSON.stringify(INITIAL_RESOURCES));
    localStorage.setItem(KEYS.INVENTORIES, JSON.stringify(INITIAL_INVENTORIES));
    
    const explorations = INITIAL_EXPLORATIONS(persons, INITIAL_CAMPS);
    localStorage.setItem(KEYS.EXPLORATIONS, JSON.stringify(explorations));
    localStorage.setItem(KEYS.TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
  }
};

// --- GETTERS & MUTATORS ---
export const getDbData = <T>(key: string): T => {
  initDb();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [] as unknown as T;
};

export const saveDbData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- EVENTS & WEBSOCKET EMULATOR ---
type EventListener = (payload: { title: string; body: string; type: 'info' | 'warning' | 'critical' | 'success' }) => void;
const listeners: Set<EventListener> = new Set();

export const subscribeToNotifications = (callback: EventListener) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const triggerSystemNotification = (title: string, body: string, type: 'info' | 'warning' | 'critical' | 'success' = 'info') => {
  listeners.forEach((listener) => {
    listener({ title, body, type });
  });
};

// Periodic random notifications to simulate Socket.IO activity after brief delay cycles
export const startWebsocketSimulation = () => {
  const alerts = [
    { title: "SISTEMA INTEGRAL", body: "BALANCE HÍDRICO EN RIESGO: SUMINISTRO ALFA DE AGUA BAJO EL MÍNIMO.", type: 'warning' as const },
    { title: "ZONA MUERTA REPORTE", body: "ACTIVIDAD SÍSMICA DETECTADA EN METRO B3. EXCURSIONISTAS PREVENIR ALERTA.", type: 'info' as const },
    { title: "RAD-DIARIO", body: "NIVEL DE RADIACIÓN ATMOSFÉRICA EXTERIOR EN 45 RADS - TOLERABLE.", type: 'success' as const },
    { title: "CONEXIÓN INTER-CAMPAMENTO", body: "TRANSFERENCIA 902 MARCA TRÁNSITO SECTOR SION - RUTA ESTE SEGURA.", type: 'info' as const },
  ];
  
  setInterval(() => {
    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    triggerSystemNotification(randomAlert.title, randomAlert.body, randomAlert.type);
  }, 35000);
};
