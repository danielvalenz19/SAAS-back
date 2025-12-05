// src/modules/whatsapp/whatsapp.service.js
const repo = require('./whatsapp.repository');
const { sendWhatsAppMessage } = require('../../integrations/whatsappProvider');
const ventasRepo = require('../ventas/ventas.repository');
const clientesRepo = require('../clientes/clientes.repository');

async function listNotificaciones(empresaId, query) {
  const { estado, tipo_destinatario, fecha_desde, fecha_hasta } = query;

  return repo.listNotificaciones(empresaId, {
    estado: estado || undefined,
    tipo_destinatario: tipo_destinatario || undefined,
    fecha_desde: fecha_desde || undefined,
    fecha_hasta: fecha_hasta || undefined
  });
}

async function getNotificacion(empresaId, id) {
  const notif = await repo.getNotificacionById(empresaId, id);
  if (!notif) {
    const err = new Error('Notificación no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return notif;
}

// =======================
// POST /whatsapp/test
// =======================
async function enviarTest(empresaId, usuarioId, telefono_destino, mensaje) {
  if (!telefono_destino || !mensaje) {
    const err = new Error('telefono_destino y mensaje son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const fecha_envio = new Date();

  const notif = await repo.createNotificacion({
    empresa_id: empresaId,
    tipo_destinatario: 'ADMIN',
    cliente_id: null,
    proveedor_id: null,
    usuario_destino_id: usuarioId,
    telefono_destino,
    plantilla_codigo: 'TEST',
    mensaje_enviado: mensaje,
    fecha_envio,
    estado: 'PENDIENTE',
    error_detalle: null
  });

  let updated;
  try {
    const result = await sendWhatsAppMessage({
      telefono: telefono_destino,
      mensaje
    });

    if (result.success) {
      updated = await repo.updateEstadoNotificacion(empresaId, notif.id, 'ENVIADO', null);
    } else {
      updated = await repo.updateEstadoNotificacion(
        empresaId,
        notif.id,
        'ERROR',
        JSON.stringify(result.rawResponse || {})
      );
    }
  } catch (err) {
    updated = await repo.updateEstadoNotificacion(empresaId, notif.id, 'ERROR', err.message);
  }

  return updated;
}

// =======================
// POST /whatsapp/enviar-recordatorio-cliente
// =======================
async function enviarRecordatorioCliente(empresaId, usuarioId, ventaIdRaw) {
  const ventaId = Number(ventaIdRaw);
  if (!ventaId) {
    const err = new Error('venta_id es requerido');
    err.statusCode = 400;
    throw err;
  }

  const venta = await ventasRepo.findVentaById(empresaId, ventaId);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (venta.tipo_venta !== 'CREDITO') {
    const err = new Error('La venta no es a crédito');
    err.statusCode = 400;
    throw err;
  }

  if (!venta.cliente_id) {
    const err = new Error('La venta no tiene cliente asociado');
    err.statusCode = 400;
    throw err;
  }

  if (!venta.saldo_pendiente || Number(venta.saldo_pendiente) <= 0) {
    const err = new Error('La venta no tiene saldo pendiente');
    err.statusCode = 400;
    throw err;
  }

  const cliente = await clientesRepo.findClienteById(empresaId, venta.cliente_id);
  if (!cliente) {
    const err = new Error('Cliente no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const telefono = cliente.whatsapp || cliente.telefono;
  if (!telefono) {
    const err = new Error('El cliente no tiene número de WhatsApp/telefono configurado');
    err.statusCode = 400;
    throw err;
  }

  const fechaVentaStr = venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString('es-GT') : '';
  const fechaVencStr = venta.fecha_vencimiento
    ? new Date(venta.fecha_vencimiento).toLocaleDateString('es-GT')
    : '';

  const mensaje = `Hola ${cliente.nombre}, le recordamos que tiene un saldo pendiente de Q${venta.saldo_pendiente} por la venta #${venta.id} del ${fechaVentaStr}. Fecha de vencimiento: ${fechaVencStr}. Por favor, ponerse al día para evitar inconvenientes.`;

  const fecha_envio = new Date();

  const notif = await repo.createNotificacion({
    empresa_id: empresaId,
    tipo_destinatario: 'CLIENTE',
    cliente_id: cliente.id,
    proveedor_id: null,
    usuario_destino_id: null,
    telefono_destino: telefono,
    plantilla_codigo: 'RECORDATORIO_CREDITO_CLIENTE',
    mensaje_enviado: mensaje,
    fecha_envio,
    estado: 'PENDIENTE',
    error_detalle: null
  });

  let updated;
  try {
    const result = await sendWhatsAppMessage({
      telefono,
      mensaje
    });

    if (result.success) {
      updated = await repo.updateEstadoNotificacion(empresaId, notif.id, 'ENVIADO', null);
    } else {
      updated = await repo.updateEstadoNotificacion(
        empresaId,
        notif.id,
        'ERROR',
        JSON.stringify(result.rawResponse || {})
      );
    }
  } catch (err) {
    updated = await repo.updateEstadoNotificacion(empresaId, notif.id, 'ERROR', err.message);
  }

  return updated;
}

module.exports = {
  listNotificaciones,
  getNotificacion,
  enviarTest,
  enviarRecordatorioCliente
};
