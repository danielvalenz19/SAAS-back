// src/modules/empresa/empresa.repository.js
const { getPool } = require('../../config/db');

async function getEmpresaById(empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT 
       id,
       nombre,
       nit,
       telefono,
       email,
       direccion,
       plan,
       estado,
       created_at,
       updated_at
     FROM empresas
     WHERE id = ?`,
    [empresaId]
  );
  return rows[0];
}

async function updateEmpresa(empresaId, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return false;
  }

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `UPDATE empresas
     SET ${setStr}, updated_at = NOW()
     WHERE id = ?`,
    [...values, empresaId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getEmpresaById,
  updateEmpresa
};
