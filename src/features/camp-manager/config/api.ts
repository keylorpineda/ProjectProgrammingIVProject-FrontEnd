/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  InventoryItem,
  Person,
  CampBalance,
  TransferStatistics,
  IntercampRequest,
  ProfessionAlert,
  PaginatedResponse,
  PersonStatus
} from '../types/api.types';

// Helper to delay simulation (feels like old bunker satellite connection)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// INITIAL STORAGE KEY DEFINITIONS
const STORAGE_KEYS = {
  INVENTORY: 'apoc_camp_inventory',
  PERSONS: 'apoc_camp_persons',
  TRANSFERS: 'apoc_camp_transfers',
  STATS: 'apoc_camp_stats'
};

// INITIAL SEED DATA
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Raciones de Emergencia (MRE)', category: 'Food', current_stock: 420, minimum_stock_required: 600, is_below_minimum: true, unit: 'Cajas' },
  { id: 'inv-2', name: 'Agua Purificada de Filtro', category: 'Water', current_stock: 820, minimum_stock_required: 500, is_below_minimum: false, unit: 'Litros' },
  { id: 'inv-3', name: 'Antitoxinas y Antibióticos', category: 'Medicine', current_stock: 12, minimum_stock_required: 25, is_below_minimum: true, unit: 'Viales' },
  { id: 'inv-4', name: 'Munición Calibre 5.56mm', category: 'Ammo', current_stock: 1450, minimum_stock_required: 1000, is_below_minimum: false, unit: 'Cartuchos' },
  { id: 'inv-5', name: 'Combustible Diésel (Generador)', category: 'Fuel', current_stock: 80, minimum_stock_required: 120, is_below_minimum: true, unit: 'Bidones' },
  { id: 'inv-6', name: 'Acero de Refuerzo Bunker', category: 'Materials', current_stock: 350, minimum_stock_required: 300, is_below_minimum: false, unit: 'Vigas' }
];

const INITIAL_PERSONS: Person[] = [
  { id: 'p-1', name: 'Marcus Vance', status: 'active', profession: 'Doctor', campId: 'Bunker-04', skills: ['Cirugía Avanzada', 'Farmacología'], dailyConsumptionFood: 2, dailyConsumptionWater: 3 },
  { id: 'p-2', name: 'Sarah Connor', status: 'active', profession: 'Soldier', campId: 'Bunker-04', skills: ['Tácticas de Guerrilla', 'Armas Pesadas'], dailyConsumptionFood: 3, dailyConsumptionWater: 4 },
  { id: 'p-3', name: 'Dave Miller', status: 'injured', profession: 'Farmer', campId: 'Bunker-04', skills: ['Cultivo Hidropónico', 'Suelos'], dailyConsumptionFood: 2, dailyConsumptionWater: 3, injuryDetails: 'Fractura en pierna izquierda por caída en conducto' },
  { id: 'p-4', name: 'Elena Rostova', status: 'active', profession: 'Engineer', campId: 'Bunker-04', skills: ['Reactores de Fusión', 'Sistemas de Ventilación'], dailyConsumptionFood: 2, dailyConsumptionWater: 3 },
  { id: 'p-5', name: 'Kaelen Thorne', status: 'sick', profession: 'Scavenger', campId: 'Bunker-04', skills: ['Exploración Urbana', 'Rastreo'], dailyConsumptionFood: 2, dailyConsumptionWater: 4, injuryDetails: 'Infección pulmonar leve por exposición al exterior' },
  { id: 'p-6', name: 'John Doe', status: 'active', profession: 'Farmer', campId: 'Bunker-04', skills: ['Sistemas de Riego'], dailyConsumptionFood: 1, dailyConsumptionWater: 2 },
  { id: 'p-7', name: 'T-800', status: 'active', profession: 'Soldier', campId: 'Bunker-04', skills: ['Protección de Perímetro'], dailyConsumptionFood: 0, dailyConsumptionWater: 0 },
  { id: 'p-8', name: 'Dr. Evelyn Reed', status: 'sick', profession: 'Doctor', campId: 'Bunker-04', skills: ['Virología'], dailyConsumptionFood: 2, dailyConsumptionWater: 3, injuryDetails: 'Resfriado severo por radiación controlada' }
];

const INITIAL_TRANSFERS: IntercampRequest[] = [
  { id: 'tr-1', resource_type: 'Antitoxinas y Antibióticos', amount: 15, camp_source_id: 'Bunker-Alpha', camp_destination_id: 'Bunker-04', status: 'pending', requested_at: '2026-05-23T12:00:00Z', notes: 'Solicitud médica de emergencia' },
  { id: 'tr-2', resource_type: 'Raciones de Emergencia (MRE)', amount: 100, camp_source_id: 'Bunker-04', camp_destination_id: 'Bunker-Beta', status: 'approved', requested_at: '2026-05-24T08:30:00Z', notes: 'Intercambio pactado por repuestos de filamento' },
  { id: 'tr-3', resource_type: 'Combustible Diésel (Generador)', amount: 40, camp_source_id: 'Bunker-Delta', camp_destination_id: 'Bunker-04', status: 'arrived', requested_at: '2026-05-22T04:15:00Z', notes: 'Logística de soporte regular' },
  { id: 'tr-4', resource_type: 'Munición Calibre 5.56mm', amount: 200, camp_source_id: 'Bunker-Gamma', camp_destination_id: 'Bunker-04', status: 'denied', requested_at: '2026-05-21T18:00:00Z', notes: 'Denegado por raciones insuficientes en origen' }
];

const INITIAL_STATS: TransferStatistics = {
  sentCount: 3,
  receivedCount: 5,
  totalTransferredResources: 340,
  pendingIncomingRequests: 1,
  totalFuelCostUsed: 120
};

// DATABASE HELPERS
function getStored<T>(key: string, seed: T): T {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(item) as T;
}

function setStored<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// SIMULATOR CONTROLLER
export const getDatabase = () => {
  const inventory = getStored<InventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
  const persons = getStored<Person[]>(STORAGE_KEYS.PERSONS, INITIAL_PERSONS);
  const transfers = getStored<IntercampRequest[]>(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFERS);
  const stats = getStored<TransferStatistics>(STORAGE_KEYS.STATS, INITIAL_STATS);
  return { inventory, persons, transfers, stats };
};

export const saveDatabase = (db: ReturnType<typeof getDatabase>) => {
  setStored(STORAGE_KEYS.INVENTORY, db.inventory);
  setStored(STORAGE_KEYS.PERSONS, db.persons);
  setStored(STORAGE_KEYS.TRANSFERS, db.transfers);
  setStored(STORAGE_KEYS.STATS, db.stats);
};

// AXIOS MOCK INSTANCE
export const api = {
  get: async (url: string, config?: any): Promise<{ data: any; status: number }> => {
    await delay(250); // Simulate network delay
    const db = getDatabase();

    // 1. GET /users/camp/:campId/balance
    if (url.includes('/users/camp/') && url.endsWith('/balance')) {
      // Calculate production vs consumption
      // Farmers produce Food, Engineers produce/save Water/Fuel, Doctors reduce sick count.
      const activeFarmers = db.persons.filter(p => p.profession === 'Farmer' && p.status === 'active').length;
      const activeEngineers = db.persons.filter(p => p.profession === 'Engineer' && p.status === 'active').length;
      
      const foodProduction = activeFarmers * 12; // 12 units per farmer
      const waterProduction = activeEngineers * 15 + 10; // BASE purifiers + engineers

      let foodConsumption = 0;
      let waterConsumption = 0;
      
      db.persons.forEach(p => {
        let foodMult = p.status === 'active' ? 1 : 1.5; // Sick/injured consume more
        let waterMult = p.status === 'active' ? 1 : 1.5;
        
        foodConsumption += Math.round(p.dailyConsumptionFood * foodMult);
        waterConsumption += Math.round(p.dailyConsumptionWater * waterMult);
      });

      const medicalSuppliesNeeded = db.persons.filter(p => p.status !== 'active').length * 2;
      
      const alarmList: string[] = [];
      if (foodProduction < foodConsumption) {
        alarmList.push('Consumo de COMIDA supera la producción diaria.');
      }
      if (waterProduction < waterConsumption) {
        alarmList.push('Consumo de AGUA supera la capacidad del purificador.');
      }
      
      db.inventory.forEach(item => {
        if (item.current_stock < item.minimum_stock_required) {
          alarmList.push(`¡Alerta! Stock de ${item.name} por debajo del mínimo crítico.`);
        }
      });

      const balance: CampBalance = {
        foodProduction,
        foodConsumption,
        waterProduction,
        waterConsumption,
        medicalSuppliesNeeded,
        activeAlarmsCount: alarmList.length,
        detailedAlarms: alarmList
      };

      return { data: balance, status: 200 };
    }

    // 2. GET /transfers/statistics/:campId
    if (url.includes('/transfers/statistics/')) {
      const pendingCount = db.transfers.filter(t => t.status === 'pending' && t.camp_destination_id === 'Bunker-04').length;
      const statistics: TransferStatistics = {
        ...db.stats,
        pendingIncomingRequests: pendingCount
      };
      return { data: statistics, status: 200 };
    }

    // 3. GET /resources/inventory/:campId
    if (url.includes('/resources/inventory/')) {
      return { data: db.inventory, status: 200 };
    }

    // 4. GET /users/persons?campId=...
    if (url.includes('/users/persons')) {
      // Return list of persons (Simulated Pagination)
      const urlObj = new URL(url, 'http://localhost');
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
      const limit = parseInt(urlObj.searchParams.get('limit') || '5', 10);
      
      const start = (page - 1) * limit;
      const paginatedData = db.persons.slice(start, start + limit);

      const response: PaginatedResponse<Person> = {
        data: paginatedData,
        total: db.persons.length,
        page,
        limit
      };
      return { data: response, status: 200 };
    }

    // 5. GET /users/professions/alerts/needing-workers
    if (url.includes('/users/professions/alerts/needing-workers')) {
      const activeFarmers = db.persons.filter(p => p.profession === 'Farmer' && p.status === 'active').length;
      const activeDoctors = db.persons.filter(p => p.profession === 'Doctor' && p.status === 'active').length;
      const activeEngineers = db.persons.filter(p => p.profession === 'Engineer' && p.status === 'active').length;

      const alerts: ProfessionAlert[] = [];
      if (activeFarmers < 3) {
        alerts.push({
          profession: 'Farmer',
          neededCount: 3 - activeFarmers,
          severity: activeFarmers === 0 ? 'high' : 'medium',
          impactDescription: `Seguridad alimentaria comprometida. Invernaderos funcionando a ${Math.round((activeFarmers/3)*100)}% de potencia.`
        });
      }
      if (activeDoctors < 2) {
        alerts.push({
          profession: 'Doctor',
          neededCount: 2 - activeDoctors,
          severity: activeDoctors === 0 ? 'high' : 'medium',
          impactDescription: 'Suministro de medicina ineficiente. Cuarentena con rebote bacteriológico.'
        });
      }
      if (activeEngineers < 2) {
        alerts.push({
          profession: 'Engineer',
          neededCount: 2 - activeEngineers,
          severity: 'low',
          impactDescription: 'Pérdida menor de presión en filtros hidráulicos de agua potable.'
        });
      }

      return { data: alerts, status: 200 };
    }

    // 6. GET /transfers/requests/camp/:campId
    if (url.includes('/transfers/requests/camp/')) {
      return { data: db.transfers, status: 200 };
    }

    throw new Error(`404 Not Found: URL ${url} no reconocida.`);
  },

  post: async (url: string, data?: any, config?: any): Promise<{ data: any; status: number }> => {
    await delay(300);
    const db = getDatabase();

    // 1. POST /resources/daily-process/:campId (Forzar Cierre de Día)
    if (url.includes('/resources/daily-process/')) {
      // Calculate production food / water
      const activeFarmers = db.persons.filter(p => p.profession === 'Farmer' && p.status === 'active').length;
      const activeEngineers = db.persons.filter(p => p.profession === 'Engineer' && p.status === 'active').length;
      
      const foodProduced = activeFarmers * 12;
      const waterProduced = activeEngineers * 15 + 10;

      let foodConsumed = 0;
      let waterConsumed = 0;
      
      db.persons.forEach(p => {
        let foodMult = p.status === 'active' ? 1 : 1.5;
        let waterMult = p.status === 'active' ? 1 : 1.5;
        foodConsumed += Math.round(p.dailyConsumptionFood * foodMult);
        waterConsumed += Math.round(p.dailyConsumptionWater * waterMult);
      });

      // Update Stock counts
      db.inventory = db.inventory.map(item => {
        let current = item.current_stock;
        if (item.category === 'Food') {
          current = Math.max(0, current + foodProduced - foodConsumed);
        } else if (item.category === 'Water') {
          current = Math.max(0, current + waterProduced - waterConsumed);
        } else if (item.category === 'Fuel') {
          // Generators burn fuel daily
          current = Math.max(0, current - 15);
        } else if (item.category === 'Medicine') {
          // Sick people consume medicine
          const sickCount = db.persons.filter(p => p.status === 'sick').length;
          current = Math.max(0, current - (sickCount * 1));
        }

        return {
          ...item,
          current_stock: current,
          is_below_minimum: current < item.minimum_stock_required
        };
      });

      // Also recover some sick/injured people with a 35% chance
      db.persons = db.persons.map(p => {
        if (p.status !== 'active' && Math.random() < 0.35) {
          return {
            ...p,
            status: 'active',
            injuryDetails: undefined
          };
        }
        return p;
      });

      saveDatabase(db);
      return { 
        data: { 
          success: true, 
          message: 'Cierre de ciclo solar procesado.',
          metrics: { foodProduced, foodConsumed, waterProduced, waterConsumed }
        }, 
        status: 200 
      };
    }

    // 2. POST /transfers/requests (Crear Solicitud de Recursos)
    if (url.includes('/transfers/requests') && !url.includes('/approval') && !url.includes('/arrive')) {
      const { resource_type, amount, camp_source_id, camp_destination_id, notes } = data;
      
      if (!resource_type || !amount || amount <= 0) {
        throw new Error('400 Bad Request: Cantidad de recursos inválida.');
      }

      const newRequest: IntercampRequest = {
        id: `tr-${Date.now()}`,
        resource_type,
        amount: Number(amount),
        camp_source_id,
        camp_destination_id,
        status: 'pending',
        requested_at: new Date().toISOString(),
        notes: notes || 'Petición de auxilio de recursos inter-áreas'
      };

      db.transfers.unshift(newRequest);
      db.stats.sentCount += 1;
      db.stats.totalFuelCostUsed += 15; // Logistical weight cost
      
      saveDatabase(db);
      return { data: newRequest, status: 201 };
    }

    // 3. POST /users/temporary-assignments (Asignar humanos a tareas)
    if (url.includes('/users/temporary-assignments')) {
      const { personId, assignment } = data;
      const targetPerson = db.persons.find(p => p.id === personId);
      if (!targetPerson) {
        throw new Error('404 Not Found: Trabajador no registrado.');
      }

      // Add temporary skill or assignment
      if (!targetPerson.skills.includes(assignment)) {
        targetPerson.skills.push(assignment);
      }
      targetPerson.profession = assignment; // Reassign profession!

      saveDatabase(db);
      return { data: targetPerson, status: 200 };
    }

    throw new Error(`404 Not Found: URL POST ${url} no reconocida.`);
  },

  patch: async (url: string, data?: any, config?: any): Promise<{ data: any; status: number }> => {
    await delay(250);
    const db = getDatabase();

    // 1. PATCH /resources/inventory/:campId/:resourceId (Editar minimum_stock_required)
    if (url.includes('/resources/inventory/')) {
      const matches = url.match(/\/resources\/inventory\/[^/]+\/([^/]+)/);
      if (matches && matches[1]) {
        const resourceId = matches[1];
        const { minimum_stock_required } = data;
        
        if (minimum_stock_required < 0) {
          throw new Error('400 Bad Request: El stock mínimo no puede ser negativo.');
        }

        db.inventory = db.inventory.map(item => {
          if (item.id === resourceId) {
            const stock = Number(minimum_stock_required);
            return {
              ...item,
              minimum_stock_required: stock,
              is_below_minimum: item.current_stock < stock
            };
          }
          return item;
        });

        saveDatabase(db);
        const updated = db.inventory.find(item => item.id === resourceId);
        return { data: updated, status: 200 };
      }
    }

    // 2. PATCH /transfers/requests/:id/approval (Aprobar o Denegar solicitud entrante)
    if (url.includes('/transfers/requests/') && url.endsWith('/approval')) {
      const matches = url.match(/\/transfers\/requests\/([^/]+)\/approval/);
      if (matches && matches[1]) {
        const requestId = matches[1];
        const { status } = data; // 'approved' o 'denied'

        let reqNode = db.transfers.find(t => t.id === requestId);
        if (!reqNode) {
          throw new Error('404 Not Found: Orden de transferencia no ubicada.');
        }

        reqNode.status = status;

        if (status === 'approved') {
          db.stats.receivedCount += 1;
          db.stats.totalTransferredResources += reqNode.amount;
        }

        saveDatabase(db);
        return { data: reqNode, status: 200 };
      }
    }

    // 3. PATCH /transfers/requests/:id/arrive (Registrar llegada física)
    if (url.includes('/transfers/requests/') && url.endsWith('/arrive')) {
      const matches = url.match(/\/transfers\/requests\/([^/]+)\/arrive/);
      if (matches && matches[1]) {
        const requestId = matches[1];

        let reqNode = db.transfers.find(t => t.id === requestId);
        if (!reqNode) {
          throw new Error('404 Not Found: Orden de transferencia no ubicada.');
        }

        if (reqNode.status !== 'approved') {
          throw new Error('400 Bad Request: No se puede recibir un cargamento que no esté previamente APROBADO.');
        }

        reqNode.status = 'arrived';

        // Add resource quantity directly to inventory current_stock!
        db.inventory = db.inventory.map(item => {
          // Match by name or category
          if (item.name.toLowerCase().includes(reqNode!.resource_type.toLowerCase()) || 
              reqNode!.resource_type.toLowerCase().includes(item.name.toLowerCase())) {
            const newStock = item.current_stock + reqNode!.amount;
            return {
              ...item,
              current_stock: newStock,
              is_below_minimum: newStock < item.minimum_stock_required
            };
          }
          return item;
        });

        saveDatabase(db);
        return { data: reqNode, status: 200 };
      }
    }

    throw new Error(`404 Not Found: URL PATCH ${url} no reconocida.`);
  },

  put: async (url: string, data?: any, config?: any): Promise<{ data: any; status: number }> => {
    await delay(250);
    const db = getDatabase();

    // 1. PUT /users/persons/:id/status (Cambiar de estado: 'active', 'sick', 'injured')
    if (url.includes('/users/persons/')) {
      const matches = url.match(/\/users\/persons\/([^/]+)\/status/);
      if (matches && matches[1]) {
        const id = matches[1];
        const { status } = data; // PersonStatus

        let targetPerson = db.persons.find(p => p.id === id);
        if (!targetPerson) {
          throw new Error('404 Not Found: Humano sobreviviente no encontrado.');
        }

        targetPerson.status = status as PersonStatus;
        if (status === 'active') {
          targetPerson.injuryDetails = undefined;
        } else if (status === 'sick') {
          targetPerson.injuryDetails = 'Diagnóstico: Fiebre viral post-expón';
        } else if (status === 'injured') {
          targetPerson.injuryDetails = 'Diagnóstico: Herida por metralla oxidada';
        }

        saveDatabase(db);
        return { data: targetPerson, status: 200 };
      }
    }

    throw new Error(`404 Not Found: URL PUT ${url} no reconocida.`);
  }
};
