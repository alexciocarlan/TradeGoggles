
import React, { useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Trade, Account } from '../types';
import { Language } from '../translations';
import { useAppContext } from '../AppContext';

const ChallengeDashboard: React.FC = () => {
  const { activeTrades, accounts, selectedAccountId, language } = useAppContext();

  // Permitem detectarea atât a conturilor Apex cât și a celor de Backtest
  const activeAccount = useMemo(() => {
    if (selectedAccountId !== 'all') {
        const found = accounts.find(a => a.id === selectedAccountId && (a.type === 'Apex' || a.type === 'Backtest'));
        if (found) return found;
    }
    return accounts.find(a => a.type === 'Apex') || accounts.find(a => a.type === 'Backtest');
  }, [accounts, selectedAccountId]);

  // Folosim activeTrades care vine gata filtrat din AppContext (Live sau Backtest)
  const challengeTrades = useMemo(() => {
    if (!activeAccount) return [];
    return [...activeTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeTrades, activeAccount]);

  const stats = useMemo(() => {
    if (!activeAccount) return null;

    const initialBalance = activeAccount.initialBalance;
    const maxDD = activeAccount.maxDrawdown;
    const targetProfitAmount = activeAccount.targetProfit ? (activeAccount.targetProfit - initialBalance) : 3000;
    const stopThresholdOffset = activeAccount.trailingStopThreshold ?? 100;
    
    let currentEquity = initialBalance;
    let peakEquity = initialBalance; 
    
    const dailyStats: Record<string, number> = {};
    
    challengeTrades.forEach(t => {
      currentEquity += t.pnlNet;
      if (currentEquity > peakEquity) peakEquity = currentEquity;
      dailyStats[t.date] = (dailyStats[t.date] || 0) + t.pnlNet;
    });

    // LOGICA DRAWDOWN APEX 2.0
    let liquidationPoint = 0;
    
    if (activeAccount.drawdownType === 'Static') {
        liquidationPoint = initialBalance - maxDD;
    } else {
        // Trailing High Water Mark
        liquidationPoint = peakEquity - maxDD;
        
        // Dacă este PA (Performance Account), trailing-ul se oprește la un prag stabilit
        if (activeAccount.isPA) {
            const stopThreshold = initialBalance + stopThresholdOffset;
            if (liquidationPoint > stopThreshold) {
                liquidationPoint = stopThreshold;
            }
        }
    }

    const currentPnl = currentEquity - initialBalance;
    const availableRisk = currentEquity - liquidationPoint;
    const profitProgress = Math.min(Math.max((currentPnl / targetProfitAmount) * 100, 0), 100);

    const bestDayProfit = Math.max(...Object.values(dailyStats).map(v => v > 0 ? v : 0), 0);
    const totalProfitAcumulat = Math.max(currentPnl, 0);
    const consistencyThreshold = totalProfitAcumulat * 0.30;
    const isConsistent = totalProfitAcumulat > 0 ? bestDayProfit <= consistencyThreshold : true;

    const totalProfitRequired = bestDayProfit / 0.30;
    const remainingProfitToRepair = Math.max(totalProfitRequired - totalProfitAcumulat, 0);

    const tradingDaysCount = Object.keys(dailyStats).length;
    const bufferZoneLimit = initialBalance + maxDD + stopThresholdOffset;
    const overBufferZone = currentEquity >= bufferZoneLimit;
    
    const now = new Date();
    const dayOfMonth = now.getDate();
    const isPayoutWindow = (dayOfMonth >= 1 && dayOfMonth <= 5) || (dayOfMonth >= 15 && dayOfMonth <= 20);

    return {
      currentEquity,
      peakEquity,
      liquidationPoint,
      currentPnl,
      availableRisk,
      profitProgress,
      bestDayProfit,
      consistencyThreshold,
      isConsistent,
      totalProfitRequired,
      remainingProfitToRepair,
      tradingDaysCount,
      overBufferZone,
      bufferZoneLimit,
      isPayoutWindow,
      isPA: activeAccount.isPA,
      drawdownType: activeAccount.drawdownType,
      isBacktest: activeAccount.type === 'Backtest'
    };
  }, [challengeTrades, activeAccount]);

  const chartData = useMemo(() => {
    if (!activeAccount || !stats) return [];
    
    let runningEquity = activeAccount.initialBalance;
    let runningPeak = activeAccount.initialBalance;
    const maxDD = activeAccount.maxDrawdown;
    const stopThresholdOffset = activeAccount.trailingStopThreshold ?? 100;
    const stopThreshold = activeAccount.initialBalance + stopThresholdOffset;

    const data = [{
      name: 'Start',
      equity: runningEquity,
      drawdown: runningEquity - maxDD,
    }];

    const dailyPnl: Record<string, number> = {};
    challengeTrades.forEach(t => {
      dailyPnl[t.date] = (dailyPnl[t.date] || 0) + t.pnlNet;
    });

    const sortedDates = Object.keys(dailyPnl).sort();
    sortedDates.forEach((date, idx) => {
      runningEquity += dailyPnl[date];
      if (runningEquity > runningPeak) runningPeak = runningEquity;
      
      let currentLiq = 0;
      if (activeAccount.drawdownType === 'Static') {
          currentLiq = activeAccount.initialBalance - maxDD;
      } else {
          currentLiq = runningPeak - maxDD;
          if (activeAccount.isPA && currentLiq > stopThreshold) {
              currentLiq = stopThreshold;
          }
      }

      data.push({
        name: `Ziua ${idx + 1}`,
        equity: parseFloat(runningEquity.toFixed(2)),
        drawdown: parseFloat(currentLiq.toFixed(2)),
      });
    });

    return data;
  }, [challengeTrades, activeAccount, stats]);

  if (!activeAccount || !stats) {
    return (
      <div className="py-40 text-center bg-[#0b1222] border border-slate-800 rounded-[3rem]">
         <i className="fas fa-medal text-5xl text-slate-800 mb-6"></i>
         <p className="text-slate-500 font-black uppercase tracking-[0.3em]">Niciun cont compatibil detectat</p>
         <p className="text-[10px] text-slate-700 font-bold mt-2">Selectează un cont de tip "Apex" sau "Backtest" din sidebar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      <div className={`bg-gradient-to-br ${stats.isBacktest ? 'from-indigo-600 to-purple-900' : 'from-indigo-700 to-blue-900'} rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden`}>
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10 gap-8">
            <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em]">
                    {stats.isBacktest ? 'BACKTESTING LAB PERFORMANCE // V1.0' : 'APEX TRACKER PRO V3.1 // PROTOCOL 2.0'}
                </p>
                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{activeAccount.name}</h2>
                <div className="flex items-center space-x-8 pt-4">
                    <div>
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">ACCOUNT EQUITY</p>
                        <p className="text-3xl font-black text-white">${stats.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div>
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">AVAILABLE RISK (TO LIQ.)</p>
                        <p className="text-3xl font-black text-white">${stats.availableRisk.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                    </div>
                </div>
            </div>
            
            <div className="w-full lg:w-96 space-y-3">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{stats.isPA ? 'BUFFER PROGRESS' : 'PROFIT PROGRESS'}</span>
                    <span className="text-xs font-black text-white opacity-60">{stats.profitProgress.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-black/30 rounded-full overflow-hidden p-1 shadow-inner border border-white/5">
                    <div 
                        className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-1000 ease-out"
                        style={{ width: `${stats.profitProgress}%` }}
                    />
                </div>
            </div>
         </div>
         <i className={`fas ${stats.isBacktest ? 'fa-vial' : 'fa-medal'} absolute -bottom-10 -right-10 text-[200px] text-white/5 rotate-12`}></i>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="PEAK EQUITY (HWM)" value={`$${stats.peakEquity.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon="fa-arrow-trend-up" color="text-emerald-400" />
        <MetricCard label="LIQUIDATION POINT" value={`$${stats.liquidationPoint.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon="fa-skull" color="text-red-500" />
        <MetricCard label="CURRENT P&L" value={`$${stats.currentPnl.toLocaleString(undefined, { minimumFractionDigits: 1 })}`} icon="fa-coins" color="text-blue-400" />
        <MetricCard label="DRAWDOWN LOGIC" value={stats.drawdownType === 'Trailing' ? (stats.liquidationPoint >= (activeAccount.initialBalance + (activeAccount.trailingStopThreshold ?? 100)) ? 'LOCKED' : 'TRAILING') : 'STATIC'} icon="fa-lock" color="text-orange-500" />
      </div>

      <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">ANALIZĂ EVOLUȚIE DRAWDOWN (HWM METHOD)</h4>
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="equity" fill="rgba(59,130,246,0.05)" stroke="none" />
                <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                <Line type="stepAfter" dataKey="drawdown" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                {stats.isPA && stats.drawdownType === 'Trailing' && (
                    <ReferenceLine y={activeAccount.initialBalance + (activeAccount.trailingStopThreshold ?? 100)} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'right', value: 'LOCKED ZONE', fill: '#fbbf24', fontSize: 9, fontWeight: 'bold' }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl">
            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-8 flex items-center">
                <i className="fas fa-biohazard mr-3"></i> REGULA DE CONSISTENȚĂ (30%)
            </h4>
            <div className="space-y-10">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">CEA MAI BUNĂ ZI (PROFIT)</p>
                        <p className="text-4xl font-black text-white">${stats.bestDayProfit.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">LIMITA CALCULATĂ (30% DIN TOTAL)</p>
                        <p className="text-2xl font-black text-slate-400">${stats.consistencyThreshold.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${!stats.isConsistent ? 'bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'bg-blue-600'}`} 
                            style={{ width: `${Math.min((stats.bestDayProfit / (stats.consistencyThreshold || 1)) * 100, 100)}%` }}
                        />
                    </div>
                    
                    {!stats.isConsistent ? (
                        <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl space-y-4">
                            <div className="flex items-start space-x-3 text-orange-500">
                                <i className="fas fa-triangle-exclamation mt-1"></i>
                                <p className="text-xs font-black uppercase tracking-tight leading-relaxed">
                                    AI DEPĂȘIT LIMITA DE 30%. Profitul total actual este prea mic raportat la ziua ta cea mai bună.
                                </p>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">RECOMANDARE MENTOR:</p>
                                <p className="text-sm font-black text-white">
                                    Mai ai nevoie de <span className="text-orange-400">${stats.remainingProfitToRepair.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span> profit net total pentru a valida consistența.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center space-x-3 text-emerald-500">
                            <i className="fas fa-check-circle"></i>
                            <p className="text-[10px] font-black uppercase tracking-widest">Contul respectă criteriul de consistență.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-[#0b1222] border border-slate-800/60 p-10 rounded-[2.5rem] shadow-xl">
           <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center">
                <i className="fas fa-money-bill-transfer mr-3"></i> ELIGIBILITATE PAYOUT (PHASE: {stats.isPA ? 'PA' : 'EVAL'})
           </h4>
           
           <div className="grid grid-cols-2 gap-4">
              <PayoutStatusBox label="ZILE MINIME (10)" value={`${stats.tradingDaysCount}/10`} isValid={stats.tradingDaysCount >= 10} />
              <PayoutStatusBox 
                label="BUFFER ZONE (SAFETY)" 
                value={stats.overBufferZone ? 'VALID' : `MIN: $${stats.bufferZoneLimit.toLocaleString()}`} 
                isValid={stats.overBufferZone} 
              />
              <PayoutStatusBox label="FEREASTRĂ PAYOUT" value={stats.isPayoutWindow ? 'DESCHISĂ' : 'ÎNCHISĂ'} isValid={stats.isPayoutWindow} />
              <PayoutStatusBox label="CONSISTENȚĂ 30%" value={stats.isConsistent ? 'VALID' : 'INVALID'} isValid={stats.isConsistent} />
           </div>

           <div className="mt-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Note Payout Apex 2.0:</p>
              <ul className="text-[9px] text-slate-400 space-y-1 font-bold list-disc pl-4 uppercase tracking-tighter">
                <li>Minim 10 zile între cererile de plată.</li>
                <li>Bufferul de drawdown trebuie să rămână intact în cont.</li>
                <li>Retragerile sunt permise doar în ferestrele 1-5 și 15-20.</li>
              </ul>
           </div>

           <button 
             disabled={!(stats.tradingDaysCount >= 10 && stats.overBufferZone && stats.isConsistent && stats.isPayoutWindow)}
             className={`w-full mt-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all ${
               (stats.tradingDaysCount >= 10 && stats.overBufferZone && stats.isConsistent && stats.isPayoutWindow)
               ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30'
               : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
             }`}
           >
              SOLICITĂ PAYOUT
           </button>
        </div>

      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color }: any) => (
    <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.25rem] relative overflow-hidden group hover:translate-y-[-4px] transition-all shadow-sm">
        <div className="flex justify-between items-start mb-6 relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <i className={`fas ${icon} ${color} opacity-30 group-hover:opacity-100 transition-opacity`}></i>
        </div>
        <p className={`text-2xl font-black relative z-10 ${color}`}>{value}</p>
        <div className={`absolute -bottom-4 -right-4 text-7xl opacity-[0.02] ${color}`}><i className={`fas ${icon}`}></i></div>
    </div>
);

const PayoutStatusBox = ({ label, value, isValid }: { label: string, value: string, isValid: boolean }) => (
    <div className="bg-slate-950/50 border border-slate-800/60 p-5 rounded-2xl flex justify-between items-center group hover:bg-slate-900/50 transition-all">
        <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-white truncate max-w-[120px]">{value}</p>
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${isValid ? 'bg-green-600/10 border-green-500/30 text-green-500' : 'bg-red-600/10 border-red-500/30 text-slate-600'}`}>
            <i className={`fas ${isValid ? 'fa-check' : 'fa-times'} text-[10px]`}></i>
        </div>
    </div>
);

export default ChallengeDashboard;
