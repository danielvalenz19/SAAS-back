// src/integrations/aiProvider.js
const axios = require('axios');
const env = require('../config/env');

/**
 * Llama al modelo local en LM Studio (API tipo OpenAI) para generar texto.
 */
async function generateText({ systemPrompt, userPrompt, maxTokens = 256, temperature = 0.4 }) {
  const url = `${env.ai.baseUrl}/chat/completions`;

  const body = {
    model: env.ai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature
  };

  try {
    const { data } = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.apiKey}`
      },
      timeout: 60000
    });

    const content = data?.choices?.[0]?.message?.content || '';
    return {
      content: content.trim(),
      raw: data
    };
  } catch (error) {
    console.error('[AI] Error llamando al modelo local:', error.response?.data || error.message);
    const err = new Error('No se pudo generar el texto con IA');
    err.statusCode = 502;
    throw err;
  }
}

module.exports = {
  generateText
};
