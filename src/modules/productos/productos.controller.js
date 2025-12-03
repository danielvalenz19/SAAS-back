// src/modules/productos/productos.controller.js
const service = require('./productos.service');

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
    const producto = await service.detail(empresaId, req.params.id);
    if (!producto) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    res.json({ ok: true, data: producto });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.update(empresaId, req.params.id, req.body);
    res.json({ ok: true, message: 'Producto actualizado' });
  } catch (err) {
    next(err);
  }
}

async function changeEstado(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.changeEstado(empresaId, req.params.id, req.body.es_activo);
    res.json({ ok: true, message: 'Estado actualizado' });
  } catch (err) {
    next(err);
  }
}

async function getInventario(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.getInventario(empresaId, req.params.id);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function getStockBajo(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.getStockBajo(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function importacionMasiva(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const ids = await service.importacionMasiva(empresaId, req.body.productos);
    res.status(201).json({ ok: true, total: ids.length, ids });
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
  getInventario,
  getStockBajo,
  importacionMasiva
};
