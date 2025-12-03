// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/config/db');

describe('Auth endpoints', () => {
  const emailOwner = `owner.test+${Date.now()}@inventariosaas.com`;
  const passwordOwner = 'Contrasena4321!';

  let accessToken = null;

  beforeAll(async () => {
    await initDB();
  });

  test('POST /auth/register-owner debe registrar empresa + dueño', async () => {
    const res = await request(app).post('/auth/register-owner').send({
      empresa_nombre: 'Empresa Test Jest',
      sucursal_nombre: 'Matriz Test',
      nombre: 'Owner Test Jest',
      email: emailOwner,
      password: passwordOwner
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('empresaId');
    expect(res.body.data).toHaveProperty('sucursalId');
    expect(res.body.data).toHaveProperty('usuarioId');
    expect(res.body.data).toHaveProperty('rolId');
  });

  test('POST /auth/login debe devolver access_token', async () => {
    const res = await request(app).post('/auth/login').send({
      email: emailOwner,
      password: passwordOwner
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('access_token');

    accessToken = res.body.access_token;
  });

  test('GET /auth/me debe devolver datos del usuario logueado', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.usuario).toHaveProperty('email', emailOwner);
    expect(res.body.usuario).toHaveProperty('empresa_id');
    expect(res.body.usuario).toHaveProperty('sucursal_id');
    expect(res.body.usuario.roles).toContain('Owner');
  });
});
