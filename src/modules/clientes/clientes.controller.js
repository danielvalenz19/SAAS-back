// src/modules/clientes/clientes.controller.js
const service = require('./clientes.service');

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
    const cliente = await service.detail(empresaId, req.params.id);
    if (!cliente) {
      return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });
    }
    res.json({ ok: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.update(empresaId, req.params.id, req.body);
    res.json({ ok: true, message: 'Cliente actualizado' });
  } catch (err) {
    next(err);
  }
}

async function changeEstado(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.changeEstado(empresaId, req.params.id, req.body.activo);
    res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    next(err);
  }
}

async function getCreditos(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const clienteId = req.params.id;
    const data = await service.getCreditos(empresaId, clienteId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  detail,
  update,
  changeEstado,
  getCreditos
};
