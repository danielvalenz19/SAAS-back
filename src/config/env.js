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
  },
  whatsapp: {
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    defaultFrom: process.env.WHATSAPP_DEFAULT_FROM || null
  },
  // 🔹 Config de IA local (LM Studio)
  ai: {
    baseUrl: process.env.AI_BASE_URL || 'http://127.0.0.1:1234/v1',
    apiKey: process.env.AI_API_KEY || 'lm-studio',
    model: process.env.AI_MODEL || 'deepseek/deepseek-r1-0528-qwen3-8b'
  }
};

module.exports = env;
