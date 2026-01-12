import React, { useMemo, useEffect } from 'react';
import { Account, Trade } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

const INSTRUMENTS = [
  { label: 'MNQ ($2/pt)', val: 'MNQ', mult: 2, tick: 0.25 },
  { label: 'NQ ($20/pt)', val: 'NQ', mult: 20, tick: 0.25 },
  { label: 'MES ($5/pt)', val: 'MES', mult: 5, tick: 0.25 },
  { label: 'ES ($50/pt)', val: 'ES', mult: 50, tick: 0.25 },
  { label: 'GC ($100/pt)', val: 'GC', mult: 100, tick: 0.10 },
  { label: 'BTCUSDT ($1/pt)', val: 'BTCUSDT', mult: 1, tick: 0.01 },
];

const RR_OPTIONS = [
  { label: '1:1', val: 1 },
  { label: '1:1.5', val: 1.5 },
  { label: '1:2', val: 2 },
  { label: '1:2.5', val: 2.5 },
  { label: '1:3', val: 3 },
  { label: '1:4', val: 4 },
  { label: '1:5', val: 5 },
];

const inputClass = "bg-[#0d121f] border border-[#1e293b] rounded-xl px-5 py-4 text-sm font-black text-white focus:ring-1 focus:ring-blue-500 outline-none w-full transition-all hover:border-slate-600";
const labelClass = "text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-[0.2em]";

interface RiskAccountCardProps {
  account: Account;
  trades: Trade[];
  updateAccount: (a: Account) => void;
}

// Extracted Component to handle individual account logic and effects safely
const RiskAccountCard: React.FC<RiskAccountCardProps> = ({ account, trades, updateAccount }) => {
    const risk = account.riskSettings || { 
        maxDailyRisk: 500, maxTradesPerDay: 5, preferredInstrument: 'MNQ', 
        calcMode: 'fixedContracts', targetMode: 'fixedRR', rrRatio: 2, 
        fixedSlPoints: 25, fixedTargetPoints: 50, manualAtr: 24, commPerContract: 2.40,
        maxContractsPerTrade: 1
    } as any;

    const accountTrades = useMemo(() => (trades || []).filter(t => t.accountId === account.id || t.accountId === account.name), [trades, account.id, account.name]);
    
    // Calculate Real-Time Equity & Drawdown Buffer
    const { currentBalance, availableRiskBuffer } = useMemo(() => {
        let runningBalance = account.initialBalance;
        let peakEquity = account.initialBalance;
        
        // Sort trades to calculate HWM correctly
        const sorted = [...accountTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sorted.forEach(t => {
            runningBalance += t.pnlNet;
            if (runningBalance > peakEquity) peakEquity = runningBalance;
        });

        let liquidationThreshold = 0;
        if (account.drawdownType === 'Static') {
            liquidationThreshold = account.initialBalance - account.maxDrawdown;
        } else {
            // Trailing Drawdown Logic (Apex Style)
            liquidationThreshold = peakEquity - account.maxDrawdown;
            // Optional: Cap trailing at Initial Balance + Threshold (if applicable to specific rules, ignoring for general logic here)
        }

        const buffer = Math.max(runningBalance - liquidationThreshold, 0);
        return { currentBalance: runningBalance, availableRiskBuffer: buffer };
    }, [accountTrades, account.initialBalance, account.maxDrawdown, account.drawdownType]);

    // AUTO-UPDATE RULE: Max Daily Risk = 10% of Available Drawdown Buffer
    useEffect(() => {
        const recommendedRisk = Math.floor(availableRiskBuffer * 0.10);
        // Only update if difference is significant to avoid loops, and ensure it's not 0 unless buffer is 0
        // We allow a floor of $50 risk if buffer exists, otherwise 0
        const targetRisk = recommendedRisk < 50 && availableRiskBuffer > 500 ? 50 : recommendedRisk;

        if (risk.maxDailyRisk !== targetRisk) {
            // Update the setting automatically
            const updatedRisk = { ...risk, maxDailyRisk: targetRisk };
            // We use a timeout to avoid update conflicts during render cycles
            const timer = setTimeout(() => {
                updateAccount({ ...account, riskSettings: updatedRisk });
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [availableRiskBuffer, risk.maxDailyRisk, account, updateAccount, risk]);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrades = accountTrades.filter(t => t.date === todayStr);
    const todayPnl = todayTrades.reduce((s, t) => s + t.pnlNet, 0);

    const handleUpdate = (field: string, value: any) => {
        const updatedRisk = { ...risk, [field]: value };
        updateAccount({ ...account, riskSettings: updatedRisk });
    };

    const inst = INSTRUMENTS.find(i => i.val === risk.preferredInstrument) || INSTRUMENTS[0];
    const multiplier = inst.mult;
    const tickSize = inst.tick;
    const riskPerTrade = Math.round(risk.maxDailyRisk / (risk.maxTradesPerDay || 1));
    
    let finalLots = 0;
    let finalSlPts = 0;
    let finalTpPts = 0;

    if (risk.calcMode === 'fixedContracts') {
        finalLots = risk.maxContractsPerTrade || 1;
        const rawSl = riskPerTrade / (finalLots * multiplier);
        finalSlPts = Math.round(rawSl / tickSize) * tickSize;
    } else {
        finalSlPts = risk.fixedSlPoints || 25;
        finalLots = Math.floor(riskPerTrade / (finalSlPts * multiplier)) || 1;
    }

    if (risk.targetMode === 'fixedRR') {
        const rawTp = finalSlPts * (risk.rrRatio || 2);
        finalTpPts = Math.round(rawTp / tickSize) * tickSize;
    } else {
        finalTpPts = risk.fixedTargetPoints || 50;
    }

    const commissionsPerTrade = finalLots * (risk.commPerContract || 2.40) * 2;
    const targetGross = finalTpPts * multiplier * finalLots;
    const targetNet = targetGross - commissionsPerTrade;
    const dailyPotential = targetNet * risk.maxTradesPerDay;
    
    const exposurePct = Math.min(Math.max((Math.abs(todayPnl < 0 ? todayPnl : 0) / (risk.maxDailyRisk || 1)) * 100, 0), 100);

    return (
        <div className="bg-[#0b1222] border border-slate-800 transition-all duration-700 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group hover:border-blue-500/30">
            <div className="flex justify-between items-center mb-12">
               <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl border border-blue-500/30 bg-blue-600/10 flex items-center justify-center shadow-lg transition-all duration-500 text-blue-400">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{account.name}</h3>
                    <p className="text-[7px] font-black uppercase tracking-[0.3em] mt-1 text-slate-500">
                        PROTOCOL PARAMETERS MANAGEMENT
                    </p>
                  </div>
               </div>
               <div className="flex space-x-3">
                  <button className="bg-[#f97316] hover:bg-orange-500 text-white font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
                      CONSISTENCY RISK
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className={labelClass}>MAX RISK (10% RULE)</label>
                        <i className="fas fa-lock text-[8px] text-slate-600" title="Auto-calculated: 10% of Available Drawdown"></i>
                    </div>
                    {/* Read-only styled input to show it's system managed */}
                    <div className={`${inputClass} bg-slate-900/50 text-slate-300 flex items-center cursor-not-allowed`}>
                        {risk.maxDailyRisk}
                    </div>
                </div>
                <div>
                    <label className={labelClass}>TRADES (N)</label>
                    <input type="number" className={inputClass} value={risk.maxTradesPerDay} onChange={e => handleUpdate('maxTradesPerDay', parseInt(e.target.value))} />
                </div>
                <div>
                    <label className={labelClass}>CURRENT ATR</label>
                    <input type="number" className={inputClass} value={risk.manualAtr} onChange={e => handleUpdate('manualAtr', parseFloat(e.target.value))} />
                </div>
                <div className="bg-[#0d121f]/60 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-inner">
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">AVAILABLE BUFFER</p>
                    <p className="text-4xl font-black text-white tracking-tighter">${availableRiskBuffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-[#0d121f]/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. SIZING MODE</h4>
                        <div className="bg-black/40 p-1 rounded-lg border border-slate-800 flex">
                            <button onClick={() => handleUpdate('calcMode', 'fixedContracts')} className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${risk.calcMode === 'fixedContracts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>LOTS</button>
                            <button onClick={() => handleUpdate('calcMode', 'fixedSL')} className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${risk.calcMode === 'fixedSL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>SL</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <select className={inputClass} value={risk.preferredInstrument} onChange={e => handleUpdate('preferredInstrument', e.target.value)}>
                            {INSTRUMENTS.map(i => <option key={i.val} value={i.val}>{i.label}</option>)}
                        </select>
                        <input 
                            type="number" 
                            className={inputClass} 
                            value={risk.calcMode === 'fixedContracts' ? (risk.maxContractsPerTrade || 1) : (risk.fixedSlPoints || 25)} 
                            onChange={e => handleUpdate(risk.calcMode === 'fixedContracts' ? 'maxContractsPerTrade' : 'fixedSlPoints', parseFloat(e.target.value))} 
                        />
                    </div>
                </div>

                <div className="bg-[#0d121f]/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. TARGET & COMMISSIONS</h4>
                        <div className="bg-black/40 p-1 rounded-lg border border-slate-800 flex">
                            <button onClick={() => handleUpdate('targetMode', 'fixedRR')} className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${risk.targetMode === 'fixedRR' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>R:R</button>
                            <button onClick={() => handleUpdate('targetMode', 'fixedTargetPoints')} className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${risk.targetMode === 'fixedTargetPoints' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>PTS</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="text-[8px] font-black text-slate-600 uppercase mb-2 block tracking-widest italic">SET RATIO/PTS</label>
                            {risk.targetMode === 'fixedRR' ? (
                                <select className={inputClass} value={risk.rrRatio} onChange={e => handleUpdate('rrRatio', parseFloat(e.target.value))}>
                                    {RR_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                </select>
                            ) : (
                                <input type="number" className={inputClass} value={risk.fixedTargetPoints} onChange={e => handleUpdate('fixedTargetPoints', parseFloat(e.target.value))} />
                            )}
                        </div>
                        <div className="col-span-2">
                            <label className="text-[8px] font-black text-slate-600 uppercase mb-2 block tracking-widest italic">PER CONTRACT COMM. ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className={inputClass} 
                                value={risk.commPerContract || 2.40} 
                                onChange={e => handleUpdate('commPerContract', parseFloat(e.target.value))} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 mb-10 border-t border-b border-slate-800/60">
                <div className="p-8 text-center border-r border-slate-800/60">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">RISK / TRADE</p>
                    <p className="text-2xl font-black text-red-500 italic tracking-tighter">-${riskPerTrade}</p>
                </div>
                <div className="p-8 text-center border-r border-slate-800/60">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">EFFICIENCY</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter">1:{risk.targetMode === 'fixedRR' ? risk.rrRatio : (finalTpPts / (finalSlPts || 1)).toFixed(1)}</p>
                </div>
                <div className="p-8 text-center border-r border-slate-800/60">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">TARGET NET</p>
                    <p className="text-2xl font-black text-blue-500 italic tracking-tighter">${Math.round(targetNet)}</p>
                </div>
                <div className="p-8 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">DAILY POTENTIAL</p>
                    <p className="text-2xl font-black text-orange-500 italic tracking-tighter">${Math.round(dailyPotential)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-[#0d121f] border border-slate-800 p-10 rounded-[2.5rem] relative group/highlight hover:border-blue-500/30 transition-all overflow-hidden shadow-xl">
                   <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 uppercase italic">
                            {risk.calcMode === 'fixedContracts' ? 'STOP DISTANCE' : 'EXECUTION SIZE'}
                        </p>
                        <p className="text-5xl font-black text-white italic tracking-tighter">
                            {risk.calcMode === 'fixedContracts' ? finalSlPts.toFixed(2) : finalLots} 
                            <span className="text-xl not-italic text-slate-700 ml-2">{risk.calcMode === 'fixedContracts' ? 'pts' : 'Lots'}</span>
                        </p>
                      </div>
                      <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-3 py-1 rounded-lg">ATR: {risk.manualAtr}</span>
                   </div>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-10 rounded-[2.5rem] relative group/highlight hover:border-indigo-500/30 transition-all overflow-hidden shadow-xl">
                   <div className="relative z-10">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 uppercase italic">TARGET POINTS</p>
                      <p className="text-5xl font-black text-indigo-400 italic tracking-tighter">
                        {finalTpPts.toFixed(2)} <span className="text-xl not-italic text-slate-700 ml-2">pts</span>
                      </p>
                   </div>
                </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-slate-800/60">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">RISK EXPOSURE USAGE</span>
                    <span className="text-xs font-black text-white">{exposurePct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 p-0.5">
                    <div 
                        className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${exposurePct > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`}
                        style={{ width: `${exposurePct}%` }}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TODAY'S P&L:</p>
                        <p className={`text-sm font-black italic tracking-tighter ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {todayPnl >= 0 ? '+' : '-'}${Math.abs(todayPnl).toLocaleString()}
                        </p>
                    </div>
                    <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em]">_ PROTOCOL V2.5-AUTOVALID</p>
                </div>
            </div>

            <i className="fas fa-shield-halved absolute -top-10 -right-10 text-[200px] text-white/[0.01] pointer-events-none group-hover:text-blue-500/[0.02] transition-colors duration-1000"></i>
        </div>
    );
};

interface RiskManagementProps {
  onAddAccount?: () => void;
}

const RiskManagement: React.FC<RiskManagementProps> = ({ onAddAccount }) => {
  // OPTIMIZED SELECTOR: Using useShallow with safe defaults
  const { accounts = [], selectedAccountId = 'all', trades = [], updateAccount } = useAppStore(useShallow(state => ({
    accounts: state.accounts || [],
    selectedAccountId: state.selectedAccountId || 'all',
    trades: state.trades || [],
    updateAccount: state.updateAccount,
  })));
  
  const activeAccounts = useMemo(() => 
    selectedAccountId === 'all' ? accounts : accounts.filter(a => a.id === selectedAccountId)
  , [accounts, selectedAccountId]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      {/* HEADER WITH NEW ACCOUNT BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0b1222]/60 p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Set Your Risk</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Configure sizing & protocol limits for active accounts</p>
        </div>
        {onAddAccount && (
          <button onClick={onAddAccount} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center active:scale-95">
            <i className="fas fa-plus-circle mr-2"></i> New Account
          </button>
        )}
      </div>

      {activeAccounts.length === 0 ? (
        <div className="py-40 text-center opacity-30 flex flex-col items-center">
          <i className="fas fa-shield-halved text-5xl mb-6 text-slate-800"></i>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-600">Selecteaza un cont pentru configurare.</p>
          <button onClick={onAddAccount} className="mt-8 text-blue-500 font-black uppercase text-[10px] underline tracking-widest hover:text-blue-400">Sau creează unul acum</button>
        </div>
      ) : (
        activeAccounts.map(account => (
            <RiskAccountCard 
              key={account.id} 
              account={account} 
              trades={trades} 
              updateAccount={updateAccount} 
            />
        ))
      )}
    </div>
  );
};

export default RiskManagement;