// src/modules/unidadesMedida/unidadesMedida.service.js
const repo = require('./unidadesMedida.repository');

async function list(empresaId) {
  return repo.listUnidades(empresaId);
}

async function create(empresaId, data) {
  const { nombre, abreviatura, factor_base } = data || {};

  if (!nombre || !abreviatura) {
    const err = new Error('Nombre y abreviatura son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const existing = await repo.findUnidadByNombre(empresaId, nombre);
  if (existing) {
    const err = new Error('Ya existe una unidad de medida con ese nombre en la empresa');
    err.statusCode = 409;
    throw err;
  }

  const id = await repo.createUnidad(empresaId, {
    nombre,
    abreviatura,
    factor_base
  });

  return id;
}

async function detail(empresaId, id) {
  const unidad = await repo.findUnidadById(id, empresaId);
  if (!unidad) {
    const err = new Error('Unidad de medida no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return unidad;
}

async function update(empresaId, id, data) {
  const { nombre, abreviatura, factor_base } = data || {};

  const unidad = await repo.findUnidadById(id, empresaId);
  if (!unidad) {
    const err = new Error('Unidad de medida no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (nombre !== undefined && nombre !== unidad.nombre) {
    const existing = await repo.findUnidadByNombre(empresaId, nombre);
    if (existing && Number(existing.id) !== Number(id)) {
      const err = new Error('Ya existe otra unidad con ese nombre en la empresa');
      err.statusCode = 409;
      throw err;
    }
  }

  const fieldsToUpdate = {};
  if (nombre !== undefined) fieldsToUpdate.nombre = nombre;
  if (abreviatura !== undefined) fieldsToUpdate.abreviatura = abreviatura;
  if (factor_base !== undefined) fieldsToUpdate.factor_base = factor_base;

  if (Object.keys(fieldsToUpdate).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const ok = await repo.updateUnidad(id, empresaId, fieldsToUpdate);
  if (!ok) {
    const err = new Error('No se pudo actualizar la unidad de medida');
    err.statusCode = 500;
    throw err;
  }

  return true;
}

module.exports = {
  list,
  create,
  detail,
  update
};
