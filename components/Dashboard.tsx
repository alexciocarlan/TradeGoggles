import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar } from 'recharts';
import { useAppContext } from '../AppContext';
import { translations } from '../translations';
import { getMarketTickers, MarketTickers } from '../geminiService';

type TimeRange = '1D' | '1W' | '1M' | 'ALL';

const TickerCard = ({ label, value, diff, loading }: { label: string, value?: number, diff?: number, loading?: boolean }) => {
  if (loading) return (
    <div className="bg-[#0b1222] border border-slate-800/40 p-4 rounded-2xl animate-pulse">
      <div className="h-2 w-10 bg-slate-800 rounded mb-2"></div>
      <div className="h-6 w-20 bg-slate-800 rounded"></div>
    </div>
  );
  
  return (
    <div className="bg-[#0b1222] border border-slate-800/50 p-4 rounded-2xl shadow-sm transition-colors duration-300">
      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-black text-white">{value?.toLocaleString() || '--'}</h4>
        {diff !== undefined && (
          <span className={`text-[9px] font-bold ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subValue, trend, icon, color = "blue" }: { title: string, value: string, subValue: string, trend?: 'up' | 'down', icon?: string, color?: string }) => (
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
  const { trades, selectedAccountId, language } = useAppContext();
  const [tickers, setTickers] = useState<MarketTickers | null>(null);
  const [loadingTickers, setLoadingTickers] = useState(true);
  const [equityRange, setEquityRange] = useState<TimeRange>('1M');
  const t = translations[language].dashboard;

  useEffect(() => {
    const fetchTickers = async () => {
      setLoadingTickers(true);
      const data = await getMarketTickers();
      if (data) setTickers(data);
      setLoadingTickers(false);
    };
    fetchTickers();
    const interval = setInterval(fetchTickers, 300000);
    return () => clearInterval(interval);
  }, []);

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(tr => tr.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const totalPnl = activeTrades.reduce((sum, t) => sum + t.pnlNet, 0);
  const winCount = activeTrades.filter(t => t.status === 'WIN').length;
  const lossCount = activeTrades.filter(t => t.status === 'LOSS').length;
  const winRate = activeTrades.length > 0 ? (winCount / activeTrades.length) * 100 : 0;

  const efficiencyStats = useMemo(() => {
    const winners = activeTrades.filter(tr => tr.pnlNet > 0);
    const losers = activeTrades.filter(tr => tr.pnlNet < 0);
    const avgWin = winners.length > 0 ? (winners.reduce((s, tr) => s + tr.pnlNet, 0) / winners.length) : 0;
    const avgLoss = losers.length > 0 ? (losers.reduce((s, tr) => s + tr.pnlNet, 0) / losers.length) : 0;
    const avgRR = activeTrades.length > 0 ? (activeTrades.reduce((s, tr) => s + tr.rrRealized, 0) / activeTrades.length) : 0;
    
    const totalWinPnl = winners.reduce((s, tr) => s + tr.pnlNet, 0);
    const totalLossPnl = Math.abs(losers.reduce((s, tr) => s + tr.pnlNet, 0));
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : (totalWinPnl > 0 ? 99 : 0);
    const expectancy = activeTrades.length > 0 ? totalPnl / activeTrades.length : 0;

    return { avgWin, avgLoss, avgRR, profitFactor, expectancy };
  }, [activeTrades, totalPnl]);

  const setupFrequencyData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTrades.forEach(tr => {
      counts[tr.setup] = (counts[tr.setup] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [activeTrades]);

  // Fix: Added executionErrorsData calculation to resolve the "Cannot find name 'executionErrorsData'" error.
  const executionErrorsData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTrades.filter(tr => tr.executionError && tr.executionError !== 'None').forEach(tr => {
      counts[tr.executionError] = (counts[tr.executionError] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [activeTrades]);

  const avgLossPerSetupData = useMemo(() => {
    const setupLosses: Record<string, { total: number, count: number }> = {};
    activeTrades.filter(tr => tr.pnlNet < 0).forEach(tr => {
      if (!setupLosses[tr.setup]) setupLosses[tr.setup] = { total: 0, count: 0 };
      setupLosses[tr.setup].total += Math.abs(tr.pnlNet);
      setupLosses[tr.setup].count += 1;
    });
    return Object.entries(setupLosses)
      .map(([name, data]) => ({ name, value: Math.round(data.total / data.count) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [activeTrades]);

  const expectancyPerSetupData = useMemo(() => {
    const setupExpectancy: Record<string, { total: number, count: number }> = {};
    activeTrades.forEach(tr => {
      if (!setupExpectancy[tr.setup]) setupExpectancy[tr.setup] = { total: 0, count: 0 };
      setupExpectancy[tr.setup].total += tr.pnlNet;
      setupExpectancy[tr.setup].count += 1;
    });
    return Object.entries(setupExpectancy)
      .map(([name, data]) => ({ name, value: Math.round(data.total / data.count) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [activeTrades]);

  const equityChartData = useMemo(() => {
    const START_BALANCE = 50000;
    const sorted = [...activeTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const now = new Date();
    let startDateLimit = new Date(0);
    if (equityRange === '1D') startDateLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (equityRange === '1W') startDateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (equityRange === '1M') startDateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let runningBalance = START_BALANCE;
    sorted.filter(t => new Date(t.date) < startDateLimit).forEach(t => { runningBalance += t.pnlNet; });
    const balanceAtStartOfRange = runningBalance;

    const result = sorted.filter(t => new Date(t.date) >= startDateLimit).map(t => {
      runningBalance += t.pnlNet;
      return { label: t.entryTime ? `${t.date.split('-').slice(1).join('/')} ${t.entryTime}` : t.date, equity: runningBalance };
    });
    return [{ label: 'Prev', equity: balanceAtStartOfRange }, ...result];
  }, [activeTrades, equityRange]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
         <TickerCard label="NQ FUTURE" value={tickers?.nqPrice} diff={tickers ? (tickers.nqPrice - tickers.nqSettlement) : undefined} loading={loadingTickers} />
         <TickerCard label="ES FUTURE" value={tickers?.esPrice} diff={tickers ? (tickers.esPrice - tickers.esSettlement) : undefined} loading={loadingTickers} />
         <TickerCard label="VIX INDEX" value={tickers?.vix} loading={loadingTickers} />
         <TickerCard label="DXY DOLLAR" value={tickers?.dxyCurrent} loading={loadingTickers} />
         <div className="hidden lg:flex items-center space-x-4 px-6 bg-blue-600/5 border border-blue-500/20 rounded-2xl col-span-2">
            <i className="fas fa-satellite-dish text-blue-500 animate-pulse"></i>
            <p className="text-[10px] font-black text-blue-400 uppercase leading-relaxed tracking-widest">Protocol V2.0 activ: Scanare structură CME în progres.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title={t.totalPnl} 
            value={`$${totalPnl.toLocaleString()}`} 
            subValue={`$${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}`} 
            trend={totalPnl >= 0 ? 'up' : 'down'} 
            icon="fa-coins" 
            color="emerald"
        />
        <StatCard 
            title={t.winRate} 
            value={`${winRate.toFixed(1)}%`} 
            subValue={`${winCount} Wins`} 
            trend={winRate >= 50 ? 'up' : 'down'} 
            icon="fa-bullseye" 
            color="blue"
        />
        <StatCard 
            title={t.profitFactor} 
            value={efficiencyStats.profitFactor.toFixed(2)} 
            subValue="STRENGTH" 
            icon="fa-bolt" 
            color="orange"
        />
        <StatCard 
            title="Expectancy" 
            value={`$${efficiencyStats.expectancy.toFixed(0)}`} 
            subValue="PER TRADE" 
            icon="fa-magnifying-glass-dollar" 
            color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-1">EQUITY GROWTH</h4>
              <p className="text-2xl font-black text-white italic tracking-tighter">Evoluția Portofoliului</p>
            </div>
            <div className="bg-black/40 border border-slate-800 p-1 rounded-xl flex space-x-1">
              {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map(range => (
                <button key={range} onClick={() => setEquityRange(range)} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${equityRange === range ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{range}</button>
              ))}
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityChartData}>
                {/* Fixed line 231: Remove duplicate x1 attribute and replace with y1 */}
                <defs><linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.03} vertical={false} />
                <XAxis dataKey="label" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#475569'}} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} domain={['auto', 'auto']} tick={{fill: '#475569'}} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }} itemStyle={{color: '#3b82f6'}} />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fill="url(#colorEquity)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl flex flex-col">
          <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-12">DISTRIBUȚIE REZULTATE</h4>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Wins', value: winCount }, { name: 'Losses', value: lossCount }]} innerRadius={85} outerRadius={105} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#10b981" /><Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-5xl font-black text-white tracking-tighter">{winRate.toFixed(0)}%</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">WIN RATE</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end mt-8">
             <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">WINS</p><p className="text-4xl font-black text-white">{winCount}</p></div>
             <div className="text-right"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">LOSSES</p><p className="text-4xl font-black text-white">{lossCount}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEAKAGE REPORT WIDGET */}
        <div className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] p-10 min-h-[350px] shadow-2xl flex flex-col relative group overflow-hidden">
           <div className="flex justify-between items-start mb-12">
              <div>
                 <p className="text-red-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">LEAKAGE REPORT</p>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">AVG. LOSS PER SETUP</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg">
                 <i className="fas fa-hand-holding-dollar"></i>
              </div>
           </div>
           
           {avgLossPerSetupData.length > 0 ? (
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgLossPerSetupData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(244, 63, 94, 0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(val) => [`-$${val}`, 'Avg. Loss']} />
                    <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-3xl opacity-30">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Insufficient loss data</p>
             </div>
           )}

           <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">IDENTIFICĂ SETUP-URILE CARE ÎȚI SÂNGEREAZĂ CAPITALUL</p>
           </div>
        </div>

        {/* EXPECTANCY PER SETUP WIDGET */}
        <div className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] p-10 min-h-[350px] shadow-2xl flex flex-col relative group overflow-hidden">
           <div className="flex justify-between items-start mb-12">
              <div>
                 <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">EXPECTANCY PER SETUP</p>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">AVG. PROFIT PER EXECUTION</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                 <i className="fas fa-coins"></i>
              </div>
           </div>
           
           {expectancyPerSetupData.length > 0 ? (
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expectancyPerSetupData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={(val) => [`$${val}`, 'Expectancy']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {expectancyPerSetupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-3xl opacity-30">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Insufficient trade data</p>
             </div>
           )}

           <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">CE VALOARE ARE FIECARE "CLICK" PENTRU TINE</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WIDGET 1: CELE MAI FRECVENTE SETUPS */}
        <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl min-h-[320px] flex flex-col">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">{t.frequentSetups}</h4>
          {setupFrequencyData.length > 0 ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupFrequencyData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={100} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] font-black text-slate-700 uppercase italic">Lipsă date setups</p>
            </div>
          )}
        </div>

        {/* WIDGET 2: ERORI DE EXECUȚIE FRECVENTE */}
        <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl min-h-[320px] flex flex-col">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">{t.executionErrors}</h4>
          {executionErrorsData.length > 0 ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionErrorsData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={100} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <i className="fas fa-shield-check text-slate-800 text-3xl mb-4"></i>
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">ZERO ERORI ÎNREGISTRATE</p>
              </div>
            </div>
          )}
        </div>

        {/* WIDGET 3: STATISTICI EFICIENȚĂ */}
        <div className="bg-[#0b1222] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl min-h-[320px] flex flex-col justify-center">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 self-start">{t.efficiencyStats}</h4>
            <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b border-slate-800/60">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.avgWin}</span>
                    <span className="text-2xl font-black text-green-500">${efficiencyStats.avgWin.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-800/60">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.avgLoss}</span>
                    <span className="text-2xl font-black text-red-500">-${Math.abs(efficiencyStats.avgLoss).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.avgRr}</span>
                    <span className="text-2xl font-black text-blue-500">1:{efficiencyStats.avgRR.toFixed(2)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
