// src/modules/inventario/inventario.routes.js
const express = require('express');
const controller = require('./inventario.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/stock', roles(['Owner', 'Admin', 'Vendedor', 'Compras']), controller.stock);
router.get('/movimientos', roles(['Owner', 'Admin', 'Vendedor', 'Compras']), controller.movimientos);
router.get('/movimientos/:id', roles(['Owner', 'Admin', 'Vendedor', 'Compras']), controller.movimientoDetalle);
router.post('/ajustes', roles(['Owner', 'Admin']), controller.ajustes);
router.post('/traspasos', roles(['Owner', 'Admin']), controller.traspasos);

module.exports = router;
