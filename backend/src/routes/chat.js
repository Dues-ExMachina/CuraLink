/**
 * ─────────────────────────────────────────────────────────────────
 * Chat Route — The Main AI Pipeline Endpoint
 * ─────────────────────────────────────────────────────────────────
 * 
 * FULL PIPELINE (called on every user message):
 *   1. Validate request + load session context
 *   2. Expand query using LLM (query expansion)
 *   3. Retrieve documents in parallel (PubMed + OpenAlex + ClinicalTrials)
 *   4. Re-rank to select top 6-8 results
 *   5. Synthesize structured response with LLM
 *   6. Save assistant message + return response with sources
 */

const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { expandQuery } = require('../services/queryExpansion');
const { retrieveAndRank } = require('../services/retrievalOrchestrator');
const { synthesizeResponse } = require('../services/synthesizer');

/**
 * POST /api/chat
 * Processes a user message through the full AI pipeline.
 * 
 * Request body:
 *   - sessionId: string (required)
 *   - message: string (required)
 * 
 * Response:
 *   - response: string (structured markdown)
 *   - publications: Array
 *   - trials: Array
 *   - intent: string
 *   - expandedQuery: string
 */
router.post('/', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required.' });
  }

  try {
    // ─── Step 1: Load User Session Context ──────────────────────────
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found. Please create a new session.' });
    }

    const { patientName, disease, location } = session;
    const conversationHistory = session.messages;

    // Save user message to session (for context in future turns)
    session.messages.push({ role: 'user', content: message });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`💬 User [${patientName}]: ${message}`);
    console.log(`🩺 Context: disease="${disease}" location="${location}"`);
    console.log(`${'='.repeat(60)}`);

    // ─── Step 2: Query Expansion via LLM ────────────────────────────
    // Converts raw user query into optimized scientific search strings
    const { publicationQuery, clinicalQuery, intent } = await expandQuery(
      message,
      disease,
      conversationHistory,
      location
    );

    console.log(`🔎 Expanded query: "${publicationQuery}"`);
    console.log(`🏥 Clinical query: "${clinicalQuery}"`);
    console.log(`🎯 Intent: "${intent}"`);

    // ─── Step 3 + 4: Retrieve and Re-rank ───────────────────────────
    // All three APIs called in parallel; results re-ranked to top 6-8
    const { publications, trials } = await retrieveAndRank(
      publicationQuery,
      clinicalQuery,
      disease,
      location
    );

    // ─── Step 5: LLM Synthesis ───────────────────────────────────────
    // Combines everything into a structured, personalized response
    const responseText = await synthesizeResponse({
      userQuery: message,
      patientName,
      disease,
      intent,
      publications,
      trials,
      conversationHistory,
    });

    // ─── Step 6: Persist and Respond ─────────────────────────────────
    // Save assistant response to maintain multi-turn context
    session.messages.push({ role: 'assistant', content: responseText });
    await session.save();

    console.log(`✅ Response generated successfully for ${patientName}`);

    res.json({
      response: responseText,          // Full structured markdown response
      publications,                     // Top publications (for UI cards)
      trials,                           // Top trials (for UI cards)
      intent,                           // Parsed user intent
      expandedQuery: publicationQuery,  // Debug/transparency info
    });
  } catch (err) {
    console.error('Chat pipeline error:', err);
    res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
