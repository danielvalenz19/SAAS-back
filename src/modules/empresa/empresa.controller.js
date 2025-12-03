// src/modules/empresa/empresa.controller.js
const service = require('./empresa.service');

async function getEmpresa(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const data = await service.getEmpresa(empresaId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateEmpresa(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.updateEmpresa(empresaId, req.body);
    res.json({ ok: true, message: 'Empresa actualizada' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEmpresa,
  updateEmpresa
};
