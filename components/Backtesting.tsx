
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BacktestSession, Playbook, Trade } from '../types';
import { useAppContext } from '../AppContext';
import NewBacktestModal from './NewBacktestModal';
import NewTradeModal from './NewTradeModal';
import DailyPrepModal from './DailyPrepModal';

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

const Backtesting: React.FC<{ sessions: BacktestSession[], onAddSession: (s: BacktestSession) => void, playbooks: Playbook[] }> = ({ sessions, onAddSession, playbooks }) => {
  const { backtestTrades, addBacktestTrade, dailyPreps, saveDailyPrep, language } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [currentSimDate, setCurrentSimDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const activeSession = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);
  
  const sessionTrades = useMemo(() => 
    backtestTrades.filter(t => t.sessionId === selectedSessionId)
  , [backtestTrades, selectedSessionId]);

  const globalStats = useMemo(() => {
    const totalTrades = backtestTrades.length;
    const winRate = totalTrades > 0 ? (backtestTrades.filter(t => t.status === 'WIN').length / totalTrades) * 100 : 0;
    const totalPnl = backtestTrades.reduce((s, t) => s + t.pnlNet, 0);
    return { totalTrades, winRate, totalPnl };
  }, [backtestTrades]);

  const handleSaveTrade = (trade: Trade) => {
    if (!selectedSessionId) return;
    addBacktestTrade({ ...trade, sessionId: selectedSessionId });
    setIsTradeModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Scientific Edge Calibration</p>
           <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Backtesting Laboratory</h2>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i> New Training Session
        </button>
      </div>

      {!selectedSessionId ? (
        <>
          {/* OVERVIEW STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatsCard title="Global Backtest Trades" value={globalStats.totalTrades.toString()} subValue="Across all sessions" icon="fa-layer-group" />
             <StatsCard title="Mean Calibration WR" value={`${globalStats.winRate.toFixed(1)}%`} subValue="Accuracy level" icon="fa-bullseye" color="emerald" />
             <StatsCard title="Theoretical Return" value={`$${globalStats.totalPnl.toLocaleString()}`} subValue="Net simulated profit" icon="fa-coins" color="indigo" />
          </div>

          {/* SESSIONS LIST */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-slate-800 bg-slate-900/20">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Study Sessions</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-950/40 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
                      <tr>
                         <th className="px-8 py-6">Session Name</th>
                         <th className="px-6 py-6 text-center">Symbol</th>
                         <th className="px-6 py-6 text-center">Strategy</th>
                         <th className="px-6 py-6 text-center">Trades</th>
                         <th className="px-6 py-6 text-center">P&L</th>
                         <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/40">
                      {sessions.map(s => (
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
                           <td className="px-6 py-5 text-center font-black text-slate-400 text-xs">{s.symbol}</td>
                           <td className="px-6 py-5 text-center font-black text-blue-400 text-[10px] uppercase">{s.playbookName}</td>
                           <td className="px-6 py-5 text-center font-black text-slate-100 text-xs">{backtestTrades.filter(t => t.sessionId === s.id).length}</td>
                           <td className="px-6 py-5 text-center font-black text-green-500 text-xs">${backtestTrades.filter(t => t.sessionId === s.id).reduce((sum, t) => sum + t.pnlNet, 0).toLocaleString()}</td>
                           <td className="px-8 py-5 text-right">
                              <button className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Enter Lab</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                {sessions.length === 0 && (
                    <div className="py-24 text-center">
                        <i className="fas fa-vial text-4xl text-slate-800 mb-4"></i>
                        <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">No backtest sessions recorded yet</p>
                    </div>
                )}
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
           {/* SESSION DETAIL VIEW */}
           <div className="flex items-center justify-between bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800">
              <div className="flex items-center space-x-6">
                 <button onClick={() => setSelectedSessionId(null)} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"><i className="fas fa-arrow-left"></i></button>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{activeSession?.name}</h3>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{activeSession?.symbol} • {activeSession?.playbookName}</p>
                 </div>
              </div>
              <div className="flex space-x-4">
                 <button 
                    onClick={() => setIsPrepModalOpen(true)}
                    className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center"
                >
                    <i className="fas fa-clipboard-check mr-2"></i> 1. Protocol Prep
                 </button>
                 <button 
                    onClick={() => setIsTradeModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center"
                >
                    <i className="fas fa-plus mr-2"></i> 2. Record Trade
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-6">
                 <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Simulation Progress Log</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[9px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-800/50">
                                <tr>
                                    <th className="py-4">Sim Date</th>
                                    <th className="py-4">Setup</th>
                                    <th className="py-4">Result</th>
                                    <th className="py-4">R-Multiple</th>
                                    <th className="py-4 text-right">Net P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {sessionTrades.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                                        <td className="py-4 text-[10px] font-bold text-slate-500 uppercase">{t.date}</td>
                                        <td className="py-4 text-[10px] font-black text-white uppercase">{t.setup}</td>
                                        <td className="py-4">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${t.status === 'WIN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{t.status}</span>
                                        </td>
                                        <td className="py-4 text-xs font-black text-slate-300">1:{t.rrRealized}R</td>
                                        <td className={`py-4 text-xs font-black text-right ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>${t.pnlNet.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[2rem] shadow-xl text-center relative overflow-hidden">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Current Session Edge</p>
                    <p className="text-5xl font-black text-white tracking-tighter">
                        {sessionTrades.length > 0 ? (sessionTrades.filter(t => t.status === 'WIN').length / sessionTrades.length * 100).toFixed(0) : '0'}%
                    </p>
                    <p className="text-[9px] font-black text-indigo-400 uppercase mt-2">Win Rate Accuracy</p>
                    <i className="fas fa-chart-pie absolute -bottom-8 -right-8 text-8xl text-indigo-500/[0.05]"></i>
                 </div>

                 <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem]">
                    <h5 className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Protocol Checkpoints</h5>
                    <div className="space-y-3">
                        <Checkpoint label="Macro Identified" done={sessionTrades.length > 0} />
                        <Checkpoint label="Scenarios Defined" done={sessionTrades.length > 0} />
                        <Checkpoint label="Exit Validated" done={sessionTrades.length > 0} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && <NewBacktestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAddSession} playbooks={playbooks} />}
      
      {isTradeModalOpen && selectedSessionId && (
        <NewTradeModal 
            isOpen={isTradeModalOpen} 
            onClose={() => setIsTradeModalOpen(false)} 
            onSave={handleSaveTrade} 
            accounts={[]} // Not needed for BT
            playbooks={playbooks} 
            trades={backtestTrades}
            dailyPreps={dailyPreps}
            language={language}
        />
      )}

      {isPrepModalOpen && (
          <DailyPrepModal 
            playbooks={playbooks} 
            language={language} 
            onClose={() => setIsPrepModalOpen(false)} 
            onSave={(d, p) => { saveDailyPrep(d, p); setIsPrepModalOpen(false); }} 
          />
      )}
    </div>
  );
};

const Checkpoint = ({ label, done }: { label: string, done: boolean }) => (
    <div className="flex items-center justify-between text-[10px] font-black uppercase">
        <span className="text-slate-500">{label}</span>
        <i className={`fas ${done ? 'fa-check-circle text-emerald-500' : 'fa-circle text-slate-800'}`}></i>
    </div>
);

export default Backtesting;
