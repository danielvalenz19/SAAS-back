// src/modules/clientes/clientes.repository.js
const { getPool } = require('../../config/db');

async function listClientes(empresaId, { search, activo }) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      id,
      empresa_id,
      nombre,
      nit,
      telefono,
      direccion,
      whatsapp,
      limite_credito,
      dias_credito,
      activo,
      created_at,
      updated_at
    FROM clientes
    WHERE empresa_id = ?
  `;

  if (activo !== undefined && activo !== null) {
    query += ' AND activo = ?';
    params.push(activo);
  }

  if (search && search !== '') {
    query += `
      AND (
        nombre LIKE ?
        OR nit LIKE ?
        OR telefono LIKE ?
        OR whatsapp LIKE ?
      )
    `;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  query += ' ORDER BY nombre ASC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findClienteById(empresaId, id) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      nombre,
      nit,
      telefono,
      direccion,
      whatsapp,
      limite_credito,
      dias_credito,
      activo,
      created_at,
      updated_at
    FROM clientes
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, id]
  );
  return rows[0];
}

async function createCliente(empresaId, data) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO clientes (
      empresa_id,
      nombre,
      nit,
      telefono,
      direccion,
      whatsapp,
      limite_credito,
      dias_credito,
      activo,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresaId,
      data.nombre,
      data.nit || null,
      data.telefono || null,
      data.direccion || null,
      data.whatsapp || null,
      data.limite_credito || 0,
      data.dias_credito || 0,
      data.activo !== undefined ? data.activo : 1
    ]
  );

  return result.insertId;
}

async function updateCliente(empresaId, id, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (!keys.length) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `
    UPDATE clientes
    SET ${setStr}, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [...values, empresaId, id]
  );

  return result.affectedRows > 0;
}

async function updateEstadoCliente(empresaId, id, activo) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE clientes
    SET activo = ?, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [activo, empresaId, id]
  );
  return result.affectedRows > 0;
}

async function getCreditosByCliente(empresaId, clienteId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      v.id,
      v.empresa_id,
      v.sucursal_id,
      s.nombre AS sucursal_nombre,
      v.cliente_id,
      v.fecha_venta,
      v.fecha_vencimiento,
      v.total_neto,
      v.saldo_pendiente,
      v.estado
    FROM ventas v
    JOIN sucursales s
      ON s.id = v.sucursal_id
     AND s.empresa_id = v.empresa_id
    WHERE v.empresa_id = ?
      AND v.cliente_id = ?
      AND v.tipo_venta = 'CREDITO'
      AND v.saldo_pendiente > 0
      AND v.estado IN ('PENDIENTE','PARCIAL')
    ORDER BY v.fecha_vencimiento IS NULL ASC, v.fecha_vencimiento ASC, v.fecha_venta ASC
    `,
    [empresaId, clienteId]
  );

  return rows;
}

module.exports = {
  listClientes,
  findClienteById,
  createCliente,
  updateCliente,
  updateEstadoCliente,
  getCreditosByCliente
};
