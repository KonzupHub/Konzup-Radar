/**
 * Konzup Radar - Data Service
 * 
 * Integrates with:
 * - Polymarket Gamma API (via proxy) for prediction market probabilities
 * - Google Trends (via Python/pytrends) for search interest data
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

/**
 * Search Polymarket events by query
 */
async function searchPolymarketEvents(query: string): Promise<PolymarketEvent[]> {
  try {
    const response = await axios.get(`${API_BASE}/api/polymarket/events`, {
      params: {
        active: true,
        closed: false,
        limit: 10
      },
      timeout: 15000
    });
    
    // Filter events that match our query
    const events = response.data || [];
    return events.filter((event: PolymarketEvent) => {
      const searchText = `${event.title} ${event.description || ''}`.toLowerCase();
      return query.toLowerCase().split(' ').some(word => searchText.includes(word));
    });
  } catch (error) {
    console.error(`Polymarket search error for "${query}":`, error);
    return [];
  }
}

/**
 * Extract probability from Polymarket event
 * outcomePrices is typically "[0.75, 0.25]" where first is "Yes" probability
 */
function extractProbability(event: PolymarketEvent): number {
  try {
    // Try to get from event directly
    if (event.outcomePrices) {
      const prices = typeof event.outcomePrices === 'string' 
        ? JSON.parse(event.outcomePrices)
        : event.outcomePrices;
      
      if (Array.isArray(prices) && prices.length > 0) {
        return parseFloat(prices[0]) * 100;
      }
    }
    
    // Try to get from first market
    if (event.markets && event.markets.length > 0) {
      const market = event.markets[0];
      if (market.outcomePrices) {
        const prices = typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices;
        
        if (Array.isArray(prices) && prices.length > 0) {
          return parseFloat(prices[0]) * 100;
        }
      }
    }
  } catch (e) {
    console.warn('Error parsing outcome prices:', e);
  }
  
  return 50; // Default fallback
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
// ======================

interface RiskConfig {
  id: string;
  name: string;
  category: 'Custo Aéreo' | 'Geopolítica' | 'Saúde Global';
  riskDescription: string;
  polymarketQueries: string[];
  trendsKeyword: string;
  fallbackProbability: number;
}

const RISK_CONFIGS: RiskConfig[] = [
  {
    id: 'oil-brent-90',
    name: 'Brent Crude > $90/bbl',
    category: 'Custo Aéreo',
    riskDescription: 'Alta do Petróleo (Brent)',
    polymarketQueries: ['oil', 'crude', 'brent', 'petroleum', 'energy prices'],
    trendsKeyword: 'oil prices',
    fallbackProbability: 65
  },
  {
    id: 'us-recession-2026',
    name: 'US Recession Probability',
    category: 'Geopolítica',
    riskDescription: 'Instabilidade nos EUA / Recessão',
    polymarketQueries: ['recession', 'US economy', 'economic downturn', 'GDP'],
    trendsKeyword: 'US recession',
    fallbackProbability: 35
  },
  {
    id: 'global-pandemic-new',
    name: 'New Pandemic Variant Lockdowns',
    category: 'Saúde Global',
    riskDescription: 'Novas Variantes/Pandemia',
    polymarketQueries: ['pandemic', 'covid', 'lockdown', 'health emergency', 'virus'],
    trendsKeyword: 'pandemic travel restrictions',
    fallbackProbability: 15
  }
];

// ======================
// MAIN FETCH FUNCTION
// ======================

/**
 * Fetch all risk metrics from real APIs
 * Falls back to simulated data if APIs fail
 */
export async function fetchRiskMetrics(): Promise<PredictionData> {
  console.log('🔍 Konzup Radar: Fetching risk metrics...');
  
  const metrics: RiskMetric[] = [];
  
  // Process each risk configuration in parallel
  const promises = RISK_CONFIGS.map(async (config) => {
    let probability = config.fallbackProbability;
    let history = generateFallbackHistory(probability, 10);
    let dataSource = 'fallback';
    
    try {
      // 1. Try to fetch Polymarket data
      for (const query of config.polymarketQueries) {
        const events = await searchPolymarketEvents(query);
        if (events.length > 0) {
          probability = extractProbability(events[0]);
          dataSource = 'polymarket';
          console.log(`✅ Polymarket data for ${config.id}: ${probability.toFixed(1)}%`);
          break;
        }
      }
      
      // 2. Try to fetch Google Trends data for history
      const trends = await fetchGoogleTrends(config.trendsKeyword);
      if (trends.history && trends.history.length > 0) {
        history = trends.history;
        if (trends.isReal) {
          dataSource = dataSource === 'polymarket' ? 'polymarket+trends' : 'trends';
          console.log(`✅ Google Trends data for ${config.id}: ${trends.currentIndex}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error fetching data for ${config.id}, using fallback:`, error);
    }
    
    const metric: RiskMetric = {
      id: config.id,
      name: config.name,
      category: config.category,
      riskDescription: config.riskDescription,
      probability: parseFloat(probability.toFixed(1)),
      trend: determineTrend(history),
      volatility: determineVolatility(history),
      history
    };
    
    return metric;
  });
  
  const results = await Promise.all(promises);
  metrics.push(...results);
  
  console.log('📊 Konzup Radar: Metrics fetch complete');
  
  return {
    metrics,
    lastUpdate: new Date().toLocaleTimeString()
  };
}

// Export for backward compatibility
export default { fetchRiskMetrics };
