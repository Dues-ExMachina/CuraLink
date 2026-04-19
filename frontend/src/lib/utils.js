/**
 * cn() — Class Name utility
 * Merges Tailwind classes intelligently using clsx + tailwind-merge.
 * Prevents Tailwind class conflicts (e.g., "p-2 p-4" → "p-4").
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an author string to a truncated display form.
 * e.g., "Smith J, Jones A, Lee K et al." stays as-is
 */
export function formatAuthors(authors, maxLength = 60) {
  if (!authors || authors === 'Unknown') return 'Unknown Authors';
  return authors.length > maxLength ? authors.slice(0, maxLength) + '…' : authors;
}

/**
 * Truncates a string to a max word count.
 */
export function truncateWords(text, maxWords = 30) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

/**
 * Returns a badge color class based on source name.
 */
export function getSourceBadgeClass(source) {
  switch (source) {
    case 'PubMed': return 'badge-pubmed';
    case 'OpenAlex': return 'badge-openalex';
    case 'ClinicalTrials.gov': return 'badge-recruiting';
    default: return 'badge-completed';
  }
}

/**
 * Returns the status badge color for clinical trial status.
 */
export function getStatusBadgeClass(status) {
  switch (status?.toUpperCase()) {
    case 'RECRUITING': return 'badge-recruiting';
    case 'COMPLETED': return 'badge-completed';
    default: return 'badge-completed';
  }
}
