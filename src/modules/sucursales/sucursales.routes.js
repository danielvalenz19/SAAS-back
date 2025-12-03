// src/modules/sucursales/sucursales.routes.js
const express = require('express');
const controller = require('./sucursales.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner']), controller.list);
router.post('/', roles(['Owner']), controller.create);
router.get('/:id', roles(['Owner']), controller.detail);
router.put('/:id', roles(['Owner']), controller.update);
router.patch('/:id/principal', roles(['Owner']), controller.setPrincipal);

module.exports = router;
