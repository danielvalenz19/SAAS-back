// src/modules/roles/roles.service.js
const repo = require('./roles.repository');

async function list(empresaId) {
  return repo.listRoles(empresaId);
}

async function create(empresaId, data) {
  const { nombre, descripcion } = data || {};

  if (!nombre) {
    const err = new Error('El nombre del rol es requerido');
    err.statusCode = 400;
    throw err;
  }

  const existing = await repo.findRoleByName(nombre, empresaId);
  if (existing) {
    const err = new Error('Ya existe un rol con ese nombre en la empresa');
    err.statusCode = 409;
    throw err;
  }

  const id = await repo.createRole(empresaId, { nombre, descripcion });
  return id;
}

async function detail(empresaId, id) {
  return repo.findRoleById(id, empresaId);
}

async function update(empresaId, id, data) {
  const { nombre, descripcion } = data || {};

  if (nombre === undefined && descripcion === undefined) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const role = await repo.findRoleById(id, empresaId);
  if (!role) {
    const err = new Error('Rol no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (role.es_rol_sistema) {
    const err = new Error('No se puede editar un rol de sistema');
    err.statusCode = 400;
    throw err;
  }

  if (nombre && nombre !== role.nombre) {
    const existing = await repo.findRoleByName(nombre, empresaId);
    if (existing && Number(existing.id) !== Number(id)) {
      const err = new Error('Ya existe otro rol con ese nombre en la empresa');
      err.statusCode = 409;
      throw err;
    }
  }

  const fieldsToUpdate = {};
  if (nombre !== undefined) fieldsToUpdate.nombre = nombre;
  if (descripcion !== undefined) fieldsToUpdate.descripcion = descripcion ?? null;

  const updated = await repo.updateRole(id, empresaId, fieldsToUpdate);
  if (!updated) {
    const err = new Error('No se pudo actualizar el rol');
    err.statusCode = 500;
    throw err;
  }

  return true;
}

async function remove(empresaId, id) {
  const role = await repo.findRoleById(id, empresaId);
  if (!role) {
    const err = new Error('Rol no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (role.es_rol_sistema) {
    const err = new Error('No se puede eliminar un rol de sistema');
    err.statusCode = 400;
    throw err;
  }

  const totalUsuarios = await repo.countUsuariosByRol(id, empresaId);
  if (totalUsuarios > 0) {
    const err = new Error('No se puede eliminar el rol porque tiene usuarios asignados');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await repo.deleteRole(id, empresaId);
  if (!deleted) {
    const err = new Error('No se pudo eliminar el rol');
    err.statusCode = 500;
    throw err;
  }

  return true;
}

module.exports = {
  list,
  create,
  detail,
  update,
  remove
};
