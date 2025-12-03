// src/modules/productos/productos.routes.js
const express = require('express');
const controller = require('./productos.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner', 'Admin', 'Vendedor']), controller.list);
router.get('/stock-bajo', roles(['Owner', 'Admin', 'Vendedor']), controller.getStockBajo);
router.post('/', roles(['Owner', 'Admin']), controller.create);
router.post('/importacion-masiva', roles(['Owner', 'Admin']), controller.importacionMasiva);
router.get('/:id', roles(['Owner', 'Admin', 'Vendedor']), controller.detail);
router.put('/:id', roles(['Owner', 'Admin']), controller.update);
router.patch('/:id/estado', roles(['Owner', 'Admin']), controller.changeEstado);
router.get('/:id/inventario', roles(['Owner', 'Admin', 'Vendedor']), controller.getInventario);

module.exports = router;
