/**
 * ─────────────────────────────────────────────────────────────────
 * CuraLink Backend - Main Application Entry Point
 * ─────────────────────────────────────────────────────────────────
 * Sets up Express server, connects to MongoDB, and mounts all routes.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const axios = require('axios'); // For wake up pings

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for research data

// ─── Routes ────────────────────────────────────────────────────────
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/chat', require('./routes/chat'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CuraLink API is running' });
});

// ─── Wake Up Models ────────────────────────────────────────────────
app.get('/api/health/wake', async (req, res) => {
  console.log("⏰ Waking up AI models...");
  try {
    // Fire and forget pings to HF Inference API to load them into free tier memory
    const hfAuth = { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } };

    // Ping LLM
    const llmId = process.env.HF_MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.3';
    axios.post(
      'https://router.huggingface.co/hf-inference/v1/chat/completions',
      { model: llmId, messages: [{ role: 'user', content: 'wake up' }], max_tokens: 1 },
      hfAuth
    ).catch(() => {});

    // Ping Reranker
    axios.post(
      'https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3',
      { inputs: { text: "wake", text_pair: "up" } },
      hfAuth
    ).catch(() => {});

    res.json({ status: 'waking', message: 'Pinged AI models successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to wake models.' });
  }
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ──────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ CuraLink server running on http://localhost:${PORT}`);
  });
};

startServer();
