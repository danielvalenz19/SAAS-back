// src/modules/compras/compras.routes.js
const express = require('express');
const controller = require('./compras.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner', 'Admin', 'Compras']), controller.list);
router.get('/:id', roles(['Owner', 'Admin', 'Compras']), controller.detail);
router.post('/', roles(['Owner', 'Admin', 'Compras']), controller.create);
router.post('/:id/anular', roles(['Owner', 'Admin']), controller.anular);
router.get('/:id/pagos', roles(['Owner', 'Admin', 'Compras']), controller.listPagos);
router.post('/:id/pagos', roles(['Owner', 'Admin', 'Compras']), controller.registrarPago);

module.exports = router;
