// tests/empresaSucursales.test.js
const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/config/db');

describe('Empresa y Sucursales', () => {
  const emailOwner = `owner.empresa+${Date.now()}@inventariosaas.com`;
  const passwordOwner = 'Contrasena4321!';

  let accessToken = null;
  let empresaId = null;
  let sucursalInicialId = null;
  let sucursalNuevaId = null;

  beforeAll(async () => {
    await initDB();

    const resRegister = await request(app).post('/auth/register-owner').send({
      empresa_nombre: 'Empresa Jest Empresa',
      sucursal_nombre: 'Matriz Jest',
      nombre: 'Owner Empresa Jest',
      email: emailOwner,
      password: passwordOwner
    });

    expect(resRegister.statusCode).toBe(201);
    expect(resRegister.body.ok).toBe(true);

    empresaId = resRegister.body.data.empresaId;
    sucursalInicialId = resRegister.body.data.sucursalId;

    const resLogin = await request(app).post('/auth/login').send({
      email: emailOwner,
      password: passwordOwner
    });

    expect(resLogin.statusCode).toBe(200);
    accessToken = resLogin.body.access_token;
  });

  test('GET /empresa debe devolver info de la empresa correcta', async () => {
    const res = await request(app)
      .get('/empresa')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('id', empresaId);
    expect(res.body.data).toHaveProperty('nombre', 'Empresa Jest Empresa');
  });

  test('GET /sucursales debe listar al menos la sucursal inicial', async () => {
    const res = await request(app)
      .get('/sucursales')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const sucursales = res.body.data;
    const found = sucursales.find((s) => s.id === sucursalInicialId);

    expect(found).toBeDefined();
    expect(found.es_principal).toBe(1);
  });

  test('POST /sucursales debe crear una sucursal nueva', async () => {
    const res = await request(app)
      .post('/sucursales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nombre: 'Sucursal Secundaria Jest',
        direccion: 'Zona 2, Jest City',
        telefono: '+50277778888'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('id');

    sucursalNuevaId = res.body.id;
  });

  test('PATCH /sucursales/:id/principal debe marcar la nueva sucursal como principal', async () => {
    const res = await request(app)
      .patch(`/sucursales/${sucursalNuevaId}/principal`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const resSucursales = await request(app)
      .get('/sucursales')
      .set('Authorization', `Bearer ${accessToken}`);

    const sucursales = resSucursales.body.data;
    const principal = sucursales.find((s) => s.es_principal === 1);
    expect(principal).toBeDefined();
    expect(principal.id).toBe(sucursalNuevaId);
  });
});
