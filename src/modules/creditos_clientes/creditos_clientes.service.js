// src/modules/creditos_clientes/creditos_clientes.service.js
const repo = require('./creditos_clientes.repository');

function parseBool(value) {
  if (value === undefined || value === null) return false;
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  return false;
}

function parseIntOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

async function list(empresaId, filtersRaw) {
  const filters = {
    estado: filtersRaw.estado || undefined,
    vencidos: parseBool(filtersRaw.vencidos),
    cliente_id: parseIntOrUndefined(filtersRaw.cliente_id),
    sucursal_id: parseIntOrUndefined(filtersRaw.sucursal_id),
    fecha_desde: filtersRaw.fecha_desde || undefined,
    fecha_hasta: filtersRaw.fecha_hasta || undefined
  };

  return repo.listCreditosClientes(empresaId, filters);
}

async function detail(empresaId, ventaId) {
  const venta = await repo.findCreditoByVentaId(empresaId, ventaId);
  if (!venta) {
    const err = new Error('Crédito no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const pagos = await repo.listPagosByVenta(empresaId, ventaId);

  return {
    venta,
    pagos
  };
}

module.exports = {
  list,
  detail
};
