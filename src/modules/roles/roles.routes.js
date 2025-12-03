// src/modules/roles/roles.routes.js
const express = require('express');
const controller = require('./roles.controller');
const auth = require('../../middlewares/authMiddleware');
const roles = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', roles(['Owner']), controller.list);
router.post('/', roles(['Owner']), controller.create);
router.get('/:id', roles(['Owner']), controller.detail);
router.put('/:id', roles(['Owner']), controller.update);
router.delete('/:id', roles(['Owner']), controller.remove);

module.exports = router;
