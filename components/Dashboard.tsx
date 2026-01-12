
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar } from 'recharts';
import { useAppStore } from '../AppContext';
import { translations } from '../translations';
import { useShallow } from 'zustand/react/shallow';

type TimeRange = '1D' | '1W' | '1M' | 'ALL';

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  trend?: 'up' | 'down';
  icon?: string;
  color?: string;
}

const StatCard = ({ title, value, subValue, trend, icon, color = "blue" }: StatCardProps) => (
  <div className="bg-[#0b1222] border border-slate-800/60 p-6 rounded-[2rem] shadow-sm hover:translate-y-[-2px] transition-all group overflow-hidden relative">
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">{title}</p>
        {icon && <i className={`fas ${icon} text-slate-700 group-hover:text-${color}-500 transition-colors text-xs`}></i>}
      </div>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        <div className="flex flex-col">
            <span className={`text-[8px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-600'}`}>
                {subValue}
            </span>
        </div>
      </div>
    </div>
  </div>
);

const InfoCard = ({ title, value, subValue, icon, colorClass }: any) => (
    <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2rem] flex items-center justify-between group relative overflow-hidden">
        <div className="relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{title}</p>
            <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase">{value}</h4>
            <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${colorClass}`}>{subValue}</p>
        </div>
        <i className={`fas ${icon} text-5xl text-white/[0.02] absolute right-8 group-hover:scale-110 transition-transform duration-700`}></i>
    </div>
);

const SetupAnalysisCard = ({ title, icon, color, data, emptyMsg }: any) => (
    <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] relative overflow-hidden h-full">
        <div className="flex items-center space-x-3 mb-8">
            <i className={`fas ${icon} text-[10px] ${color}`}></i>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${color}`}>{title}</h4>
        </div>
        {data && data.length > 0 ? (
            <div className="space-y-4">
                {data.map((s: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 group hover:border-slate-700 transition-all">
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{s.name}</span>
                        <span className={`text-xs font-black ${s.pnl < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {s.pnl < 0 ? '-' : '+'}${Math.abs(s.pnl).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="h-32 flex items-center justify-center opacity-20 italic">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{emptyMsg}</p>
            </div>
        )}
    </div>
);

const Dashboard: React.FC = () => {
  const { 
    trades = [],
    language, 
    accounts, 
    selectedAccountId, 
    loadDailyPreps, 
    loadWeeklyPreps 
  } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    language: state.language,
    accounts: state.accounts || [],
    selectedAccountId: state.selectedAccountId,
    loadDailyPreps: state.loadDailyPreps,
    loadWeeklyPreps: state.loadWeeklyPreps
  })));

  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const t = translations[language].dashboard;

  useEffect(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    loadDailyPreps(currentMonth);
    loadWeeklyPreps();
  }, [loadDailyPreps, loadWeeklyPreps]);

  const activeTrades = useMemo(() => {
    const safeTrades = Array.isArray(trades) ? trades : [];
    if (selectedAccountId === 'all') return safeTrades;

    // FIX: Găsim contul selectat pentru a permite potrivirea și după nume (fallback)
    // Unele tranzacții importate pot avea numele contului salvat în loc de ID
    const targetAccount = accounts.find(a => a.id === selectedAccountId);

    return safeTrades.filter(t => 
        t.accountId === selectedAccountId || 
        (targetAccount && t.accountId === targetAccount.name)
    );
  }, [trades, selectedAccountId, accounts]);

  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

  const filteredTradesByTime = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    return activeTrades.filter(trade => {
      if (timeRange === 'ALL') return true;
      const tradeDate = new Date(trade.date);
      const diffTime = Math.abs(now.getTime() - tradeDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (timeRange === '1D') return trade.date === todayStr;
      if (timeRange === '1W') return diffDays <= 7;
      if (timeRange === '1M') return diffDays <= 30;
      return true;
    });
  }, [activeTrades, timeRange]);

  const stats = useMemo(() => {
    const totalPnl = filteredTradesByTime.reduce((sum, t) => sum + (t.pnlNet || 0), 0);
    const winCount = filteredTradesByTime.filter(t => t.status === 'WIN').length;
    const lossCount = filteredTradesByTime.filter(t => t.status === 'LOSS').length;
    const winRate = filteredTradesByTime.length > 0 ? (winCount / filteredTradesByTime.length) * 100 : 0;

    const winners = filteredTradesByTime.filter(tr => (tr.pnlNet || 0) > 0);
    const losers = filteredTradesByTime.filter(tr => (tr.pnlNet || 0) < 0);
    const totalWinPnl = winners.reduce((s, tr) => s + (tr.pnlNet || 0), 0);
    const totalLossPnl = Math.abs(losers.reduce((s, tr) => s + (tr.pnlNet || 0), 0));
    const pf = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : (totalWinPnl > 0 ? 99 : 0);
    const expectancy = filteredTradesByTime.length > 0 ? totalPnl / filteredTradesByTime.length : 0;

    return { totalPnl, winCount, lossCount, winRate, pf, expectancy, avgWin: winners.length > 0 ? totalWinPnl/winners.length : 0, avgLoss: losers.length > 0 ? totalLossPnl/losers.length : 0 };
  }, [filteredTradesByTime]);

  const analyticalInsights = useMemo(() => {
    const days = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
    const pnlByDay: Record<string, number> = {};
    const sessions: Record<string, { pnl: number, wins: number }> = {};
    const setups: Record<string, { pnl: number, count: number, wins: number }> = {};
    
    filteredTradesByTime.forEach(t => {
      const dayName = days[new Date(t.date).getDay()];
      pnlByDay[dayName] = (pnlByDay[dayName] || 0) + (t.pnlNet || 0);
      
      const sType = t.session || 'Unknown';
      if (!sessions[sType]) sessions[sType] = { pnl: 0, wins: 0 };
      sessions[sType].pnl += (t.pnlNet || 0);
      if (t.status === 'WIN') sessions[sType].wins += 1;

      const sName = t.setup || 'Manual';
      if (!setups[sName]) setups[sName] = { pnl: 0, count: 0, wins: 0 };
      setups[sName].pnl += (t.pnlNet || 0);
      setups[sName].count += 1;
      if (t.status === 'WIN') setups[sName].wins += 1;
    });

    const goldenDayEntry = Object.entries(pnlByDay).sort((a, b) => b[1] - a[1])[0];
    const winningSessionEntry = Object.entries(sessions).sort((a, b) => b[1].pnl - a[1].pnl)[0];

    const setupPerf = Object.entries(setups).map(([name, d]) => ({
      name,
      pnl: d.pnl,
      wr: (d.wins / (d.count || 1)) * 100,
      count: d.count
    }));

    return {
      goldenDay: goldenDayEntry ? { name: goldenDayEntry[0].toUpperCase(), pnl: goldenDayEntry[1] } : { name: '--', pnl: 0 },
      winningSession: winningSessionEntry ? { name: winningSessionEntry[0].toUpperCase(), wins: winningSessionEntry[1].wins } : { name: '--', wins: 0 },
      worstSetups: [...setupPerf].sort((a, b) => a.pnl - b.pnl).slice(0, 2).filter(x => x.pnl < 0),
      bestWrSetups: [...setupPerf].sort((a, b) => b.wr - a.wr).slice(0, 2).filter(x => x.count > 1),
      setupsFreq: [...setupPerf].sort((a, b) => b.count - a.count).slice(0, 5)
    };
  }, [filteredTradesByTime]);

  const equityData = useMemo(() => {
    const start = activeAccount?.initialBalance || 50000;
    const sorted = [...filteredTradesByTime].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = start;
    const res = sorted.map(t => ({ label: t.date, equity: (running += t.pnlNet) }));
    return [{ label: 'Start', equity: start }, ...res];
  }, [filteredTradesByTime, activeAccount]);

  const outcomeData = [
    { name: 'WINS', value: stats.winCount, color: '#10b981' },
    { name: 'LOSSES', value: stats.lossCount, color: '#f43f5e' },
    { name: 'BE', value: filteredTradesByTime.filter(t => t.status === 'BE').length, color: '#64748b' },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-1000">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-10 py-8 bg-[#0b1222]/60 border border-slate-800/60 rounded-[3rem] shadow-xl">
        <div className="flex items-center space-x-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl">
            <i className="fas fa-layer-group text-xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">
              PERSPECTIVA GLOBALA
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">PROTOCOL INTELLIGENCE V4.5</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{filteredTradesByTime.length} Tranzactii</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-slate-800 p-1.5 rounded-xl flex items-center shadow-inner self-start xl:self-auto">
          {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => (
            <button key={range} onClick={() => setTimeRange(range)} className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{range}</button>
          ))}
        </div>
      </div>

      {/* TOP STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="TOTAL NET P&L" value={`$${stats.totalPnl.toLocaleString()}`} subValue="NET RETURN" trend={stats.totalPnl >= 0 ? 'up' : 'down'} icon="fa-coins" color="emerald" />
        <StatCard title="WIN RATE" value={`${stats.winRate.toFixed(1)}%`} subValue={`${stats.winCount} WINS`} trend="up" icon="fa-bullseye" color="blue" />
        <StatCard title="PROFIT FACTOR" value={stats.pf.toFixed(2)} subValue="PF INDEX" trend="up" icon="fa-bolt" color="orange" />
        <StatCard title="EXPECTANCY" value={`$${stats.expectancy.toFixed(0)}`} subValue="PER TRADE" icon="fa-magnifying-glass-dollar" color="purple" />
      </div>

      {/* GOLDEN DAY & DOMINANT SESSION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoCard title="ZIUA DE AUR" value={analyticalInsights.goldenDay.name} subValue={`+ $${analyticalInsights.goldenDay.pnl.toLocaleString()}`} icon="fa-sun" colorClass="text-emerald-500" />
        <InfoCard title="SESIUNE DOMINANTA" value={analyticalInsights.winningSession.name} subValue={`${analyticalInsights.winningSession.wins} WINNERS`} icon="fa-crown" colorClass="text-blue-500" />
      </div>

      {/* EDGE ANALYSIS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SetupAnalysisCard 
            title="SCURGERI DE CAPITAL (WORST SETUPS)" 
            icon="fa-faucet-drip" 
            color="text-red-500" 
            data={analyticalInsights.worstSetups} 
            emptyMsg="FARA SETUP-URI PE PIERDERE RECENT."
        />
        <SetupAnalysisCard 
            title="EDGE DE INALTA PROBABILITATE (HIGH WR)" 
            icon="fa-circle-check" 
            color="text-blue-500" 
            data={analyticalInsights.bestWrSetups} 
            emptyMsg="INSUFICIENTE DATE PENTRU EDGE STATS."
        />
      </div>

      {/* EQUITY CURVE & OUTCOME DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10">EQUITY GROWTH CURVE ({timeRange})</h4>
           <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityData}>
                        <defs>
                            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                        <XAxis dataKey="label" hide />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${Math.round(v/1000)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} fill="url(#eqGrad)" dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center items-center relative overflow-hidden">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 absolute top-8 left-8">OUTCOME DISTRIBUTION</h4>
            <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={85} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none">
                            {outcomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-4xl font-black text-white italic tracking-tighter">{stats.winRate.toFixed(0)}%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">WIN RATE</p>
                </div>
            </div>
        </div>
      </div>

      {/* FREQUENT SETUPS & EFFICIENCY STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">CELE MAI FRECVENTE SETUPS</h4>
           <div className="space-y-2">
                {analyticalInsights.setupsFreq && analyticalInsights.setupsFreq.length > 0 ? analyticalInsights.setupsFreq.map((s, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                            <span className="text-slate-300">{s.name}</span>
                            <span className="text-slate-500">{s.count} TRADES</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${(s.count / (analyticalInsights.setupsFreq[0]?.count || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                )) : (
                  <p className="text-[10px] text-slate-600 italic uppercase">No setups recorded for current timeframe.</p>
                )}
           </div>
        </div>

        <div className="lg:col-span-6 bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10">STATISTICI EFICIENTA</h4>
           <div className="space-y-6">
                <EfficiencyRow label="CASTIG MEDIU" value={`$${stats.avgWin.toLocaleString()}`} color="text-green-500" />
                <EfficiencyRow label="PIERDERE MEDIE" value={`-$${Math.abs(stats.avgLoss).toLocaleString()}`} color="text-red-500" />
                <EfficiencyRow label="R:R REALIZAT MEDIU" value={`1:${(stats.avgWin / (Math.abs(stats.avgLoss) || 1)).toFixed(2)}`} color="text-blue-500" />
           </div>
        </div>
      </div>

    </div>
  );
};

const EfficiencyRow = ({ label, value, color }: any) => (
    <div className="flex justify-between items-center border-b border-slate-800/50 pb-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-xl font-black italic tracking-tighter ${color}`}>{value}</span>
    </div>
);

export default Dashboard;
