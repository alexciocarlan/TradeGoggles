
import React, { useState, useEffect, useMemo } from 'react';
import { Trade, Account } from '../types';
import { Language } from '../translations';

interface MarketHubBarProps {
  trades: Trade[];
  activeAccount?: Account;
  language: Language;
  onLanguageToggle: () => void;
}

const MarketHubBar: React.FC<MarketHubBarProps> = ({ trades, activeAccount, language, onLanguageToggle }) => {
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
  const shg = getMarketStatus('Asia/Shanghai', 9, 30, 15, 0);

  return (
    <div className="w-full bg-[#060b13] border-b border-slate-800/50 px-6 py-3 flex items-center justify-between no-print overflow-x-auto whitespace-nowrap custom-scrollbar transition-colors duration-300">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2 border-r border-slate-800/50 pr-8">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Market Hub</span>
        </div>

        <button 
          onClick={onLanguageToggle}
          className="flex items-center space-x-2 border-r border-slate-800/50 pr-8 hover:opacity-70 transition-all"
        >
          <span className="text-[9px] font-black text-slate-500 uppercase">{language === 'ro' ? 'EN' : 'RO'}</span>
          <span className="text-[10px] font-black text-white uppercase">{language.toUpperCase()}</span>
          <i className="fas fa-chevron-down text-[8px] text-slate-500"></i>
        </button>

        <div className="flex items-center space-x-12 border-r border-slate-800/50 pr-8">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">{language === 'ro' ? 'Trades Azi' : 'Trades Today'}</p>
            <p className="text-sm font-black text-blue-500">{todayTrades.length}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">PnL Net Azi</p>
            <p className={`text-sm font-black ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${todayPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">{language === 'ro' ? 'Risc Disponibil' : 'Available Risk'}</p>
            <p className="text-sm font-black text-red-500">${availableRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-10">
        <MarketClock label="NY / CME" data={ny} />
        <MarketClock label="LDN / LSE" data={ldn} />
        <MarketClock label="SHG / SSE" data={shg} />
      </div>
    </div>
  );
};

const MarketClock = ({ label, data }: { label: string, data: any }) => (
  <div className="flex items-center space-x-4 border-l border-slate-800/50 pl-8 first:border-l-0 first:pl-0">
    <div>
      <div className="flex items-center space-x-2 mb-0.5">
        <p className="text-[9px] font-black text-slate-500 uppercase">{label}</p>
        <span className={`text-[8px] font-black px-1 rounded ${data.isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {data.isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-sm font-black text-white">{data.time}</span>
        <span className="text-[9px] font-bold text-slate-500">{data.countdown}</span>
      </div>
    </div>
  </div>
);

export default MarketHubBar;
