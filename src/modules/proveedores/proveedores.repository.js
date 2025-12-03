// src/modules/proveedores/proveedores.repository.js
const { getPool } = require('../../config/db');

async function listProveedores(empresaId, { search, activo }) {
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
      email,
      whatsapp,
      dias_credito,
      activo,
      created_at,
      updated_at
    FROM proveedores
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
        OR email LIKE ?
        OR whatsapp LIKE ?
      )
    `;
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  query += ' ORDER BY nombre ASC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findProveedorById(empresaId, id) {
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
      email,
      whatsapp,
      dias_credito,
      activo,
      created_at,
      updated_at
    FROM proveedores
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, id]
  );
  return rows[0];
}

async function createProveedor(empresaId, data) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO proveedores (
      empresa_id,
      nombre,
      nit,
      telefono,
      direccion,
      email,
      whatsapp,
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
      data.email || null,
      data.whatsapp || null,
      data.dias_credito || 0,
      data.activo !== undefined ? data.activo : 1
    ]
  );

  return result.insertId;
}

async function updateProveedor(empresaId, id, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (!keys.length) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `
    UPDATE proveedores
    SET ${setStr}, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [...values, empresaId, id]
  );

  return result.affectedRows > 0;
}

async function updateEstadoProveedor(empresaId, id, activo) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE proveedores
    SET activo = ?, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [activo, empresaId, id]
  );
  return result.affectedRows > 0;
}

async function getCreditosByProveedor(empresaId, proveedorId) {
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
      c.total_neto,
      c.saldo_pendiente,
      c.estado
    FROM compras c
    JOIN sucursales s
      ON s.id = c.sucursal_id
     AND s.empresa_id = c.empresa_id
    JOIN proveedores p
      ON p.id = c.proveedor_id
     AND p.empresa_id = c.empresa_id
    WHERE c.empresa_id = ?
      AND c.proveedor_id = ?
      AND c.tipo_compra = 'CREDITO'
      AND c.saldo_pendiente > 0
      AND c.estado IN ('PENDIENTE','PARCIAL')
    ORDER BY c.fecha_vencimiento IS NULL ASC, c.fecha_vencimiento ASC, c.fecha_compra ASC
    `,
    [empresaId, proveedorId]
  );

  return rows;
}

module.exports = {
  listProveedores,
  findProveedorById,
  createProveedor,
  updateProveedor,
  updateEstadoProveedor,
  getCreditosByProveedor
};
