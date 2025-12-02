// src/swagger/swagger.js
const path = require('path');
const yaml = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));

function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[SWAGGER] Documentación disponible en /docs');
}

module.exports = setupSwagger;
