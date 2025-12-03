// src/modules/creditos_clientes/creditos_clientes.routes.js
const express = require('express');
const controller = require('./creditos_clientes.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner', 'Admin', 'Vendedor']), controller.list);
router.get('/:venta_id', roles(['Owner', 'Admin', 'Vendedor']), controller.detail);

module.exports = router;
