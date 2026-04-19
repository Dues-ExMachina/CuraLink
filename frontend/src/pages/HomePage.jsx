/**
 * ─────────────────────────────────────────────────────────────────
 * HomePage — Patient Onboarding
 * ─────────────────────────────────────────────────────────────────
 * Landing page where users set up their patient context before
 * accessing the chat. Collects: name, disease, and optional location.
 *
 * Design: Full-screen dark hero with animated gradient background,
 * glassmorphism form card, and feature highlights.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, ArrowRight, Shield, Zap, BookOpen } from 'lucide-react';
import { useSession } from '@/context/SessionContext';

const FEATURES = [
  { icon: BookOpen, label: 'Multi-source Research', desc: 'PubMed + OpenAlex + ClinicalTrials' },
  { icon: Zap, label: 'AI-Powered Synthesis', desc: 'Open-source LLM reasoning' },
  { icon: Shield, label: 'Source-Attributed', desc: 'Every claim is linked to evidence' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { createSession, isLoading, error } = useSession();

  const [form, setForm] = useState({ patientName: '', disease: '', location: '' });
  const [formError, setFormError] = useState('');
  const [isWaking, setIsWaking] = useState(true);

  // Wake up models on load
  useEffect(() => {
    let mounted = true;
    axios.get('/api/health/wake')
      .then(() => {
        if (mounted) setIsWaking(false);
      })
      .catch((err) => {
        console.warn("Wake up failed or timeout", err);
        if (mounted) setIsWaking(false);
      });
      
    // Failsafe timeout after 15s in case it hangs
    const timer = setTimeout(() => {
      if (mounted) setIsWaking(false);
    }, 15000);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.patientName.trim()) return setFormError('Please enter your name.');
    if (!form.disease.trim()) return setFormError('Please enter your condition of interest.');

    try {
      const session = await createSession(form.patientName.trim(), form.disease.trim(), form.location.trim());
      navigate(`/chat/${session.sessionId}`);
    } catch {
      setFormError('Failed to create session. Please check your connection and try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,255,0.06) 0%, transparent 70%)',
        animation: 'pulse-glow 6s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.07) 0%, transparent 70%)',
        animation: 'pulse-glow 8s ease-in-out infinite reverse', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '960px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
        {/* ─── Left: Hero Copy ──────────────────────────────────────── */}
        <div className="fade-in">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0,210,255,0.4)',
            }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>
                Cura<span className="gradient-text">Link</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Medical Research Assistant</p>
            </div>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '2.4rem',
            lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: '16px',
          }}>
            Research-backed answers
            <br />
            <span className="gradient-text">personalized for you.</span>
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '420px' }}>
            CuraLink combines AI reasoning with live data from PubMed, OpenAlex, and ClinicalTrials.gov
            to deliver structured, source-attributed medical research summaries.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} color="var(--accent-primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1px' }}>{label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right: Onboarding Form ───────────────────────────────── */}
        <div className="glass-card fade-in" style={{ padding: '32px', animationDelay: '0.1s' }}>
          <h3 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.25rem',
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>
            Set up your profile
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Tell us about yourself so we can personalize your research
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Patient Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Your Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="text"
                name="patientName"
                value={form.patientName}
                onChange={handleChange}
                placeholder="e.g. John Smith"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* Condition */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Condition / Disease of Interest <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="text"
                name="disease"
                value={form.disease}
                onChange={handleChange}
                placeholder="e.g. Parkinson's disease"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Location <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(optional — for trial filtering)</span>
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Toronto, Canada"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* Error message */}
            {(formError || error) && (
              <p style={{
                fontSize: '0.8rem', color: 'var(--accent-danger)',
                background: 'rgba(255,92,107,0.1)', border: '1px solid rgba(255,92,107,0.25)',
                borderRadius: '6px', padding: '8px 12px',
              }}>
                {formError || error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || isWaking}
              className="btn-glow"
              style={{
                padding: '12px', fontSize: '0.95rem', marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: (isLoading || isWaking) ? 0.7 : 1,
                cursor: (isLoading || isWaking) ? 'progress' : 'pointer'
              }}
            >
              {isWaking ? 'Waking up AI models... (~15s)' : isLoading ? 'Creating your session…' : (
                <>Start Research <ArrowRight size={17} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
