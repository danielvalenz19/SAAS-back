// src/modules/sucursales/sucursales.service.js
const repo = require('./sucursales.repository');

async function list(empresaId) {
  return repo.listSucursales(empresaId);
}

async function create(empresaId, data) {
  if (!data.nombre) {
    const err = new Error('El nombre de la sucursal es requerido');
    err.statusCode = 400;
    throw err;
  }

  const id = await repo.createSucursal(empresaId, data);

  if (data.es_principal === true || data.es_principal === 1 || data.es_principal === '1') {
    await repo.setPrincipal(id, empresaId);
  }

  return id;
}

async function detail(empresaId, id) {
  const sucursal = await repo.findSucursalById(id, empresaId);
  if (!sucursal) {
    const err = new Error('Sucursal no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return sucursal;
}

async function update(empresaId, id, data) {
  const allowed = ['nombre', 'direccion', 'telefono'];

  const updateData = Object.keys(data || {})
    .filter((k) => allowed.includes(k))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateSucursal(id, empresaId, updateData);
  if (!updated) {
    const err = new Error('Sucursal no encontrada');
    err.statusCode = 404;
    throw err;
  }

  return true;
}

async function setPrincipal(empresaId, id) {
  const sucursal = await repo.findSucursalById(id, empresaId);
  if (!sucursal) {
    const err = new Error('Sucursal no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const updated = await repo.setPrincipal(id, empresaId);
  if (!updated) {
    const err = new Error('No se pudo marcar como principal');
    err.statusCode = 400;
    throw err;
  }

  return true;
}

module.exports = {
  list,
  create,
  detail,
  update,
  setPrincipal
};
