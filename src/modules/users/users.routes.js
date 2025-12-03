// src/modules/users/users.routes.js
const express = require('express');
const controller = require('./users.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner']), controller.list);
router.post('/', roles(['Owner']), controller.create);
router.get('/:id', roles(['Owner']), controller.detail);
router.put('/:id', roles(['Owner']), controller.update);
router.patch('/:id/estado', roles(['Owner']), controller.changeEstado);
router.get('/:id/roles', roles(['Owner']), controller.getRoles);
router.put('/:id/roles', roles(['Owner']), controller.replaceRoles);

module.exports = router;
