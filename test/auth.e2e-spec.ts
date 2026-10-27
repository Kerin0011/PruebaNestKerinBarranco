import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Auth & Integrations (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const user = {
    name: 'Técnico Prueba',
    email: 'tecnico.prueba@fleetcore.com',
    password: 'Clave1234!',
    role: 'TECHNICIAN',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra un usuario → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rechaza email duplicado → 409', () =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(409));

  it('hace login → 200 con token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    token = res.body.data.accessToken;
  });

  it('GET /api/users/me sin token → 401', () =>
    request(app.getHttpServer()).get('/api/users/me').expect(401));

  it('GET /api/users/me con token → 200', () =>
    request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200));

  it('GET /api/integrations/fleet-status sin x-api-key → 401', () =>
    request(app.getHttpServer()).get('/api/integrations/fleet-status').expect(401));

  it('GET /api/integrations/fleet-status con x-api-key correcta → 200', () =>
    request(app.getHttpServer())
      .get('/api/integrations/fleet-status')
      .set('x-api-key', 'test-api-key-fleetcore-2026')
      .expect(200));
});
