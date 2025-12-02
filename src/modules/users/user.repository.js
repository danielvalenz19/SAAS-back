// src/modules/users/user.repository.js
const { getPool } = require('../../config/db');

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return rows[0];
}

module.exports = {
  findById
};
