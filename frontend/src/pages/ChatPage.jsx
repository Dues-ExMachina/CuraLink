/**
 * ─────────────────────────────────────────────────────────────────
 * ChatPage — Main Research Chat Interface
 * ─────────────────────────────────────────────────────────────────
 * The primary UI: sidebar with patient context + scrollable chat window.
 * Loads the session on mount (by ID from URL params).
 * Manages the conversation display with auto-scroll.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import UserContextPanel from '@/components/UserContextPanel';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import ChatInput from '@/components/ChatInput';
import { Activity } from 'lucide-react';

const ChatPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { session, messages, isLoading, loadSession, sendMessage, clearSession } = useSession();

  const messagesEndRef = useRef(null);

  // Track which AI pipeline step we're on for the typing indicator
  const [pipelineStep, setPipelineStep] = useState(0);

  // Load session from DB on mount (handles page refresh)
  useEffect(() => {
    if (sessionId && (!session || session.sessionId !== sessionId)) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Animate through pipeline steps while loading
  useEffect(() => {
    if (!isLoading) {
      setPipelineStep(0);
      return;
    }
    // Cycle through steps every 4 seconds
    const interval = setInterval(() => {
      setPipelineStep((s) => (s + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    try {
      await sendMessage(text);
    } catch {
      // Error is already set in context
    }
  };

  const handleNewSession = () => {
    clearSession();
    navigate('/');
  };

  const handleExampleQuery = (q) => {
    if (!isLoading) handleSend(q);
  };

  // Empty state (no session loaded yet)
  if (!session) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            animation: 'pulse-glow 2s infinite',
          }}>
            <Activity size={24} color="#fff" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <UserContextPanel
        session={session}
        onNewSession={handleNewSession}
        onExampleQuery={handleExampleQuery}
      />

      {/* ─── Main Chat Area ───────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header bar */}
        <header style={{
          padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface)',
        }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Research Session — <span style={{ color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{session.disease}</span>
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Researching for {session.patientName} {session.location ? `· ${session.location}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'var(--accent-success)', display: 'inline-block',
              animation: 'pulse-glow 2s infinite',
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Ready</span>
          </div>
        </header>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Welcome message */}
          {messages.length === 0 && !isLoading && (
            <div className="fade-in" style={{ textAlign: 'center', paddingTop: '60px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px', background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                boxShadow: '0 0 32px rgba(0,210,255,0.3)',
              }}>
                <Activity size={30} color="#fff" />
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Hello, {session.patientName}! 👋
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
                I'm CuraLink — your AI medical research companion. Ask me anything about{' '}
                <strong style={{ color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{session.disease}</strong>,
                and I'll search peer-reviewed literature and clinical trials to find you the best answers.
              </p>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator step={pipelineStep} />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={!session}
        />
      </main>
    </div>
  );
};

export default ChatPage;
