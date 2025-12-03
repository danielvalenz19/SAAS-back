// src/modules/creditos_proveedores/creditos_proveedores.controller.js
const service = require('./creditos_proveedores.service');

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
    const compraId = req.params.compra_id;
    const data = await service.detail(empresaId, compraId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  detail
};
