// src/modules/creditos_proveedores/creditos_proveedores.repository.js
const { getPool } = require('../../config/db');

async function listCreditosProveedores(empresaId, filters) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      c.id,
      c.empresa_id,
      c.sucursal_id,
      s.nombre AS sucursal_nombre,
      c.proveedor_id,
      p.nombre AS proveedor_nombre,
      c.fecha_compra,
      c.fecha_vencimiento,
      c.total_neto,
      c.saldo_pendiente,
      c.estado
    FROM compras c
    LEFT JOIN proveedores p
      ON p.id = c.proveedor_id
     AND p.empresa_id = c.empresa_id
    LEFT JOIN sucursales s
      ON s.id = c.sucursal_id
     AND s.empresa_id = c.empresa_id
    WHERE c.empresa_id = ?
      AND c.tipo_compra = 'CREDITO'
  `;

  if (filters.proveedor_id) {
    query += ' AND c.proveedor_id = ?';
    params.push(filters.proveedor_id);
  }

  if (filters.sucursal_id) {
    query += ' AND c.sucursal_id = ?';
    params.push(filters.sucursal_id);
  }

  if (filters.estado) {
    query += ' AND c.estado = ?';
    params.push(filters.estado);
  } else {
    query += " AND c.saldo_pendiente > 0 AND c.estado IN ('PENDIENTE','PARCIAL')";
  }

  if (filters.vencidos) {
    query += `
      AND c.fecha_vencimiento IS NOT NULL
      AND c.fecha_vencimiento < NOW()
      AND c.saldo_pendiente > 0
    `;
  }

  if (filters.fecha_desde) {
    query += ' AND c.fecha_compra >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ' AND c.fecha_compra <= ?';
    params.push(filters.fecha_hasta);
  }

  query += `
    ORDER BY
      c.fecha_vencimiento IS NULL ASC,
      c.fecha_vencimiento ASC,
      c.fecha_compra ASC
  `;

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findCreditoByCompraId(empresaId, compraId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.empresa_id,
      c.sucursal_id,
      s.nombre AS sucursal_nombre,
      c.proveedor_id,
      p.nombre AS proveedor_nombre,
      c.fecha_compra,
      c.fecha_vencimiento,
      c.total_bruto,
      c.descuento_total,
      c.total_neto,
      c.saldo_pendiente,
      c.estado,
      c.observaciones
    FROM compras c
    LEFT JOIN proveedores p
      ON p.id = c.proveedor_id
     AND p.empresa_id = c.empresa_id
    LEFT JOIN sucursales s
      ON s.id = c.sucursal_id
     AND s.empresa_id = c.empresa_id
    WHERE c.empresa_id = ?
      AND c.id = ?
      AND c.tipo_compra = 'CREDITO'
    `,
    [empresaId, compraId]
  );
  return rows[0];
}

async function listPagosByCompra(empresaId, compraId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      compra_id,
      proveedor_id,
      fecha_pago,
      monto,
      metodo_pago,
      referencia_pago,
      usuario_id,
      observaciones,
      created_at
    FROM pagos_proveedor
    WHERE empresa_id = ?
      AND compra_id = ?
    ORDER BY fecha_pago ASC, id ASC
    `,
    [empresaId, compraId]
  );
  return rows;
}

module.exports = {
  listCreditosProveedores,
  findCreditoByCompraId,
  listPagosByCompra
};
