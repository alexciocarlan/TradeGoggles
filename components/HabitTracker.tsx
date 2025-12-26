
import React, { useMemo, useState } from 'react';
import { DailyPrepData } from '../types';
import { Language } from '../translations';

/* Added language to HabitTrackerProps to fix TypeScript error in App.tsx */
interface HabitTrackerProps {
  dailyPreps: Record<string, DailyPrepData>;
  language: Language;
}

const HABITS = [
  { label: 'Respectat "No-Go" Rule?', key: 'habNoGoRespected' },
  { label: 'Analiză Pre-Market completă?', key: 'habPreMarketDone' },
  { label: 'Zero erori Stop Loss?', key: 'habStopLossRespected' },
  { label: 'Fără Revenge Trading?', key: 'habNoRevengeTrading' },
  { label: 'Jurnal completat?', key: 'habJournalCompleted' },
];

const HabitTracker: React.FC<HabitTrackerProps> = ({ dailyPreps, language }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const currentWeekDays = useMemo(() => {
    const startOfWeek = new Date(viewDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Start with Monday
    startOfWeek.setDate(diff);

    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        dateStr,
        dayName: d.toLocaleDateString('ro-RO', { weekday: 'long' }),
        prep: dailyPreps[dateStr]
      };
    });
  }, [viewDate, dailyPreps]);

  const handlePrevWeek = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 7);
    setViewDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + 7);
    setViewDate(d);
  };

  const exportToCSV = () => {
    const headers = ['Data', ...HABITS.map(h => h.label), 'Nota Disciplina'];
    // Fix: Explicitly type the map callback arguments to resolve 'unknown' type error on 'data'.
    const rows = Object.entries(dailyPreps).map(([date, data]: [string, DailyPrepData]) => [
      date,
      ...HABITS.map(h => data[h.key as keyof DailyPrepData] ? 'DA' : 'NU'),
      data.habDisciplineScore
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "habit_tracker_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">III. TRACKER-UL DE OBICEIURI ZILNICE</h3>
            <p className="text-slate-500 text-xs font-bold uppercase mt-1">Obiectivul este un lanț neîntrerupt de "X"-uri</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button onClick={handlePrevWeek} className="p-2 text-slate-400 hover:text-white"><i className="fas fa-chevron-left"></i></button>
                <span className="px-4 py-2 text-[10px] font-black uppercase text-white self-center">Săptămâna Curentă</span>
                <button onClick={handleNextWeek} className="p-2 text-slate-400 hover:text-white"><i className="fas fa-chevron-right"></i></button>
             </div>
             <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all border border-slate-700">
                <i className="fas fa-table mr-2"></i> Exportă în Foi de calcul
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="px-6 py-4 text-left w-64">Obicei</th>
                {currentWeekDays.map(day => (
                  <th key={day.dateStr} className="px-6 py-4 text-center">
                    {day.dayName}<br/>
                    <span className="text-slate-600 font-bold">{day.dateStr}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {HABITS.map(habit => (
                <tr key={habit.key} className="hover:bg-slate-900/30 transition-colors group">
                  <td className="px-6 py-6 text-sm font-black text-slate-300 group-hover:text-white">{habit.label}</td>
                  {currentWeekDays.map(day => {
                    const isDone = day.prep?.[habit.key as keyof DailyPrepData];
                    return (
                      <td key={day.dateStr} className="px-6 py-6 text-center">
                        <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center border transition-all ${
                          day.prep 
                            ? isDone 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                              : 'bg-red-500/10 border-red-500/30 text-red-500'
                            : 'bg-slate-800/50 border-slate-800 text-slate-700'
                        }`}>
                          {day.prep ? (isDone ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>) : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-slate-950/50">
                <td className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-400">Nota Disciplinei (1-10)</td>
                {currentWeekDays.map(day => (
                   <td key={day.dateStr} className="px-6 py-6 text-center">
                      <span className="text-xl font-black text-emerald-500">
                        {day.prep?.habDisciplineScore || '--'}
                      </span>
                   </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2rem]">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Insight-uri Post-Market Review</h4>
              <div className="space-y-4">
                  {currentWeekDays.map(day => day.prep && (
                    <div key={day.dateStr} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-blue-400 uppercase">{day.dayName}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${day.prep.pmrTradedPlan === 'DA' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                PLAN RESPECTAT: {day.prep.pmrTradedPlan}
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"Lecție: {day.prep.pmrDailyLesson || 'Nicio notă înregistrată'}"</p>
                    </div>
                  ))}
                  {!currentWeekDays.some(d => d.prep) && <p className="text-xs text-slate-600 italic">Nicio dată înregistrată pentru această săptămână.</p>}
              </div>
          </div>
          
          <div className="bg-indigo-600 p-8 rounded-[2rem] text-white flex flex-col justify-between relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Consistență Săptămânală</h4>
                <p className="text-4xl font-black">
                   {currentWeekDays.filter(d => d.prep?.habJournalCompleted).length}/5 Zile
                </p>
                <p className="text-xs font-bold mt-4 opacity-80 leading-relaxed">
                   Continuă să completezi jurnalul zilnic pentru a dezvolta o disciplină de fier. 
                   Orice bifă verde te aduce mai aproape de profitabilitate.
                </p>
             </div>
             <i className="fas fa-medal absolute -bottom-10 -right-10 text-[180px] opacity-10 rotate-12"></i>
          </div>
      </div>
    </div>
  );
};

export default HabitTracker;
