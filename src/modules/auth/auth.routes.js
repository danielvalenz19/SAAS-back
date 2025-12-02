// src/modules/auth/auth.routes.js
const express = require('express');
const controller = require('./auth.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

router.post('/register-owner', controller.registerOwner);
router.post('/login', controller.login);
router.post('/refresh', authMiddleware, controller.refresh);
router.post('/logout', authMiddleware, controller.logout);
router.get('/me', authMiddleware, controller.me);

module.exports = router;
