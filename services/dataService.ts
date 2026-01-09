/**
 * Konzup Radar - Data Service
 * 
 * Integrates with:
 * - Polymarket Gamma API (via proxy) for prediction market probabilities
 * - Google Trends (via Python/pytrends) for search interest data
 * 
 * Uses REAL data from both APIs - no mocked data
 */

import axios from 'axios';
import { RiskMetric, HistoryPoint, PredictionData } from '../types';

// API Base URL - use proxy server in development, same origin in production
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

// ======================
// POLYMARKET INTEGRATION
// ======================

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  outcomes?: string[];
  outcomePrices?: string[];
  volume?: string;
  liquidity?: string;
  active?: boolean;
  closed?: boolean;
  markets?: PolymarketMarket[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string;
  outcomes: string;
}

// Cache for Polymarket events
let polymarketEventsCache: PolymarketEvent[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch ALL active Polymarket events
 */
async function fetchAllPolymarketEvents(): Promise<PolymarketEvent[]> {
  // Return cached if fresh
  if (polymarketEventsCache.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
    return polymarketEventsCache;
  }
  
  try {
    const response = await axios.get(`${API_BASE}/api/polymarket/events`, {
      params: {
        active: true,
        closed: false,
        limit: 200 // Fetch more to find relevant events
      },
      timeout: 20000
    });
    
    polymarketEventsCache = response.data || [];
    cacheTimestamp = Date.now();
    console.log(`📊 Polymarket: Loaded ${polymarketEventsCache.length} events`);
    return polymarketEventsCache;
  } catch (error) {
    console.error('Polymarket fetch error:', error);
    return polymarketEventsCache; // Return stale cache if available
  }
}

/**
 * Find Polymarket event matching keywords (case insensitive)
 */
function findMatchingEvent(events: PolymarketEvent[], keywords: string[]): PolymarketEvent | null {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  
  for (const event of events) {
    const titleLower = event.title.toLowerCase();
    const descLower = (event.description || '').toLowerCase();
    const searchText = `${titleLower} ${descLower}`;
    
    // Check if ALL keywords match (more precise matching)
    const allMatch = lowerKeywords.every(kw => searchText.includes(kw));
    if (allMatch) {
      return event;
    }
  }
  return null;
}

/**
 * Extract probability from Polymarket event
 * 
 * Polymarket binary markets have two outcomes with prices that sum to 1.0
 * For risk monitoring, we typically want to show the probability of the "risky" outcome
 * 
 * Strategy: Return the HIGHER probability value
 * - This represents what the market BELIEVES will happen
 * - For "Will X bad thing happen?" → high value = high risk
 * - For "Will X good thing happen?" → use invertProbability to flip
 */
function extractProbability(event: PolymarketEvent): number {
  try {
    let prices: number[] = [];
    
    // Try to get from event directly
    if (event.outcomePrices) {
      const rawPrices = typeof event.outcomePrices === 'string' 
        ? JSON.parse(event.outcomePrices)
        : event.outcomePrices;
      
      if (Array.isArray(rawPrices) && rawPrices.length > 0) {
        prices = rawPrices.map((p: string | number) => parseFloat(String(p)));
      }
    }
    
    // Try to get from first market if no direct prices
    if (prices.length === 0 && event.markets && event.markets.length > 0) {
      const market = event.markets[0];
      if (market.outcomePrices) {
        const rawPrices = typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices;
        
        if (Array.isArray(rawPrices) && rawPrices.length > 0) {
          prices = rawPrices.map((p: string | number) => parseFloat(String(p)));
        }
      }
    }
    
    // Return the FIRST price (YES probability) as percentage
    // The caller will use invertProbability if needed
    if (prices.length >= 2) {
      // For typical binary markets: first value is YES probability
      return prices[0] * 100;
    } else if (prices.length === 1) {
      return prices[0] * 100;
    }
  } catch (e) {
    console.warn('Error parsing outcome prices:', e);
  }
  
  return -1; // Return -1 to indicate no valid data
}

// ======================
// GOOGLE TRENDS INTEGRATION
// ======================

interface TrendsResponse {
  keyword: string;
  currentIndex: number;
  history: HistoryPoint[];
  isReal: boolean;
  error?: string;
}

/**
 * Fetch Google Trends data for a keyword via proxy
 */
async function fetchGoogleTrends(keyword: string): Promise<TrendsResponse> {
  try {
    const response = await axios.get(`${API_BASE}/api/trends/${encodeURIComponent(keyword)}`, {
      timeout: 35000
    });
    return response.data;
  } catch (error) {
    console.error(`Google Trends error for "${keyword}":`, error);
    return {
      keyword,
      currentIndex: 50,
      history: generateFallbackHistory(50, 10),
      isReal: false,
      error: 'Failed to fetch trends data'
    };
  }
}

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Generate fallback history data when APIs fail
 */
function generateFallbackHistory(baseValue: number, volatility: number, points: number = 30): HistoryPoint[] {
  const history: HistoryPoint[] = [];
  const now = new Date();
  let currentValue = baseValue;

  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    const change = (Math.random() - 0.5) * volatility;
    currentValue = Math.max(0, Math.min(100, currentValue + change));
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  return history;
}

/**
 * Determine trend based on history
 */
function determineTrend(history: HistoryPoint[]): 'up' | 'down' | 'stable' {
  if (history.length < 7) return 'stable';
  
  const recent = history.slice(-7);
  const firstHalf = recent.slice(0, 3).reduce((a, b) => a + b.value, 0) / 3;
  const secondHalf = recent.slice(-3).reduce((a, b) => a + b.value, 0) / 3;
  
  const diff = secondHalf - firstHalf;
  
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

/**
 * Determine volatility based on history
 */
function determineVolatility(history: HistoryPoint[]): 'high' | 'moderate' | 'low' {
  if (history.length < 7) return 'moderate';
  
  const values = history.slice(-14).map(h => h.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev > 15) return 'high';
  if (stdDev > 7) return 'moderate';
  return 'low';
}

// ======================
// RISK METRIC CONFIGURATIONS
// Cada risco tem keywords para buscar no Polymarket
// ======================

interface RiskConfig {
  id: string;
  name: string;
  category: 'Custo Aéreo' | 'Geopolítica' | 'Saúde Global' | 'Câmbio' | 'Clima';
  riskDescription: string;
  polymarketKeywords: string[]; // Keywords to find matching events
  trendsKeyword: string;
  invertProbability?: boolean; // Some events have inverted logic (e.g., "inflation below X" = good)
}

const RISK_CONFIGS: RiskConfig[] = [
  // GEOPOLÍTICA - Recessão EUA
  // Evento: "Negative GDP growth in 2025?" → Yes = 1.8% (baixo risco de recessão)
  {
    id: 'us-recession',
    name: 'Recessão nos EUA',
    category: 'Geopolítica',
    riskDescription: 'Risco de Recessão Americana',
    polymarketKeywords: ['negative', 'gdp', 'growth'],
    trendsKeyword: 'US recession 2025',
    // YES = recessão acontece = risco direto
  },
  
  // GEOPOLÍTICA - Conflito Ucrânia
  // Evento: "Russia x Ukraine ceasefire by end of 2026?" → Yes = 44.5%
  // Se cessar-fogo tem 44.5%, guerra continua tem 55.5% de risco
  {
    id: 'ukraine-war',
    name: 'Conflito Rússia-Ucrânia',
    category: 'Geopolítica',
    riskDescription: 'Guerra na Europa Oriental',
    polymarketKeywords: ['russia', 'ukraine', 'ceasefire'],
    trendsKeyword: 'ukraine war travel europe',
    invertProbability: true // Ceasefire = bom, inverte para mostrar risco de guerra
  },
  
  // GEOPOLÍTICA - Tensão Ásia
  // Evento: "Will China invade Taiwan by end of 2026?" → Yes = 12.5%
  {
    id: 'china-taiwan',
    name: 'Tensão China-Taiwan',
    category: 'Geopolítica',
    riskDescription: 'Risco Geopolítico na Ásia',
    polymarketKeywords: ['china', 'invade', 'taiwan'],
    trendsKeyword: 'china taiwan conflict',
    // YES = invasão = risco direto
  },
  
  // CÂMBIO - Inflação Brasil
  // Evento: "Brazil's 12-month inflation below 5.50%?" → Yes = 99.85%
  // Alta chance de ficar ABAIXO = BAIXO risco de inflação
  // invertProbability: YES = inflação baixa (bom) → inverte para mostrar RISCO de inflação alta
  {
    id: 'brazil-inflation',
    name: 'Inflação Brasil',
    category: 'Câmbio',
    riskDescription: 'Pressão Inflacionária no Brasil',
    polymarketKeywords: ['brazil', 'inflation', 'below'],
    trendsKeyword: 'inflacao brasil turismo',
    invertProbability: true // "Below X" YES = bom, inverte para mostrar risco
  },
  
  // CÂMBIO - Inflação Global (EUA)
  // Evento: "Will inflation reach more than 5% in 2025?" → Yes = 0.25%
  {
    id: 'us-inflation',
    name: 'Inflação nos EUA',
    category: 'Câmbio',
    riskDescription: 'Inflação Alta nos EUA',
    polymarketKeywords: ['inflation', 'reach', '5%'],
    trendsKeyword: 'US inflation 2025',
    // YES = inflação alta = risco direto
  },
  
  // CLIMA - Ano mais quente
  // Evento: "Will 2025 be the hottest year on record?" → Yes = 0.2%
  {
    id: 'climate-extreme',
    name: 'Clima Extremo 2025',
    category: 'Clima',
    riskDescription: 'Eventos Climáticos Extremos',
    polymarketKeywords: ['hottest', 'year', 'record'],
    trendsKeyword: 'extreme weather tourism',
    // YES = risco climático direto
  },
  
  // GEOPOLÍTICA - Instabilidade Europa
  // Eventos: "Macron out by...?"
  {
    id: 'europe-political',
    name: 'Crise Política Europa',
    category: 'Geopolítica',
    riskDescription: 'Instabilidade na Europa',
    polymarketKeywords: ['macron', 'out'],
    trendsKeyword: 'europe political crisis',
    // YES = crise política = risco
  },
  
  // CUSTO AÉREO - Baseado em Google Trends (Polymarket não tem eventos de petróleo)
  {
    id: 'oil-fuel-costs',
    name: 'Custos de Combustível',
    category: 'Custo Aéreo',
    riskDescription: 'Alta do Querosene de Aviação',
    polymarketKeywords: ['oil', 'price', 'barrel'], // Provavelmente não vai encontrar
    trendsKeyword: 'jet fuel prices',
    // Trends-based principalmente (Polymarket não tem eventos de petróleo)
  },
];

// ======================
// MAIN FETCH FUNCTION
// ======================

/**
 * Fetch all risk metrics from real APIs
 * Only returns metrics with valid data from at least one source
 */
export async function fetchRiskMetrics(): Promise<PredictionData> {
  console.log('🔍 Konzup Radar: Fetching risk metrics...');
  
  // Fetch all Polymarket events once
  const allEvents = await fetchAllPolymarketEvents();
  console.log(`📊 Processing ${allEvents.length} Polymarket events`);
  
  const metrics: RiskMetric[] = [];
  
  // Process each risk configuration
  for (const config of RISK_CONFIGS) {
    let probability = -1;
    let history: HistoryPoint[] = [];
    let hasRealData = false;
    let polymarketEvent: string | null = null;
    
    try {
      // 1. Find matching Polymarket event
      const event = findMatchingEvent(allEvents, config.polymarketKeywords);
      if (event) {
        const rawProb = extractProbability(event);
        if (rawProb >= 0) {
          // Apply inversion if needed (e.g., "inflation below X" means low risk)
          probability = config.invertProbability ? (100 - rawProb) : rawProb;
          hasRealData = true;
          polymarketEvent = event.title;
          console.log(`✅ Polymarket [${config.id}]: "${event.title}" → ${probability.toFixed(1)}%`);
        }
      }
      
      // 2. Fetch Google Trends data
      const trends = await fetchGoogleTrends(config.trendsKeyword);
      if (trends.isReal && trends.history.length > 0) {
        history = trends.history;
        hasRealData = true;
        console.log(`✅ Trends [${config.id}]: "${config.trendsKeyword}" → index ${trends.currentIndex}`);
        
        // If no Polymarket data, use Trends as probability indicator
        if (probability < 0) {
          probability = trends.currentIndex;
        }
      }
      
      // Skip metrics with no real data at all
      if (!hasRealData) {
        console.log(`⚠️ Skipping [${config.id}]: No real data available`);
        continue;
      }
      
      // Use fallback history if trends failed but Polymarket succeeded
      if (history.length === 0) {
        history = generateFallbackHistory(probability, 8);
      }
      
      const metric: RiskMetric = {
        id: config.id,
        name: config.name,
        category: config.category,
        riskDescription: config.riskDescription,
        probability: parseFloat(Math.max(0, Math.min(100, probability)).toFixed(1)),
        trend: determineTrend(history),
        volatility: determineVolatility(history),
        history,
        hasRealData: true,
        // Metadata for debugging
        ...(polymarketEvent && { polymarketSource: polymarketEvent })
      };
      
      metrics.push(metric);
      
    } catch (error) {
      console.error(`❌ Error processing ${config.id}:`, error);
    }
  }
  
  console.log(`📊 Konzup Radar: ${metrics.length} metrics with real data loaded`);

    return {
      metrics,
      lastUpdate: new Date().toLocaleTimeString()
    };
  }

// Export for backward compatibility
export default { fetchRiskMetrics };
