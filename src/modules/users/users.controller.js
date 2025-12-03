// src/modules/users/users.controller.js
const service = require('./users.service');

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
    const user = await service.detail(empresaId, req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.update(empresaId, req.params.id, req.body);
    res.json({ ok: true, message: 'Usuario actualizado' });
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

async function getRoles(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    const roles = await service.getRoles(empresaId, req.params.id);
    res.json({ ok: true, roles });
  } catch (err) {
    next(err);
  }
}

async function replaceRoles(req, res, next) {
  try {
    const empresaId = req.user.empresa_id;
    await service.replaceRoles(empresaId, req.params.id, req.body.roles);
    res.json({ ok: true, message: 'Roles actualizados' });
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
  getRoles,
  replaceRoles
};
