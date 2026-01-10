
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trade, DailyPrepData } from '../types';
import DayWrapUpModal from './DayWrapUpModal';
import { useAppStore } from '../AppContext';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useShallow } from 'zustand/react/shallow';

// Înălțimi estimate pentru virtualizare
const ROW_HEADER_HEIGHT = 110; 
const BRIEFING_HEIGHT = 380; 
const TRADE_ITEM_HEIGHT = 85; 
const ROW_MARGIN_BOTTOM = 24;

interface ContextCardProps {
  label: string;
  value: string;
  icon: string;
  subLabel: string;
  color?: string;
}

const ContextCard: React.FC<ContextCardProps> = ({ label, value, icon, subLabel, color = "text-blue-500" }) => (
    <div className="flex-1 min-w-[180px] bg-[#0b1222]/40 border border-slate-800/60 p-5 rounded-2xl flex items-start space-x-4 group hover:border-slate-700 transition-all">
        <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 ${color}`}>
            <i className={`fas ${icon} text-xs`}></i>
        </div>
        <div className="overflow-hidden">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-[11px] font-black uppercase truncate mb-0.5 ${value === 'NOT DEFINED' ? 'text-blue-600/50' : 'text-blue-400'}`}>{value}</p>
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-tighter">{subLabel}</p>
        </div>
    </div>
);

interface DayReviewGroupProps {
  date: string;
  trades: Trade[];
  prep?: DailyPrepData;
  onDeleteTrade: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  style: React.CSSProperties;
}

const DayReviewGroup: React.FC<DayReviewGroupProps> = ({ date, trades, prep, onDeleteTrade, isExpanded, onToggle, style }) => {
  const d = new Date(date);
  const dayName = d.toLocaleDateString('ro-RO', { weekday: 'long' }).toUpperCase();
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase();
  
  const totalPnl = (trades || []).reduce((sum, t) => sum + (t.pnlNet || 0), 0);
  const successRate = (trades || []).length > 0 ? (trades.filter(t => t.status === 'WIN').length / trades.length) * 100 : 0;

  return (
    <div style={style} className="px-2">
        <div className={`bg-[#050810] border rounded-[2.5rem] overflow-hidden transition-all duration-500 ${isExpanded ? 'border-slate-700 shadow-2xl' : 'border-slate-800/40 hover:border-slate-700'}`} style={{ height: 'calc(100% - 24px)' }}>
            
            {/* SESSION HEADER */}
            <div 
                className="px-10 py-8 flex items-center justify-between cursor-pointer group h-[110px]"
                onClick={onToggle}
            >
                <div className="flex items-center space-x-8">
                    <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 w-14 h-14 rounded-2xl">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{monthName}.</span>
                        <span className="text-2xl font-black text-white leading-none">{dayNum}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">{dayName}</h3>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                            <span className="text-slate-400">{(trades || []).length} EXECUTIONS</span> 
                            <span className="mx-3 opacity-20">•</span> 
                            <span className="text-emerald-500">{successRate.toFixed(0)}% SUCCESS RATE</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-12">
                    <div className="text-right">
                        <p className={`text-4xl font-black italic tracking-tighter ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toLocaleString()}
                        </p>
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1 text-right">SESSIONAL P&L</p>
                    </div>
                    <i className={`fas fa-chevron-down text-xs transition-transform duration-500 ${isExpanded ? 'rotate-180 text-blue-500' : 'text-slate-700'}`}></i>
                </div>
            </div>

            {isExpanded && (
                <div className="px-10 pb-10 space-y-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    
                    {/* MISSION BRIEFING */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">MISSION BRIEFING: STRATEGIC CONTEXT</h4>
                            </div>
                            {!prep && (
                                <div className="flex items-center space-x-2 text-[9px] font-black text-orange-500 uppercase bg-orange-500/5 px-3 py-1 rounded-lg border border-orange-500/20">
                                    <i className="fas fa-sync-alt fa-spin"></i>
                                    <span>DATA SYNC REQUIRED: GO TO PREP</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <ContextCard icon="fa-compass" label="MARKET BIAS" value={prep?.bias?.toUpperCase() || 'NOT DEFINED'} subLabel="CORE ORIENTATION" />
                            <ContextCard icon="fa-rocket" label="FOCUS SETUP" value={prep?.setup?.toUpperCase() || 'NOT DEFINED'} subLabel="PRIMARY HYPOTHESIS" />
                            <ContextCard icon="fa-sitemap" label="HTF STRUCTURE" value={prep?.htfMs?.toUpperCase() || 'NOT DEFINED'} subLabel="FRAME SYNC" />
                            <ContextCard icon="fa-bullseye" label="CORRECTION TASK" value={prep?.gkFocusError?.toUpperCase() || 'NOT DEFINED'} subLabel="DISCIPLINE TARGET" />
                            <ContextCard icon="fa-shield-halved" label="GATEKEEPER" value={prep?.gkVerdict?.toUpperCase() || 'ALPHA'} subLabel={`SCORE: ${prep?.gkTotalScore || '--'}/100`} color="text-orange-500" />
                        </div>

                        {!prep?.habJournalCompleted && (
                             <div className="bg-orange-600/5 border border-orange-500/10 p-5 rounded-[1.5rem] flex items-center justify-center space-x-3">
                                <i className="fas fa-info-circle text-orange-500 text-xs"></i>
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                    PENTRU A FI CONSIDERATĂ ZIUA DE TRADING ÎNCHISĂ COMPLETEAZĂ: <span className="text-white underline cursor-pointer hover:text-orange-300">"DAY WRAP UP"</span>
                                </p>
                             </div>
                        )}
                    </div>

                    {/* TRADE TABLE */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 px-6 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                            <div className="col-span-2">ENTRY TIME</div>
                            <div className="col-span-3">INSTRUMENT</div>
                            <div className="col-span-3">SETUP TYPE</div>
                            <div className="col-span-2">REVIEW STATUS</div>
                            <div className="col-span-2 text-right">RETURN (NET)</div>
                        </div>

                        <div className="space-y-2">
                            {(trades || []).map((t) => (
                                <Link 
                                    to={`/trade/${t.id}`} 
                                    key={t.id} 
                                    className="grid grid-cols-12 items-center px-6 py-5 bg-slate-900/20 border border-slate-800/40 rounded-2xl hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="col-span-2 text-[11px] font-mono text-slate-500 italic">{t.entryTime || '--:--'}</div>
                                    <div className="col-span-3 flex items-center space-x-3">
                                        <span className="text-sm font-black text-white tracking-tighter">{t.instrument}</span>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${t.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{t.type}</span>
                                    </div>
                                    <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase truncate pr-4">{t.setup || 'MANUAL EXEC'}</div>
                                    <div className="col-span-2">
                                        {(t.notes?.length || 0) < 15 ? (
                                            <div className="flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full w-fit">
                                                <i className="fas fa-exclamation-triangle text-[8px] text-orange-500"></i>
                                                <span className="text-[8px] font-black text-orange-500 uppercase">NEED REVIEW</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit">
                                                <i className="fas fa-check-circle text-[8px] text-blue-500"></i>
                                                <span className="text-[8px] font-black text-blue-500 uppercase">REVIEWED</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`col-span-2 text-right text-lg font-black italic tracking-tighter ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {t.pnlNet >= 0 ? '+' : '-'}${Math.abs(t.pnlNet).toLocaleString()}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

const TradeLog: React.FC = () => {
  const { 
    trades = [], dailyPreps = {}, saveDailyPrep, deleteTrade, loadTrades, 
    currentPage, hasMoreTrades, totalTradesCount, loadDailyPreps 
  } = useAppStore(useShallow(state => ({
    trades: state.trades,
    dailyPreps: state.dailyPreps,
    saveDailyPrep: state.saveDailyPrep,
    deleteTrade: state.deleteTrade,
    loadTrades: state.loadTrades,
    tradesPage: (state as any).tradesPage || 1, // Fallback for pagination state
    hasMoreTrades: (state as any).hasMoreTrades || false,
    totalTradesCount: state.totalTradesCount || 0,
    loadDailyPreps: state.loadDailyPreps,
  })));

  const [filter, setFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING'>('ALL');
  const [isWrapUpOpen, setIsWrapUpOpen] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  
  const todayStr = new Date().toISOString().split('T')[0];
  const listRef = useRef<List>(null);

  useEffect(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    loadDailyPreps(currentMonth);
    setExpandedDays(prev => ({ ...prev, [todayStr]: true }));
  }, [loadDailyPreps, todayStr]);

  const filteredTrades = useMemo(() => {
    const safeTrades = trades || [];
    return safeTrades.filter(t => {
      const searchTerms = filter.toLowerCase();
      const matchSearch = (t.instrument || '').toLowerCase().includes(searchTerms) || 
                          (t.setup || '').toLowerCase().includes(searchTerms) ||
                          (t.date || '').includes(searchTerms);
      
      if (filterMode === 'PENDING') {
          return matchSearch && (t.notes?.length || 0) < 15;
      }
      return matchSearch;
    });
  }, [trades, filter, filterMode]);

  const tradesByDate = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => { 
        if (!groups[t.date]) groups[t.date] = []; 
        groups[t.date].push(t); 
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTrades]);

  const toggleDay = useCallback((index: number, date: string) => {
    setExpandedDays(prev => {
        const next = { ...prev, [date]: !prev[date] };
        return next;
    });
    setTimeout(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(index);
        }
    }, 0);
  }, []);

  const getItemSize = (index: number) => {
    if (index === tradesByDate.length) return 100;
    const [date, dayTrades] = tradesByDate[index];
    const isExpanded = !!expandedDays[date];
    
    if (isExpanded) {
        return ROW_HEADER_HEIGHT + BRIEFING_HEIGHT + ((dayTrades || []).length * TRADE_ITEM_HEIGHT) + ROW_MARGIN_BOTTOM;
    }
    return ROW_HEADER_HEIGHT + ROW_MARGIN_BOTTOM;
  };

  const handleLoadMore = () => {
    if (hasMoreTrades) {
      const controller = new AbortController();
      loadTrades(); // Assuming simplified loadTrades based on storageService updates
    }
  };

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    if (index === tradesByDate.length) {
        return (
            <div style={style} className="px-2 pb-6">
                {hasMoreTrades ? (
                    <button 
                        onClick={handleLoadMore}
                        className="w-full h-full border border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                    >
                        Load older sessions...
                    </button>
                ) : (
                    <div className="flex items-center justify-center h-full opacity-30 italic font-black uppercase tracking-widest text-slate-700">
                        End of Battle Debrief Log
                    </div>
                )}
            </div>
        );
    }

    const [date, dayTrades] = tradesByDate[index];
    const isExpanded = !!expandedDays[date];

    return (
        <DayReviewGroup 
            date={date} 
            trades={dayTrades} 
            prep={dailyPreps[date]} 
            onDeleteTrade={deleteTrade}
            isExpanded={isExpanded}
            onToggle={() => toggleDay(index, date)}
            style={style}
        />
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto w-full">
      
      {/* GLOBAL HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-10 py-8 bg-[#0b1222]/30 border border-slate-800/40 rounded-[3rem] shadow-xl shrink-0">
        <div className="flex items-center space-x-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
                <i className="fas fa-history text-2xl"></i>
            </div>
            <div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">BATTLE DEBRIEF LOG</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2">SESSION AUDIT & PERFORMANCE FEEDBACK ENGINE</p>
            </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                <button 
                    onClick={() => setFilterMode('ALL')}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'ALL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    ALL SESSIONS
                </button>
                <button 
                    onClick={() => setFilterMode('PENDING')}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'PENDING' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    PENDING REVIEW
                </button>
            </div>

            <div className="relative group min-w-[300px]">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                    type="text" 
                    placeholder="Search by Ticker, Setup or Date..." 
                    className="bg-black border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white w-full transition-all" 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)} 
                />
            </div>

            <button onClick={() => setIsWrapUpOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center space-x-3">
                <i className="fas fa-check-double"></i>
                <span>DAY WRAP UP</span>
            </button>
        </div>
      </div>

      <div className="flex-1 w-full rounded-[3rem] overflow-hidden">
         {tradesByDate.length > 0 ? (
             <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        width={width}
                        itemCount={tradesByDate.length + 1}
                        itemSize={getItemSize}
                        className="custom-scrollbar"
                    >
                        {Row}
                    </List>
                )}
             </AutoSizer>
         ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                <i className="fas fa-radar text-6xl mb-6 text-slate-800"></i>
                <div className="text-xl font-black uppercase tracking-[0.4em] text-slate-700">Scan area clear. No logs found.</div>
            </div>
         )}
      </div>

      <DayWrapUpModal isOpen={isWrapUpOpen} onClose={() => setIsWrapUpOpen(false)} date={todayStr} onSave={saveDailyPrep} />
    </div>
  );
};

export default TradeLog;
