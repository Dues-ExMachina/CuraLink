/**
 * ─────────────────────────────────────────────────────────────────
 * ChatInput Component
 * ─────────────────────────────────────────────────────────────────
 * Textarea-based chat input with send button, keyboard shortcut
 * support (Enter to send, Shift+Enter for new line), and
 * suggestion chips for common research queries.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

// Quick suggestion chips — clickable prompts for instant research
const SUGGESTIONS = [
  'Latest treatment options',
  'Active clinical trials',
  'Top researchers in this field',
  'Side effects of current medications',
  'Recent breakthroughs',
];

const ChatInput = ({ onSend, isLoading, disabled }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift); Shift+Enter adds new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: '16px 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>
      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            disabled={isLoading || disabled}
            onClick={() => onSend(s)}
            style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 500,
              background: 'rgba(0,210,255,0.07)', border: '1px solid rgba(0,210,255,0.18)',
              color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease',
              opacity: isLoading || disabled ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(0,210,255,0.14)';
              e.target.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(0,210,255,0.07)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <Sparkles size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: '14px', padding: '10px 14px',
        transition: 'border-color 0.2s',
      }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder="Ask about treatments, clinical trials, researchers… (Enter to send)"
          rows={1}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
            color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, minHeight: '24px',
            fontFamily: 'inherit', caretColor: 'var(--accent-primary)',
          }}
        />
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading || disabled}
          className="btn-glow"
          style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !value.trim() || isLoading || disabled ? 0.4 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        CuraLink uses open-source AI + peer-reviewed research. Always consult a healthcare professional.
      </p>
    </div>
  );
};

export default ChatInput;
