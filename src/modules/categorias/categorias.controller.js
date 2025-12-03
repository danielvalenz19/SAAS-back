// src/modules/categorias/categorias.controller.js
const service = require('./categorias.service');

async function list(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.list(empresaId, req.query);
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
    res.json({ ok: true, message: 'Categoría actualizada' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.remove(empresaId, req.params.id);
    res.json({ ok: true, message: 'Categoría eliminada' });
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
