/**
 * ─────────────────────────────────────────────────────────────────
 * UserContextPanel (Sidebar) Component
 * ─────────────────────────────────────────────────────────────────
 * Left sidebar showing active patient context and providing
 * options to start a new session or update the profile.
 * Also shows example queries and a session badge.
 */

import { User, Stethoscope, MapPin, RefreshCw, Activity, FlaskConical } from 'lucide-react';

const EXAMPLE_QUERIES = [
  'Latest treatment for lung cancer',
  'Clinical trials for diabetes',
  'Top researchers in Alzheimer\'s disease',
  'Recent studies on heart disease',
  'Deep brain stimulation outcomes',
];

const UserContextPanel = ({ session, onNewSession, onExampleQuery }) => {
  if (!session) return null;

  return (
    <aside style={{
      width: '260px', flexShrink: 0,
      background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto',
    }}>
      {/* Logo header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              Cura<span className="gradient-text">Link</span>
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>AI Medical Research</p>
          </div>
        </div>
      </div>

      {/* Patient Context Card */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Patient Context
        </p>

        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <User size={13} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{session.patientName}</p>
            <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Patient</p>
          </div>
        </div>

        {/* Disease */}
        <div className="glass-card" style={{ padding: '8px 12px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Stethoscope size={13} color="var(--accent-primary)" />
            <div>
              <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Condition</p>
              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {session.disease}
              </p>
            </div>
          </div>
        </div>

        {/* Location */}
        {session.location && (
          <div className="glass-card" style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <MapPin size={13} color="var(--accent-secondary)" />
              <div>
                <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Location</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{session.location}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Example Queries */}
      <div style={{ padding: '16px', flex: 1 }}>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Try asking…
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => onExampleQuery(q)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '7px',
                background: 'none', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '8px 10px', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'left',
                transition: 'all 0.2s ease', lineHeight: 1.35,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-accent)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <FlaskConical size={12} color="var(--accent-primary)" style={{ marginTop: '1px', flexShrink: 0 }} />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* New Session Button */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onNewSession}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            background: 'none', border: '1px solid var(--border-default)', borderRadius: '8px',
            padding: '10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem',
            fontWeight: 500, transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,92,107,0.4)';
            e.currentTarget.style.color = 'var(--accent-danger)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <RefreshCw size={14} /> New Session
        </button>
      </div>
    </aside>
  );
};

export default UserContextPanel;
