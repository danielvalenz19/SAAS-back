// src/modules/categorias/categorias.repository.js
const { getPool } = require('../../config/db');

async function listCategorias(empresaId, padreId) {
  const pool = getPool();

  if (padreId === undefined || padreId === null) {
    const [rows] = await pool.query(
      `SELECT
         id,
         empresa_id,
         nombre,
         descripcion,
         categoria_padre_id,
         created_at,
         updated_at
       FROM categorias
       WHERE empresa_id = ?
       ORDER BY nombre`,
      [empresaId]
    );
    return rows;
  }

  if (padreId === 'null') {
    const [rows] = await pool.query(
      `SELECT
         id,
         empresa_id,
         nombre,
         descripcion,
         categoria_padre_id,
         created_at,
         updated_at
       FROM categorias
       WHERE empresa_id = ? AND categoria_padre_id IS NULL
       ORDER BY nombre`,
      [empresaId]
    );
    return rows;
  }

  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       descripcion,
       categoria_padre_id,
       created_at,
       updated_at
     FROM categorias
     WHERE empresa_id = ? AND categoria_padre_id = ?
     ORDER BY nombre`,
    [empresaId, padreId]
  );
  return rows;
}

async function findCategoriaById(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       id,
       empresa_id,
       nombre,
       descripcion,
       categoria_padre_id,
       created_at,
       updated_at
     FROM categorias
     WHERE id = ? AND empresa_id = ?`,
    [id, empresaId]
  );
  return rows[0];
}

async function createCategoria(empresaId, data) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO categorias
       (empresa_id, nombre, descripcion, categoria_padre_id, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [
      empresaId,
      data.nombre,
      data.descripcion ?? null,
      data.categoria_padre_id ?? null
    ]
  );
  return result.insertId;
}

async function updateCategoria(id, empresaId, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `UPDATE categorias
     SET ${setStr}, updated_at = NOW()
     WHERE id = ? AND empresa_id = ?`,
    [...values, id, empresaId]
  );

  return result.affectedRows > 0;
}

async function countProductosByCategoria(empresaId, categoriaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT COUNT(p.id) AS total
     FROM productos p
     WHERE p.empresa_id = ? AND p.categoria_id = ?`,
    [empresaId, categoriaId]
  );
  return rows[0]?.total ?? 0;
}

async function deleteCategoria(id, empresaId) {
  const pool = getPool();
  const [result] = await pool.query(
    `DELETE FROM categorias
     WHERE id = ? AND empresa_id = ?`,
    [id, empresaId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listCategorias,
  findCategoriaById,
  createCategoria,
  updateCategoria,
  countProductosByCategoria,
  deleteCategoria
};
