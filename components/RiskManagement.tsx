
import React from 'react';
import { Account, AccountRiskSettings, Trade } from '../types';
import { Language } from '../translations';

/* Added language to RiskManagementProps to fix TypeScript error in App.tsx */
interface RiskManagementProps {
  accounts: Account[];
  trades: Trade[];
  onUpdateAccount: (account: Account) => void;
  selectedAccountId: string;
  language: Language;
}

const INSTRUMENT_MULTIPLIERS: Record<string, number> = {
  'MNQ': 2,
  'NQ': 20,
  'MES': 5,
  'ES': 50
};

const RiskManagement: React.FC<RiskManagementProps> = ({ accounts, trades, onUpdateAccount, selectedAccountId, language }) => {
  const activeAccounts = selectedAccountId === 'all' ? accounts : accounts.filter(a => a.id === selectedAccountId);
  const today = new Date().toISOString().split('T')[0];

  const handleUpdateRisk = (account: Account, field: keyof AccountRiskSettings, value: any) => {
    const updatedRisk = {
      ...(account.riskSettings || {
        maxTotalRisk: account.maxDrawdown,
        maxDailyRisk: 500,
        maxTradesPerDay: 5,
        maxContractsPerTrade: 2,
        dailyProfitTarget: 1000,
        preferredInstrument: 'MNQ'
      }),
      [field]: value
    };
    onUpdateAccount({ ...account, riskSettings: updatedRisk });
  };

  const inputClass = "bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-1 focus:ring-blue-500 outline-none w-full transition-all";
  const displayClass = "bg-[#0b1222] border border-slate-800/40 rounded-xl px-4 py-2.5 text-sm font-black w-full flex items-center justify-between";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";

  if (accounts.length === 0) {
    return (
      <div className="py-20 text-center bg-[#0b1222] border border-slate-800 rounded-[2rem]">
        <i className="fas fa-shield-alt text-4xl text-slate-800 mb-4"></i>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nu există conturi pentru configurare risc</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeAccounts.map(account => {
          const risk = account.riskSettings || {
            maxTotalRisk: account.maxDrawdown,
            maxDailyRisk: 500,
            maxTradesPerDay: 5,
            maxContractsPerTrade: 2,
            dailyProfitTarget: 1000,
            preferredInstrument: 'MNQ'
          };
          
          const dailyPercentOfTotal = risk.maxTotalRisk > 0 ? (risk.maxDailyRisk / risk.maxTotalRisk) * 100 : 0;
          
          // Calcule Profit
          const profitPerTrade = risk.dailyProfitTarget / (risk.maxTradesPerDay || 1);
          const multiplier = INSTRUMENT_MULTIPLIERS[risk.preferredInstrument || 'MNQ'] || 1;
          const profitPointsPerTrade = profitPerTrade / ( (risk.maxContractsPerTrade || 1) * multiplier );

          // Calcule Risc
          const riskPerTrade = risk.maxDailyRisk / (risk.maxTradesPerDay || 1);
          const riskPointsPerTrade = riskPerTrade / ( (risk.maxContractsPerTrade || 1) * multiplier );
          
          const todayPnl = trades
            .filter(t => t.accountId === account.id && t.date === today)
            .reduce((sum, t) => sum + t.pnlNet, 0);
            
          const riskUsagePercent = Math.min(Math.max((Math.abs(Math.min(todayPnl, 0)) / (risk.maxDailyRisk || 1)) * 100, 0), 100);

          return (
            <div key={account.id} className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20 text-red-500">
                    <i className="fas fa-shield-halved text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl tracking-tight uppercase">{account.name}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{account.type} Protocol</p>
                  </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black bg-red-500 text-white px-2 py-1 rounded uppercase tracking-tighter">Active Protection</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div>
                  <label className={labelClass}>Riscul Maxim Total ($)</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={risk.maxTotalRisk}
                    onChange={(e) => handleUpdateRisk(account, 'maxTotalRisk', parseFloat(e.target.value) || 0)}
                  />
                  <p className="mt-2 text-[9px] text-slate-600 font-bold italic">Balanța totală expusă pierderii (Total Drawdown)</p>
                </div>
                <div>
                  <label className={labelClass}>Riscul Maxim pe Zi ($)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        className={inputClass} 
                        value={risk.maxDailyRisk}
                        onChange={(e) => handleUpdateRisk(account, 'maxDailyRisk', parseFloat(e.target.value) || 0)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <span className="text-[9px] font-black text-red-400">{dailyPercentOfTotal.toFixed(1)}% din Total</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-600 font-bold italic">Suma maximă pe care o poți pierde într-o singură sesiune.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div>
                  <label className={labelClass}>Instrument Preferat</label>
                  <select 
                    className={inputClass}
                    value={risk.preferredInstrument || 'MNQ'}
                    onChange={(e) => handleUpdateRisk(account, 'preferredInstrument', e.target.value)}
                  >
                    <option value="MNQ">MNQ ($2/pt)</option>
                    <option value="NQ">NQ ($20/pt)</option>
                    <option value="MES">MES ($5/pt)</option>
                    <option value="ES">ES ($50/pt)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Max Tradeuri / Zi</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={risk.maxTradesPerDay}
                    onChange={(e) => handleUpdateRisk(account, 'maxTradesPerDay', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max Contracte / Trade</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={risk.maxContractsPerTrade}
                    onChange={(e) => handleUpdateRisk(account, 'maxContractsPerTrade', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className={labelClass}>PnL Curent (Azi)</label>
                  <div className={`${displayClass} ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <span>{todayPnl >= 0 ? '+' : '-'}${Math.abs(todayPnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <i className={`fas ${todayPnl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tinta Profit / Zi ($)</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={risk.dailyProfitTarget}
                    onChange={(e) => handleUpdateRisk(account, 'dailyProfitTarget', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Profit Target / Trade</label>
                  <div className={`${displayClass} text-blue-400`}>
                    <span>${profitPerTrade.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                    <span className="text-[10px] text-blue-500/60 font-bold">{profitPointsPerTrade.toFixed(1)} pts</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Risk / Trade (STOP LOSS)</label>
                  <div className={`${displayClass} text-red-500 border-red-500/20 bg-red-500/5`}>
                    <span>-${riskPerTrade.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                    <span className="text-[10px] text-red-500/60 font-bold">{riskPointsPerTrade.toFixed(1)} pts</span>
                  </div>
                </div>
                <div className="hidden lg:block"></div>
                <div className="hidden lg:block"></div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex items-center space-x-6">
                <div className="flex-1">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Utilizare Risc Zilnic</p>
                      <p className="text-[10px] font-black text-white uppercase">{riskUsagePercent.toFixed(0)}% folosit azi</p>
                   </div>
                   <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${riskUsagePercent}%` }}></div>
                   </div>
                </div>
                <div className="w-px h-10 bg-slate-800"></div>
                <div className="text-center min-w-[80px]">
                   <p className="text-[9px] font-black text-slate-500 uppercase">Status</p>
                   <p className={`text-[10px] font-black uppercase ${todayPnl <= -risk.maxDailyRisk ? 'text-red-500' : 'text-green-500'}`}>
                     {todayPnl <= -risk.maxDailyRisk ? 'LOSS REACHED' : 'SAFE TO TRADE'}
                   </p>
                </div>
              </div>

              <i className="fas fa-shield-virus absolute -bottom-10 -right-10 text-[180px] text-white/5 pointer-events-none group-hover:text-red-500/10 transition-colors duration-700"></i>
            </div>
          );
        })}
      </div>
      
      <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2rem] flex items-start space-x-6">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
            <i className="fas fa-lightbulb"></i>
        </div>
        <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Calculator de Obiective (Risk-To-Points)</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Câmpul <b>Risk / Trade</b> îți arată exact cât ai voie să pierzi la o singură intrare pentru a rămâne în limitele planului. 
                Dacă stop-loss-ul tău tehnic necesită mai multe puncte decât cele afișate, trebuie fie să reduci numărul de contracte, 
                fie să cauți o intrare mai precisă. Această metodă previne "suicidul" contului prin pierderi prea mari raportate la Daily Risk.
            </p>
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;
