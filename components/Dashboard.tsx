import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar } from 'recharts';
import { useAppContext } from '../AppContext';
import { translations } from '../translations';

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
  <div className="bg-[#0b1222] border border-slate-800/50 p-6 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all group overflow-hidden relative">
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">{title}</p>
        {icon && <i className={`fas ${icon} text-slate-700 group-hover:text-${color}-500 transition-colors`}></i>}
      </div>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        {trend && (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend === 'up' ? '▲' : '▼'} {subValue}
          </span>
        )}
        {!trend && <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">{subValue}</span>}
      </div>
    </div>
    <div className={`absolute -bottom-2 -right-2 text-6xl text-white/[0.01] transition-all group-hover:scale-110 group-hover:text-${color}-500/5`}>
      {icon && <i className={`fas ${icon}`}></i>}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { activeTrades, language, accounts, selectedAccountId } = useAppContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const t = translations[language].dashboard;

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

  const totalPnl = filteredTradesByTime.reduce((sum, t) => sum + t.pnlNet, 0);
  const winCount = filteredTradesByTime.filter(t => t.status === 'WIN').length;
  const lossCount = filteredTradesByTime.filter(t => t.status === 'LOSS').length;
  const winRate = filteredTradesByTime.length > 0 ? (winCount / filteredTradesByTime.length) * 100 : 0;

  const efficiencyStats = useMemo(() => {
    const winners = filteredTradesByTime.filter(tr => tr.pnlNet > 0);
    const losers = filteredTradesByTime.filter(tr => tr.pnlNet < 0);
    const totalWinPnl = winners.reduce((s, tr) => s + tr.pnlNet, 0);
    const totalLossPnl = Math.abs(losers.reduce((s, tr) => s + tr.pnlNet, 0));
    
    const avgWin = winners.length > 0 ? totalWinPnl / winners.length : 0;
    const avgLoss = losers.length > 0 ? totalLossPnl / losers.length : 0;
    const avgRr = filteredTradesByTime.length > 0 
      ? filteredTradesByTime.reduce((s, tr) => s + tr.rrRealized, 0) / filteredTradesByTime.length 
      : 0;
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : (totalWinPnl > 0 ? 99 : 0);
    const expectancy = filteredTradesByTime.length > 0 ? totalPnl / filteredTradesByTime.length : 0;
    
    return { profitFactor, expectancy, avgWin, avgLoss, avgRr };
  }, [filteredTradesByTime, totalPnl]);

  const habitsAnalytics = useMemo(() => {
    const days = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
    const pnlByDay: Record<string, number> = {};
    const sessions: Record<string, { pnl: number, wins: number }> = {};
    const setups: Record<string, { pnl: number, count: number, wins: number }> = {};
    
    filteredTradesByTime.forEach(t => {
      // Ziua de aur
      const dayName = days[new Date(t.date).getDay()];
      pnlByDay[dayName] = (pnlByDay[dayName] || 0) + t.pnlNet;
      
      // Sesiunea dominanta
      if (!sessions[t.session]) sessions[t.session] = { pnl: 0, wins: 0 };
      sessions[t.session].pnl += t.pnlNet;
      if (t.status === 'WIN') sessions[t.session].wins += 1;

      // Setup stats
      const sName = t.setup || 'Manual';
      if (!setups[sName]) setups[sName] = { pnl: 0, count: 0, wins: 0 };
      setups[sName].pnl += t.pnlNet;
      setups[sName].count += 1;
      if (t.status === 'WIN') setups[sName].wins += 1;
    });

    const goldenDayEntry = Object.entries(pnlByDay).sort((a, b) => b[1] - a[1])[0];
    const winningSessionEntry = Object.entries(sessions).sort((a, b) => b[1].pnl - a[1].pnl)[0];

    const setupPerf = Object.entries(setups).map(([name, d]) => ({
      name,
      pnl: d.pnl,
      wr: (d.wins / d.count) * 100,
      exp: d.pnl / d.count,
      count: d.count
    }));

    const worstSetups = [...setupPerf].sort((a, b) => a.pnl - b.pnl).slice(0, 3).filter(x => x.pnl < 0);
    const bestWrSetups = [...setupPerf].sort((a, b) => b.wr - a.wr).slice(0, 3);

    return {
      goldenDay: goldenDayEntry ? { name: goldenDayEntry[0].toUpperCase(), pnl: goldenDayEntry[1] } : { name: '--', pnl: 0 },
      winningSession: winningSessionEntry ? { name: winningSessionEntry[0].toUpperCase(), wins: winningSessionEntry[1].wins } : { name: '--', wins: 0 },
      worstSetups,
      bestWrSetups
    };
  }, [filteredTradesByTime]);

  const setupsFrequencyData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTradesByTime.forEach(tr => {
      const s = tr.setup || 'Manual';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTradesByTime]);

  const equityChartData = useMemo(() => {
    const START_BALANCE = activeAccount?.initialBalance || 50000;
    const sorted = [...filteredTradesByTime].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = START_BALANCE;
    const result = sorted.map(t => {
      runningBalance += t.pnlNet;
      return { label: t.date, equity: runningBalance };
    });
    return [{ label: 'Start', equity: START_BALANCE }, ...result];
  }, [filteredTradesByTime, activeAccount]);

  const bottomWidgetTitle = "text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8";

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-10 py-8 bg-[#0b1222]/60 border border-slate-800/60 rounded-[3rem] shadow-xl">
        <div className="flex items-center space-x-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl ${activeAccount ? 'bg-indigo-600' : 'bg-blue-600 animate-pulse'}`}>
            <i className={`fas ${activeAccount ? 'fa-wallet' : 'fa-layer-group'} text-2xl`}></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-1.5">
              {activeAccount ? activeAccount.name : 'Perspectiva Globala'}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Protocol Intelligence V4.3</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredTradesByTime.length} Tranzactii</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-slate-800 p-1.5 rounded-2xl flex items-center shadow-inner self-start xl:self-auto">
          {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 ${
                timeRange === range ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.totalPnl} value={`$${totalPnl.toLocaleString()}`} subValue="Net Return" icon="fa-coins" color="emerald" />
        <StatCard title={t.winRate} value={`${winRate.toFixed(1)}%`} subValue={`${winCount} Wins`} icon="fa-bullseye" color="blue" />
        <StatCard title={t.profitFactor} value={efficiencyStats.profitFactor.toFixed(2)} subValue="PF INDEX" icon="fa-bolt" color="orange" />
        <StatCard title="Expectancy" value={`$${efficiencyStats.expectancy.toFixed(0)}`} subValue="PER TRADE" icon="fa-magnifying-glass-dollar" color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0b1222] border border-slate-800/80 p-8 rounded-[2.5rem] group hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-center relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Ziua de Aur</p>
            <p className="text-3xl font-black text-green-500 mb-1 italic tracking-tighter">{habitsAnalytics.goldenDay.name}</p>
            <p className="text-[12px] font-black text-slate-400 tracking-widest uppercase">
                {habitsAnalytics.goldenDay.pnl >= 0 ? '+' : ''}${habitsAnalytics.goldenDay.pnl.toLocaleString()}
            </p>
            <i className="fas fa-crown absolute -bottom-4 -right-4 text-7xl text-white/[0.01] pointer-events-none"></i>
          </div>
          <div className="bg-[#0b1222] border border-slate-800/80 p-8 rounded-[2.5rem] group hover:border-blue-500/30 transition-all shadow-xl flex flex-col justify-center relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Sesiune Dominanta</p>
            <p className="text-3xl font-black text-blue-400 mb-1 italic tracking-tighter">{habitsAnalytics.winningSession.name}</p>
            <p className="text-[12px] font-black text-slate-400 tracking-widest uppercase">{habitsAnalytics.winningSession.wins} Winners</p>
            <i className="fas fa-trophy absolute -bottom-4 -right-4 text-7xl text-white/[0.01] pointer-events-none"></i>
          </div>
      </div>

      {/* RÂNDUL CU WIDGET-URILE DE SETUP PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0b1222] border border-slate-800/80 p-8 rounded-[2.5rem] shadow-xl flex flex-col">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center">
              <i className="fas fa-faucet-drip mr-3"></i> Scurgeri de Capital (Worst Setups)
            </p>
            <div className="space-y-4">
               {habitsAnalytics.worstSetups.length > 0 ? habitsAnalytics.worstSetups.map(s => (
                 <div key={s.name} className="flex justify-between items-center p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black text-slate-200 uppercase">{s.name}</span>
                       <span className="text-[8px] font-bold text-slate-500 uppercase">{s.count} TRADES</span>
                    </div>
                    <span className="text-lg font-black text-red-500">-${Math.abs(s.pnl).toLocaleString()}</span>
                 </div>
               )) : (
                 <div className="py-6 text-center border-2 border-dashed border-slate-800 rounded-2xl opacity-30">
                    <p className="text-[9px] font-black text-slate-600 uppercase">Fara setup-uri pe pierdere recent.</p>
                 </div>
               )}
            </div>
          </div>
          
          <div className="bg-[#0b1222] border border-slate-800/80 p-8 rounded-[2.5rem] shadow-xl flex flex-col">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center">
              <i className="fas fa-bullseye mr-3"></i> Edge de Inalta Probabilitate (High WR)
            </p>
            <div className="space-y-4">
               {habitsAnalytics.bestWrSetups.length > 0 ? habitsAnalytics.bestWrSetups.map(s => (
                 <div key={s.name} className="flex justify-between items-center p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <div className="flex flex-col">
                       <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-black text-slate-200 uppercase">{s.name}</span>
                          <span className="text-[8px] font-black bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded">{s.wr.toFixed(0)}% WR</span>
                       </div>
                       <span className="text-[8px] font-bold text-slate-500 uppercase mt-1">EXPECTANCY: ${s.exp.toFixed(0)} / TRADE</span>
                    </div>
                    <span className={`text-lg font-black ${s.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {s.pnl >= 0 ? '+' : ''}${s.pnl.toLocaleString()}
                    </span>
                 </div>
               )) : (
                 <div className="py-6 text-center border-2 border-dashed border-slate-800 rounded-2xl opacity-30">
                    <p className="text-[9px] font-black text-slate-600 uppercase">Insuficiente date pentru edge stats.</p>
                 </div>
               )}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl">
          <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-10 text-center lg:text-left">EQUITY GROWTH CURVE ({timeRange})</h4>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityChartData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.03} vertical={false} />
                <XAxis dataKey="label" stroke="#475569" fontSize={9} hide={timeRange === '1D'} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} fill="url(#colorEquity)" dot={timeRange === '1D' || timeRange === '1W'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl flex flex-col">
          <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-12">OUTCOME DISTRIBUTION</h4>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Wins', value: winCount }, { name: 'Losses', value: lossCount }]} innerRadius={85} outerRadius={105} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{winRate.toFixed(0)}%</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">WIN RATE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1222]/80 border border-slate-800/40 rounded-[2.5rem] p-8 shadow-xl">
          <h4 className={bottomWidgetTitle}>CELE MAI FRECVENTE SETUPS</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={setupsFrequencyData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} axisLine={false} tickLine={false} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0b1222]/80 border border-slate-800/40 rounded-[2.5rem] p-8 shadow-xl">
          <h4 className={bottomWidgetTitle}>STATISTICI EFICIENTA</h4>
          <div className="space-y-8 pt-4">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CASTIG MEDIU</span>
              <span className="text-2xl font-black text-green-500">${efficiencyStats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PIERDERE MEDIE</span>
              <span className="text-2xl font-black text-red-500">-${Math.abs(efficiencyStats.avgLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">R:R REALIZAT MEDIU</span>
              <span className="text-2xl font-black text-blue-500">1:{efficiencyStats.avgRr.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;