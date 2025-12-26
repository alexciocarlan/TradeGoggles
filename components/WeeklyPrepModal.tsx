
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WeeklyPrepData, BiasType, TradeScreenshot } from '../types';
import { Language } from '../translations';

interface WeeklyPrepModalProps {
  onSave: (weekId: string, prep: WeeklyPrepData) => void;
  onClose: () => void;
  initialData?: WeeklyPrepData;
  language: Language;
}

const BIAS_OPTIONS: BiasType[] = ['Neutral', 'Bullish', 'Bearish'];

const WeeklyPrepModal: React.FC<WeeklyPrepModalProps> = ({ onSave, onClose, initialData, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generăm un weekId default (ex: 2024-W42)
  const getWeekId = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  // Calculăm datele zilelor din săptămâna respectivă (Luni - Duminică)
  const weekDates = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustare la Luni
    const startOfWeek = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      return {
        dateStr: dayDate.toISOString().split('T')[0],
        dayName: dayDate.toLocaleDateString('ro-RO', { weekday: 'short' }),
        dayNum: dayDate.getDate()
      };
    });
  }, []);

  const [weekId, setWeekId] = useState(initialData?.id || getWeekId(new Date()));
  const [formData, setFormData] = useState<WeeklyPrepData>(initialData || {
    id: '',
    weeklyBias: 'Neutral',
    pwHigh: '',
    pwLow: '',
    pwPOC: '',
    pwVAH: '',
    pwVAL: '',
    weeklyMacroNotes: '',
    weeklyThemes: [],
    weeklyGoals: '',
    weeklyNarrative: '',
    weeklyScreenshots: [],
    tradingDays: ['2025-01-20', '2025-01-21', '2025-01-22', '2025-01-23', '2025-01-24'], // Default Mon-Fri
    createdAt: new Date().toISOString()
  });

  const toggleTradingDay = (dateStr: string) => {
    setFormData(prev => ({
      ...prev,
      tradingDays: prev.tradingDays.includes(dateStr) 
        ? prev.tradingDays.filter(d => d !== dateStr) 
        : [...prev.tradingDays, dateStr]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesToProcess = Array.from(files).slice(0, 5) as File[];
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          weeklyScreenshots: [...(prev.weeklyScreenshots || []), { url: reader.result as string, caption: '' }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const inputClass = "bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[24px] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#060b13] z-20">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black flex items-center tracking-tight uppercase text-white italic">
               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mr-4 shadow-lg shadow-blue-600/20 not-italic">
                  <i className="fas fa-calendar-week text-sm"></i>
               </div>
              START MY WEEK: MACRO PREPARATION
            </h2>
            <p className="text-[10px] text-slate-500 font-bold ml-14 mt-1 uppercase tracking-widest">Săptămâna: {weekId}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar bg-[#060b13]">
          
          {/* SECTION 0: TRADING DAYS (SCHEDULE) */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-400 font-black border border-emerald-500/20">0</div>
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">OPERATIONAL SCHEDULE: DAYS I WILL TRADE</h3>
            </div>
            
            <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800">
                <div className="grid grid-cols-7 gap-4">
                    {weekDates.map(day => {
                        const isSelected = formData.tradingDays.includes(day.dateStr);
                        const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                        return (
                            <button
                                key={day.dateStr}
                                type="button"
                                onClick={() => toggleTradingDay(day.dateStr)}
                                className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 relative group ${isSelected ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 scale-105' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`}
                            >
                                <span className={`text-[10px] font-black uppercase mb-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{day.dayName}</span>
                                <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-700'}`}>{day.dayNum}</span>
                                {isToday && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 border border-slate-900 shadow-sm shadow-orange-500/50 animate-pulse"></div>
                                )}
                                {isSelected && (
                                    <div className="mt-2 text-[8px] font-black uppercase tracking-tighter text-white/70 animate-pulse">TRADING</div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-6 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                   ⚠️ Platforma va bloca execuția în zilele nebifate pentru a proteja disciplina săptămânală.
                </p>
            </div>
          </section>

          {/* SECTION 1: WEEKLY BIAS & LEVELS */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-black border border-blue-500/20">1</div>
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">WEEKLY BIAS & PW LEVELS</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                    <label className={labelClass}>Weekly Bias</label>
                    <select 
                        className={inputClass} 
                        value={formData.weeklyBias} 
                        onChange={e => setFormData({...formData, weeklyBias: e.target.value as BiasType})}
                    >
                        {BIAS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div><label className={labelClass}>pwHigh</label><input type="text" className={inputClass} value={formData.pwHigh} onChange={e => setFormData({...formData, pwHigh: e.target.value})} placeholder="e.g. 18450" /></div>
                    <div><label className={labelClass}>pwLow</label><input type="text" className={inputClass} value={formData.pwLow} onChange={e => setFormData({...formData, pwLow: e.target.value})} placeholder="e.g. 17920" /></div>
                    <div><label className={labelClass}>pwPOC</label><input type="text" className={inputClass} value={formData.pwPOC} onChange={e => setFormData({...formData, pwPOC: e.target.value})} placeholder="e.g. 18150" /></div>
                    <div><label className={labelClass}>pwVAH</label><input type="text" className={inputClass} value={formData.pwVAH} onChange={e => setFormData({...formData, pwVAH: e.target.value})} placeholder="e.g. 18320" /></div>
                    <div><label className={labelClass}>pwVAL</label><input type="text" className={inputClass} value={formData.pwVAL} onChange={e => setFormData({...formData, pwVAL: e.target.value})} placeholder="e.g. 18010" /></div>
                </div>
            </div>
          </section>

          {/* SECTION 2: MACRO & THEMES */}
          <section className="space-y-8">
             <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-[10px] text-orange-400 font-black border border-orange-500/20">2</div>
              <h3 className="text-sm font-black text-orange-400 uppercase tracking-[0.2em]">MACRO CONTEXT & WEEKLY THEMES</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className={labelClass}>Economic Events / Macro Notes</label>
                        <textarea className={`${inputClass} h-32 resize-none leading-relaxed`} value={formData.weeklyMacroNotes} onChange={e => setFormData({...formData, weeklyMacroNotes: e.target.value})} placeholder="CPI Tuesday, FOMC Thursday..." />
                    </div>
                    <div>
                        <label className={labelClass}>Weekly Narrative</label>
                        <textarea className={`${inputClass} h-32 resize-none leading-relaxed`} value={formData.weeklyNarrative} onChange={e => setFormData({...formData, weeklyNarrative: e.target.value})} placeholder="Market is in a large balance. Looking for breakout above pwHigh..." />
                    </div>
                </div>
                <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[2rem] flex flex-col justify-between">
                    <div>
                        <label className={labelClass}>Weekly Goals & Focus</label>
                        <textarea className={`${inputClass} h-64 bg-transparent border-none p-0 text-lg italic`} value={formData.weeklyGoals} onChange={e => setFormData({...formData, weeklyGoals: e.target.value})} placeholder="1. Stick to my bias. 2. Max 3 trades/day. 3. Journal every session..." />
                    </div>
                    <div className="mt-6 flex items-center space-x-3 opacity-50">
                        <i className="fas fa-lightbulb text-indigo-400"></i>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focus on the process, not the P&L this week.</span>
                    </div>
                </div>
            </div>
          </section>

          {/* SECTION 3: WEEKLY SCREENSHOTS */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-400 font-black border border-emerald-500/20">3</div>
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">WEEKLY CHART ANALYSIS (SCREENSHOTS)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {(formData.weeklyScreenshots || []).map((shot, idx) => (
                 <div key={idx} className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden group relative">
                    <div className="aspect-video bg-black flex items-center justify-center border-b border-slate-800">
                        <img src={shot.url} className="w-full h-full object-contain" alt={`Weekly Chart ${idx + 1}`} />
                        <button onClick={() => setFormData({...formData, weeklyScreenshots: formData.weeklyScreenshots.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all"><i className="fas fa-times text-xs"></i></button>
                    </div>
                    <div className="p-4 bg-slate-900/50">
                      <input type="text" value={shot.caption} onChange={(e) => setFormData({...formData, weeklyScreenshots: formData.weeklyScreenshots.map((s, i) => i === idx ? { ...s, caption: e.target.value } : s)})} className="w-full bg-transparent border-none text-xs text-slate-300 outline-none" placeholder="Add weekly observation..." />
                    </div>
                 </div>
               ))}
               {(formData.weeklyScreenshots?.length || 0) < 5 && (
                 <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 group min-h-[200px]">
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                   <i className="fas fa-camera text-2xl text-slate-700 mb-4 group-hover:text-blue-500 transition-colors"></i>
                   <p className="font-black text-[10px] uppercase tracking-widest text-slate-600">Add Macro / Weekly Chart</p>
                 </div>
               )}
            </div>
          </section>

          <div className="pt-10 flex space-x-6 sticky bottom-0 bg-[#060b13] pb-10 z-20 border-t border-slate-800/50 mt-10">
            <button onClick={onClose} type="button" className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]">Anulează</button>
            <button onClick={() => onSave(weekId, formData)} type="button" className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-2xl shadow-blue-600/30 uppercase tracking-widest text-[10px] active:scale-[0.98]">Salvează Analiza Săptămânală</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPrepModal;
