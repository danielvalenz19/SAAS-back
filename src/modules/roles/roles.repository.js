// src/modules/roles/roles.repository.js
const { getPool } = require('../../config/db');

async function listRoles(empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, empresa_id, nombre, descripcion, es_rol_sistema, created_at, updated_at
     FROM roles
     WHERE empresa_id = ?
     ORDER BY es_rol_sistema DESC, nombre ASC`,
    [empresaId]
  );
  return rows;
}

async function findRoleById(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, empresa_id, nombre, descripcion, es_rol_sistema, created_at, updated_at
     FROM roles
     WHERE id = ? AND empresa_id = ?`,
    [id, empresaId]
  );
  return rows[0];
}

async function findRoleByName(nombre, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, empresa_id, nombre, descripcion, es_rol_sistema, created_at, updated_at
     FROM roles
     WHERE nombre = ? AND empresa_id = ?`,
    [nombre, empresaId]
  );
  return rows[0];
}

async function createRole(empresaId, { nombre, descripcion }) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO roles
     (empresa_id, nombre, descripcion, es_rol_sistema, created_at)
     VALUES (?, ?, ?, 0, NOW())`,
    [empresaId, nombre, descripcion ?? null]
  );
  return result.insertId;
}

async function updateRole(id, empresaId, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `UPDATE roles
     SET ${setStr}, updated_at = NOW()
     WHERE id = ? AND empresa_id = ? AND es_rol_sistema = 0`,
    [...values, id, empresaId]
  );

  return result.affectedRows > 0;
}

async function countUsuariosByRol(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT COUNT(ur.id) AS total
     FROM usuario_rol ur
     INNER JOIN usuarios u ON ur.usuario_id = u.id
     WHERE ur.rol_id = ? AND u.empresa_id = ?`,
    [id, empresaId]
  );
  return rows[0]?.total ?? 0;
}

async function deleteRole(id, empresaId) {
  const pool = getPool();
  const [result] = await pool.query(
    `DELETE FROM roles
     WHERE id = ? AND empresa_id = ? AND es_rol_sistema = 0`,
    [id, empresaId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listRoles,
  findRoleById,
  findRoleByName,
  createRole,
  updateRole,
  countUsuariosByRol,
  deleteRole
};
