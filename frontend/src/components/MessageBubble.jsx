/**
 * ─────────────────────────────────────────────────────────────────
 * MessageBubble Component
 * ─────────────────────────────────────────────────────────────────
 * Renders a single chat message (user or assistant).
 * 
 * For user messages: simple right-aligned bubble.
 * For assistant messages: full structured response with:
 *   - Rendered markdown
 *   - Source publication cards (stacked grid)
 *   - Clinical trial cards (stacked grid)
 *   - Meta info (intent, expanded query)
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import SourceCard from './SourceCard';
import ClinicalTrialCard from './ClinicalTrialCard';

const MessageBubble = ({ message }) => {
  const { role, content, publications = [], trials = [], intent } = message;
  const isAssistant = role === 'assistant';

  // Toggle sources panels (collapsed by default for cleaner view)
  const [showPubs, setShowPubs] = useState(false);
  const [showTrials, setShowTrials] = useState(false);

  if (!isAssistant) {
    // ─── User Message ─────────────────────────────────────────────
    return (
      <div className="slide-in-right" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ maxWidth: '75%', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,210,255,0.15), rgba(123,47,255,0.12))',
            border: '1px solid rgba(0,210,255,0.2)',
            borderRadius: '18px 18px 4px 18px',
            padding: '12px 16px',
          }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.55 }}>
              {content}
            </p>
          </div>
          {/* User avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={15} color="#fff" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Assistant Message ─────────────────────────────────────────
  return (
    <div className="slide-in-left" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
      {/* CuraLink avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #00d2ff, #7b2fff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 14px rgba(0,210,255,0.35)',
      }}>
        <Bot size={18} color="#fff" />
      </div>

      <div style={{ maxWidth: '90%', flex: 1 }}>
        {/* Intent chip */}
        {intent && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginBottom: '10px', padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
          }}>
            <Lightbulb size={12} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
              {intent}
            </span>
          </div>
        )}

        {/* Response card */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          {/* Rendered markdown response — uses .prose-response styles */}
          <div className="prose-response">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* ─── Publications Section ──────────────────────────────── */}
        {publications.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setShowPubs(!showPubs)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: '1px solid var(--border-default)',
                borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500,
              }}
            >
              📚 {publications.length} Publication{publications.length > 1 ? 's' : ''} Retrieved
              {showPubs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showPubs && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '10px', marginTop: '10px',
              }}>
                {publications.map((pub, i) => (
                  <SourceCard key={pub.pmid || pub.openAlexId || i} publication={pub} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Clinical Trials Section ───────────────────────────── */}
        {trials.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setShowTrials(!showTrials)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: '1px solid var(--border-default)',
                borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500,
              }}
            >
              🏥 {trials.length} Clinical Trial{trials.length > 1 ? 's' : ''} Found
              {showTrials ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTrials && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '10px', marginTop: '10px',
              }}>
                {trials.map((trial, i) => (
                  <ClinicalTrialCard key={trial.nctId || i} trial={trial} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
