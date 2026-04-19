/**
 * ─────────────────────────────────────────────────────────────────
 * TypingIndicator Component
 * ─────────────────────────────────────────────────────────────────
 * Animated dots shown while the AI pipeline is processing.
 * Includes a contextual status message showing which step
 * is currently running.
 */

import { Bot } from 'lucide-react';

const STEP_MESSAGES = [
  '🔎 Expanding your query with medical context…',
  '📡 Fetching research from PubMed, OpenAlex & ClinicalTrials…',
  '📊 Re-ranking and filtering top results…',
  '🧠 Synthesizing a personalized research summary…',
];

const TypingIndicator = ({ step = 0 }) => {
  const stepMessage = STEP_MESSAGES[Math.min(step, STEP_MESSAGES.length - 1)];

  return (
    <div className="slide-in-left" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
      {/* Avatar with pulse glow */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #00d2ff, #7b2fff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse-glow 2s infinite',
      }}>
        <Bot size={18} color="#fff" />
      </div>

      <div className="glass-card" style={{ padding: '14px 18px' }}>
        {/* Three animated dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        {/* Status message */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {stepMessage}
        </p>
      </div>
    </div>
  );
};

export default TypingIndicator;
