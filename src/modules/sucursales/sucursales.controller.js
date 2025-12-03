// src/modules/sucursales/sucursales.controller.js
const service = require('./sucursales.service');

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
    const data = await service.detail(empresaId, req.params.id);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.update(empresaId, req.params.id, req.body);
    res.json({ ok: true, message: 'Sucursal actualizada' });
  } catch (err) {
    next(err);
  }
}

async function setPrincipal(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.setPrincipal(empresaId, req.params.id);
    res.json({ ok: true, message: 'Sucursal marcada como principal' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  detail,
  update,
  setPrincipal
};
