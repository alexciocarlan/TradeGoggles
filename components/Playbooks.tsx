
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const profitFactor = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount) : totalWinAmount > 0 ? 99 : 0;
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
  const [selected, setSelected] = useState<Playbook | null>(null);
  const [activeTier, setActiveTier] = useState<number>(0);
  const [statsMode, setStatsMode] = useState<StatsMode>('LIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { 
    trades = [], language, playbooks = [], backtestTrades = [], restoreDefaultPlaybooks, loadPlaybooks, loadBacktestData
  } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    language: state.language,
    playbooks: state.playbooks || [],
    backtestTrades: state.backtestTrades || [],
    restoreDefaultPlaybooks: state.restoreDefaultPlaybooks,
    loadPlaybooks: state.loadPlaybooks,
    loadBacktestData: state.loadBacktestData 
  })));

  useEffect(() => {
    loadPlaybooks();
    loadBacktestData();
  }, [loadPlaybooks, loadBacktestData]);

  const filteredPlaybooks = useMemo(() => {
    let result = playbooks;

    // Filter by Tier
    if (activeTier !== 0) {
        result = result.filter(p => p.tags.some(t => getTagTier(t.text) === activeTier));
    }

    // Filter by Search Query
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

  const handleExport = () => {
      window.print();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Strategy Playbooks</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">MP Protocol Digital Edge Archive</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => navigate('/playbooks/new')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center">
                <i className="fas fa-plus mr-2"></i> New Strategy
              </button>
            </div>
          </div>

          {/* SEARCH & TOOLBAR */}
          <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-[#0b1222]/60 border border-slate-800/60 p-4 rounded-[2rem] shadow-xl">
             
             {/* Search Bar */}
             <div className="relative w-full xl:w-96 group">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                    type="text" 
                    placeholder="Cauta strategie..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050810] border border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                />
             </div>

             <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
                 {/* View Toggle */}
                 <div className="flex bg-[#050810] p-1 rounded-xl border border-slate-800">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <i className="fas fa-border-all text-xs"></i>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <i className="fas fa-list text-xs"></i>
                    </button>
                 </div>

                 {/* Export Button */}
                 <button 
                    onClick={handleExport}
                    className="bg-[#050810] hover:bg-slate-800 border border-slate-800 text-slate-300 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2"
                 >
                    <i className="fas fa-file-pdf text-slate-500"></i>
                    <span>EXPORT VAULT</span>
                 </button>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* FILTERS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0b1222] border border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Strategy Tiers</h4>
             <div className="space-y-2">
                <button onClick={() => setActiveTier(0)} className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-between ${activeTier === 0 ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'hover:bg-slate-800/40'}`}>
                   <span>All Categories</span>
                   <i className={`fas fa-layer-group text-[10px] ${activeTier === 0 ? 'text-blue-500' : 'text-slate-600'}`}></i>
                </button>
                {TIER_DEFINITIONS.map(d => (
                  <button key={d.tier} onClick={() => setActiveTier(d.tier)} className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-between ${activeTier === d.tier ? 'bg-blue-600/10 border-blue-500/30' : 'hover:bg-slate-800/40'}`}>
                      <span>Tier {d.tier}: {d.name}</span>
                      <i className={`fas ${d.icon} text-[10px] ${activeTier === d.tier ? d.color : 'text-slate-600'}`}></i>
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Data Source</h4>
             <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                {(['LIVE', 'BACKTEST', 'COMBINED'] as StatsMode[]).map(mode => (
                    <button key={mode} onClick={() => setStatsMode(mode)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statsMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        {mode}
                    </button>
                ))}
             </div>
          </div>
        </div>

        {/* CARDS or LIST */}
        <div className="lg:col-span-9">
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPlaybooks.map(pb => {
                        const stats = getPlaybookStats(pb, trades, backtestTrades, statsMode);
                        return (
                            <div key={pb.id} onClick={() => setSelected(pb)} className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl flex flex-col cursor-pointer hover:-translate-y-1">
                            <div className="p-8 border-b border-slate-800/50 relative overflow-hidden" style={{ backgroundColor: `${pb.color}10` }}>
                                <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border-2" style={{ backgroundColor: pb.color, borderColor: `${pb.color}80` }}>{pb.icon}</div>
                                <div className={`text-[9px] font-black px-3 py-1 rounded-full border ${stats.gradeBg} ${stats.gradeColor}`}>{stats.efficiencyGrade}</div>
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-tight mb-2 min-h-[56px]">{pb.name}</h4>
                                <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                                {pb.tags.slice(0, 3).map(t => <span key={t.id} className="text-[7px] font-black uppercase border px-1.5 py-0.5 rounded" style={{ color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}15` }}>{t.text}</span>)}
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col bg-slate-950/20">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
                                    <StatItem label="Win Rate" value={`${stats.winRate.toFixed(0)}%`} color={stats.winRate > 50 ? 'text-green-500' : 'text-rose-500'} />
                                    <StatItem label="Trades" value={stats.tradeCount} />
                                    <StatItem label="Profit Factor" value={stats.profitFactor.toFixed(2)} color="text-blue-400" />
                                    <StatItem label="Expectancy" value={`$${stats.expectancy.toFixed(0)}`} />
                                </div>
                                <div className="mt-auto text-[9px] font-black uppercase text-slate-600 group-hover:text-blue-400 transition-colors flex items-center justify-center pt-4 border-t border-slate-800">
                                    <i className="fas fa-book-open mr-2"></i> Open Playbook
                                </div>
                            </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                <tr>
                                    <th className="px-8 py-5">Strategy Name</th>
                                    <th className="px-6 py-5 text-center">Grade</th>
                                    <th className="px-6 py-5 text-center">Win Rate</th>
                                    <th className="px-6 py-5 text-center">PF</th>
                                    <th className="px-6 py-5 text-center">Trades</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {filteredPlaybooks.map(pb => {
                                    const stats = getPlaybookStats(pb, trades, backtestTrades, statsMode);
                                    return (
                                        <tr key={pb.id} onClick={() => setSelected(pb)} className="hover:bg-slate-900/30 cursor-pointer group transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${pb.color}20`, color: pb.color }}>{pb.icon}</div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase tracking-tight">{pb.name}</p>
                                                        <div className="flex gap-1 mt-1">
                                                            {pb.tags.slice(0, 2).map(t => <span key={t.id} className="text-[7px] text-slate-500 font-bold uppercase">{t.text}</span>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`text-[9px] font-black px-2 py-1 rounded border ${stats.gradeBg} ${stats.gradeColor}`}>{stats.efficiencyGrade}</span>
                                            </td>
                                            <td className={`px-6 py-5 text-center text-xs font-black ${stats.winRate > 50 ? 'text-green-500' : 'text-slate-500'}`}>{stats.winRate.toFixed(0)}%</td>
                                            <td className="px-6 py-5 text-center text-xs font-bold text-blue-400">{stats.profitFactor.toFixed(2)}</td>
                                            <td className="px-6 py-5 text-center text-xs font-bold text-slate-400">{stats.tradeCount}</td>
                                            <td className="px-8 py-5 text-right">
                                                <i className="fas fa-chevron-right text-slate-700 group-hover:text-blue-500 transition-colors text-xs"></i>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {filteredPlaybooks.length === 0 && (
                <div className="py-20 text-center opacity-30 italic flex flex-col items-center">
                    <i className="fas fa-search text-4xl mb-4 text-slate-700"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No playbooks found matching your criteria.</p>
                </div>
            )}
        </div>
      </div>

      {selected && (
        <PlaybookDetailModal 
          playbook={selected} 
          trades={trades}
          backtestTrades={backtestTrades}
          onClose={() => setSelected(null)} 
          onEdit={(id) => navigate(`/playbooks/edit/${id}`)} 
        />
      )}
    </div>
  );
};

const StatItem = ({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) => (
  <div>
    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={`text-base font-black ${color} tracking-tight`}>{value}</p>
  </div>
);

export default Playbooks;
