// src/config/db.js
const mysql = require('mysql2/promise');
const env = require('./env');

let pool;

/**
 * Inicializa el pool de conexión a MySQL.
 * Debe llamarse una vez al levantar el servidor.
 */
async function initDB() {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log('[DB] Conectado correctamente a MySQL');
  } finally {
    conn.release();
  }

  return pool;
}

/**
 * Devuelve el pool ya inicializado.
 * Lanza error si intentas usarlo antes de initDB().
 */
function getPool() {
  if (!pool) {
    throw new Error(
      'El pool de base de datos no está inicializado. Llama a initDB() antes de usarlo.'
    );
  }
  return pool;
}

module.exports = {
  initDB,
  getPool
};
