// tests/roles.test.js
const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/config/db');

describe('Roles endpoints', () => {
  const emailOwner = `owner.roles+${Date.now()}@inventariosaas.com`;
  const passwordOwner = 'Contrasena4321!';

  let accessToken = null;
  let empresaId = null;
  let createdRoleId = null;

  beforeAll(async () => {
    await initDB();

    const resRegister = await request(app).post('/auth/register-owner').send({
      empresa_nombre: 'Empresa Jest Roles',
      sucursal_nombre: 'Matriz Roles',
      nombre: 'Owner Roles',
      email: emailOwner,
      password: passwordOwner
    });

    expect(resRegister.statusCode).toBe(201);
    empresaId = resRegister.body.data.empresaId;

    const resLogin = await request(app).post('/auth/login').send({
      email: emailOwner,
      password: passwordOwner
    });

    expect(resLogin.statusCode).toBe(200);
    accessToken = resLogin.body.access_token;
  });

  test('GET /roles debe listar al menos el rol Owner', async () => {
    const res = await request(app)
      .get('/roles')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    const owner = res.body.data.find((r) => r.nombre === 'Owner');
    expect(owner).toBeDefined();
  });

  test('POST /roles debe crear un rol nuevo', async () => {
    const res = await request(app)
      .post('/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nombre: `Tester ${Date.now()}`,
        descripcion: 'Rol de pruebas'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    createdRoleId = res.body.id;
  });

  test('GET /roles/:id debe devolver el rol creado', async () => {
    const res = await request(app)
      .get(`/roles/${createdRoleId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('id', createdRoleId);
    expect(res.body.data).toHaveProperty('empresa_id', empresaId);
  });

  test('PUT /roles/:id debe actualizar el rol', async () => {
    const res = await request(app)
      .put(`/roles/${createdRoleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ descripcion: 'Rol de pruebas actualizado' });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('DELETE /roles/:id debe eliminar el rol', async () => {
    const res = await request(app)
      .delete(`/roles/${createdRoleId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
