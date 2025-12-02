// src/modules/health/health.service.js
const { getPool } = require('../../config/db');

async function checkAppStatus() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
}

async function checkDBStatus() {
  const pool = getPool();
  const [rows] = await pool.query('SELECT 1 AS result');
  const ok = rows && rows[0] && rows[0].result === 1;

  return {
    status: ok ? 'ok' : 'error'
  };
}

module.exports = {
  checkAppStatus,
  checkDBStatus
};
