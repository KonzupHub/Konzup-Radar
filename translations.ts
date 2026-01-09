
export type Language = 'pt' | 'en' | 'es';

// Traduções para categorias
export const categoryTranslations = {
  pt: {
    'Geopolítica': 'Geopolítica',
    'Câmbio': 'Câmbio',
    'Clima': 'Clima',
    'Custo Aéreo': 'Custo Aéreo',
    'Saúde Global': 'Saúde Global'
  },
  en: {
    'Geopolítica': 'Geopolitics',
    'Câmbio': 'Currency',
    'Clima': 'Climate',
    'Custo Aéreo': 'Air Costs',
    'Saúde Global': 'Global Health'
  },
  es: {
    'Geopolítica': 'Geopolítica',
    'Câmbio': 'Cambio',
    'Clima': 'Clima',
    'Custo Aéreo': 'Costo Aéreo',
    'Saúde Global': 'Salud Global'
  }
};

// Traduções para descrições de risco
export const riskDescTranslations = {
  pt: {
    'Risco de Recessão Americana': 'Risco de Recessão Americana',
    'Guerra na Europa Oriental': 'Guerra na Europa Oriental',
    'Risco Geopolítico na Ásia': 'Risco Geopolítico na Ásia',
    'Pressão Inflacionária no Brasil': 'Pressão Inflacionária no Brasil',
    'Inflação Alta nos EUA': 'Inflação Alta nos EUA',
    'Eventos Climáticos Extremos': 'Eventos Climáticos Extremos',
    'Instabilidade na Europa': 'Instabilidade na Europa',
    'Alta do Querosene de Aviação': 'Alta do Querosene de Aviação'
  },
  en: {
    'Risco de Recessão Americana': 'US Recession Risk',
    'Guerra na Europa Oriental': 'War in Eastern Europe',
    'Risco Geopolítico na Ásia': 'Geopolitical Risk in Asia',
    'Pressão Inflacionária no Brasil': 'Brazil Inflation Pressure',
    'Inflação Alta nos EUA': 'High US Inflation',
    'Eventos Climáticos Extremos': 'Extreme Weather Events',
    'Instabilidade na Europa': 'Europe Instability',
    'Alta do Querosene de Aviação': 'Jet Fuel Price Rise'
  },
  es: {
    'Risco de Recessão Americana': 'Riesgo de Recesión en EE.UU.',
    'Guerra na Europa Oriental': 'Guerra en Europa Oriental',
    'Risco Geopolítico na Ásia': 'Riesgo Geopolítico en Asia',
    'Pressão Inflacionária no Brasil': 'Presión Inflacionaria en Brasil',
    'Inflação Alta nos EUA': 'Alta Inflación en EE.UU.',
    'Eventos Climáticos Extremos': 'Eventos Climáticos Extremos',
    'Instabilidade na Europa': 'Inestabilidad en Europa',
    'Alta do Querosene de Aviação': 'Alza del Combustible Aéreo'
  }
};

export const translations = {
  pt: {
    radar: "RADAR",
    globalRisks: "Riscos Globais",
    howItWorks: "Como funciona",
    nodeStatus: "Status do Nó: Ativo",
    predictiveAnalytics: "Como funciona",
    refreshData: "Atualizar",
    monitorTitle: "Monitoramento de Risco",
    monitorSub: "Inteligência preditiva proprietária Konzup cruzando dados de mercados preditivos, macrotendências energéticas e tensões geopolíticas em tempo real.",
    sentimentScore: "Pontuação de Sentimento",
    marketSummary: "Mercado de Turismo 2026: Alerta Volátil",
    marketSummarySub: "Sinalização de alta compressão em margens operacionais aéreas.",
    intentionIndex: "Índex Intenção",
    confidenceIndex: "Índex Confiança",
    probability: "probabilidade",
    verdictTitle: "Insight Konzup AI",
    processing: "Gerando insight...",
    verdictError: "IA Offline: Monitore oscilações manuais.",
    copyright: "© 2026 Konzup Predict Ltd. Todos os direitos reservados.",
    methodologyTitle: "Metodologia e Transparência de Dados",
    projectTitle: "O Projeto Konzup Radar",
    projectDesc: "O Konzup Radar é um ecossistema de inteligência desenhado para antecipar movimentos disruptivos no setor de turismo. Utilizamos o modelo Gemini (Google GenAI) para processar volumes massivos de dados estruturados e não estruturados, gerando insights acionáveis para gestores.",
    algorithmTitle: "Como Calculamos os Riscos",
    algorithmDesc: "Nosso algoritmo cruza duas fontes de dados em tempo real: probabilidades de mercados preditivos (Polymarket) e índice de interesse de busca (Google Trends). O resultado é uma métrica única que combina 'o que o mercado aposta' com 'o que as pessoas estão procurando'.",
    indicesTitle: "Índices de Sentimento",
    indicesDesc: "O Índex Intenção mede a variação no interesse de busca por viagens e turismo, indicando se a demanda está crescendo ou retraindo. O Índex Confiança representa o nível de estabilidade do mercado baseado na volatilidade dos indicadores monitorados — quanto maior, mais previsível o cenário.",
    dataTitle: "Fontes de Dados e LGPD",
    dataDesc: "Nossa engine monitora mercados preditivos globais, índices de commodities (Brent) e fluxos macroeconômicos. Operamos em estrita conformidade com a LGPD (Lei Geral de Proteção de Dados), utilizando exclusivamente dados públicos e anonimizados.",
    disclaimerTitle: "Aviso Legal",
    disclaimerDesc: "As informações exibidas representam TENDÊNCIAS e PROBABILIDADES estatísticas. NÃO CONSTITUEM garantias de eventos futuros ou aconselhamento financeiro.",
    backButton: "Voltar ao Dashboard"
  },
  en: {
    radar: "RADAR",
    globalRisks: "Global Risks",
    howItWorks: "How it works",
    nodeStatus: "Node Status: Active",
    predictiveAnalytics: "How it works",
    refreshData: "Refresh",
    monitorTitle: "Risk Monitoring",
    monitorSub: "Konzup's proprietary predictive intelligence crossing market data, energy trends, and geopolitical tensions in real-time.",
    sentimentScore: "Sentiment Score",
    marketSummary: "2026 Tourism Market: Volatile Alert",
    marketSummarySub: "Signaling high compression in airline operating margins.",
    intentionIndex: "Intention Index",
    confidenceIndex: "Confidence Index",
    probability: "probability",
    verdictTitle: "Konzup AI Insight",
    processing: "Generating insight...",
    verdictError: "AI Offline: Monitor manual oscillations.",
    copyright: "© 2026 Konzup Predict Ltd. All Rights Reserved.",
    methodologyTitle: "Methodology and Data Transparency",
    projectTitle: "The Konzup Radar Project",
    projectDesc: "Konzup Radar is an intelligence ecosystem designed to anticipate disruptive movements in the tourism sector. We use the Gemini model (Google GenAI) to process massive volumes of structured and unstructured data.",
    algorithmTitle: "How We Calculate Risks",
    algorithmDesc: "Our algorithm crosses two real-time data sources: prediction market probabilities (Polymarket) and search interest index (Google Trends). The result is a unique metric combining 'what the market bets' with 'what people are searching for'.",
    indicesTitle: "Sentiment Indices",
    indicesDesc: "The Intention Index measures the variation in search interest for travel and tourism, indicating whether demand is growing or retracting. The Confidence Index represents the market stability level based on the volatility of monitored indicators — the higher, the more predictable the scenario.",
    dataTitle: "Data Sources",
    dataDesc: "Our engine monitors global predictive markets, commodity indices (Brent), and macroeconomic flows. We operate in strict compliance with data protection regulations.",
    disclaimerTitle: "Legal Disclaimer",
    disclaimerDesc: "The information displayed represents statistical TRENDS and PROBABILITIES. They DO NOT CONSTITUTE guarantees of future events or financial advice.",
    backButton: "Back to Dashboard"
  },
  es: {
    radar: "RADAR",
    globalRisks: "Riesgos Globales",
    howItWorks: "Cómo funciona",
    nodeStatus: "Estado del Nodo: Activo",
    predictiveAnalytics: "Cómo funciona",
    refreshData: "Actualizar",
    monitorTitle: "Monitoreo de Riesgos",
    monitorSub: "Inteligencia predictiva propietaria de Konzup que cruza datos de mercados, tendencias energéticas y tensiones geopolíticas en tiempo real.",
    sentimentScore: "Puntuación de Sentimiento",
    marketSummary: "Mercado Turístico 2026: Alerta Volátil",
    marketSummarySub: "Señalización de alta compresión en los márgenes operativos.",
    intentionIndex: "Índice de Intención",
    confidenceIndex: "Índice de Confianza",
    probability: "probabilidad",
    verdictTitle: "Insight Konzup AI",
    processing: "Generando insight...",
    verdictError: "IA Offline: Monitoree oscilaciones manuales.",
    copyright: "© 2026 Konzup Predict Ltd. Todos los derechos reservados.",
    methodologyTitle: "Metodología y Transparencia de Datos",
    projectTitle: "El Proyecto Konzup Radar",
    projectDesc: "Konzup Radar es un ecosistema de inteligencia diseñado para anticipar movimientos disruptivos en el sector turístico. Utilizamos el modelo Gemini (Google GenAI) para procesar volúmenes masivos de datos.",
    algorithmTitle: "Cómo Calculamos los Riesgos",
    algorithmDesc: "Nuestro algoritmo cruza dos fuentes de datos en tiempo real: probabilidades de mercados predictivos (Polymarket) e índice de interés de búsqueda (Google Trends).",
    indicesTitle: "Índices de Sentimiento",
    indicesDesc: "El Índice de Intención mide la variación en el interés de búsqueda de viajes y turismo, indicando si la demanda está creciendo o retrayéndose. El Índice de Confianza representa el nivel de estabilidad del mercado basado en la volatilidad de los indicadores monitoreados — cuanto mayor, más predecible el escenario.",
    dataTitle: "Fuentes de Datos",
    dataDesc: "Nuestro motor monitorea mercados predictivos globales, índices de materias primas y flujos macroeconómicos. Operamos en estricto cumplimiento de las regulaciones de protección de datos.",
    disclaimerTitle: "Aviso Legal",
    disclaimerDesc: "La información mostrada representa TENDENCIAS y PROBABILIDADES estadísticas. NO CONSTITUYEN garantías de eventos futuros o asesoramiento financiero.",
    backButton: "Volver al Panel"
  }
};
