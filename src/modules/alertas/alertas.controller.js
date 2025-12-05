// src/modules/alertas/alertas.controller.js
const service = require('./alertas.service');

async function getConfiguracion(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.getConfiguracion(empresaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateConfiguracion(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const { configuraciones } = req.body;
    const data = await service.updateConfiguracion(empresaId, configuraciones);
    res.json({
      ok: true,
      message: 'Configuración de alertas actualizada',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function listAlertas(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.listAlertas(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function getAlerta(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const alertaId = Number(req.params.id);
    const data = await service.getAlerta(empresaId, alertaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function marcarLeida(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const roles = req.user.roles || [];
    const alertaId = Number(req.params.id);

    const data = await service.marcarLeida(empresaId, usuarioId, roles, alertaId);

    res.json({
      ok: true,
      message: 'Alerta marcada como leída',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConfiguracion,
  updateConfiguracion,
  listAlertas,
  getAlerta,
  marcarLeida
};
