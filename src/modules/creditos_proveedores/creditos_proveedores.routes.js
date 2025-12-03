// src/modules/creditos_proveedores/creditos_proveedores.routes.js
const express = require('express');
const controller = require('./creditos_proveedores.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner', 'Admin', 'Compras']), controller.list);
router.get('/:compra_id', roles(['Owner', 'Admin', 'Compras']), controller.detail);

module.exports = router;
