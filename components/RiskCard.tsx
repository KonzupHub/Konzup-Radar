
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RiskMetric } from '../types';
import { COLORS } from '../constants';
import { Language, translations, categoryTranslations, riskDescTranslations } from '../translations';

interface RiskCardProps {
  metric: RiskMetric;
  lang: Language;
  onInfoClick: (title: string, content: string) => void;
}

// Generate detailed info content for the popup
function generateInfoContent(metric: RiskMetric, lang: Language): string {
  const trendText = {
    pt: { up: 'Alta', down: 'Baixa', stable: 'Estável' },
    en: { up: 'Rising', down: 'Falling', stable: 'Stable' },
    es: { up: 'Alta', down: 'Baja', stable: 'Estable' }
  };

  const riskLevel = metric.probability > 70 ? 
    (lang === 'pt' ? 'ALTO' : lang === 'es' ? 'ALTO' : 'HIGH') :
    metric.probability >= 30 ? 
    (lang === 'pt' ? 'MÉDIO' : lang === 'es' ? 'MEDIO' : 'MEDIUM') :
    (lang === 'pt' ? 'BAIXO' : lang === 'es' ? 'BAJO' : 'LOW');

  if (lang === 'pt') {
    return `⚠️ IMPORTANTE: Este é um INDICADOR DE PROBABILIDADE, não um fato consumado.

📊 Probabilidade atual: ${metric.probability}%
📈 Tendência: ${trendText.pt[metric.trend]}
🎯 Nível de risco: ${riskLevel}

📐 FÓRMULA:
Risk = (Polymarket × 70%) + (Google Trends × 30%)

📡 FONTE DOS DADOS:
• Polymarket (70%): Mercado de previsões com dinheiro real. Reflete o consenso do mercado.
• Google Trends (30%): Volume de buscas nos últimos 30 dias. Reflete o "humor" do mercado.
• Gemini AI: Gera o insight textual de cada card.

💡 COMO INTERPRETAR:
• Probabilidade ALTA (>70%): Alta chance de ocorrer.
• Probabilidade BAIXA (<30%): Mercado considera improvável.

🔄 Dados atualizados em tempo real das APIs.`;
  } else if (lang === 'es') {
    return `⚠️ IMPORTANTE: Este es un INDICADOR DE PROBABILIDAD, no un hecho consumado.

📊 Probabilidad actual: ${metric.probability}%
📈 Tendencia: ${trendText.es[metric.trend]}
🎯 Nivel de riesgo: ${riskLevel}

📐 FÓRMULA:
Risk = (Polymarket × 70%) + (Google Trends × 30%)

📡 FUENTE DE DATOS:
• Polymarket (70%): Mercado de predicciones con dinero real.
• Google Trends (30%): Volumen de búsquedas en los últimos 30 días.
• Gemini AI: Genera el insight textual de cada card.

🔄 Datos actualizados en tiempo real.`;
  } else {
    return `⚠️ IMPORTANT: This is a PROBABILITY INDICATOR, not a confirmed fact.

📊 Current probability: ${metric.probability}%
📈 Trend: ${trendText.en[metric.trend]}
🎯 Risk level: ${riskLevel}

📐 FORMULA:
Risk = (Polymarket × 70%) + (Google Trends × 30%)

📡 DATA SOURCES:
• Polymarket (70%): Prediction market with real money bets.
• Google Trends (30%): Search volume over the last 30 days.
• Gemini AI: Generates the text insight for each card.

🔄 Data updated in real-time from APIs.`;
  }
}

const RiskCard: React.FC<RiskCardProps> = ({ metric, lang, onInfoClick }) => {
  const t = translations[lang];
  const isHigh = metric.probability > 70;
  const isMid = metric.probability >= 30 && metric.probability <= 70;
  const statusColor = isHigh ? COLORS.riskHigh : isMid ? COLORS.riskMid : COLORS.riskLow;
  
  // Translate category and risk description
  const translatedCategory = categoryTranslations[lang][metric.category as keyof typeof categoryTranslations['pt']] || metric.category;
  const translatedRiskDesc = riskDescTranslations[lang][metric.riskDescription as keyof typeof riskDescTranslations['pt']] || metric.riskDescription;

  const TrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;      // Risco subindo = ruim = vermelho
      case 'down': return <TrendingDown className="w-4 h-4 text-emerald-500" />; // Risco descendo = bom = verde
      default: return <Minus className="w-4 h-4 text-amber-500" />;           // Estável = atenção = amarelo
    }
  };

  // Check if insight is valid (not an error or config message)
  const hasValidInsight = () => {
    if (metric.isLoadingVerdict) return true; // Still loading
    if (!metric.verdict) return false;
    
    const invalidPhrases = [
      'Configure GEMINI_API_KEY',
      'GEMINI_API_KEY',
      'Conexão AI em modo de espera',
      'AI Offline',
      'IA Offline',
      '.env'
    ];
    
    return !invalidPhrases.some(phrase => metric.verdict?.includes(phrase));
  };

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 left-0 h-1 bg-gradient-to-r" style={{ width: `${metric.probability}%`, backgroundColor: statusColor }}></div>
      
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">
            {translatedCategory}
          </span>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {translatedRiskDesc}
            <button onClick={() => onInfoClick(translatedRiskDesc, generateInfoContent(metric, lang))}>
              <Info className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />
            </button>
          </h3>
        </div>
        <div className="bg-white/5 p-2 rounded-lg">
          {isHigh ? <AlertTriangle className="text-red-500 w-5 h-5" /> : 
           isMid ? <Zap className="text-amber-500 w-5 h-5" /> : 
           <ShieldCheck className="text-emerald-500 w-5 h-5" />}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold font-mono text-white tracking-tighter">
          {metric.probability}%
        </span>
        <div className="flex flex-col">
          <TrendIcon />
          <span className="text-[10px] text-slate-400 uppercase font-mono">{t.probability}</span>
        </div>
      </div>

      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={metric.history}>
            <defs>
              <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={statusColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={statusColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={statusColor} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#gradient-${metric.id})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Only show insight section if we have valid data */}
      {hasValidInsight() && (
        <div className="mt-2 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#ab30ff] animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#ab30ff] uppercase tracking-widest">{t.verdictTitle}</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium italic">
            {metric.isLoadingVerdict ? (
              <span className="flex items-center gap-2 animate-pulse text-slate-500">
                {t.processing}
              </span>
            ) : (
              `"${metric.verdict}"`
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskCard;
