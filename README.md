# 📡 Konzup Radar

**Dashboard de Inteligência Preditiva para o Mercado de Turismo**

![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-proprietary-blue)
![Version](https://img.shields.io/badge/version-1.0.0-purple)

---

## 🎯 O que é?

O **Konzup Radar** é uma ferramenta de inteligência preditiva que monitora **riscos e oportunidades** para o mercado de turismo. Ele cruza dados de duas fontes públicas para gerar **indicadores de probabilidade** que ajudam gestores a tomar decisões mais informadas.

### Para quem é?

- 🏢 **Operadoras de Turismo** - Precificação de pacotes
- ✈️ **Agências Corporativas (TMCs)** - Duty of Care e gestão de risco
- 🏨 **Hotéis e Resorts** - Planejamento de demanda
- 🏛️ **Governos e Secretarias de Turismo** - Políticas públicas baseadas em dados

---

## 🧮 O Algoritmo

### Fórmula de Cruzamento

```
Risco Final = (Probabilidade Polymarket × 70%) + (Índice Google Trends × 30%)
```

### Por que esses pesos?

| Fonte | Peso | Justificativa |
|-------|------|---------------|
| **Polymarket** | 70% | Apostas com dinheiro real = maior confiabilidade |
| **Google Trends** | 30% | Volume de buscas = "humor" do mercado |

### Exemplo Prático

```
Cenário: Monitoramento de Custos Aéreos

📊 Polymarket diz: 75% de chance de petróleo > $90/barril
🔍 Google Trends: +20% de buscas por "passagem aérea cara"

Cálculo:
→ (75 × 0.7) + (20 × 0.3) = 52.5 + 6 = 58.5%

Resultado: Alerta AMARELO para custos aéreos
```

---

## 📈 O que é cada métrica?

### Brent Crude (Petróleo)

O **Brent** é o preço de referência internacional do petróleo, cotado em dólares por barril. Ele impacta diretamente:
- Preço do combustível de aviação (QAV)
- Custo das passagens aéreas
- Margem das operadoras de turismo

**Por que monitoramos:** Se o Brent passa de $90/barril, companhias aéreas aumentam preços.

### Probabilidades do Polymarket

O Polymarket é um **mercado de previsão** onde pessoas apostam dinheiro real em eventos futuros. As probabilidades refletem:
- **0-30%**: Improvável (sinal verde)
- **30-70%**: Moderado (sinal amarelo)
- **70-100%**: Provável (sinal vermelho)

**Exemplo:** Se 75% das apostas dizem que haverá recessão nos EUA, o mercado acredita que é provável.

### Índice do Google Trends

O Google Trends mostra o **volume relativo de buscas** (0-100) para um termo:
- **0**: Nenhum interesse
- **50**: Interesse médio
- **100**: Pico de interesse

**Exemplo:** Se "greve aérea europa" sobe de 20 para 80, indica preocupação crescente.

---

## 🔌 Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                     radar.konzuphub.com                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js/Express)                  │
│                      server.js (Proxy)                       │
│                                                              │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │ /api/polymarket │          │  /api/trends    │           │
│  │   (Proxy HTTP)  │          │ (Executa Python)│           │
│  └────────┬────────┘          └────────┬────────┘           │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────┐
│   POLYMARKET API      │    │   GOOGLE TRENDS       │
│  gamma-api.polymarket │    │   (Pytrends Python)   │
│       .com/events     │    │                       │
│                       │    │   scripts/            │
│   API pública         │    │   googleTrends.py     │
│   Sem API key         │    │                       │
└───────────────────────┘    └───────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19.x | Interface do usuário |
| TypeScript | 5.8 | Tipagem estática |
| Tailwind CSS | 3.x | Estilização |
| Recharts | 3.6 | Gráficos |
| Lucide React | 0.562 | Ícones |
| Vite | 6.x | Build tool |

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20.x | Runtime |
| Express | 5.x | Servidor HTTP |
| Axios | 1.x | Requisições HTTP |
| Python | 3.x | Crawler Google Trends |
| Pytrends | 4.9.2 | Biblioteca Google Trends |

### Infraestrutura
| Serviço | Uso |
|---------|-----|
| Google Cloud Run | Hospedagem (serverless) |
| Cloudflare | DNS e CDN |
| GitHub | Repositório de código |

---

## 📡 APIs e Crawlers

### 1. Polymarket Gamma API

```
Endpoint: https://gamma-api.polymarket.com/events
Método: GET
Autenticação: Nenhuma (API pública)
```

**O que retorna:**
```json
{
  "id": "12345",
  "title": "Will oil prices exceed $90 by March 2026?",
  "outcomePrices": "[0.75, 0.25]",  // 75% Yes, 25% No
  "volume": "1500000"
}
```

### 2. Google Trends (Pytrends)

**Arquivo:** `scripts/googleTrends.py`

```python
# Biblioteca usada
from pytrends.request import TrendReq

# Configuração
pytrends = TrendReq(hl='en-US', tz=360)
pytrends.build_payload(
    kw_list=['oil prices'],
    timeframe='today 1-m'  # Últimos 30 dias
)

# Retorna índice 0-100
interest_df = pytrends.interest_over_time()
```

**O que retorna:**
```json
{
  "keyword": "oil prices",
  "currentIndex": 72,
  "history": [
    {"date": "2026-01-01", "value": 65},
    {"date": "2026-01-02", "value": 68},
    ...
  ],
  "isReal": true
}
```

### 3. Gemini AI (Google)

```
Modelo: gemini-3-flash-preview
Uso: Gerar insights em linguagem natural
Autenticação: API Key (via variável de ambiente)
```

---

## 📊 Indicadores Monitorados

| ID | Nome | Categoria | Impacto no Turismo |
|----|------|-----------|-------------------|
| `oil-brent-90` | Brent > $90/bbl | Custo Aéreo | Aumento de passagens |
| `airline-strike` | Greves Aéreas | Custo Aéreo | Cancelamentos |
| `us-recession-2026` | Recessão EUA | Geopolítica | Queda de demanda |
| `europe-political` | Tensões Europa | Geopolítica | Instabilidade |
| `global-pandemic-new` | Nova Pandemia | Saúde Global | Restrições de viagem |
| `dollar-brazil` | Dólar > R$6,50 | Câmbio | Turismo emissivo caro |
| `euro-parity` | Euro/Dólar | Câmbio | Custo Europa |
| `extreme-weather` | Eventos Extremos | Clima | Destinos afetados |

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- Node.js 20+
- Python 3.9+
- npm ou yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/KonzupHub/Konzup-Radar.git
cd Konzup-Radar

# 2. Instale dependências Node.js
npm install

# 3. Instale dependências Python
pip install -r requirements-python.txt

# 4. Configure variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY

# 5. Execute o backend (terminal 1)
npm run server

# 6. Execute o frontend (terminal 2)
npm run dev

# 7. Acesse
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia frontend (Vite) |
| `npm run server` | Inicia backend (Express) |
| `npm run dev:full` | Inicia ambos (concurrently) |
| `npm run build` | Build de produção |

---

## 🌐 Deploy

### Google Cloud Run

```bash
# Build e deploy
gcloud run deploy konzup-radar \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=sua-chave"
```

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `GEMINI_API_KEY` | Sim | Chave da API do Google Gemini |
| `NODE_ENV` | Não | `development` ou `production` |
| `PORT` | Não | Porta do servidor (default: 3001) |

---

## 📁 Estrutura de Arquivos

```
konzup-radar/
├── App.tsx                 # Componente principal React
├── index.html              # HTML + Google Analytics
├── index.tsx               # Entry point React
├── types.ts                # Tipos TypeScript
├── translations.ts         # i18n (PT/EN/ES)
├── constants.tsx           # Cores e constantes
├── components/
│   ├── RiskCard.tsx        # Card de indicador
│   └── InfoModal.tsx       # Modal de informações
├── services/
│   ├── dataService.ts      # Integração APIs
│   └── geminiService.ts    # Integração Gemini AI
├── scripts/
│   └── googleTrends.py     # Crawler Python
├── server.js               # Backend Express (proxy)
├── Dockerfile              # Container para Cloud Run
├── package.json            # Dependências Node.js
├── requirements-python.txt # Dependências Python
└── .env.example            # Template de variáveis
```

---

## ⚠️ Avisos Importantes

### Disclaimer Legal

> As informações exibidas no Konzup Radar representam **TENDÊNCIAS** e **PROBABILIDADES** estatísticas baseadas em dados públicos. **NÃO CONSTITUEM**:
> - Garantias de eventos futuros
> - Aconselhamento financeiro ou de investimento
> - Recomendações de compra ou venda

### Limitações

1. **Polymarket** não tem mercados específicos de turismo - usamos proxies (petróleo, câmbio, etc.)
2. **Google Trends** pode bloquear requisições excessivas (erro 429) - implementamos cache
3. **Gemini AI** requer API key válida para gerar insights

---

## 📞 Contato

- **Site:** [konzup.com](https://konzup.com)
- **Email:** contato@konzup.com
- **Privacidade:** privacidade@konzup.com

---

## 📄 Licença

Este projeto é **proprietário** da Konzup Predict Ltd.  
Todos os direitos reservados © 2026.

---

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Konzup Radar" width="600">
  <br><br>
  <strong>Konzup Radar</strong> - Inteligência Preditiva para Turismo
</div>
