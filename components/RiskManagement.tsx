
import React, { useState, useMemo } from 'react';
import { Account, AccountRiskSettings, Trade } from '../types';
import { Language } from '../translations';

interface RiskManagementProps {
  accounts: Account[];
  trades: Trade[];
  onUpdateAccount: (account: Account) => void;
  selectedAccountId: string;
  language: Language;
}

const INSTRUMENTS = [
    { label: 'MNQ ($2/pt)', val: 'MNQ', mult: 2 },
    { id: 'NQ', label: 'NQ ($20/pt)', val: 'NQ', mult: 20 },
    { id: 'MES', label: 'MES ($5/pt)', val: 'MES', mult: 5 },
    { id: 'ES', label: 'ES ($50/pt)', val: 'ES', mult: 50 },
    { id: 'GC', label: 'GC ($100/pt)', val: 'GC', mult: 100 },
];

const RR_RATIOS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];

const RiskManagement: React.FC<RiskManagementProps> = ({ accounts, trades, onUpdateAccount, selectedAccountId, language }) => {
  const activeAccounts = selectedAccountId === 'all' ? accounts : accounts.filter(a => a.id === selectedAccountId);
  const today = new Date().toISOString().split('T')[0];

  const handleUpdateRisk = (account: Account, field: keyof AccountRiskSettings, value: any) => {
    const updatedRisk = {
      ...(account.riskSettings || { 
        maxTotalRisk: account.maxDrawdown, 
        maxDailyRisk: 500, 
        maxTradesPerDay: 5, 
        maxContractsPerTrade: 1, 
        dailyProfitTarget: 1000, 
        preferredInstrument: 'MNQ', 
        rrRatio: 2, 
        manualAtr: 25,
        calcMode: 'fixedContracts',
        targetMode: 'fixedRR',
        fixedSlPoints: 40,
        fixedTargetPoints: 80,
        commPerContract: 2.40,
        targetProfitGoal: 3000
      }),
      [field]: value
    };
    onUpdateAccount({ ...account, riskSettings: updatedRisk });
  };

  const inputClass = "bg-[#0b1222] border border-[#1e293b] rounded-lg px-4 py-2.5 text-xs font-black text-white focus:ring-1 focus:ring-blue-500 outline-none w-full transition-all shadow-inner hover:border-slate-700";
  const labelClass = "text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-widest";

  if (accounts.length === 0) {
    return (
      <div className="py-20 text-center bg-[#0b1222] border border-slate-800 rounded-[2.5rem]">
        <i className="fas fa-shield-alt text-4xl text-slate-800 mb-4"></i>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nu există conturi active</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 gap-6">
        {activeAccounts.map(account => {
          const risk = account.riskSettings || { 
            maxTotalRisk: account.maxDrawdown, 
            maxDailyRisk: 500, 
            maxTradesPerDay: 3, 
            maxContractsPerTrade: 2, 
            dailyProfitTarget: 1000, 
            preferredInstrument: 'MNQ',
            rrRatio: 2,
            manualAtr: 25,
            calcMode: 'fixedContracts',
            targetMode: 'fixedRR',
            fixedSlPoints: 40,
            fixedTargetPoints: 80,
            commPerContract: 2.40,
            targetProfitGoal: 3000
          };
          
          const accountTrades = trades.filter(t => t.accountId === account.id || t.accountId === account.name);
          const todayTrades = accountTrades.filter(t => t.date === today);
          const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnlNet, 0);

          const maxDD = account.maxDrawdown;
          const targetGoal = risk.targetProfitGoal || 3000;
          
          let runningEquity = account.initialBalance;
          let peakEquity = account.initialBalance;
          accountTrades.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(t => {
            runningEquity += t.pnlNet;
            if (runningEquity > peakEquity) peakEquity = runningEquity;
          });
          const currentEquity = runningEquity;
          const availableRiskBuffer = currentEquity - (peakEquity - maxDD);
          const consistencyThreshold = targetGoal * 0.30;
          
          const multiplier = INSTRUMENTS.find(i => i.val === risk.preferredInstrument)?.mult || 2;
          const tradesN = risk.maxTradesPerDay || 1;
          const atr = risk.manualAtr || 25;
          const comm = risk.commPerContract || 2.40;

          const riskPerTrade = risk.maxDailyRisk / tradesN;
          
          let contracts = risk.maxContractsPerTrade || 1;
          let slPoints = 0;

          if (risk.calcMode === 'fixedSL') {
              slPoints = risk.fixedSlPoints || 40;
              contracts = Math.floor(riskPerTrade / (slPoints * multiplier)) || 1;
          } else {
              contracts = risk.maxContractsPerTrade || 1;
              slPoints = riskPerTrade / (contracts * multiplier);
          }

          let finalRr = risk.rrRatio || 2;
          let targetPoints = 0;

          if (risk.targetMode === 'fixedTargetPoints') {
              targetPoints = risk.fixedTargetPoints || 80;
              finalRr = parseFloat((targetPoints / slPoints).toFixed(2));
          } else {
              finalRr = risk.rrRatio || 2;
              targetPoints = slPoints * finalRr;
          }
          
          const feesPerTrade = contracts * comm;
          const expectedProfitPerTrade = (riskPerTrade * finalRr) - feesPerTrade;
          const expectedProfitPerDay = expectedProfitPerTrade * tradesN;

          const riskUsedPercent = Math.min(Math.max((Math.abs(Math.min(todayPnl, 0)) / risk.maxDailyRisk) * 100, 0), 100);

          let statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
          let statusText = "SAFE TO OPERATE";
          let isBlocked = false;
          let lockdown = false;
          let consistencyBreach = expectedProfitPerDay > consistencyThreshold;

          if (slPoints < atr) {
              if (slPoints < (atr * 0.8)) {
                  statusColor = "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-500";
                  statusText = "SL TOO TIGHT";
                  isBlocked = true;
              } else {
                  statusColor = "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 border-yellow-500";
                  statusText = "VOLATILITY RISK";
              }
          }
          if (consistencyBreach) {
              statusColor = "bg-orange-500 text-white shadow-lg shadow-orange-500/20 border-orange-500";
              statusText = "CONSISTENCY RISK";
          }
          if (todayPnl <= -risk.maxDailyRisk || availableRiskBuffer < 200) {
              statusColor = "bg-slate-900 border-slate-700 text-red-500";
              statusText = "LOCKDOWN";
              isBlocked = true;
              lockdown = true;
          }

          return (
            <div key={account.id} className="bg-[#0b1222] border border-slate-800/80 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
              
              {/* COMPACT TOP BAR */}
              <div className="px-8 py-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                 <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                       <i className="fas fa-shield-halved text-sm"></i>
                    </div>
                    <div>
                       <h3 className="text-white font-black text-sm uppercase italic tracking-widest leading-none">{account.name}</h3>
                    </div>
                 </div>
                 <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${statusColor}`}>
                    {statusText}
                 </div>
              </div>

              <div className="p-6 lg:p-8 space-y-6">
                 
                 {/* GROUPED INPUTS (GRID 1) */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 grid grid-cols-3 gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 shadow-inner">
                        <div><label className={labelClass}>Max Risk ($)</label><input type="number" className={inputClass} value={risk.maxDailyRisk} onChange={e => handleUpdateRisk(account, 'maxDailyRisk', parseFloat(e.target.value))} /></div>
                        <div><label className={labelClass}>Trades (N)</label><input type="number" className={inputClass} value={risk.maxTradesPerDay} onChange={e => handleUpdateRisk(account, 'maxTradesPerDay', parseInt(e.target.value))} /></div>
                        <div><label className={labelClass}>Current ATR</label><input type="number" className={inputClass} value={risk.manualAtr} onChange={e => handleUpdateRisk(account, 'manualAtr', parseFloat(e.target.value))} /></div>
                    </div>
                    <div className="bg-indigo-600/5 border border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-center text-center">
                        <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-1">Apex Buffer</p>
                        <p className="text-xl font-black text-white tracking-tighter">${availableRiskBuffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                 </div>

                 {/* LOGIC TOGGLES (GRID 2) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-5">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase">1. Sizing Mode</span>
                          <div className="flex bg-black p-0.5 rounded-lg border border-slate-800">
                             <button onClick={() => handleUpdateRisk(account, 'calcMode', 'fixedContracts')} className={`px-3 py-1 text-[8px] font-black rounded transition-all ${risk.calcMode === 'fixedContracts' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Lots</button>
                             <button onClick={() => handleUpdateRisk(account, 'calcMode', 'fixedSL')} className={`px-3 py-1 text-[8px] font-black rounded transition-all ${risk.calcMode === 'fixedSL' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>SL</button>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <select className={inputClass} value={risk.preferredInstrument} onChange={e => handleUpdateRisk(account, 'preferredInstrument', e.target.value)}>{INSTRUMENTS.map(i => <option key={i.val} value={i.val}>{i.label}</option>)}</select>
                          {risk.calcMode === 'fixedContracts' ? (<input type="number" className={inputClass} value={risk.maxContractsPerTrade} onChange={e => handleUpdateRisk(account, 'maxContractsPerTrade', parseInt(e.target.value))} />) : (<input type="number" className={inputClass} value={risk.fixedSlPoints} onChange={e => handleUpdateRisk(account, 'fixedSlPoints', parseFloat(e.target.value))} />)}
                       </div>
                    </div>

                    <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-5">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase">2. Target Mode</span>
                          <div className="flex bg-black p-0.5 rounded-lg border border-slate-800">
                             <button onClick={() => handleUpdateRisk(account, 'targetMode', 'fixedRR')} className={`px-3 py-1 text-[8px] font-black rounded transition-all ${risk.targetMode === 'fixedRR' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>R:R</button>
                             <button onClick={() => handleUpdateRisk(account, 'targetMode', 'fixedTargetPoints')} className={`px-3 py-1 text-[8px] font-black rounded transition-all ${risk.targetMode === 'fixedTargetPoints' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Pts</button>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          {risk.targetMode === 'fixedRR' ? (<select className={inputClass} value={risk.rrRatio} onChange={e => handleUpdateRisk(account, 'rrRatio', parseFloat(e.target.value))}>{RR_RATIOS.map(r => <option key={r} value={r}>1:{r}</option>)}</select>) : (<input type="number" className={inputClass} value={risk.fixedTargetPoints} onChange={e => handleUpdateRisk(account, 'fixedTargetPoints', parseFloat(e.target.value))} />)}
                          <input type="number" step="0.01" className={inputClass} value={risk.commPerContract} onChange={e => handleUpdateRisk(account, 'commPerContract', parseFloat(e.target.value))} />
                       </div>
                    </div>
                 </div>

                 {/* COMPACT RESULTS TAPE */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-[#0b1222] p-4 text-center">
                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Risk / Trade</p>
                        <p className="text-xl font-black text-red-500 italic">-${riskPerTrade.toFixed(0)}</p>
                    </div>
                    <div className="bg-[#0b1222] p-4 text-center">
                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Efficiency</p>
                        <p className="text-xl font-black text-white italic">1:{finalRr}</p>
                    </div>
                    <div className="bg-[#0b1222] p-4 text-center">
                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Target Net</p>
                        <p className="text-xl font-black text-blue-500 italic">${expectedProfitPerTrade.toFixed(0)}</p>
                    </div>
                    <div className="bg-[#0b1222] p-4 text-center">
                        <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Daily Potential</p>
                        <p className={`text-xl font-black italic ${consistencyBreach ? 'text-orange-500' : 'text-emerald-500'}`}>${expectedProfitPerDay.toFixed(0)}</p>
                    </div>
                 </div>

                 {/* ACTIONABLE SPECS (GRID 3) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border transition-all duration-700 ${isBlocked ? 'bg-red-600/10 border-red-500/40' : 'bg-[#060b13] border-slate-800'}`}>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase">{risk.calcMode === 'fixedSL' ? 'Execution Size' : 'Stop Distance'}</span>
                          <span className={`text-[8px] font-black px-1.5 rounded ${slPoints >= atr ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>ATR: {atr}</span>
                       </div>
                       <p className={`text-3xl font-black italic tracking-tighter ${slPoints < atr ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                          {risk.calcMode === 'fixedSL' ? `${contracts} Lots` : `${slPoints.toFixed(1)} pts`}
                       </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#060b13] border border-slate-800">
                       <span className="text-[8px] font-black text-slate-500 uppercase mb-1 block">{risk.targetMode === 'fixedTargetPoints' ? 'Derived R:R' : 'Target Points'}</span>
                       <p className="text-3xl font-black text-indigo-400 italic tracking-tighter">
                          {risk.targetMode === 'fixedTargetPoints' ? `1:${finalRr}` : `${targetPoints.toFixed(1)} pts`}
                       </p>
                    </div>
                 </div>

                 {/* INTEGRATED PROGRESS BAR */}
                 <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-[1.5rem] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Exposure Usage</span>
                       <span className={`text-[10px] font-black ${lockdown ? 'text-red-500' : 'text-slate-300'}`}>{riskUsedPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                       <div 
                         className={`h-full transition-all duration-1000 ${lockdown ? 'bg-red-600' : riskUsedPercent > 80 ? 'bg-orange-600' : 'bg-blue-600'}`}
                         style={{ width: `${riskUsedPercent}%` }}
                       />
                    </div>
                    <div className="flex justify-between items-center mt-4">
                       <div className="flex items-baseline space-x-2">
                          <span className="text-[8px] font-black text-slate-600 uppercase">Today's P&L:</span>
                          <span className={`text-sm font-black italic ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                             {todayPnl >= 0 ? '+' : ''}${todayPnl.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                       </div>
                       <div className="flex items-center space-x-2 opacity-50">
                          <i className="fas fa-terminal text-[8px] text-slate-600"></i>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Protocol V2-Stable</span>
                       </div>
                    </div>
                 </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskManagement;
