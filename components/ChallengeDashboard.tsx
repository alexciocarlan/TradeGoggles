
import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Trade, Account } from '../types';
import { Language } from '../translations';

/* Added language to ChallengeDashboardProps to fix TypeScript error in App.tsx */
interface ChallengeDashboardProps {
  trades: Trade[];
  accounts: Account[];
  language: Language;
}

const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({ trades, accounts, language }) => {
  const [activeChallengeId, setActiveChallengeId] = useState<string>(accounts[0]?.id || '');

  const activeAccount = useMemo(() => 
    accounts.find(a => a.id === activeChallengeId) || accounts[0]
  , [accounts, activeChallengeId]);

  const challengeTrades = useMemo(() => 
    trades.filter(t => t.accountId === activeChallengeId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  , [trades, activeChallengeId]);

  // Calcul evoluție cont conform PDF APEX 2.0
  const chartData = useMemo(() => {
    if (!activeAccount) return [];
    
    let currentEquity = activeAccount.initialBalance;
    let peakEquity = activeAccount.initialBalance;
    const maxDD = activeAccount.maxDrawdown;
    const paStopLevel = activeAccount.initialBalance + 100; // Regula Apex PA: Drawdown-ul se blochează la Sold Inițial + $100

    const data = [{
      name: 'Start',
      equity: currentEquity,
      peak: peakEquity,
      drawdown: currentEquity - maxDD,
      risk: maxDD,
      date: activeAccount.createdAt
    }];

    const tradesByDate: Record<string, number> = {};
    challengeTrades.forEach(t => {
      tradesByDate[t.date] = (tradesByDate[t.date] || 0) + t.pnlNet;
    });

    const sortedDates = Object.keys(tradesByDate).sort();

    sortedDates.forEach((date, index) => {
      // In real Apex, this is intraday/live. Here we simulate end-of-day for the chart
      currentEquity += tradesByDate[date];
      
      // Update Peak Equity
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }

      // Calculate Trailing Drawdown
      let trailingDD = peakEquity - maxDD;
      
      // Regula PA: Dacă DD ajunge la pragul de siguranță, se blochează
      if (activeAccount.isPA && trailingDD >= paStopLevel) {
        trailingDD = paStopLevel;
      }

      data.push({
        name: `Ziua ${index + 1}`,
        equity: parseFloat(currentEquity.toFixed(2)),
        peak: parseFloat(peakEquity.toFixed(2)),
        drawdown: parseFloat(trailingDD.toFixed(2)),
        risk: parseFloat((currentEquity - trailingDD).toFixed(2)),
        date: date
      });
    });

    return data;
  }, [challengeTrades, activeAccount]);

  // Statistici performanță și reguli de consistență
  const stats = useMemo(() => {
    if (chartData.length === 0 || !activeAccount) return null;
    const lastPoint = chartData[chartData.length - 1];
    const initialBalance = activeAccount.initialBalance;
    const targetProfit = activeAccount.targetProfit || (initialBalance + 3000);
    const totalProfit = Math.max(lastPoint.equity - initialBalance, 0);

    // Regula de consistență 30%
    const dailyProfits = challengeTrades.map(t => t.pnlNet > 0 ? t.pnlNet : 0);
    const bestDay = dailyProfits.length > 0 ? Math.max(...dailyProfits) : 0;
    const consistencyLimit = totalProfit * 0.30;
    const isConsistencyViolated = totalProfit > 0 && bestDay > consistencyLimit;
    
    // Progres profit
    const progress = Math.min(Math.max((totalProfit / (targetProfit - initialBalance)) * 100, 0), 100);

    // Zile de tranzacționare
    const uniqueDays = new Set(challengeTrades.map(t => t.date)).size;
    
    // Status Payout
    const bufferZone = initialBalance + activeAccount.maxDrawdown + 100;
    const canRequestPayout = lastPoint.equity >= bufferZone && uniqueDays >= 10 && !isConsistencyViolated;

    return {
      currentEquity: lastPoint.equity,
      availableRisk: lastPoint.risk,
      threshold: lastPoint.drawdown,
      progress,
      peak: lastPoint.peak,
      totalProfit,
      bestDay,
      consistencyLimit,
      isConsistencyViolated,
      uniqueDays,
      canRequestPayout
    };
  }, [chartData, activeAccount, challengeTrades]);

  const handleExportPDF = () => {
    window.print();
  };

  if (!activeAccount) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Selector Conturi */}
      <div className="flex justify-between items-center no-print">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setActiveChallengeId(acc.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap border ${
                activeChallengeId === acc.id 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-[#111827] border-slate-800 text-slate-500 hover:text-white'
              }`}
            >
              {acc.name}
            </button>
          ))}
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all border border-slate-700"
        >
          <i className="fas fa-file-export mr-2"></i> PDF Report
        </button>
      </div>

      {stats && (
        <>
          {/* Header Dashboard Banner */}
          <div className={`p-8 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500 bg-[#1e3a8a]`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 text-white">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white/70 text-[10px] font-black uppercase tracking-widest">APEX TRACKER PRO V3.1</h3>
                  <h2 className="text-4xl font-black">{activeAccount.name}</h2>
                </div>
                <div className="flex space-x-4">
                  <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/60 font-black uppercase mb-1">ACCOUNT EQUITY</p>
                    <p className="text-2xl font-black">${stats.currentEquity.toLocaleString()}</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/60 font-black uppercase mb-1">AVAILABLE RISK</p>
                    <p className={`text-2xl font-black ${stats.availableRisk < 1000 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                      ${stats.availableRisk.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:w-80 space-y-4">
                 <div className="h-5 bg-black/30 rounded-full overflow-hidden border border-white/10 p-1">
                   <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase">PROFIT PROGRESS</p>
                    <p className="text-[10px] font-black uppercase">{stats.progress.toFixed(1)}%</p>
                 </div>
              </div>
            </div>
            {/* Background Decorations */}
            <i className="fas fa-chart-line absolute -bottom-10 -right-10 text-[200px] text-white/5 rotate-12"></i>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricBox label="PEAK EQUITY" value={`$${stats.peak.toLocaleString()}`} icon="fa-arrow-trend-up" color="text-green-400" />
            <MetricBox label="LIQUIDATION POINT" value={`$${stats.threshold.toLocaleString()}`} icon="fa-skull-crossbones" color="text-red-400" />
            <MetricBox label="CURRENT P&L" value={`$${(stats.totalProfit).toLocaleString()}`} icon="fa-coins" color="text-blue-400" />
            <MetricBox 
              label="STATUS DRAWDOWN" 
              value={activeAccount.isPA && stats.threshold === (activeAccount.initialBalance + 100) ? "LOCKED" : "TRAILING"} 
              icon="fa-lock" 
              color="text-orange-400" 
            />
          </div>

          {/* Main Chart Section */}
          <div className="bg-[#0f172a] border border-slate-800/50 p-8 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">ANALIZĂ EVOLUȚIE DRAWDOWN</h4>
              <div className="flex space-x-6">
                <LegendItem color="bg-blue-500" label="ACCOUNT EQUITY" />
                <LegendItem color="bg-slate-500" label="AVAILABLE RISK" />
                <LegendItem color="bg-red-500" label="TRAILING DRAWDOWN" dashed />
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    type="number"
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[47500, 55000]}
                    allowDataOverflow={true}
                    ticks={[47500, 50000, 52500, 55000]}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelStyle={{ fontWeight: '900', color: '#64748b', marginBottom: '8px' }}
                    formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, '']}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="risk" 
                    name="Available Risk" 
                    fill="url(#colorRisk)" 
                    stroke="none" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="equity" 
                    name="Account Equity" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="drawdown" 
                    name="Liquidation Point" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <ReferenceLine 
                    y={activeAccount.initialBalance + 100} 
                    stroke="#fbbf24" 
                    strokeDasharray="3 3" 
                    label={{ value: 'PA LOCK', position: 'right', fill: '#fbbf24', fontSize: 10, fontWeight: 'bold' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consistency & Payout Rules Compliance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consistency Card */}
            <div className="bg-[#0f172a] border border-slate-800/50 p-6 rounded-3xl shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center">
                <i className="fas fa-balance-scale mr-2 text-orange-400"></i> REGULA DE CONSISTENȚĂ (30%)
              </h4>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Cea mai bună zi (Profit)</p>
                    <p className={`text-2xl font-black ${stats.isConsistencyViolated ? 'text-orange-400' : 'text-green-400'}`}>
                      ${stats.bestDay.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Limita 30% din Profit Total</p>
                    <p className="text-2xl font-black text-white">${stats.consistencyLimit.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${stats.isConsistencyViolated ? 'bg-orange-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((stats.bestDay / (stats.consistencyLimit || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className={`p-4 rounded-2xl text-[10px] font-bold leading-relaxed border ${stats.isConsistencyViolated ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                  {stats.isConsistencyViolated 
                    ? `⚠️ AI DEPĂȘIT LIMITA DE 30%. Trebuie să mai tranzacționezi zile profitabile pentru a dilua acest procent.` 
                    : `✅ CONSISTENȚA ESTE ÎN PARAMETRI. Nicio zi nu depășește 30% din profitul total.`}
                </div>
              </div>
            </div>

            {/* Payout Eligibility Card */}
            <div className="bg-[#0f172a] border border-slate-800/50 p-6 rounded-3xl shadow-sm no-print">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center">
                <i className="fas fa-money-check-dollar mr-2 text-blue-400"></i> ELIGIBILITATE PAYOUT
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <StatusItem label="Zile Tranzacționate" value={`${stats.uniqueDays}/10`} isMet={stats.uniqueDays >= 10} />
                <StatusItem label="Peste Buffer Zone" value={stats.currentEquity >= (activeAccount.initialBalance + activeAccount.maxDrawdown + 100) ? "DA" : "NU"} isMet={stats.currentEquity >= (activeAccount.initialBalance + activeAccount.maxDrawdown + 100)} />
                <StatusItem label="Fereastră Payout" value={isPayoutWindow() ? "DESCHISĂ" : "ÎNCHISĂ"} isMet={isPayoutWindow()} />
                <StatusItem label="Consistență 30%" value={!stats.isConsistencyViolated ? "VALID" : "INVALID"} isMet={!stats.isConsistencyViolated} />
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                <button 
                  disabled={!stats.canRequestPayout}
                  className={`w-full py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${
                    stats.canRequestPayout 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  SOLICITĂ PAYOUT {stats.canRequestPayout && '(MAX $2,000)'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MetricBox = ({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) => (
  <div className="bg-[#0f172a] border border-slate-800/50 p-6 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all">
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <i className={`fas ${icon} ${color} opacity-40`}></i>
    </div>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

const LegendItem = ({ color, label, dashed = false }: { color: string, label: string, dashed?: boolean }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-3 h-3 ${color} rounded-sm ${dashed ? 'border-t-2 border-dashed border-red-500 bg-transparent' : ''}`}></div>
    <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{label}</span>
  </div>
);

const StatusItem = ({ label, value, isMet }: { label: string, value: string, isMet: boolean }) => (
  <div className="bg-[#111827] p-3 rounded-2xl border border-slate-800/50">
    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">{label}</p>
    <div className="flex justify-between items-center">
      <span className="text-sm font-black text-white">{value}</span>
      <i className={`fas ${isMet ? 'fa-check-circle text-green-500' : 'fa-times-circle text-slate-600'} text-xs`}></i>
    </div>
  </div>
);

const isPayoutWindow = () => {
  const day = new Date().getDate();
  return (day >= 1 && day <= 5) || (day >= 15 && day <= 20);
};

export default ChallengeDashboard;
