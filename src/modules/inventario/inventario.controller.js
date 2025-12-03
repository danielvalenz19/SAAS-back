// src/modules/inventario/inventario.controller.js
const service = require('./inventario.service');

async function stock(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.getStock(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function movimientos(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.getMovimientos(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function movimientoDetalle(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const movId = req.params.id;
    const data = await service.getMovimientoById(empresaId, movId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function ajustes(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const result = await service.registrarAjuste(empresaId, usuarioId, req.body);
    res.status(201).json({ ok: true, message: 'Ajuste registrado', data: result });
  } catch (err) {
    next(err);
  }
}

async function traspasos(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const result = await service.registrarTraspaso(empresaId, usuarioId, req.body);
    res.status(201).json({ ok: true, message: 'Traspaso registrado', data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  stock,
  movimientos,
  movimientoDetalle,
  ajustes,
  traspasos
};
