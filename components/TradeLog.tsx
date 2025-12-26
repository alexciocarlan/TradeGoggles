
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trade, Account, DailyPrepData } from '../types';
import { Language, translations } from '../translations';
import DayWrapUpModal from './DayWrapUpModal';

interface TradeLogProps {
  trades: Trade[];
  accounts: Account[];
  onDeleteTrade: (id: string) => void;
  showAccount?: boolean;
  language: Language;
  dailyPreps: Record<string, DailyPrepData>;
  onSavePrep: (date: string, prep: DailyPrepData) => void;
}

const TradeLog: React.FC<TradeLogProps> = ({ trades, accounts, onDeleteTrade, showAccount = false, language, dailyPreps, onSavePrep }) => {
  const [filter, setFilter] = useState('');
  const [isWrapUpOpen, setIsWrapUpOpen] = useState(false);
  const t = translations[language].journal;
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTrades = trades.filter(t => 
    t.instrument.toLowerCase().includes(filter.toLowerCase()) || 
    t.setup.toLowerCase().includes(filter.toLowerCase()) ||
    (t.tags && t.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase())))
  );

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Cont Necunoscut';

  return (
    <div className="bg-[#0b1222] border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">DAY REVIEW LOG</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsWrapUpOpen(true)}
              className="no-print bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center"
            >
              <i className="fas fa-check-double mr-2"></i> Day Wrap up
            </button>
          </div>
        </div>
        <div className="relative no-print">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input 
            type="text" 
            placeholder="Caută instrument, setup..." 
            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm w-full md:w-80 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Data / Sesiune</th>
              {showAccount && <th className="px-6 py-4">Cont</th>}
              <th className="px-6 py-4">Instrument</th>
              <th className="px-6 py-4">Setup</th>
              <th className="px-6 py-4">Status Review</th>
              <th className="px-6 py-4">PnL Net</th>
              <th className="px-6 py-4 text-right no-print">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredTrades.map((trade) => {
              const isToday = trade.date === todayStr;
              const isReviewed = trade.notes && trade.notes.trim().length > 0;
              const accountName = getAccountName(trade.accountId);

              return (
                <tr key={trade.id} className={`transition-all duration-200 group relative ${isToday ? 'bg-blue-500/5 border-l-4 border-l-blue-600' : 'hover:bg-slate-800/30'}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${isToday ? 'text-blue-400' : 'text-slate-200'}`}>
                        {trade.date}
                        {isToday && <span className="ml-2 text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm">Today</span>}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{trade.session}</span>
                    </div>
                  </td>
                  {showAccount && (
                    <td className="px-6 py-4">
                      <div className="relative group/acc">
                        <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 truncate max-w-[120px] inline-block cursor-help">
                          {accountName}
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/acc:block z-50 animate-in fade-in zoom-in-95 duration-200">
                          <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-2xl">
                             <p className="text-[9px] font-black text-white uppercase whitespace-nowrap">{accountName}</p>
                             <div className="absolute top-full left-4 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-white">{trade.instrument}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${trade.type === 'LONG' ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'}`}>
                        {trade.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative group/tooltip">
                      <span className="text-sm text-slate-400 font-medium truncate max-w-[180px] block cursor-help">{trade.setup}</span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl min-w-[200px]">
                           <p className="text-[10px] font-black text-blue-500 uppercase mb-1 tracking-widest">Setup Name</p>
                           <p className="text-xs text-white font-bold">{trade.setup}</p>
                           <div className="absolute top-full left-6 w-3 h-3 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isReviewed ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase tracking-widest shadow-lg shadow-blue-600/20"><i className="fas fa-check-circle mr-1.5 text-[10px]"></i>{t.reviewedLabel}</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black bg-yellow-400 text-slate-900 uppercase tracking-widest animate-pulse border border-yellow-500/30"><i className="fas fa-exclamation-triangle mr-1.5 text-[10px]"></i>{t.reviewTradeLabel}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-black text-sm ${trade.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnlNet >= 0 ? `+$${trade.pnlNet.toLocaleString()}` : `-$${Math.abs(trade.pnlNet).toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right no-print">
                    <div className="flex items-center justify-end space-x-2">
                      <Link to={`/trade/${trade.id}`} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${isToday ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30' : 'bg-blue-900/20 text-blue-400 hover:bg-blue-600 hover:text-white'}`}>{isReviewed ? 'VIEW' : 'REVIEW'}</Link>
                      <button onClick={() => onDeleteTrade(trade.id)} className="bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DayWrapUpModal isOpen={isWrapUpOpen} onClose={() => setIsWrapUpOpen(false)} language={language} date={todayStr} dailyPreps={dailyPreps} onSave={onSavePrep} />
    </div>
  );
};

export default TradeLog;
