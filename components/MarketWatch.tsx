
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getMarketWatchIntel, MarketTickers, getMarketTickers } from '../geminiService'; // Import getMarketWatchIntel and MarketTickers, getMarketTickers
import { Language } from '../types';
import { useAppStore } from '../AppContext';

interface MarketWatchProps {
  // language: Language; // Removed, now fetched from store
  // tickers: MarketTickers | null; // Removed, now fetched from App component state
  // loadingTickers: boolean; // Removed, now fetched from App component state
}

const MarketWatch: React.FC<MarketWatchProps> = () => {
  const { weeklyPreps, language, loadDailyPreps, loadWeeklyPreps } = useAppStore(); // Fetch weeklyPreps, language and load functions from store
  const [intel, setIntel] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false); // Default to false as disabled
  const [viewType, setViewType] = useState<'rVol' | 'heatIndex'>('rVol');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [marketTickers, setMarketTickers] = useState<MarketTickers | null>(null);
  const [loadingTickers, setLoadingTickers] = useState(false);

  // NEW: Load daily and weekly preps when component mounts
  useEffect(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    loadDailyPreps(currentMonth);
    loadWeeklyPreps();
  }, [loadDailyPreps, loadWeeklyPreps]);


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

  // DISABLED: Auto-fetch removed
  const fetchMarketWatchIntel = async () => { 
    // Disabled
  };

  const fetchTickers = async () => {
    // Disabled
  };

  useEffect(() => {
    // Disabled interval fetch
  }, [currentWeekContext]); 


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

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5">LIVE MARKET SCANNER</p>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">MARKET WATCH</h2>
           </div>
           
           <div className="flex items-center bg-slate-900/30 border border-slate-800/50 p-3 rounded-2xl shadow-inner">
              <span className="text-xs text-slate-500 font-bold uppercase">LIVE FEED DISABLED</span>
           </div>
        </div>

        <div className="flex items-center space-x-3">
            <button 
                disabled={true} 
                className="bg-slate-800/50 border border-slate-700 text-slate-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center cursor-not-allowed"
            >
                <i className={`fas fa-ban mr-2`}></i>
                Feed Offline
            </button>
        </div>
      </div>

      <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-[3rem]">
         <p className="text-slate-600 font-black uppercase tracking-widest text-sm">Real-time market intelligence feeds are currently disabled.</p>
      </div>
    </div>
  );
};

export default MarketWatch;
