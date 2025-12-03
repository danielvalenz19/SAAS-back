// tests/catalogos.test.js
const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/config/db');

describe('Categorías y Unidades de Medida', () => {
  const emailOwner = `owner.catalogos+${Date.now()}@inventariosaas.com`;
  const passwordOwner = 'Contrasena4321!';

  let accessToken = null;
  let categoriaRootId = null;
  let categoriaChildId = null;
  let unidadId = null;

  beforeAll(async () => {
    await initDB();

    const resRegister = await request(app).post('/auth/register-owner').send({
      empresa_nombre: 'Empresa Jest Catalogos',
      sucursal_nombre: 'Matriz Catalogos',
      nombre: 'Owner Catalogos',
      email: emailOwner,
      password: passwordOwner
    });

    expect(resRegister.statusCode).toBe(201);

    const resLogin = await request(app).post('/auth/login').send({
      email: emailOwner,
      password: passwordOwner
    });

    accessToken = resLogin.body.access_token;
  });

  test('POST /categorias crea categoría raíz', async () => {
    const res = await request(app)
      .post('/categorias')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nombre: 'Root Jest', descripcion: 'Categoria raiz' });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    categoriaRootId = res.body.id;
  });

  test('POST /categorias crea categoría hija', async () => {
    const res = await request(app)
      .post('/categorias')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nombre: 'Hija Jest', categoria_padre_id: categoriaRootId });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    categoriaChildId = res.body.id;
  });

  test('GET /categorias?padre_id=null devuelve raíz', async () => {
    const res = await request(app)
      .get('/categorias?padre_id=null')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    const found = res.body.data.find((c) => c.id === categoriaRootId);
    expect(found).toBeDefined();
  });

  test('GET /categorias?padre_id=root devuelve hija', async () => {
    const res = await request(app)
      .get(`/categorias?padre_id=${categoriaRootId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    const found = res.body.data.find((c) => c.id === categoriaChildId);
    expect(found).toBeDefined();
  });

  test('PUT /categorias/:id actualiza categoría', async () => {
    const res = await request(app)
      .put(`/categorias/${categoriaChildId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ descripcion: 'Categoria hija actualizada' });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('DELETE /categorias/:id elimina categoría hija', async () => {
    const res = await request(app)
      .delete(`/categorias/${categoriaChildId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('DELETE /categorias/:id elimina categoría raíz', async () => {
    const res = await request(app)
      .delete(`/categorias/${categoriaRootId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('POST /unidades-medida crea unidad', async () => {
    const res = await request(app)
      .post('/unidades-medida')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nombre: 'Unidad Jest', abreviatura: 'UJ', factor_base: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    unidadId = res.body.id;
  });

  test('GET /unidades-medida debe listar la unidad', async () => {
    const res = await request(app)
      .get('/unidades-medida')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    const found = res.body.data.find((u) => u.id === unidadId);
    expect(found).toBeDefined();
  });

  test('GET /unidades-medida/:id devuelve detalle', async () => {
    const res = await request(app)
      .get(`/unidades-medida/${unidadId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('id', unidadId);
  });

  test('PUT /unidades-medida/:id actualiza la unidad', async () => {
    const res = await request(app)
      .put(`/unidades-medida/${unidadId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ abreviatura: 'UJ2', factor_base: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
