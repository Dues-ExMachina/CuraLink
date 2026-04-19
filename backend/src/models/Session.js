/**
 * ─────────────────────────────────────────────────────────────────
 * Session Model
 * ─────────────────────────────────────────────────────────────────
 * Stores user context (patient profile) for personalized responses.
 * A Session ties a user identity to their medical context,
 * enabling the AI to maintain personalization across conversations.
 */

const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    // Human-readable patient name (used for personalization in prompts)
    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    // Primary disease or condition the user is researching
    disease: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Optional geographic location (used for filtering clinical trials)
    location: {
      type: String,
      trim: true,
      default: '',
    },

    // Array of message objects representing the full conversation history
    // Stored in order to power multi-turn context awareness
    messages: [
      {
        // 'user' | 'assistant'
        role: { type: String, required: true, enum: ['user', 'assistant'] },

        // The text content of the message
        content: { type: String, required: true },

        // Timestamp when this message was created
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', SessionSchema);
