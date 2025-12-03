// src/modules/sucursales/sucursales.repository.js
const { getPool } = require('../../config/db');

async function listSucursales(empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       direccion,
       telefono,
       es_principal,
       created_at,
       updated_at
     FROM sucursales
     WHERE empresa_id = ?
     ORDER BY id`,
    [empresaId]
  );
  return rows;
}

async function createSucursal(empresaId, data) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO sucursales
       (empresa_id, nombre, direccion, telefono, es_principal, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [
      empresaId,
      data.nombre,
      data.direccion ?? null,
      data.telefono ?? null
    ]
  );
  return result.insertId;
}

async function findSucursalById(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       direccion,
       telefono,
       es_principal,
       created_at,
       updated_at
     FROM sucursales
     WHERE id = ? AND empresa_id = ?`,
    [id, empresaId]
  );
  return rows[0];
}

async function updateSucursal(id, empresaId, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `UPDATE sucursales
     SET ${setStr}, updated_at = NOW()
     WHERE id = ? AND empresa_id = ?`,
    [...values, id, empresaId]
  );

  return result.affectedRows > 0;
}

async function setPrincipal(id, empresaId) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE sucursales SET es_principal = 0, updated_at = NOW() WHERE empresa_id = ?',
      [empresaId]
    );

    const [result] = await conn.query(
      'UPDATE sucursales SET es_principal = 1, updated_at = NOW() WHERE id = ? AND empresa_id = ?',
      [id, empresaId]
    );

    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  listSucursales,
  createSucursal,
  findSucursalById,
  updateSucursal,
  setPrincipal
};
