// src/modules/health/health.routes.js
const express = require('express');
const controller = require('./health.controller');

const router = express.Router();

router.get('/', controller.getHealth);
router.get('/db', controller.getHealthDB);

module.exports = router;
