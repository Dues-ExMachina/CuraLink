/**
 * ─────────────────────────────────────────────────────────────────
 * OpenAlex Retrieval Service
 * ─────────────────────────────────────────────────────────────────
 * Fetches open-access research publications from the OpenAlex API.
 * 
 * STRATEGY: Runs two parallel queries per call:
 *   1. Sort by relevance_score (most relevant first)
 *   2. Sort by publication_date (most recent first)
 * Then deduplicates by OpenAlex ID to maximize breadth.
 */

const axios = require('axios');

const OPENALEX_BASE = 'https://api.openalex.org/works';
const PER_PAGE = 50; // Fetch 50 per request, 2 requests = up to 100 candidates

/**
 * Parses a single OpenAlex work object into a standardized article format.
 * @param {Object} work - Raw work object from OpenAlex API response
 * @returns {Object} - Parsed article object
 */
const parseWork = (work) => {
  // ─── Extract abstract ──────────────────────────────────────────────
  // OpenAlex provides abstract as an inverted index — reconstruct plaintext
  let abstract = 'No abstract available';
  if (work.abstract_inverted_index) {
    try {
      const words = {};
      for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
        for (const pos of positions) words[pos] = word;
      }
      abstract = Object.keys(words)
        .sort((a, b) => a - b)
        .map((k) => words[k])
        .join(' ');
    } catch {
      abstract = 'Abstract reconstruction failed';
    }
  }

  // ─── Extract authors ───────────────────────────────────────────────
  const authors = (work.authorships || [])
    .slice(0, 4)
    .map((a) => a?.author?.display_name || '')
    .filter(Boolean)
    .join(', ');

  // ─── Extract year ──────────────────────────────────────────────────
  const year = work.publication_year || 'N/A';

  // ─── Build URL ─────────────────────────────────────────────────────
  const url =
    work.primary_location?.landing_page_url ||
    work.open_access?.oa_url ||
    `https://openalex.org/${work.id?.replace('https://openalex.org/', '')}`;

  return {
    source: 'OpenAlex',
    title: work.title || 'Untitled',
    abstract: abstract.trim(),
    authors: authors || 'Unknown',
    year: String(year),
    url,
    openAlexId: work.id,
    citationCount: work.cited_by_count || 0,
  };
};

/**
 * Fetches a page of results from OpenAlex with given sort order.
 * @param {string} query - Search query
 * @param {string} sort - Sort parameter (e.g., 'relevance_score:desc')
 * @returns {Array} - Parsed article objects
 */
const fetchPage = async (query, sort) => {
  try {
    const resp = await axios.get(OPENALEX_BASE, {
      params: {
        search: query,
        'per-page': PER_PAGE,
        page: 1,
        sort,
        // Filter to last 8 years for freshness
        filter: 'from_publication_date:2016-01-01',
      },
      headers: {
        // Polite pool: provide mailto to get better rate limits from OpenAlex
        'User-Agent': 'CuraLink/1.0 (mailto:curalink@research.app)',
      },
      timeout: 15000,
    });

    const results = resp.data?.results || [];
    return results.map(parseWork);
  } catch (err) {
    console.error(`OpenAlex fetch error (sort: ${sort}):`, err.message);
    return [];
  }
};

/**
 * Main function: Searches OpenAlex for publications matching the query.
 * Runs relevance + recency queries in parallel for maximum coverage.
 * @param {string} query - Expanded search query
 * @returns {Array} - Deduplicated array of parsed article objects
 */
const fetchOpenAlexArticles = async (query) => {
  console.log(`🔍 OpenAlex: Searching for "${query}"...`);

  // Run both sort strategies in parallel for best breadth
  const [relevanceResults, recencyResults] = await Promise.all([
    fetchPage(query, 'relevance_score:desc'),
    fetchPage(query, 'publication_date:desc'),
  ]);

  // ─── Deduplicate by OpenAlex ID ──────────────────────────────────
  const seen = new Set();
  const combined = [...relevanceResults, ...recencyResults].filter((article) => {
    if (!article.openAlexId || seen.has(article.openAlexId)) return false;
    seen.add(article.openAlexId);
    return true;
  });

  console.log(`✅ OpenAlex: Retrieved ${combined.length} unique articles.`);
  return combined;
};

module.exports = { fetchOpenAlexArticles };
