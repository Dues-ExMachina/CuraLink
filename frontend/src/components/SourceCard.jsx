/**
 * ─────────────────────────────────────────────────────────────────
 * SourceCard Component
 * ─────────────────────────────────────────────────────────────────
 * Displays a single publication reference (PubMed or OpenAlex)
 * as a compact, clickable card with source badge and metadata.
 */

import { ExternalLink, BookOpen, Calendar, Users } from 'lucide-react';
import { cn, formatAuthors, truncateWords, getSourceBadgeClass } from '@/lib/utils';

const SourceCard = ({ publication, index }) => {
  const { title, authors, year, source, url, abstract } = publication;

  return (
    <div
      className="glass-card fade-in group cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => url && window.open(url, '_blank')}
    >
      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Index badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-primary)',
              fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
            }}>
              {index + 1}
            </span>
            {/* Source badge */}
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', getSourceBadgeClass(source))}
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              {source}
            </span>
          </div>
          {/* External link icon appears on hover */}
          {url && (
            <ExternalLink
              size={14}
              style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}
              className="group-hover:text-accent-primary transition-colors"
            />
          )}
        </div>

        {/* Title */}
        <h4 style={{
          fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.4, marginBottom: '8px',
        }}>
          {title || 'Untitled'}
        </h4>

        {/* Abstract snippet */}
        {abstract && abstract !== 'No abstract available' && (
          <p style={{
            fontSize: '0.78rem', color: 'var(--text-secondary)',
            lineHeight: 1.55, marginBottom: '10px',
          }}>
            {truncateWords(abstract, 25)}
          </p>
        )}

        {/* Metadata row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {authors && authors !== 'Unknown' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Users size={11} /> {formatAuthors(authors, 40)}
            </span>
          )}
          {year && year !== 'N/A' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Calendar size={11} /> {year}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceCard;
