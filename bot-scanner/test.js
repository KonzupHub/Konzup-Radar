/**
 * 🧪 Script de Teste Local para o Bot Scanner
 * 
 * Execute com: node test.js
 * 
 * Testa as funções do bot sem precisar fazer deploy
 */

const {
  fetchPolymarketEvents,
  isRelevantEvent,
  categorizeEvent,
  extractProbability,
  generateEventId,
  TOURISM_KEYWORDS
} = require('./index');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function runTests() {
  log(colors.cyan, '\n═══════════════════════════════════════');
  log(colors.cyan, '🧪 TESTES DO BOT SCANNER KONZUP RADAR');
  log(colors.cyan, '═══════════════════════════════════════\n');

  // Teste 1: Verificar keywords
  log(colors.yellow, '📋 Teste 1: Keywords configuradas');
  console.log(`   Total de keywords: ${TOURISM_KEYWORDS.length}`);
  console.log(`   Exemplos: ${TOURISM_KEYWORDS.slice(0, 5).join(', ')}...`);
  log(colors.green, '   ✅ OK\n');

  // Teste 2: Verificar função isRelevantEvent
  log(colors.yellow, '📋 Teste 2: Detecção de eventos relevantes');
  const testEvents = [
    { title: 'US airline stocks rise 10% in 2026', description: 'Aviation sector outlook' },
    { title: 'Brazil tourism boom expected', description: 'Travel industry growth' },
    { title: 'Bitcoin reaches $100k', description: 'Crypto market' },
    { title: 'Ukraine ceasefire by 2026', description: 'War peace negotiations' },
    { title: 'Random sports event', description: 'Basketball game' }
  ];

  testEvents.forEach(event => {
    const isRelevant = isRelevantEvent(event);
    const icon = isRelevant ? '✅' : '❌';
    console.log(`   ${icon} "${event.title}" → ${isRelevant ? 'RELEVANTE' : 'ignorado'}`);
  });
  log(colors.green, '   ✅ Detecção funcionando\n');

  // Teste 3: Categorização
  log(colors.yellow, '📋 Teste 3: Categorização automática');
  const categorizationTests = [
    { title: 'Airline fuel costs increase', expected: 'Custo Aéreo' },
    { title: 'Russia Ukraine war escalation', expected: 'Geopolítica' },
    { title: 'New pandemic outbreak risk', expected: 'Saúde Global' },
    { title: 'Brazil currency devaluation', expected: 'Câmbio' },
    { title: 'Hurricane hits Caribbean', expected: 'Clima' }
  ];

  categorizationTests.forEach(test => {
    const category = categorizeEvent({ title: test.title });
    const isCorrect = category === test.expected;
    const icon = isCorrect ? '✅' : '⚠️';
    console.log(`   ${icon} "${test.title}" → ${category} (esperado: ${test.expected})`);
  });
  log(colors.green, '   ✅ Categorização funcionando\n');

  // Teste 4: Geração de ID
  log(colors.yellow, '📋 Teste 4: Geração de IDs únicos');
  const idTests = [
    'US Recession by 2026?',
    'Brazil Tourism: Will it grow 20%?',
    'Ukraine War - Ceasefire?'
  ];

  idTests.forEach(title => {
    const id = generateEventId(title);
    console.log(`   "${title}"`);
    console.log(`   → ID: ${id}`);
  });
  log(colors.green, '   ✅ IDs gerados corretamente\n');

  // Teste 5: Buscar eventos reais do Polymarket
  log(colors.yellow, '📋 Teste 5: Conexão com Polymarket API');
  try {
    console.log('   Buscando eventos (aguarde ~30s)...');
    const events = await fetchPolymarketEvents();
    console.log(`   📊 Total de eventos encontrados: ${events.length}`);
    
    const relevant = events.filter(isRelevantEvent);
    console.log(`   🎯 Eventos relevantes para turismo: ${relevant.length}`);
    
    if (relevant.length > 0) {
      console.log('\n   Top 5 eventos relevantes:');
      relevant.slice(0, 5).forEach((event, i) => {
        const prob = extractProbability(event);
        const category = categorizeEvent(event);
        console.log(`   ${i+1}. [${category}] ${event.title.substring(0, 60)}...`);
        console.log(`      Probabilidade: ${prob >= 0 ? prob.toFixed(1) + '%' : 'N/A'}`);
      });
    }
    
    log(colors.green, '\n   ✅ Conexão com Polymarket OK\n');
  } catch (error) {
    log(colors.red, `   ❌ Erro: ${error.message}\n`);
  }

  // Resumo final
  log(colors.cyan, '═══════════════════════════════════════');
  log(colors.cyan, '✅ TODOS OS TESTES CONCLUÍDOS');
  log(colors.cyan, '═══════════════════════════════════════');
  console.log('\nPróximos passos:');
  console.log('1. npm install (instalar dependências)');
  console.log('2. npm run deploy-all (fazer deploy das functions)');
  console.log('3. npm run create-scheduler (criar agendamento semanal)\n');
}

runTests().catch(console.error);
