// src/modules/alertas/alertas.routes.js
const express = require('express');
const controller = require('./alertas.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

// Configuración de alertas (solo Owner/Admin)
router.get('/configuracion', roles(['Owner', 'Admin']), controller.getConfiguracion);
router.put('/configuracion', roles(['Owner', 'Admin']), controller.updateConfiguracion);

// Eventos de alertas
router.get('/', controller.listAlertas);
router.get('/:id', controller.getAlerta);
router.patch('/:id/marcar-leida', controller.marcarLeida);

module.exports = router;
