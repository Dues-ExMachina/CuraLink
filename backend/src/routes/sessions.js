/**
 * ─────────────────────────────────────────────────────────────────
 * Sessions Routes
 * ─────────────────────────────────────────────────────────────────
 * Handles user session (patient context) creation and retrieval.
 * A session stores the patient's name, disease, and location,
 * which powers personalization and multi-turn context awareness.
 */

const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

/**
 * POST /api/sessions
 * Creates a new session with patient context.
 * Called when a user first sets up their profile.
 */
router.post('/', async (req, res) => {
  try {
    const { patientName, disease, location } = req.body;

    if (!patientName || !disease) {
      return res.status(400).json({ error: 'patientName and disease are required.' });
    }

    const session = await Session.create({
      patientName: patientName.trim(),
      disease: disease.trim(),
      location: (location || '').trim(),
      messages: [],
    });

    res.status(201).json({
      sessionId: session._id,
      patientName: session.patientName,
      disease: session.disease,
      location: session.location,
    });
  } catch (err) {
    console.error('Session creation error:', err);
    res.status(500).json({ error: 'Failed to create session.' });
  }
});

/**
 * GET /api/sessions/:id
 * Retrieves session info and full chat history for a given session ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json({
      sessionId: session._id,
      patientName: session.patientName,
      disease: session.disease,
      location: session.location,
      messages: session.messages,
      createdAt: session.createdAt,
    });
  } catch (err) {
    console.error('Session fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
});

/**
 * PATCH /api/sessions/:id
 * Updates patient context (disease, location) within an existing session.
 */
router.patch('/:id', async (req, res) => {
  try {
    const { disease, location } = req.body;
    const updates = {};
    if (disease) updates.disease = disease.trim();
    if (location !== undefined) updates.location = location.trim();

    const session = await Session.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    res.json({ sessionId: session._id, disease: session.disease, location: session.location });
  } catch (err) {
    console.error('Session update error:', err);
    res.status(500).json({ error: 'Failed to update session.' });
  }
});

module.exports = router;
