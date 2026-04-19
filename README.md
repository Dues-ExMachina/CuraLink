# CuraLink — AI Medical Research Assistant
## MERN Stack + Open-Source LLM (Hugging Face)

---

## 🏗️ Project Structure

```
Humanity Founders(Curalink)/
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── models/Session.js # Patient session schema
│   │   ├── routes/
│   │   │   ├── sessions.js   # Session CRUD
│   │   │   └── chat.js       # Main AI pipeline endpoint
│   │   ├── services/
│   │   │   ├── llmService.js           # HF Inference API wrapper
│   │   │   ├── queryExpansion.js       # Step 1: LLM query expansion
│   │   │   ├── pubmedService.js        # PubMed retrieval
│   │   │   ├── openAlexService.js      # OpenAlex retrieval
│   │   │   ├── clinicalTrialsService.js # ClinicalTrials.gov retrieval
│   │   │   ├── retrievalOrchestrator.js # Parallel retrieval coordinator
│   │   │   ├── reranker.js             # Step 3: Ranking pipeline
│   │   │   └── synthesizer.js          # Step 4: LLM synthesis
│   │   └── index.js          # Express app entry point
│   ├── .env                  # 🔑 Fill in your credentials!
│   └── package.json
│
└── frontend/                 # React + Vite app
    ├── src/
    │   ├── components/
    │   │   ├── ChatInput.jsx
    │   │   ├── ClinicalTrialCard.jsx
    │   │   ├── MessageBubble.jsx
    │   │   ├── SourceCard.jsx
    │   │   ├── TypingIndicator.jsx
    │   │   └── UserContextPanel.jsx
    │   ├── context/SessionContext.jsx
    │   ├── lib/utils.js
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   └── ChatPage.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Configure Backend Credentials

Edit `backend/.env` and fill in:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/curalink
HF_API_KEY=hf_xxxxxxxxxxxx          # Get from huggingface.co/settings/tokens
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.3
```

### 2. Get a Hugging Face API Key

1. Sign up at [huggingface.co](https://huggingface.co)
2. Go to **Settings → Access Tokens**
3. Create a token with **Read** permissions
4. Paste it as `HF_API_KEY` in `backend/.env`

### 3. Get a MongoDB URI

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com) (free tier)
2. Create a cluster → Connect → Drivers
3. Copy the connection string and paste as `MONGODB_URI`

---

## 🚀 Running the App

### Terminal 1 — Backend
```bash
cd backend
npm run dev
```

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```

Then open: [http://localhost:5173](http://localhost:5173)

---

## 🧠 AI Pipeline Flow

```
User Message
    │
    ▼
[1] Query Expansion (LLM)
    "deep brain stimulation" → "deep brain stimulation Parkinson's disease treatment"
    │
    ▼
[2] Parallel Data Retrieval
    ├── PubMed API (80 articles)
    ├── OpenAlex API (100 articles — relevance + recency)
    └── ClinicalTrials.gov (50 trials — recruiting + completed)
    │
    ▼
[3] Re-Ranking
    Keywords × Recency × Source Credibility × Citations
    → Top 6 publications + Top 4 trials
    │
    ▼
[4] LLM Synthesis (Mistral-7B)
    Structured response: Overview / Insights / Trials / Sources / Personalized Note
    │
    ▼
Structured Markdown Response → Rendered in UI
```

---

## 🔑 Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| LLM | Hugging Face Inference API | No local GPU needed, open-source models |
| Re-ranking | Keyword TF-IDF + Recency + Credibility | Fast, transparent, no extra embedding cost |
| Retrieval breadth | 80 PubMed + 100 OpenAlex + 50 Trials | Deep-first, then precision via re-ranker |
| Context storage | MongoDB (`Session.messages`) | Enables multi-turn follow-up awareness |
| API failure handling | `Promise.allSettled()` | One source failure doesn't kill the response |
