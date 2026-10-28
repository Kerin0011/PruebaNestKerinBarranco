import { jest } from '@jest/globals';
import { IntegrationsController } from './integrations.controller.js';

describe('IntegrationsController', () => {
  it('retorna el resumen estadístico de la flota', async () => {
    const vehiclesService = {
      findAll: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({
        items: [
          { id: 'v1', status: 'AVAILABLE' },
          { id: 'v2', status: 'AVAILABLE' },
          { id: 'v3', status: 'IN_MAINTENANCE' },
          { id: 'v4', status: 'INACTIVE' },
        ],
        meta: { total: 4 },
      }),
    };
    const maintenancesService = {
      findActive: jest.fn<(...args: any[]) => Promise<any>>(),
    };

    const controller = new IntegrationsController(
      vehiclesService as any,
      maintenancesService as any,
    );

    const result = await controller.getFleetStatus();

    expect(result.totalVehicles).toBe(4);
    expect(result.available).toBe(2);
    expect(result.inMaintenance).toBe(1);
    expect(result.inactive).toBe(1);
    expect(result.timestamp).toBeDefined();
  });

  it('retorna la lista de mantenimientos activos para ERPs externos', async () => {
    const activeList = [{ id: 'm1', status: 'IN_PROGRESS' }];
    const vehiclesService = { findAll: jest.fn<(...args: any[]) => Promise<any>>() };
    const maintenancesService = {
      findActive: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(activeList),
    };

    const controller = new IntegrationsController(
      vehiclesService as any,
      maintenancesService as any,
    );

    const result = await controller.getActiveMaintenances();
    expect(result).toEqual(activeList);
  });
});
