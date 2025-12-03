// src/modules/inventario/inventario.repository.js
const { getPool } = require('../../config/db');

async function listStock(empresaId, filters) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      i.id,
      i.sucursal_id,
      s.nombre AS sucursal_nombre,
      i.producto_id,
      p.nombre AS producto_nombre,
      p.categoria_id,
      c.nombre AS categoria_nombre,
      i.stock_actual,
      i.stock_minimo,
      i.stock_maximo,
      i.created_at,
      i.updated_at
    FROM inventario_sucursal i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    JOIN productos p
      ON p.id = i.producto_id
    LEFT JOIN categorias c
      ON c.id = p.categoria_id
    WHERE s.empresa_id = ?
  `;

  if (filters.sucursal_id) {
    query += ' AND i.sucursal_id = ?';
    params.push(filters.sucursal_id);
  }

  if (filters.producto_id) {
    query += ' AND i.producto_id = ?';
    params.push(filters.producto_id);
  }

  if (filters.categoria_id) {
    query += ' AND p.categoria_id = ?';
    params.push(filters.categoria_id);
  }

  query += ' ORDER BY s.nombre ASC, p.nombre ASC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function listMovimientos(empresaId, filters) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      m.id,
      m.empresa_id,
      m.sucursal_id,
      s.nombre AS sucursal_nombre,
      m.producto_id,
      p.nombre AS producto_nombre,
      m.tipo,
      m.motivo,
      m.referencia_tipo,
      m.referencia_id,
      m.cantidad,
      m.costo_unitario,
      m.precio_unitario,
      m.stock_despues,
      m.fecha_movimiento,
      m.usuario_id,
      u.nombre AS usuario_nombre,
      m.created_at
    FROM movimientos_inventario m
    JOIN sucursales s
      ON s.id = m.sucursal_id
     AND s.empresa_id = m.empresa_id
    JOIN productos p
      ON p.id = m.producto_id
     AND p.empresa_id = m.empresa_id
    JOIN usuarios u
      ON u.id = m.usuario_id
     AND u.empresa_id = m.empresa_id
    WHERE m.empresa_id = ?
  `;

  if (filters.sucursal_id) {
    query += ' AND m.sucursal_id = ?';
    params.push(filters.sucursal_id);
  }

  if (filters.producto_id) {
    query += ' AND m.producto_id = ?';
    params.push(filters.producto_id);
  }

  if (filters.tipo) {
    query += ' AND m.tipo = ?';
    params.push(filters.tipo);
  }

  if (filters.motivo) {
    query += ' AND m.motivo = ?';
    params.push(filters.motivo);
  }

  if (filters.fecha_desde) {
    query += ' AND m.fecha_movimiento >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ' AND m.fecha_movimiento <= ?';
    params.push(filters.fecha_hasta);
  }

  query += ' ORDER BY m.fecha_movimiento DESC, m.id DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findMovimientoById(empresaId, movimientoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      m.id,
      m.empresa_id,
      m.sucursal_id,
      s.nombre AS sucursal_nombre,
      m.producto_id,
      p.nombre AS producto_nombre,
      m.tipo,
      m.motivo,
      m.referencia_tipo,
      m.referencia_id,
      m.cantidad,
      m.costo_unitario,
      m.precio_unitario,
      m.stock_despues,
      m.fecha_movimiento,
      m.usuario_id,
      u.nombre AS usuario_nombre,
      m.created_at
    FROM movimientos_inventario m
    JOIN sucursales s
      ON s.id = m.sucursal_id
     AND s.empresa_id = m.empresa_id
    JOIN productos p
      ON p.id = m.producto_id
     AND p.empresa_id = m.empresa_id
    JOIN usuarios u
      ON u.id = m.usuario_id
     AND u.empresa_id = m.empresa_id
    WHERE m.empresa_id = ?
      AND m.id = ?
    `,
    [empresaId, movimientoId]
  );
  return rows[0];
}

async function findSucursalById(empresaId, sucursalId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id, empresa_id, nombre
    FROM sucursales
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, sucursalId]
  );
  return rows[0];
}

async function findProductoById(empresaId, productoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      nombre,
      stock_minimo_general
    FROM productos
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, productoId]
  );
  return rows[0];
}

async function findInventarioRow(empresaId, sucursalId, productoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      i.id,
      i.sucursal_id,
      i.producto_id,
      i.stock_actual,
      i.stock_minimo,
      i.stock_maximo,
      i.created_at,
      i.updated_at
    FROM inventario_sucursal i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    WHERE s.empresa_id = ?
      AND i.sucursal_id = ?
      AND i.producto_id = ?
    `,
    [empresaId, sucursalId, productoId]
  );
  return rows[0];
}

async function insertInventarioRow(sucursalId, productoId, stockInicial, stockMinimo) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO inventario_sucursal (
      sucursal_id,
      producto_id,
      stock_actual,
      stock_minimo,
      stock_maximo,
      created_at
    ) VALUES (?, ?, ?, ?, NULL, NOW())
    `,
    [sucursalId, productoId, stockInicial, stockMinimo || 0]
  );
  return result.insertId;
}

async function updateInventarioStock(sucursalId, productoId, nuevoStock) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE inventario_sucursal
    SET stock_actual = ?, updated_at = NOW()
    WHERE sucursal_id = ? AND producto_id = ?
    `,
    [nuevoStock, sucursalId, productoId]
  );
}

async function insertMovimientoInventario({
  empresa_id,
  sucursal_id,
  producto_id,
  tipo,
  motivo,
  referencia_tipo,
  referencia_id,
  cantidad,
  costo_unitario,
  precio_unitario,
  stock_despues,
  fecha_movimiento,
  usuario_id
}) {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO movimientos_inventario (
      empresa_id,
      sucursal_id,
      producto_id,
      tipo,
      motivo,
      referencia_tipo,
      referencia_id,
      cantidad,
      costo_unitario,
      precio_unitario,
      stock_despues,
      fecha_movimiento,
      usuario_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresa_id,
      sucursal_id,
      producto_id,
      tipo,
      motivo,
      referencia_tipo,
      referencia_id,
      cantidad,
      costo_unitario,
      precio_unitario,
      stock_despues,
      fecha_movimiento,
      usuario_id
    ]
  );
}

module.exports = {
  listStock,
  listMovimientos,
  findMovimientoById,
  findSucursalById,
  findProductoById,
  findInventarioRow,
  insertInventarioRow,
  updateInventarioStock,
  insertMovimientoInventario
};
