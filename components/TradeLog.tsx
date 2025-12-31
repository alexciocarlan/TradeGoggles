
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const PrepContextWidget = ({ label, value, icon, colorClass, sub }: any) => (
  <div className="flex items-center space-x-4 bg-[#0b1222]/80 border border-slate-800/60 p-5 rounded-2xl transition-all hover:border-slate-600 group relative overflow-hidden flex-1 min-w-[180px] shadow-lg">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10 border border-opacity-20 ${colorClass.replace('text-', 'border-')}`}>
      <i className={`fas ${icon} text-sm transition-transform group-hover:scale-110`}></i>
    </div>
    <div className="flex flex-col overflow-hidden">
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">{label}</span>
      <span className={`text-[11px] font-black uppercase tracking-tight truncate ${colorClass}`}>{value || 'NOT DEFINED'}</span>
      {sub && <span className="text-[7px] font-bold text-slate-700 uppercase tracking-tighter">{sub}</span>}
    </div>
    <div className={`absolute top-0 right-0 w-1 h-full opacity-30 ${colorClass.replace('text', 'bg')}`}></div>
  </div>
);

const DayReviewGroup = ({ date, trades, prep, onDeleteTrade }: any) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = date === todayStr;
  
  const d = new Date(date);
  const dayName = d.toLocaleDateString('ro-RO', { weekday: 'long' }).toUpperCase();
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase();
  
  const totalPnl = trades.reduce((sum: number, t: any) => sum + t.pnlNet, 0);
  const winCount = trades.filter((t: any) => t.status === 'WIN').length;

  return (
    <div className="bg-[#060b13] border border-slate-800/60 rounded-[2.5rem] overflow-hidden mb-12 transition-all hover:border-slate-700 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
      <div 
        className="px-10 py-8 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 border-b border-slate-800/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-8">
           <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center justify-center bg-blue-600/10 border border-blue-500/20 w-14 h-14 rounded-2xl shadow-inner">
                 <span className="text-[8px] font-black text-blue-500 tracking-tighter mb-0.5">{monthName}</span>
                 <span className="text-2xl font-black text-blue-500 tracking-tighter">{dayNum}</span>
              </div>
              <div>
                 <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{dayName}</h3>
                 <div className="flex items-center space-x-3 mt-2">
                    <span className="text-10px font-black text-slate-600 uppercase tracking-widest">{trades.length} EXECUTIONS</span>
                    <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                    <span className={`text-10px font-black uppercase tracking-widest ${winCount / trades.length >= 0.5 ? 'text-green-500' : 'text-slate-500'}`}>
                        {((winCount / trades.length) * 100).toFixed(0)}% SUCCESS RATE
                    </span>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center space-x-12">
          <div className="text-right">
             <p className={`text-4xl font-black tracking-tighter ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
             </p>
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1">Sessional P&L</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'rotate-180 text-blue-500' : 'text-slate-800'}`}>
             <i className="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-10 space-y-10 animate-in slide-in-from-top-4 duration-500">
           
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">MISSION BRIEFING: STRATEGIC CONTEXT</h4>
                 </div>
                 {!prep && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/journal'); }}
                      className="text-[9px] font-black text-orange-500 uppercase bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/30 tracking-widest italic hover:bg-orange-500/20 transition-all animate-pulse"
                    >
                      <i className="fas fa-sync-alt mr-2"></i> DATA SYNC REQUIRED: GO TO PREP
                    </button>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 <PrepContextWidget label="Market Bias" value={prep?.bias} icon="fa-compass" colorClass={prep?.bias === 'Bullish' ? 'text-green-500' : prep?.bias === 'Bearish' ? 'text-red-500' : 'text-blue-500'} sub="CORE ORIENTATION" />
                 <PrepContextWidget label="Focus Setup" value={prep?.setup} icon="fa-rocket" colorClass="text-indigo-400" sub="PRIMARY HYPOTHESIS" />
                 <PrepContextWidget label="HTF Structure" value={prep?.mediumTermTrend === 'Up' ? 'Trending UP' : prep?.mediumTermTrend === 'Down' ? 'Trending DOWN' : prep?.mediumTermTrend} icon="fa-sitemap" colorClass={prep?.mediumTermTrend === 'Up' ? 'text-emerald-500' : prep?.mediumTermTrend === 'Down' ? 'text-rose-500' : 'text-blue-500'} sub="FRAME SYNC" />
                 <PrepContextWidget label="Correction Task" value={prep?.gkFocusError} icon="fa-bullseye" colorClass="text-orange-400" sub="DISCIPLINE TARGET" />
                 <PrepContextWidget label="Gatekeeper" value={prep ? `${prep.gkTotalScore}/100` : 'ALPHA'} icon="fa-shield-halved" colorClass={prep?.gkVerdict === 'Green' ? 'text-green-400' : prep?.gkVerdict === 'Yellow' ? 'text-yellow-400' : 'text-red-500'} sub={`SCORE: ${prep?.gkTotalScore || '--'}/100`} />
              </div>

              {isToday && (
                <div className="mt-4 px-6 py-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-center justify-center space-x-3 animate-pulse">
                   <i className="fas fa-info-circle text-orange-500 text-xs"></i>
                   <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest">
                      Pentru a fi considerată ziua de trading închisă completează: <span className="text-orange-400 underline decoration-orange-500/40">"Day WRAP UP"</span>
                   </p>
                </div>
              )}
           </div>

           <div className="space-y-4">
              <div className="grid grid-cols-6 px-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">
                 <span>ENTRY TIME</span>
                 <span className="col-span-1">INSTRUMENT</span>
                 <span className="col-span-1">SETUP TYPE</span>
                 <span className="text-center">REVIEW STATUS</span>
                 <span className="text-right col-span-2">RETURN (NET)</span>
              </div>
              
              <div className="space-y-2">
                 {trades.map((t: any) => {
                    const isReviewed = t.notes && t.notes.trim().length > 10;
                    const isToxicWin = t.isAccordingToPlan === 'NU' && t.pnlNet > 0;

                    return (
                        <div key={t.id} className={`bg-[#0b1222]/40 border ${isToxicWin ? 'border-fuchsia-500/40 bg-fuchsia-950/10 shadow-[0_0_15px_rgba(217,70,239,0.1)]' : 'border-slate-800/40'} p-6 rounded-2xl grid grid-cols-6 items-center group hover:border-blue-500/40 transition-all hover:translate-x-1`}>
                           <span className="text-xs font-bold text-slate-500 italic font-mono">{t.entryTime || '--:--'}</span>
                           
                           <div className="flex items-center space-x-4">
                              <span className="text-sm font-black text-white tracking-tighter uppercase">{t.instrument}</span>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${t.type === 'LONG' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{t.type}</span>
                           </div>
                           
                           <div className="flex flex-col overflow-hidden pr-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase truncate tracking-tight">{t.setup || 'MANUAL EXEC'}</span>
                              {isToxicWin && (
                                <span className="text-[7px] font-black text-fuchsia-500 uppercase tracking-widest flex items-center mt-0.5 animate-pulse">
                                   <i className="fas fa-biohazard mr-1"></i> Toxic Behavior
                                </span>
                              )}
                           </div>
                           
                           <div className="flex justify-center">
                              {isReviewed ? (
                                 <span className="text-[8px] font-black bg-emerald-600/10 text-emerald-500 px-4 py-1.5 rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center">
                                    <i className="fas fa-check-circle mr-2"></i> ANALYZED
                                 </span>
                              ) : (
                                 <span className="text-[8px] font-black bg-yellow-500/10 text-yellow-500 px-4 py-1.5 rounded-full border border-yellow-500/30 uppercase tracking-widest animate-pulse flex items-center">
                                    <i className="fas fa-triangle-exclamation mr-2"></i> NEED REVIEW
                                 </span>
                              )}
                           </div>
                           
                           <div className="flex items-center justify-end space-x-6 col-span-2">
                              <div className="flex flex-col items-end">
                                 <span className={`text-2xl font-black tracking-tighter ${isToxicWin ? 'text-fuchsia-500' : t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.pnlNet >= 0 ? '+' : '-'}${Math.abs(t.pnlNet).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                 </span>
                                 {isToxicWin && <span className="text-[7px] font-black text-fuchsia-600 uppercase tracking-[0.2em] leading-none">TOXIC WIN</span>}
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <Link to={`/trade/${t.id}`} className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"><i className="fas fa-external-link-alt text-xs"></i></Link>
                                 <button onClick={() => onDeleteTrade(t.id)} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                              </div>
                           </div>
                        </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TradeLog: React.FC<TradeLogProps> = ({ trades, accounts, onDeleteTrade, language, dailyPreps, onSavePrep }) => {
  const [filter, setFilter] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [isWrapUpOpen, setIsWrapUpOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const searchTerms = filter.toLowerCase();
      const matchesSearch = 
          t.instrument.toLowerCase().includes(searchTerms) || 
          (t.setup || '').toLowerCase().includes(searchTerms) ||
          t.date.includes(searchTerms);

      const isReviewed = t.notes && t.notes.trim().length > 10;
      const matchesReview = onlyPending ? !isReviewed : true;
      
      return matchesSearch && matchesReview;
    });
  }, [trades, filter, onlyPending]);

  const tradesByDate = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => { 
        if (!groups[t.date]) groups[t.date] = []; 
        groups[t.date].push(t); 
    });
    
    return Object.entries(groups).sort((a, b) => {
        const dateA = new Date(a[0]).getTime();
        const dateB = new Date(b[0]).getTime();
        return dateB - dateA;
    });
  }, [filteredTrades]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 px-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-[#0b1222]/40 p-8 rounded-[2rem] border border-slate-800/40">
        <div className="flex items-center space-x-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
             <i className="fas fa-history text-3xl"></i>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">BATTLE DEBRIEF LOG</h3>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">SESSION AUDIT & PERFORMANCE FEEDBACK ENGINE</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
             <button onClick={() => setOnlyPending(false)} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!onlyPending ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}>ALL SESSIONS</button>
             <button onClick={() => setOnlyPending(true)} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${onlyPending ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}>PENDING REVIEW</button>
          </div>

          <div className="relative group min-w-[320px]">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors text-sm"></i>
            <input type="text" placeholder="Search by Ticker, Setup or Date..." className="bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-800 transition-all shadow-inner" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>

          <button onClick={() => setIsWrapUpOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-emerald-600/30 flex items-center active:scale-95"><i className="fas fa-check-double mr-3 text-lg"></i> DAY WRAP UP</button>
        </div>
      </div>

      <div className="space-y-12">
         {tradesByDate.map(([date, dayTrades]) => (
            <DayReviewGroup key={date} date={date} trades={dayTrades} prep={dailyPreps[date]} onDeleteTrade={onDeleteTrade} />
         ))}
         
         {tradesByDate.length === 0 && (
            <div className="py-40 text-center border-2 border-dashed border-slate-800 rounded-[4rem] bg-[#0b1222]/20 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-8 border border-slate-800"><i className="fas fa-box-open text-4xl text-slate-700"></i></div>
                <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-600 italic">No session data found</p>
                <p className="text-xs font-bold text-slate-700 uppercase mt-4 tracking-widest max-w-md mx-auto">Try checking your account filters or reset the search to see historical executions.</p>
                {filter && (<button onClick={() => setFilter('')} className="mt-8 text-blue-500 font-black text-[10px] uppercase tracking-widest hover:underline">Clear all filters</button>)}
            </div>
         )}
      </div>

      <DayWrapUpModal isOpen={isWrapUpOpen} onClose={() => setIsWrapUpOpen(false)} language={language} date={todayStr} dailyPreps={dailyPreps} onSave={onSavePrep} />
    </div>
  );
};

export default TradeLog;
