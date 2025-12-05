// src/modules/whatsapp/whatsapp.repository.js
const { getPool } = require('../../config/db');

async function listNotificaciones(empresaId, filters) {
  const { estado, tipo_destinatario, fecha_desde, fecha_hasta } = filters;

  const pool = getPool();
  let query = `
    SELECT
      id,
      empresa_id,
      tipo_destinatario,
      cliente_id,
      proveedor_id,
      usuario_destino_id,
      telefono_destino,
      plantilla_codigo,
      mensaje_enviado,
      fecha_envio,
      estado,
      error_detalle,
      created_at
    FROM whatsapp_notificaciones
    WHERE empresa_id = ?
  `;
  const params = [empresaId];

  if (estado) {
    query += ' AND estado = ?';
    params.push(estado);
  }

  if (tipo_destinatario) {
    query += ' AND tipo_destinatario = ?';
    params.push(tipo_destinatario);
  }

  if (fecha_desde) {
    query += ' AND fecha_envio >= ?';
    params.push(fecha_desde);
  }

  if (fecha_hasta) {
    query += ' AND fecha_envio <= ?';
    params.push(fecha_hasta);
  }

  query += ' ORDER BY fecha_envio DESC, id DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getNotificacionById(empresaId, id) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      tipo_destinatario,
      cliente_id,
      proveedor_id,
      usuario_destino_id,
      telefono_destino,
      plantilla_codigo,
      mensaje_enviado,
      fecha_envio,
      estado,
      error_detalle,
      created_at
    FROM whatsapp_notificaciones
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, id]
  );
  return rows[0] || null;
}

async function createNotificacion(data) {
  const pool = getPool();
  const {
    empresa_id,
    tipo_destinatario,
    cliente_id,
    proveedor_id,
    usuario_destino_id,
    telefono_destino,
    plantilla_codigo,
    mensaje_enviado,
    fecha_envio,
    estado,
    error_detalle
  } = data;

  const [result] = await pool.query(
    `
    INSERT INTO whatsapp_notificaciones (
      empresa_id,
      tipo_destinatario,
      cliente_id,
      proveedor_id,
      usuario_destino_id,
      telefono_destino,
      plantilla_codigo,
      mensaje_enviado,
      fecha_envio,
      estado,
      error_detalle
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      empresa_id,
      tipo_destinatario,
      cliente_id || null,
      proveedor_id || null,
      usuario_destino_id || null,
      telefono_destino,
      plantilla_codigo || null,
      mensaje_enviado,
      fecha_envio,
      estado || 'PENDIENTE',
      error_detalle || null
    ]
  );

  const insertedId = result.insertId;
  return getNotificacionById(empresa_id, insertedId);
}

async function updateEstadoNotificacion(empresaId, id, estado, errorDetalle) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE whatsapp_notificaciones
    SET estado = ?, error_detalle = ?
    WHERE empresa_id = ? AND id = ?
    `,
    [estado, errorDetalle || null, empresaId, id]
  );
  return getNotificacionById(empresaId, id);
}

module.exports = {
  listNotificaciones,
  getNotificacionById,
  createNotificacion,
  updateEstadoNotificacion
};
