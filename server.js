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
 */
function runPythonScript(scriptPath, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', [scriptPath, ...args], {
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
    
    // Return mock data on error
    const mockData = {
      keyword: sanitizedKeyword,
      currentIndex: 50 + Math.floor(Math.random() * 30),
      history: generateMockHistory(50, 10),
      isReal: false,
      error: error.message
    };
    
    res.json(mockData);
  }
});

/**
 * Generate mock history data for fallback
 */
function generateMockHistory(baseValue, volatility, days = 30) {
  const history = [];
  let currentValue = baseValue;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const change = (Math.random() - 0.5) * volatility;
    currentValue = Math.max(0, Math.min(100, currentValue + change));
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  
  return history;
}

// ======================
// HEALTH CHECK
// ======================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      polymarket: 'available',
      googleTrends: 'available'
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
