// src/modules/roles/roles.controller.js
const service = require('./roles.service');

async function list(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.list(empresaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const id = await service.create(empresaId, req.body);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const role = await service.detail(empresaId, req.params.id);

    if (!role) {
      return res.status(404).json({ ok: false, message: 'Rol no encontrado' });
    }

    res.json({ ok: true, data: role });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.update(empresaId, req.params.id, req.body);
    res.json({ ok: true, message: 'Rol actualizado' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.remove(empresaId, req.params.id);
    res.json({ ok: true, message: 'Rol eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  detail,
  update,
  remove
};
