
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { Trade, Account, DailyPrepData } from '../types';
import { Language } from '../translations';

interface CalendarProps {
  trades: Trade[];
  dailyNotes: Record<string, string>;
  onSaveNote: (date: string, note: string) => void;
  onDeleteTrade: (id: string) => void;
  activeAccount?: Account;
  dailyPreps: Record<string, DailyPrepData>;
  language: Language;
}

type ModalView = 'stats' | 'report' | 'note';

const Calendar: React.FC<CalendarProps> = ({ trades, dailyNotes, onSaveNote, onDeleteTrade, activeAccount, dailyPreps, language }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<{ date: string, trades: Trade[] } | null>(null);
  const [modalView, setModalView] = useState<ModalView>('stats');
  const [noteContent, setNoteContent] = useState('');
  
  const totalAccountProfit = useMemo(() => trades.reduce((sum, t) => sum + t.pnlNet, 0), [trades]);
  const consistencyLimit = totalAccountProfit > 0 ? totalAccountProfit * 0.30 : 0;
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayTrades = trades.filter(t => t.date === dateStr);
      const dailyPnl = dayTrades.reduce((sum, t) => sum + t.pnlNet, 0);
      return { 
        date: dateStr, 
        day: dayNum, 
        pnl: dailyPnl, 
        count: dayTrades.length, 
        trades: dayTrades, 
        isViolatingConsistency: dailyPnl > consistencyLimit && dailyPnl > 0 && totalAccountProfit > 0 
      };
    });
  }, [currentMonth, currentYear, trades, consistencyLimit, totalAccountProfit]);

  const monthYearLabel = viewDate.toLocaleString(language === 'ro' ? 'ro-RO' : 'en-US', { month: 'long', year: 'numeric' });

  // Calcul statistici pentru modalul de zi
  const dayStats = useMemo(() => {
    if (!selectedDayData) return null;
    const t = selectedDayData.trades;
    const totalPnlNet = t.reduce((s, x) => s + x.pnlNet, 0);
    const winners = t.filter(x => x.pnlNet > 0).length;
    const losers = t.filter(x => x.pnlNet < 0).length;
    const grossPnl = t.reduce((s, x) => s + x.pnlBrut, 0);
    const commissions = t.reduce((s, x) => s + x.commissions, 0);
    const volume = t.reduce((s, x) => s + x.contracts, 0);
    const winrate = t.length > 0 ? (winners / t.length) * 100 : 0;
    
    const winPnlSum = t.filter(x => x.pnlNet > 0).reduce((s, x) => s + x.pnlNet, 0);
    const lossPnlSum = Math.abs(t.filter(x => x.pnlNet < 0).reduce((s, x) => s + x.pnlNet, 0));
    const profitFactor = lossPnlSum > 0 ? (winPnlSum / lossPnlSum).toFixed(2) : (winPnlSum > 0 ? '99.00' : '0.00');

    let cumulative = 0;
    const chartData = t.slice().reverse().map((trade, idx) => {
        cumulative += trade.pnlNet;
        return { name: `T${idx+1}`, equity: cumulative };
    });
    chartData.unshift({ name: 'Start', equity: 0 });

    const prep = dailyPreps[selectedDayData.date];

    return { totalPnlNet, winners, losers, grossPnl, commissions, volume, winrate, profitFactor, chartData, prep };
  }, [selectedDayData, dailyPreps]);

  const openDayModal = (date: string, dayTrades: Trade[]) => {
    setSelectedDayData({ date, trades: dayTrades });
    setModalView('stats');
    setNoteContent(dailyNotes[date] || '');
  };

  return (
    <div className="bg-[#060b13] border border-slate-800/40 p-8 rounded-[2.5rem] shadow-xl transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">PERFORMANȚĂ CALENDAR</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">{activeAccount ? `CONT ACTIV: ${activeAccount.name}` : 'TOATE CONTURILE'}</p>
        </div>
        <div className="flex items-center space-x-4 bg-black/40 p-2 rounded-2xl border border-slate-800">
           <button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-500 transition-all"><i className="fas fa-chevron-left"></i></button>
           <div className="px-6 text-center min-w-[160px]"><p className="text-xs font-black uppercase tracking-[0.2em] text-white">{monthYearLabel}</p></div>
           <button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-500 transition-all"><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {['LUNI', 'MAR', 'MIE', 'JOI', 'VIN', 'SÂM', 'DUM'].map(d => (<div key={d} className="text-center text-[10px] font-black text-slate-700 uppercase mb-4 tracking-widest">{d}</div>))}
        {Array.from({ length: paddingDays }).map((_, i) => <div key={`p-${i}`} className="min-h-[140px]" />)}
        {days.map(day => (
          <div 
            key={day.day} 
            onClick={() => day.count > 0 && openDayModal(day.date, day.trades)} 
            className={`min-h-[140px] border rounded-3xl p-5 transition-all relative flex flex-col justify-between cursor-pointer group shadow-sm ${
                day.count > 0 
                ? (day.pnl >= 0 ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40') 
                : 'bg-slate-900/10 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className={`text-[11px] font-black ${day.count > 0 ? 'text-white' : 'text-slate-700'}`}>{day.day}</span>
            {day.count > 0 && (
              <div className="space-y-1">
                <p className={`text-sm font-black ${day.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${day.pnl >= 0 ? '' : '-'}{Math.abs(day.pnl).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </p>
                <span className="text-[8px] font-black uppercase text-slate-600 tracking-tighter">{day.count} TRADES</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedDayData && dayStats && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header Modal Dynamic */}
              <div className="p-8 border-b border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0b1222]">
                 <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                        {new Date(selectedDayData.date).toLocaleDateString('ro-RO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace('.', ',')}
                        <span className="mx-4 text-slate-800 font-light">•</span>
                        <span className={dayStats.totalPnlNet >= 0 ? 'text-green-500' : 'text-red-500'}>
                            Net P&L ${dayStats.totalPnlNet.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                        </span>
                    </h2>
                 </div>
                 <div className="flex items-center space-x-3">
                    {modalView === 'stats' && (
                      <button 
                        onClick={() => setModalView('report')}
                        className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center transition-all"
                      >
                        <i className="fas fa-clipboard-list mr-2"></i> View Report
                      </button>
                    )}
                    {modalView === 'report' && (
                      <button 
                        onClick={() => setModalView('stats')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-blue-600/30 transition-all"
                      >
                        <i className="fas fa-chart-bar mr-2"></i> View Stats
                      </button>
                    )}
                    {modalView !== 'note' && (
                      <button 
                        onClick={() => setModalView('note')}
                        className="bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center transition-all"
                      >
                        <i className="far fa-sticky-note mr-2"></i> View note
                      </button>
                    )}
                    {modalView === 'note' && (
                      <button 
                        onClick={() => { onSaveNote(selectedDayData.date, noteContent); setModalView('stats'); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg"
                      >
                        Save
                      </button>
                    )}
                    <button onClick={() => setSelectedDayData(null)} className="text-slate-500 hover:text-white transition-colors ml-4">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0b1222]">
                 
                 {/* VIEW 1: STATS (DASHBOARD) */}
                 {modalView === 'stats' && (
                   <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                        {/* Equity Chart */}
                        <div className="h-[280px] bg-slate-950/40 rounded-3xl p-8 border border-slate-800/50 relative overflow-hidden">
                           <div className="absolute top-6 left-8 z-10">
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">INTRADAY EQUITY CURVE</p>
                           </div>
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={dayStats.chartData}>
                                 <defs>
                                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor={dayStats.totalPnlNet >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.1}/>
                                       <stop offset="95%" stopColor={dayStats.totalPnlNet >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <Area type="monotone" dataKey="equity" stroke={dayStats.totalPnlNet >= 0 ? "#10b981" : "#f43f5e"} strokeWidth={3} fill="url(#equityGrad)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>

                        {/* Grid Metrici */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
                           <StatMetric label="TOTAL TRADES" value={selectedDayData.trades.length} />
                           <StatMetric label="WINNERS" value={dayStats.winners} color="text-green-500" />
                           <StatMetric label="GROSS P&L" value={`$${dayStats.grossPnl.toLocaleString()}`} />
                           <StatMetric label="COMMISSIONS" value={`$${dayStats.commissions.toFixed(2)}`} />
                           <StatMetric label="WINRATE" value={`${dayStats.winrate.toFixed(0)}%`} />
                           <StatMetric label="LOSERS" value={dayStats.losers} color="text-red-500" />
                           <StatMetric label="VOLUME" value={dayStats.volume} />
                           <StatMetric label="PROFIT FACTOR" value={dayStats.profitFactor} />
                        </div>
                      </div>

                      {/* Tabel Tranzacții */}
                      <div className="bg-slate-950/20 border border-slate-800/40 rounded-[2rem] overflow-hidden">
                        <table className="w-full text-left">
                           <thead className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] border-b border-slate-800">
                              <tr>
                                 <th className="px-8 py-5">OPEN TIME</th>
                                 <th className="px-8 py-5">TICKER</th>
                                 <th className="px-8 py-5">SIDE</th>
                                 <th className="px-8 py-5">NET P&L</th>
                                 <th className="px-8 py-5">R-MULTIPLE</th>
                                 <th className="px-8 py-5 text-right">ACTIONS</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800/40">
                              {selectedDayData.trades.map((t) => (
                                 <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">{t.entryTime || '--:--'}</td>
                                    <td className="px-8 py-5"><span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">{t.instrument}</span></td>
                                    <td className="px-8 py-5"><span className={`text-[10px] font-black uppercase tracking-widest ${t.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>{t.type}</span></td>
                                    <td className={`px-8 py-5 text-xs font-black ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>${t.pnlNet >= 0 ? '' : '-'}{Math.abs(t.pnlNet).toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
                                    <td className="px-8 py-5 text-xs font-black text-white">{t.pnlNet >= 0 ? '+' : ''}{Math.round(t.rrRealized)}R</td>
                                    <td className="px-8 py-5 text-right">
                                       <button onClick={() => onDeleteTrade(t.id)} className="text-slate-700 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                   </div>
                 )}

                 {/* VIEW 2: REPORT (DAY PREP DETAILS) */}
                 {modalView === 'report' && (
                   <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Section 0: The Gatekeeper */}
                         <div className="bg-slate-900/20 border border-slate-800/60 rounded-[2rem] p-8">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-8">0. THE GATEKEEPER</h4>
                            <div className="flex items-center space-x-8 mb-10">
                               <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shadow-xl ${dayStats.prep?.gkVerdict === 'Green' ? 'bg-green-600' : 'bg-yellow-500'}`}>
                                  {dayStats.prep?.gkTotalScore || '--'}
                               </div>
                               <div>
                                  <h5 className="text-sm font-black text-white uppercase">VERDICT: {dayStats.prep?.gkVerdict.toUpperCase() || 'NONE'}</h5>
                                  <p className="text-[10px] text-slate-500 font-bold">Scor total din 40 puncte posibile.</p>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-6">
                               <ReportMiniStat label="ENERGY" value={dayStats.prep?.gkPhysicalEnergy || '--'} />
                               <ReportMiniStat label="CLARITY" value={dayStats.prep?.gkMentalClarity || '--'} />
                               <ReportMiniStat label="CALM" value={dayStats.prep?.gkEmotionalCalm || '--'} />
                               <ReportMiniStat label="PROCESS" value={dayStats.prep?.gkProcessConfidence || '--'} />
                            </div>
                         </div>

                         {/* Section 1: Context */}
                         <div className="bg-slate-900/20 border border-slate-800/60 rounded-[2rem] p-8">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-8">1. CONTEXT (MP PROTOCOL)</h4>
                            <div className="grid grid-cols-2 gap-y-8">
                               <ReportMiniStat label="PRICE VS PDRANGE" value={dayStats.prep?.pdValueRelationship || '--'} />
                               <ReportMiniStat label="MARKET CONDITION" value={dayStats.prep?.marketCondition || '--'} />
                               <ReportMiniStat label="ON RANGE VS PDAY" value={dayStats.prep?.onRangeVsPDay || '--'} />
                               <ReportMiniStat label="INVENTORY" value={dayStats.prep?.onInventory || '--'} />
                            </div>
                         </div>

                         {/* Section 2: Hypothesis */}
                         <div className="bg-slate-900/20 border border-slate-800/60 rounded-[2rem] p-8">
                            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-8">2. HYPOTHESIS & SCENARIOS</h4>
                            <div className="grid grid-cols-2 gap-y-8">
                               <ReportMiniStat label="HYPO SETUP" value={dayStats.prep?.setup || '--'} />
                               <ReportMiniStat label="THEN DIRECTION" value={dayStats.prep?.hypoThen || '--'} />
                               <ReportMiniStat label="ZONE OF INTEREST" value={dayStats.prep?.zoneOfInterest || '--'} />
                               <ReportMiniStat label="INVALIDATION" value={dayStats.prep?.invalidationPoint || '--'} />
                            </div>
                         </div>

                         {/* Section 3: Habits */}
                         <div className="bg-slate-900/20 border border-slate-800/60 rounded-[2rem] p-8">
                            <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-8">3. HABITS & REVIEW</h4>
                            <div className="grid grid-cols-2 gap-y-8 mb-8">
                               <div>
                                  <p className="text-[9px] font-black text-slate-600 uppercase mb-2">NO-GO RESPECTED</p>
                                  <span className="flex items-center text-xs font-black text-white">
                                     {dayStats.prep?.habNoGoRespected ? <><i className="fas fa-check text-green-500 mr-2"></i> DA</> : <><i className="fas fa-times text-red-500 mr-2"></i> NU</>}
                                  </span>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-600 uppercase mb-2">JOURNAL COMPLETED</p>
                                  <span className="flex items-center text-xs font-black text-white">
                                     {dayStats.prep?.habJournalCompleted ? <><i className="fas fa-check text-green-500 mr-2"></i> DA</> : <><i className="fas fa-times text-red-500 mr-2"></i> NU</>}
                                  </span>
                               </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800/50">
                               <p className="text-[9px] font-black text-slate-600 uppercase mb-3">LECȚIA ZILEI</p>
                               <p className="text-xs text-slate-400 italic font-medium leading-relaxed">"{dayStats.prep?.pmrDailyLesson || 'Nicio lecție salvată.'}"</p>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}

                 {/* VIEW 3: NOTE (RICH TEXT STYLE) */}
                 {modalView === 'note' && (
                   <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col h-full space-y-6">
                      <div className="flex items-center space-x-6 pb-6 border-b border-slate-800/50">
                         <div className="flex space-x-4 text-slate-500">
                            <button className="hover:text-white transition-colors"><i className="fas fa-expand-arrows-alt"></i></button>
                            <button className="hover:text-white transition-colors"><i className="fas fa-undo"></i></button>
                            <button className="hover:text-white transition-colors"><i className="fas fa-redo"></i></button>
                         </div>
                         <div className="w-px h-5 bg-slate-800"></div>
                         <div className="flex space-x-4 text-slate-500">
                            <i className="fas fa-microphone hover:text-white cursor-pointer"></i>
                            <i className="fas fa-list-ul hover:text-white cursor-pointer"></i>
                            <span className="text-[10px] font-black uppercase flex items-center hover:text-white cursor-pointer">A Arial <i className="fas fa-chevron-down ml-2 text-[8px]"></i></span>
                            <div className="flex space-x-3">
                               <span className="font-bold cursor-pointer hover:text-white">B</span>
                               <span className="italic cursor-pointer hover:text-white">I</span>
                               <span className="underline cursor-pointer hover:text-white">U</span>
                            </div>
                         </div>
                         <button className="ml-auto text-slate-700 hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
                      </div>
                      <textarea 
                        className="flex-1 bg-transparent border-none outline-none resize-none text-slate-300 text-lg leading-relaxed placeholder:text-slate-700 p-4 min-h-[300px]"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Start writing your daily trade review here..."
                        autoFocus
                      />
                   </div>
                 )}
              </div>

              {/* Footer Modal cu butoanele din screenshot */}
              <div className="p-8 border-t border-slate-800/60 flex justify-end items-center space-x-6 bg-[#0b1222] z-20">
                 <button onClick={() => setSelectedDayData(null)} className="text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                    Close
                 </button>
                 <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all active:scale-95">
                    View Full Report
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatMetric = ({ label, value, color = "text-white" }: { label: string, value: any, color?: string }) => (
    <div className="flex flex-col space-y-1">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        <p className={`text-3xl font-black ${color} tracking-tighter`}>{value}</p>
    </div>
);

const ReportMiniStat = ({ label, value }: { label: string, value: any }) => (
  <div>
     <p className="text-[9px] font-black text-slate-600 uppercase mb-1 tracking-tighter">{label}</p>
     <p className="text-xs font-black text-white uppercase">{value}</p>
  </div>
);

export default Calendar;
