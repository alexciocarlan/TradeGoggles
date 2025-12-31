
import React, { useState, useMemo } from 'react';
import { BacktestSession, Playbook, Trade, WeeklyPrepData, DailyPrepData } from '../types';
import { useAppContext } from '../AppContext';
import NewBacktestModal from './NewBacktestModal';
import NewTradeModal from './NewTradeModal';
import DailyPrepModal from './DailyPrepModal';
import WeeklyPrepModal from './WeeklyPrepModal';
import DecisionFunnelModal from './DecisionFunnelModal';

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

// Widget-ul Cockpit adaptat pentru mediul de backtesting
const SimStrategicAlignmentCockpit = ({ prep, date, playbooks }: { prep?: DailyPrepData, date: string, playbooks: Playbook[] }) => {
  const alignment = useMemo(() => {
    if (!prep) return null;

    const protocolStrings: string[] = [];
    let setups: { pb: Playbook; confidence: 'HIGH' | 'LOW' | 'PENDING'; msg?: string }[] = [];

    // 1. BIAS PROTOCOL
    if (prep.mediumTermTrend === 'Up') protocolStrings.push("BIAS: TREND UP. KEEP LONGS LONGER AND TAKE FAST TP FOR SHORTS.");
    else if (prep.mediumTermTrend === 'Down') protocolStrings.push("BIAS: TREND DOWN. KEEP SHORTS LONGER AND TAKE FAST TP FOR LONGS.");
    else protocolStrings.push("BIAS: BALANCING. PRIORITIZE ROTATIONAL TRADES. DO NOT CHASE.");

    // 2. OPEN & GAP ARBITRAGE (AMT Logic)
    if (prep.pdValueRelationship === 'GAP') {
      const isDrive = prep.openType === 'Drive' || prep.openType === 'Test driver';
      const isReversal = prep.openType === 'Rejection- Reversal';

      if (isDrive) {
        protocolStrings.push("OPEN: GAP & DRIVE DETECTED. HIGH CONVICTION INITIATIVE.");
        const pb = playbooks.find(p => p.id === 'pb-12');
        if (pb) setups.push({ pb, confidence: 'HIGH', msg: "Aggressive Initiative. Do not fade." });
      } else if (isReversal) {
        protocolStrings.push("OPEN: GAP REJECTION. LOOKING FOR MEAN REVERSION TO VALUE.");
        const pb = playbooks.find(p => p.id === 'pb-13');
        if (pb) setups.push({ pb, confidence: 'HIGH', msg: "Responsive Selling/Buying. Target pdRange." });
      } else {
        protocolStrings.push("OPEN: GAP STATE. VOLATILITY EXPECTED BUT NO CLEAR DRIVE YET.");
        const pb12 = playbooks.find(p => p.id === 'pb-12');
        const pb13 = playbooks.find(p => p.id === 'pb-13');
        if (pb12) setups.push({ pb: pb12, confidence: 'LOW' });
        if (pb13) setups.push({ pb: pb13, confidence: 'LOW' });
      }
    } else if (prep.pdValueRelationship === 'OutsideVA') {
      protocolStrings.push("OPEN: OUTSIDE VALUE. HIGH PROBABILITY OF THE 80% RULE. TARGET OPPOSITE VA EDGE.");
      const pb4 = playbooks.find(p => p.id === 'pb-4');
      if (pb4) setups.push({ pb: pb4, confidence: 'PENDING', msg: "Valid ONLY if price enters VA and accepts (2 TPOs)." });
      const pb5 = playbooks.find(p => p.id === 'pb-5');
      if (pb5) setups.push({ pb: pb5, confidence: 'LOW' });
    }

    // 3. REGIME
    if (prep.marketCondition === 'Trend') {
      protocolStrings.push("REGIME: MOMENTUM / TREND. DON'T FIGHT THE DRIVE.");
      const pb6 = playbooks.find(p => p.id === 'pb-6');
      if (pb6) setups.push({ pb: pb6, confidence: 'HIGH' });
    } else if (prep.marketCondition === 'Bracket') {
      protocolStrings.push("REGIME: BRACKETING. FADE THE EDGES, REVERT TO POC.");
    }

    // Filter duplicates
    const uniqueSetups = Array.from(new Map(setups.map(s => [s.pb.id, s])).values());

    return { protocolStrings, setups: uniqueSetups };
  }, [prep, date, playbooks]);

  if (!prep || !alignment) return (
    <div className="bg-[#0b1222]/40 border border-slate-800 p-12 rounded-[3rem] text-center opacity-40">
        <i className="fas fa-radar text-4xl text-slate-800 mb-6"></i>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Așteptare calibrare scanner simulat...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* PANEL STÂNGA: STRATEGIC PROTOCOL */}
      <div className="bg-[#0b1222]/80 border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <i className="fas fa-robot text-sm"></i>
          </div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Strategic Protocol (Sim)</h4>
        </div>
        
        <div className="space-y-4">
          {alignment.protocolStrings.map((line, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 bg-[#060b13] border border-slate-800 rounded-2xl group transition-all hover:border-blue-500/40">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight leading-relaxed">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DREAPTA: PLAYBOOK ACTIVATION */}
      <div className="bg-[#0b1222]/80 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <i className="fas fa-puzzle-piece text-sm"></i>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Validated Strategy (Sim)</h4>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Decision Matrix V4.5</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          {alignment.setups.map(({ pb, confidence, msg }) => (
            <div key={pb.id} className={`p-4 rounded-2xl border transition-all hover:translate-y-[-2px] ${
                confidence === 'HIGH' ? 'bg-emerald-600/5 border-emerald-500/20' :
                confidence === 'PENDING' ? 'bg-slate-900/40 border-slate-800 opacity-60' :
                'bg-orange-600/5 border-orange-500/20'
              }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-xl shrink-0">{pb.icon}</span>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{pb.name}</p>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest truncate">{pb.entryAt}</p>
                  </div>
                </div>
                <span className={`text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0 ${
                  confidence === 'HIGH' ? 'bg-emerald-500 text-white' :
                  confidence === 'PENDING' ? 'bg-slate-700 text-slate-300' :
                  'bg-orange-500 text-white'
                }`}>{confidence}</span>
              </div>
              {msg && <p className="text-[8px] font-bold italic text-slate-600 mt-2 leading-tight">"{msg}"</p>}
            </div>
          ))}

          {alignment.setups.length === 0 && (
            <div className="col-span-2 py-10 text-center border border-dashed border-slate-800 rounded-3xl opacity-30">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Searching for valid edge...</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800/40 mt-8">
           <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Other potential setups:</h5>
           <div className="flex flex-wrap gap-2">
             {playbooks.filter(p => !alignment.setups.find(s => s.pb.id === p.id)).slice(0, 4).map(p => (
                <span key={p.id} className="text-[7px] font-black text-slate-600 bg-slate-950 border border-slate-900 px-2.5 py-1 rounded-md uppercase">{p.name}</span>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const getWeekIdFromDateStr = (dateStr: string) => {
    const date = new Date(dateStr);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const Backtesting: React.FC<{ sessions: BacktestSession[], onAddSession: (s: BacktestSession) => void, playbooks: Playbook[] }> = ({ sessions, onAddSession, playbooks }) => {
  const { backtestTrades, addBacktestTrade, updateBacktestTrade, deleteBacktestTrade, language, saveBacktestDailyPrep, saveBacktestWeeklyPrep, accounts } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isWeeklyPrepModalOpen, setIsWeeklyPrepModalOpen] = useState(false);
  const [isDailyPrepModalOpen, setIsDailyPrepModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  
  const [simDate, setSimDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const activeSession = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);
  
  const sessionTrades = useMemo(() => 
    backtestTrades.filter(t => t.sessionId === selectedSessionId)
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
    const totalTrades = backtestTrades.length;
    const winRate = totalTrades > 0 ? (backtestTrades.filter(t => t.status === 'WIN').length / totalTrades) * 100 : 0;
    const totalPnl = backtestTrades.reduce((s, t) => s + t.pnlNet, 0);
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
    if (selectedSessionId) saveBacktestDailyPrep(selectedSessionId, date, prep);
    setIsDailyPrepModalOpen(false);
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
                      {sessions.map(s => {
                        const acc = accounts.find(a => a.id === s.accountId);
                        return (
                            <tr key={s.id} className="hover:bg-indigo-600/[0.03] transition-colors group cursor-pointer" onClick={() => setSelectedSessionId(s.id)}>
                            <td className="px-8 py-5">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                        <i className="fas fa-flask"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{s.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{s.createdAt.split('T')[0]}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center font-black text-indigo-400 text-[10px] uppercase">{acc?.name || 'Manual'}</td>
                            <td className="px-6 py-5 text-center font-black text-slate-400 text-xs">{s.symbol}</td>
                            <td className="px-6 py-5 text-center font-black text-slate-100 text-xs">{backtestTrades.filter(t => t.sessionId === s.id).length}</td>
                            <td className="px-6 py-5 text-center font-black text-green-500 text-xs">${backtestTrades.filter(t => t.sessionId === s.id).reduce((sum, t) => sum + t.pnlNet, 0).toLocaleString()}</td>
                            <td className="px-8 py-5 text-right">
                                <button className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Enter Lab</button>
                            </td>
                            </tr>
                        );
                      })}
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
                        onClick={() => setIsDailyPrepModalOpen(true)}
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
                 
                 {/* WEEKLY SIM CONTEXT */}
                 <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800/50 pb-3 flex items-center">
                        <i className="fas fa-anchor mr-2 text-blue-500"></i> Weekly Operational Anchor (Simulated)
                    </h4>
                    {currentSimWeeklyPrep ? (
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1 space-y-6">
                                <div className="flex justify-between items-center bg-slate-950/40 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sessional Bias:</span>
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

                 {/* ALIGNMENT COCKPIT - THE NEW CENTRALIZED SYSTEM */}
                 <SimStrategicAlignmentCockpit prep={currentSimDailyPrep as DailyPrepData} date={simDate} playbooks={playbooks} />

                 {/* TRADE LOG */}
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
                                {sessionTrades.map(t => (
                                    <tr key={t.id} className="hover:bg-indigo-600/[0.02] transition-colors group">
                                        <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase italic">{t.date}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px]">{playbooks.find(p => p.name === t.setup)?.icon || '📊'}</div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-tight">{t.setup}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${t.status === 'WIN' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{t.status}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-[10px] font-black text-slate-400">1:{t.rrRealized}R</td>
                                        <td className={`px-6 py-5 text-sm font-black text-center tracking-tighter ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.pnlNet >= 0 ? '+' : '-'}${Math.abs(t.pnlNet).toLocaleString()}
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
                                {sessionTrades.length === 0 && (
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
                 {/* ACCURACY METER */}
                 <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl text-center relative overflow-hidden group">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Calibration Accuracy</p>
                    <div className="relative mb-6">
                        <svg className="w-40 h-40 mx-auto -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800/40" strokeWidth="3" />
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-600 transition-all duration-[2000ms] ease-out" strokeWidth="3" 
                                strokeDasharray={`${sessionTrades.length > 0 ? (sessionTrades.filter(t => t.status === 'WIN').length / sessionTrades.length * 100) : 0}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-4xl font-black text-white italic tracking-tighter">
                                {sessionTrades.length > 0 ? (sessionTrades.filter(t => t.status === 'WIN').length / sessionTrades.length * 100).toFixed(0) : '0'}%
                            </p>
                        </div>
                    </div>
                    <p className="text-[9px] font-black text-indigo-400 uppercase italic opacity-60">Session Win Rate</p>
                    <i className="fas fa-chart-pie absolute -bottom-8 -right-8 text-8xl text-indigo-500/[0.03] pointer-events-none transition-transform group-hover:rotate-12 duration-1000"></i>
                 </div>

                 {/* SESSION P&L */}
                 <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Sim Return</p>
                    <p className={`text-4xl font-black tracking-tighter italic ${sessionTrades.reduce((s,t)=>s+t.pnlNet,0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${sessionTrades.reduce((s,t)=>s+t.pnlNet,0).toLocaleString()}
                    </p>
                 </div>

                 {/* PROTOCOL CHECKPOINTS */}
                 <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem]">
                    <h5 className="text-[9px] font-black text-slate-500 uppercase mb-8 tracking-widest border-b border-slate-800 pb-3 italic">Protocol Integrity Check</h5>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                            <span className={currentSimWeeklyPrep ? 'text-white' : 'text-slate-700'}>Macro Identified</span>
                            <i className={`fas ${currentSimWeeklyPrep ? 'fa-check-circle text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'fa-circle text-slate-800'}`}></i>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                            <span className={currentSimDailyPrep ? 'text-white' : 'text-slate-700'}>Scanner Aligned</span>
                            <i className={`fas ${currentSimDailyPrep ? 'fa-check-circle text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'fa-circle text-slate-800'}`}></i>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                            <span className={isStrategySelected ? 'text-white' : 'text-slate-700'}>Edge Activated</span>
                            <i className={`fas ${isStrategySelected ? 'fa-check-circle text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'fa-circle text-slate-800'}`}></i>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                            <span className={sessionTrades.some(t => t.date === simDate) ? 'text-white' : 'text-slate-700'}>Trade Logged</span>
                            <i className={`fas ${sessionTrades.some(t => t.date === simDate) ? 'fa-check-circle text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'fa-circle text-slate-800'}`}></i>
                        </div>
                    </div>
                    
                    {!currentSimWeeklyPrep && (
                        <div className="mt-8 bg-orange-600/10 border border-orange-500/20 p-5 rounded-2xl animate-pulse">
                            <p className="text-[9px] font-black text-orange-400 uppercase tracking-tight leading-relaxed text-center italic">
                                Începe cu Pasul 1 (Weekly) pentru a calibra contextul simulării.
                            </p>
                        </div>
                    )}
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
            accounts={accounts} 
            playbooks={playbooks} 
            trades={backtestTrades}
            initialTrade={editingTrade || undefined}
            dailyPreps={{ [simDate]: currentSimDailyPrep as DailyPrepData }} 
            language={language}
            currentAccountId={activeSession?.accountId}
        />
      )}

      {isWeeklyPrepModalOpen && (
          <WeeklyPrepModal 
            initialData={currentSimWeeklyPrep}
            language={language}
            onClose={() => setIsWeeklyPrepModalOpen(false)}
            onSave={handleSaveSimWeekly}
            selectedDate={simDate}
          />
      )}

      {isDailyPrepModalOpen && (
          <DailyPrepModal 
            playbooks={playbooks} 
            language={language} 
            weeklyPreps={activeSession?.simulatedWeeklyPreps || {}}
            onClose={() => setIsDailyPrepModalOpen(false)} 
            onSave={(d, p) => handleSaveSimDaily(d, p)}
            initialDate={simDate}
            initialData={currentSimDailyPrep}
          />
      )}

      {isScannerOpen && (
          <DecisionFunnelModal 
            onClose={() => setIsScannerOpen(false)}
            onSave={(updates) => handleSaveSimDaily(simDate, updates)}
          />
      )}
    </div>
  );
};

export default Backtesting;
