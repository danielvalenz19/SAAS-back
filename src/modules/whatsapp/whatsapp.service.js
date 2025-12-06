// src/modules/whatsapp/whatsapp.service.js
const repo = require('./whatsapp.repository');
const { sendWhatsAppMessage } = require('../../integrations/whatsappProvider');
const ventasRepo = require('../ventas/ventas.repository');
const clientesRepo = require('../clientes/clientes.repository');
const { generateText } = require('../../integrations/aiProvider');

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

// ===============================
// IA para plantillas y campañas
// ===============================

const PLANTILLAS_WHATSAPP = {
  RECORDATORIO_CREDITO: {
    codigo: 'RECORDATORIO_CREDITO',
    titulo: 'Recordatorio de crédito',
    descripcion: 'Aviso de crédito próximo a vencer o vencido',
    tipo_destinatario: 'CLIENTE'
  },
  CONFIRMACION_PAGO: {
    codigo: 'CONFIRMACION_PAGO',
    titulo: 'Confirmación de pago',
    descripcion: 'Mensaje corto confirmando que se registró un pago',
    tipo_destinatario: 'CLIENTE'
  },
  ALERTA_STOCK_MINIMO: {
    codigo: 'ALERTA_STOCK_MINIMO',
    titulo: 'Alerta de stock mínimo',
    descripcion: 'Aviso para dueño/admin cuando un producto está crítico',
    tipo_destinatario: 'ADMIN'
  },
  ALERTA_PRODUCTO_SIN_ROTACION: {
    codigo: 'ALERTA_PRODUCTO_SIN_ROTACION',
    titulo: 'Producto sin rotación',
    descripcion: 'Aviso de productos que casi no se venden',
    tipo_destinatario: 'ADMIN'
  },
  CONFIRMACION_VENTA: {
    codigo: 'CONFIRMACION_VENTA',
    titulo: 'Confirmación de venta',
    descripcion: 'Ticket corto de venta por WhatsApp',
    tipo_destinatario: 'CLIENTE'
  },
  PEDIDO_LISTO: {
    codigo: 'PEDIDO_LISTO',
    titulo: 'Pedido listo para recoger',
    descripcion: 'Aviso de que el pedido ya está listo en tienda',
    tipo_destinatario: 'CLIENTE'
  }
};

function getPlantillaMeta(tipo) {
  const meta = PLANTILLAS_WHATSAPP[tipo];
  if (!meta) {
    const err = new Error(`Tipo de plantilla no soportado: ${tipo}`);
    err.statusCode = 400;
    throw err;
  }
  return meta;
}

async function previewPlantillaIA(empresaId, data) {
  const { tipo, campos, texto_personalizado } = data || {};

  if (!tipo) {
    const err = new Error('tipo es requerido');
    err.statusCode = 400;
    throw err;
  }

  const meta = getPlantillaMeta(tipo);

  const systemPrompt = `
Eres un asistente que redacta mensajes CORTOS para WhatsApp.
Reglas:
- Máximo ~400 caracteres.
- Español neutro (Latinoamérica, Guatemala ok).
- Tono profesional pero cercano.
- No uses mayúsculas exageradas NI emojis a lo loco.
- Respeta políticas de WhatsApp: nada de amenazas, spam agresivo, ni contenido sensible.
- No inventes montos ni fechas; usa los valores que te doy.
- El resultado debe ser un SOLO mensaje de texto plano listo para enviar.
`;

  const userPrompt = `
Empresa ID: ${empresaId}
Tipo de mensaje: ${meta.codigo} - ${meta.descripcion}

Datos del contexto (JSON):
${JSON.stringify(campos || {}, null, 2)}

Texto opcional escrito por el usuario (si hay):
"""${texto_personalizado || ''}"""

Genera un mensaje final para WhatsApp que recuerde al destinatario lo necesario
según el tipo de plantilla. No expliques nada, solo responde con el mensaje listo.
`;

  const { content } = await generateText({
    systemPrompt,
    userPrompt,
    maxTokens: 256,
    temperature: 0.4
  });

  return {
    tipo: meta.codigo,
    titulo: meta.titulo,
    descripcion: meta.descripcion,
    campos: campos || {},
    texto_usuario: texto_personalizado || '',
    mensaje_sugerido: content
  };
}

async function previewCampaniaIA(empresaId, data) {
  const { objetivo, texto_base, publico, restricciones } = data || {};

  if (!objetivo) {
    const err = new Error('objetivo es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (!texto_base) {
    const err = new Error('texto_base es requerido');
    err.statusCode = 400;
    throw err;
  }

  const maxCar = restricciones?.max_caracteres || 400;

  const systemPrompt = `
Eres un asistente que redacta mensajes de CAMPAÑA para WhatsApp.
Reglas:
- Máximo ~${maxCar} caracteres.
- Español neutro (Latinoamérica).
- Tono amable, nada agresivo.
- Debe ser apto para políticas de WhatsApp y Meta.
- Para marketing: incluye llamada a la acción suave (ej: "pregúntanos", "visítanos", etc.).
- No uses emojis excesivos, máximo 1 o 2 si encajan.
- No prometas cosas que no aparecen en el texto del usuario.
`;

  const userPrompt = `
Empresa ID: ${empresaId}
Objetivo de la campaña: ${objetivo}
Público objetivo (si se especifica): ${publico || 'no especificado'}

Texto base escrito por el usuario:
"""${texto_base}"""

Genera un solo mensaje de WhatsApp que cumpla el objetivo,
respetando las reglas y el límite de caracteres.
Responde solo con el mensaje final.
`;

  const { content } = await generateText({
    systemPrompt,
    userPrompt,
    maxTokens: 300,
    temperature: 0.6
  });

  return {
    objetivo,
    publico: publico || null,
    restricciones: {
      max_caracteres: maxCar
    },
    texto_base,
    mensaje_sugerido: content
  };
}

module.exports = {
  listNotificaciones,
  getNotificacion,
  enviarTest,
  enviarRecordatorioCliente,
  previewPlantillaIA,
  previewCampaniaIA
};
