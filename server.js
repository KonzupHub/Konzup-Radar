/**
 * Konzup Radar - Backend Proxy Server
 * 
 * This Express server handles:
 * 1. Proxy requests to Polymarket API (avoiding CORS)
 * 2. Execute Python script for Google Trends data
 * 3. Serve static files in production
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory cache for Google Trends (avoid rate limiting)
const trendsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ======================
// POLYMARKET API PROXY
// ======================

/**
 * GET /api/polymarket/events
 * Proxy to Polymarket Gamma API
 */
app.get('/api/polymarket/events', async (req, res) => {
  try {
    const response = await axios.get('https://gamma-api.polymarket.com/events', {
      params: req.query,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KonzupRadar/1.0'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Polymarket API Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from Polymarket',
      message: error.message
    });
  }
});

/**
 * GET /api/polymarket/markets
 * Proxy to Polymarket Markets endpoint
 */
app.get('/api/polymarket/markets', async (req, res) => {
  try {
    const response = await axios.get('https://gamma-api.polymarket.com/markets', {
      params: req.query,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KonzupRadar/1.0'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Polymarket Markets API Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch markets from Polymarket',
      message: error.message
    });
  }
});

/**
 * GET /api/polymarket/search/:query
 * Search Polymarket events by keyword
 */
app.get('/api/polymarket/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const response = await axios.get('https://gamma-api.polymarket.com/events', {
      params: {
        ...req.query,
        title_contains: query,
        active: true,
        closed: false
      },
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KonzupRadar/1.0'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Polymarket Search Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to search Polymarket',
      message: error.message
    });
  }
});

// ======================
// GOOGLE TRENDS API
// ======================

/**
 * Execute Python script safely using spawn (prevents command injection)
 * Uses venv Python if available, otherwise falls back to system python3
 */
function runPythonScript(scriptPath, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    // Try venv Python first, fallback to system python3
    const venvPython = path.join(__dirname, 'venv', 'bin', 'python');
    const pythonCmd = require('fs').existsSync(venvPython) ? venvPython : 'python3';
    
    const process = spawn(pythonCmd, [scriptPath, ...args], {
      timeout,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
    
    // Timeout handling
    setTimeout(() => {
      process.kill();
      reject(new Error('Process timed out'));
    }, timeout);
  });
}

/**
 * GET /api/trends/:keyword
 * Execute Python script to fetch Google Trends data
 * Uses spawn with array arguments to prevent command injection
 */
app.get('/api/trends/:keyword', async (req, res) => {
  const { keyword } = req.params;
  
  // Sanitize keyword - allow only alphanumeric, spaces, and common punctuation
  const sanitizedKeyword = keyword.replace(/[^\w\s\-.,]/g, '').substring(0, 100);
  const cacheKey = sanitizedKeyword.toLowerCase();
  
  // Check cache first
  const cached = trendsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ ...cached.data, fromCache: true });
  }
  
  try {
    const scriptPath = path.join(__dirname, 'scripts', 'googleTrends.py');
    
    // Use spawn with array of arguments (safe from command injection)
    const { stdout, stderr } = await runPythonScript(scriptPath, [sanitizedKeyword]);
    
    if (stderr) {
      console.warn('Python stderr:', stderr);
    }
    
    const result = JSON.parse(stdout);
    
    // Cache the result
    trendsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    res.json(result);
  } catch (error) {
    console.error('Google Trends Error:', error.message);
    
    // Return isReal: false with empty history (NO MOCK DATA)
    // Card will be hidden in frontend if no real data available
    res.json({
      keyword: sanitizedKeyword,
      currentIndex: -1,
      history: [],
      isReal: false,
      error: error.message
    });
  }
});

// ======================
// GEMINI AI INSIGHTS
// ======================

/**
 * POST /api/gemini/insight
 * Generate AI insight for a risk metric using Gemini
 */
app.post('/api/gemini/insight', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured');
    return res.status(503).json({
      error: 'AI service not configured',
      insight: null
    });
  }
  
  const { metric, lang = 'pt' } = req.body;
  
  if (!metric) {
    return res.status(400).json({ error: 'Metric data required' });
  }
  
  const langNames = { pt: 'Português', en: 'English', es: 'Español' };
  
  const prompt = `
    Aja como o Konzup Radar, um consultor de inteligência preditiva para o mercado de turismo. 
    DATA: Janeiro de 2026.
    IDIOMA DA RESPOSTA: ${langNames[lang] || 'Português'}.
    RISCO: ${metric.riskDescription}
    MÉTRICA ATUAL: ${metric.probability}% de probabilidade.
    TENDÊNCIA: ${metric.trend}.
    VOLATILIDADE: ${metric.volatility}.

    Forneça um "Insight Konzup": uma frase única, curta, executiva e de alto impacto para CEOs de turismo sobre a perspectiva e o impacto desse risco nas operações. 
    Responda obrigatoriamente em ${langNames[lang] || 'Português'}.
    Seja direto e use um tom sério de terminal financeiro.
    IMPORTANTE: Apresente como uma análise de probabilidade, não como um fato consumado.
    NÃO use formatação markdown como asteriscos (**). Nunca use negrito.
    Responda APENAS com o insight, sem prefixos ou explicações.
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 200
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanText = text?.trim().replace(/\*\*/g, '').replace(/\*/g, '') || null;
    
    res.json({ insight: cleanText });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate insight',
      insight: null
    });
  }
});

// ======================
// HEALTH CHECK
// ======================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      polymarket: 'available',
      googleTrends: 'available',
      gemini: process.env.GEMINI_API_KEY ? 'available' : 'not configured'
    }
  });
});

// ======================
// PRODUCTION: Serve static files
// ======================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Express 5 requires named wildcard parameter
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║       KONZUP RADAR - Backend Server              ║
╠══════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                  ║
║  📊 Polymarket API: /api/polymarket/*            ║
║  📈 Google Trends:  /api/trends/:keyword         ║
║  ❤️  Health check:  /api/health                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
