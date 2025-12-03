// src/modules/creditos_proveedores/creditos_proveedores.service.js
const repo = require('./creditos_proveedores.repository');

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
    proveedor_id: parseIntOrUndefined(filtersRaw.proveedor_id),
    sucursal_id: parseIntOrUndefined(filtersRaw.sucursal_id),
    fecha_desde: filtersRaw.fecha_desde || undefined,
    fecha_hasta: filtersRaw.fecha_hasta || undefined
  };

  return repo.listCreditosProveedores(empresaId, filters);
}

async function detail(empresaId, compraId) {
  const compra = await repo.findCreditoByCompraId(empresaId, compraId);
  if (!compra) {
    const err = new Error('Crédito de proveedor no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const pagos = await repo.listPagosByCompra(empresaId, compraId);

  return {
    compra,
    pagos
  };
}

module.exports = {
  list,
  detail
};
