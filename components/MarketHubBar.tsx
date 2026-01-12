import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { Trade, Account, DailyPrepData, WeeklyPrepData } from '../types';
import { useAppStore } from '../AppContext';
import { MarketTickers } from '../geminiService';
import { useShallow } from 'zustand/react/shallow';

interface MarketHubBarProps {
  onOpenTradeModal: () => void;
  currentBlockStatus: string | null;
  protocolValidated?: boolean;
  tickers: MarketTickers | null;
  loadingTickers: boolean;
}

const MarketHubBar: React.FC<MarketHubBarProps> = ({ 
  onOpenTradeModal,
  currentBlockStatus,
  protocolValidated = true,
  tickers,
  loadingTickers
}) => {

  const [isPending, startTransition] = useTransition();

  const { 
    trades, accounts, selectedAccountId, setSelectedAccountId, 
    riskManagerEnabled, isOfflineMode
  } = useAppStore(useShallow(state => ({
    trades: state.trades,
    accounts: state.accounts,
    selectedAccountId: state.selectedAccountId,
    setSelectedAccountId: state.setSelectedAccountId,
    riskManagerEnabled: state.riskManagerEnabled,
    isOfflineMode: state.isOfflineMode
  })));

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = activeTrades.filter(t => t.date === todayStr);
  const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnlNet, 0);

  const availableRisk = useMemo(() => {
    if (!activeAccount?.riskSettings) return 0;
    const limit = activeAccount.riskSettings.maxDailyRisk;
    const lossSoFar = todayTrades.filter(t => t.pnlNet < 0).reduce((sum, t) => sum + Math.abs(t.pnlNet), 0);
    return Math.max(limit - lossSoFar, 0);
  }, [activeAccount, todayTrades]);

  const handleAccountChange = (id: string) => {
    // FIX: Using startTransition prevents Error #525 when account change reveals different components
    startTransition(() => {
      setSelectedAccountId(id);
    });
  };

  return (
    <div className={`w-full bg-[#060b13] border-b border-slate-800/50 px-6 py-3 flex items-center justify-between no-print overflow-x-auto whitespace-nowrap custom-scrollbar transition-all duration-300 sticky top-0 z-[100] ${isPending ? 'opacity-70' : 'opacity-100'}`}>
      <div className="flex items-center space-x-6">
        
        <div className="flex items-center space-x-4 border-r border-slate-800/50 pr-6">
            <div className="flex flex-col">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Cont Activ {isPending && '(...)'}</span>
                <div className="relative group">
                    <select 
                        value={selectedAccountId} 
                        onChange={(e) => handleAccountChange(e.target.value)} 
                        className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-black text-white focus:outline-none appearance-none cursor-pointer pr-8 hover:border-slate-600 transition-all"
                    >
                        <option value="all" className="bg-slate-900">Toate Conturile</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-[8px] pointer-events-none"></i>
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-10">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">PnL Net</p>
            <p className={`text-sm font-black ${todayPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${todayPnl.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Available Risk</p>
            <p className="text-sm font-black text-red-500">${availableRisk.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6 text-slate-500 font-black text-[10px] uppercase tracking-widest">
        <span>NY: {now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        <div className="w-1 h-1 rounded-full bg-slate-800"></div>
        <span>LDN: {now.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      </div>
    </div>
  );
};

export default MarketHubBar;