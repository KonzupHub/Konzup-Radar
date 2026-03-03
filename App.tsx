
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Radar, Clock, RefreshCw, ChevronDown, ArrowLeft, Scale, Lock, TrendingUp, BarChart3, Globe } from 'lucide-react';
import { RiskMetric, PredictionData } from './types';
import { fetchRiskMetrics } from './services/dataService';
import { getKonzupVerdict } from './services/geminiService';
import RiskCard from './components/RiskCard';
import InfoModal from './components/InfoModal';
import { Language, translations } from './translations';

const App: React.FC = () => {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lang, setLang] = useState<Language>('pt');
  const [currentView, setCurrentView] = useState<'dashboard' | 'about' | 'privacy' | 'terms'>('dashboard');
  
  const [infoModal, setInfoModal] = useState<{ open: boolean, title: string, content: string }>({ 
    open: false, title: '', content: '' 
  });

  const t = translations[lang];

  const loadData = useCallback(async (currentLang: Language) => {
    setIsRefreshing(true);
    try {
      const result = await fetchRiskMetrics();
      
      setData({
        ...result,
        metrics: result.metrics.map(m => ({ ...m, isLoadingVerdict: true }))
      });

      result.metrics.forEach(async (metric) => {
        const verdict = await getKonzupVerdict(metric, currentLang);
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            metrics: prev.metrics.map(m => 
              m.id === metric.id ? { ...m, verdict, isLoadingVerdict: false } : m
            )
          };
        });
      });

    } catch (error) {
      console.error("Dashboard error", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(lang);
  }, [lang, loadData]);

  const openInfo = (title: string, content: string) => setInfoModal({ open: true, title, content });

  // Calculate dynamic Intention Index (based on trends)
  const calculateIntentionIndex = (): string => {
    if (!data?.metrics || data.metrics.length === 0) return '+0.0%';
    
    let trendScore = 0;
    data.metrics.forEach(m => {
      if (m.trend === 'up') trendScore += 1;
      else if (m.trend === 'down') trendScore -= 1;
      // stable = 0
    });
    
    // Convert to percentage based on number of metrics
    const percentage = (trendScore / data.metrics.length) * 15; // Scale to reasonable range
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  // Calculate dynamic Confidence Index (inverse of volatility)
  const calculateConfidenceIndex = (): string => {
    if (!data?.metrics || data.metrics.length === 0) return '50.0';
    
    let volatilityScore = 0;
    data.metrics.forEach(m => {
      if (m.volatility === 'high') volatilityScore += 3;
      else if (m.volatility === 'moderate') volatilityScore += 2;
      else volatilityScore += 1; // low
    });
    
    // Convert to confidence (inverse) - scale 0-100
    const avgVolatility = volatilityScore / data.metrics.length;
    const confidence = 100 - (avgVolatility * 20); // Higher volatility = lower confidence
    return Math.max(0, Math.min(100, confidence)).toFixed(1);
  };

  // Dynamic market summary based on confidence
  const getMarketSummary = (): string => {
    const confidence = parseFloat(calculateConfidenceIndex());
    const labels = {
      pt: { stable: 'Mercado de Turismo 2026: Cenário Estável', moderate: 'Mercado de Turismo 2026: Atenção Moderada', volatile: 'Mercado de Turismo 2026: Alerta Volátil' },
      en: { stable: '2026 Tourism Market: Stable Scenario', moderate: '2026 Tourism Market: Moderate Alert', volatile: '2026 Tourism Market: Volatile Alert' },
      es: { stable: 'Mercado Turístico 2026: Escenario Estable', moderate: 'Mercado Turístico 2026: Alerta Moderada', volatile: 'Mercado Turístico 2026: Alerta Volátil' }
    };
    if (confidence > 60) return labels[lang].stable;
    if (confidence > 40) return labels[lang].moderate;
    return labels[lang].volatile;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f1729]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full animate-spin border-t-purple-500"></div>
          <Radar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 w-6 h-6" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Konzup Radar</h1>
          <p className="text-sm text-slate-500 font-mono">Carregando dados preditivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1729] text-slate-200">
      
      <InfoModal 
        isOpen={infoModal.open} 
        onClose={() => setInfoModal({ ...infoModal, open: false })} 
        title={infoModal.title} 
        content={infoModal.content} 
      />

      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-20 bg-[#0f1729]/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="bg-[#ab30ff] p-2 rounded-lg">
              <Radar className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">KONZUP <span className="text-cyan-400 text-xs tracking-[0.2em]">RADAR</span></h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-6">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-slate-400 uppercase tracking-tighter">{new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
              onClick={() => setCurrentView('about')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
           >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase">{t.howItWorks}</span>
           </button>

           <div className="relative flex items-center">
             <select 
               value={lang}
               onChange={(e) => setLang(e.target.value as Language)}
               className="bg-white/5 border border-white/10 text-xs font-bold text-slate-300 rounded-lg px-3 py-2 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase outline-none pr-8"
             >
               <option value="pt" className="bg-[#0f1729]">PT</option>
               <option value="en" className="bg-[#0f1729]">EN</option>
               <option value="es" className="bg-[#0f1729]">ES</option>
             </select>
             <ChevronDown className="w-3 h-3 text-slate-500 absolute right-3 pointer-events-none" />
           </div>

           <button 
             onClick={() => loadData(lang)}
             disabled={isRefreshing}
             className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
           >
             <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
             <span className="text-xs font-bold uppercase hidden sm:inline">{t.refreshData}</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="p-6 lg:p-10 overflow-y-auto flex-1">
          {currentView === 'dashboard' ? (
            <>
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 uppercase">{t.monitorTitle}</h2>
                <p className="text-slate-400 max-w-2xl">{t.monitorSub}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                {data?.metrics.map((metric) => (
                  <RiskCard key={metric.id} metric={metric} lang={lang} onInfoClick={openInfo} />
                ))}
              </div>

              <div className="mt-12 glass rounded-2xl p-8 border-cyan-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm font-bold uppercase text-cyan-400 tracking-widest">{t.sentimentScore}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{getMarketSummary()}</h3>
                      <p className="text-slate-400 mt-1">{t.marketSummarySub}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.intentionIndex}</div>
                        <div className={`text-2xl font-mono font-bold ${calculateIntentionIndex().startsWith('-') ? 'text-red-400' : 'text-cyan-400'}`}>
                          {calculateIntentionIndex()}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.confidenceIndex}</div>
                        <div className={`text-2xl font-mono font-bold ${parseFloat(calculateConfidenceIndex()) > 60 ? 'text-emerald-400' : parseFloat(calculateConfidenceIndex()) > 40 ? 'text-amber-500' : 'text-red-400'}`}>
                          {calculateConfidenceIndex()}
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </>
          ) : currentView === 'about' ? (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8 font-bold uppercase text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> {t.backButton}
              </button>

              <h2 className="text-4xl font-bold text-white mb-10 border-b border-white/10 pb-6 uppercase tracking-tight">
                {t.methodologyTitle}
              </h2>

              <div className="space-y-12">
                <section className="glass p-8 rounded-2xl border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Radar className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{t.projectTitle}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    {t.projectDesc}
                  </p>
                </section>

                {/* Algorithm Explanation */}
                <section className="glass p-8 rounded-2xl border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{t.algorithmTitle}</h3>
                  </div>
                  <div className="text-slate-300 leading-relaxed space-y-6">
                    <p>{t.algorithmDesc}</p>
                    
                    {/* Formula Box */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-6 rounded-xl border border-purple-500/20">
                      <p className="text-lg font-bold text-white mb-4">{t.crossingFormula}</p>
                      <p className="text-2xl font-mono font-bold text-cyan-400">Risk = (Polymarket × 70%) + (Trends × 30%)</p>
                    </div>

                    {/* Two columns explanation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="font-bold text-white">{t.polymarketWeight}</span>
                        </div>
                        <ul className="text-slate-400 space-y-2 text-sm">
                          <li>• {t.polyBullet1}</li>
                          <li>• {t.polyBullet2}</li>
                          <li>• {t.polyBullet3}</li>
                          <li>• <strong className="text-cyan-400">{t.polyBullet4}</strong></li>
                        </ul>
                      </div>
                      
                      <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                          <span className="font-bold text-white">{t.trendsWeight}</span>
                        </div>
                        <ul className="text-slate-400 space-y-2 text-sm">
                          <li>• {t.trendsBullet1}</li>
                          <li>• {t.trendsBullet2}</li>
                          <li>• {t.trendsBullet3}</li>
                          <li>• <strong className="text-cyan-400">{t.trendsBullet4}</strong></li>
                        </ul>
                      </div>
                    </div>

                    {/* Practical Example */}
                    <div className="bg-amber-500/10 p-6 rounded-xl border border-amber-500/20">
                      <p className="font-bold text-amber-400 mb-3">📊 {t.practicalExample}</p>
                      <div className="space-y-2 text-slate-300">
                        <p>• {t.examplePoly}</p>
                        <p>• {t.exampleTrends}</p>
                        <p className="mt-3 pt-3 border-t border-amber-500/20">
                          <strong className="text-red-400">→ {t.exampleResult}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Important Note */}
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <p className="text-red-400 text-sm">
                        <strong>⚠️ {t.importantNote}</strong> {t.importantNoteDesc}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Indices Explanation Section */}
                <section className="glass p-8 rounded-2xl border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{t.indicesTitle}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{t.indicesDesc}</p>
                </section>

                {/* Dynamic Market Summary Section */}
                <section className="glass p-8 rounded-2xl border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                      <Shield className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{t.confidenceExplainTitle}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-4">{t.confidenceExplainDesc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        <span className="font-bold text-emerald-400">{t.confidenceStable}</span>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <span className="font-bold text-amber-400">{t.confidenceModerate}</span>
                      </div>
                    </div>
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="font-bold text-red-400">{t.confidenceVolatile}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Brazil/LATAM Indicators Section */}
                <section className="glass p-8 rounded-2xl border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <Globe className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{t.brasilLatamTitle}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{t.brasilLatamDesc}</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-white/5 p-8 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-cyan-500/20 rounded-xl">
                        <Lock className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{t.dataTitle}</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {t.dataDesc}
                    </p>
                  </section>

                  <section className="bg-white/5 p-8 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <Scale className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase">{t.disclaimerTitle}</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed italic">
                      {t.disclaimerDesc}
                    </p>
                  </section>
                </div>
              </div>
            </div>
          ) : currentView === 'privacy' ? (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8 font-bold uppercase text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> {t.backButton}
              </button>
              <h2 className="text-4xl font-bold text-white mb-10 border-b border-white/10 pb-6 uppercase tracking-tight">
                Política de Privacidade
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="glass p-8 rounded-2xl border-white/10 space-y-6 text-slate-300">
                  <p><strong>Última atualização:</strong> Março de 2026</p>
                  
                  <h3 className="text-xl font-bold text-white">1. Coleta de Dados</h3>
                  <p>O Konzup Radar <strong>não coleta dados pessoais</strong> dos usuários. Não solicitamos nome, e-mail, CPF ou qualquer informação identificável. Utilizamos apenas cookies técnicos essenciais para o funcionamento do site.</p>
                  
                  <h3 className="text-xl font-bold text-white">2. Dados Utilizados</h3>
                  <p>As informações exibidas no dashboard são obtidas exclusivamente de fontes públicas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Polymarket (mercados de previsão públicos)</li>
                    <li>Google Trends (índices de busca agregados)</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold text-white">3. LGPD - Lei Geral de Proteção de Dados</h3>
                  <p>Em conformidade com a Lei nº 13.709/2018 (LGPD), informamos que este site opera sem tratamento de dados pessoais. Caso você tenha dúvidas sobre privacidade, entre em contato: <a href="mailto:privacidade@konzup.com" className="text-cyan-400 hover:underline">privacidade@konzup.com</a></p>
                  
                  <h3 className="text-xl font-bold text-white">4. Cookies e Analytics</h3>
                  <p>Utilizamos Google Analytics para entender o tráfego do site de forma agregada e anônima. Você pode desabilitar cookies nas configurações do seu navegador.</p>
                  
                  <h3 className="text-xl font-bold text-white">5. Alterações</h3>
                  <p>Esta política pode ser atualizada periodicamente. Recomendamos verificar esta página regularmente.</p>
                </div>
              </div>
            </div>
          ) : currentView === 'terms' ? (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8 font-bold uppercase text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> {t.backButton}
              </button>
              <h2 className="text-4xl font-bold text-white mb-10 border-b border-white/10 pb-6 uppercase tracking-tight">
                Termos de Uso
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="glass p-8 rounded-2xl border-white/10 space-y-6 text-slate-300">
                  <p><strong>Última atualização:</strong> Março de 2026</p>
                  
                  <h3 className="text-xl font-bold text-white">1. Aceitação dos Termos</h3>
                  <p>Ao acessar o Konzup Radar, você concorda com estes termos de uso. Se não concordar, não utilize o serviço.</p>
                  
                  <h3 className="text-xl font-bold text-white">2. Natureza das Informações</h3>
                  <p>As informações apresentadas neste site são <strong>indicadores estatísticos e probabilísticos</strong>, baseados em dados públicos de mercados de previsão e tendências de busca. <strong>NÃO CONSTITUEM:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Aconselhamento financeiro ou de investimento</li>
                    <li>Garantia de eventos futuros</li>
                    <li>Recomendação de compra ou venda</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold text-white">3. Isenção de Responsabilidade</h3>
                  <p>A Konzup Predict Ltd. não se responsabiliza por decisões tomadas com base nas informações exibidas. Todo investimento envolve riscos e o usuário deve fazer sua própria análise.</p>
                  
                  <h3 className="text-xl font-bold text-white">4. Propriedade Intelectual</h3>
                  <p>Todo o conteúdo, design e código do Konzup Radar são propriedade da Konzup Predict Ltd. É proibida a reprodução sem autorização.</p>
                  
                  <h3 className="text-xl font-bold text-white">5. Disponibilidade</h3>
                  <p>O serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta ou ausência de erros.</p>
                  
                  <h3 className="text-xl font-bold text-white">6. Contato</h3>
                  <p>Para dúvidas sobre estes termos: <a href="mailto:legal@konzup.com" className="text-cyan-400 hover:underline">legal@konzup.com</a></p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-mono text-slate-500 uppercase">
            <a href="https://konzup.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors font-bold">
              {t.copyright}
            </a>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <button onClick={() => setCurrentView('privacy')} className="hover:text-cyan-400 transition-colors">
                Política de Privacidade
              </button>
              <button onClick={() => setCurrentView('terms')} className="hover:text-cyan-400 transition-colors">
                Termos de Uso
              </button>
              <span className="hidden md:inline">2026</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
