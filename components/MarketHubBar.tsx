
import React, { useState, useEffect, useMemo } from 'react';
import { Trade, Account, DailyPrepData, WeeklyPrepData } from '../types';
import { Language } from '../translations';

interface MarketHubBarProps {
  trades: Trade[];
  activeAccount?: Account;
  accounts: Account[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  onOpenTradeModal: () => void;
  currentBlockStatus: string | null;
  riskManagerEnabled: boolean;
  language: Language;
  onLanguageToggle: () => void;
  dailyPreps: Record<string, DailyPrepData>;
  weeklyPreps: Record<string, WeeklyPrepData>;
}

const MarketHubBar: React.FC<MarketHubBarProps> = ({ 
  trades, 
  activeAccount, 
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  onOpenTradeModal,
  currentBlockStatus,
  riskManagerEnabled,
  language, 
  onLanguageToggle, 
  dailyPreps, 
  weeklyPreps 
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.date === todayStr);
  const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnlNet, 0);

  const availableRisk = useMemo(() => {
    if (!activeAccount?.riskSettings) return 0;
    const limit = activeAccount.riskSettings.maxDailyRisk;
    const lossSoFar = todayTrades.filter(t => t.pnlNet < 0).reduce((sum, t) => sum + Math.abs(t.pnlNet), 0);
    return Math.max(limit - lossSoFar, 0);
  }, [activeAccount, todayTrades]);

  const getMarketStatus = (tz: string, openH: number, openM: number, closeH: number, closeM: number) => {
    const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const [h, m, s] = timeStr.split(':').map(Number);
    const currentTotalMin = h * 60 + m;
    const openTotalMin = openH * 60 + openM;
    const closeTotalMin = closeH * 60 + closeM;

    const isOpen = currentTotalMin >= openTotalMin && currentTotalMin < closeTotalMin;
    
    let countdown = "";
    if (isOpen) {
      const diff = closeTotalMin - currentTotalMin;
      countdown = `Closes in ${Math.floor(diff / 60)}h ${diff % 60}m`;
    } else {
      let diff = openTotalMin - currentTotalMin;
      if (diff < 0) diff += 24 * 60;
      countdown = `Opens in ${Math.floor(diff / 60)}h ${diff % 60}m`;
    }

    return { time: timeStr, isOpen, countdown };
  };

  const ny = getMarketStatus('America/New_York', 9, 30, 16, 0);
  const ldn = getMarketStatus('Europe/London', 8, 0, 16, 30);

  const isBlocked = currentBlockStatus && riskManagerEnabled;

  return (
    <div className="w-full bg-[#060b13] border-b border-slate-800/50 px-6 py-3 flex items-center justify-between no-print overflow-x-auto whitespace-nowrap custom-scrollbar transition-colors duration-300 sticky top-0 z-[100]">
      <div className="flex items-center space-x-6">
        {/* BUTON + TRADE - POZITIONAT IN LOCUL MARKET HUB */}
        <div className="border-r border-slate-800/50 pr-6">
            <button 
                onClick={onOpenTradeModal} 
                className={`px-6 py-2.5 rounded-xl font-black flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 ${
                    isBlocked 
                    ? 'bg-red-600/20 text-red-500 border border-red-500/30' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
                }`}
            >
                <i className={`fas ${isBlocked ? 'fa-lock' : 'fa-plus'} text-[10px]`}></i>
                <span className="text-[10px] uppercase tracking-[0.15em] font-black">{isBlocked ? 'LOCKED' : 'TRADE'}</span>
            </button>
        </div>

        {/* SELECTOR CONT ACTIV */}
        <div className="flex items-center space-x-4 border-r border-slate-800/50 pr-6">
            <div className="flex flex-col">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Cont Activ</span>
                <div className="relative group">
                    <select 
                        value={selectedAccountId} 
                        onChange={(e) => setSelectedAccountId(e.target.value)} 
                        className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-black text-white focus:outline-none appearance-none cursor-pointer pr-8 hover:border-slate-600 transition-all"
                    >
                        <option value="all" className="bg-slate-900">Toate Conturile</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-[8px] pointer-events-none"></i>
                </div>
            </div>
            <button 
                onClick={onLanguageToggle}
                className="flex items-center space-x-2 hover:opacity-70 transition-all px-3 py-2 rounded-lg bg-slate-900/30 border border-slate-800/50"
            >
                <span className="text-[10px] font-black text-slate-400 uppercase">{language.toUpperCase()}</span>
                <i className="fas fa-globe text-[9px] text-slate-600"></i>
            </button>
        </div>

        <div className="flex items-center space-x-10">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Azi</p>
            <p className="text-sm font-black text-blue-500">{todayTrades.length} <span className="text-[9px] text-slate-600 font-bold ml-1">TRADES</span></p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">PnL Net</p>
            <p className={`text-sm font-black ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${todayPnl.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Available Risk</p>
            <p className="text-sm font-black text-red-500">${availableRisk.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-8">
            <MarketClock label="NY" data={ny} />
            <MarketClock label="LDN" data={ldn} />
        </div>
      </div>
    </div>
  );
};

const MarketClock = ({ label, data }: { label: string, data: any }) => (
  <div className="flex items-center space-x-3">
    <div>
      <div className="flex items-center space-x-2 mb-0.5">
        <p className="text-[9px] font-black text-slate-500 uppercase">{label}</p>
        <span className={`text-[7px] font-black px-1 rounded ${data.isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {data.isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-xs font-black text-white">{data.time}</span>
      </div>
    </div>
  </div>
);

export default MarketHubBar;
