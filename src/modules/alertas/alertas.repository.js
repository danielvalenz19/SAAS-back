// src/modules/alertas/alertas.repository.js
const { getPool } = require('../../config/db');

// ===============================
// CONFIGURACIÓN DE ALERTAS
// ===============================

async function getConfiguracionByEmpresa(empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      tipo_alerta,
      nombre,
      descripcion,
      dias_antes_vencimiento,
      periodo_sin_rotacion_dias,
      enviar_app,
      enviar_email,
      enviar_whatsapp,
      activo,
      created_at,
      updated_at
    FROM alertas_configuracion
    WHERE empresa_id = ?
    ORDER BY tipo_alerta, id
    `,
    [empresaId]
  );
  return rows;
}

/**
 * Reemplaza TODA la configuración de alertas de la empresa.
 * Estrategia: DELETE + INSERT (dentro de una transacción).
 */
async function replaceConfiguracion(empresaId, configs) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'DELETE FROM alertas_configuracion WHERE empresa_id = ?',
      [empresaId]
    );

    if (configs.length > 0) {
      const insertSql = `
        INSERT INTO alertas_configuracion (
          empresa_id,
          tipo_alerta,
          nombre,
          descripcion,
          dias_antes_vencimiento,
          periodo_sin_rotacion_dias,
          enviar_app,
          enviar_email,
          enviar_whatsapp,
          activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const cfg of configs) {
        await conn.query(insertSql, [
          empresaId,
          cfg.tipo_alerta,
          cfg.nombre,
          cfg.descripcion || null,
          cfg.dias_antes_vencimiento,
          cfg.periodo_sin_rotacion_dias,
          cfg.enviar_app,
          cfg.enviar_email,
          cfg.enviar_whatsapp,
          cfg.activo
        ]);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ===============================
// EVENTOS DE ALERTAS
// ===============================

async function listAlertasEventos(empresaId, filters) {
  const { tipo_alerta, leida, fecha_desde, fecha_hasta } = filters;

  const pool = getPool();
  let query = `
    SELECT
      id,
      empresa_id,
      tipo_alerta,
      referencia_tipo,
      referencia_id,
      mensaje,
      fecha_generada,
      usuario_destino_id,
      leida,
      fecha_leida,
      created_at
    FROM alertas_eventos
    WHERE empresa_id = ?
  `;
  const params = [empresaId];

  if (tipo_alerta) {
    query += ' AND tipo_alerta = ?';
    params.push(tipo_alerta);
  }

  if (leida !== undefined && leida !== null) {
    query += ' AND leida = ?';
    params.push(leida ? 1 : 0);
  }

  if (fecha_desde) {
    query += ' AND fecha_generada >= ?';
    params.push(fecha_desde);
  }

  if (fecha_hasta) {
    query += ' AND fecha_generada <= ?';
    params.push(fecha_hasta);
  }

  query += ' ORDER BY fecha_generada DESC, id DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getAlertaEventoById(empresaId, alertaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      tipo_alerta,
      referencia_tipo,
      referencia_id,
      mensaje,
      fecha_generada,
      usuario_destino_id,
      leida,
      fecha_leida,
      created_at
    FROM alertas_eventos
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, alertaId]
  );
  return rows[0] || null;
}

async function marcarAlertaLeida(empresaId, alertaId, fecha) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE alertas_eventos
    SET leida = 1,
        fecha_leida = ?
    WHERE empresa_id = ? AND id = ?
    `,
    [fecha, empresaId, alertaId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getConfiguracionByEmpresa,
  replaceConfiguracion,
  listAlertasEventos,
  getAlertaEventoById,
  marcarAlertaLeida
};
