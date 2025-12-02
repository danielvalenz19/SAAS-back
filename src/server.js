// src/server.js
const app = require('./app');
const env = require('./config/env');
const { initDB } = require('./config/db');

async function bootstrap() {
  try {
    await initDB();

    app.listen(env.port, () => {
      console.log(`[SERVER] Servidor escuchando en http://localhost:${env.port}`);
      console.log(`[ENV] NODE_ENV=${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('[FATAL] Error al iniciar la aplicación:', err);
    process.exit(1);
  }
}

bootstrap();
