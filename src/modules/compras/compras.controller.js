// src/modules/compras/compras.controller.js
const service = require('./compras.service');

async function list(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.listCompras(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const compraId = req.params.id;
    const data = await service.detailCompra(empresaId, compraId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const compraId = await service.createCompra(empresaId, usuarioId, req.body);
    res.status(201).json({ ok: true, id: compraId });
  } catch (err) {
    next(err);
  }
}

async function anular(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const compraId = req.params.id;
    await service.anularCompra(empresaId, usuarioId, compraId);
    res.json({ ok: true, message: 'Compra anulada' });
  } catch (err) {
    next(err);
  }
}

async function listPagos(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const compraId = req.params.id;
    const pagos = await service.listPagos(empresaId, compraId);
    res.json({ ok: true, data: pagos });
  } catch (err) {
    next(err);
  }
}

async function registrarPago(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const compraId = req.params.id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const result = await service.registrarPago(empresaId, compraId, req.body, usuarioId);
    res.status(201).json({ ok: true, message: 'Pago registrado', ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  detail,
  create,
  anular,
  listPagos,
  registrarPago
};
