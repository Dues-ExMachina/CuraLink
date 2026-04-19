/**
 * ─────────────────────────────────────────────────────────────────
 * Re-Ranking Service (Neural Upgrade)
 * ─────────────────────────────────────────────────────────────────
 * Narrows a large pool of retrieved documents down using a 2-stage
 * retrieval pipeline:
 *   Stage 1: Keyword/Heuristic Scoring (Recency, Citations, BM25-style)
 *   Stage 2: Neural Cross-Encoder Scoring (BGE-Reranker-v2-m3)
 */

const natural = require('natural');
const axios = require('axios');

/* 
// ─── LOCAL AI RUN (Commented out for Free Server Deployment) ───
// const { pipeline, env } = require('@huggingface/transformers');
// env.backends.onnx.wasm.numThreads = 1;
// let hfReranker = null;
// const getReranker = async () => {
//   if (!hfReranker) {
//     console.log("⏳ Initializing BGE-Reranker-v2-m3 (q4 quantization)...");
//     hfReranker = await pipeline('text-classification', 'onnx-community/bge-reranker-v2-m3-ONNX', { dtype: 'q4' });
//     console.log("✅ BGE-Reranker loaded successfully!");
//   }
//   return hfReranker;
// };
*/

// (Local init logic is now moved to the comment block above)

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const CURRENT_YEAR = new Date().getFullYear();

const WEIGHTS = {
  relevance: 0.40,
  recency: 0.30,
  credibility: 0.20,
  citation: 0.10,
};

const SOURCE_CREDIBILITY = {
  PubMed: 1.0,
  OpenAlex: 0.85,
  'ClinicalTrials.gov': 0.90,
};

const computeRelevanceScore = (doc, queryTokens) => {
  if (queryTokens.length === 0) return 0.5;
  const docText = `${doc.title || ''} ${doc.abstract || doc.briefSummary || ''} ${doc.locations || ''}`.toLowerCase();
  const docTokens = new Set(tokenizer.tokenize(docText).map((t) => stemmer.stem(t)));
  let matches = 0;
  for (const qt of queryTokens) {
    if (docTokens.has(qt)) matches++;
  }
  return matches / queryTokens.length;
};

const computeRecencyScore = (year) => {
  const numYear = parseInt(year, 10);
  if (isNaN(numYear)) return 0.3;
  const agePenalty = (CURRENT_YEAR - numYear) * 0.05;
  return Math.max(0.1, 1.0 - agePenalty);
};

const computeCitationScore = (count, maxCount) => {
  if (!count || maxCount === 0) return 0;
  return Math.log(count + 1) / Math.log(maxCount + 1);
};

const rerankDocuments = async (publications, trials, publicationQuery, topPublications = 6, topTrials = 4, userLocation = '') => {
  console.log(`📊 Stage 1: Heuristic filtering of ${publications.length} publications and ${trials.length} trials...`);

  let tokens = tokenizer.tokenize((publicationQuery + ' ' + (userLocation || '')).toLowerCase());
  const queryTokens = tokens.map((t) => stemmer.stem(t)).filter((t) => t.length > 2);
  const maxCitations = Math.max(...publications.map((p) => p.citationCount || 0), 1);

  const scoreDoc = (doc) => {
    const year = doc.year || doc.startDate?.substring(0, 4) || 'N/A';
    return (
      computeRelevanceScore(doc, queryTokens) * WEIGHTS.relevance +
      computeRecencyScore(year) * WEIGHTS.recency +
      (SOURCE_CREDIBILITY[doc.source] || 0.7) * WEIGHTS.credibility +
      computeCitationScore(doc.citationCount || 0, maxCitations) * WEIGHTS.citation
    );
  };

  // Stage 1 filter to top 20 pubs, 10 trials
  const candidatePubs = publications
    .filter((p) => p.title && p.title !== 'Untitled')
    .map((p) => ({ ...p, _stage1Score: scoreDoc(p) }))
    .sort((a, b) => b._stage1Score - a._stage1Score)
    .slice(0, 20);

  const candidateTrials = trials
    .map((t) => ({ ...t, _stage1Score: scoreDoc(t) * (t.status === 'RECRUITING' ? 1.2 : 1.0) }))
    .sort((a, b) => b._stage1Score - a._stage1Score)
    .slice(0, 10);

  console.log(`🧠 Stage 2: Neural scoring (bge-reranker) on ${candidatePubs.length} publications and ${candidateTrials.length} trials...`);
  
  try {
    // const reranker = await getReranker(); // Local run
    
    // Helper to score a batch using HF Inference API
    const scoreWithBge = async (docs) => {
      if (docs.length === 0) return [];
      
      const mapped = [];
      for (const doc of docs) {
        const docText = `${doc.title || ''} ${doc.abstract || doc.briefSummary || ''}`.substring(0, 1200);
        try {
           /* 
           // ─── LOCAL AI RUN ───
           // const res = await reranker({ text: publicationQuery, text_pair: docText });
           // const score = Array.isArray(res) ? res[0]?.score : res?.score; 
           */

           // ─── CLOUD API RUN ───
           const res = await axios.post(
             'https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3',
             { inputs: { text: publicationQuery, text_pair: docText } },
             {
               headers: {
                 'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                 'Content-Type': 'application/json'
               },
               timeout: 30000
             }
           );
           
           // HF Free API might return an array of objects like [{label: 'LABEL_1', score: 0.99}, ...]
           // Wait, bge-reranker classification returns float score or array. We take the score from the response.
           
           let score = doc._stage1Score;
           if (Array.isArray(res.data) && res.data.length > 0) {
              const data = res.data[0];
              if (data && data.score !== undefined) {
                 score = data.score;
              } else if (res.data.length === 1 && typeof res.data[0] === 'number') {
                 score = res.data[0];
              }
           } else if (res.data && res.data.score !== undefined) {
              score = res.data.score;
           }
           
           mapped.push({ ...doc, _score: score });
        } catch(e) {
           console.error("BGE Scoring failed for doc via API", e.response?.data || e.message);
           mapped.push({ ...doc, _score: doc._stage1Score });
        }
      }
      return mapped;
    };

    const finalPubs = await scoreWithBge(candidatePubs);
    const finalTrials = await scoreWithBge(candidateTrials);

    // Sort by new neural score
    finalPubs.sort((a, b) => b._score - a._score);
    finalTrials.sort((a, b) => b._score - a._score);

    console.log(`✅ Neural Re-ranking complete.`);
    return {
      publications: finalPubs.slice(0, topPublications),
      trials: finalTrials.slice(0, topTrials),
    };
  } catch (err) {
    console.error("⚠️ Neural reranking pipeline error. Falling back to Stage 1 scores.", err.message);
    return {
      publications: candidatePubs.slice(0, topPublications),
      trials: candidateTrials.slice(0, topTrials),
    };
  }
};

module.exports = { rerankDocuments };
