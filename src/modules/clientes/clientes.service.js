// src/modules/clientes/clientes.service.js
const repo = require('./clientes.repository');

function parseActivo(value) {
  if (value === undefined || value === null) return undefined;
  if (value === '0' || value === 0 || value === false || value === 'false') return 0;
  return 1;
}

function parseNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

async function list(empresaId, filters) {
  const search = filters.search;
  const activo = parseActivo(filters.activo);
  return repo.listClientes(empresaId, { search, activo });
}

async function create(empresaId, data) {
  if (!data.nombre) {
    const err = new Error('El nombre del cliente es requerido');
    err.statusCode = 400;
    throw err;
  }

  const payload = {
    nombre: data.nombre,
    nit: data.nit,
    telefono: data.telefono,
    direccion: data.direccion,
    whatsapp: data.whatsapp,
    limite_credito: parseNumberOrNull(data.limite_credito) ?? 0,
    dias_credito: parseNumberOrNull(data.dias_credito) ?? 0,
    activo: parseActivo(data.activo)
  };

  const id = await repo.createCliente(empresaId, payload);
  return id;
}

async function detail(empresaId, id) {
  return repo.findClienteById(empresaId, id);
}

async function update(empresaId, id, data) {
  const allowed = [
    'nombre',
    'nit',
    'telefono',
    'direccion',
    'whatsapp',
    'limite_credito',
    'dias_credito'
  ];

  const updateData = Object.keys(data || {})
    .filter((k) => allowed.includes(k))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

  if (updateData.limite_credito !== undefined) {
    updateData.limite_credito = parseNumberOrNull(updateData.limite_credito) ?? 0;
  }

  if (updateData.dias_credito !== undefined) {
    updateData.dias_credito = parseNumberOrNull(updateData.dias_credito) ?? 0;
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateCliente(empresaId, id, updateData);
  if (!updated) {
    const err = new Error('Cliente no encontrado');
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

  const updated = await repo.updateEstadoCliente(empresaId, id, parsed);
  if (!updated) {
    const err = new Error('Cliente no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return true;
}

async function getCreditos(empresaId, clienteId) {
  return repo.getCreditosByCliente(empresaId, clienteId);
}

module.exports = {
  list,
  create,
  detail,
  update,
  changeEstado,
  getCreditos
};
