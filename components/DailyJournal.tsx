
import React, { useMemo, useState } from 'react';
/* Import useNavigate to fix the 'navigate' undefined error on line 493 */
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, LineChart, Line } from 'recharts';
import { Trade, Account, DailyPrepData, WeeklyPrepData, ExecutionErrorType, Playbook } from '../types';
import DailyPrepModal from './DailyPrepModal';
import WeeklyPrepModal from './WeeklyPrepModal';
import DecisionFunnelModal from './DecisionFunnelModal';
import { Language, translations } from '../translations';
import PlaybookDetailModal from './PlaybookDetailModal';

interface DailyJournalProps {
  trades: Trade[];
  accounts: Account[];
  dailyNotes: Record<string, string>;
  onSaveNote: (date: string, note: string) => void;
  dailyPreps: Record<string, DailyPrepData>;
  weeklyPreps: Record<string, WeeklyPrepData>;
  onSavePrep: (date: string, prep: DailyPrepData) => void;
  onSaveWeeklyPrep: (weekId: string, prep: WeeklyPrepData) => void;
  playbooks: Playbook[];
  language: Language;
}

const DayCard = ({ date, trades, isExpanded, onToggle, onViewNote, hasNote, language, prep }: any) => {
  const d = new Date(date);
  const dayName = d.toLocaleDateString('ro-RO', { weekday: 'long' });
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString('ro-RO', { month: 'short' });
  
  const totalPnl = trades.reduce((sum: number, t: any) => sum + t.pnlNet, 0);
  const winCount = trades.filter((t: any) => t.status === 'WIN').length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  const stats = useMemo(() => {
    if (trades.length === 0) return null;
    const totalTrades = trades.length;
    const plannedTrades = trades.filter((t: any) => t.isPartOfPlan).length;
    const avgDiscipline = trades.reduce((s: number, t: any) => s + (t.disciplineScore || 0), 0) / trades.length;
    const avgDuration = trades.reduce((s: number, t: any) => s + (t.durationMinutes || 0), 0) / trades.length;
    const uniquePlans = Array.from(new Set(trades.map((t: any) => t.correctionPlan as string).filter((p: any) => p && p !== 'None'))) as string[];
    const winSessions = Array.from(new Set(trades.filter((t: any) => t.status === 'WIN').map((t: any) => t.session as string))) as string[];
    const topSetup = trades.sort((a: any, b: any) => b.pnlNet - a.pnlNet)[0]?.setup || '--';
    
    return { totalTrades, plannedTrades, avgDiscipline, avgDuration, uniquePlans, winSessions, topSetup };
  }, [trades]);

  return (
    <div className="bg-[#0b1222]/40 border border-slate-800/40 rounded-3xl overflow-hidden mb-4 transition-all">
      <div 
        className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-slate-800/20"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-8">
           <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center justify-center bg-red-500/10 border border-red-500/20 w-12 h-12 rounded-xl">
                 <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">{monthName}.</span>
                 <span className="text-lg font-black text-red-500">{dayNum}</span>
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">{dayName}</h3>
                 <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{trades.length} TRADES</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{winRate.toFixed(0)}% WIN RATE</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center space-x-12">
          <div className="text-right">
             <p className={`text-2xl font-black ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString()}
             </p>
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">NET P&L</p>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={(e) => { e.stopPropagation(); onViewNote(); }} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${hasNote ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>
                <i className="far fa-sticky-note"></i>
             </button>
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'rotate-180 text-blue-500' : 'text-slate-600'}`}>
                <i className="fas fa-chevron-down"></i>
             </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8 bg-slate-950/20 p-6 rounded-[2rem] border border-slate-800/30">
              <div className="flex flex-col border-r border-slate-800/50 pr-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2">IN PLAN TRADES</p>
                 <p className="text-3xl font-black flex items-baseline">
                    <span className="text-orange-500">{stats?.plannedTrades || 0}</span>
                    <span className="text-slate-800 mx-1">/</span>
                    <span className="text-slate-600">{stats?.totalTrades || 0}</span>
                 </p>
                 <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">CONFORM STRATEGIEI</p>
              </div>
              <div className="flex flex-col border-r border-slate-800/50 px-4 items-center">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2 self-start">GATEKEEPER SCORE</p>
                 <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg ${prep?.gkVerdict === 'Green' ? 'bg-green-600' : prep?.gkVerdict === 'Yellow' ? 'bg-yellow-500' : 'bg-red-600'}`}>
                    {prep?.gkTotalScore || '--'}
                 </div>
                 <p className="text-[7px] font-bold text-slate-800 mt-1">/ 40</p>
              </div>
              <div className="flex flex-col border-r border-slate-800/50 px-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2">AVG DISCIPLINE</p>
                 <div className="flex space-x-0.5 mb-1">
                    {[1,2,3,4,5].map(s => <i key={s} className={`fas fa-star text-[10px] ${s <= (stats?.avgDiscipline || 0) ? 'text-yellow-500' : 'text-slate-800'}`}></i>)}
                 </div>
                 <p className="text-xs font-black text-white">{(stats?.avgDiscipline || 0).toFixed(1)} / 5.0</p>
              </div>
              <div className="flex flex-col border-r border-slate-800/50 px-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2">CORRECTION PLANS</p>
                 <div className="space-y-1">
                    {stats?.uniquePlans.map((p, i) => (
                       <div key={i} className="relative group/plan">
                          <p className="text-[7px] font-bold text-blue-400 uppercase leading-tight flex items-center truncate max-w-[100px] cursor-help">
                             <span className="w-1 h-1 bg-blue-500 rounded-full mr-1 shrink-0"></span> {p}
                          </p>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/plan:block z-50 animate-in fade-in zoom-in-95 duration-200">
                             <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-2xl">
                                <p className="text-[8px] font-black text-white uppercase whitespace-nowrap">{p}</p>
                                <div className="absolute top-full left-4 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                             </div>
                          </div>
                       </div>
                    )) || <p className="text-[7px] text-slate-700">NONE</p>}
                 </div>
              </div>
              <div className="flex flex-col border-r border-slate-800/50 px-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2">WINNING SESSIONS</p>
                 <p className="text-[8px] font-black text-white uppercase">{stats?.winSessions[0] || '--'}</p>
              </div>
              <div className="flex flex-col border-r border-slate-800/50 px-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2">TOP SETUPS (PNL)</p>
                 <div className="relative group/top">
                    <p className="text-[7px] font-black text-green-500 uppercase truncate max-w-[100px] cursor-help">#1 {stats?.topSetup}</p>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/top:block z-50 animate-in fade-in zoom-in-95 duration-200">
                       <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-2xl">
                          <p className="text-[9px] font-black text-white uppercase whitespace-nowrap">{stats?.topSetup}</p>
                          <div className="absolute top-full left-4 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex flex-col px-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2">AVG DURATION</p>
                 <p className="text-sm font-black text-white">{Math.round(stats?.avgDuration || 0)} min</p>
                 <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">PER TRADE</p>
              </div>
           </div>

           <div className="grid grid-cols-1 mb-8">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 relative group/lesson">
                 <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1.5">LECȚIA ZILEI</p>
                 <p className="text-xs text-slate-300 italic font-medium leading-relaxed line-clamp-2 cursor-help">
                    "{prep?.pmrDailyLesson || 'Nicio lecție salvată încă.'}"
                 </p>
                 {prep?.pmrDailyLesson && (
                    <div className="absolute bottom-full left-0 mb-3 hidden group-hover/lesson:block z-[60] w-full max-w-lg">
                       <div className="bg-slate-950 border border-slate-700 p-4 rounded-2xl shadow-2xl ring-1 ring-white/10">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Full Lesson Data</p>
                          <p className="text-xs text-slate-200 leading-relaxed italic">"{prep.pmrDailyLesson}"</p>
                          <div className="absolute top-full left-8 w-3 h-3 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1.5"></div>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800/50">
                  <tr><th className="py-4">TIME</th><th className="py-4">INSTRUMENT</th><th className="py-4">SETUP</th><th className="py-4 text-right">PNL NET</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {trades.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 text-[10px] font-bold text-slate-500">{t.entryTime || '--'}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                           <span className="text-xs font-black text-white">{t.instrument}</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${t.type === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{t.type}</span>
                        </div>
                      </td>
                      <td className="py-4">
                         <div className="relative group/tsetup">
                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px] block cursor-help">{t.setup}</span>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tsetup:block z-50 animate-in fade-in zoom-in-95 duration-200">
                               <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-2xl">
                                  <p className="text-[9px] font-black text-white uppercase whitespace-nowrap">{t.setup}</p>
                                  <div className="absolute top-full left-4 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className={`py-4 text-xs font-black text-right ${t.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>${t.pnlNet.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

const MiniCalendar = ({ trades, onDateSelect, selectedDate }: any) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const ds = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTrades = trades.filter((t: any) => t.date === ds);
    const dayPnl = dayTrades.reduce((s: number, t: any) => s + t.pnlNet, 0);
    return { dateStr: ds, dayNum: d, hasTrades: dayTrades.length > 0, dayPnl };
  });

  return (
    <div className="bg-[#0b1222] border border-slate-800/40 rounded-[2.5rem] p-8 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
           {currentMonth.toLocaleString('ro-RO', { month: 'long', year: 'numeric' }).toUpperCase()}
        </h4>
        <div className="flex space-x-4">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="text-slate-600 hover:text-white"><i className="fas fa-chevron-left text-xs"></i></button>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="text-slate-600 hover:text-white"><i className="fas fa-chevron-right text-xs"></i></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (<div key={i} className="text-[9px] font-black text-slate-800 text-center mb-3">{d}</div>))}
        {Array.from({ length: paddingDays }).map((_, i) => <div key={`p-${i}`} />)}
        {days.map(day => (
          <button 
            key={day.dayNum} onClick={() => onDateSelect(day.dateStr)}
            className={`h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-black transition-all relative ${selectedDate === day.dateStr ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : day.hasTrades ? (day.dayPnl >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500') : 'text-slate-600 hover:bg-slate-800/50'}`}
          >
            {day.dayNum}
            {day.hasTrades && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-500"></div>}
          </button>
        ))}
      </div>
    </div>
  );
};

const ActivatedSetupsWidget = ({ dayPrep, playbooks, onSelectPlaybook }: any) => {
    const suggested = useMemo(() => {
        if (!dayPrep) return [];
        const names = new Set<string>();
        
        if (dayPrep.pdValueRelationship === 'GAP') {
            names.add('The GAP & Go'); names.add('The GAP Fill'); names.add('The Half-Gap Fill');
        } else if (dayPrep.pdValueRelationship === 'OutsideVA') {
            names.add('The 80% Rule'); names.add('Failed Auction');
        } else if (dayPrep.pdValueRelationship === 'InsideRange' || dayPrep.pdValueRelationship === 'InBalance') {
            names.add('Inside Value Fade'); names.add('Inside Day Breakout');
        }
        if (dayPrep.pdExtremes !== 'None') names.add('Poor High/Low Repair');
        if (dayPrep.priorVPOC === 'naked') names.add('Naked POC Magnet');
        if (dayPrep.spHigh || dayPrep.spLow) names.add('Single Prints Fill');
        if (dayPrep.marketCondition === 'Trend') {
            names.add('Trend Day'); names.add('D-Period Expansion');
        } else if (dayPrep.marketCondition === 'Bracket') {
            names.add('3-Day Balance Break'); names.add('Inside Day Breakout');
        }
        return playbooks.filter((pb: any) => names.has(pb.name));
    }, [dayPrep, playbooks]);

    if (!dayPrep) return null;

    return (
        <div className="bg-[#0b1222] border border-slate-800/40 rounded-[2.5rem] p-8 shadow-xl mt-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <i className="fas fa-filter text-xs"></i>
                </div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Activated Setups</h4>
            </div>

            <div className="space-y-3">
                {suggested.length > 0 ? suggested.map((pb: any) => (
                    <div 
                        key={pb.id} 
                        onClick={() => onSelectPlaybook(pb)}
                        className="group p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-blue-500/50 hover:bg-slate-900/60 cursor-pointer transition-all shadow-inner"
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-xl group-hover:scale-110 transition-transform">{pb.icon}</span>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-tight">{pb.name}</p>
                                <p className="text-[8px] text-blue-400 font-bold uppercase tracking-tighter">{pb.entryAt}</p>
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 text-[7px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">READY</div>
                    </div>
                )) : (
                    <div className="py-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] italic">No setups matched for this context</p>
                    </div>
                )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800/50">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center justify-center">
                    <i className="fas fa-robot mr-2 text-blue-500"></i>
                    AI STRATEGIC ADVISORY
                </p>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic text-center">
                    "Focalizează-te pe execuțiile din acest grup pentru a maximiza probabilitatea de succes conform contextului {dayPrep.mediumTermTrend}."
                </p>
            </div>
        </div>
    );
};

const DailyJournal: React.FC<DailyJournalProps> = ({ trades, accounts, dailyNotes, onSaveNote, dailyPreps, weeklyPreps, onSavePrep, onSaveWeeklyPrep, playbooks, language }) => {
  /* Initialize navigate hook to fix the undefined error on line 493 */
  const navigate = useNavigate();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showNoteEditor, setShowNoteEditor] = useState<string | null>(null);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [showWeeklyPrepModal, setShowWeeklyPrepModal] = useState(false);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const tradesByDate = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    trades.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [trades]);

  // Statistici Dashboard
  const dashboardStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const gkTrend = last7Days.map(date => ({
        date,
        score: dailyPreps[date]?.gkTotalScore || 20
    }));

    const allErrors: ExecutionErrorType[] = trades.filter(t => t.executionError !== 'None').map(t => t.executionError);
    const errorCounts: Record<string, number> = {};
    allErrors.forEach(err => errorCounts[err] = (errorCounts[err] || 0) + 1);
    const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const activePlans = Array.from(new Set(trades.filter(t => t.correctionPlan !== 'None').map(t => t.correctionPlan))).slice(0, 2);

    return { gkTrend, topErrors, activePlans };
  }, [trades, dailyPreps]);

  const currentWeekId = useMemo(() => {
    const d = new Date();
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }, []);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header Dashboard section */}
      <div className="flex items-center space-x-2 mb-4">
        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Day Prep</h1>
        <span className="text-slate-800 text-2xl font-light">|</span>
        <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest">Toate Conturile</h2>
      </div>

      {/* Stats Grid Superior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Trend Gatekeeper */}
         <div className="bg-[#0b1222]/60 border border-slate-800/40 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-10">Trend Gatekeeper (Ultimele 7 zile)</h4>
            <div className="h-32 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardStats.gkTrend}>
                     <defs>
                        <linearGradient id="gkGrad" x1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fill="url(#gkGrad)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-6">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Top Erori (7 Zile)</h4>
                <div className="space-y-2">
                   {dashboardStats.topErrors.map(([err, count], i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                         <span className="text-[10px] font-bold text-slate-300">{err}</span>
                         <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded border border-red-500/20">x{count}</span>
                      </div>
                   ))}
                </div>
            </div>
         </div>

         {/* Planuri de Corecție */}
         <div className="bg-[#0b1222]/60 border border-slate-800/40 p-8 rounded-[2rem] shadow-xl">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-10">Planuri de Corecție Active</h4>
            <div className="space-y-4 mb-10">
               {dashboardStats.activePlans.map((plan, i) => (
                  <div key={i} className="flex items-center space-x-3 text-blue-400">
                     <i className="fas fa-shield-halved text-xs"></i>
                     <span className="text-[9px] font-black uppercase tracking-tight">{plan}</span>
                  </div>
               ))}
               {dashboardStats.activePlans.length === 0 && <p className="text-[9px] text-slate-700 italic">Niciun plan activ.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Ziua de Aur</p>
                  <p className="text-xs font-black text-green-500 uppercase">Luni</p>
                  <p className="text-[9px] font-bold text-slate-500">$0</p>
               </div>
               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-2">Ora Câștigătoare</p>
                  <p className="text-xs font-black text-blue-400 uppercase">--</p>
                  <p className="text-[9px] font-bold text-slate-500">0 Winners</p>
               </div>
            </div>
         </div>

         {/* Setup-uri Câștigătoare */}
         <div className="bg-[#0b1222]/60 border border-slate-800/40 p-8 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-center">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-10 self-start">Setup-uri Câștigătoare</h4>
            <p className="text-[10px] text-slate-700 font-bold italic">Insufficient data for setup stats.</p>
         </div>
      </div>

      {/* Main Content & Buttons */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-6">
           <div className="flex items-center space-x-4 mb-4">
              <button onClick={() => setShowFunnelModal(true)} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 flex items-center">
                <i className="fas fa-filter mr-2"></i> Step 1. Decision Funnel
              </button>
              <button onClick={() => setShowWeeklyPrepModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center">
                <i className="fas fa-calendar-week mr-2"></i> Step 2. Start my week
              </button>
              <button onClick={() => setShowPrepModal(true)} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20 flex items-center">
                <i className="fas fa-check-circle mr-2"></i> Step 3. Start my day
              </button>
              <button onClick={() => setShowPrepModal(true)} className="bg-slate-800/50 hover:bg-slate-800 text-slate-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700/50 flex items-center">
                <i className="fas fa-history mr-2"></i> Step 4. Prior days analysis
              </button>
           </div>

           <div className="flex justify-end space-x-3 mb-2 px-4">
              <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white flex items-center">
                <i className="fas fa-bars-staggered mr-2"></i> Restrânge tot
              </button>
              <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white flex items-center">
                <i className="fas fa-expand mr-2"></i> Extinde tot
              </button>
           </div>

           {tradesByDate.map(([date, dayTrades]) => (
              <DayCard 
                key={date} date={date} trades={dayTrades} isExpanded={expandedDays[date]}
                onToggle={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))}
                onViewNote={() => { setCurrentNote(dailyNotes[date] || ''); setShowNoteEditor(date); }}
                hasNote={!!dailyNotes[date]} language={language} prep={dailyPreps[date]}
              />
           ))}
        </div>

        <div className="w-full lg:w-[320px] no-print">
           <MiniCalendar trades={trades} onDateSelect={setSelectedCalendarDate} selectedDate={selectedCalendarDate} />
           <ActivatedSetupsWidget 
             dayPrep={dailyPreps[selectedCalendarDate]} 
             playbooks={playbooks} 
             onSelectPlaybook={(pb: any) => setSelectedPlaybook(pb)} 
           />
        </div>
      </div>

      {showNoteEditor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
           <div className="bg-[#0b1222] border border-slate-800 rounded-[32px] w-full max-w-4xl p-8 flex flex-col shadow-2xl">
              <h2 className="text-xl font-black text-white mb-6 uppercase">Daily Note: {showNoteEditor}</h2>
              <textarea className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white min-h-[400px] outline-none" value={currentNote} onChange={e => setCurrentNote(e.target.value)} placeholder="Notează observațiile zilei aici..." />
              <div className="mt-8 flex justify-end space-x-4">
                 <button onClick={() => setShowNoteEditor(null)} className="px-6 py-2 text-slate-500 font-black uppercase text-xs">Anulează</button>
                 <button onClick={() => { onSaveNote(showNoteEditor, currentNote); setShowNoteEditor(null); }} className="bg-blue-600 px-10 py-3 rounded-xl text-white font-black uppercase text-xs shadow-lg">Salvează Nota</button>
              </div>
           </div>
        </div>
      )}

      {selectedPlaybook && (
        <PlaybookDetailModal 
            playbook={selectedPlaybook} 
            trades={trades} 
            onClose={() => setSelectedPlaybook(null)}
            onEdit={(id) => navigate(`/playbooks/edit/${id}`)}
        />
      )}

      {showPrepModal && <DailyPrepModal playbooks={playbooks} language={language} onClose={() => setShowPrepModal(false)} onSave={(d, p) => { onSavePrep(d, p); setShowPrepModal(false); }} />}
      {showWeeklyPrepModal && <WeeklyPrepModal initialData={weeklyPreps[currentWeekId]} language={language} onClose={() => setShowWeeklyPrepModal(false)} onSave={(wid, p) => { onSaveWeeklyPrep(wid, p); setShowWeeklyPrepModal(false); }} />}
      {showFunnelModal && <DecisionFunnelModal onClose={() => setShowFunnelModal(false)} />}
    </div>
  );
};

export default DailyJournal;
