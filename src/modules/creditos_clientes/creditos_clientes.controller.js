// src/modules/creditos_clientes/creditos_clientes.controller.js
const service = require('./creditos_clientes.service');

async function list(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.list(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const ventaId = req.params.venta_id;
    const data = await service.detail(empresaId, ventaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  detail
};
