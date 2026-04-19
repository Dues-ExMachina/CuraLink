/**
 * ─────────────────────────────────────────────────────────────────
 * PubMed Retrieval Service
 * ─────────────────────────────────────────────────────────────────
 * Fetches medical publications from NCBI's PubMed database.
 * 
 * PIPELINE:
 *   Step 1 - esearch: Get a list of matching article IDs
 *   Step 2 - efetch: Fetch full article details (XML → parsed)
 * 
 * STRATEGY: Retrieves up to 80 articles for broad coverage,
 * then passes them to the re-ranking layer for selection.
 */

const axios = require('axios');
const xml2js = require('xml2js');

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const BATCH_SIZE = 80; // Broad retrieval — re-ranker will narrow to top 6-8

/**
 * Parses the XML response from PubMed efetch into clean article objects.
 * @param {string} xmlData - Raw XML string from NCBI
 * @returns {Array} - Parsed article objects
 */
const parseArticlesFromXML = async (xmlData) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(xmlData);

    const articles = result?.PubmedArticleSet?.PubmedArticle;
    if (!articles) return [];

    // Handle both single article (object) and multiple articles (array)
    const articleArray = Array.isArray(articles) ? articles : [articles];

    return articleArray.map((item) => {
      const medline = item?.MedlineCitation;
      const article = medline?.Article;
      const pmid = medline?.PMID;

      // ─── Extract title ────────────────────────────────────────────
      const title =
        typeof article?.ArticleTitle === 'string'
          ? article.ArticleTitle
          : article?.ArticleTitle?._ || 'No title available';

      // ─── Extract abstract (may be structured with multiple sections) ──
      const abstractNode = article?.Abstract?.AbstractText;
      let abstract = 'No abstract available';
      if (typeof abstractNode === 'string') {
        abstract = abstractNode;
      } else if (Array.isArray(abstractNode)) {
        abstract = abstractNode.map((a) => (typeof a === 'string' ? a : a._ || '')).join(' ');
      } else if (abstractNode?._) {
        abstract = abstractNode._;
      }

      // ─── Extract authors (Last + First format) ────────────────────
      const authorList = article?.AuthorList?.Author;
      let authors = 'Unknown';
      if (authorList) {
        const authArray = Array.isArray(authorList) ? authorList : [authorList];
        authors = authArray
          .slice(0, 4) // Limit to first 4 authors
          .map((a) => `${a.LastName || ''} ${a.ForeName || ''}`.trim())
          .filter(Boolean)
          .join(', ');
        if (authArray.length > 4) authors += ' et al.';
      }

      // ─── Extract publication year ──────────────────────────────────
      const pubYear =
        article?.Journal?.JournalIssue?.PubDate?.Year ||
        article?.Journal?.JournalIssue?.PubDate?.MedlineDate?.substring(0, 4) ||
        'N/A';

      // ─── Build PubMed article URL ──────────────────────────────────
      const articleId = typeof pmid === 'string' ? pmid : pmid?._ || '';
      const url = articleId ? `https://pubmed.ncbi.nlm.nih.gov/${articleId}/` : '';

      return {
        source: 'PubMed',
        title,
        abstract,
        authors,
        year: pubYear,
        url,
        pmid: articleId,
      };
    });
  } catch (err) {
    console.error('PubMed XML parse error:', err.message);
    return [];
  }
};

/**
 * Main function: Searches PubMed for articles matching the query.
 * @param {string} query - Expanded search query (e.g., "Parkinson's disease deep brain stimulation")
 * @returns {Array} - Array of parsed article objects
 */
const fetchPubMedArticles = async (query) => {
  try {
    console.log(`🔍 PubMed: Searching for "${query}"...`);

    // ─── Step 1: Get Article IDs via esearch ──────────────────────────
    const searchUrl = `${PUBMED_BASE}/esearch.fcgi`;
    const searchParams = {
      db: 'pubmed',
      term: query,
      retmax: BATCH_SIZE,
      sort: 'pub date',  // Sort by most recent first
      retmode: 'json',
      ...(process.env.PUBMED_API_KEY && { api_key: process.env.PUBMED_API_KEY }),
    };

    const searchResp = await axios.get(searchUrl, { params: searchParams, timeout: 15000 });
    const idList = searchResp.data?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      console.log('PubMed: No results found.');
      return [];
    }

    console.log(`PubMed: Found ${idList.length} IDs, fetching details...`);

    // ─── Step 2: Fetch Full Details via efetch ────────────────────────
    const fetchUrl = `${PUBMED_BASE}/efetch.fcgi`;
    const fetchParams = {
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'xml',
      ...(process.env.PUBMED_API_KEY && { api_key: process.env.PUBMED_API_KEY }),
    };

    const fetchResp = await axios.get(fetchUrl, { params: fetchParams, timeout: 30000 });
    const articles = await parseArticlesFromXML(fetchResp.data);

    console.log(`✅ PubMed: Parsed ${articles.length} articles.`);
    return articles;
  } catch (err) {
    console.error('PubMed fetch error:', err.message);
    return []; // Return empty on failure — other sources still run
  }
};

module.exports = { fetchPubMedArticles };
