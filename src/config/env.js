// src/config/env.js
const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'inventario_saas'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'cambia_esto_en_produccion',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10)
  }
};

module.exports = env;
