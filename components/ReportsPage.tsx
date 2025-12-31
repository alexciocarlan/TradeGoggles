
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Line, ComposedChart } from 'recharts';
import { Trade, SessionType } from '../types';
import { Language } from '../translations';
import ScannerLogicReport from './ScannerLogicReport';

interface ReportsPageProps {
  trades: Trade[];
  language: Language;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ trades, language }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'scanner-logic'>('overview');
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
          {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('scanner-logic')}
          className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'scanner-logic' ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Scanner Intel
          <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] px-1.5 py-0.5 rounded uppercase">Logic</span>
          {activeTab === 'scanner-logic' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'overview' && <OverviewSection trades={trades} />}
      {activeTab === 'reports' && <AnalyticsSection trades={trades} reportTab={reportTab} setReportTab={setReportTab} />}
      {activeTab === 'scanner-logic' && <ScannerLogicReport />}
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
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlNet, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlNet, 0) / losses.length : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? (wins.reduce((s, t) => s + t.pnlNet, 0) / Math.abs(losses.reduce((s, t) => s + t.pnlNet, 0))) : 0;

    return [
      { label: 'Total P&L', value: `$${totalPnl.toLocaleString()}` },
      { label: 'Total trading days', value: uniqueDates },
      { label: 'Average daily volume', value: (trades.reduce((s, t) => s + t.contracts, 0) / (uniqueDates || 1)).toFixed(2) },
      { label: 'Average winning trade', value: `$${avgWin.toLocaleString()}` },
      { label: 'Average losing trade', value: `-$${Math.abs(avgLoss).toLocaleString()}` },
      { label: 'Total number of trades', value: trades.length },
      { label: 'Number of winning trades', value: wins.length },
      { label: 'Number of losing trades', value: losses.length },
      { label: 'Number of break even trades', value: be.length },
      { label: 'Average daily P&L', value: `$${(totalPnl / (uniqueDates || 1)).toFixed(1)}` },
      { label: 'Max consecutive wins', value: maxWins },
      { label: 'Max consecutive losses', value: maxLosses },
      { label: 'Total commissions', value: `$${comms.toLocaleString()}` },
      { label: 'Average realized R-Multiple', value: `${(trades.reduce((s, t) => s + t.rrRealized, 0) / (trades.length || 1)).toFixed(2)}R` },
      { label: 'Largest profit', value: `$${Math.max(...trades.map(t => t.pnlNet), 0).toLocaleString()}` },
      { label: 'Largest loss', value: `-$${Math.abs(Math.min(...trades.map(t => t.pnlNet), 0)).toLocaleString()}` },
      { label: 'Trade expectancy', value: `$${(totalPnl / (trades.length || 1)).toFixed(2)}` },
      { label: 'Profit factor', value: profitFactor.toFixed(2) },
    ];
  }, [trades]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800/50 p-8 rounded-3xl">
      {stats.map((stat, i) => (
        <div key={i} className={`flex justify-between py-3 border-b border-slate-100 dark:border-slate-800/40 text-xs font-medium`}>
          <span className="text-slate-500 dark:text-slate-400">{stat.label}</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsSection = ({ trades, reportTab, setReportTab }: { trades: Trade[], reportTab: string, setReportTab: (s: any) => void }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    return buckets.map(b => ({ ...b, winRate: b.count > 0 ? (b.wins / b.count) * 100 : 0 }));
  }, [trades]);

  const activeBuckets = reportTab === 'days' ? daysBuckets : []; // simplificat pt demo

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
                (reportTab === 'days' && tab === 'Days') ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800/50 p-8 rounded-3xl shadow-sm">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeBuckets}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.1 }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
              <Bar dataKey="pnl" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
