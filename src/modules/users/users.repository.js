// src/modules/users/users.repository.js
const { getPool } = require('../../config/db');

async function listUsers(empresaId, { sucursal_id, activo }) {
  const pool = getPool();
  let query = `
    SELECT
      u.id,
      u.empresa_id,
      u.sucursal_id,
      u.nombre,
      u.apellido,
      u.email,
      u.telefono,
      u.activo,
      u.created_at,
      u.updated_at,
      GROUP_CONCAT(r.id) AS roles_ids,
      GROUP_CONCAT(r.nombre) AS roles_nombres
    FROM usuarios u
    LEFT JOIN usuario_rol ur
      ON ur.usuario_id = u.id
    LEFT JOIN roles r
      ON r.id = ur.rol_id
     AND r.empresa_id = u.empresa_id
    WHERE u.empresa_id = ?`;
  const params = [empresaId];

  if (sucursal_id) {
    query += ' AND u.sucursal_id = ?';
    params.push(sucursal_id);
  }

  if (activo !== undefined && activo !== null) {
    query += ' AND u.activo = ?';
    params.push(activo);
  }

  query += ' GROUP BY u.id';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function createUser(usuario) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO usuarios 
     (empresa_id, sucursal_id, nombre, apellido, email, telefono, password_hash, activo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [
      usuario.empresa_id,
      usuario.sucursal_id,
      usuario.nombre,
      usuario.apellido ?? null,
      usuario.email,
      usuario.telefono ?? null,
      usuario.password_hash
    ]
  );
  return result.insertId;
}

async function findUserById(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, empresa_id, sucursal_id, nombre, apellido, email, telefono, activo, created_at, updated_at
     FROM usuarios
     WHERE id = ? AND empresa_id = ?`,
    [id, empresaId]
  );
  return rows[0];
}

async function findUserByEmail(email, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, empresa_id, sucursal_id, nombre, apellido, email, telefono, activo, created_at, updated_at
     FROM usuarios
     WHERE email = ? AND empresa_id = ?`,
    [email, empresaId]
  );
  return rows[0];
}

async function updateUser(id, empresaId, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `UPDATE usuarios SET ${setStr}, updated_at = NOW()
     WHERE id = ? AND empresa_id = ?`,
    [...values, id, empresaId]
  );

  return result.affectedRows > 0;
}

async function updateEstado(id, empresaId, activo) {
  const pool = getPool();
  const [result] = await pool.query(
    `UPDATE usuarios SET activo = ?, updated_at = NOW()
     WHERE id = ? AND empresa_id = ?`,
    [activo, id, empresaId]
  );
  return result.affectedRows > 0;
}

async function getRolesByUserId(id, empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.*
     FROM roles r
     JOIN usuario_rol ur ON ur.rol_id = r.id
     WHERE ur.usuario_id = ?
       AND r.empresa_id = ?`,
    [id, empresaId]
  );
  return rows;
}

async function replaceRoles(userId, roleIds, empresaId) {
  const pool = getPool();

  await pool.query(
    `DELETE ur FROM usuario_rol ur
     JOIN roles r ON r.id = ur.rol_id
     WHERE ur.usuario_id = ? AND r.empresa_id = ?`,
    [userId, empresaId]
  );

  if (roleIds.length > 0) {
    const values = roleIds.map((rid) => [userId, rid]);
    await pool.query(
      `INSERT INTO usuario_rol (usuario_id, rol_id)
       VALUES ?`,
      [values]
    );
  }

  return true;
}

async function findRolesByIds(roleIds, empresaId) {
  if (!roleIds.length) return [];
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM roles WHERE id IN (?) AND empresa_id = ?`,
    [roleIds, empresaId]
  );
  return rows;
}

module.exports = {
  listUsers,
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
  updateEstado,
  getRolesByUserId,
  replaceRoles,
  findRolesByIds
};
