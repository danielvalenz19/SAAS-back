// src/modules/users/users.service.js
const bcrypt = require('bcryptjs');
const repo = require('./users.repository');

function parseActivo(value) {
  if (value === undefined || value === null) return undefined;
  if (value === '0' || value === 0 || value === false || value === 'false') return 0;
  return 1;
}

async function list(empresaId, filters) {
  const parsedFilters = {
    sucursal_id: filters.sucursal_id,
    activo: parseActivo(filters.activo)
  };
  return repo.listUsers(empresaId, parsedFilters);
}

async function create(empresaId, data) {
  if (!data.nombre || !data.email || !data.password || !data.sucursal_id) {
    const err = new Error('Nombre, email, password y sucursal_id son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const existing = await repo.findUserByEmail(data.email, empresaId);
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userId = await repo.createUser({
    empresa_id: empresaId,
    sucursal_id: data.sucursal_id,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    telefono: data.telefono,
    password_hash: hashedPassword
  });

  if (Array.isArray(data.roles)) {
    await replaceRoles(empresaId, userId, data.roles);
  }

  return userId;
}

async function detail(empresaId, id) {
  return repo.findUserById(id, empresaId);
}

async function update(empresaId, id, data) {
  const allowed = ['nombre', 'apellido', 'email', 'telefono', 'sucursal_id'];
  const updateData = Object.keys(data)
    .filter((k) => allowed.includes(k))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

  if (updateData.email) {
    const existing = await repo.findUserByEmail(updateData.email, empresaId);
    if (existing && Number(existing.id) !== Number(id)) {
      const err = new Error('El email ya está registrado por otro usuario');
      err.statusCode = 409;
      throw err;
    }
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateUser(id, empresaId, updateData);
  if (!updated) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return true;
}

async function changeEstado(empresaId, id, activo) {
  const parsed = parseActivo(activo);
  if (parsed === undefined) {
    const err = new Error('El estado activo es requerido (1 o 0)');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateEstado(id, empresaId, parsed);
  if (!updated) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return true;
}

async function getRoles(empresaId, id) {
  const user = await repo.findUserById(id, empresaId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return repo.getRolesByUserId(id, empresaId);
}

async function replaceRoles(empresaId, id, roles) {
  if (!Array.isArray(roles)) {
    const err = new Error('Roles debe ser un arreglo de IDs');
    err.statusCode = 400;
    throw err;
  }

  const existingRoles = await repo.findRolesByIds(roles, empresaId);
  if (existingRoles.length !== roles.length) {
    const err = new Error('Algunos roles no pertenecen a la empresa');
    err.statusCode = 400;
    throw err;
  }

  const user = await repo.findUserById(id, empresaId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  await repo.replaceRoles(id, roles, empresaId);
  return true;
}

module.exports = {
  list,
  create,
  detail,
  update,
  changeEstado,
  getRoles,
  replaceRoles
};
