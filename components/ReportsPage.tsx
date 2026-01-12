
import React, { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Trade } from '../types';
import ScannerLogicReport from './ScannerLogicReport';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

const ReportsPage: React.FC = () => {
  const { trades, selectedAccountId } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    selectedAccountId: state.selectedAccountId
  })));
  
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'scanner-logic' | 'behavioral-logic'>('overview');

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-slate-800 pb-px mb-8 no-print">
        <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap custom-scrollbar">
            <button onClick={() => setActiveTab('overview')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Overview {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full shadow-[0_0_10px_blue]"></div>}
            </button>
            <button onClick={() => setActiveTab('reports')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'reports' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Analytics {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full shadow-[0_0_10px_blue]"></div>}
            </button>
            <button onClick={() => setActiveTab('scanner-logic')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'scanner-logic' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Scanner Logic Audit {activeTab === 'scanner-logic' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full shadow-[0_0_10px_blue]"></div>}
            </button>
            <button onClick={() => setActiveTab('behavioral-logic')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'behavioral-logic' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
            Behavioral Logic Audit {activeTab === 'behavioral-logic' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full shadow-[0_0_10px_blue]"></div>}
            </button>
        </div>
        
        {(activeTab === 'scanner-logic' || activeTab === 'behavioral-logic') && (
            <button 
                onClick={handlePrint}
                className="mb-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-2"
            >
                <i className="fas fa-print"></i>
                <span>Export Audit PDF</span>
            </button>
        )}
      </div>

      {activeTab === 'overview' && <OverviewSection trades={activeTrades} />}
      {activeTab === 'reports' && <AnalyticsSection trades={activeTrades} />}
      {activeTab === 'scanner-logic' && <ScannerLogicReport />}
      {activeTab === 'behavioral-logic' && <BehavioralLogicReport />}
    </div>
  );
};

const OverviewSection = ({ trades }: { trades: Trade[] }) => {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const totalPnl = trades.reduce((s, t) => s + t.pnlNet, 0);
    const totalCommissions = trades.reduce((s, t) => s + (t.commissions || 0), 0);
    const winningTrades = trades.filter(t => t.pnlNet > 0);
    const losingTrades = trades.filter(t => t.pnlNet < 0);
    const breakEvenTrades = trades.filter(t => t.pnlNet === 0);
    const numWinning = winningTrades.length;
    const numLosing = losingTrades.length;
    const numBE = breakEvenTrades.length;
    const totalWinPnl = winningTrades.reduce((s, t) => s + t.pnlNet, 0);
    const totalLossPnl = losingTrades.reduce((s, t) => s + t.pnlNet, 0);
    const avgWinningTrade = numWinning > 0 ? totalWinPnl / numWinning : 0;
    const avgLosingTrade = numLosing > 0 ? totalLossPnl / numLosing : 0;
    const largestProfit = numWinning > 0 ? Math.max(...winningTrades.map(t => t.pnlNet)) : 0;
    const largestLoss = numLosing > 0 ? Math.min(...losingTrades.map(t => t.pnlNet)) : 0;
    const uniqueDays = new Set(trades.map(t => t.date));
    const totalTradingDays = uniqueDays.size;
    const avgDailyPnl = totalTradingDays > 0 ? totalPnl / totalTradingDays : 0;
    const totalContracts = trades.reduce((s, t) => s + (t.contracts || 0), 0);
    const avgDailyVolume = totalTradingDays > 0 ? totalContracts / totalTradingDays : 0;
    const profitFactor = Math.abs(totalLossPnl) > 0 ? totalWinPnl / Math.abs(totalLossPnl) : (totalWinPnl > 0 ? 99 : 0);
    const tradeExpectancy = totalTrades > 0 ? totalPnl / totalTrades : 0;
    const avgRealizedR = totalTrades > 0 ? trades.reduce((s, t) => s + (t.rrRealized || 0), 0) / totalTrades : 0;
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));
    let maxConsecWins = 0;
    let maxConsecLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    sortedTrades.forEach(t => {
        if (t.pnlNet > 0) {
            currentWins++;
            currentLosses = 0;
            if (currentWins > maxConsecWins) maxConsecWins = currentWins;
        } else if (t.pnlNet < 0) {
            currentLosses++;
            currentWins = 0;
            if (currentLosses > maxConsecLosses) maxConsecLosses = currentLosses;
        } else {
            currentWins = 0;
            currentLosses = 0;
        }
    });
    return {
        totalPnl, avgDailyVolume, avgLosingTrade, numWinning, numBE, maxConsecWins, totalCommissions, largestProfit, tradeExpectancy,
        totalTradingDays, avgWinningTrade, totalTrades, numLosing, avgDailyPnl, maxConsecLosses, avgRealizedR, largestLoss, profitFactor
    };
  }, [trades]);

  const StatRow = ({ label, value, isCurrency = false, colorClass = "text-white" }: { label: string, value: number | string, isCurrency?: boolean, colorClass?: string }) => (
    <div className="flex justify-between py-4 border-b border-slate-800/50 hover:bg-slate-800/20 px-2 transition-colors">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-[11px] font-black uppercase tracking-widest ${colorClass}`}>
            {isCurrency 
                ? `$${typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : value}`
                : (typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value)
            }
        </span>
    </div>
  );

  return (
    <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden p-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-0">
            <div className="flex flex-col">
                <StatRow label="Total P&L" value={stats.totalPnl} isCurrency colorClass={stats.totalPnl >= 0 ? 'text-white' : 'text-red-500'} />
                <StatRow label="Average Daily Volume" value={stats.avgDailyVolume.toFixed(2)} />
                <StatRow label="Average Losing Trade" value={stats.avgLosingTrade} isCurrency colorClass="text-red-400" />
                <StatRow label="Number of Winning Trades" value={stats.numWinning} colorClass="text-emerald-400" />
                <StatRow label="Number of Break Even Trades" value={stats.numBE} />
                <StatRow label="Max Consecutive Wins" value={stats.maxConsecWins} colorClass="text-emerald-400" />
                <StatRow label="Total Commissions" value={stats.totalCommissions} isCurrency />
                <StatRow label="Largest Profit" value={stats.largestProfit} isCurrency colorClass="text-emerald-400" />
                <StatRow label="Trade Expectancy" value={stats.tradeExpectancy} isCurrency colorClass={stats.tradeExpectancy > 0 ? 'text-white' : 'text-red-400'} />
            </div>
            <div className="flex flex-col">
                <StatRow label="Total Trading Days" value={stats.totalTradingDays} />
                <StatRow label="Average Winning Trade" value={stats.avgWinningTrade} isCurrency colorClass="text-emerald-400" />
                <StatRow label="Total Number of Trades" value={stats.totalTrades} />
                <StatRow label="Number of Losing Trades" value={stats.numLosing} colorClass="text-red-400" />
                <StatRow label="Average Daily P&L" value={stats.avgDailyPnl} isCurrency />
                <StatRow label="Max Consecutive Losses" value={stats.maxConsecLosses} colorClass="text-red-400" />
                <StatRow label="Average Realized R-Multiple" value={`${stats.avgRealizedR.toFixed(2)}R`} />
                <StatRow label="Largest Loss" value={stats.largestLoss} isCurrency colorClass="text-red-400" />
                <StatRow label="Profit Factor" value={stats.profitFactor.toFixed(2)} colorClass="text-blue-400" />
            </div>
        </div>
    </div>
  );
};

const AnalyticsSection = ({ trades }: { trades: Trade[] }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysBuckets = useMemo(() => {
    const buckets = daysOfWeek.map((name) => ({ name, pnl: 0 }));
    trades.forEach(t => {
      const dayIndex = new Date(t.date).getDay();
      buckets[dayIndex].pnl += t.pnlNet;
    });
    return buckets;
  }, [trades]);

  return (
    <div className="bg-[#0b1222]/40 border border-slate-800 p-10 rounded-[3rem] shadow-xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-12">Performance by Day of Week</h4>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daysBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{fill: '#1e293b', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} 
                formatter={(val: number) => [`$${val.toLocaleString()}`, 'Net P&L']}
              />
              <Bar dataKey="pnl" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={40}>
                {daysBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
};

const BehavioralLogicReport = () => (
  <div className="space-y-12 animate-in fade-in duration-1000 max-w-6xl mx-auto">
    {/* HEADER SECTION */}
    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 border border-indigo-500/20 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
      <div className="relative z-10">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
            <i className="fas fa-brain text-2xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">BEHAVIORAL EQUITY ENGINE</h1>
            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">ALCHIMIE COMPORTAMENTALĂ // AUDIT PROTOCOL</p>
          </div>
        </div>
        <div className="bg-black/40 border border-slate-800 p-8 rounded-[2rem] space-y-6">
           <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
             "Nu tranzacționăm piețe, ne tranzacționăm propriile convingeri calibrate prin biometrie și disciplină."
           </p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">REPUTATION FORMULA</p>
                 <p className="text-xl font-black text-white italic tracking-tighter">BE = (Net_PnL * 0.1) + (Avg_Discipline * 150)</p>
              </div>
              <div className="space-y-2 border-l border-slate-800 pl-6">
                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">CORE PHILOSOPHY</p>
                 <p className="text-[11px] text-slate-400 uppercase font-black">Profitul fără disciplină este considerat noroc toxic și penalizat sistemic.</p>
              </div>
           </div>
        </div>
      </div>
      <i className="fas fa-fingerprint absolute -bottom-10 -right-10 text-[260px] text-white/[0.01] pointer-events-none rotate-12"></i>
    </div>

    {/* CORRELATION MATRIX GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <LogicCard 
        icon="fa-heart-pulse" 
        title='01 // CORELAȚIA "BIO-RISC"' 
        logic="Corelează HRV Deviation (>15%) cu probabilitatea de eroare impulsivă (Amygdala Hijack)." 
        impact="Scorul BE scade drastic dacă tranzacționezi pe 'Gatekeeper Red', indiferent de P&L."
        color="text-rose-500"
        bg="bg-rose-500/5"
        border="border-rose-500/20"
      />
      <LogicCard 
        icon="fa-file-signature" 
        title='02 // CORELAȚIA "ALPHA-PREP"' 
        logic="Monitorizează prezența Uncertainty Contract în raport cu execuția setup-urilor." 
        impact="Validarea mentală crește reputația cu 22% mai mult decât un trade profitabil executat robotic."
        color="text-indigo-400"
        bg="bg-indigo-400/5"
        border="border-indigo-400/20"
      />
      <LogicCard 
        icon="fa-battery-quarter" 
        title='03 // CORELAȚIA "FATIGUE FADE"' 
        logic="Urmărește degradarea checklist-ului de intrare după trade-ul #4 într-o singură sesiune." 
        impact="Sistemul induce 'Friction Mode' dacă vede scăderea disciplinei pe măsură ce volumul crește."
        color="text-orange-400"
        bg="bg-orange-400/5"
        border="border-orange-400/20"
      />
      <LogicCard 
        icon="fa-shield-halved" 
        title='04 // RISK INTEGRITY (SENTINEL VETO)' 
        logic="Corelație cu TOLERANȚĂ ZERO între Stop-Loss Sabotage și supraviețuirea contului." 
        impact="Guillotine Veto: Scorul scade la 0 instantaneu dacă SL-ul este mutat în pierdere."
        color="text-red-600"
        bg="bg-red-600/5"
        border="border-red-600/20"
      />
    </div>

    {/* PERFORMANCE AXIS SECTION */}
    <div className="bg-[#0b1222] border border-slate-800/60 rounded-[3rem] p-10 shadow-xl">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-12 flex items-center">
            <i className="fas fa-compass mr-3 text-blue-500"></i> AXA DE PERFORMANȚĂ (RADAR METRICS)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <AxisItem title="PREP" desc="Calitatea biometriei și rigoarea planului scris." />
            <AxisItem title="EXECUTION" desc="Fidelitatea față de setup-ul ales în scanner." />
            <AxisItem title="REVIEW" desc="Sinceritatea și lungimea notelor post-mortem." />
            <AxisItem title="RISK INTEGRITY" desc="Respectarea limitelor de pierdere sfinte." />
            <AxisItem title="CONSISTENCY" desc="Stabilitatea curbei de equity vs risc." />
        </div>
    </div>

    {/* TIER SYSTEM EXPLANATION */}
    <div className="bg-[#0b1222] border border-slate-800/60 rounded-[3rem] p-10 shadow-xl">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-12 flex items-center">
            <i className="fas fa-medal mr-3 text-orange-500"></i> IDENTITY TIER PROGRESSION
        </h3>
        <div className="space-y-6">
            <TierRow name="RECRUIT" xp="0 BE" desc="Status inițial. Sistemul monitorizează fiecare micro-decizie. Vulnerabilitate maximă." />
            <TierRow name="BUILDER" xp="5.000 BE" desc="Ai dovedit consistență biometrică și respectarea stop-loss-ului pe o durată medie." />
            <TierRow name="OPERATOR" xp="10.000 BE" desc="Execuție chirurgicală. AI Coach detectează un 'Performance Gap' minim (sub 5%)." />
            <TierRow name="SENTINEL" xp="25.000 BE" desc="Elita. Disciplina ta este acum un automatism biologic. Authority: Max." highlight />
        </div>
    </div>
  </div>
);

const LogicCard = ({ icon, title, logic, impact, color, bg, border }: any) => (
    <div className={`${bg} border ${border} p-10 rounded-[2.5rem] flex flex-col group hover:scale-[1.02] transition-all duration-500`}>
        <div className={`w-12 h-12 rounded-2xl ${color.replace('text-', 'bg-')}/10 border border-current flex items-center justify-center ${color} mb-8 shadow-xl`}>
            <i className={`fas ${icon} text-xl`}></i>
        </div>
        <h4 className={`text-sm font-black uppercase tracking-widest mb-4 ${color}`}>{title}</h4>
        <div className="space-y-4">
            <div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">LOGICĂ ALGORITMICĂ:</p>
                <p className="text-xs text-slate-300 font-medium italic">"{logic}"</p>
            </div>
            <div className="pt-4 border-t border-slate-800/40">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">IMPACT SISTEM:</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{impact}</p>
            </div>
        </div>
    </div>
);

const AxisItem = ({ title, desc }: any) => (
    <div className="text-center space-y-3 p-6 bg-slate-950/40 rounded-3xl border border-slate-800">
        <p className="text-xs font-black text-white uppercase tracking-tighter">{title}</p>
        <p className="text-[9px] text-slate-500 uppercase font-black leading-relaxed">{desc}</p>
    </div>
);

const TierRow = ({ name, xp, desc, highlight = false }: any) => (
    <div className={`flex items-center justify-between p-6 rounded-2xl border ${highlight ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-900/40 border-slate-800/60'}`}>
        <div className="flex items-center space-x-6 flex-1">
            <span className={`text-sm font-black uppercase tracking-widest w-24 ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{name}</span>
            <p className="text-[10px] text-slate-500 font-medium italic flex-1">"{desc}"</p>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-indigo-300' : 'text-slate-600'}`}>{xp}</span>
    </div>
);

export default ReportsPage;
