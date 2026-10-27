import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Ciclo de Vida de Mantenimientos (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let vehicleId: string;
  let mechanicId: string;
  let workshopId: string;
  let maintenanceId: string;

  const testPlate = `E${Date.now().toString().slice(-5)}`;
  const testEmail = `mateo.${Date.now()}@fleetcore.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@fleetcore.com', password: 'Admin12345!' });

    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Registrar un vehículo en la flota (ADMIN) → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plate: testPlate,
        brand: 'Scania',
        model: 'R500',
        year: 2024,
        mileage: 10000,
      })
      .expect(201);

    expect(res.body.data.plate).toBe(testPlate);
    expect(res.body.data.status).toBe('AVAILABLE');
    vehicleId = res.body.data.id;
  });

  it('2. Registrar un mecánico responsable (ADMIN) → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/mechanics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mateo Morales',
        email: testEmail,
        specialty: 'Sistemas Hidráulicos',
        status: 'ACTIVE',
      })
      .expect(201);

    expect(res.body.data.status).toBe('ACTIVE');
    mechanicId = res.body.data.id;
  });

  it('3. Registrar un taller autorizado (ADMIN) → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/workshops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Taller Occidente E2E',
        address: 'Calle 100 #20-50, Envigado',
        status: 'ACTIVE',
      })
      .expect(201);

    expect(res.body.data.status).toBe('ACTIVE');
    workshopId = res.body.data.id;
  });

  it('4. Crear un mantenimiento preventivo asignando vehículo, mecánico y taller → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/maintenances')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId,
        mechanicId,
        workshopId,
        type: 'PREVENTIVE',
        description: 'Mantenimiento preventivo general de 10.000 km',
        mileage: 10000,
        scheduledDate: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.data.status).toBe('SCHEDULED');
    expect(res.body.data.vehicleId).toBe(vehicleId);
    maintenanceId = res.body.data.id;
  });

  it('5. Iniciar el mantenimiento (IN_PROGRESS) y verificar que el vehículo pasa a IN_MAINTENANCE → 200', async () => {
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/maintenances/${maintenanceId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(patchRes.body.data.status).toBe('IN_PROGRESS');

    const vehicleRes = await request(app.getHttpServer())
      .get(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(vehicleRes.body.data.status).toBe('IN_MAINTENANCE');
  });

  it('6. Completar el mantenimiento registrando descripción, costo, kilometraje y fecha → 200', async () => {
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/maintenances/${maintenanceId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'COMPLETED',
        description: 'Revisión hidráulica y cambio de filtros completado satisfactoriamente',
        cost: 480.5,
        completedDate: new Date().toISOString(),
        mileage: 10025,
      })
      .expect(200);

    expect(patchRes.body.data.status).toBe('COMPLETED');
    expect(Number(patchRes.body.data.finalCost)).toBe(480.5);

    const vehicleRes = await request(app.getHttpServer())
      .get(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(vehicleRes.body.data.status).toBe('AVAILABLE');
    expect(vehicleRes.body.data.mileage).toBe(10025);
  });

  it('7. Consultar el historial de mantenimientos del vehículo por su placa → 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/maintenances/vehicle/${testPlate}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].id).toBe(maintenanceId);
    expect(res.body.data[0].mechanic.name).toBe('Mateo Morales');
    expect(res.body.data[0].workshop.name).toBe('Taller Occidente E2E');
  });

  it('8. Consultar el historial a través del sub-recurso /vehicles/:plate/maintenances → 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/vehicles/${testPlate}/maintenances`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe(maintenanceId);
  });
});
