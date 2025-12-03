// src/modules/empresa/empresa.routes.js
const express = require('express');
const controller = require('./empresa.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner']), controller.getEmpresa);
router.put('/', roles(['Owner']), controller.updateEmpresa);

module.exports = router;
