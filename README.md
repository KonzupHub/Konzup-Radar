# 🎯 Konzup Radar

**Sistema de Monitoramento de Riscos para o Mercado de Turismo**

O Konzup Radar é uma plataforma que monitora riscos globais que podem impactar o setor de turismo, fornecendo informações em tempo real para operadores e agências de viagens tomarem decisões informadas.

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Deploy](https://img.shields.io/badge/deploy-Google%20Cloud%20Run-blue)
![Bot](https://img.shields.io/badge/bot-Cloud%20Functions-orange)

---

## 📋 Índice

1. [O que é](#-o-que-é)
2. [Para que serve](#-para-que-serve)
3. [Como funciona](#-como-funciona)
4. [Arquitetura](#-arquitetura)
5. [Tecnologias](#-tecnologias)
6. [Instalação Local](#-instalação-local)
7. [Deploy em Produção](#-deploy-em-produção)
8. [Bot Scanner Semanal](#-bot-scanner-semanal)
9. [APIs e Integrações](#-apis-e-integrações)
10. [Estrutura do Código](#-estrutura-do-código)
11. [Contribuição](#-contribuição)

---

## 🎯 O que é

O Konzup Radar é um painel inteligente que:

- **Monitora indicadores globais** em tempo real
- **Calcula índices de confiança** para o mercado de turismo
- **Detecta automaticamente novos riscos** relevantes
- **Exibe tendências visuais** com gráficos históricos
- **Suporta 3 idiomas**: Português, Inglês e Espanhol

### Fontes de Dados

| Fonte | O que fornece |
|-------|---------------|
| **Polymarket** | Probabilidades de eventos de previsão (mercados preditivos) |
| **Google Trends** | Tendências de busca relacionadas a turismo |
| **Bot Scanner** | Descoberta automática de novos eventos relevantes |

---

## 🎪 Para que serve

### Público-alvo

- **Operadores de turismo** que precisam antecipar riscos
- **Agências de viagens** que querem informar clientes
- **Consultores** do setor de viagens e eventos
- **Investidores** no setor de turismo/hospitalidade

### Indicadores Monitorados

| Categoria | Indicadores |
|-----------|-------------|
| **🛫 Custo Aéreo** | Custos de passagens, combustível, tarifas |
| **🌍 Geopolítica** | Conflitos, eleições, instabilidade política |
| **💰 Câmbio** | Dólar/Real, política monetária, economia Brasil |
| **🌡️ Clima** | Eventos extremos, furacões, mudanças climáticas |
| **🏥 Saúde Global** | Pandemias, surtos, riscos sanitários |
| **🏗️ Infraestrutura** | Turismo doméstico, conectividade aérea |

---

## ⚙️ Como funciona

### 1. Coleta de Dados

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Polymarket    │────▶│   Backend       │────▶│   Frontend      │
│   (Previsões)   │     │   (Proxy/Node)  │     │   (React/Vite)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │
┌─────────────────┐            │
│  Google Trends  │────────────┘
│  (via Python)   │
└─────────────────┘
```

### 2. Índice de Confiança

O sistema calcula um **Índice de Confiança** baseado na volatilidade dos indicadores:

```javascript
// Média ponderada das probabilidades dos riscos
Índice = 100 - (volatilidade média dos indicadores)
```

**Classificação:**
- 🟢 **Confiança > 60**: Cenário Estável
- 🟡 **Confiança 40-60**: Atenção Moderada  
- 🔴 **Confiança < 40**: Alerta Volátil

### 3. Bot Scanner Semanal

O bot roda automaticamente **toda segunda-feira às 6h** e:

1. Busca todos os eventos ativos no Polymarket (~1000 eventos)
2. Filtra eventos relevantes para turismo (~250 eventos)
3. Detecta novos eventos ainda não conhecidos
4. Salva no Firestore para exibição dinâmica

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                     https://konzup-radar.run.app                 │
├──────────────────────────────────────────────────────────────────┤
│                        BACKEND (Node.js)                         │
│                     Express + Python (pytrends)                  │
├───────────────────┬──────────────────────────────────────────────┤
│  APIs EXTERNAS    │           GOOGLE CLOUD                       │
├───────────────────┼──────────────────────────────────────────────┤
│  ✅ Polymarket    │  ✅ Cloud Run (App principal)                │
│  ✅ Google Trends │  ✅ Cloud Functions (Bot Scanner)            │
│                   │  ✅ Cloud Scheduler (Agendamento)            │
│                   │  ✅ Firestore (Eventos descobertos)          │
│                   │  ✅ Cloud Build (CI/CD)                      │
└───────────────────┴──────────────────────────────────────────────┘
```

### URLs de Produção

| Serviço | URL |
|---------|-----|
| **App Principal** | https://konzup-radar-885936675930.us-central1.run.app |
| **Bot Scanner** | https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/scanPolymarket |
| **API Eventos** | https://us-central1-gen-lang-client-0598434360.cloudfunctions.net/getDiscoveredEvents |

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
- **Express** - Servidor HTTP
- **Python 3** - Script para Google Trends
- **pytrends** - Biblioteca para Google Trends API

### Google Cloud
- **Cloud Run** - Hospedagem do app
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

### 3. Execute localmente

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
# Build + Deploy no Cloud Run
npm run build
gcloud run deploy konzup-radar \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

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
│   ├── dataService.ts         # Busca dados Polymarket/Trends
│   └── geminiService.ts       # (Reservado para IA futura)
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

Os indicadores são configurados em `services/dataService.ts`:

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
  // ... mais configurações
];
```

### Adicionar Novo Indicador

1. Adicione a configuração em `RISK_CONFIGS`
2. Adicione traduções em `translations.ts`
3. Faça deploy: `npm run build && gcloud run deploy ...`

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

### Logs do App

```bash
gcloud run services logs read konzup-radar --region=us-central1 --limit=50
```

### Logs do Bot

```bash
gcloud functions logs read scanPolymarket --region=us-central1 --limit=30
```

### Status do Scheduler

```bash
gcloud scheduler jobs describe konzup-radar-weekly-scan --location=us-central1
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
