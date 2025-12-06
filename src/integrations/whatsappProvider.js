// src/integrations/whatsappProvider.js
/**
 * Adapter de proveedor de WhatsApp usando Meta WhatsApp Cloud API.
 * Envía mensajes de texto simples.
 */
const env = require('../config/env');

function ensureConfig() {
  if (!env.whatsapp.token || !env.whatsapp.phoneNumberId) {
    const err = new Error(
      'WhatsApp no está configurado. Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en .env'
    );
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Envía un mensaje de texto vía WhatsApp Cloud API.
 * @param {Object} params
 * @param {string} params.telefono - Número destino en formato internacional, ej: +15551234567
 * @param {string} params.mensaje  - Texto a enviar
 * @returns {Promise<{success: boolean, providerMessageId?: string, rawResponse: any}>}
 */
async function sendWhatsAppMessage({ telefono, mensaje }) {
  ensureConfig();

  if (!telefono || !mensaje) {
    const err = new Error('telefono y mensaje son requeridos para enviar WhatsApp');
    err.statusCode = 400;
    throw err;
  }

  const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: telefono,
    type: 'text',
    text: {
      preview_url: false,
      body: mensaje
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[WHATSAPP] Error al enviar mensaje', { status: res.status, data });
      return {
        success: false,
        providerMessageId: null,
        rawResponse: data
      };
    }

    const msgId =
      data && data.messages && Array.isArray(data.messages) && data.messages[0]
        ? data.messages[0].id
        : null;

    return {
      success: true,
      providerMessageId: msgId || null,
      rawResponse: data
    };
  } catch (e) {
    console.error('[WHATSAPP] Excepción al llamar a Meta:', e);
    return {
      success: false,
      providerMessageId: null,
      rawResponse: { error: e.message }
    };
  }
}

module.exports = {
  sendWhatsAppMessage
};
