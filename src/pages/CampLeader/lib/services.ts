// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Exploration, 
  ExplorationStatus, 
  Person, 
  Inventory, 
  InventoryMovement, 
  Transfer, 
  TransferStatus, 
  ResourceItem, 
  CampBalance, 
  CampStatistics 
} from '../types';
import { 
  getDbData, 
  saveDbData, 
  triggerSystemNotification, 
  simulateLatency 
} from './db';

const KEYS = {
  EXPLORATIONS: 'DOOMSDAY_SYS_EXPLORATIONS',
  PERSONS: 'DOOMSDAY_SYS_PERSONS',
  INVENTORIES: 'DOOMSDAY_SYS_INVENTORIES',
  MOVEMENTS: 'DOOMSDAY_SYS_MOVEMENTS',
  TRANSFERS: 'DOOMSDAY_SYS_TRANSFERS',
  RESOURCES: 'DOOMSDAY_SYS_RESOURCES',
  CAMPS: 'DOOMSDAY_SYS_CAMPS',
};

// ==========================================
// 1. EXPLORATIONS SERVICE
// ==========================================
export const explorationsService = {
  /**
   * GET /explorations?campId=&status=
   */
  async getExplorations(campId: number, status?: ExplorationStatus): Promise<Exploration[]> {
    const list = getDbData<Exploration[]>(KEYS.EXPLORATIONS);
    const filtered = list.filter((exp) => {
      const matchCamp = exp.camp_id === campId;
      const matchStatus = status ? exp.status === status : true;
      return matchCamp && matchStatus;
    });
    return simulateLatency(filtered, 300);
  },

  /**
   * GET /explorations/:id
   */
  async getExplorationById(id: number): Promise<Exploration | null> {
    const list = getDbData<Exploration[]>(KEYS.EXPLORATIONS);
    const item = list.find((exp) => exp.id === id) || null;
    return simulateLatency(item, 250);
  },

  /**
   * POST /explorations
   * Creates exploration and subtracts requested explorationResources from camp inventories immediately.
   */
  async createExploration(data: {
    camp_id: number;
    name: string;
    destination_description: string;
    departure_date: string;
    estimated_days: number;
    grace_days: number;
    notes?: string;
    personIds: number[];
    resourceConsumptions: { resource_id: number; quantity: number }[];
  }): Promise<Exploration> {
    const explorations = getDbData<Exploration[]>(KEYS.EXPLORATIONS);
    const personsList = getDbData<Person[]>(KEYS.PERSONS);
    const inventories = getDbData<Inventory[]>(KEYS.INVENTORIES);
    const movements = getDbData<InventoryMovement[]>(KEYS.MOVEMENTS);

    const nextId = explorations.reduce((max, exp) => Math.max(max, exp.id), 0) + 1;

    // Filter persons assigned
    const assignedPersons = personsList.filter(p => data.personIds.includes(p.id));
    const explorationPersons = assignedPersons.map((p, idx) => ({
      exploration_id: nextId,
      person_id: p.id,
      is_leader: idx === 0, // Make the first assigned person the leader
      return_confirmed: false,
      person: p,
    }));

    // Build resources structures
    const resourcesList = getDbData<any[]>(KEYS.RESOURCES);
    const explorationResources = data.resourceConsumptions.map(rc => {
      const resItem = resourcesList.find(r => r.id === rc.resource_id);
      return {
        exploration_id: nextId,
        resource_id: rc.resource_id,
        quantity: rc.quantity,
        resource: resItem,
      };
    });

    // Deduct supplies from inventory immediately for equipping
    data.resourceConsumptions.forEach(rc => {
      const inv = inventories.find(i => i.camp_id === data.camp_id && i.resource_id === rc.resource_id);
      if (inv) {
        inv.current_quantity = Math.max(0, inv.current_quantity - rc.quantity);
        inv.alert_active = inv.current_quantity < inv.minimum_stock_required;

        // Create movements log
        movements.unshift({
          id: movements.reduce((max, m) => Math.max(max, m.id), 0) + 1,
          camp_id: data.camp_id,
          resource_id: rc.resource_id,
          quantity: -rc.quantity,
          type: 'equipamiento_viaje',
          notes: `RACIONES SUMINISTRADAS PARA EXPEDICIÓN [${data.name.toUpperCase()}].`,
          created_at: new Date().toISOString(),
        });
      }
    });

    // Setup newly scheduled exploration
    const newExploration: Exploration = {
      id: nextId,
      camp_id: data.camp_id,
      name: data.name.toUpperCase(),
      destination_description: data.destination_description.toUpperCase(),
      departure_date: data.departure_date,
      estimated_days: data.estimated_days,
      grace_days: data.grace_days,
      status: 'scheduled',
      notes: data.notes?.toUpperCase() || '',
      explorationPersons,
      explorationResources,
      camp: getDbData<any[]>(KEYS.CAMPS).find(c => c.id === data.camp_id),
    };

    explorations.unshift(newExploration);

    saveDbData(KEYS.EXPLORATIONS, explorations);
    saveDbData(KEYS.INVENTORIES, inventories);
    saveDbData(KEYS.MOVEMENTS, movements);

    triggerSystemNotification(
      "EXPEDICIÓN PROGRAMADA",
      `NUEVA BÚSQUEDA PROGRAMADA: ${newExploration.name}`,
      'info'
    );

    return simulateLatency(newExploration, 400);
  },

  /**
   * PATCH /explorations/:id/depart
   * Marks scheduled exploration as in_progress and updates people's status to 'exploring'
   */
  async departExploration(id: number): Promise<Exploration> {
    const explorations = getDbData<Exploration[]>(KEYS.EXPLORATIONS);
    const personsList = getDbData<Person[]>(KEYS.PERSONS);

    const expIndex = explorations.findIndex(e => e.id === id);
    if (expIndex === -1) {
      throw new Error("EXPLORACIÓN NO ENCONTRADA.");
    }

    const exp = explorations[expIndex];
    if (exp.status !== 'scheduled') {
      throw new Error("LA EXPLORACIÓN TIENE UN ESTADO CONTRAIDEO.");
    }

    // Mutate state
    exp.status = 'in_progress';
    exp.departure_date = new Date().toISOString();

    // Change status of exploration persons to 'exploring'
    const participantIds = exp.explorationPersons.map(ep => ep.person_id);
    const updatedPersons = personsList.map(p => {
      if (participantIds.includes(p.id)) {
        return { ...p, status: 'exploring' as const, can_work: false };
      }
      return p;
    });

    // Keep child relations in exploration synchronized
    exp.explorationPersons = exp.explorationPersons.map(ep => {
      const fullPerson = updatedPersons.find(p => p.id === ep.person_id);
      return {
        ...ep,
        person: fullPerson || ep.person,
      };
    });

    saveDbData(KEYS.EXPLORATIONS, explorations);
    saveDbData(KEYS.PERSONS, updatedPersons);

    triggerSystemNotification(
      "ZONA MUERTA ACCESO",
      `EL EQUIPO HA PARTIDO HACIA: ${exp.destination_description}`,
      'warning'
    );

    return simulateLatency(exp, 350);
  },

  /**
   * PATCH /explorations/:id/return
   * Completes the expedition, restores participants state to active, and adds found inventory stocks.
   */
  async returnExploration(
    id: number, 
    data: { 
      notes?: string;
      foundResources: { resource_id: number; quantity: number }[];
    }
  ): Promise<Exploration> {
    const explorations = getDbData<Exploration[]>(KEYS.EXPLORATIONS);
    const personsList = getDbData<Person[]>(KEYS.PERSONS);
    const inventories = getDbData<Inventory[]>(KEYS.INVENTORIES);
    const movements = getDbData<InventoryMovement[]>(KEYS.MOVEMENTS);
    const resourcesList = getDbData<any[]>(KEYS.RESOURCES);

    const expIndex = explorations.findIndex(e => e.id === id);
    if (expIndex === -1) {
      throw new Error("EXPLORACIÓN NO ENCONTRADA.");
    }

    const exp = explorations[expIndex];
    if (exp.status !== 'in_progress') {
      throw new Error("SOLO SE PUEDE REGISTRAR RETORNO DE VIAJES EN CURSO.");
    }

    // Mutate State
    exp.status = 'completed';
    exp.real_return_date = new Date().toISOString();
    exp.notes = (exp.notes ? exp.notes + " | " : "") + (data.notes?.toUpperCase() || "RETORNO SATISFACTORIO.");

    // Change persons back to active. Reward with EXP and Expeditions Survived
    const participantIds = exp.explorationPersons.map(ep => ep.person_id);
    const updatedPersons = personsList.map(p => {
      if (participantIds.includes(p.id)) {
        const pointGain = Math.floor(Math.random() * 50) + 30;
        const survInc = p.expeditionsSurvived + 1;
        const newPoints = p.experience_points + pointGain;
        const newLevel = Math.min(5, Math.floor(newPoints / 100) + 1);

        return {
          ...p,
          status: 'active' as const,
          can_work: true,
          expeditionsSurvived: survInc,
          experience_points: newPoints,
          experience_level: newLevel,
        };
      }
      return p;
    });

    // Synchronize participants records
    exp.explorationPersons = exp.explorationPersons.map(ep => {
      const p = updatedPersons.find(x => x.id === ep.person_id);
      return {
        ...ep,
        return_confirmed: true,
        person: p || ep.person,
      };
    });

    // Save found resources to inventories & trigger logs
    data.foundResources.forEach(fr => {
      if (fr.quantity <= 0) return;

      let inv = inventories.find(i => i.camp_id === exp.camp_id && i.resource_id === fr.resource_id);
      if (!inv) {
        // Create new inventory relation if slot was empty
        const resItem = resourcesList.find(r => r.id === fr.resource_id);
        inv = {
          camp_id: exp.camp_id,
          resource_id: fr.resource_id,
          current_quantity: 0,
          minimum_stock_required: 50,
          alert_active: true,
          resource: resItem,
        };
        inventories.push(inv);
      }

      inv.current_quantity += fr.quantity;
      inv.alert_active = inv.current_quantity < inv.minimum_stock_required;

      // Add movement log
      movements.unshift({
        id: movements.reduce((max, m) => Math.max(max, m.id), 0) + 1,
        camp_id: exp.camp_id,
        resource_id: fr.resource_id,
        quantity: fr.quantity,
        type: 'recolectado_exploracion',
        notes: `RECURSOS RESCATADOS DE LA EXPEDICIÓN [${exp.name}].`,
        created_at: new Date().toISOString(),
      });
    });

    saveDbData(KEYS.EXPLORATIONS, explorations);
    saveDbData(KEYS.PERSONS, updatedPersons);
    saveDbData(KEYS.INVENTORIES, inventories);
    saveDbData(KEYS.MOVEMENTS, movements);

    triggerSystemNotification(
      "RETORNO EXITOSO",
      `EQUIPO DE COMBATE RETORNA CON SUMINISTROS DE LA ZONA MUERTA!`,
      'success'
    );

    return simulateLatency(exp, 400);
  },

  /**
   * DELETE /explorations/:id
   * Cancels a scheduled exploration and returns supplied resources to inventory.
   */
  async cancelExploration(id: number): Promise<void> {
    const explorations = getDbData<Exploration[]>(KEYS.EXPLORATIONS);
    const inventories = getDbData<Inventory[]>(KEYS.INVENTORIES);
    const movements = getDbData<InventoryMovement[]>(KEYS.MOVEMENTS);

    const expIndex = explorations.findIndex(e => e.id === id);
    if (expIndex === -1) {
      throw new Error("EXPLORACIÓN NO ENCONTRADA.");
    }

    const exp = explorations[expIndex];
    if (exp.status !== 'scheduled') {
      throw new Error("SOLO SE PUEDE CANCELAR EXPEDICIONES PROGRAMADAS.");
    }

    // Cancel state
    exp.status = 'cancelled';

    // Reimburse spent materials
    exp.explorationResources.forEach(er => {
      const inv = inventories.find(i => i.camp_id === exp.camp_id && i.resource_id === er.resource_id);
      if (inv) {
        inv.current_quantity += er.quantity;
        inv.alert_active = inv.current_quantity < inv.minimum_stock_required;

        movements.unshift({
          id: movements.reduce((max, m) => Math.max(max, m.id), 0) + 1,
          camp_id: exp.camp_id,
          resource_id: er.resource_id,
          quantity: er.quantity,
          type: 'expedicion_reintegro',
          notes: `REINTEGRO DE MATERIAL POR CANCELACIÓN DE EXPEDICIÓN [${exp.name}].`,
          created_at: new Date().toISOString(),
        });
      }
    });

    saveDbData(KEYS.EXPLORATIONS, explorations);
    saveDbData(KEYS.INVENTORIES, inventories);
    saveDbData(KEYS.MOVEMENTS, movements);

    triggerSystemNotification(
      "OPERACIÓN ANULADA",
      `SE HA CANCELADO LA EXPEDICIÓN: ${exp.name}`,
      'critical'
    );

    return simulateLatency(undefined, 300);
  }
};

// ==========================================
// 2. TRANSFERS SERVICE
// ==========================================
export const transfersService = {
  /**
   * GET /transfers/requests/:id
   */
  async getTransferById(id: number): Promise<Transfer | null> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    return simulateLatency(list.find(t => t.id === id) || null, 250);
  },

  /**
   * GET /transfers/requests/camp/:campId
   * Filters: role=origin|destination, status=pending|approved|in_transit|completed|rejected|cancelled
   */
  async getCampTransferRequests(
    campId: number, 
    filters?: { role?: 'origin' | 'destination'; status?: TransferStatus }
  ): Promise<Transfer[]> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    const filtered = list.filter(t => {
      let isMatch = false;
      const isOrigin = t.origin_camp_id === campId;
      const isDest = t.destination_camp_id === campId;

      if (filters?.role === 'origin') {
        isMatch = isOrigin;
      } else if (filters?.role === 'destination') {
        isMatch = isDest;
      } else {
        isMatch = isOrigin || isDest;
      }

      const matchStatus = filters?.status ? t.status === filters.status : true;
      return isMatch && matchStatus;
    });

    return simulateLatency(filtered, 300);
  },

  /**
   * GET /transfers/requests/camp/:campId/pending
   */
  async getCampPendingTransfers(campId: number): Promise<Transfer[]> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    const filtered = list.filter(t => t.destination_camp_id === campId && t.status === 'pending');
    return simulateLatency(filtered, 250);
  },

  /**
   * POST /transfers/requests
   * Crear solicitud de transferencia inter-campamento
   */
  async createTransferRequest(data: {
    origin_camp_id: number;
    destination_camp_id: number;
    resource_id: number;
    quantity: number;
    notes?: string;
    requested_by_user_id: number;
  }): Promise<Transfer> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    const camps = getDbData<any[]>(KEYS.CAMPS);
    const resources = getDbData<any[]>(KEYS.RESOURCES);

    const nextId = list.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const resItem = resources.find(r => r.id === data.resource_id);
    const originCamp = camps.find(c => c.id === data.origin_camp_id);
    const destCamp = camps.find(c => c.id === data.destination_camp_id);

    const newTransfer: Transfer = {
      id: nextId,
      origin_camp_id: data.origin_camp_id,
      destination_camp_id: data.destination_camp_id,
      resource_id: data.resource_id,
      quantity: data.quantity,
      status: 'pending',
      requested_by_user_id: data.requested_by_user_id,
      notes: data.notes?.toUpperCase() || '',
      resource: resItem,
      origin_camp: originCamp,
      destination_camp: destCamp,
    };

    list.unshift(newTransfer);
    saveDbData(KEYS.TRANSFERS, list);

    triggerSystemNotification(
      "TRASLADO SOLICITADO",
      `SOLICITADO ENVÍO DE: ${data.quantity} ${resItem?.unit || 'UNIDADES'} DE ${resItem?.name || ''}`,
      'info'
    );

    return simulateLatency(newTransfer, 350);
  },

  /**
   * PATCH /transfers/requests/:id/approval
   * Aprobar o rechazar solicitud de transferencia
   */
  async handleTransferApproval(
    id: number, 
    approved: boolean, 
    userId: number
  ): Promise<Transfer> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    const inventories = getDbData<Inventory[]>(KEYS.INVENTORIES);

    const index = list.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error("TRASLADO NO ENCONTRADO.");
    }

    const t = list[index];
    if (t.status !== 'pending') {
      throw new Error("LA SOLICITUD NO ESTÃ PENDIENTE DE REVISIÓN.");
    }

    if (approved) {
      // Check if origin camp actually has the inventory necessary!
      const originInv = inventories.find(i => i.camp_id === t.origin_camp_id && i.resource_id === t.resource_id);
      if (!originInv || originInv.current_quantity < t.quantity) {
        throw new Error(`RECURSOS INSUFICIENTES EN EL CAMPAMENTO ORIGEN (${originInv?.current_quantity || 0} DISPONIBLES).`);
      }

      t.status = 'approved';
      t.approved_by_user_id = userId;

      // Automatically advance to 'in_transit' for dynamic animation and gameplay
      t.status = 'in_transit';

      // Spend/Reserve immediately on approval to prevent double-spending assets
      originInv.current_quantity -= t.quantity;
      originInv.alert_active = originInv.current_quantity < originInv.minimum_stock_required;

      const movements = getDbData<InventoryMovement[]>(KEYS.MOVEMENTS);
      movements.unshift({
        id: movements.reduce((max, m) => Math.max(max, m.id), 0) + 1,
        camp_id: t.origin_camp_id,
        resource_id: t.resource_id,
        quantity: -t.quantity,
        type: 'transfer_dispatched',
        notes: `RECURSOS EN TRANSITO HACIA: ${t.destination_camp?.name || 'OTRO REFUGIO'}. ID TRASLADO: #${t.id}`,
        created_at: new Date().toISOString(),
      });
      saveDbData(KEYS.MOVEMENTS, movements);
    } else {
      t.status = 'rejected';
      t.approved_by_user_id = userId;
    }

    saveDbData(KEYS.TRANSFERS, list);
    saveDbData(KEYS.INVENTORIES, inventories);

    triggerSystemNotification(
      approved ? "TRASLADO EN TRÁNSITO" : "TRASLADO RECHAZADO",
      approved 
        ? `LOTE APROBADO: ${t.quantity} ${t.resource?.unit} HACIA ${t.destination_camp?.name}`
        : `LOTE RECHAZADO DE SUMINISTRO POR CAMPAMENTO ORIGEN.`,
      approved ? 'success' : 'critical'
    );

    return simulateLatency(t, 400);
  },

  /**
   * PATCH /transfers/requests/:id/cancel
   * Cancelar solicitud pendiente
   */
  async cancelTransferRequest(id: number): Promise<Transfer> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    const index = list.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error("TRASLADO NO ENCONTRADO.");
    }

    const t = list[index];
    if (t.status !== 'pending') {
      throw new Error("SOLO ES POSIBLE ELIMINAR TRASLADOS PENDIENTES.");
    }

    t.status = 'cancelled';
    saveDbData(KEYS.TRANSFERS, list);

    triggerSystemNotification(
      "TRASLADO ANULADO",
      `SOLICITUD DE TRANSFERENCIA #${t.id} ANULADA CORRECTAMENTE.`,
      'critical'
    );

    return simulateLatency(t, 300);
  },

  /**
   * PATCH /transfers/requests/:id/arrive
   * Registrar llegada de transferencia
   */
  async arriveTransferRequest(id: number): Promise<Transfer> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    const inventories = getDbData<Inventory[]>(KEYS.INVENTORIES);
    const movements = getDbData<InventoryMovement[]>(KEYS.MOVEMENTS);

    const index = list.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error("TRASLADO NO ENCONTRADO.");
    }

    const t = list[index];
    if (t.status !== 'in_transit' && t.status !== 'approved') {
      throw new Error("LA TRANSFERENCIA NO SE ENCUENTRA EN TRÁNSITO.");
    }

    t.status = 'completed';

    // Accumulate in destination inventory
    let destInv = inventories.find(i => i.camp_id === t.destination_camp_id && i.resource_id === t.resource_id);
    if (!destInv) {
      const resources = getDbData<any[]>(KEYS.RESOURCES);
      const resVal = resources.find(r => r.id === t.resource_id);
      destInv = {
        camp_id: t.destination_camp_id,
        resource_id: t.resource_id,
        current_quantity: 0,
        minimum_stock_required: 50,
        alert_active: true,
        resource: resVal,
      };
      inventories.push(destInv);
    }

    destInv.current_quantity += t.quantity;
    destInv.alert_active = destInv.current_quantity < destInv.minimum_stock_required;

    // Movement log in destination
    movements.unshift({
      id: movements.reduce((max, m) => Math.max(max, m.id), 0) + 1,
      camp_id: t.destination_camp_id,
      resource_id: t.resource_id,
      quantity: t.quantity,
      type: 'transfer_arrive',
      notes: `DOCK REABASTECIDO: ARRIBÓ TRASLADO DESDE: ${t.origin_camp?.name || 'ALMACÉN ORIGEN'}.`,
      created_at: new Date().toISOString(),
    });

    saveDbData(KEYS.TRANSFERS, list);
    saveDbData(KEYS.INVENTORIES, inventories);
    saveDbData(KEYS.MOVEMENTS, movements);

    triggerSystemNotification(
      "SUMINISTRO RECIBIDO",
      `EN DOCKS: LLEGADA CONFIRMADA DE ${t.quantity} ${t.resource?.unit} EN ${t.destination_camp?.name}`,
      'success'
    );

    return simulateLatency(t, 450);
  },

  /**
   * GET /transfers/statistics/:campId
   * Estadísticas de transferencias
   */
  async getTransferStatistics(campId: number): Promise<{
    sentCount: number;
    receivedCount: number;
    pendingCount: number;
    totalUnitsSuministradas: number;
  }> {
    const list = getDbData<Transfer[]>(KEYS.TRANSFERS);
    
    let sentCount = 0;
    let receivedCount = 0;
    let pendingCount = 0;
    let totalUnitsSuministradas = 0;

    list.forEach(t => {
      const isOrigin = t.origin_camp_id === campId;
      const isDest = t.destination_camp_id === campId;

      if (isOrigin) {
        if (t.status === 'completed') {
          sentCount++;
        }
      }
      if (isDest) {
        if (t.status === 'completed') {
          receivedCount++;
          totalUnitsSuministradas += t.quantity;
        } else if (t.status === 'pending') {
          pendingCount++;
        }
      }
    });

    return simulateLatency({
      sentCount,
      receivedCount,
      pendingCount,
      totalUnitsSuministradas,
    }, 250);
  }
};

// ==========================================
// 3. RESOURCES SERVICE
// ==========================================
export const resourcesService = {
  /**
   * GET /resources/inventory/:campId
   * Consultar inventario completo del campamento
   */
  async getCampInventory(campId: number): Promise<Inventory[]> {
    const list = getDbData<Inventory[]>(KEYS.INVENTORIES);
    const filtered = list.filter(i => i.camp_id === campId);
    return simulateLatency(filtered, 250);
  },

  /**
   * GET /resources/movements/:campId
   * Historial de movimientos de inventario
   */
  async getInventoryMovements(campId: number): Promise<InventoryMovement[]> {
    const list = getDbData<InventoryMovement[]>(KEYS.MOVEMENTS);
    const filtered = list.filter(m => m.camp_id === campId);
    return simulateLatency(filtered, 250);
  },

  /**
   * GET /resources
   * Listar todos los recursos disponibles
   */
  async getAllResources(): Promise<ResourceItem[]> {
    const list = getDbData<ResourceItem[]>(KEYS.RESOURCES);
    return simulateLatency(list, 200);
  }
};

// ==========================================
// 4. USERS/CAMP SERVICE
// ==========================================
export const usersService = {
  /**
   * GET /users/persons?campId=
   */
  async getCampPersons(campId?: number): Promise<Person[]> {
    // Currently, simple lookup: all simulated peoples belong to the leader's camp.
    const list = getDbData<Person[]>(KEYS.PERSONS);
    return simulateLatency(list, 250);
  },

  /**
   * GET /users/persons/:id
   */
  async getPersonById(id: number): Promise<Person | null> {
    const list = getDbData<Person[]>(KEYS.PERSONS);
    const item = list.find(p => p.id === id) || null;
    return simulateLatency(item, 200);
  },

  /**
   * GET /users/camp/:campId/balance
   * Ver balance diario (producción - consumo)
   */
  async getCampBalances(campId: number): Promise<CampBalance[]> {
    const balances: CampBalance[] = [
      {
        resource_id: 1,
        resource_name: "RACIONES DE COMBALIDA",
        production: 15,
        consumption: 32,
        net: -17, // Net negative rate
      },
      {
        resource_id: 2,
        resource_name: "AGUA DESPERCUDIDA",
        production: 40,
        consumption: 48,
        net: -8, // Net negative rate
      },
      {
        resource_id: 3,
        resource_name: "KIT MÉDICO ESTRELLA",
        production: 2,
        consumption: 1,
        net: 1,
      },
      {
        resource_id: 5,
        resource_name: "MUNICIÓN 9MM COBRE",
        production: 120,
        consumption: 30,
        net: 90,
      }
    ];

    return simulateLatency(balances, 250);
  },

  /**
   * Calculates overall stats and survival score for a camp
   * Formula: comida + agua + (personas_sanas * 50) - (enfermedad/lesionados * 20) - (fallecidos * 100)
   */
  async getCampStatistics(campId: number): Promise<CampStatistics> {
    const persons = getDbData<Person[]>(KEYS.PERSONS);
    const inventories = getDbData<Inventory[]>(KEYS.INVENTORIES).filter(i => i.camp_id === campId);
    const explorations = getDbData<Exploration[]>(KEYS.EXPLORATIONS).filter(e => e.camp_id === campId);

    const total_persons = persons.length;
    const active_workers = persons.filter(p => p.can_work && p.status === 'active').length;
    const injured_or_sick = persons.filter(p => p.status === 'sick' || p.status === 'injured').length;
    const exploring = persons.filter(p => p.status === 'exploring').length;
    const deceased = persons.filter(p => p.status === 'deceased').length;
    const healthy = persons.filter(p => p.status === 'active').length;

    // Occupancy percentage
    const occupancy_rate = Math.round(((total_persons - deceased) / 8) * 100); // Max capacity is 8 beds

    // Done missions
    const explorations_completed = explorations.filter(e => e.status === 'completed').length;

    // Suministros
    const foodQty = inventories.find(i => i.resource_id === 1)?.current_quantity || 0;
    const waterQty = inventories.find(i => i.resource_id === 2)?.current_quantity || 0;

    // Calculation survival_score = comida + agua + (personas_sanas Ã— 50) - (enfermedad/lesionados Ã— 20) - (fallecidos Ã— 100)
    const survival_score = foodQty + waterQty + (healthy * 50) - (injured_or_sick * 20) - (deceased * 100);

    return simulateLatency({
      total_persons,
      active_workers,
      injured_or_sick,
      exploring,
      deceased,
      occupancy_rate,
      explorations_completed,
      survival_score,
    }, 300);
  }
};
