
import React, { useMemo, useState, useEffect, useTransition } from 'react';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { calculateTiltRisk } from '../ProtocolEngine';

const LiveEngagement: React.FC = () => {
  const [isPending, startTransition] = useTransition();

  const { dailyPreps, trades, accounts, selectedAccountId, setIsNewTradeModalOpen } = useAppStore(useShallow(state => ({
    dailyPreps: state.dailyPreps,
    trades: state.trades,
    accounts: state.accounts,
    selectedAccountId: state.selectedAccountId,
    setIsNewTradeModalOpen: state.setIsNewTradeModalOpen
  })));

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toISOString().split('T')[0];
  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);
  
  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const todayTrades = activeTrades.filter(t => t.date === todayStr);
  const todayPrep = dailyPreps[todayStr];
  const tiltRisk = useMemo(() => calculateTiltRisk(todayTrades, activeAccount, todayPrep), [todayTrades, activeAccount, todayPrep]);

  const sessionInfo = useMemo(() => {
    const hours = now.getHours();
    if (hours >= 8 && hours < 16) return { name: 'LONDON RTH', color: 'text-blue-400', icon: 'fa-landmark' };
    if (hours >= 16 && hours < 23) return { name: 'NEW YORK RTH', color: 'text-orange-400', icon: 'fa-tower-observation' };
    return { name: 'ASIA / AFTER HOURS', color: 'text-indigo-400', icon: 'fa-moon' };
  }, [now]);

  const totalSessionalPnl = useMemo(() => todayTrades.reduce((s, t) => s + (t.pnlNet || 0), 0), [todayTrades]);

  // --- FATIGUE PROTOCOL LOGIC ---
  const handleExecuteStrike = () => {
    // Check if user is attempting Trade #4 or more
    if (todayTrades.length >= 3) {
        if (!window.confirm(`⚠️ OVERTRADING PROTOCOL TRIGGERED ⚠️\n\nStatisticile arată că disciplina scade drastic după 3 tranzacții în aceeași sesiune (Fatigue Fade).\n\nEști absolut sigur că vrei să continui? [CONFIRM SHAME]`)) {
            return; // Abort
        }
    }
    
    startTransition(() => {
      setIsNewTradeModalOpen(true);
    });
  };

  return (
    <div className={`space-y-8 animate-in fade-in duration-1000 max-w-[1400px] mx-auto pb-20 ${isPending ? 'opacity-80' : 'opacity-100'}`}>
      
      {/* HUD HEADER */}
      <div className="bg-[#050811] border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
         <div className="z-10 flex items-center space-x-8">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
               <i className={`fas ${sessionInfo.icon} text-3xl animate-pulse`}></i>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">OPERATIONAL HUD // TACTICAL STATUS</p>
               <h2 className={`text-5xl font-black italic tracking-tighter uppercase leading-none ${sessionInfo.color}`}>{sessionInfo.name}</h2>
            </div>
         </div>

         <div className="z-10 flex items-center space-x-12 bg-slate-900/40 px-10 py-6 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md">
            <div className="text-center">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">LOCAL TIME</p>
               <p className="text-3xl font-black text-white italic tracking-tighter">{now.toLocaleTimeString('ro-RO', { hour12: false })}</p>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div className="text-center">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SYSTEM STATUS</p>
               <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_emerald]"></div>
                  <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">Online</p>
               </div>
            </div>
         </div>
         <i className="fas fa-tower-broadcast absolute -bottom-10 -right-10 text-[260px] text-white/[0.02] pointer-events-none rotate-12"></i>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CENTER MONITOR: TILT & BIOMETRICS */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-[#0b1222]/80 border border-slate-800 p-10 py-16 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center min-h-[720px]">
                
                {/* Header Label */}
                <div className="flex items-center space-x-3 mb-10">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_blue]"></div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Pulse Monitor</p>
                </div>

                {/* Central Gauge Section */}
                <div className="relative mb-12 flex flex-col items-center shrink-0">
                   <div className="relative">
                      <svg className="w-72 h-72 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800/40" strokeWidth="2.5" />
                        <circle 
                          cx="18" cy="18" r="16" fill="none" 
                          className={`transition-all duration-1000 ease-out ${tiltRisk.color.replace('text-', 'stroke-')}`} 
                          strokeWidth="2.5" 
                          strokeDasharray={`${tiltRisk.score}, 100`} 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className={`text-7xl font-black italic tracking-tighter leading-none mb-1 ${tiltRisk.color}`}>{tiltRisk.score}%</p>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">TILT HEAT</p>
                      </div>
                   </div>
                </div>

                {/* Main Action & Status Container */}
                <div className="flex-1 w-full flex flex-col items-center justify-center space-y-12 py-4">
                   <div className="space-y-4">
                      <h3 className={`text-5xl font-black uppercase tracking-tighter italic ${tiltRisk.color}`}>{tiltRisk.label} MODE</h3>
                      <p className="text-slate-400 text-base font-medium leading-relaxed max-w-md mx-auto italic px-4">
                         "{tiltRisk.desc} Starea ta de execuție este monitorizată în raport cu limitele de risc sfinte."
                      </p>
                   </div>
                   
                   <div className="w-full flex flex-col items-center">
                      <button 
                         onClick={handleExecuteStrike}
                         className="w-full max-w-2xl bg-blue-600 hover:bg-blue-500 text-white font-black py-14 px-12 rounded-[4rem] uppercase tracking-widest text-3xl shadow-[0_30px_70px_rgba(37,99,235,0.4)] transition-all active:scale-95 border-t border-white/20 animate-pulse flex items-center justify-center space-x-8"
                      >
                         <i className="fas fa-crosshairs text-5xl"></i> 
                         <span>EXECUTE STRIKE</span>
                      </button>
                      {todayTrades.length >= 3 && (
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-4">WARNING: FATIGUE FADE ZONE (TRADE #{todayTrades.length + 1})</p>
                      )}
                   </div>
                </div>

                {/* Performance Context Matrix at bottom */}
                <div className="w-full mt-auto grid grid-cols-3 gap-8 pt-10 border-t border-slate-800/60 max-w-2xl mx-auto shrink-0">
                   <div className="text-center group">
                      <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Gatekeeper</p>
                      <p className={`text-3xl font-black italic tracking-tighter ${todayPrep?.gkVerdict === 'Green' ? 'text-emerald-500' : 'text-orange-500'}`}>
                         {todayPrep?.gkTotalScore || '--'}<span className="text-sm text-slate-800 ml-1 not-italic">/100</span>
                      </p>
                   </div>
                   
                   <div className="text-center group">
                      <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Session P&L</p>
                      <p className={`text-3xl font-black italic tracking-tighter ${totalSessionalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         ${Math.abs(totalSessionalPnl).toLocaleString()}
                      </p>
                   </div>

                   <div className="text-center group">
                      <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Compliance</p>
                      <p className="text-3xl font-black text-white italic tracking-tighter uppercase">VALID</p>
                   </div>
                </div>

                <i className="fas fa-shield-halved absolute -bottom-10 -right-10 text-[320px] text-white/[0.01] pointer-events-none rotate-12"></i>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <EngagementCard label="EXECUTION VELOCITY" value={`${todayTrades.length}`} sub="Trades Today" icon="fa-gauge-high" color="text-blue-400" />
               <EngagementCard label="DRAWDOWN BUFFER" value={`$${(activeAccount?.maxDrawdown || 0).toLocaleString()}`} sub="Max Safety" icon="fa-shield" color="text-red-400" />
            </div>
        </div>

        {/* SIDEBAR: ACTIVE FOCUS & PROTOCOL */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0b1222] border border-blue-500/20 p-8 rounded-[3.5rem] shadow-xl flex flex-col h-full">
                <div className="flex items-center space-x-4 mb-10 border-b border-slate-800 pb-6">
                   <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      <i className="fas fa-bullseye text-sm"></i>
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">Active Strategic Focus</h4>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Session Target</p>
                   </div>
                </div>

                <div className="space-y-8 flex-1">
                   <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-800 shadow-inner">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Primary Setup for Today</p>
                      <h5 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight mb-6">
                         {todayPrep?.setup || 'NO SETUP SELECTED'}
                      </h5>
                      <div className="flex items-center space-x-3">
                         <span className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">PROTOCOL SYNCED</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-4">Session Narrative</p>
                      <p className="text-[12px] text-slate-400 leading-relaxed font-medium italic bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800/60 shadow-inner">
                         "{todayPrep?.dailyNarrative || 'Nu există un plan narativ salvat pentru această sesiune. Rămâi vigilent la reacțiile de la nivelele cheie.'}"
                      </p>
                   </div>

                   <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[2.5rem] space-y-6">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Discipline Guard</p>
                         <i className="fas fa-microchip text-xs text-indigo-500/40"></i>
                      </div>
                      <div className="space-y-3">
                         <ProtocolCheck label="Wait for Setup Confirmation" checked={true} />
                         <ProtocolCheck label="Hard Stop Order Active" checked={true} />
                         <ProtocolCheck label="Emotional Sync Maintained" checked={true} />
                      </div>
                   </div>
                </div>

                <button className="mt-10 w-full py-6 bg-slate-900 hover:bg-slate-800 text-slate-600 hover:text-white font-black rounded-[2rem] uppercase tracking-widest text-[11px] border border-slate-800 transition-all active:scale-95">
                   MANUAL TERMINAL LOCK
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

const EngagementCard = ({ label, value, sub, icon, color }: any) => (
    <div className="bg-[#0b1222] border border-slate-800 p-10 rounded-[3rem] flex items-center space-x-8 group hover:border-slate-700 transition-all shadow-xl">
        <div className={`w-16 h-16 rounded-[1.8rem] bg-slate-900 border border-slate-800 flex items-center justify-center ${color} text-2xl shadow-2xl transition-transform group-hover:scale-110`}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-black text-white tracking-tighter leading-none">{value}</p>
            <p className="text-[9px] font-black text-slate-700 uppercase mt-2 tracking-widest">{sub}</p>
        </div>
    </div>
);

const ProtocolCheck = ({ label, checked }: { label: string, checked: boolean }) => (
    <div className="flex items-center space-x-4 opacity-70 hover:opacity-100 transition-opacity">
       <i className="fas fa-circle-check text-indigo-500 text-[12px]"></i>
       <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{label}</span>
    </div>
);

export default LiveEngagement;
