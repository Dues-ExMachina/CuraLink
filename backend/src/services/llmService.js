/**
 * ─────────────────────────────────────────────────────────────────
 * Hugging Face LLM Service
 * ─────────────────────────────────────────────────────────────────
 * Uses the Hugging Face Inference API with the newer Chat Completions
 * endpoint (OpenAI-compatible format), which is more reliable and
 * supports proper system/user message structure.
 *
 * Endpoint: https://router.huggingface.co/hf-inference/v1/chat/completions
 */

const axios = require('axios');

const HF_CHAT_API = 'https://router.huggingface.co/hf-inference/v1/chat/completions';

/**
 * Sends a system + user prompt to HF and returns the generated text.
 *
 * @param {string} systemPrompt - LLM role definition and output format rules
 * @param {string} userPrompt   - Dynamic content/question to reason about
 * @param {Object} options      - { maxTokens, temperature }
 * @returns {string}            - Generated text from the LLM
 */
const callLLM = async (systemPrompt, userPrompt, options = {}) => {
  const modelId = process.env.HF_MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.3';

  const payload = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.3,
    top_p: 0.9,
    stream: false,
  };

  try {
    const resp = await axios.post(HF_CHAT_API, payload, {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes — HF free tier can be slow
    });

    // Chat completions format: choices[0].message.content
    const generated = resp.data?.choices?.[0]?.message?.content || '';
    return generated.trim();
  } catch (err) {
    // Handle model loading (503) — retry once after 20s
    if (err.response?.status === 503) {
      console.log('⏳ HF model is loading... retrying in 20s');
      await new Promise((r) => setTimeout(r, 20000));
      return callLLM(systemPrompt, userPrompt, options);
    }

    const errMsg = err.response?.data?.error || err.message;
    console.error('LLM API error:', errMsg);
    throw new Error(`LLM call failed: ${errMsg}`);
  }
};

module.exports = { callLLM };
