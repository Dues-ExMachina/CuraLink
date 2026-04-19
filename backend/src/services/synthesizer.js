/**
 * ─────────────────────────────────────────────────────────────────
 * Response Synthesizer Service
 * ─────────────────────────────────────────────────────────────────
 * The final step in the AI pipeline. Takes the re-ranked publications
 * and trials, constructs a rich context, and calls the LLM to produce
 * a structured, personalized, non-hallucinated research response.
 * 
 * OUTPUT STRUCTURE:
 *   1. Condition Overview
 *   2. Research Insights (from publications)
 *   3. Clinical Trials Summary (if available)
 *   4. Source Attribution (citations)
 *   5. Personalized Recommendation
 */

const { callLLM } = require('./llmService');

/**
 * Formats a publication into a concise context string for the LLM prompt.
 * We limit abstract to 400 chars to keep the prompt within token limits.
 */
const formatPublication = (pub, index) =>
  `[Pub ${index + 1}] "${pub.title}"
Authors: ${pub.authors} (${pub.year}) | Source: ${pub.source}
Abstract: ${pub.abstract.slice(0, 400)}${pub.abstract.length > 400 ? '...' : ''}
URL: ${pub.url}`;

/**
 * Formats a clinical trial into a concise context string.
 */
const formatTrial = (trial, index) =>
  `[Trial ${index + 1}] "${trial.title}" | NCT: ${trial.nctId}
Status: ${trial.status} | Phase: ${trial.phase}
Summary: ${trial.briefSummary.slice(0, 300)}${trial.briefSummary.length > 300 ? '...' : ''}
Location: ${trial.locations} | URL: ${trial.url}`;

/**
 * Synthesizes a structured research response from retrieved documents.
 * 
 * @param {Object} params - All context needed for synthesis
 * @param {string} params.userQuery - The user's original question
 * @param {string} params.patientName - Patient's name for personalization
 * @param {string} params.disease - Primary condition context
 * @param {string} params.intent - LLM-extracted intent from query expansion
 * @param {Array}  params.publications - Re-ranked publications (top 6)
 * @param {Array}  params.trials - Re-ranked clinical trials (top 4)
 * @param {Array}  params.conversationHistory - Past messages for follow-up
 * @returns {string} - Structured markdown response
 */
const synthesizeResponse = async ({
  userQuery,
  patientName,
  disease,
  intent,
  publications,
  trials,
  conversationHistory = [],
}) => {
  // ─── Build context blocks from retrieved documents ──────────────────
  const pubContext = publications.length > 0
    ? publications.map(formatPublication).join('\n\n')
    : 'No relevant publications found for this query.';

  const trialContext = trials.length > 0
    ? trials.map(formatTrial).join('\n\n')
    : 'No relevant clinical trials found for this query.';

  // ─── Build conversation context for multi-turn awareness ────────────
  const conversationContext = conversationHistory.length > 0
    ? conversationHistory
        .slice(-6) // Last 6 messages for deep context
        .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content.slice(0, 300)}`)
        .join('\n')
    : '';

  // ─── System Prompt: Define LLM's role and strict output rules ──────
  const systemPrompt = `You are CuraLink, an expert AI medical research assistant. Your purpose is to synthesize complex medical research into clear, actionable, and personalized summaries for patients.

CRITICAL RULES:
1. ONLY use information from the provided research context — never hallucinate or invent studies
2. If a study supports a claim, ALWAYS cite it using [Pub N] notation (e.g., [Pub 1])
3. Structure your response EXACTLY as shown in the format below
4. Speak directly to the patient by name
5. Use empathetic, clear language — not overly clinical  
6. Mark sections with the exact headers shown
7. If no relevant info is found for a section, say "No data available at this time" — do not fabricate
8. If both RETRIEVED PUBLICATIONS and CLINICAL TRIALS are empty, you MUST ONLY state "No research found in PubMed/OpenAlex for ${disease}" and explain that it might be a fake disease or no research exists yet. DO NOT MAKE UP SYMPTOMS or treatments.
9. If asked about your identity or model architecture, ONLY say "I am CuraLink, a custom Medical Assistant." DO NOT output "OpenAI", "ChatGPT", "Gemini", "Google", "LLaMA", "Mistral", or any other model name.

RESPONSE FORMAT (use exactly):
## 🧬 Condition Overview
[2-3 sentence overview of the condition in context of the query]

## 🔬 Research Insights
[4-6 bullet points synthesizing key findings from the publications. Cite each with [Pub N].]

## 🏥 Clinical Trials
[3-4 bullet points covering relevant trials. Include status, location, and [Trial N] citation. If none, state "No relevant trials found."]

## 📚 Source Attribution
[List each source cited: Title | Authors | Year | Platform | URL]

## 💡 Personalized Note for ${patientName || 'you'}
[1-2 sentence personalized takeaway based on their specific disease context and query]`;

  // ─── User Prompt: The actual research data ─────────────────────────
  const userPrompt = `Patient: ${patientName || 'the user'}
Primary condition: ${disease}
Research intent: ${intent}
Current question: ${userQuery}

${conversationContext ? `Conversation context:\n${conversationContext}\n` : ''}

RETRIEVED PUBLICATIONS:
${pubContext}

RETRIEVED CLINICAL TRIALS:
${trialContext}

Please synthesize a thorough, accurate, and personalized research response following the exact format specified.`;

  try {
    const response = await callLLM(systemPrompt, userPrompt, {
      maxTokens: 2048,
      temperature: 0.3,
    });
    return response;
  } catch (err) {
    console.error('Synthesis LLM failed:', err.message);
    // Provide a structured fallback that still shows the retrieved data
    return buildFallbackResponse(patientName, disease, publications, trials);
  }
};

/**
 * Fallback response builder if the LLM call fails.
 * Formats the retrieved data into a structured markdown response
 * without LLM synthesis.
 */
const buildFallbackResponse = (patientName, disease, publications, trials) => {
  const pubList = publications
    .map((p, i) => `- **[Pub ${i + 1}] ${p.title}** (${p.year}) — ${p.authors} [${p.source}](${p.url})`)
    .join('\n');

  const trialList = trials
    .map((t, i) => `- **[Trial ${i + 1}] ${t.title}** — Status: ${t.status} | ${t.locations} [View](${t.url})`)
    .join('\n');

  return `## 🧬 Condition Overview
Research data has been retrieved for **${disease}**. The AI synthesis service is temporarily unavailable — here are the raw top results.

## 🔬 Research Insights
${pubList || 'No publications retrieved.'}

## 🏥 Clinical Trials
${trialList || 'No trials retrieved.'}

## 💡 Personalized Note for ${patientName || 'you'}
Please review the sources above for detailed information. Consider discussing findings with your healthcare provider.`;
};

module.exports = { synthesizeResponse };
