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

### Riscos Monitorados

| Categoria | Exemplos |
|-----------|----------|
| **Geopolítica** | Recessão EUA, Conflitos (Ucrânia, China-Taiwan), Instabilidade Europa |
| **Câmbio** | Inflação Brasil, Inflação EUA |
| **Clima** | Eventos climáticos extremos |
| **Custo Aéreo** | Preços de combustível de aviação |

---

## 🧮 O Algoritmo: Como Funciona

O Konzup Radar cruza **duas fontes de dados poderosas** para gerar probabilidades de risco:

### Fórmula Simplificada

```
Risco Final = Probabilidade Polymarket (70%) + Índice Google Trends (30%)
```

### Fontes de Dados

#### 1. Polymarket (Peso 70%) - "A Aposta do Mercado"

**O que é:** Plataforma de mercados de previsão onde pessoas apostam dinheiro real em eventos futuros.

**Por que funciona:** O dinheiro real torna as probabilidades mais robustas - pessoas não apostam em algo que não acreditam.

**Como usamos:** Extraímos a probabilidade "YES" de eventos relevantes:
- `"Negative GDP growth in 2025?"` → 1.8% YES = baixo risco de recessão
- `"Russia x Ukraine ceasefire by 2026?"` → 44.5% YES → invertemos → 55.5% risco de guerra
- `"Brazil inflation below 5.5%?"` → 99.85% YES → invertemos → 0.15% risco de inflação alta

**API:** `https://gamma-api.polymarket.com/events` (gratuita, sem chave necessária)

#### 2. Google Trends (Peso 30%) - "A Intenção de Busca"

**O que é:** Volume de buscas no Google por termos específicos (índice 0-100).

**Por que funciona:** Reflete preocupação e interesse público. Um pico em "passagem aérea cara" pode indicar problema antes dos números oficiais.

**Como usamos:** Crawler Python (`pytrends`) que coleta dados dos últimos 30 dias para cada termo de risco.

**Crawler:** `scripts/googleTrends.py` usando biblioteca `pytrends==4.9.2`

### Exemplo Prático

```
Cenário: Operadora de turismo avaliando riscos para Europa

Polymarket diz:
  "Russia x Ukraine ceasefire by end of 2026?" → 44.5% SIM
  Invertendo: 55.5% chance de guerra continuar

Google Trends mostra:
  "ukraine war europe travel" → Índice 45 (elevado)

Resultado Konzup Radar:
  Risco = (55.5 × 0.7) + (45 × 0.3) = 38.85% + 13.5% = 52.35%
  
Interpretação: Risco MÉDIO-ALTO para operações na Europa Oriental
```

---

## 🏗️ Arquitetura Técnica

### Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Node.js (Express) - Proxy para APIs
- **Crawler:** Python 3 (pytrends) - Google Trends
- **AI:** Google Gemini 2.0 Flash - Insights em linguagem natural
- **Deploy:** Google Cloud Run
- **Analytics:** Google Analytics (G-CBVVY75WZ0)

### Estrutura de Arquivos

```
konzup-radar/
├── App.tsx                 # Componente principal React
├── components/
│   └── RiskCard.tsx        # Card de risco individual
├── services/
│   ├── dataService.ts      # Integração Polymarket + Trends
│   └── geminiService.ts    # Integração Gemini AI
├── scripts/
│   └── googleTrends.py     # Crawler Python para Trends
├── server.js               # Backend Express (proxy + API)
├── Dockerfile              # Container para Cloud Run
└── translations.ts         # i18n (PT/EN/ES)
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

### Via Cloud Build

```bash
# Usando cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY=sua_chave
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

- **GEMINI_API_KEY** nunca é exposta no frontend - todas as chamadas passam pelo backend
- **Input sanitization** no endpoint de Trends (previne command injection)
- **CORS** configurado para ambiente de produção
- **LGPD compliant** - usa apenas dados públicos e anonimizados

---

## 📈 Métricas Monitoradas (Janeiro 2026)

| Métrica | Fonte Polymarket | Prob. Atual |
|---------|------------------|-------------|
| Recessão EUA | "Negative GDP growth in 2025?" | ~1.8% |
| Guerra Ucrânia | "Russia x Ukraine ceasefire by 2026?" | ~55% (invertido) |
| China-Taiwan | "Will China invade Taiwan by 2026?" | ~12.5% |
| Inflação Brasil | "Brazil inflation below 5.50%?" | ~0.15% (invertido) |
| Inflação EUA | "Will inflation reach 5% in 2025?" | ~0.25% |
| Clima Extremo | "Will 2025 be hottest year?" | ~0.2% |

*Probabilidades são atualizadas em tempo real do Polymarket*

---

## 🛠️ Tecnologias

- **React 19** - UI moderna com hooks
- **Vite 6** - Build tool rápido
- **Tailwind CSS** - Styling utilitário
- **Recharts** - Gráficos de área
- **Express 5** - Backend HTTP
- **Axios** - Cliente HTTP
- **pytrends 4.9** - Google Trends unofficial API
- **Google Gemini 2.0** - LLM para insights
- **Google Cloud Run** - Serverless containers

---

## 📄 Licença

MIT License - Konzup Hub © 2026

---

## 🤝 Contribuição

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

**Desenvolvido por [Konzup Hub](https://konzup.com)** 🚀
