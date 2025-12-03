// src/modules/proveedores/proveedores.routes.js
const express = require('express');
const controller = require('./proveedores.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner', 'Admin', 'Compras']), controller.list);
router.post('/', roles(['Owner', 'Admin', 'Compras']), controller.create);
router.get('/:id', roles(['Owner', 'Admin', 'Compras']), controller.detail);
router.put('/:id', roles(['Owner', 'Admin', 'Compras']), controller.update);
router.patch('/:id/estado', roles(['Owner', 'Admin', 'Compras']), controller.changeEstado);
router.get('/:id/creditos', roles(['Owner', 'Admin', 'Compras']), controller.getCreditos);

module.exports = router;
