/**
 * 🤖 Konzup Radar - Bot Scanner Semanal
 * 
 * Este bot roda 1x por semana via Cloud Scheduler
 * Busca novos eventos no Polymarket relacionados a turismo/viagens
 * Salva descobertas no Firestore para exibição dinâmica
 * 
 * @author Konzup Hub
 * @version 1.0.0
 */

const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');

// Inicializa Firestore
const firestore = new Firestore();
const COLLECTION_NAME = 'discovered-events';

// ======================
// CONFIGURAÇÃO DE BUSCA
// ======================

// Palavras-chave para detectar eventos relevantes para turismo
const TOURISM_KEYWORDS = [
  // Turismo direto
  'travel', 'tourism', 'tourist', 'vacation', 'holiday',
  'airline', 'aviation', 'flight', 'airport',
  'hotel', 'hospitality', 'airbnb',
  
  // Países/regiões de interesse
  'brazil', 'brasil', 'latin america', 'latam',
  'europe', 'asia', 'caribbean',
  
  // Economia que afeta turismo
  'recession', 'inflation', 'unemployment',
  'oil price', 'fuel', 'tariff',
  
  // Geopolítica que afeta viagens
  'war', 'conflict', 'ceasefire', 'invasion',
  'sanctions', 'border', 'visa',
  
  // Clima e eventos
  'hurricane', 'earthquake', 'pandemic', 'outbreak',
  'climate', 'extreme weather'
];

// Categorias para classificação automática
const CATEGORY_RULES = {
  'Custo Aéreo': ['airline', 'aviation', 'flight', 'airport', 'fuel', 'oil'],
  'Geopolítica': ['war', 'conflict', 'invasion', 'sanctions', 'ceasefire', 'election'],
  'Saúde Global': ['pandemic', 'outbreak', 'disease', 'health', 'covid', 'virus'],
  'Câmbio': ['currency', 'dollar', 'real', 'inflation', 'recession', 'economy'],
  'Clima': ['hurricane', 'earthquake', 'climate', 'weather', 'flood', 'drought'],
  'Infraestrutura': ['tourism', 'travel', 'hotel', 'hospitality', 'airport']
};

// ======================
// FUNÇÕES AUXILIARES
// ======================

/**
 * Busca todos os eventos do Polymarket
 */
async function fetchPolymarketEvents() {
  const events = [];
  let cursor = null;
  const maxPages = 10; // Limita a 10 páginas para não sobrecarregar
  
  for (let page = 0; page < maxPages; page++) {
    try {
      const url = cursor 
        ? `https://gamma-api.polymarket.com/events?closed=false&limit=100&next_cursor=${cursor}`
        : 'https://gamma-api.polymarket.com/events?closed=false&limit=100';
      
      const response = await axios.get(url, { timeout: 30000 });
      
      if (response.data && Array.isArray(response.data)) {
        events.push(...response.data);
        
        // Verifica se há mais páginas
        if (response.data.length < 100) break;
        
        // Pega o cursor para próxima página
        const lastEvent = response.data[response.data.length - 1];
        cursor = lastEvent?.id;
        if (!cursor) break;
      } else {
        break;
      }
    } catch (error) {
      console.error(`Erro na página ${page}:`, error.message);
      break;
    }
  }
  
  return events;
}

/**
 * Verifica se um evento é relevante para turismo
 */
function isRelevantEvent(event) {
  if (!event || !event.title) return false;
  
  const searchText = `${event.title} ${event.description || ''}`.toLowerCase();
  
  // Verifica se contém alguma keyword de turismo
  return TOURISM_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
}

/**
 * Classifica a categoria do evento
 */
function categorizeEvent(event) {
  const searchText = `${event.title} ${event.description || ''}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some(kw => searchText.includes(kw))) {
      return category;
    }
  }
  
  return 'Geopolítica'; // Categoria padrão
}

/**
 * Extrai probabilidade do evento
 */
function extractProbability(event) {
  if (event.markets && event.markets.length > 0) {
    const market = event.markets[0];
    if (market.outcomePrices) {
      try {
        const prices = JSON.parse(market.outcomePrices);
        if (Array.isArray(prices) && prices.length > 0) {
          return parseFloat(prices[0]) * 100;
        }
      } catch (e) {}
    }
  }
  return -1;
}

/**
 * Gera um ID único baseado no título
 */
function generateEventId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Busca eventos já conhecidos no Firestore
 */
async function getKnownEvents() {
  try {
    const snapshot = await firestore.collection(COLLECTION_NAME).get();
    const knownIds = new Set();
    snapshot.forEach(doc => knownIds.add(doc.id));
    return knownIds;
  } catch (error) {
    console.error('Erro ao buscar eventos conhecidos:', error.message);
    return new Set();
  }
}

/**
 * Salva novos eventos no Firestore
 */
async function saveNewEvent(event, category) {
  const eventId = generateEventId(event.title);
  const probability = extractProbability(event);
  
  const eventData = {
    id: eventId,
    polymarketId: event.id,
    title: event.title,
    description: event.description || '',
    category: category,
    probability: probability,
    discoveredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isActive: true,
    source: 'polymarket',
    url: `https://polymarket.com/event/${event.slug || event.id}`
  };
  
  try {
    await firestore.collection(COLLECTION_NAME).doc(eventId).set(eventData);
    console.log(`✅ Novo evento salvo: ${event.title}`);
    return eventData;
  } catch (error) {
    console.error(`❌ Erro ao salvar evento:`, error.message);
    return null;
  }
}

// ======================
// CLOUD FUNCTION PRINCIPAL
// ======================

/**
 * Função principal que é chamada pelo Cloud Scheduler
 * Roda 1x por semana e descobre novos eventos
 */
functions.http('scanPolymarket', async (req, res) => {
  console.log('🔍 Konzup Radar Bot: Iniciando varredura semanal...');
  console.log(`📅 Data/Hora: ${new Date().toISOString()}`);
  
  const results = {
    startTime: new Date().toISOString(),
    totalEventsScanned: 0,
    relevantEventsFound: 0,
    newEventsDiscovered: 0,
    newEvents: [],
    errors: []
  };
  
  try {
    // 1. Busca todos os eventos do Polymarket
    console.log('📊 Buscando eventos no Polymarket...');
    const allEvents = await fetchPolymarketEvents();
    results.totalEventsScanned = allEvents.length;
    console.log(`   Encontrados ${allEvents.length} eventos totais`);
    
    // 2. Filtra eventos relevantes para turismo
    const relevantEvents = allEvents.filter(isRelevantEvent);
    results.relevantEventsFound = relevantEvents.length;
    console.log(`   ${relevantEvents.length} eventos relevantes para turismo`);
    
    // 3. Busca eventos já conhecidos
    const knownEvents = await getKnownEvents();
    console.log(`   ${knownEvents.size} eventos já conhecidos no banco`);
    
    // 4. Identifica e salva novos eventos
    for (const event of relevantEvents) {
      const eventId = generateEventId(event.title);
      
      if (!knownEvents.has(eventId)) {
        const category = categorizeEvent(event);
        const savedEvent = await saveNewEvent(event, category);
        
        if (savedEvent) {
          results.newEventsDiscovered++;
          results.newEvents.push({
            title: event.title,
            category: category,
            probability: savedEvent.probability
          });
        }
      }
    }
    
    // 5. Log final
    results.endTime = new Date().toISOString();
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📋 RESUMO DA VARREDURA');
    console.log('═══════════════════════════════════════');
    console.log(`   Total de eventos analisados: ${results.totalEventsScanned}`);
    console.log(`   Eventos relevantes: ${results.relevantEventsFound}`);
    console.log(`   NOVOS eventos descobertos: ${results.newEventsDiscovered}`);
    console.log('═══════════════════════════════════════');
    
    if (results.newEventsDiscovered > 0) {
      console.log('');
      console.log('🆕 Novos eventos:');
      results.newEvents.forEach(e => {
        console.log(`   • [${e.category}] ${e.title} (${e.probability.toFixed(1)}%)`);
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Varredura concluída. ${results.newEventsDiscovered} novos eventos descobertos.`,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Erro na varredura:', error.message);
    results.errors.push(error.message);
    
    res.status(500).json({
      success: false,
      message: 'Erro durante a varredura',
      error: error.message,
      data: results
    });
  }
});

/**
 * Endpoint para listar eventos descobertos
 * Usado pelo frontend para mostrar cards dinâmicos
 */
functions.http('getDiscoveredEvents', async (req, res) => {
  try {
    // Adiciona CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // Query simplificada para evitar necessidade de índice composto
    const snapshot = await firestore
      .collection(COLLECTION_NAME)
      .limit(100)
      .get();
    
    // Filtra e ordena no código
    let events = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.isActive !== false) { // Aceita undefined ou true
        events.push(data);
      }
    });
    
    // Ordena por data de descoberta (mais recentes primeiro)
    events.sort((a, b) => {
      const dateA = new Date(a.discoveredAt || 0);
      const dateB = new Date(b.discoveredAt || 0);
      return dateB - dateA;
    });
    
    // Limita a 20 eventos
    events = events.slice(0, 20);
    
    res.status(200).json({
      success: true,
      count: events.length,
      events: events
    });
    
  } catch (error) {
    console.error('Erro ao buscar eventos:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================
// EXPORTA PARA TESTES LOCAIS
// ======================

module.exports = {
  fetchPolymarketEvents,
  isRelevantEvent,
  categorizeEvent,
  extractProbability,
  generateEventId,
  TOURISM_KEYWORDS,
  CATEGORY_RULES
};
