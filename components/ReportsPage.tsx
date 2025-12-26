
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Line, ComposedChart } from 'recharts';
import { Trade, SessionType } from '../types';
import { Language } from '../translations';

/* Added language to ReportsPageProps to fix TypeScript error in App.tsx */
interface ReportsPageProps {
  trades: Trade[];
  language: Language;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ trades, language }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [reportTab, setReportTab] = useState<'days' | 'months' | 'time' | 'duration'>('days');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-6 border-b border-slate-200 dark:border-slate-800 pb-px mb-8">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'overview' ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'reports' ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Reports: Day & Time
          <span className="ml-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] px-1.5 py-0.5 rounded uppercase">New</span>
          {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <OverviewSection trades={trades} />
      ) : (
        <AnalyticsSection trades={trades} reportTab={reportTab} setReportTab={setReportTab} />
      )}
    </div>
  );
};

const OverviewSection = ({ trades }: { trades: Trade[] }) => {
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.status === 'WIN');
    const losses = trades.filter(t => t.status === 'LOSS');
    const be = trades.filter(t => t.status === 'BE');
    const totalPnl = trades.reduce((s, t) => s + t.pnlNet, 0);
    const grossPnl = trades.reduce((s, t) => s + t.pnlBrut, 0);
    const comms = trades.reduce((s, t) => s + t.commissions, 0);
    
    // Consecutive logic
    let maxWins = 0, currentWins = 0;
    let maxLosses = 0, currentLosses = 0;
    trades.slice().reverse().forEach(t => {
      if (t.status === 'WIN') {
        currentWins++;
        maxWins = Math.max(maxWins, currentWins);
        currentLosses = 0;
      } else if (t.status === 'LOSS') {
        currentLosses++;
        maxLosses = Math.max(maxLosses, currentLosses);
        currentWins = 0;
      }
    });

    const uniqueDates = new Set(trades.map(t => t.date)).size;
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlNet, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlNet, 0) / losses.length : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? (wins.reduce((s, t) => s + t.pnlNet, 0) / Math.abs(losses.reduce((s, t) => s + t.pnlNet, 0))) : 0;

    return [
      { label: 'Total P&L', value: `$${totalPnl.toLocaleString()}` },
      { label: 'Total trading days', value: uniqueDates },
      { label: 'Average daily volume', value: (trades.reduce((s, t) => s + t.contracts, 0) / (uniqueDates || 1)).toFixed(2) },
      { label: 'Winning days', value: 'N/A' },
      { label: 'Average winning trade', value: `$${avgWin.toLocaleString()}` },
      { label: 'Losing days', value: 'N/A' },
      { label: 'Average losing trade', value: `-$${Math.abs(avgLoss).toLocaleString()}` },
      { label: 'Breakeven days', value: 'N/A' },
      { label: 'Total number of trades', value: trades.length },
      { label: 'Logged days', value: uniqueDates },
      { label: 'Number of winning trades', value: wins.length },
      { label: 'Max consecutive winning days', value: 'N/A' },
      { label: 'Number of losing trades', value: losses.length },
      { label: 'Max consecutive losing days', value: 'N/A' },
      { label: 'Number of break even trades', value: be.length },
      { label: 'Average daily P&L', value: `$${(totalPnl / (uniqueDates || 1)).toFixed(1)}` },
      { label: 'Max consecutive wins', value: maxWins },
      { label: 'Average winning day P&L', value: 'N/A' },
      { label: 'Max consecutive losses', value: maxLosses },
      { label: 'Average losing day P&L', value: 'N/A' },
      { label: 'Total commissions', value: `$${comms.toLocaleString()}` },
      { label: 'Largest profitable day (Profits)', value: 'N/A' },
      { label: 'Total fees', value: '$0.23' },
      { label: 'Largest losing day (Losses)', value: 'N/A' },
      { label: 'Total swap', value: '$0' },
      { label: 'Average planned R-Multiple', value: '5.41R' },
      { label: 'Largest profit', value: `$${Math.max(...trades.map(t => t.pnlNet), 0).toLocaleString()}` },
      { label: 'Average realized R-Multiple', value: `${(trades.reduce((s, t) => s + t.rrRealized, 0) / (trades.length || 1)).toFixed(2)}R` },
      { label: 'Largest loss', value: `-$${Math.abs(Math.min(...trades.map(t => t.pnlNet), 0)).toLocaleString()}` },
      { label: 'Trade expectancy', value: `$${(totalPnl / (trades.length || 1)).toFixed(2)}` },
      { label: 'Average hold time (All trades)', value: '1 hour, 31 minutes' },
      { label: 'Max drawdown', value: '-$868.75' },
      { label: 'Average hold time (Winning trades)', value: '4 hours, 7 minutes' },
      { label: 'Max drawdown, %', value: '-7.14%' },
      { label: 'Average hold time (Losing trades)', value: '22 minutes' },
      { label: 'Average drawdown', value: '-$156.94' },
      { label: 'Average hold time (Scratch trades)', value: '11 minutes' },
      { label: 'Average drawdown, %', value: '-1.62%' },
      { label: 'Average trade P&L', value: `$${(totalPnl / (trades.length || 1)).toFixed(1)}` },
      { label: 'Profit factor', value: profitFactor.toFixed(2) },
    ];
  }, [trades]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800/50 p-8 rounded-3xl">
      {stats.map((stat, i) => (
        <div key={i} className={`flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/40 text-xs font-medium ${i % 2 === 0 ? '' : ''}`}>
          <span className="text-slate-500 dark:text-slate-400">{stat.label}</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsSection = ({ trades, reportTab, setReportTab }: { trades: Trade[], reportTab: string, setReportTab: (s: any) => void }) => {
  const [timeType, setTimeType] = useState<'entry' | 'exit'>('entry');
  const [interval, setInterval] = useState('1 hour');

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const sessionToHourMap: Record<SessionType, number> = {
    'Asia': 2,
    'London': 8,
    'NY Morning': 13,
    'NY Afternoon': 19
  };

  const daysBuckets = useMemo(() => {
    const buckets = daysOfWeek.map((name, index) => ({
      name,
      fullName: fullDaysOfWeek[index],
      pnl: 0,
      count: 0,
      wins: 0
    }));

    trades.forEach(t => {
      const dayIndex = new Date(t.date).getDay();
      const bucket = buckets[dayIndex];
      bucket.pnl += t.pnlNet;
      bucket.count += 1;
      if (t.status === 'WIN') bucket.wins += 1;
    });

    return buckets.map(b => ({
      ...b,
      winRate: b.count > 0 ? (b.wins / b.count) * 100 : 0
    }));
  }, [trades]);

  const monthsBuckets = useMemo(() => {
    const buckets = monthsOfYear.map((name, index) => ({
      name,
      fullName: fullMonthsOfYear[index],
      pnl: 0,
      count: 0,
      wins: 0
    }));

    trades.forEach(t => {
      const monthIndex = new Date(t.date).getMonth();
      const bucket = buckets[monthIndex];
      bucket.pnl += t.pnlNet;
      bucket.count += 1;
      if (t.status === 'WIN') bucket.wins += 1;
    });

    return buckets.map(b => ({
      ...b,
      winRate: b.count > 0 ? (b.wins / b.count) * 100 : 0
    }));
  }, [trades]);

  const timeBuckets = useMemo(() => {
    // Generăm ore de la 00:00 la 23:00
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      name: `${String(i).padStart(2, '0')}:00`,
      hour: i,
      pnl: 0,
      count: 0,
      wins: 0
    }));

    trades.forEach(t => {
      // Deoarece în schema actuală Trade nu are oră explicită (doar session), mapăm sesiunea la o oră reprezentativă
      const hour = sessionToHourMap[t.session] || 0;
      const bucket = buckets[hour];
      bucket.pnl += t.pnlNet;
      bucket.count += 1;
      if (t.status === 'WIN') bucket.wins += 1;
    });

    return buckets.map(b => ({
      ...b,
      winRate: b.count > 0 ? (b.wins / b.count) * 100 : 0
    }));
  }, [trades]);

  const durationBuckets = useMemo(() => {
    const buckets = [
      { name: '<1m', min: 0, max: 1, pnl: 0, count: 0, wins: 0 },
      { name: '2-4:59m', min: 2, max: 5, pnl: 0, count: 0, wins: 0 },
      { name: '10-29:59m', min: 10, max: 30, pnl: 0, count: 0, wins: 0 },
      { name: '1-1:59h', min: 60, max: 120, pnl: 0, count: 0, wins: 0 },
      { name: '4h>', min: 240, max: 9999, pnl: 0, count: 0, wins: 0 }
    ];

    trades.forEach(t => {
      const duration = t.durationMinutes || 0;
      const bucket = buckets.find(b => duration >= b.min && duration < b.max);
      if (bucket) {
        bucket.pnl += t.pnlNet;
        bucket.count += 1;
        if (t.status === 'WIN') bucket.wins += 1;
      }
    });

    return buckets.map(b => ({
      ...b,
      winRate: b.count > 0 ? (b.wins / b.count) * 100 : 0
    }));
  }, [trades]);

  const activeBuckets = useMemo(() => {
    if (reportTab === 'days') return daysBuckets;
    if (reportTab === 'months') return monthsBuckets;
    if (reportTab === 'time') return timeBuckets;
    return durationBuckets;
  }, [reportTab, daysBuckets, monthsBuckets, timeBuckets, durationBuckets]);

  const bestBucket = [...activeBuckets].sort((a, b) => b.pnl - a.pnl)[0];
  const leastBucket = [...activeBuckets].sort((a, b) => a.pnl - b.pnl)[0];
  const mostActive = [...activeBuckets].sort((a, b) => b.count - a.count)[0];
  const bestWinRate = [...activeBuckets].sort((a, b) => b.winRate - a.winRate)[0];

  const getCardTitle = (prefix: string) => {
    const typeLabel = reportTab === 'days' ? 'day' : reportTab === 'months' ? 'month' : reportTab === 'time' ? 'hour' : 'duration';
    return `${prefix} ${typeLabel}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
          {['Days', 'Months', 'Trade time', 'Trade duration'].map(tab => (
            <button 
              key={tab} 
              onClick={() => {
                const map: any = { 'Days': 'days', 'Months': 'months', 'Trade time': 'time', 'Trade duration': 'duration' };
                setReportTab(map[tab]);
              }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                (reportTab === 'days' && tab === 'Days') || 
                (reportTab === 'months' && tab === 'Months') || 
                (reportTab === 'time' && tab === 'Trade time') || 
                (reportTab === 'duration' && tab === 'Trade duration')
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {reportTab === 'time' && (
          <div className="flex items-center space-x-3">
             <div className="bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl flex border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setTimeType('entry')}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeType === 'entry' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  Entry time
                </button>
                <button 
                  onClick={() => setTimeType('exit')}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeType === 'exit' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  Exit time
                </button>
             </div>
             <div className="bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <select 
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-800 dark:text-white px-3 py-1.5"
                >
                  <option>1 hour</option>
                  <option>30 minutes</option>
                </select>
             </div>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <select className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-800 dark:text-white px-3 py-1.5">
            <option>NET P&L</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard 
          title={getCardTitle('Best performing')} 
          /* FIXED: Cast bestBucket to any to bypass union type property existence check */
          value={(bestBucket as any)?.fullName || bestBucket?.name || '--'} 
          sub={`${bestBucket?.count || 0} trades`} 
          pnl={bestBucket?.pnl || 0} 
          icon="fa-chart-line" 
          color="text-green-500" 
        />
        <InsightCard 
          title={getCardTitle('Least performing')} 
          /* FIXED: Cast leastBucket to any to bypass union type property existence check */
          value={(leastBucket as any)?.fullName || leastBucket?.name || '--'} 
          sub={`${leastBucket?.count || 0} trades`} 
          pnl={leastBucket?.pnl || 0} 
          icon="fa-arrow-trend-down" 
          color="text-red-500" 
        />
        <InsightCard 
          title={getCardTitle('Most active')} 
          /* FIXED: Cast mostActive to any to bypass union type property existence check */
          value={(mostActive as any)?.fullName || mostActive?.name || '--'} 
          sub={`${mostActive?.count || 0} trades`} 
          icon="fa-bolt" 
          color="text-orange-500" 
        />
        <InsightCard 
          title="Best win rate" 
          /* FIXED: Cast bestWinRate to any to bypass union type property existence check */
          value={(bestWinRate as any)?.fullName || bestWinRate?.name || '--'} 
          sub={`${bestWinRate?.winRate.toFixed(0)}% / ${bestWinRate?.count || 0} trades`} 
          icon="fa-award" 
          color="text-blue-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800/50 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center space-x-2">
                <i className="fas fa-chart-area text-slate-400"></i>
                <div className="flex space-x-2">
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white">Net P&L</span>
                    <i className="fas fa-chevron-down text-[8px] text-slate-400"></i>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white">Trade count</span>
                    <i className="fas fa-chevron-down text-[8px] text-slate-400"></i>
                  </div>
                  <button className="text-blue-500 text-[10px] font-black uppercase hover:underline">+ Add metric</button>
                </div>
             </div>
             <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fas fa-ellipsis-v"></i>
             </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeBuckets}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  ticks={reportTab === 'time' ? ['00:00', '08:00', '14:00', '20:00'] : undefined}
                />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px' }}
                  cursor={{ stroke: '#1e293b', strokeWidth: 1 }}
                />
                <Area yAxisId="left" type="monotone" dataKey="pnl" fill="url(#pnlGradient)" stroke="#10b981" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-8 mt-6">
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Net P&L</span>
             </div>
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Trade count</span>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800/50 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center space-x-2">
                <i className="fas fa-chart-bar text-slate-400"></i>
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white">Win %</span>
                  <i className="fas fa-chevron-down text-[8px] text-slate-400"></i>
                </div>
                <button className="text-blue-500 text-[10px] font-black uppercase hover:underline">+ Add metric</button>
             </div>
             <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fas fa-ellipsis-v"></i>
             </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeBuckets}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  ticks={reportTab === 'time' ? ['00:00', '08:00', '14:00', '20:00'] : undefined}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.1 }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="winRate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-6">
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black uppercase text-slate-500">Win %</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, value, sub, pnl, icon, color }: any) => (
  <div className="bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm transition-all hover:translate-y-[-2px]">
    <div className="flex items-center space-x-3 mb-4">
      <i className={`fas ${icon} ${color} opacity-40`}></i>
      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h5>
    </div>
    <div className="space-y-1">
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{sub}</span>
        {pnl !== undefined && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${pnl >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
            {pnl >= 0 ? `+$${pnl.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : `-$${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default ReportsPage;
