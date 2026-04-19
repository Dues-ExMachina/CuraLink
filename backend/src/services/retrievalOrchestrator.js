/**
 * ─────────────────────────────────────────────────────────────────
 * Retrieval Orchestrator
 * ─────────────────────────────────────────────────────────────────
 * Coordinates all three data sources in parallel for maximum speed.
 * 
 * FLOW:
 *   queryExpansion → [PubMed + OpenAlex + ClinicalTrials] (parallel)
 *   → reranker → top documents
 * 
 * PARALLELISM STRATEGY:
 *   All three API calls run simultaneously using Promise.allSettled().
 *   allSettled (not Promise.all) ensures one API failure doesn't
 *   kill the entire retrieval — the other sources still return data.
 */

const { fetchPubMedArticles } = require('./pubmedService');
const { fetchOpenAlexArticles } = require('./openAlexService');
const { fetchClinicalTrials } = require('./clinicalTrialsService');
const { rerankDocuments } = require('./reranker');

/**
 * Orchestrates the full retrieval pipeline for a given expanded query.
 * 
 * @param {string} publicationQuery - Expanded query for PubMed + OpenAlex
 * @param {string} clinicalQuery - Intervention query for ClinicalTrials.gov
 * @param {string} disease - Primary disease/condition for context
 * @param {string} userLocation - Patient location for ranking
 * @returns {Object} - { publications: Array, trials: Array } — top ranked results
 */
const retrieveAndRank = async (publicationQuery, clinicalQuery, disease, userLocation = '') => {
  console.log('🚀 Starting parallel retrieval from all sources...');
  const startTime = Date.now();

  // ─── Parallel Retrieval ─────────────────────────────────────────────
  // Using allSettled so a partial failure doesn't abort everything
  const [pubmedResult, openAlexResult, trialsResult] = await Promise.allSettled([
    fetchPubMedArticles(publicationQuery),
    fetchOpenAlexArticles(publicationQuery),
    fetchClinicalTrials(disease, clinicalQuery),
  ]);

  // ─── Safely extract results (handle individual failures) ────────────
  const pubmedArticles = pubmedResult.status === 'fulfilled' ? pubmedResult.value : [];
  const openAlexArticles = openAlexResult.status === 'fulfilled' ? openAlexResult.value : [];
  const trials = trialsResult.status === 'fulfilled' ? trialsResult.value : [];

  if (pubmedResult.status === 'rejected')
    console.warn('⚠️ PubMed retrieval failed:', pubmedResult.reason?.message);
  if (openAlexResult.status === 'rejected')
    console.warn('⚠️ OpenAlex retrieval failed:', openAlexResult.reason?.message);
  if (trialsResult.status === 'rejected')
    console.warn('⚠️ ClinicalTrials retrieval failed:', trialsResult.reason?.message);

  // ─── Combine all publications ───────────────────────────────────────
  // Both PubMed and OpenAlex results pool together for broader coverage
  const allPublications = [...pubmedArticles, ...openAlexArticles];

  console.log(
    `📥 Raw retrieval complete in ${Date.now() - startTime}ms: ` +
    `${pubmedArticles.length} PubMed + ${openAlexArticles.length} OpenAlex + ${trials.length} trials`
  );

  // ─── Re-rank to select top results ─────────────────────────────────
  const { publications, trials: rankedTrials } = await rerankDocuments(
    allPublications,
    trials,
    publicationQuery,
    6,
    4,
    userLocation
  );

  return { publications, trials: rankedTrials };
};

module.exports = { retrieveAndRank };
