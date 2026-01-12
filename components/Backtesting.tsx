
import React, { useState, useMemo, useEffect } from 'react';
import { BacktestSession, Playbook, Trade, WeeklyPrepData, DailyPrepData } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { NewTradeModal } from './NewTradeModal';
import NewBacktestModal from './NewBacktestModal';
import DailyPrepModal from './DailyPrepModal';
import WeeklyPrepModal from './WeeklyPrepModal';
import DecisionFunnelModal from './DecisionFunnelModal';
import StrategicAlignmentCockpit from './StrategicAlignmentCockpit';
import StrategySelectionModal from './StrategySelectionModal';

const StatsCard = ({ title, value, subValue, icon, color = "blue" }: { title: string, value: string, subValue?: string, icon: string, color?: string }) => (
  <div className="bg-[#0b1222] border border-slate-800 p-6 rounded-3xl shadow-sm relative group transition-all hover:translate-y-[-2px]">
    <div className="flex items-center space-x-3 mb-4">
      <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center text-${color}-500 border border-${color}-500/20`}>
         <i className={`fas ${icon} text-[10px]`}></i>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
    </div>
    <p className="text-3xl font-black text-white mb-2">{value}</p>
    {subValue && (
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{subValue}</p>
    )}
  </div>
);

const getWeekIdFromDateStr = (dateStr: string) => {
    const date = new Date(dateStr);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const Backtesting: React.FC<{ sessions?: BacktestSession[], onAddSession: (s: BacktestSession) => void, playbooks: Playbook[] }> = ({ sessions = [], onAddSession, playbooks = [] }) => {
  const { 
    backtestSessions, // Connected to store
    backtestTrades = [], 
    addBacktestTrade, 
    updateBacktestTrade, 
    deleteBacktestTrade, 
    saveBacktestDailyPrep, 
    saveBacktestWeeklyPrep, 
    accounts = [], 
    loadBacktestData, 
    loadBacktestSessions 
  } = useAppStore(useShallow(state => ({
    backtestSessions: state.backtestSessions || [],
    backtestTrades: state.backtestTrades || [],
    addBacktestTrade: state.addBacktestTrade,
    updateBacktestTrade: state.updateBacktestTrade,
    deleteBacktestTrade: state.deleteBacktestTrade,
    saveBacktestDailyPrep: state.saveBacktestDailyPrep,
    saveBacktestWeeklyPrep: state.saveBacktestWeeklyPrep,
    accounts: state.accounts || [],
    loadBacktestData: state.loadBacktestData,
    loadBacktestSessions: state.loadBacktestSessions
  })));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isWeeklyPrepModalOpen, setIsWeeklyPrepModalOpen] = useState(false);
  const [isStrategySelectionOpen, setIsStrategySelectionOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [simDate, setSimDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadBacktestData();
    loadBacktestSessions(); 
  }, [loadBacktestData, loadBacktestSessions]);

  // Use backtestSessions from store instead of props to ensure updates are reflected
  const displaySessions = backtestSessions;

  const activeSession = useMemo(() => (displaySessions || []).find(s => s.id === selectedSessionId), [displaySessions, selectedSessionId]);
  
  const sessionTrades = useMemo(() => 
    (backtestTrades || []).filter(t => t.sessionId === selectedSessionId)
  , [backtestTrades, selectedSessionId]);

  const simWeekId = useMemo(() => {
    return getWeekIdFromDateStr(simDate);
  }, [simDate]);

  const currentSimWeeklyPrep = activeSession?.simulatedWeeklyPreps?.[simWeekId];
  const currentSimDailyPrep = activeSession?.simulatedDailyPreps?.[simDate];

  const isStrategySelected = useMemo(() => {
    return !!currentSimDailyPrep?.setup && currentSimDailyPrep.setup !== 'None';
  }, [currentSimDailyPrep]);

  const globalStats = useMemo(() => {
    const safeTrades = Array.isArray(backtestTrades) ? backtestTrades : [];
    const totalTrades = safeTrades.length;
    const winRate = totalTrades > 0 ? (safeTrades.filter(t => t.status === 'WIN').length / totalTrades) * 100 : 0;
    const totalPnl = safeTrades.reduce((s, t) => s + (t.pnlNet || 0), 0);
    return { totalTrades, winRate, totalPnl };
  }, [backtestTrades]);

  const handleSaveTrade = (trade: Trade) => {
    if (!selectedSessionId) return;
    if (editingTrade) {
        updateBacktestTrade(trade);
    } else {
        addBacktestTrade({ 
            ...trade, 
            sessionId: selectedSessionId,
            accountId: activeSession?.accountId || trade.accountId,
            date: simDate,
            bias: currentSimDailyPrep?.bias || 'Neutral',
            pdValueRelationship: currentSimDailyPrep?.pdValueRelationship || 'None'
        } as Trade);
    }
    setIsTradeModalOpen(false);
    setEditingTrade(null);
  };

  const handleEditTrade = (t: Trade) => {
    setEditingTrade(t);
    setIsTradeModalOpen(true);
  };

  const handleDeleteTrade = (id: string) => {
    if (confirm('Ești sigur că vrei să ștergi această execuție simulată?')) {
        deleteBacktestTrade(id);
    }
  };

  const handleSaveSimWeekly = (wId: string, prep: WeeklyPrepData) => {
    if (selectedSessionId) saveBacktestWeeklyPrep(selectedSessionId, wId, prep);
    setIsWeeklyPrepModalOpen(false);
  };

  const handleSaveSimDaily = (date: string, prep: Partial<DailyPrepData>) => {
    if (selectedSessionId) {
        saveBacktestDailyPrep(selectedSessionId, date, prep);
        if (date !== simDate) setSimDate(date);
    }
    setIsStrategySelectionOpen(false);
    setIsScannerOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end">
        <div>
           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Scientific Edge Calibration</p>
           <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Backtesting Laboratory</h2>
        </div>
        {!selectedSessionId && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center"
            >
                <i className="fas fa-plus mr-2"></i> New Training Session
            </button>
        )}
      </div>

      {!selectedSessionId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatsCard title="Global Backtest Trades" value={globalStats.totalTrades.toString()} subValue="Across all sessions" icon="fa-layer-group" />
             <StatsCard title="Mean Calibration WR" value={`${globalStats.winRate.toFixed(1)}%`} subValue="Accuracy level" icon="fa-bullseye" color="emerald" />
             <StatsCard title="Theoretical Return" value={`$${globalStats.totalPnl.toLocaleString()}`} subValue="Net simulated profit" icon="fa-coins" color="indigo" />
          </div>

          <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-slate-800 bg-slate-900/20">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Study Sessions</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-950/40 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
                      <tr>
                         <th className="px-8 py-6">Session Name</th>
                         <th className="px-6 py-6 text-center">Risk Profile</th>
                         <th className="px-6 py-6 text-center">Symbol</th>
                         <th className="px-6 py-6 text-center">Trades</th>
                         <th className="px-6 py-6 text-center">P&L</th>
                         <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/40">
                      {displaySessions.map(s => {
                        const acc = accounts.find(a => a.id === s.accountId);
                        const sessionTradesCount = (backtestTrades || []).filter(t => t.sessionId === s.id).length;
                        const sessionPnl = (backtestTrades || []).filter(t => t.sessionId === s.id).reduce((sum, t) => sum + (t.pnlNet || 0), 0);
                        return (
                            <tr key={s.id} className="hover:bg-indigo-600/[0.03] transition-colors group cursor-pointer" onClick={() => setSelectedSessionId(s.id)}>
                            <td className="px-8 py-5">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                        <i className="fas fa-flask"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{s.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{s.createdAt?.split('T')[0] || 'N/A'}</p>
                                    </div>
                                    </div>
                            </td>
                            <td className="px-6 py-5 text-center font-black text-indigo-400 text-[10px] uppercase">{acc?.name || 'Manual'}</td>
                            <td className="px-6 py-5 text-center font-black text-slate-400 text-xs">{s.symbol}</td>
                            <td className="px-6 py-5 text-center font-black text-slate-100 text-xs">{sessionTradesCount}</td>
                            <td className={`px-6 py-5 text-center font-black text-xs ${sessionPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>${sessionPnl.toLocaleString()}</td>
                            <td className="px-8 py-5 text-right">
                                <button className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Enter Lab</button>
                            </td>
                            </tr>
                        );
                      })}
                      {displaySessions.length === 0 && (
                          <tr>
                              <td colSpan={6} className="py-20 text-center opacity-30 italic text-slate-500 font-bold uppercase tracking-widest text-xs">
                                  No Active Sessions Found. Create one to start.
                              </td>
                          </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
           <div className="flex flex-col lg:flex-row items-center justify-between bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 gap-6">
              <div className="flex items-center space-x-6">
                 <button onClick={() => setSelectedSessionId(null)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl"><i className="fas fa-arrow-left text-lg"></i></button>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{activeSession?.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{activeSession?.symbol} // {activeSession?.playbookName}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <div className="flex items-center space-x-2">
                           <span className="text-[9px] font-black text-slate-500 uppercase">Simulated Date:</span>
                           <input type="date" value={simDate} onChange={(e) => setSimDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-[10px] font-black text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer" />
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                    <button 
                        onClick={() => setIsWeeklyPrepModalOpen(true)}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center ${currentSimWeeklyPrep ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-white ring-1 ring-orange-500/30 animate-pulse'}`}
                    >
                        <i className={`fas ${currentSimWeeklyPrep ? 'fa-check-circle' : 'fa-anchor'} mr-2`}></i>
                        1. Weekly
                    </button>
                    <button 
                        disabled={!currentSimWeeklyPrep}
                        onClick={() => setIsScannerOpen(true)}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center ${currentSimDailyPrep ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : !currentSimWeeklyPrep ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-white ring-1 ring-blue-500/30 animate-pulse'}`}
                    >
                        <i className={`fas ${currentSimDailyPrep ? 'fa-check-circle' : 'fa-filter'} mr-2`}></i>
                        2. Scanner
                    </button>
                    <button 
                        disabled={!currentSimDailyPrep}
                        onClick={() => setIsStrategySelectionOpen(true)}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center ${isStrategySelected ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : !currentSimDailyPrep ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-white ring-1 ring-indigo-500/30 animate-pulse'}`}
                    >
                        <i className={`fas ${isStrategySelected ? 'fa-check-circle' : 'fa-rocket'} mr-2`}></i>
                        3. Strategy
                    </button>
                 </div>

                 <button 
                    disabled={!isStrategySelected}
                    onClick={() => { setEditingTrade(null); setIsTradeModalOpen(true); }}
                    className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center shadow-2xl ${isStrategySelected ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95' : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed opacity-50'}`}
                >
                    <i className="fas fa-plus mr-2 text-lg"></i> Record Trade
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3 space-y-10">
                 <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800/50 pb-3 flex items-center">
                        <i className="fas fa-anchor mr-2 text-blue-500"></i> Weekly Operational Anchor (Simulated)
                    </h4>
                    {currentSimWeeklyPrep ? (
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1 space-y-6">
                                <div className="flex justify-between items-center bg-slate-950/40 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                    <span className="text-11px] font-black text-slate-400 uppercase tracking-widest">Sessional Bias:</span>
                                    <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${currentSimWeeklyPrep.weeklyBias === 'Bullish' ? 'bg-green-500/10 text-green-500 border-green-500/20' : currentSimWeeklyPrep.weeklyBias === 'Bearish' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{currentSimWeeklyPrep.weeklyBias} BIAS</span>
                                </div>
                                <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
                                    <p className="text-[9px] font-black text-slate-600 uppercase mb-3 tracking-widest">Macro Thesis</p>
                                    <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed">"{currentSimWeeklyPrep.weeklyNarrative || 'No macro notes recorded for this simulation period.'}"</p>
                                </div>
                            </div>
                            <div className="md:w-72 bg-indigo-600/5 border border-indigo-500/10 p-6 rounded-3xl flex flex-col justify-center text-center">
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2">Sim Target</p>
                                <p className="text-xl font-black text-white italic">"{currentSimWeeklyPrep.weeklyGoals || 'Refine entry logic'}"</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-950/20">
                            <i className="fas fa-exclamation-triangle text-orange-500 text-3xl mb-4 opacity-40"></i>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">ANCORĂ SĂPTĂMÂNALĂ LIPSĂ PENTRU {simWeekId}</p>
                            <button onClick={() => setIsWeeklyPrepModalOpen(true)} className="text-[9px] font-black text-white bg-blue-600 px-6 py-2.5 rounded-xl uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Set Simulation Weekly Macro</button>
                        </div>
                    )}
                 </div>

                 <StrategicAlignmentCockpit prep={currentSimDailyPrep as DailyPrepData} date={simDate} playbooks={playbooks} />

                 <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Calibration History (Session Log)</h4>
                       <div className="flex items-center space-x-3">
                           <span className="text-[9px] font-black text-slate-500 uppercase">Total: {sessionTrades.length}</span>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/40 text-[9px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-800/50">
                                <tr>
                                    <th className="px-8 py-4">Sim Date</th>
                                    <th className="px-6 py-4">Strategy Executed</th>
                                    <th className="px-6 py-4 text-center">Result</th>
                                    <th className="px-6 py-4 text-center">Efficiency</th>
                                    <th className="px-6 py-4 text-center">Simulation P&L</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {(sessionTrades || []).map(t => (
                                    <tr key={t.id} className="hover:bg-indigo-600/[0.02] transition-colors group">
                                        <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase italic">{t.date}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px]">{(playbooks || []).find(p => p.name === t.setup)?.icon || '📊'}</div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">{t.setup}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${t.status === 'WIN' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{t.status}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-[10px] font-black text-slate-400">1:{t.rrRealized || 0}R</td>
                                        <td className={`px-6 py-5 text-sm font-black text-center tracking-tighter ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.pnlNet >= 0 ? '+' : '-'}${Math.abs(t.pnlNet || 0).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button onClick={() => handleEditTrade(t)} className="text-slate-500 hover:text-blue-400 transition-colors p-1.5 bg-slate-900/50 border border-slate-800 rounded-lg shadow-sm" title="Editează execuția">
                                                <i className="fas fa-edit text-[10px]"></i>
                                            </button>
                                            <button onClick={() => handleDeleteTrade(t.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1.5 bg-slate-900/50 border border-slate-800 rounded-lg shadow-sm" title="Șterge execuția">
                                                <i className="fas fa-trash text-[10px]"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!sessionTrades || sessionTrades.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center opacity-30">
                                            <i className="fas fa-box-open text-3xl mb-4 block text-slate-700"></i>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Așteptare prima execuție calibrată...</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-8">
                 <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl text-center relative overflow-hidden group">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Calibration Accuracy</p>
                    <div className="relative mb-6">
                        <svg className="w-40 h-40 mx-auto -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800/40" strokeWidth="3" />
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-600 transition-all duration-[2000ms] ease-out" strokeWidth="3" 
                                strokeDasharray={`${sessionTrades && sessionTrades.length > 0 ? (sessionTrades.filter(t => t.status === 'WIN').length / sessionTrades.length * 100) : 0}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-4xl font-black text-white italic tracking-tighter">
                                {sessionTrades && sessionTrades.length > 0 ? (sessionTrades.filter(t => t.status === 'WIN').length / sessionTrades.length * 100).toFixed(0) : '0'}%
                            </p>
                        </div>
                    </div>
                    <p className="text-[9px] font-black text-indigo-400 uppercase italic opacity-60">Session Win Rate</p>
                 </div>

                 <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Sim Return</p>
                    <p className={`text-4xl font-black tracking-tighter italic ${sessionTrades.reduce((s,t)=>s+(t.pnlNet||0),0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${sessionTrades.reduce((s,t)=>s+(t.pnlNet||0),0).toLocaleString()}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && <NewBacktestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAddSession} playbooks={playbooks} />}
      
      {isTradeModalOpen && selectedSessionId && (
        <NewTradeModal 
            isOpen={isTradeModalOpen} 
            onClose={() => { setIsTradeModalOpen(false); setEditingTrade(null); }} 
            onSave={handleSaveTrade} 
            initialTrade={editingTrade || undefined}
            currentAccountId={activeSession?.accountId}
        />
      )}

      {isWeeklyPrepModalOpen && (
          <WeeklyPrepModal 
            isOpen={isWeeklyPrepModalOpen}
            initialData={currentSimWeeklyPrep}
            onClose={() => setIsWeeklyPrepModalOpen(false)}
            onSave={handleSaveSimWeekly}
            selectedDate={simDate}
          />
      )}

      {isStrategySelectionOpen && (
          <StrategySelectionModal
            onClose={() => setIsStrategySelectionOpen(false)} 
            onSave={(updates, date) => handleSaveSimDaily(date, updates)}
            initialPrep={currentSimDailyPrep}
            date={simDate}
            isBacktest={true}
            simulatedWeeklyPreps={activeSession?.simulatedWeeklyPreps}
          />
      )}

      {isScannerOpen && (
          <DecisionFunnelModal 
            onClose={() => setIsScannerOpen(false)}
            onSave={(updates, date) => handleSaveSimDaily(date, updates)}
            initialPrep={currentSimDailyPrep}
            initialWeeklyPrep={currentSimWeeklyPrep}
            date={simDate}
            isBacktest={true}
            simulatedWeeklyPreps={activeSession?.simulatedWeeklyPreps}
          />
      )}
    </div>
  );
};

export default Backtesting;
