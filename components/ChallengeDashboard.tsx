
import React, { useMemo, useEffect, useState } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { Trade, Account } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

const PayoutBox = ({ label, value, isValid }: { label: string, value: string, isValid: boolean }) => (
    <div className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-center relative overflow-hidden group ${isValid ? 'bg-emerald-600/5 border-emerald-500/20' : 'bg-red-600/5 border-red-500/20'}`}>
        <div className="flex justify-between items-start mb-2">
            <p className={`text-[9px] font-black uppercase tracking-widest ${isValid ? 'text-emerald-500' : 'text-red-500'}`}>{label}</p>
            {isValid ? (
                <i className="fas fa-check-circle text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity"></i>
            ) : (
                <i className="fas fa-exclamation-triangle text-red-500 opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></i>
            )}
        </div>
        <p className={`text-2xl font-black italic tracking-tighter ${isValid ? 'text-white' : 'text-red-400'}`}>{value}</p>
        <div className={`absolute -bottom-3 -right-3 text-6xl opacity-[0.02] group-hover:scale-110 transition-transform ${isValid ? 'text-emerald-500' : 'text-red-500'}`}>
            <i className={`fas ${isValid ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
        </div>
    </div>
);

const MetricCard = ({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) => (
    <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.25rem] relative overflow-hidden group hover:translate-y-[-4px] transition-all shadow-sm">
        <div className="flex justify-between items-start mb-6 relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <i className={`fas ${icon} ${color} opacity-30 group-hover:opacity-100 transition-opacity`}></i>
        </div>
        <p className={`text-3xl font-black ${color} italic tracking-tighter`}>{value}</p>
        <div className={`absolute -bottom-2 -right-2 text-6xl opacity-[0.01] group-hover:scale-110 transition-transform ${color}`}>
            <i className={`fas ${icon}`}></i>
        </div>
    </div>
);

export const ChallengeDashboard: React.FC = () => {
  const { trades, backtestTrades, accounts, selectedAccountId, loadDailyPreps } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    backtestTrades: state.backtestTrades || [],
    accounts: state.accounts || [],
    selectedAccountId: state.selectedAccountId,
    loadDailyPreps: state.loadDailyPreps
  })));

  const [manualWinRate, setManualWinRate] = useState(55);
  const [manualDays, setManualDays] = useState(20);

  useEffect(() => {
    loadDailyPreps();
  }, [loadDailyPreps]);

  const activeAccount = useMemo(() => {
    if (selectedAccountId === 'all') {
      return accounts.find(a => a.type === 'Apex' || a.type === 'Backtest');
    }
    return accounts.find(a => a.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  // Merge live trades and backtest trades for comprehensive analysis
  const allAvailableTrades = useMemo(() => {
      // Use a Map to deduplicate based on ID (in case of state overlap during load)
      const map = new Map<string, Trade>();
      trades.forEach(t => map.set(t.id, t));
      backtestTrades.forEach(t => map.set(t.id, t));
      return Array.from(map.values());
  }, [trades, backtestTrades]);

  const overallWinRate = useMemo(() => {
    if (!allAvailableTrades.length) return 50;
    const wins = allAvailableTrades.filter(t => t.status === 'WIN').length;
    return (wins / allAvailableTrades.length) * 100;
  }, [allAvailableTrades]);

  const challengeTrades = useMemo(() => {
    if (!activeAccount) return [];
    return allAvailableTrades
        .filter(t => t.accountId === activeAccount.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allAvailableTrades, activeAccount]);

  const riskParams = useMemo(() => {
    const r = activeAccount?.riskSettings;
    if (!r) return { tradesPerDay: 2, riskPerTrade: 125, rewardPerTrade: 250 };
    
    const riskPerTrade = Math.round(r.maxDailyRisk / (r.maxTradesPerDay || 1));
    const rr = r.rrRatio || 2;
    const rewardPerTrade = riskPerTrade * rr;

    return {
        tradesPerDay: r.maxTradesPerDay || 2,
        riskPerTrade,
        rewardPerTrade
    };
  }, [activeAccount]);

  const stats = useMemo(() => {
    if (!activeAccount) return null;

    const initialBalance = activeAccount.initialBalance;
    const maxDD = activeAccount.maxDrawdown;
    const targetProfitAmount = activeAccount.targetProfitGoal || (initialBalance + 3000);
    const stopThresholdOffset = activeAccount.trailingStopThreshold ?? 100;
    
    let currentEquity = initialBalance;
    let peakEquity = initialBalance; 
    const dailyStats: Record<string, number> = {};
    
    challengeTrades.forEach(t => {
      currentEquity += t.pnlNet;
      if (currentEquity > peakEquity) peakEquity = currentEquity;
      dailyStats[t.date] = (dailyStats[t.date] || 0) + t.pnlNet;
    });

    const currentLiqPoint = activeAccount.drawdownType === 'Static' 
        ? initialBalance - maxDD 
        : Math.min(peakEquity - maxDD, activeAccount.isPA ? initialBalance + stopThresholdOffset : Infinity);

    const currentPnl = currentEquity - initialBalance;
    const availableRisk = currentEquity - currentLiqPoint;
    const profitProgress = Math.min(Math.max((currentPnl / (activeAccount.targetProfitGoal ? (activeAccount.targetProfitGoal - initialBalance) : 3000)) * 100, 0), 100);

    // Historical Projection Days calculation
    const dailyExpectancyHist = riskParams.tradesPerDay * ((overallWinRate / 100 * riskParams.rewardPerTrade) - ((1 - overallWinRate / 100) * riskParams.riskPerTrade));
    const remainingProfit = Math.max(targetProfitAmount - currentEquity, 0);
    const daysToTarget = dailyExpectancyHist > 0 ? Math.ceil(remainingProfit / dailyExpectancyHist) : 999;

    return {
      currentEquity,
      peakEquity,
      liquidationPoint: currentLiqPoint,
      currentPnl,
      availableRisk,
      profitProgress,
      daysToTarget,
      targetProfitGoal: targetProfitAmount,
      isPA: activeAccount.isPA,
      drawdownType: activeAccount.drawdownType,
      isBacktest: activeAccount.type === 'Backtest'
    };
  }, [challengeTrades, activeAccount, overallWinRate, riskParams]);

  const chartData = useMemo(() => {
    if (!activeAccount || !stats) return [];
    
    let runningEquity = activeAccount.initialBalance;
    let runningPeak = activeAccount.initialBalance;
    const maxDD = activeAccount.maxDrawdown;
    const stopThreshold = activeAccount.initialBalance + (activeAccount.trailingStopThreshold ?? 100);

    const data: any[] = [];
    const dailyPnl: Record<string, number> = {};
    challengeTrades.forEach(t => { dailyPnl[t.date] = (dailyPnl[t.date] || 0) + t.pnlNet; });
    const sortedDates = Object.keys(dailyPnl).sort();

    // 1. Real History
    sortedDates.forEach((date, idx) => {
      runningEquity += dailyPnl[date];
      if (runningEquity > runningPeak) runningPeak = runningEquity;
      let currentLiq = activeAccount.drawdownType === 'Static' ? activeAccount.initialBalance - maxDD : runningPeak - maxDD;
      if (activeAccount.isPA && activeAccount.drawdownType === 'Trailing' && currentLiq > stopThreshold) currentLiq = stopThreshold;
      data.push({ name: `Day ${idx + 1}`, equity: runningEquity, drawdown: currentLiq });
    });

    const lastIdx = data.length;
    const startEquity = runningEquity;
    const startPeak = runningPeak;

    // 2. Manual Projection
    let mEquity = startEquity;
    let mPeak = startPeak;
    const mExpectancy = riskParams.tradesPerDay * ((manualWinRate / 100 * riskParams.rewardPerTrade) - ((1 - manualWinRate / 100) * riskParams.riskPerTrade));

    for (let i = 1; i <= manualDays; i++) {
        mEquity += mExpectancy;
        if (mEquity > mPeak) mPeak = mEquity;
        let mLiq = activeAccount.drawdownType === 'Static' ? activeAccount.initialBalance - maxDD : mPeak - maxDD;
        if (activeAccount.isPA && activeAccount.drawdownType === 'Trailing' && mLiq > stopThreshold) mLiq = stopThreshold;
        
        const existingPoint = data[lastIdx + i - 1];
        if (existingPoint) {
            existingPoint.manualProj = mEquity;
            existingPoint.manualLiq = mLiq;
        } else {
            data.push({ name: `Sim ${i}`, manualProj: mEquity, manualLiq: mLiq });
        }
    }

    // 3. Historical Projection (To Target)
    let hEquity = startEquity;
    let hPeak = startPeak;
    const hExpectancy = riskParams.tradesPerDay * ((overallWinRate / 100 * riskParams.rewardPerTrade) - ((1 - overallWinRate / 100) * riskParams.riskPerTrade));
    const target = stats.targetProfitGoal;

    for (let i = 1; i <= stats.daysToTarget && i <= 100; i++) {
        hEquity += hExpectancy;
        if (hEquity > hPeak) hPeak = hEquity;
        let hLiq = activeAccount.drawdownType === 'Static' ? activeAccount.initialBalance - maxDD : hPeak - maxDD;
        if (activeAccount.isPA && activeAccount.drawdownType === 'Trailing' && hLiq > stopThreshold) hLiq = stopThreshold;
        
        const idx = lastIdx + i - 1;
        if (data[idx]) {
            data[idx].histProj = hEquity;
            data[idx].histLiq = hLiq;
        } else {
            data.push({ name: `Pred ${i}`, histProj: hEquity, histLiq: hLiq });
        }
        if (hEquity >= target) break;
    }

    return data;
  }, [challengeTrades, activeAccount, stats, manualWinRate, manualDays, riskParams, overallWinRate]);

  if (!activeAccount || !stats) {
    return (
      <div className="py-40 text-center bg-[#0b1222] border border-slate-800 rounded-[3rem] animate-in fade-in">
         <i className="fas fa-medal text-5xl text-slate-800 mb-6"></i>
         <p className="text-slate-500 font-black uppercase tracking-[0.3em]">Niciun cont compatibil detectat</p>
         <p className="text-[10px] text-slate-700 font-bold mt-2 uppercase tracking-widest">Selectează un cont de tip "Apex" sau "Backtest" din sidebar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      
      {/* 1. HEADER SECTION INDIGO */}
      <div className={`bg-gradient-to-br ${stats.isBacktest ? 'from-indigo-600 to-purple-900' : 'from-indigo-700 to-blue-900'} rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden`}>
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10 gap-8">
            <div className="space-y-4">
                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.4em] opacity-60">
                    {stats.isBacktest ? 'BACKTESTING LAB PERFORMANCE // V1.0' : 'APEX TRACKER PRO V3.1 // PROTOCOL 2.0'}
                </p>
                <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">{activeAccount.name}</h2>
                <div className="flex items-center space-x-12 pt-4">
                    <div>
                        <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest mb-1 opacity-70">ACCOUNT EQUITY</p>
                        <p className="text-4xl font-black text-white">${stats.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest mb-1 opacity-70">AVAILABLE RISK (TO LIQ.)</p>
                        <p className="text-4xl font-black text-white">${stats.availableRisk.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                    </div>
                </div>
            </div>
            
            <div className="w-full lg:w-[450px] space-y-3">
                <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">PROFIT PROGRESS TO GOAL</span>
                    <span className="text-[10px] font-black text-white opacity-60">{stats.profitProgress.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-black/30 rounded-full overflow-hidden p-1 shadow-inner border border-white/5">
                    <div 
                        className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-1000 ease-out"
                        style={{ width: `${stats.profitProgress}%` }}
                    />
                </div>
                <p className="text-[8px] text-indigo-300 font-black uppercase text-right tracking-widest">GOAL: ${stats.targetProfitGoal.toLocaleString()}</p>
            </div>
         </div>
         <i className={`fas ${stats.isBacktest ? 'fa-vial' : 'fa-medal'} absolute -bottom-10 -right-10 text-[260px] text-white/5 rotate-12`}></i>
      </div>

      {/* 2. METRICS CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="PEAK EQUITY (HWM)" value={`$${stats.peakEquity.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon="fa-arrow-trend-up" color="text-emerald-400" />
        <MetricCard label="LIQUIDATION POINT" value={`$${stats.liquidationPoint.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon="fa-skull" color="text-red-500" />
        <MetricCard label="CURRENT P&L" value={`$${stats.currentPnl.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon="fa-coins" color="text-blue-400" />
        <MetricCard label="DAYS TO TARGET (HIST)" value={`${stats.daysToTarget} DAYS`} icon="fa-hourglass-half" color="text-orange-500" />
      </div>

      {/* 3. CHART SECTION */}
      <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-10">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ANALIZĂ EVOLUȚIE DRAWDOWN & PROIECȚII PnL</h4>
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-1 bg-blue-600"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase">Equity</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-1 border-t-2 border-dashed border-indigo-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase">Simulated ({manualWinRate}%)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-1 border-t-2 border-dashed border-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase">Historical ({overallWinRate.toFixed(0)}%)</span>
                </div>
            </div>
        </div>
        <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '11px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }} />
                
                <Area name="Real Equity" type="monotone" dataKey="equity" fill="rgba(59,130,246,0.05)" stroke="#3b82f6" strokeWidth={4} />
                <Line name="Manual Proj." type="monotone" dataKey="manualProj" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line name="Historical Proj." type="monotone" dataKey="histProj" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                
                <Line name="Real DD" type="stepAfter" dataKey="drawdown" stroke="#f43f5e" strokeWidth={2} dot={false} opacity={0.5} />
                <Line name="Sim DD" type="stepAfter" dataKey="manualLiq" stroke="#818cf8" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.3} />
                <Line name="Hist DD" type="stepAfter" dataKey="histLiq" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.3} />
                
                <ReferenceLine y={stats.targetProfitGoal} stroke="#fbbf24" strokeDasharray="10 5" label={{ position: 'right', value: 'PROFIT GOAL', fill: '#fbbf24', fontSize: 9, fontWeight: 'bold' }} />
              </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. PROJECTION CONTROLS */}
      <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl">
         <div className="flex items-center space-x-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
               <i className="fas fa-microchip"></i>
            </div>
            <div>
               <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">PnL PROJECTION ENGINE</h4>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Base parameters from "Set Your Risk"</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual Win Rate</label>
                    <span className="text-xl font-black text-indigo-400">{manualWinRate}%</span>
                </div>
                <input 
                    type="range" min="10" max="90" value={manualWinRate} 
                    onChange={e => setManualWinRate(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projection Days</label>
                    <span className="text-xl font-black text-indigo-400">{manualDays} Days</span>
                </div>
                <input 
                    type="range" min="5" max="60" value={manualDays} 
                    onChange={e => setManualDays(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
            </div>

            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Active Protocol Logic</p>
               <div className="flex justify-between text-[11px] font-black">
                  <span className="text-slate-600">Daily Risk:</span>
                  <span className="text-red-500">-${riskParams.riskPerTrade * riskParams.tradesPerDay}</span>
               </div>
               <div className="flex justify-between text-[11px] font-black">
                  <span className="text-slate-600">Reward / Win:</span>
                  <span className="text-emerald-500">+${riskParams.rewardPerTrade}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 5. CONSISTENCY & PAYOUT PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl">
            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-8 flex items-center">
                <i className="fas fa-biohazard mr-3"></i> REGULA DE CONSISTENȚĂ (30%)
            </h4>
            <div className="space-y-12">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">PROIECTIE PROFIT REQUIRED (HISTORICAL)</p>
                        <p className="text-6xl font-black text-white italic tracking-tighter leading-none">${(stats.peakEquity - activeAccount.initialBalance).toLocaleString()}</p>
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div className="h-4 bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-800 shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${stats.profitProgress < 100 ? 'bg-blue-600' : 'bg-emerald-600'}`} 
                            style={{ width: `${stats.profitProgress}%` }}
                        />
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex items-center space-x-4 text-emerald-500">
                        <i className="fas fa-calendar-check"></i>
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Bazat pe statistica ta de {overallWinRate.toFixed(0)}%, vei atinge tinta în aproximativ {stats.daysToTarget} zile de tranzacționare.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl flex flex-col">
           <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center">
                <i className="fas fa-money-bill-transfer mr-3"></i> ELIGIBILITATE PAYOUT (PHASE: {stats.isPA ? 'PA' : 'EVAL'})
           </h4>
           
           <div className="grid grid-cols-2 gap-4 flex-1">
              <PayoutBox label="DAYS ESTIMATE" value={`${stats.daysToTarget} DAYS`} isValid={true} />
              <PayoutBox label="BUFFER PROJECTION" value={`VALID`} isValid={true} />
              <PayoutBox label="HISTORICAL WR" value={`${overallWinRate.toFixed(0)}%`} isValid={overallWinRate > 40} />
              <PayoutBox label="EXPECTANCY" value={`+$${(riskParams.tradesPerDay * ((overallWinRate / 100 * riskParams.rewardPerTrade) - ((1 - overallWinRate / 100) * riskParams.riskPerTrade))).toFixed(0)}/Day`} isValid={true} />
           </div>

           <button 
             className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30 active:scale-95`}
           >
              SIMULEAZĂ STRATEGIE NOUĂ
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDashboard;
