// src/modules/ventas/ventas.routes.js
const express = require('express');
const controller = require('./ventas.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner', 'Admin', 'Vendedor']), controller.list);
router.get('/:id', roles(['Owner', 'Admin', 'Vendedor']), controller.detail);
router.post('/', roles(['Owner', 'Admin', 'Vendedor']), controller.create);
router.post('/:id/anular', roles(['Owner', 'Admin']), controller.anular);
router.get('/:id/pagos', roles(['Owner', 'Admin', 'Vendedor']), controller.listPagos);
router.post('/:id/pagos', roles(['Owner', 'Admin', 'Vendedor']), controller.registrarPago);

module.exports = router;
