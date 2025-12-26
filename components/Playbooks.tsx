
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Playbook, Trade, PlaybookTag } from '../types';
import { Language } from '../translations';
import PlaybookDetailModal from './PlaybookDetailModal';

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

interface PlaybooksProps {
  playbooks: Playbook[];
  trades: Trade[];
  backtestTrades: Trade[];
  language: Language;
}

const getPlaybookStats = (playbook: Playbook, trades: Trade[], btTrades: Trade[], mode: StatsMode) => {
  const filteredLive = trades.filter(t => t.setup?.toLowerCase() === playbook.name.toLowerCase());
  const filteredBT = btTrades.filter(t => t.setup?.toLowerCase() === playbook.name.toLowerCase());
  
  let targetTrades: Trade[] = [];
  if (mode === 'LIVE') targetTrades = filteredLive;
  else if (mode === 'BACKTEST') targetTrades = filteredBT;
  else targetTrades = [...filteredLive, ...filteredBT];

  const tradeCount = targetTrades.length;
  const winCount = targetTrades.filter(t => t.status === 'WIN').length;
  const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
  const netPnl = targetTrades.reduce((sum, t) => sum + t.pnlNet, 0);
  
  const winningTrades = targetTrades.filter(t => t.pnlNet > 0);
  const totalWinAmount = winningTrades.reduce((s, t) => s + t.pnlNet, 0);
  const totalLossAmount = Math.abs(targetTrades.filter(t => t.pnlNet < 0).reduce((s, t) => s + t.pnlNet, 0));
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

  return { tradeCount, winRate, netPnl, profitFactor, expectancy, bestSession, efficiencyGrade, gradeColor, gradeBg, hasLive: filteredLive.length > 0, hasBT: filteredBT.length > 0 };
};

const FieldTooltip = ({ label, value, colorClass = "text-white" }: { label: string, value: string, colorClass?: string }) => (
  <div className="bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/50 cursor-help hover:border-slate-700 transition-colors">
    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={`text-[9px] font-bold truncate ${colorClass}`}>{value || '---'}</p>
  </div>
);

const PlaybookCard: React.FC<{ playbook: Playbook; trades: Trade[]; btTrades: Trade[]; mode: StatsMode; onClick: () => void }> = ({ playbook, trades, btTrades, mode, onClick }) => {
  const stats = getPlaybookStats(playbook, trades, btTrades, mode);

  return (
    <div 
      onClick={onClick}
      className="bg-[#0b1222] border border-slate-800/60 rounded-[2rem] p-6 hover:border-blue-500/40 transition-all group relative shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300 cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0 border"
            style={{ backgroundColor: `${playbook.color}15`, borderColor: `${playbook.color}40` }}
          >
             {playbook.icon || '📊'}
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-tight leading-none mb-1 truncate max-w-[140px]">{playbook.name}</h3>
            <div className="flex items-center space-x-2">
                 <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{stats.tradeCount} trades</p>
                 {mode === 'COMBINED' && (
                     <div className="flex space-x-1">
                        {stats.hasLive && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
                        {stats.hasBT && <div className="w-1 h-1 rounded-full bg-indigo-500"></div>}
                     </div>
                 )}
            </div>
          </div>
        </div>
        <Link 
          to={`/playbooks/edit/${playbook.id}`} 
          onClick={(e) => e.stopPropagation()}
          className="text-slate-600 hover:text-white p-1 shrink-0 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-600 transition-all"
        >
          <i className="fas fa-edit text-[10px]"></i>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 mb-4 min-h-[20px]">
        {(playbook.tags || []).map(tag => (
          <span 
            key={tag.id}
            className="text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border"
            style={{ 
              backgroundColor: `${tag.color}15`, 
              borderColor: `${tag.color}30`, 
              color: tag.color 
            }}
          >
            {tag.text}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
           <div className="relative w-12 h-12">
             <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
               <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800/50" strokeWidth="4" />
               <circle cx="18" cy="18" r="16" fill="none" className={mode === 'BACKTEST' ? "stroke-indigo-500" : "stroke-blue-500"} strokeWidth="4" 
                 strokeDasharray={`${stats.winRate}, 100`} strokeLinecap="round" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-white leading-none">{stats.winRate.toFixed(0)}%</span>
             </div>
           </div>
           <div>
             <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Expectancy</p>
             <p className={`text-[10px] font-black ${stats.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${stats.expectancy.toFixed(0)}
             </p>
           </div>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Net P&L</p>
          <p className={`text-base font-black ${stats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${stats.netPnl.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-4">
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors shadow-inner">
          <p className="text-[7px] font-black text-slate-500 uppercase mb-1 tracking-widest">Logic & Context</p>
          <p className="text-[9px] text-slate-300 font-medium italic line-clamp-2 leading-relaxed">"{playbook.description || 'Nicio descriere definită.'}"</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <FieldTooltip label="Entry At" value={playbook.entryAt} colorClass="text-emerald-400" />
        <FieldTooltip label="Target" value={playbook.target} colorClass="text-blue-400" />
        <FieldTooltip label="Invalidation" value={playbook.invalidation} colorClass="text-red-400" />
      </div>

      <div className="mt-auto pt-3 border-t border-slate-800/50 flex justify-between items-center">
        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black italic border ${stats.gradeBg} ${stats.gradeColor}`}>
           EFFICIENCY: {stats.efficiencyGrade}
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter leading-none">Best</p>
          <p className="text-[9px] font-black text-indigo-400 uppercase">{stats.bestSession}</p>
        </div>
      </div>
    </div>
  );
};

const PlaybookListView: React.FC<{ playbooks: Playbook[]; trades: Trade[]; btTrades: Trade[]; mode: StatsMode; onOpen: (pb: Playbook) => void }> = ({ playbooks, trades, btTrades, mode, onOpen }) => {
  return (
    <div className="bg-[#0b1222] border border-slate-800/60 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-950/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
          <tr>
            <th className="px-8 py-6">Setup Name</th>
            <th className="px-6 py-6 text-center">Trades</th>
            <th className="px-6 py-6 text-center">Win Rate</th>
            <th className="px-6 py-6 text-center">Prof. Factor</th>
            <th className="px-6 py-6 text-center">Expectancy</th>
            <th className="px-6 py-6 text-center">Net P&L</th>
            <th className="px-6 py-6 text-center">Grade</th>
            <th className="px-8 py-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {playbooks.map(pb => {
            const stats = getPlaybookStats(pb, trades, btTrades, mode);
            return (
              <tr 
                key={pb.id} 
                onClick={() => onOpen(pb)}
                className="hover:bg-blue-600/[0.03] transition-colors group cursor-pointer"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-4">
                    <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                        style={{ backgroundColor: `${pb.color}15`, borderColor: `${pb.color}40` }}
                    >
                      {pb.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight mb-1 truncate max-w-[150px]">{pb.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {(pb.tags || []).slice(0, 2).map(tag => (
                          <span key={tag.id} className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${tag.color}10`, borderColor: `${tag.color}20`, color: tag.color }}>
                            {tag.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center font-black text-slate-400 text-xs">{stats.tradeCount}</td>
                <td className="px-6 py-5 text-center">
                  <span className={`text-xs font-black ${stats.winRate >= 50 ? 'text-green-500' : 'text-slate-400'}`}>
                    {stats.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-5 text-center font-black text-blue-400 text-xs">{stats.profitFactor.toFixed(2)}</td>
                <td className="px-6 py-5 text-center">
                  <span className={`text-xs font-black ${stats.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${stats.expectancy.toFixed(0)}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className={`text-sm font-black ${stats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${stats.netPnl.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`text-sm font-black italic ${stats.gradeColor}`}>
                    {stats.efficiencyGrade}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex justify-end space-x-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onOpen(pb); }}
                            className="text-slate-500 hover:text-white p-2"
                        >
                            <i className="fas fa-eye text-xs"></i>
                        </button>
                        <Link 
                            to={`/playbooks/edit/${pb.id}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-500 hover:text-white p-2"
                        >
                            <i className="fas fa-edit text-xs"></i>
                        </Link>
                   </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Playbooks: React.FC<PlaybooksProps> = ({ playbooks, trades, backtestTrades, language }) => {
  const navigate = useNavigate();
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('pb_view_mode') as any) || 'grid');
  const [statsMode, setStatsMode] = useState<StatsMode>('LIVE');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const availableTagsInTier = useMemo(() => {
    const tagsMap: Record<string, string> = {};
    playbooks.forEach(pb => {
      pb.tags?.forEach(tag => {
        const tagTier = getTagTier(tag.text);
        if (activeTier === null || tagTier === activeTier) {
            if (!tagsMap[tag.text]) tagsMap[tag.text] = tag.color;
        }
      });
    });
    return Object.entries(tagsMap).map(([text, color]) => ({ text, color }));
  }, [playbooks, activeTier]);

  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(pb => {
      const matchesSearch = pb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pb.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTier = activeTier === null || pb.tags?.some(tag => getTagTier(tag.text) === activeTier);
      
      const matchesTags = selectedTagNames.length === 0 || 
                         pb.tags?.some(tag => selectedTagNames.includes(tag.text));
                         
      return matchesSearch && matchesTier && matchesTags;
    });
  }, [playbooks, selectedTagNames, searchQuery, activeTier]);

  const toggleTag = (tagName: string) => {
    setSelectedTagNames(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName) 
        : [...prev, tagName]
    );
  };

  const toggleTier = (tier: number) => {
    if (activeTier === tier) {
        setActiveTier(null);
        setSelectedTagNames([]); // Reset tags when de-selecting tier
    } else {
        setActiveTier(tier);
        setSelectedTagNames([]); // Reset tags when changing tier
    }
  };

  const changeViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pb_view_mode', mode);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
        <div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">SISTEMUL TĂU DE EXECUȚIE</p>
           <h2 className="text-2xl font-black text-white uppercase flex items-center italic tracking-tighter">
             PLAYBOOK VAULT <span className="mx-4 text-slate-800 font-light not-italic">|</span> <span className="text-blue-500 text-sm not-italic font-black tracking-widest">VALIDARE EDGE</span>
           </h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            {/* STATS MODE TOGGLE */}
           <div className="bg-black/40 border border-slate-800 p-1 rounded-xl flex shadow-inner">
                {(['LIVE', 'BACKTEST', 'COMBINED'] as StatsMode[]).map(mode => (
                    <button 
                        key={mode}
                        onClick={() => setStatsMode(mode)}
                        className={`px-4 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${statsMode === mode ? (mode === 'LIVE' ? 'bg-emerald-600' : mode === 'BACKTEST' ? 'bg-indigo-600' : 'bg-blue-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {mode}
                    </button>
                ))}
           </div>

           <div className="relative w-full md:w-64 group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"></i>
              <input 
                type="text" 
                placeholder="Cauta strategie..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b1222] border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
           </div>

           <div className="flex items-center space-x-4">
              <div className="bg-[#111827] p-1 rounded-xl border border-slate-800 flex shadow-inner">
                  <button onClick={() => changeViewMode('grid')} className={`p-2.5 w-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    <i className="fas fa-th-large text-xs"></i>
                  </button>
                  <button onClick={() => changeViewMode('list')} className={`p-2.5 w-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    <i className="fas fa-list text-xs"></i>
                  </button>
              </div>

              <Link 
                to="/playbooks/new" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-black text-[10px] transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center uppercase tracking-widest whitespace-nowrap"
              >
                <i className="fas fa-plus mr-2"></i> Create Playbook
              </Link>
           </div>
        </div>
      </div>

      {/* Tiered Filter Navigation with full names */}
      <div className="bg-[#0b1222]/80 border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-b border-slate-800/50">
            <button 
                onClick={() => { setActiveTier(null); setSelectedTagNames([]); }}
                className={`px-6 py-6 flex flex-col items-center justify-center space-y-2 border-r border-slate-800/50 transition-all ${activeTier === null ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-900'}`}
            >
                <i className="fas fa-layer-group text-lg"></i>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">All Assets</p>
                    <p className="text-[8px] font-bold opacity-60 uppercase">Overview</p>
                </div>
            </button>
            {TIER_DEFINITIONS.map(td => (
                <button 
                    key={td.tier}
                    onClick={() => toggleTier(td.tier)}
                    className={`px-6 py-6 flex flex-col items-center justify-center space-y-2 border-r border-slate-800/50 last:border-r-0 transition-all ${activeTier === td.tier ? `${td.bg} text-white shadow-inner` : 'text-slate-500 hover:bg-slate-900'}`}
                >
                    <i className={`fas ${td.icon} text-lg`}></i>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest">Tier {td.tier}</p>
                        <p className={`text-[8px] font-bold uppercase tracking-tighter ${activeTier === td.tier ? 'text-white/80' : 'text-slate-600'}`}>{td.name}</p>
                    </div>
                </button>
            ))}
         </div>
         
         <div className="p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center space-x-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                    <i className="fas fa-filter text-[10px]"></i>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter by Attributes:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {availableTagsInTier.map(tag => {
                    const isActive = selectedTagNames.includes(tag.text);
                    return (
                        <button
                            key={tag.text}
                            onClick={() => toggleTag(tag.text)}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                isActive 
                                    ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105' 
                                    : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                            }`}
                            style={{
                                backgroundColor: isActive ? `${tag.color}20` : 'transparent',
                                borderColor: isActive ? tag.color : '#1e293b',
                                color: isActive ? tag.color : '#94a3b8'
                            }}
                        >
                            {tag.text}
                        </button>
                    );
                })}
                
                {(selectedTagNames.length > 0 || activeTier !== null || searchQuery) && (
                    <button 
                        onClick={() => { setSelectedTagNames([]); setActiveTier(null); setSearchQuery(''); }}
                        className="px-4 py-1.5 text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center"
                    >
                        <i className="fas fa-times-circle mr-2"></i> Reset Selection
                    </button>
                )}
            </div>
         </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlaybooks.map(p => (
            <PlaybookCard 
                key={p.id} 
                playbook={p} 
                trades={trades} 
                btTrades={backtestTrades}
                mode={statsMode}
                onClick={() => setSelectedPlaybook(p)}
            />
          ))}
          {filteredPlaybooks.length === 0 && <EmptyState onReset={() => { setSelectedTagNames([]); setActiveTier(null); setSearchQuery(''); }} />}
        </div>
      ) : (
        <div className="w-full">
           {filteredPlaybooks.length > 0 ? (
             <PlaybookListView 
                playbooks={filteredPlaybooks} 
                trades={trades} 
                btTrades={backtestTrades}
                mode={statsMode}
                onOpen={(pb) => setSelectedPlaybook(pb)}
             />
           ) : (
             <EmptyState onReset={() => { setSelectedTagNames([]); setActiveTier(null); setSearchQuery(''); }} />
           )}
        </div>
      )}

      {selectedPlaybook && (
        <PlaybookDetailModal 
            playbook={selectedPlaybook} 
            trades={trades} 
            backtestTrades={backtestTrades}
            onClose={() => setSelectedPlaybook(null)}
            onEdit={(id) => navigate(`/playbooks/edit/${id}`)}
        />
      )}
    </div>
  );
};

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-950/20 w-full">
     <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-search text-3xl text-slate-700"></i>
     </div>
     <p className="text-slate-500 font-black uppercase text-xs tracking-[0.2em]">No strategies found in this tier</p>
     <button 
       onClick={onReset}
       className="text-blue-500 font-black text-[10px] uppercase mt-4 hover:underline tracking-widest"
     >
       Reset All Filters
     </button>
  </div>
);

export default Playbooks;
