
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RiskMetric } from '../types';
import { COLORS } from '../constants';
import { Language, translations } from '../translations';

interface RiskCardProps {
  metric: RiskMetric;
  lang: Language;
  onInfoClick: (title: string, content: string) => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ metric, lang, onInfoClick }) => {
  const t = translations[lang];
  const isHigh = metric.probability > 70;
  const isMid = metric.probability >= 30 && metric.probability <= 70;
  const statusColor = isHigh ? COLORS.riskHigh : isMid ? COLORS.riskMid : COLORS.riskLow;

  const TrendIcon = () => {
    switch (metric.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-white/20">
      <div className="absolute top-0 left-0 h-1 bg-gradient-to-r" style={{ width: `${metric.probability}%`, backgroundColor: statusColor }}></div>
      
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">
            {metric.category}
          </span>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {metric.riskDescription}
            <button onClick={() => onInfoClick(metric.riskDescription, t.infoContent)}>
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
            `"${metric.verdict || t.verdictError}"`
          )}
        </p>
      </div>
    </div>
  );
};

export default RiskCard;
