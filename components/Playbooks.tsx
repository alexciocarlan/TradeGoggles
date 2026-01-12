
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Playbook, Trade, PlaybookTag } from '../types';
import PlaybookDetailModal from './PlaybookDetailModal';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

// Mapping structure based on Decision Funnel (Same as Editor for consistency)
const TIER_DEFINITIONS = [
    { tier: 1, name: "Macro Context", icon: "fa-arrows-to-dot", color: "text-blue-400", bg: "bg-blue-400", tags: ['#GAP', '#LARGEGAP', '#EXHAUSTION', '#MASSIVEGAP', '#INSIDERANGE', '#INBALANCE', '#TIGHTBALANCE', '#EXTREMESKEW', '#OUTSIDEVA', '#REJECTION', '#FAILEDBREAK'] },
    { tier: 2, name: "Opening Auction", icon: "fa-bolt", color: "text-orange-400", bg: "bg-orange-400", tags: ['#STRONGDRIVE', '#NOTAILS', '#TESTFIRST', '#TRAPPEDTRADERS', '#FAILEDPUSH', '#IB_STRUGGLE', '#FAKEOUT', '#NARROWIB'] },
    { tier: 3, name: "Intraday Regime", icon: "fa-gears", color: "text-emerald-400", bg: "bg-emerald-400", tags: ['#IMBALANCE', '#SINGLEPRINTS', '#DOUBLEDIST', '#CASCADE', '#NEWS', '#MOMENTUM', '#REVERSION', '#OVEREXTENDED', '#ALGORITHMIC', '#SUPPORT/RES', '#STRUCTURE'] },
    { tier: 4, name: "Location & Targeting", icon: "fa-bullseye", color: "text-purple-400", bg: "bg-purple-400", tags: ['#POORSTRUCTURE', '#OLDBUSINESS', '#PIVOT', '#HVN', '#PSYCHOLOGY', '#TARGETING'] },
    { tier: 5, name: "Time Factor", icon: "fa-clock", color: "text-rose-400", bg: "bg-rose-400", tags: ['#AFTERNOON', '#LATEDAY', '#ENDOFWEEK', '#MULTIDAY', '#TIMEFACTOR'] }
];

const getTagTier = (text: string): number => {
    const normalized = text.toUpperCase().trim();
    const found = TIER_DEFINITIONS.find(d => d.tags.includes(normalized));
    return found ? found.tier : 0; 
};

type StatsMode = 'LIVE' | 'BACKTEST' | 'COMBINED';

const getPlaybookStats = (playbook: Playbook, trades: Trade[], btTrades: Trade[], mode: StatsMode) => {
  const safeTrades = Array.isArray(trades) ? trades : [];
  const safeBT = Array.isArray(btTrades) ? btTrades : [];
  
  const filteredLive = safeTrades.filter(t => t.setup?.toLowerCase() === playbook.name.toLowerCase());
  const filteredBT = safeBT.filter(t => t.setup?.toLowerCase() === playbook.name.toLowerCase());
  
  let targetTrades: Trade[] = [];
  if (mode === 'LIVE') targetTrades = filteredLive;
  else if (mode === 'BACKTEST') targetTrades = filteredBT;
  else targetTrades = [...filteredLive, ...filteredBT];

  const tradeCount = targetTrades.length;
  const winCount = targetTrades.filter(t => t.status === 'WIN').length;
  const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
  const netPnl = targetTrades.reduce((sum, t) => sum + t.pnlNet, 0);
  
  const winningTrades = targetTrades.filter(t => t.pnlNet > 0);
  const totalWinAmount = winningTrades.reduce((s, t) => s + (t.pnlNet || 0), 0);
  const totalLossAmount = Math.abs(targetTrades.filter(t => t.pnlNet < 0).reduce((s, t) => s + (t.pnlNet || 0), 0));
  const profitFactor = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount) : (totalWinAmount > 0 ? 99 : 0);
  const expectancy = tradeCount > 0 ? netPnl / tradeCount : 0;

  const sessionPnl: Record<string, number> = {};
  targetTrades.forEach(t => {
    sessionPnl[t.session] = (sessionPnl[t.session] || 0) + t.pnlNet;
  });
  const bestSession = Object.entries(sessionPnl).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';

  const isValidated = tradeCount >= 10;
  let efficiencyGrade = 'Pending';
  let gradeColor = 'text-slate-600';
  let gradeBg = 'bg-slate-900/50';

  if (isValidated) {
    if (winRate >= 60 && profitFactor >= 1.8) {
      efficiencyGrade = 'A+';
      gradeColor = 'text-emerald-400';
      gradeBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (winRate >= 45 || profitFactor >= 1.2) {
      efficiencyGrade = 'B';
      gradeColor = 'text-blue-400';
      gradeBg = 'bg-blue-500/10 border-blue-500/20';
    } else {
      efficiencyGrade = 'C';
      gradeColor = 'text-rose-400';
      gradeBg = 'bg-rose-500/10 border-rose-500/20';
    }
  }

  return { tradeCount, winRate, netPnl, profitFactor, bestSession, expectancy, efficiencyGrade, gradeColor, gradeBg, isValidated };
};

const Playbooks: React.FC = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Playbook | null>(null);
  const [activeTier, setActiveTier] = useState<number>(0);
  const [statsMode, setStatsMode] = useState<StatsMode>('LIVE');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    trades = [], playbooks = [], backtestTrades = [], loadPlaybooks, loadBacktestData, restoreDefaultPlaybooks
  } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    playbooks: state.playbooks || [],
    backtestTrades: state.backtestTrades || [],
    loadPlaybooks: state.loadPlaybooks,
    loadBacktestData: state.loadBacktestData,
    restoreDefaultPlaybooks: state.restoreDefaultPlaybooks
  })));

  useEffect(() => {
    startTransition(() => {
      loadPlaybooks();
      loadBacktestData();
    });
  }, [loadPlaybooks, loadBacktestData]);

  const filteredPlaybooks = useMemo(() => {
    let result = playbooks;
    if (activeTier !== 0) {
        result = result.filter(p => p.tags.some(t => getTagTier(t.text) === activeTier));
    }
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.tags.some(t => t.text.toLowerCase().includes(q)) ||
            (p.description || '').toLowerCase().includes(q)
        );
    }
    return result;
  }, [playbooks, activeTier, searchQuery]);

  const handleOpenPlaybook = (pb: Playbook) => {
    startTransition(() => {
        setSelected(pb);
    });
  };

  const handleCreateNew = () => {
    startTransition(() => {
        navigate('/playbooks/new');
    });
  };

  const handleEdit = (id: string) => {
    startTransition(() => {
        navigate(`/playbooks/edit/${id}`);
    });
  };

  const handleRestoreDefaults = async () => {
    if (window.confirm("ATENȚIE: Această acțiune va restaura cele 39 de setup-uri originale (AMT Protocol). Orice strategie personalizată va fi ștearsă. Continui?")) {
        await restoreDefaultPlaybooks();
        // Force refresh via transition
        startTransition(() => {
            loadPlaybooks();
        });
    }
  };

  return (
    <div className={`space-y-10 animate-in fade-in duration-700 pb-20 ${isPending ? 'opacity-80' : ''}`}>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Knowledge Vault</p>
           <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Strategy Playbooks</h2>
        </div>
        <div className="flex items-center space-x-4">
            <button 
                onClick={handleRestoreDefaults}
                className="px-6 py-3 rounded-xl border border-slate-800 text-slate-500 hover:text-orange-500 hover:border-orange-500/30 text-[9px] font-black uppercase tracking-widest transition-all flex items-center bg-[#0b1222]"
            >
                <i className="fas fa-sync-alt mr-2"></i> Restaurează (39)
            </button>
            <button 
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center active:scale-95"
            >
                <i className="fas fa-plus mr-2"></i> Strategie Nouă
            </button>
        </div>
      </div>

      <div className="bg-[#0b1222] border border-slate-800 p-2 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40 shadow-2xl backdrop-blur-xl">
         <div className="flex overflow-x-auto space-x-1 p-1 w-full md:w-auto custom-scrollbar">
            <button 
                onClick={() => setActiveTier(0)} 
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTier === 0 ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                ALL STRATEGIES
            </button>
            {TIER_DEFINITIONS.map(tier => (
                <button 
                    key={tier.tier}
                    onClick={() => setActiveTier(tier.tier)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center space-x-2 ${activeTier === tier.tier ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <i className={`fas ${tier.icon} ${activeTier === tier.tier ? 'text-white' : tier.color}`}></i>
                    <span>Tier {tier.tier}</span>
                </button>
            ))}
         </div>
         
         <div className="flex items-center space-x-3 px-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors text-xs"></i>
                <input 
                    type="text" 
                    placeholder="Search Playbook..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
            </div>
            <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
            <div className="flex bg-slate-900 p-1 rounded-lg">
                <button onClick={() => setStatsMode('LIVE')} className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${statsMode === 'LIVE' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>LIVE</button>
                <button onClick={() => setStatsMode('BACKTEST')} className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${statsMode === 'BACKTEST' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>BT</button>
            </div>
         </div>
      </div>

      {filteredPlaybooks.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-[#0b1222] border border-slate-800 rounded-[3rem] border-dashed">
            <i className="fas fa-book-open text-6xl mb-6 text-slate-700"></i>
            <p className="text-xl font-black text-slate-500 uppercase tracking-widest">No Playbooks Found</p>
            <p className="text-[10px] text-slate-600 mt-2 mb-8 uppercase tracking-widest">Baza de date a strategiilor este goală.</p>
            <button 
                onClick={handleRestoreDefaults}
                className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-slate-400 hover:text-orange-500 font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-3"
            >
                <i className="fas fa-sync-alt"></i>
                Restaurează Cele 39 Setup-uri
            </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredPlaybooks.map(pb => {
             const stats = getPlaybookStats(pb, trades, backtestTrades, statsMode);
             return (
                 <div key={pb.id} onClick={() => handleOpenPlaybook(pb)} className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-all hover:-translate-y-1 hover:shadow-2xl">
                     <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {pb.icon}
                             </div>
                             <div>
                                 <h4 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1 group-hover:text-blue-400 transition-colors">{pb.name}</h4>
                                 <div className="flex items-center space-x-2">
                                     <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${stats.isValidated ? stats.gradeBg + ' ' + stats.gradeColor : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                         {stats.isValidated ? `GRADE ${stats.efficiencyGrade}` : 'UNPROVEN'}
                                     </span>
                                 </div>
                             </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); handleEdit(pb.id); }} className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                             <i className="fas fa-edit text-[10px]"></i>
                         </button>
                     </div>

                     <div className="space-y-4 mb-6">
                         <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Win Rate</span>
                             <span className={`text-xl font-black italic tracking-tighter ${stats.winRate >= 50 ? 'text-white' : 'text-slate-400'}`}>{stats.winRate.toFixed(0)}%</span>
                         </div>
                         <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Profit Factor</span>
                             <span className={`text-xl font-black italic tracking-tighter ${stats.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-slate-400'}`}>{stats.profitFactor.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total P&L</span>
                             <span className={`text-xl font-black italic tracking-tighter ${stats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>${stats.netPnl.toLocaleString()}</span>
                         </div>
                     </div>

                     <div className="flex items-center justify-between">
                         <div className="flex -space-x-2">
                             {(pb.tags || []).slice(0, 3).map(t => (
                                 <div key={t.id} className="w-6 h-6 rounded-full border-2 border-[#0b1222] bg-slate-800 flex items-center justify-center text-[10px]" title={t.text} style={{ backgroundColor: t.color }}>
                                     <i className="fas fa-tag text-white/50 text-[8px]"></i>
                                 </div>
                             ))}
                             {(pb.tags?.length || 0) > 3 && (
                                 <div className="w-6 h-6 rounded-full border-2 border-[#0b1222] bg-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                     +{(pb.tags?.length || 0) - 3}
                                 </div>
                             )}
                         </div>
                         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{stats.tradeCount} EXECUTION{stats.tradeCount !== 1 ? 'S' : ''}</p>
                     </div>
                     
                     <div className="absolute top-0 right-0 p-20 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-[100%] pointer-events-none"></div>
                 </div>
             );
         })}
      </div>

      {selected && (
        <PlaybookDetailModal 
            playbook={selected} 
            trades={trades} 
            backtestTrades={backtestTrades}
            onClose={() => setSelected(null)} 
            onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default Playbooks;
