# 🎯 Konzup Radar

**Inteligência Preditiva para o Mercado de Turismo**

O Konzup Radar é uma plataforma de monitoramento de riscos globais que podem impactar o setor de turismo, cruzando dados de mercados preditivos (Polymarket), macrotendências de busca (Google Trends) e insights de IA (Gemini) para apoiar decisões estratégicas de operadores, agências e gestão pública.

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Deploy](https://img.shields.io/badge/deploy-Google%20Cloud%20Run-blue)
![AI](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-purple)
![Bot](https://img.shields.io/badge/bot-Cloud%20Functions-orange)

**URL de Produção:** https://radar.konzuphub.com

---

## 📋 Índice

1. [O que é](#-o-que-é)
2. [Para que serve](#-para-que-serve)
3. [Indicadores Monitorados](#-indicadores-monitorados)
4. [Como funciona](#-como-funciona)
5. [Segurança e Otimização](#-segurança-e-otimização)
6. [Arquitetura](#-arquitetura)
7. [Tecnologias](#-tecnologias)
8. [Instalação Local](#-instalação-local)
9. [Deploy em Produção](#-deploy-em-produção)
10. [Bot Scanner Semanal](#-bot-scanner-semanal)
11. [APIs e Integrações](#-apis-e-integrações)
12. [Estrutura do Código](#-estrutura-do-código)
13. [Contribuição](#-contribuição)

---

## 🎯 O que é

O Konzup Radar é um painel inteligente que:

- **Monitora 12 indicadores globais** em tempo real
- **Gera insights de IA** via Gemini 2.0 Flash para cada indicador
- **Calcula índices de confiança e intenção** para o mercado de turismo
- **Detecta automaticamente novos riscos** relevantes
- **Exibe tendências visuais** com gráficos históricos
- **Suporta 3 idiomas**: Português, Inglês e Espanhol

### Fontes de Dados

| Fonte | O que fornece | Cache |
|-------|---------------|-------|
| **Polymarket** | Probabilidades de eventos preditivos (até 700 eventos paginados) | 2 horas |
| **Google Trends** | Tendências de busca relacionadas a turismo | 6 horas |
| **Gemini AI** | Insights executivos de IA para cada indicador | 12 horas |
| **Bot Scanner** | Descoberta automática semanal de novos eventos | Semanal |

---

## 🎪 Para que serve

### Público-alvo

- **Operadores de turismo** que precisam antecipar riscos
- **Agências de viagens** que querem informar clientes
- **Gestão pública** de turismo e observatórios
- **Consultores** do setor de viagens e eventos
- **Investidores** no setor de turismo/hospitalidade

---

## 📊 Indicadores Monitorados

O sistema monitora **12 indicadores** organizados em categorias:

| # | Indicador | Categoria | Descrição |
|---|-----------|-----------|-----------|
| 1 | Demanda Turismo Brasil | Infraestrutura | Interesse em Turismo Doméstico |
| 2 | Custos Aéreos LATAM | Custo Aéreo | Preço de Passagens Aéreas |
| 3 | Câmbio Real/Dólar | Câmbio | Pressão sobre o Câmbio |
| 4 | Guerra Rússia-Ucrânia | Geopolítica | Conflito na Europa Oriental |
| 5 | Recessão EUA | Câmbio | Risco de Recessão Americana |
| 6 | Tensão China-Taiwan | Geopolítica | Risco Geopolítico na Ásia |
| 7 | Eleições Europa | Geopolítica | Instabilidade na Europa |
| 8 | Fed Rate Cut | Câmbio | Política Monetária Americana |
| 9 | Bloqueio China-Taiwan | Custo Aéreo | Risco de Bloqueio Naval no Estreito de Taiwan |
| 10 | Estreito de Ormuz | Custo Aéreo | Fechamento do Estreito de Ormuz pelo Irã |
| 11 | Canal de Suez | Custo Aéreo | Trânsito no Canal de Suez |
| 12 | Conflito Israel-Líbano | Geopolítica | Ofensiva Militar no Líbano |

### Categorias

| Categoria | Indicadores |
|-----------|-------------|
| **🛫 Custo Aéreo** | Passagens, Bloqueio Taiwan, Ormuz, Suez |
| **🌍 Geopolítica** | Rússia-Ucrânia, China-Taiwan, Europa, Israel-Líbano |
| **💰 Câmbio** | Real/Dólar, Recessão EUA, Fed Rate |
| **🏗️ Infraestrutura** | Turismo Doméstico |

---

## ⚙️ Como funciona

### 1. Coleta de Dados

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Polymarket    │────▶│                 │────▶│   Frontend      │
│   (Previsões)   │     │   Backend       │     │   (React/Vite)  │
└─────────────────┘     │   (Proxy/Node)  │     └─────────────────┘
                        │                 │
┌─────────────────┐     │   Cache:        │
│  Google Trends  │────▶│   Poly: 2h      │
│  (via Python)   │     │   Trends: 6h    │
└─────────────────┘     │   Gemini: 12h   │
                        │                 │
┌─────────────────┐     │                 │
│  Gemini AI      │────▶│                 │
│  (Insights)     │     └─────────────────┘
└─────────────────┘
```

### 2. Fórmula de Risco

O cruzamento de dados usa pesos diferenciados:

```
Risk = (Polymarket × 70%) + (Google Trends × 30%)
```

- **Polymarket (70%)**: Probabilidade real de mercados preditivos com dinheiro real
- **Google Trends (30%)**: Índice de interesse público (proxy de demanda/preocupação)

### 3. Insights de IA (Gemini 2.0 Flash)

Para cada indicador, o Gemini gera um insight executivo curto para CEOs de turismo, considerando a probabilidade, tendência e volatilidade do indicador. Os insights são cacheados por 12 horas.

### 4. Índice de Confiança

O sistema calcula um **Índice de Confiança** baseado na volatilidade dos indicadores:

```
Confiança = 100 - (volatilidade média × 20)
```

Onde: high=3, moderate=2, low=1

**Classificação:**
- 🟢 **Confiança > 60**: Cenário Estável
- 🟡 **Confiança 40-60**: Atenção Moderada  
- 🔴 **Confiança < 40**: Alerta Volátil

### 5. Índice de Intenção

Mede a direção geral das tendências:

```
Intenção = (tendências up - tendências down) / total × 15%
```

### 6. Bot Scanner Semanal

O bot roda automaticamente **toda segunda-feira às 6h** e:

1. Busca todos os eventos ativos no Polymarket (~1000 eventos)
2. Filtra eventos relevantes para turismo (~250 eventos)
3. Detecta novos eventos ainda não conhecidos
4. Salva no Firestore para exibição dinâmica

---

## 🔒 Segurança e Otimização

### Proteção de APIs

| Mecanismo | Detalhes |
|-----------|----------|
| **CORS Restrito** | Apenas origens autorizadas (radar.konzuphub.com, Cloud Run URLs, localhost) |
| **Rate Limiting** | Gemini: 15 req/min, Trends: 60 req/min (via `express-rate-limit`) |
| **API Key Server-side** | GEMINI_API_KEY nunca exposta no frontend; configurada como env var no Cloud Run |
| **Input Sanitization** | Keywords sanitizadas contra command injection |
| **.dockerignore** | Arquivo `.env` excluído do container Docker |

### Cache Diferenciado (Otimização de Custo)

| Serviço | TTL | Motivo |
|---------|-----|--------|
| **Polymarket** | 2 horas | Mercados preditivos mudam moderadamente |
| **Google Trends** | 6 horas | Dados de tendência atualizam semanalmente |
| **Gemini AI** | 24 horas | Insights renovam uma vez por dia para custo quase zero |

### Paginação Polymarket

O sistema busca até **700 eventos** (7 páginas de 100) para garantir cobertura completa dos eventos relevantes para turismo.

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                     https://radar.konzuphub.com                  │
├──────────────────────────────────────────────────────────────────┤
│                        BACKEND (Node.js)                         │
│            Express + Python (pytrends) + Rate Limiting           │
├───────────────────┬──────────────────────────────────────────────┤
│  APIs EXTERNAS    │           GOOGLE CLOUD                       │
├───────────────────┼──────────────────────────────────────────────┤
│  ✅ Polymarket    │  ✅ Cloud Run (App principal)                │
│  ✅ Google Trends │  ✅ Cloud Functions (Bot Scanner)            │
│  ✅ Gemini AI     │  ✅ Cloud Scheduler (Agendamento)            │
│                   │  ✅ Firestore (Eventos descobertos)          │
│                   │  ✅ Cloud Build (CI/CD)                      │
└───────────────────┴──────────────────────────────────────────────┘
```

### URLs de Produção

| Serviço | URL |
|---------|-----|
| **App (domínio)** | https://radar.konzuphub.com |
| **App (Cloud Run)** | https://konzup-radar-885936675930.us-central1.run.app |
| **Bot Scanner** | https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/scanPolymarket |
| **API Eventos** | https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/getDiscoveredEvents |
| **Projeto GCP** | `gen-lang-client-0598434360` |

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - Interface do usuário
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **Lucide React** - Ícones

### Backend
- **Node.js 20** - Runtime
- **Express 5** - Servidor HTTP
- **express-rate-limit** - Rate limiting para proteção de APIs
- **Python 3** - Script para Google Trends
- **pytrends** - Biblioteca para Google Trends API

### IA
- **Gemini 2.0 Flash** - Geração de insights via Google Generative AI API

### Google Cloud
- **Cloud Run** - Hospedagem do app (projeto: `gen-lang-client-0598434360`)
- **Cloud Functions** - Bot scanner
- **Cloud Scheduler** - Agendamento semanal
- **Firestore** - Banco de dados NoSQL
- **Cloud Build** - CI/CD

---

## 💻 Instalação Local

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/KonzupHub/Konzup-Radar.git
cd Konzup-Radar
```

### 2. Instale as dependências

```bash
# Dependências Node.js
npm install

# Dependências Python (em virtual env)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-python.txt
```

### 3. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY (obtenha em https://aistudio.google.com/apikey)
```

### 4. Execute localmente

```bash
# Terminal 1: Backend
node server.js

# Terminal 2: Frontend
npm run dev
```

Acesse: http://localhost:5173

---

## 🚀 Deploy em Produção

### Deploy do App Principal

```bash
# Build + Deploy no Cloud Run (projeto correto!)
gcloud run deploy konzup-radar \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project=gen-lang-client-0598434360
```

### Configurar variáveis de ambiente no Cloud Run

```bash
gcloud run services update konzup-radar \
  --region=us-central1 \
  --update-env-vars="GEMINI_API_KEY=<SUA_CHAVE>" \
  --project=gen-lang-client-0598434360
```

> **IMPORTANTE:** O domínio `radar.konzuphub.com` está mapeado ao projeto `gen-lang-client-0598434360`. Sempre use `--project=gen-lang-client-0598434360` no deploy.

### Deploy do Bot Scanner

```bash
cd bot-scanner

# Instalar dependências
npm install

# Deploy das funções
npm run deploy-all

# Criar agendamento semanal
npm run create-scheduler
```

---

## 🤖 Bot Scanner Semanal

### O que faz

O bot é uma **Cloud Function** que roda automaticamente toda segunda-feira às 6h UTC:

1. **Busca** todos os eventos do Polymarket (até 1000)
2. **Filtra** eventos relevantes para turismo usando keywords
3. **Compara** com eventos já conhecidos no Firestore
4. **Salva** novos eventos descobertos
5. **Registra** logs de execução

### Keywords de Busca

O bot busca eventos que contenham estas palavras:

```javascript
const TOURISM_KEYWORDS = [
  // Turismo direto
  'travel', 'tourism', 'vacation', 'airline', 'flight', 'hotel',
  
  // Regiões
  'brazil', 'europe', 'asia', 'caribbean', 'latin america',
  
  // Economia
  'recession', 'inflation', 'oil price', 'tariff',
  
  // Geopolítica
  'war', 'conflict', 'ceasefire', 'sanctions',
  
  // Clima
  'hurricane', 'earthquake', 'climate'
];
```

### Categorização Automática

Eventos são automaticamente classificados:

| Categoria | Keywords |
|-----------|----------|
| Custo Aéreo | airline, aviation, flight, fuel, oil |
| Geopolítica | war, conflict, election, sanctions |
| Saúde Global | pandemic, outbreak, virus, disease |
| Câmbio | currency, dollar, inflation, recession |
| Clima | hurricane, earthquake, climate, flood |

### Testar Manualmente

```bash
# Executar varredura manualmente
curl -X POST https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/scanPolymarket

# Ver eventos descobertos
curl https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/getDiscoveredEvents
```

### Estrutura do Bot

```
bot-scanner/
├── index.js          # Código principal das Cloud Functions
├── package.json      # Dependências e scripts
├── test.js           # Script de teste local
└── deploy.sh         # Script de deploy automatizado
```

---

## 🔌 APIs e Integrações

### Polymarket API

```javascript
// Endpoint
GET https://gamma-api.polymarket.com/events?closed=false&limit=100

// Resposta
{
  "id": "12345",
  "title": "Russia x Ukraine ceasefire by 2026?",
  "markets": [{
    "outcomePrices": "[0.43, 0.57]"  // YES: 43%, NO: 57%
  }]
}
```

### Google Trends (via Backend)

```bash
# Endpoint interno
GET http://localhost:3001/api/trends/turismo%20brasil

# Resposta
{
  "keyword": "turismo brasil",
  "currentIndex": 75,
  "history": [
    { "date": "2026-01-01", "value": 72 },
    { "date": "2026-01-08", "value": 75 }
  ],
  "isReal": true
}
```

### API de Eventos Descobertos

```bash
# Endpoint público
GET https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/getDiscoveredEvents

# Resposta
{
  "success": true,
  "count": 20,
  "events": [{
    "id": "russia-ukraine-ceasefire",
    "title": "Russia x Ukraine ceasefire by 2026?",
    "category": "Geopolítica",
    "probability": 43.5,
    "discoveredAt": "2026-01-23T14:59:54Z"
  }]
}
```

---

## 📁 Estrutura do Código

```
Konzup-Radar/
│
├── 📄 App.tsx                 # Componente principal React
├── 📄 index.tsx               # Entry point
├── 📄 types.ts                # Tipos TypeScript
├── 📄 translations.ts         # Traduções PT/EN/ES
├── 📄 constants.tsx           # Constantes
│
├── 📁 components/
│   ├── RiskCard.tsx           # Card de indicador de risco
│   └── InfoModal.tsx          # Modal informativo
│
├── 📁 services/
│   ├── dataService.ts         # Busca dados Polymarket/Trends (12 indicadores, paginação)
│   └── geminiService.ts       # Integração com Gemini AI para insights executivos
│
├── 📁 scripts/
│   └── googleTrends.py        # Script Python para Trends
│
├── 📁 bot-scanner/            # Bot semanal
│   ├── index.js               # Cloud Functions
│   ├── package.json           # Dependências
│   ├── test.js                # Testes locais
│   └── deploy.sh              # Script de deploy
│
├── 📄 server.js               # Backend Express
├── 📄 Dockerfile              # Container para Cloud Run
├── 📄 cloudbuild.yaml         # CI/CD Google Cloud
├── 📄 app.yaml                # Configuração Cloud Run
│
├── 📄 package.json            # Dependências Node
├── 📄 requirements-python.txt # Dependências Python
├── 📄 vite.config.ts          # Configuração Vite
└── 📄 tsconfig.json           # Configuração TypeScript
```

---

## 🔧 Configuração de Riscos

Os 12 indicadores são configurados em `services/dataService.ts`:

```typescript
const RISK_CONFIGS: RiskConfig[] = [
  {
    id: 'brazil-tourism',
    name: 'Demanda Turismo Brasil',
    category: 'Infraestrutura',
    riskDescription: 'Interesse em Turismo Doméstico',
    polymarketKeywords: ['brazil', 'election', 'runoff'],
    trendsKeyword: 'pacote viagem brasil',
  },
  {
    id: 'iran-hormuz',
    name: 'Estreito de Ormuz',
    category: 'Custo Aéreo',
    riskDescription: 'Fechamento do Estreito de Ormuz pelo Irã',
    polymarketKeywords: ['iran', 'close', 'strait', 'hormuz'],
    trendsKeyword: 'strait of hormuz oil price',
  },
  {
    id: 'suez-canal',
    name: 'Canal de Suez',
    category: 'Custo Aéreo',
    riskDescription: 'Trânsito no Canal de Suez',
    polymarketKeywords: ['container', 'ship', 'suez', 'canal'],
    trendsKeyword: 'suez canal shipping',
    invertProbability: true, // Probabilidade invertida (quanto maior, menor o risco)
  },
  // ... mais 9 indicadores
];
```

### Adicionar Novo Indicador

1. Adicione a configuração em `RISK_CONFIGS` (`services/dataService.ts`)
2. Defina `polymarketKeywords` e `trendsKeyword` relevantes
3. Use `invertProbability: true` se a probabilidade alta significa risco baixo
4. Faça deploy: `gcloud run deploy konzup-radar --source . --project=gen-lang-client-0598434360 --region us-central1 --allow-unauthenticated`

---

## 🌐 Traduções

O sistema suporta 3 idiomas. Exemplo em `translations.ts`:

```typescript
export const translations = {
  pt: {
    title: 'Konzup Radar',
    marketSummary: 'Mercado de Turismo 2026',
    confidenceStable: 'Cenário Estável',
    // ...
  },
  en: {
    title: 'Konzup Radar',
    marketSummary: 'Tourism Market 2026',
    confidenceStable: 'Stable Scenario',
    // ...
  },
  es: {
    title: 'Konzup Radar',
    marketSummary: 'Mercado de Turismo 2026',
    confidenceStable: 'Escenario Estable',
    // ...
  }
};
```

---

## 📊 Monitoramento

### Health Check

```bash
curl https://radar.konzuphub.com/api/health
# Retorna: {"status":"ok","services":{"polymarket":"available","googleTrends":"available","gemini":"available"}}
```

### Logs do App

```bash
gcloud run services logs read konzup-radar --region=us-central1 --project=gen-lang-client-0598434360 --limit=50
```

### Logs do Bot

```bash
gcloud functions logs read scanPolymarket --region=us-central1 --limit=30
```

### Status do Scheduler

```bash
gcloud scheduler jobs describe konzup-radar-weekly-scan --location=us-central1
```

### Verificar env vars do Cloud Run

```bash
gcloud run services describe konzup-radar --region=us-central1 --project=gen-lang-client-0598434360 --format="yaml(spec.template.spec.containers[0].env)"
```

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📜 Licença

MIT © [Konzup Hub](https://konzup.com)

---

## 📞 Contato

- **Email**: contato@konzup.com
- **GitHub**: [@KonzupHub](https://github.com/KonzupHub)

---

**Feito com ❤️ para o mercado de turismo brasileiro e latino-americano**
