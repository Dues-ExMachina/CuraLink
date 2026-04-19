/**
 * ─────────────────────────────────────────────────────────────────
 * Query Expansion Service
 * ─────────────────────────────────────────────────────────────────
 * Uses the LLM to intelligently expand a user's raw query into
 * optimized scientific search terms, combining user intent with
 * their disease context.
 * 
 * WHY QUERY EXPANSION:
 *   A user asking "deep brain stimulation" needs the system to
 *   understand they mean "deep brain stimulation in Parkinson's disease".
 *   The LLM can extract intent, add synonyms, and produce precise
 *   medical terminology for better retrieval quality.
 */

const { callLLM } = require('./llmService');

/**
 * Expands a raw user query into optimized scientific search terms.
 * 
 * @param {string} userQuery - Raw user question/query
 * @param {string} disease - User's primary condition context
 * @param {Array}  conversationHistory - Recent messages for follow-up context
 * @param {string} userLocation - Patient location
 * @returns {Object} - { expandedQuery: string, clinicalQuery: string }
 */
const expandQuery = async (userQuery, disease, conversationHistory = [], userLocation = '') => {
  // ─── Build conversation context string for follow-up awareness ──────
  const contextStr =
    conversationHistory.length > 0
      ? conversationHistory
          .slice(-4) // Last 4 messages (2 user + 2 assistant) for conciseness
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 200)}`)
          .join('\n')
      : 'No prior conversation.';

  const systemPrompt = `You are a medical research query specialist. Your job is to convert natural language queries into precise scientific search strings for PubMed, OpenAlex, and ClinicalTrials.gov.

Rules:
1. Always combine the user's specific topic with their disease context
2. Add relevant medical synonyms and related terms
3. Keep expanded queries concise (under 100 characters)
4. Return ONLY valid JSON — no extra text, no markdown fences

Output format (STRICT JSON):
{
  "publicationQuery": "search string optimized for PubMed/OpenAlex",
  "clinicalQuery": "intervention term for ClinicalTrials.gov",
  "intent": "one sentence describing what the user wants to know"
}`;

  const userPrompt = `Primary disease context: ${disease}
${userLocation ? `Patient Location: ${userLocation}` : ''}
User's question: ${userQuery}
Recent conversation context:
${contextStr}

Generate the expanded JSON queries now.`;

  try {
    const raw = await callLLM(systemPrompt, userPrompt, { maxTokens: 300, temperature: 0.2 });

    // ─── Extract JSON from LLM response ──────────────────────────────
    // LLMs sometimes wrap JSON in backticks — strip them
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in LLM response');

    const parsed = JSON.parse(jsonMatch[0]);

    // ─── Fallback if LLM returns empty values ─────────────────────────
    return {
      publicationQuery: parsed.publicationQuery || `${disease} ${userQuery}`,
      clinicalQuery: parsed.clinicalQuery || userQuery,
      intent: parsed.intent || `Research on ${userQuery} related to ${disease}`,
    };
  } catch (err) {
    console.warn('Query expansion LLM failed, using fallback:', err.message);
    // Fallback: simple concatenation — still better than raw query alone
    return {
      publicationQuery: `${disease} ${userQuery} treatment research`,
      clinicalQuery: userQuery,
      intent: `Research on ${userQuery} related to ${disease}`,
    };
  }
};

module.exports = { expandQuery };
