// src/modules/whatsapp/whatsapp.controller.js
const service = require('./whatsapp.service');

async function listNotificaciones(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.listNotificaciones(empresaId, req.query);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function getNotificacion(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const id = Number(req.params.id);
    const data = await service.getNotificacion(empresaId, id);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function enviarTest(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const { telefono_destino, mensaje } = req.body;

    const data = await service.enviarTest(empresaId, usuarioId, telefono_destino, mensaje);

    res.status(201).json({
      ok: true,
      message: 'Mensaje de prueba enviado (o intentado)',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function enviarRecordatorioCliente(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id || req.user.usuario_id;
    const { venta_id } = req.body;

    const data = await service.enviarRecordatorioCliente(empresaId, usuarioId, venta_id);

    res.status(201).json({
      ok: true,
      message: 'Recordatorio enviado (o intentado) al cliente',
      data
    });
  } catch (err) {
    next(err);
  }
}

// ===============================
// IA: plantillas y campañas
// ===============================

async function previewPlantillaIA(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.previewPlantillaIA(empresaId, req.body);

    res.json({
      ok: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function previewCampaniaIA(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.previewCampaniaIA(empresaId, req.body);

    res.json({
      ok: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotificaciones,
  getNotificacion,
  enviarTest,
  enviarRecordatorioCliente,
  previewPlantillaIA,
  previewCampaniaIA
};
