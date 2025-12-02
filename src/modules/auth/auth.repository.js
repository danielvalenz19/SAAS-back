// src/modules/auth/auth.repository.js
const { getPool } = require('../../config/db');

async function createEmpresa(nombre) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO empresas (nombre, created_at) VALUES (?, NOW())',
    [nombre]
  );
  return result.insertId;
}

async function createSucursalPrincipal(empresaId, nombre) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO sucursales (empresa_id, nombre, es_principal, created_at) VALUES (?, ?, 1, NOW())',
    [empresaId, nombre]
  );
  return result.insertId;
}

async function createUsuario(empresaId, sucursalId, nombre, email, hashedPassword) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO usuarios 
     (empresa_id, sucursal_id, nombre, apellido, email, telefono, password_hash, activo, created_at)
     VALUES (?, ?, ?, NULL, ?, NULL, ?, 1, NOW())`,
    [empresaId, sucursalId, nombre, email, hashedPassword]
  );
  return result.insertId;
}

async function createRolOwner(empresaId) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO roles (empresa_id, nombre, descripcion, es_rol_sistema, created_at) VALUES (?, "Owner", "Dueño del negocio", 1, NOW())',
    [empresaId]
  );
  return result.insertId;
}

async function assignRol(usuarioId, rolId) {
  const pool = getPool();
  await pool.query('INSERT INTO usuario_rol (usuario_id, rol_id, created_at) VALUES (?, ?, NOW())', [
    usuarioId,
    rolId
  ]);
}

async function getUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0];
}

async function getUserById(userId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
  return rows[0];
}

async function getRolesByUserId(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.*
     FROM roles r
     JOIN usuario_rol ur ON ur.rol_id = r.id
     WHERE ur.usuario_id = ?`,
    [userId]
  );
  return rows;
}

module.exports = {
  createEmpresa,
  createSucursalPrincipal,
  createUsuario,
  createRolOwner,
  assignRol,
  getUserByEmail,
  getUserById,
  getRolesByUserId
};
