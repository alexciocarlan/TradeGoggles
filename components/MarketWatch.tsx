
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getMarketWatchIntel, MarketTickers } from '../geminiService';
import { Language } from '../translations';
import { useAppContext } from '../AppContext';

interface MarketWatchProps {
  language: Language;
  tickers: MarketTickers | null;
  loadingTickers: boolean;
}

const MarketWatch: React.FC<MarketWatchProps> = ({ language, tickers, loadingTickers }) => {
  const { weeklyPreps } = useAppContext();
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'rVol' | 'heatIndex'>('rVol');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Get current week context
  const currentWeekContext = useMemo(() => {
    const d = new Date();
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const weekId = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    const prep = weeklyPreps[weekId];
    if (!prep) return "";
    return `Weekly Bias: ${prep.weeklyBias}. Price vs pWeek: ${prep.priceVsPWeek}. Weekly Narrative: ${prep.weeklyNarrative}.`;
  }, [weeklyPreps]);

  const fetchIntel = async (isManual = false) => {
    setLoading(true);
    try {
      // Pass the user's manual macro context to AI
      const data = await getMarketWatchIntel(currentWeekContext);
      if (data && Object.keys(data).length > 0) {
        setIntel(data);
        setLastSync(new Date());
      }
    } catch (e) {
      console.error("Failed to load market watch data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
  }, [currentWeekContext]); // Refetch if macro context changes

  const groupedVolumeStats = useMemo(() => {
    if (!intel?.volumeStats || !Array.isArray(intel.volumeStats)) return {};
    const groups: Record<string, any[]> = {};
    intel.volumeStats.forEach((s: any) => {
      const sector = s.sector || 'OTHER';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(s);
    });
    return groups;
  }, [intel]);

  const vixCurveData = useMemo(() => {
    if (!intel?.vixTermStructure) return [];
    return [
      { name: 'SPOT', val: intel.vixTermStructure.spot || 0 },
      { name: 'UX1', val: intel.vixTermStructure.m1 || 0 },
      { name: 'UX2', val: intel.vixTermStructure.m2 || 0 },
    ];
  }, [intel]);

  const gexValue = intel?.gammaExposure?.value || 0;
  const gexPercentage = ((gexValue + 100) / 200) * 100;

  const pcTotal = intel?.putCallRatio?.total || 0;
  const pcEquity = intel?.putCallRatio?.equity || 0;
  const pcSentiment = intel?.putCallRatio?.sentiment || 'Neutral';

  const getCellColor = (value: number, type: 'rVol' | 'heatIndex') => {
    const val = value || 0;
    if (type === 'rVol') {
      if (val > 200) return 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]';
      if (val > 150) return 'bg-blue-600 text-white';
      if (val > 100) return 'bg-blue-900/60 text-blue-200 border-blue-500/20';
      if (val > 80) return 'bg-slate-800 text-slate-400';
      return 'bg-slate-900/50 text-slate-600 border-slate-800/50';
    } else {
      if (val > 80) return 'bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]';
      if (val > 60) return 'bg-orange-900/60 text-orange-200 border-orange-500/20';
      if (val > 40) return 'bg-slate-800 text-slate-400';
      return 'bg-slate-900/50 text-slate-600 border-slate-800/50';
    }
  };

  const ColumnHeader = ({ title, sub }: { title: string, sub: string }) => (
    <div className="mb-6 pb-4 border-b border-slate-800/50">
      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub}</p>
    </div>
  );

  const HeaderTicker = ({ label, value, diff, loading }: { label: string, value?: number, diff?: number, loading: boolean }) => (
    <div className="flex flex-col border-r border-slate-800/50 px-6 last:border-r-0">
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
      {loading ? (
        <div className="h-4 w-16 bg-slate-800/50 rounded animate-pulse"></div>
      ) : (
        <div className="flex items-center space-x-2">
           <p className="text-sm font-black text-white tracking-tighter">
             {value?.toLocaleString(undefined, { minimumFractionDigits: (label === 'VIX' || label === 'DXY' ? 2 : 0) }) || '--'}
           </p>
           {diff !== undefined && diff !== 0 && (
             <span className={`text-[8px] font-black ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {diff > 0 ? '▲' : '▼'}
             </span>
           )}
        </div>
      )}
    </div>
  );

  if (loading && !intel) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Scanning Market Structure...</h2>
          <p className="text-xs text-slate-500 font-bold uppercase mt-2">Gemini AI is grounding real-time data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5">LIVE MARKET SCANNER</p>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">MARKET WATCH</h2>
           </div>
           
           <div className="flex items-center bg-slate-900/30 border border-slate-800/50 p-3 rounded-2xl shadow-inner">
              <HeaderTicker label="NQ FUTURES" value={tickers?.nqPrice} diff={tickers ? (tickers.nqPrice - tickers.nqSettlement) : 0} loading={loadingTickers} />
              <HeaderTicker label="ES FUTURES" value={tickers?.esPrice} diff={tickers ? (tickers.esPrice - tickers.esSettlement) : 0} loading={loadingTickers} />
              <HeaderTicker label="VIX INDEX" value={tickers?.vix} loading={loadingTickers} />
              <HeaderTicker label="DXY DOLLAR" value={tickers?.dxyCurrent} loading={loadingTickers} />
           </div>
        </div>

        <div className="flex items-center space-x-3">
            <button 
                onClick={() => fetchIntel(true)}
                disabled={loading}
                className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center"
            >
                <i className={`fas fa-sync-alt mr-2 ${loading ? 'fa-spin' : ''}`}></i>
                {loading ? 'Syncing...' : 'Force Refresh'}
            </button>
            <div className="bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 flex space-x-1 shadow-inner">
                <button 
                onClick={() => setViewType('rVol')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'rVol' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                Relative Volume
                </button>
                <button 
                onClick={() => setViewType('heatIndex')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'heatIndex' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                Heat Index
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* --- COLOANA 1: SENTIMENT --- */}
        <div className="space-y-8">
          <ColumnHeader title="SENTIMENT" sub="(Leading Indicators)" />
          
          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Gamma Exposure (GEX)</h4>
            <div className="space-y-6">
               <div className="relative h-12 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center px-4 overflow-hidden">
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-10"
                    style={{ left: `calc(${gexPercentage || 50}% - 12px)` }}
                  >
                     <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-xl border border-slate-200">
                        <i className={`fas ${gexValue >= 0 ? 'fa-plus text-blue-600' : 'fa-minus text-red-600'} text-[10px]`}></i>
                     </div>
                  </div>
                  <div className="w-full flex justify-between relative z-0 opacity-40">
                     <span className="text-[8px] font-black text-red-500 uppercase">Explosive</span>
                     <span className="text-[8px] font-black text-white">0</span>
                     <span className="text-[8px] font-black text-blue-500 uppercase">Sticky</span>
                  </div>
               </div>
               <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 relative group/gex">
                  <p className="text-[10px] text-white font-bold mb-1">
                    Regim: <span className={gexValue >= 0 ? 'text-blue-400' : 'text-red-400'}>{intel?.gammaExposure?.regime || 'NEUTRAL'}</span>
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium italic truncate cursor-help">
                    {intel?.gammaExposure?.description || 'Dealerii sunt neutri gama. Volatilitate conformă cu media.'}
                  </p>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/gex:block z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]">
                     <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Full GEX Intel</p>
                        <p className="text-[11px] text-slate-200 leading-relaxed italic">{intel?.gammaExposure?.description || 'Data unavailable.'}</p>
                        <div className="absolute top-full left-4 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VIX Term Structure</h4>
                  <span className={`text-[10px] font-black uppercase mt-1 inline-block ${intel?.vixTermStructure?.status === 'Contango' ? 'text-green-500' : 'text-red-500'}`}>
                    {intel?.vixTermStructure?.status || 'STABLE'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-600 uppercase">Spread UX1/UX2</p>
                  <p className="text-sm font-black text-white">{(intel?.vixTermStructure?.spreadPct || 0).toFixed(2)}%</p>
                </div>
             </div>
             <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vixCurveData}>
                    <defs>
                      <linearGradient id="vixGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={intel?.vixTermStructure?.status === 'Contango' ? "#10b981" : "#f43f5e"} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={intel?.vixTermStructure?.status === 'Contango' ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="val" stroke={intel?.vixTermStructure?.status === 'Contango' ? "#10b981" : "#f43f5e"} strokeWidth={3} fill="url(#vixGrad)" dot={{ r: 4, fill: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Put/Call Ratio (Inst.)</h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${pcSentiment === 'Bullish' ? 'bg-green-500/10 text-green-500' : pcSentiment === 'Bearish' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'}`}>
                   {pcSentiment.toUpperCase()}
                </span>
             </div>
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total PCR</p>
                   <p className="text-2xl font-black text-white">{pcTotal.toFixed(2)}</p>
                </div>
                <div className="text-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Equity PCR</p>
                   <p className="text-2xl font-black text-blue-400">{pcEquity.toFixed(2)}</p>
                </div>
             </div>
          </div>
        </div>

        {/* --- COLOANA 2: ACTIVITY --- */}
        <div className="space-y-8">
          <ColumnHeader title="ACTIVITY" sub="(Current Flow)" />

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden min-h-[480px]">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">RVOL Sector Heatmap</h4>
            <div className="space-y-6">
              {Object.keys(groupedVolumeStats).length > 0 ? Object.entries(groupedVolumeStats).map(([sector, tickers]: [string, any[]]) => (
                <div key={sector}>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 border-l border-blue-500 pl-2">{sector}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {tickers.map((s: any) => {
                      const val = viewType === 'rVol' ? s.rVol : s.heatIndex;
                      return (
                        <div key={s.ticker} className={`p-3 rounded-xl border transition-all duration-500 ${getCellColor(val, viewType)}`}>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-black">{s.ticker}</span>
                             {val > 150 && <i className="fas fa-bolt text-[8px] animate-pulse"></i>}
                          </div>
                          <p className="text-sm font-black tracking-tight">{viewType === 'rVol' ? `${val}%` : `${val}/100`}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : <p className="text-slate-600 text-xs text-center py-20 italic">No volume data found.</p>}
            </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Sector Rotation (ETF Perf.)</h4>
            <div className="space-y-4">
               {intel?.sectorRotation?.map((sector: any, idx: number) => (
                  <div key={idx} className="space-y-1 relative group/srot">
                     <div className="flex justify-between text-[10px] font-black uppercase cursor-help">
                        <span className="text-slate-300 truncate max-w-[120px] block">{sector.label}</span>
                        <span className={sector.performance >= 0 ? 'text-green-500' : 'text-red-500'}>{sector.performance >= 0 ? '+' : ''}{sector.performance}%</span>
                     </div>
                     <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full ${sector.performance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(sector.performance) * 20, 100)}%`, marginLeft: sector.performance < 0 ? 'auto' : '0' }}></div>
                     </div>
                     <div className="absolute bottom-full left-0 mb-2 hidden group-hover/srot:block z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-2xl">
                           <p className="text-[8px] font-black text-white uppercase whitespace-nowrap">{sector.label} Performance</p>
                           <div className="absolute top-full left-4 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* --- COLOANA 3: STRUCTURE --- */}
        <div className="space-y-8">
          <ColumnHeader title="STRUCTURE" sub="(Context & Macro)" />

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yield Curve (10Y-2Y)</h4>
               <span className={`text-[9px] font-black px-2 py-0.5 rounded ${intel?.yieldCurve?.status === 'Normal' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                  {(intel?.yieldCurve?.status || 'STABLE').toUpperCase()}
               </span>
            </div>
            <div className="flex flex-col items-center justify-center py-4">
               <p className={`text-5xl font-black tracking-tighter mb-2 ${(intel?.yieldCurve?.spread || 0) < 0 ? 'text-red-500' : 'text-white'}`}>
                  {(intel?.yieldCurve?.spread || 0).toFixed(3)}
               </p>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Spread Bps</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1">US10Y</p>
                  <p className="text-sm font-black text-white">{intel?.yieldCurve?.y10 || '--'}%</p>
               </div>
               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1">US02Y</p>
                  <p className="text-sm font-black text-white">{intel?.yieldCurve?.y02 || '--'}%</p>
               </div>
            </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fed Net Liquidity</h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${intel?.netLiquidity?.trend === 'Injected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {(intel?.netLiquidity?.trend || 'STABLE').toUpperCase()}
                </span>
             </div>
             <div className="text-center mb-8">
                <p className="text-3xl font-black text-white">${((intel?.netLiquidity?.totalNet || 0) / 1000).toFixed(2)}T</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Market Liquidity (Total)</p>
             </div>
             <div className="space-y-2 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/40">
                <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">FED Balance:</span>
                    <span className="text-white font-bold">${((intel?.netLiquidity?.fedBalanceSheet || 0) / 1000).toFixed(2)}T</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">TGA + RRP:</span>
                    <span className="text-red-400 font-bold">${(intel?.netLiquidity?.tga + (intel?.netLiquidity?.rrp || 0) || 0).toFixed(0)}B</span>
                </div>
             </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-8">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Economic Surprise Index</h4>
                <span className="text-[9px] font-black text-blue-500 uppercase">{intel?.economicSurpriseIndex?.trend || 'STABLE'}</span>
             </div>
             <div className="flex flex-col items-center justify-center py-6">
                <p className={`text-6xl font-black tracking-tighter ${(intel?.economicSurpriseIndex?.value || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {intel?.economicSurpriseIndex?.value || '0'}
                </p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4 italic">Macro Context</p>
             </div>
          </div>
        </div>

      </div>

      <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2.5rem] flex items-start space-x-6 relative overflow-hidden group">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <i className="fas fa-brain text-2xl"></i>
        </div>
        <div className="relative z-10">
            <h4 className="text-white font-black text-base uppercase tracking-widest mb-2">AI Market Intelligence Summary</h4>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
               {intel ? `Analiza curentă indică un regim de ${intel.gammaExposure?.regime || 'Neutral'} Gamma. 
               Activitatea cea mai intensă se observă în sectorul ${intel.sectorRotation?.sort((a:any, b:any)=>b.performance-a.performance)[0]?.label || 'Tech'}. 
               NOTĂ: Rezumatul este aliniat cu ancora ta săptămânală (${currentWeekContext || 'No manual context'}).` 
               : 'Analizez datele de astăzi pentru a genera rezumatul strategic...'}
            </p>
        </div>
        <i className="fas fa-satellite-dish absolute -bottom-10 -right-10 text-[180px] text-white/[0.03] pointer-events-none"></i>
      </div>
    </div>
  );
};

export default MarketWatch;
