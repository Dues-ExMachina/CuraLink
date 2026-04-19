/**
 * ─────────────────────────────────────────────────────────────────
 * ClinicalTrialCard Component
 * ─────────────────────────────────────────────────────────────────
 * Displays a single clinical trial with status badge, location,
 * brief summary, and direct link to ClinicalTrials.gov.
 */

import { ExternalLink, MapPin, FlaskConical, Phone } from 'lucide-react';
import { cn, truncateWords, getStatusBadgeClass } from '@/lib/utils';

const ClinicalTrialCard = ({ trial, index }) => {
  const { title, status, phase, briefSummary, locations, contactInfo, url, nctId, eligibilityCriteria } = trial;

  return (
    <div
      className="glass-card fade-in group cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => url && window.open(url, '_blank')}
    >
      <div style={{ padding: '14px 16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Status badge */}
            <span className={cn('text-xs font-semibold rounded-full', getStatusBadgeClass(status))}
              style={{ fontSize: '0.68rem', padding: '2px 10px' }}>
              ● {status || 'Unknown'}
            </span>

            {/* Phase badge */}
            {phase && phase !== 'N/A' && (
              <span style={{
                fontSize: '0.67rem', padding: '2px 8px', borderRadius: '999px',
                background: 'rgba(255, 179, 71, 0.12)', color: 'var(--accent-warning)',
                border: '1px solid rgba(255, 179, 71, 0.25)', fontWeight: 600,
              }}>
                {phase}
              </span>
            )}
          </div>
          {url && (
            <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          )}
        </div>

        {/* Trial title */}
        <h4 style={{
          fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.4, marginBottom: '6px',
        }}>
          {title || 'Untitled Trial'}
        </h4>

        {/* NCT ID */}
        {nctId && (
          <p style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginBottom: '8px', fontFamily: 'monospace' }}>
            {nctId}
          </p>
        )}

        {/* Brief summary */}
        {briefSummary && briefSummary !== 'No summary available' && (
          <p style={{
            fontSize: '0.78rem', color: 'var(--text-secondary)',
            lineHeight: 1.55, marginBottom: '10px',
          }}>
            {truncateWords(briefSummary, 28)}
          </p>
        )}

        {/* Location & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {locations && locations !== 'Location not specified' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <MapPin size={11} /> {locations}
            </span>
          )}
          {contactInfo && contactInfo !== 'Contact information not available' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Phone size={11} /> {contactInfo.slice(0, 60)}{contactInfo.length > 60 ? '…' : ''}
            </span>
          )}
          {eligibilityCriteria && eligibilityCriteria !== 'Eligibility criteria not specified' && (
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <FlaskConical size={11} style={{ marginTop: '2px', flexShrink: 0 }} /> 
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {eligibilityCriteria}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalTrialCard;
