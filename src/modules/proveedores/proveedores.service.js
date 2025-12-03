// src/modules/proveedores/proveedores.service.js
const repo = require('./proveedores.repository');

function parseActivo(value) {
  if (value === undefined || value === null) return undefined;
  if (value === '0' || value === 0 || value === false || value === 'false') return 0;
  return 1;
}

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

async function list(empresaId, filters) {
  const search = filters.search;
  const activo = parseActivo(filters.activo);
  return repo.listProveedores(empresaId, { search, activo });
}

async function create(empresaId, data) {
  if (!data.nombre) {
    const err = new Error('El nombre del proveedor es requerido');
    err.statusCode = 400;
    throw err;
  }

  const payload = {
    nombre: data.nombre,
    nit: data.nit,
    telefono: data.telefono,
    direccion: data.direccion,
    email: data.email,
    whatsapp: data.whatsapp,
    dias_credito: parseIntOrNull(data.dias_credito) ?? 0,
    activo: parseActivo(data.activo)
  };

  const id = await repo.createProveedor(empresaId, payload);
  return id;
}

async function detail(empresaId, id) {
  return repo.findProveedorById(empresaId, id);
}

async function update(empresaId, id, data) {
  const allowed = ['nombre', 'nit', 'telefono', 'direccion', 'email', 'whatsapp', 'dias_credito'];

  const updateData = Object.keys(data || {})
    .filter((k) => allowed.includes(k))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

  if (updateData.dias_credito !== undefined) {
    updateData.dias_credito = parseIntOrNull(updateData.dias_credito) ?? 0;
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateProveedor(empresaId, id, updateData);
  if (!updated) {
    const err = new Error('Proveedor no encontrado');
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

  const updated = await repo.updateEstadoProveedor(empresaId, id, parsed);
  if (!updated) {
    const err = new Error('Proveedor no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return true;
}

async function getCreditos(empresaId, proveedorId) {
  return repo.getCreditosByProveedor(empresaId, proveedorId);
}

module.exports = {
  list,
  create,
  detail,
  update,
  changeEstado,
  getCreditos
};
