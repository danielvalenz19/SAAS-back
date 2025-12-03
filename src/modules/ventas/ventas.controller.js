// src/modules/ventas/ventas.controller.js
const service = require('./ventas.service');

async function list(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.listVentas(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const ventaId = req.params.id;
    const data = await service.detailVenta(empresaId, ventaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const ventaId = await service.createVenta(empresaId, usuarioId, req.body);
    res.status(201).json({ ok: true, id: ventaId });
  } catch (err) {
    next(err);
  }
}

async function anular(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const ventaId = req.params.id;
    await service.anularVenta(empresaId, usuarioId, ventaId);
    res.json({ ok: true, message: 'Venta anulada' });
  } catch (err) {
    next(err);
  }
}

async function listPagos(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const ventaId = req.params.id;
    const pagos = await service.listPagos(empresaId, ventaId);
    res.json({ ok: true, data: pagos });
  } catch (err) {
    next(err);
  }
}

async function registrarPago(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const ventaId = req.params.id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const result = await service.registrarPago(empresaId, ventaId, req.body, usuarioId);
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
