// src/modules/whatsapp/whatsapp.routes.js
const express = require('express');
const controller = require('./whatsapp.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/notificaciones', roles(['Owner', 'Admin']), controller.listNotificaciones);
router.get('/notificaciones/:id', roles(['Owner', 'Admin']), controller.getNotificacion);
router.post('/test', roles(['Owner', 'Admin']), controller.enviarTest);
router.post(
  '/enviar-recordatorio-cliente',
  roles(['Owner', 'Admin']),
  controller.enviarRecordatorioCliente
);

// ===============================
// IA: plantillas y campañas
// ===============================

router.post('/plantillas/preview-ia', roles(['Owner', 'Admin']), controller.previewPlantillaIA);
router.post('/campanias/preview-ia', roles(['Owner', 'Admin']), controller.previewCampaniaIA);

module.exports = router;
