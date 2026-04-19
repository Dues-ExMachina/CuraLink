/**
 * ─────────────────────────────────────────────────────────────────
 * ClinicalTrials.gov Retrieval Service
 * ─────────────────────────────────────────────────────────────────
 * Fetches ongoing and recently completed clinical trials from the
 * ClinicalTrials.gov API v2.
 * 
 * STRATEGY: Queries by condition (disease) + optional intervention
 * (the user's specific interest), prioritizing RECRUITING trials
 * to surface the most actionable and relevant results.
 */

const axios = require('axios');

const CT_BASE = 'https://clinicaltrials.gov/api/v2/studies';
const PAGE_SIZE = 50; // Retrieve 50 candidates; re-ranker picks top 6-8

/**
 * Parses a single study object from the ClinicalTrials.gov API response.
 * @param {Object} study - Raw study object from API
 * @returns {Object} - Standardized trial object
 */
const parseStudy = (study) => {
  const protocol = study?.protocolSection || {};
  const id = protocol?.identificationModule || {};
  const status = protocol?.statusModule || {};
  const design = protocol?.designModule || {};
  const eligibility = protocol?.eligibilityModule || {};
  const contacts = protocol?.contactsLocationsModule || {};
  const description = protocol?.descriptionModule || {};

  // ─── Extract NCT ID and build URL ─────────────────────────────────
  const nctId = id?.nctId || '';
  const url = nctId ? `https://clinicaltrials.gov/study/${nctId}` : '';

  // ─── Extract lead sponsor / locations ─────────────────────────────
  const locations = (contacts?.locations || [])
    .slice(0, 3)
    .map((loc) => [loc.city, loc.country].filter(Boolean).join(', '))
    .filter(Boolean);

  // ─── Extract central contact info ─────────────────────────────────
  const centralContact = contacts?.centralContacts?.[0] || {};
  const contactInfo = centralContact.name
    ? `${centralContact.name}${centralContact.phone ? ' | ' + centralContact.phone : ''}${centralContact.email ? ' | ' + centralContact.email : ''}`
    : 'Contact information not available';

  // ─── Extract eligibility criteria (plain text) ────────────────────
  const eligibilityCriteria =
    eligibility?.eligibilityCriteria || 'Eligibility criteria not specified';

  return {
    source: 'ClinicalTrials.gov',
    type: 'trial', // Distinguish from publications in the re-ranker
    nctId,
    title: id?.briefTitle || 'Untitled Study',
    status: status?.overallStatus || 'Unknown',
    phase: Array.isArray(design?.phases) ? design.phases.join(', ') : design?.phases || 'N/A',
    briefSummary: description?.briefSummary || 'No summary available',
    eligibilityCriteria: eligibilityCriteria.slice(0, 1000) + (eligibilityCriteria.length > 1000 ? '...' : ''),
    locations: locations.length > 0 ? locations.join(' | ') : 'Location not specified',
    contactInfo,
    url,
    startDate: status?.startDateStruct?.date || 'N/A',
    primaryCompletionDate: status?.primaryCompletionDateStruct?.date || 'N/A',
  };
};

/**
 * Main function: Fetches clinical trials for a given disease and query.
 * Runs two parallel requests: one for RECRUITING trials and one for
 * COMPLETED trials to provide both active and validated evidence.
 * 
 * @param {string} disease - Primary condition (e.g., "Parkinson's disease")
 * @param {string} query - Specific intervention or topic (e.g., "deep brain stimulation")
 * @returns {Array} - Array of parsed trial objects
 */
const fetchClinicalTrials = async (disease, query) => {
  console.log(`🔍 ClinicalTrials: Searching for disease="${disease}", query="${query}"...`);

  /**
   * Helper to call CT.gov API with a given status filter.
   * @param {string} status - e.g., 'RECRUITING', 'COMPLETED'
   */
  const fetchWithStatus = async (status) => {
    try {
      const resp = await axios.get(CT_BASE, {
        params: {
          'query.cond': disease,         // Filter by condition
          'query.intr': query,            // Filter by intervention/topic
          'filter.overallStatus': status,
          pageSize: Math.floor(PAGE_SIZE / 2), // Split budget between statuses
          format: 'json',
          'fields': [                     // Only request the fields we need
            'NCTId', 'BriefTitle', 'OverallStatus', 'Phase',
            'BriefSummary', 'EligibilityCriteria', 'LocationCity',
            'LocationCountry', 'CentralContactName', 'StartDate',
            'PrimaryCompletionDate',
          ].join('|'),
        },
        timeout: 15000,
      });

      const studies = resp.data?.studies || [];
      return studies.map(parseStudy);
    } catch (err) {
      console.error(`ClinicalTrials fetch error (${status}):`, err.message);
      return [];
    }
  };

  // Run RECRUITING and COMPLETED queries in parallel
  const [recruiting, completed] = await Promise.all([
    fetchWithStatus('RECRUITING'),
    fetchWithStatus('COMPLETED'),
  ]);

  const combined = [...recruiting, ...completed];
  console.log(`✅ ClinicalTrials: Found ${combined.length} trials (${recruiting.length} recruiting, ${completed.length} completed).`);
  return combined;
};

module.exports = { fetchClinicalTrials };
