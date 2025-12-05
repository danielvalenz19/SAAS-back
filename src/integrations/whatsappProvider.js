// src/integrations/whatsappProvider.js
/**
 * Adapter de proveedor de WhatsApp.
 * Actualmente FAKE: simula éxito. Luego se reemplaza por Twilio/Meta/etc.
 */

async function sendWhatsAppMessage({ telefono, mensaje }) {
  // En producción, aquí se haría la llamada HTTP al proveedor real.
  console.log('[WHATSAPP-FAKE] Enviando mensaje a', telefono);
  console.log('[WHATSAPP-FAKE] Mensaje:', mensaje);

  return {
    success: true,
    providerMessageId: 'fake-123456',
    rawResponse: { fake: true }
  };
}

module.exports = {
  sendWhatsAppMessage
};
