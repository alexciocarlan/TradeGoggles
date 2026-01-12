import React, { useMemo, useState, useEffect } from 'react';
import { Trade } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

const Calendar: React.FC = () => {
  // OPTIMIZATION: Consolidated selectors with useShallow
  const { trades, accounts, selectedAccountId, dailyPreps, language, loadDailyPreps, loadDailyNotes } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    accounts: state.accounts || [],
    selectedAccountId: state.selectedAccountId,
    dailyPreps: state.dailyPreps || {},
    language: state.language,
    loadDailyPreps: state.loadDailyPreps,
    loadDailyNotes: state.loadDailyNotes
  })));

  const activeTrades = useMemo(() => {
    const safeTrades = Array.isArray(trades) ? trades : [];
    if (selectedAccountId === 'all') return safeTrades;
    return safeTrades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);
  
  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<{ date: string, trades: Trade[] } | null>(null);
  
  useEffect(() => {
    const month = viewDate.toISOString().substring(0, 7);
    loadDailyPreps(month);
    loadDailyNotes(month);
  }, [viewDate, loadDailyPreps, loadDailyNotes]);

  const totalAccountProfit = useMemo(() => activeTrades.reduce((sum, t) => sum + t.pnlNet, 0), [activeTrades]);
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
      const dayTrades = activeTrades.filter(t => t.date === dateStr);
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
  }, [currentMonth, currentYear, activeTrades, consistencyLimit, totalAccountProfit]);

  const monthYearLabel = viewDate.toLocaleString(language === 'ro' ? 'ro-RO' : 'en-US', { month: 'long', year: 'numeric' });

  const dayDetails = useMemo(() => {
    if (!selectedDayData) return null;
    const t = selectedDayData.trades;
    const prep = dailyPreps[selectedDayData.date];
    
    const totalPnl = t.reduce((s, x) => s + x.pnlNet, 0);
    const winCount = t.filter(x => x.status === 'WIN').length;
    const winRate = t.length > 0 ? (winCount / t.length) * 100 : 0;
    
    const inPlanCount = t.filter(x => x.isAccordingToPlan === 'DA').length;
    const avgDiscipline = t.length > 0 ? t.reduce((s, x) => s + x.disciplineScore, 0) / t.length : 0;
    const avgDuration = t.length > 0 ? t.reduce((s, x) => s + (x.durationMinutes || 0), 0) / t.length : 0;
    
    const sessions = Array.from(new Set(t.filter(x => x.pnlNet > 0).map(x => x.session.toUpperCase())));
    const topSetup = t.length > 0 ? [...t].sort((a, b) => b.pnlNet - a.pnlNet)[0]?.setup : '--';
    
    const d = new Date(selectedDayData.date);
    const dayName = d.toLocaleDateString('ro-RO', { weekday: 'long' }).toUpperCase();
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase();

    return { 
        totalPnl, winCount, winRate, inPlanCount, avgDiscipline, avgDuration, 
        sessions, topSetup, dayName, dayNum, monthName, prep 
    };
  }, [selectedDayData, dailyPreps]);

  const openDayModal = (date: string, dayTrades: Trade[]) => {
    setSelectedDayData({ date, trades: dayTrades });
  };

  const labelStyle = "text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3";
  const valueStyle = "text-xl font-black text-white leading-none";

  return (
    <div className="bg-[#060b13] border border-slate-800/40 p-8 rounded-[2.5rem] shadow-xl transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">PERFORMANȚĂ CALENDAR</h3>
          <div className="flex items-center space-x-3 mt-1.5">
            <div className={`w-2 h-2 rounded-full ${activeAccount ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                {activeAccount ? `ANALIZĂ CONT: ${activeAccount.name}` : 'PERSPECTIVĂ GLOBALĂ (TOATE CONTURILE)'}
            </p>
          </div>
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
            <div className="flex justify-between items-start">
               <span className={`text-[11px] font-black ${day.count > 0 ? 'text-white' : 'text-slate-700'}`}>{day.day}</span>
               {day.isViolatingConsistency && (
                 <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" title="Consistency Rule Breach (>30%)"></div>
               )}
            </div>
            {day.count > 0 && (
              <div className="space-y-1">
                <p className={`text-sm font-black ${day.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${day.pnl >= 0 ? '' : '-'}{Math.abs(day.pnl).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </p>
                <span className="text-[8px] font-black uppercase text-slate-600 tracking-tighter">{day.count} TRADES</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedDayData && dayDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              
              <div className="p-10 pb-6 border-b border-slate-800/60 bg-[#0b1222] flex justify-between items-center">
                 <div className="flex items-center space-x-8">
                    <div className="flex flex-col items-center justify-center bg-red-900/20 border border-red-500/20 w-12 h-12 rounded-2xl">
                       <span className="text-[7px] font-black text-red-500 mb-0.5 tracking-tighter">{dayDetails.monthName}..</span>
                       <span className="text-xl font-black text-white leading-none">{dayDetails.dayNum}</span>
                    </div>
                    <div>
                       <div className="flex items-center space-x-4">
                          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">{dayDetails.dayName}</h3>
                          <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase">
                              <span>{selectedDayData.trades.length} TRADES</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mx-1"></span>
                              <span className={dayDetails.winRate >= 50 ? 'text-blue-400' : 'text-red-400'}>{dayDetails.winRate.toFixed(0)}% WIN RATE</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center space-x-12">
                    <div className="text-right">
                       <p className={`text-4xl font-black italic tracking-tighter ${dayDetails.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {dayDetails.totalPnl >= 0 ? '+' : '-'}${Math.abs(dayDetails.totalPnl).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                       </p>
                       <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1">NET P&L</p>
                    </div>
                    <button onClick={() => setSelectedDayData(null)} className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                       <i className="fas fa-times text-xl"></i>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 bg-[#060b13]">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1">
                      <div className="px-4">
                         <p className={labelStyle}>IN PLAN TRADES</p>
                         <p className={valueStyle}>{dayDetails.inPlanCount}/{selectedDayData.trades.length}</p>
                         <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">CONFORM STRATEGIEI</p>
                      </div>
                      <div className="px-4 border-l border-slate-800/40">
                         <p className={labelStyle}>GATEKEEPER SCORE</p>
                         <div className="flex flex-col">
                            <span className={`text-xl font-black ${dayDetails.prep ? 'text-blue-500' : 'text-slate-800'}`}>
                                {dayDetails.prep?.gkTotalScore || '--'}
                            </span>
                            <p className="text-[8px] font-bold text-slate-600 uppercase">/ 100</p>
                         </div>
                      </div>
                      <div className="px-4 border-l border-slate-800/40">
                         <p className={labelStyle}>AVG DISCIPLINE</p>
                         <div className="flex items-center space-x-1 mb-2">
                            {[1,2,3,4,5].map(s => <i key={s} className={`fas fa-star text-[10px] ${s <= Math.round(dayDetails.avgDiscipline) ? 'text-yellow-500' : 'text-slate-800'}`}></i>)}
                         </div>
                         <p className="text-[10px] font-black text-white">{dayDetails.avgDiscipline.toFixed(1)} / 5.0</p>
                      </div>
                      <div className="px-4 border-l border-slate-800/40">
                         <p className={labelStyle}>CORRECTION PLANS</p>
                         <div className="space-y-1">
                            {Array.from(new Set(selectedDayData.trades.filter(t => t.correctionPlan && t.correctionPlan !== 'None').map(t => t.correctionPlan))).slice(0,1).map(p => (
                                <p key={p} className="text-[8px] font-black text-blue-400 uppercase truncate">{p}</p>
                            ))}
                            {selectedDayData.trades.every(t => !t.correctionPlan || t.correctionPlan === 'None') && <p className="text-[9px] font-bold text-slate-600 uppercase">NONE DEFINED</p>}
                         </div>
                      </div>
                      <div className="px-4 border-l border-slate-800/40">
                         <p className={labelStyle}>WINNING SESSIONS</p>
                         {dayDetails.sessions.length > 0 ? dayDetails.sessions.map(s => <p key={s} className="text-[9px] font-black text-white uppercase">{s}</p>) : <p className="text-[9px] text-slate-700">---</p>}
                      </div>
                      <div className="px-4 border-l border-slate-800/40">
                         <p className={labelStyle}>TOP SETUPS (PNL)</p>
                         <p className="text-[9px] font-black text-emerald-500 uppercase">#1 {dayDetails.topSetup || 'NONE'}</p>
                      </div>
                      <div className="px-4 border-l border-slate-800/40">
                         <p className={labelStyle}>AVG DURATION</p>
                         <p className={valueStyle}>{Math.round(dayDetails.avgDuration)} min</p>
                         <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">PER TRADE</p>
                      </div>
                  </div>

                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">LECȚIA ZILEI</p>
                      <p className="text-sm font-medium text-slate-300 italic">"{dayDetails.prep?.pmrDailyLesson || 'Nicio lecție salvată încă.'}"</p>
                  </div>

                  <div className="space-y-2">
                      <div className="grid grid-cols-4 px-4 pb-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                         <span>TIME</span>
                         <span>INSTRUMENT</span>
                         <span>SETUP</span>
                         <span className="text-right">PNL NET</span>
                      </div>
                      <div className="space-y-1">
                          {selectedDayData.trades.map((t) => (
                            <div key={t.id} className="grid grid-cols-4 px-4 py-5 bg-[#0b1222]/40 border border-slate-800/30 rounded-2xl items-center hover:border-slate-700 transition-all">
                                <span className="text-[10px] font-bold text-slate-500 italic">{t.entryTime || '--:--'}</span>
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs font-black text-white">{t.instrument}</span>
                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${t.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{t.type}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase truncate pr-4">{t.setup || 'MANUAL EXEC'}</span>
                                <span className={`text-right text-sm font-black ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.pnlNet >= 0 ? '+' : '-'}${Math.abs(t.pnlNet).toLocaleString()}
                                </span>
                            </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="p-10 border-t border-slate-800/50 bg-[#0b1222] flex justify-end">
                 <button onClick={() => setSelectedDayData(null)} className="bg-slate-800 hover:bg-slate-700 text-white font-black px-12 py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl">ÎNCHIDE ANALIZA</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;