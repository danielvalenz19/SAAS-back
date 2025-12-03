// tests/usuarios.test.js
const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/config/db');

describe('Usuarios endpoints', () => {
  const emailOwner = `owner.users+${Date.now()}@inventariosaas.com`;
  const passwordOwner = 'Contrasena4321!';

  const newUserEmail = `user.test+${Date.now()}@inventariosaas.com`;
  const newUserPassword = 'Contrasena4321!';

  let accessToken = null;
  let empresaId = null;
  let sucursalInicialId = null;
  let baseRoleId = null;
  let extraRoleId = null;
  let extraRoleId2 = null;
  let createdUserId = null;

  beforeAll(async () => {
    await initDB();

    const resRegister = await request(app).post('/auth/register-owner').send({
      empresa_nombre: 'Empresa Jest Usuarios',
      sucursal_nombre: 'Matriz Usuarios',
      nombre: 'Owner Usuarios',
      email: emailOwner,
      password: passwordOwner
    });

    expect(resRegister.statusCode).toBe(201);
    empresaId = resRegister.body.data.empresaId;
    sucursalInicialId = resRegister.body.data.sucursalId;

    const resLogin = await request(app).post('/auth/login').send({
      email: emailOwner,
      password: passwordOwner
    });

    expect(resLogin.statusCode).toBe(200);
    accessToken = resLogin.body.access_token;

    const resRoles = await request(app)
      .get('/roles')
      .set('Authorization', `Bearer ${accessToken}`);

    baseRoleId = resRoles.body.data.find((r) => r.nombre === 'Owner').id;

    const resNewRole = await request(app)
      .post('/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nombre: `Tester Users ${Date.now()}`, descripcion: 'Rol test user' });

    extraRoleId = resNewRole.body.id;

    const resNewRole2 = await request(app)
      .post('/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nombre: `Support Users ${Date.now()}`, descripcion: 'Rol support user' });

    extraRoleId2 = resNewRole2.body.id;
  });

  test('POST /usuarios debe crear un usuario nuevo', async () => {
    const res = await request(app)
      .post('/usuarios')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sucursal_id: sucursalInicialId,
        nombre: 'Usuario Test',
        apellido: 'Jest',
        email: newUserEmail,
        telefono: '+000111222',
        password: newUserPassword,
        roles: [extraRoleId]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    createdUserId = res.body.id;
  });

  test('GET /usuarios debe listar el usuario creado', async () => {
    const res = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    const found = res.body.data.find((u) => u.id === createdUserId);
    expect(found).toBeDefined();
    expect(found.email).toBe(newUserEmail);
  });

  test('GET /usuarios/:id debe traer detalle del usuario', async () => {
    const res = await request(app)
      .get(`/usuarios/${createdUserId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('id', createdUserId);
    expect(res.body.data).toHaveProperty('empresa_id', empresaId);
  });

  test('PUT /usuarios/:id debe actualizar datos básicos', async () => {
    const res = await request(app)
      .put(`/usuarios/${createdUserId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ telefono: '+000999888', nombre: 'Usuario Editado' });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('PATCH /usuarios/:id/estado debe desactivar al usuario', async () => {
    const res = await request(app)
      .patch(`/usuarios/${createdUserId}/estado`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ activo: 0 });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('GET /usuarios/:id/roles debe devolver sus roles', async () => {
    const res = await request(app)
      .get(`/usuarios/${createdUserId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.roles)).toBe(true);
  });

  test('PUT /usuarios/:id/roles debe reemplazar roles', async () => {
    const res = await request(app)
      .put(`/usuarios/${createdUserId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ roles: [baseRoleId, extraRoleId2] });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
