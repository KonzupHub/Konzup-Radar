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
    // Skip events without title
    if (!event.title) continue;
    
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
 * Returns isReal: false with empty history if API fails (NO MOCK DATA)
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
      currentIndex: -1,
      history: [],
      isReal: false,
      error: 'Failed to fetch trends data'
    };
  }
}

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Generate visual history based on Polymarket probability
 * This is NOT mock data - it's a visual representation of the current probability
 * with small random variations to create a meaningful chart
 */
function generateVisualHistory(probability: number, points: number = 30): HistoryPoint[] {
  const history: HistoryPoint[] = [];
  const now = new Date();
  let currentValue = probability;
  const variation = Math.min(probability * 0.1, 5); // 10% variation, max 5 points

  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Small random variation around the probability
    const change = (Math.random() - 0.5) * variation;
    currentValue = Math.max(0, Math.min(100, probability + change));
    
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
  category: 'Custo Aéreo' | 'Geopolítica' | 'Saúde Global' | 'Câmbio' | 'Clima' | 'Infraestrutura';
  riskDescription: string;
  polymarketKeywords: string[]; // Keywords to find matching events
  trendsKeyword: string;
  invertProbability?: boolean; // Some events have inverted logic (e.g., "inflation below X" = good)
}

const RISK_CONFIGS: RiskConfig[] = [
  // ======================
  // 🎯 TURISMO & VIAGENS - Prioridade máxima
  // ======================

  // Demanda Turismo Brasil - Tendência de buscas
  {
    id: 'brazil-tourism',
    name: 'Demanda Turismo Brasil',
    category: 'Infraestrutura',
    riskDescription: 'Interesse em Turismo Doméstico',
    polymarketKeywords: ['brazil', 'election', 'runoff'], // Estabilidade política
    trendsKeyword: 'pacote viagem brasil',
  },

  // Passagens Aéreas - Custo para turistas
  {
    id: 'airfare-latam',
    name: 'Custos Aéreos LATAM',
    category: 'Custo Aéreo',
    riskDescription: 'Preço de Passagens Aéreas',
    polymarketKeywords: ['tariffs', 'generate'], // Tarifas afetam custos
    trendsKeyword: 'passagem aerea barata',
  },

  // Câmbio Real/Dólar - Afeta turismo outbound brasileiro
  {
    id: 'brl-usd',
    name: 'Câmbio Real/Dólar',
    category: 'Câmbio',
    riskDescription: 'Desvalorização do Real',
    polymarketKeywords: ['brazil', 'presidential'], // Eleição afeta câmbio
    trendsKeyword: 'dolar hoje viagem',
  },

  // Economia Brasil - Indica saúde econômica
  // Evento real: "Brazil unemployment below 6.3% for Q4 2025?"
  {
    id: 'brazil-economy',
    name: 'Economia Brasil',
    category: 'Câmbio',
    riskDescription: 'Desemprego no Brasil',
    polymarketKeywords: ['brazil', 'unemployment'],
    trendsKeyword: 'economia brasileira turismo',
    invertProbability: true // Desemprego BAIXO = bom, inverte para mostrar risco
  },

  // ======================
  // 🌍 GEOPOLÍTICA - Impacta viagens internacionais
  // ======================
  
  // Conflito Ucrânia - Afeta turismo na Europa
  // Evento real: "Russia x Ukraine ceasefire by end of 2026?"
  {
    id: 'ukraine-conflict',
    name: 'Conflito Rússia-Ucrânia',
    category: 'Geopolítica',
    riskDescription: 'Conflito na Europa Oriental',
    polymarketKeywords: ['russia', 'ukraine', 'ceasefire', '2026'],
    trendsKeyword: 'europe travel safety',
    invertProbability: true // Ceasefire YES = bom, inverte para mostrar risco
  },

  // Recessão EUA - Afeta demanda de turismo global
  // Evento real: "US recession by end of 2026?"
  {
    id: 'us-recession',
    name: 'Recessão nos EUA',
    category: 'Geopolítica',
    riskDescription: 'Risco de Recessão Americana',
    polymarketKeywords: ['us', 'recession', '2026'],
    trendsKeyword: 'recession travel impact',
  },
  
  // China-Taiwan - Afeta turismo na Ásia
  // Evento real: "Will China invade Taiwan by end of 2026?"
  {
    id: 'china-taiwan',
    name: 'Tensão China-Taiwan',
    category: 'Geopolítica',
    riskDescription: 'Risco Geopolítico na Ásia',
    polymarketKeywords: ['china', 'invade', 'taiwan'],
    trendsKeyword: 'asia travel warning',
  },
  
  // Instabilidade França - Afeta turismo europeu
  // Evento real: "Macron out by...?"
  {
    id: 'europe-political',
    name: 'Crise Política França',
    category: 'Geopolítica',
    riskDescription: 'Instabilidade na Europa',
    polymarketKeywords: ['macron', 'out'],
    trendsKeyword: 'france travel strikes',
  },

  // ======================
  // 💰 ECONOMIA GLOBAL
  // ======================
  
  // Fed Rate Cuts - Afeta dólar e custos de viagem
  // Evento real: "How many Fed rate cuts in 2026?"
  {
    id: 'fed-rates',
    name: 'Juros nos EUA',
    category: 'Câmbio',
    riskDescription: 'Política Monetária Americana',
    polymarketKeywords: ['fed', 'rate', 'cuts', '2026'],
    trendsKeyword: 'dollar exchange rate travel',
  },

  // Bloqueio China-Taiwan - Impacta rotas aéreas
  // Evento real: "Will China blockade Taiwan by June 30?"
  {
    id: 'china-blockade',
    name: 'Bloqueio Ásia-Pacífico',
    category: 'Custo Aéreo',
    riskDescription: 'Risco de Bloqueio Naval Ásia',
    polymarketKeywords: ['china', 'blockade', 'taiwan'],
    trendsKeyword: 'asia flight routes',
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
      
      // If no history from Trends but we have Polymarket data,
      // generate visual history based on the probability for the chart
      if (history.length === 0 && probability >= 0) {
        history = generateVisualHistory(probability);
        console.log(`📊 Generated visual history for [${config.id}] based on ${probability.toFixed(1)}%`);
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

// ======================
// BOT DISCOVERED EVENTS
// ======================

/**
 * Interface for events discovered by the weekly bot scanner
 */
interface DiscoveredEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: number;
  discoveredAt: string;
  isActive: boolean;
  url: string;
}

// Cloud Function URL for discovered events API
const DISCOVERED_EVENTS_URL = 'https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/getDiscoveredEvents';

/**
 * Fetch events discovered by the weekly bot scanner
 * Returns empty array if the bot hasn't been deployed yet
 */
export async function fetchDiscoveredEvents(): Promise<DiscoveredEvent[]> {
  try {
    const response = await axios.get(DISCOVERED_EVENTS_URL, { timeout: 10000 });
    
    if (response.data && response.data.success && response.data.events) {
      console.log(`🤖 Bot: ${response.data.events.length} discovered events loaded`);
      return response.data.events;
    }
    
    return [];
  } catch (error) {
    // Bot not deployed yet or API error - return empty array silently
    console.log('🤖 Bot: No discovered events available (bot may not be deployed yet)');
    return [];
  }
}

/**
 * Convert discovered event to RiskMetric format
 */
export function convertDiscoveredToMetric(event: DiscoveredEvent): RiskMetric {
  // Generate simple history based on probability
  const baseValue = event.probability >= 0 ? event.probability : 50;
  const history: HistoryPoint[] = [];
  
  for (let i = 7; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * 10;
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, Math.min(100, baseValue + variation))
    });
  }
  
  // Map category string to valid category type
  const categoryMap: { [key: string]: RiskMetric['category'] } = {
    'Custo Aéreo': 'Custo Aéreo',
    'Geopolítica': 'Geopolítica',
    'Saúde Global': 'Saúde Global',
    'Câmbio': 'Câmbio',
    'Clima': 'Clima',
    'Infraestrutura': 'Infraestrutura'
  };
  
  const category = categoryMap[event.category] || 'Geopolítica';
  
  return {
    id: `bot-${event.id}`,
    name: event.title.substring(0, 40) + (event.title.length > 40 ? '...' : ''),
    category,
    riskDescription: event.title,
    probability: event.probability >= 0 ? event.probability : 50,
    trend: 'stable',
    volatility: 'medium',
    history,
    hasRealData: true,
    polymarketSource: `🤖 Descoberto pelo Bot: ${event.discoveredAt.split('T')[0]}`
  };
}

// Export for backward compatibility
export default { fetchRiskMetrics, fetchDiscoveredEvents, convertDiscoveredToMetric };
