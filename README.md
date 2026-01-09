# 🛰️ Konzup Radar

**Inteligência Preditiva para o Mercado de Turismo**

Dashboard em tempo real que monitora riscos e oportunidades para o setor de turismo, cruzando dados de mercados de previsão (Polymarket) com tendências de busca (Google Trends).

🌐 **Demo:** [konzup-radar-885936675930.us-central1.run.app](https://konzup-radar-885936675930.us-central1.run.app)

---

## 📊 O Que É e Para Quem Serve

O Konzup Radar é uma ferramenta de **inteligência preditiva** desenhada para profissionais do turismo:

- **Agências de Viagens Corporativas** - Antecipar custos de passagens e riscos operacionais
- **Operadoras de Turismo** - Planejar pacotes considerando cenários geopolíticos
- **Hotéis e Resorts** - Ajustar estratégias baseado em demanda projetada
- **DMCs e Receptivos** - Preparar-se para variações de fluxo turístico

### ⚠️ IMPORTANTE: Probabilidades, Não Fatos

Os dados exibidos são **PROBABILIDADES** baseadas em mercados de previsão e tendências de busca, **NÃO são fatos consumados**. Eles representam o consenso do mercado sobre eventos futuros.

---

## 🎯 Riscos Monitorados (8 Métricas)

| Categoria | Métrica | Fonte Polymarket | Interpretação |
|-----------|---------|------------------|---------------|
| **Geopolítica** | Recessão EUA | "Negative GDP growth in 2025?" | YES = risco direto |
| **Geopolítica** | Guerra Ucrânia | "Russia x Ukraine ceasefire..." | YES = bom → **invertido** |
| **Geopolítica** | China-Taiwan | "Will China invade Taiwan...?" | YES = risco direto |
| **Geopolítica** | Crise Europa | "Macron out by...?" | YES = risco direto |
| **Câmbio** | Inflação Brasil | "Brazil inflation below 5.5%?" | YES = bom → **invertido** |
| **Câmbio** | Inflação EUA | "Will inflation reach 5%...?" | YES = risco direto |
| **Clima** | Clima Extremo | "Will 2025 be hottest year?" | YES = risco direto |
| **Custo Aéreo** | Combustível | Google Trends "jet fuel prices" | Trends-based |

### Lógica de Inversão

Alguns eventos no Polymarket são formulados de forma que **YES = bom**:
- "Inflação abaixo de 5.5%?" → YES significa inflação controlada (bom!)
- "Cessar-fogo na Ucrânia?" → YES significa paz (bom!)

Nesses casos, **invertemos** a probabilidade para mostrar o RISCO:
```
Risco = 100% - Probabilidade_YES
```

**Exemplo Brasil:**
- Polymarket: 99.85% chance de inflação ficar ABAIXO de 5.5%
- Inversão: 100 - 99.85 = **0.15% risco** de inflação alta
- Dashboard mostra: ~0% (verde, baixo risco) ✅

---

## 🧮 O Algoritmo: Como Funciona

O Konzup Radar cruza **duas fontes de dados** para gerar probabilidades de risco:

### Fórmula

```
Risco Final = Probabilidade Polymarket (primária) + Google Trends (histórico)
```

### Fontes de Dados

#### 1. Polymarket - "A Aposta do Mercado"

**O que é:** Plataforma de mercados de previsão onde pessoas apostam dinheiro real em eventos futuros.

**Por que funciona:** O dinheiro real torna as probabilidades mais robustas.

**Formato da API:**
```json
{
  "title": "Negative GDP growth in 2025?",
  "outcomes": ["Yes", "No"],
  "outcomePrices": ["0.018", "0.982"]  // 1.8% YES, 98.2% NO
}
```

**API:** `https://gamma-api.polymarket.com/events` (gratuita, sem chave)

#### 2. Google Trends - "A Intenção de Busca"

**O que é:** Volume de buscas no Google (índice 0-100) nos últimos 30 dias.

**Como usamos:** Crawler Python (`pytrends`) que coleta dados históricos para cada termo de risco.

**Crawler:** `scripts/googleTrends.py`

---

## 🏗️ Arquitetura Técnica

### Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Node.js (Express 5) - Proxy para APIs
- **Crawler:** Python 3 (pytrends) - Google Trends
- **AI:** Google Gemini 2.0 Flash - Insights em linguagem natural
- **Deploy:** Google Cloud Run
- **Analytics:** Google Analytics (G-CBVVY75WZ0)

### Estrutura de Arquivos

```
konzup-radar/
├── App.tsx                 # Componente principal React
├── components/
│   ├── RiskCard.tsx        # Card de risco individual
│   └── InfoModal.tsx       # Modal de informações
├── services/
│   ├── dataService.ts      # Integração Polymarket + Trends
│   └── geminiService.ts    # Integração Gemini AI
├── scripts/
│   └── googleTrends.py     # Crawler Python para Trends
├── server.js               # Backend Express (proxy + API)
├── Dockerfile              # Container para Cloud Run
├── translations.ts         # i18n (PT/EN/ES)
└── types.ts                # TypeScript interfaces
```

### Fluxo de Dados

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Polymarket    │────▶│   server.js      │◀────│  Google Trends  │
│   Gamma API     │     │   (Express)      │     │  (pytrends.py)  │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │  dataService   │
                        │  (Frontend)    │
                        └────────┬───────┘
                                 │
                        ┌────────▼───────┐
                        │  Gemini AI     │
                        │  (Insights)    │
                        └────────┬───────┘
                                 │
                        ┌────────▼───────┐
                        │   RiskCard     │
                        │   (UI)         │
                        └────────────────┘
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- Python 3.11+
- Conta Google Cloud (para Gemini API)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/KonzupHub/Konzup-Radar.git
cd Konzup-Radar

# Instale dependências Node
npm install

# Instale dependências Python
pip install -r requirements-python.txt

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY
```

### Executar

```bash
# Modo desenvolvimento (frontend + backend)
npm run dev:full

# Ou separadamente:
npm run dev      # Frontend Vite (porta 3000)
npm run server   # Backend Express (porta 3001)
```

Acesse: `http://localhost:3000`

---

## ☁️ Deploy no Google Cloud Run

### Via CLI

```bash
# Build e deploy
gcloud run deploy konzup-radar \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=sua_chave"
```

---

## 📡 Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/polymarket/events` | GET | Lista eventos Polymarket ativos |
| `/api/polymarket/search/:query` | GET | Busca eventos por termo |
| `/api/trends/:keyword` | GET | Dados Google Trends para keyword |
| `/api/gemini/insight` | POST | Gera insight AI para métrica |
| `/api/health` | GET | Health check dos serviços |

---

## 🔐 Segurança

- **GEMINI_API_KEY** nunca é exposta no frontend
- **Input sanitization** no endpoint de Trends (previne command injection)
- **spawn()** usado em vez de exec() para execução segura de Python
- **CORS** configurado para ambiente de produção
- **LGPD compliant** - usa apenas dados públicos e anonimizados

---

## 📈 Dados em Tempo Real (Janeiro 2026)

| Métrica | Evento Polymarket | Probabilidade |
|---------|-------------------|---------------|
| Recessão EUA | "Negative GDP growth in 2025?" | ~1.5% |
| Guerra Ucrânia | "Ceasefire by 2026?" | ~85% risco (invertido) |
| China-Taiwan | "China invade Taiwan by 2026?" | ~12.5% |
| Inflação Brasil | "Inflation below 5.5%?" | ~0% risco (invertido) |
| Clima Extremo | "Hottest year on record?" | ~0.3% |

*Probabilidades atualizadas em tempo real*

---

## 🌐 Internacionalização

O dashboard suporta 3 idiomas:
- 🇧🇷 Português (padrão)
- 🇺🇸 English
- 🇪🇸 Español

O horário exibido é **local do usuário** (`toLocaleTimeString()`).

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | UI moderna com hooks |
| Vite | 6 | Build tool |
| Tailwind CSS | CDN | Styling |
| Express | 5 | Backend HTTP |
| Axios | 1.x | Cliente HTTP |
| Recharts | 3.x | Gráficos |
| pytrends | 4.9 | Google Trends API |
| Google Gemini | 2.0 Flash | LLM para insights |
| Google Cloud Run | - | Serverless deploy |

---

## 📄 Licença

MIT License - Konzup Hub © 2026

---

## 🤝 Contribuição

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

**Desenvolvido por [Konzup Hub](https://konzup.com)** 🚀
