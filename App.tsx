
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Radar, Globe, BarChart3, Clock, RefreshCw, Cpu, Menu, ChevronDown, X, ArrowLeft, Info, Scale, Lock } from 'lucide-react';
import { RiskMetric, PredictionData } from './types';
import { fetchRiskMetrics } from './services/dataService';
import { getKonzupVerdict } from './services/geminiService';
import RiskCard from './components/RiskCard';
import InfoModal from './components/InfoModal';
import { COLORS } from './constants';
import { Language, translations } from './translations';

const App: React.FC = () => {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lang, setLang] = useState<Language>('pt');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'about'>('dashboard');
  
  // Modal states for quick context (kept for smaller UI interactions if needed)
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const openInfo = (title: string, content: string) => setInfoModal({ open: true, title, content });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f1729]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full animate-spin border-t-purple-500"></div>
          <Radar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 w-6 h-6" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Konzup Radar</h1>
          <p className="text-sm text-slate-500 font-mono">Initializing Predictive Engine 2026...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f1729] text-slate-200">
      
      <InfoModal 
        isOpen={infoModal.open} 
        onClose={() => setInfoModal({ ...infoModal, open: false })} 
        title={infoModal.title} 
        content={infoModal.content} 
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-[#0f1729] lg:bg-transparent lg:static p-6 flex flex-col gap-8 shrink-0 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#ab30ff] p-2 rounded-lg">
              <Radar className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">KONZUP<br/><span className="text-cyan-400 text-xs tracking-[0.3em]">{t.radar}</span></h1>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${currentView === 'dashboard' ? 'bg-white/5 text-white border border-white/10' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Globe className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold">{t.globalRisks}</span>
          </button>
          <button 
            onClick={() => { setCurrentView('about'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${currentView === 'about' ? 'bg-white/5 text-white border border-white/10' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Info className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold">{t.howItWorks}</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] uppercase font-bold text-slate-500">{t.nodeStatus}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono leading-tight uppercase">
            Cluster: SP-01-PRD<br/>
            Engine: Gemini-3-Flash<br/>
            Region: LATAM-HQ
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-20 bg-[#0f1729]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
                <Menu className="w-6 h-6 text-slate-300" />
             </button>
             <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-cyan-400" />
               <span className="text-sm font-mono text-slate-400 uppercase tracking-tighter">Janeiro 2026 | 09:42:15 GMT-3</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setCurrentView('about')}
                className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
             >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase">{t.predictiveAnalytics}</span>
             </button>

             <div className="relative flex items-center">
               <select 
                 value={lang}
                 onChange={(e) => setLang(e.target.value as Language)}
                 className="bg-white/5 border border-white/10 text-xs font-bold text-slate-300 rounded-lg px-3 py-1.5 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase outline-none pr-8"
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

        <div className="p-6 lg:p-10 overflow-y-auto">
          {currentView === 'dashboard' ? (
            <>
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-4xl font-bold text-white tracking-tight mb-2 uppercase">{t.monitorTitle}</h2>
                <p className="text-slate-400 max-w-2xl">{t.monitorSub}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
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
                      <h3 className="text-2xl font-bold text-white">{t.marketSummary}</h3>
                      <p className="text-slate-400 mt-1">{t.marketSummarySub}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.intentionIndex}</div>
                        <div className="text-2xl font-mono font-bold text-cyan-400">+12.4%</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.confidenceIndex}</div>
                        <div className="text-2xl font-mono font-bold text-amber-500">64.2</div>
                      </div>
                    </div>
                 </div>
              </div>
            </>
          ) : (
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
          )}

          <footer className="mt-16 text-[10px] font-mono text-slate-600 flex flex-wrap justify-between border-t border-white/5 pt-4 uppercase">
            <a href="https://konzup.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors font-bold">
              {t.copyright}
            </a>
            <div className="flex gap-6">
              <span>JANUARY 2026 EDITION</span>
              <span>KONZUP RADAR PRO</span>
            </div>
          </footer>
        </div>
      </main>
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default App;
