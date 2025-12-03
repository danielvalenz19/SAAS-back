// src/modules/creditos_clientes/creditos_clientes.repository.js
const { getPool } = require('../../config/db');

async function listCreditosClientes(empresaId, filters) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      v.id,
      v.empresa_id,
      v.sucursal_id,
      s.nombre AS sucursal_nombre,
      v.cliente_id,
      c.nombre AS cliente_nombre,
      v.fecha_venta,
      v.fecha_vencimiento,
      v.total_neto,
      v.saldo_pendiente,
      v.estado
    FROM ventas v
    LEFT JOIN clientes c
      ON c.id = v.cliente_id
     AND c.empresa_id = v.empresa_id
    LEFT JOIN sucursales s
      ON s.id = v.sucursal_id
     AND s.empresa_id = v.empresa_id
    WHERE v.empresa_id = ?
      AND v.tipo_venta = 'CREDITO'
  `;

  if (filters.cliente_id) {
    query += ' AND v.cliente_id = ?';
    params.push(filters.cliente_id);
  }

  if (filters.sucursal_id) {
    query += ' AND v.sucursal_id = ?';
    params.push(filters.sucursal_id);
  }

  if (filters.estado) {
    query += ' AND v.estado = ?';
    params.push(filters.estado);
  } else {
    query += " AND v.saldo_pendiente > 0 AND v.estado IN ('PENDIENTE','PARCIAL')";
  }

  if (filters.vencidos) {
    query += ' AND v.fecha_vencimiento IS NOT NULL AND v.fecha_vencimiento < NOW() AND v.saldo_pendiente > 0';
  }

  if (filters.fecha_desde) {
    query += ' AND v.fecha_venta >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ' AND v.fecha_venta <= ?';
    params.push(filters.fecha_hasta);
  }

  query += `
    ORDER BY
      v.fecha_vencimiento IS NULL ASC,
      v.fecha_vencimiento ASC,
      v.fecha_venta ASC
  `;

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findCreditoByVentaId(empresaId, ventaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      v.id,
      v.empresa_id,
      v.sucursal_id,
      s.nombre AS sucursal_nombre,
      v.cliente_id,
      c.nombre AS cliente_nombre,
      v.fecha_venta,
      v.fecha_vencimiento,
      v.total_bruto,
      v.descuento_total,
      v.total_neto,
      v.saldo_pendiente,
      v.estado,
      v.observaciones
    FROM ventas v
    LEFT JOIN clientes c
      ON c.id = v.cliente_id
     AND c.empresa_id = v.empresa_id
    LEFT JOIN sucursales s
      ON s.id = v.sucursal_id
     AND s.empresa_id = v.empresa_id
    WHERE v.empresa_id = ?
      AND v.id = ?
      AND v.tipo_venta = 'CREDITO'
    `,
    [empresaId, ventaId]
  );
  return rows[0];
}

async function listPagosByVenta(empresaId, ventaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      venta_id,
      cliente_id,
      fecha_pago,
      monto,
      metodo_pago,
      referencia_pago,
      usuario_id,
      observaciones,
      created_at
    FROM pagos_cliente
    WHERE empresa_id = ?
      AND venta_id = ?
    ORDER BY fecha_pago ASC, id ASC
    `,
    [empresaId, ventaId]
  );
  return rows;
}

module.exports = {
  listCreditosClientes,
  findCreditoByVentaId,
  listPagosByVenta
};
