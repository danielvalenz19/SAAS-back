// src/modules/auth/auth.controller.js
const service = require('./auth.service');
const repo = require('./auth.repository');

async function registerOwner(req, res, next) {
  try {
    const result = await service.registerOwner(req.body);
    res.status(201).json({ ok: true, message: 'Empresa registrada', data: result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const tokenPayload = req.user;
    const newToken = await service.refreshToken(tokenPayload);
    res.json({ ok: true, ...newToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.json({ ok: true, message: 'Sesión cerrada (token invalidado en frontend)' });
}

async function me(req, res, next) {
  try {
    const userId = req.user?.usuario_id;
    if (!userId) {
      const err = new Error('Token inválido');
      err.statusCode = 401;
      throw err;
    }

    const user = await repo.getUserById(userId);
    if (!user) {
      const err = new Error('Usuario no encontrado');
      err.statusCode = 404;
      throw err;
    }

    const roles = await repo.getRolesByUserId(userId);
    res.json({
      ok: true,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        empresa_id: user.empresa_id,
        sucursal_id: user.sucursal_id,
        roles: roles.map((r) => r.nombre)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerOwner, login, refresh, logout, me };
