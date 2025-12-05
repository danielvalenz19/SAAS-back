// src/modules/alertas/alertas.service.js
const repo = require('./alertas.repository');

const TIPOS_ALERTA_VALIDOS = [
  'STOCK_MINIMO',
  'CREDITO_CLIENTE_VENCIDO',
  'CREDITO_PROVEEDOR_VENCIDO',
  'PRODUCTO_SIN_ROTACION'
];

function boolToTinyint(value, defaultValue = 0) {
  if (value === undefined || value === null) return defaultValue;
  return value ? 1 : 0;
}

async function getConfiguracion(empresaId) {
  return repo.getConfiguracionByEmpresa(empresaId);
}

/**
 * PUT /alertas/configuracion
 * Body:
 * {
 *   "configuraciones": [
 *     {
 *       "tipo_alerta": "STOCK_MINIMO",
 *       "nombre": "Alerta stock mínimo",
 *       "descripcion": "Cuando stock < mínimo",
 *       "dias_antes_vencimiento": null,
 *       "periodo_sin_rotacion_dias": null,
 *       "enviar_app": true,
 *       "enviar_email": false,
 *       "enviar_whatsapp": false,
 *       "activo": true
 *     },
 *     ...
 *   ]
 * }
 */
async function updateConfiguracion(empresaId, configuraciones) {
  if (!Array.isArray(configuraciones)) {
    const err = new Error('El campo "configuraciones" debe ser un arreglo');
    err.statusCode = 400;
    throw err;
  }

  const normalizadas = configuraciones.map((cfg) => {
    const {
      tipo_alerta,
      nombre,
      descripcion,
      dias_antes_vencimiento,
      periodo_sin_rotacion_dias,
      enviar_app,
      enviar_email,
      enviar_whatsapp,
      activo
    } = cfg;

    if (!tipo_alerta || !TIPOS_ALERTA_VALIDOS.includes(tipo_alerta)) {
      const err = new Error(
        `tipo_alerta inválido: ${tipo_alerta}. Valores permitidos: ${TIPOS_ALERTA_VALIDOS.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    if (!nombre) {
      const err = new Error('Cada configuración debe tener "nombre"');
      err.statusCode = 400;
      throw err;
    }

    return {
      tipo_alerta,
      nombre,
      descripcion: descripcion || null,
      dias_antes_vencimiento:
        dias_antes_vencimiento !== undefined ? dias_antes_vencimiento : null,
      periodo_sin_rotacion_dias:
        periodo_sin_rotacion_dias !== undefined ? periodo_sin_rotacion_dias : null,
      enviar_app: boolToTinyint(enviar_app, 1),
      enviar_email: boolToTinyint(enviar_email, 0),
      enviar_whatsapp: boolToTinyint(enviar_whatsapp, 0),
      activo: boolToTinyint(activo, 1)
    };
  });

  await repo.replaceConfiguracion(empresaId, normalizadas);
  return repo.getConfiguracionByEmpresa(empresaId);
}

// ===============================
// EVENTOS
// ===============================

async function listAlertas(empresaId, filters) {
  const { tipo_alerta, leida, fecha_desde, fecha_hasta } = filters;

  let leidaParsed;
  if (leida !== undefined && leida !== null && leida !== '') {
    if (leida === '1' || leida === 'true' || leida === true) leidaParsed = 1;
    else if (leida === '0' || leida === 'false' || leida === false) leidaParsed = 0;
    else {
      const err = new Error('El parámetro "leida" debe ser true/false/1/0');
      err.statusCode = 400;
      throw err;
    }
  }

  const cleanFilters = {
    tipo_alerta: tipo_alerta || undefined,
    leida: leidaParsed,
    fecha_desde: fecha_desde || undefined,
    fecha_hasta: fecha_hasta || undefined
  };

  return repo.listAlertasEventos(empresaId, cleanFilters);
}

async function getAlerta(empresaId, alertaId) {
  const alerta = await repo.getAlertaEventoById(empresaId, alertaId);
  if (!alerta) {
    const err = new Error('Alerta no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return alerta;
}

async function marcarLeida(empresaId, usuarioId, roles, alertaId) {
  const alerta = await repo.getAlertaEventoById(empresaId, alertaId);
  if (!alerta) {
    const err = new Error('Alerta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const rolesUsuario = roles || [];
  const esAdmin = rolesUsuario.includes('Owner') || rolesUsuario.includes('Admin');

  if (!esAdmin) {
    if (alerta.usuario_destino_id && alerta.usuario_destino_id !== usuarioId) {
      const err = new Error('No tienes permisos para marcar esta alerta como leída');
      err.statusCode = 403;
      throw err;
    }
  }

  const ahora = new Date();
  const ok = await repo.marcarAlertaLeida(empresaId, alertaId, ahora);
  if (!ok) {
    const err = new Error('No se pudo marcar la alerta como leída');
    err.statusCode = 400;
    throw err;
  }

  return repo.getAlertaEventoById(empresaId, alertaId);
}

module.exports = {
  getConfiguracion,
  updateConfiguracion,
  listAlertas,
  getAlerta,
  marcarLeida
};
