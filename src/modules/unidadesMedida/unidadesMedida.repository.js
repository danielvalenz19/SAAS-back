// src/modules/unidadesMedida/unidadesMedida.repository.js
const { getPool } = require('../../config/db');

async function listUnidades(empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       abreviatura,
       factor_base,
       created_at,
       updated_at
     FROM unidades_medida
     WHERE empresa_id = ?
     ORDER BY nombre`,
    [empresaId]
  );
  return rows;
}

async function findUnidadById(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       abreviatura,
       factor_base,
       created_at,
       updated_at
     FROM unidades_medida
     WHERE id = ? AND empresa_id = ?`,
    [id, empresaId]
  );
  return rows[0];
}

async function findUnidadByNombre(empresaId, nombre) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       abreviatura,
       factor_base
     FROM unidades_medida
     WHERE empresa_id = ? AND nombre = ?`,
    [empresaId, nombre]
  );
  return rows[0];
}

async function createUnidad(empresaId, data) {
  const pool = getPool();
  const factorBase = data.factor_base !== undefined && data.factor_base !== null ? data.factor_base : 1;

  const [result] = await pool.query(
    `INSERT INTO unidades_medida
       (empresa_id, nombre, abreviatura, factor_base, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [empresaId, data.nombre, data.abreviatura, factorBase]
  );

  return result.insertId;
}

async function updateUnidad(id, empresaId, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `UPDATE unidades_medida
     SET ${setStr}, updated_at = NOW()
     WHERE id = ? AND empresa_id = ?`,
    [...values, id, empresaId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  listUnidades,
  findUnidadById,
  findUnidadByNombre,
  createUnidad,
  updateUnidad
};
