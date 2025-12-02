// src/modules/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const repo = require('./auth.repository');

function buildTokenPayload(user, roleNames) {
  return {
    usuario_id: user.id,
    empresa_id: user.empresa_id,
    sucursal_id: user.sucursal_id,
    email: user.email,
    roles: roleNames
  };
}

async function registerOwner({ empresa_nombre, sucursal_nombre, nombre, email, password }) {
  if (!empresa_nombre || !sucursal_nombre || !nombre || !email || !password) {
    const err = new Error('Faltan campos requeridos');
    err.statusCode = 400;
    throw err;
  }

  const existing = await repo.getUserByEmail(email);
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const empresaId = await repo.createEmpresa(empresa_nombre);
  const sucursalId = await repo.createSucursalPrincipal(empresaId, sucursal_nombre);
  const usuarioId = await repo.createUsuario(empresaId, sucursalId, nombre, email, hashedPassword);
  const rolId = await repo.createRolOwner(empresaId);
  await repo.assignRol(usuarioId, rolId);

  return { empresaId, sucursalId, usuarioId, rolId };
}

async function login(email, password) {
  if (!email || !password) {
    const err = new Error('Email y contraseña son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const user = await repo.getUserByEmail(email);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Contraseña incorrecta');
    err.statusCode = 401;
    throw err;
  }

  const roles = await repo.getRolesByUserId(user.id);
  const roleNames = roles.map((r) => r.nombre);
  const payload = buildTokenPayload(user, roleNames);

  const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

  return {
    access_token: token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: roleNames
    }
  };
}

async function refreshToken(userPayload) {
  const { iat, exp, nbf, jti, ...payload } = userPayload; // limpiar claims reservados
  const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  return { access_token: token };
}

module.exports = { registerOwner, login, refreshToken };
