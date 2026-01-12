
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WeeklyPrepData, BiasType, TradeScreenshot, WeeklyNewsEvent, WeeklyOTF, WeekOpenType, ValueRelationship, StructureQuality, VolumeTrend } from '../types';
import { useAppStore } from '../AppContext';
import NewsEventPickerModal from './NewsEventPickerModal';

interface WeeklyPrepModalProps {
  isOpen?: boolean;
  onSave: (weekId: string, prep: WeeklyPrepData) => void;
  onClose: () => void;
  initialData?: WeeklyPrepData;
  selectedDate?: string;
}

const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

const getWeekId = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const WeeklyPrepModal: React.FC<WeeklyPrepModalProps> = ({ isOpen, onSave, onClose, initialData, selectedDate }) => {
  const baseDate = useMemo(() => selectedDate ? new Date(selectedDate) : new Date(), [selectedDate]);
  const currentWeekId = useMemo(() => getWeekId(baseDate), [baseDate]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const language = useAppStore(state => state.language);

  const [formData, setFormData] = useState<WeeklyPrepData>(initialData || {
    id: currentWeekId, weeklyBias: 'Neutral', priceVsPWeek: 'None', pwClosePosition: 'None',
    pwHigh: '', pwLow: '', pwPOC: '', pwVAH: '', pwVAL: '',
    weeklyMacroNotes: '', weeklyThemes: [], weeklyGoals: '', weeklyNarrative: '',
    weeklyScreenshots: [], tradingDays: [], dayNews: {}, 
    weeklyOTF: 'None', weekOpenType: 'None', weeklyPocDivergence: 'None',
    // New V5.0 defaults
    valueRelationship: 'None', structureHigh: 'Secure', structureLow: 'Secure', volumeTrend: 'Average',
    matrixScore: 0, matrixRegime: 'UNDEFINED', matrixTags: [],
    createdAt: new Date().toISOString()
  });

  const [newsPickerDate, setNewsPickerDate] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      return {
        full: dayDate.toISOString().split('T')[0],
        short: dayDate.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase(),
        day: dayDate.getDate()
      };
    });
  }, [baseDate]);

  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);

  // --- AMT LOGIC V5.0: OPTIMIZED MATRIX SCORE ---
  const matrixCalculation = useMemo(() => {
    let score = 0;
    const tags: string[] = [];

    // --- PASUL 2: FUNDAMENTE STRUCTURALE (The Heavy Lifters) ---
    
    // A. Weekly OTF (Contextul Major)
    if (formData.weeklyOTF === 'OTF Up') {
        score += 2;
    } else if (formData.weeklyOTF === 'OTF Down') {
        score -= 2;
    }
    // Balance = 0 pct

    // B. Open Type (Energia Inițială)
    if (formData.weekOpenType === 'Gap Up' || formData.weekOpenType === 'Open Drive Up') {
        score += 2;
    } else if (formData.weekOpenType === 'Gap Down' || formData.weekOpenType === 'Open Drive Down') {
        score -= 2;
    }
    // Inside/Balance = 0 pct

    // --- PASUL 3: MIGRAREA VALORII (Busola) ---
    if (formData.valueRelationship === 'Higher') {
        score += 1;
    } else if (formData.valueRelationship === 'Lower') {
        score -= 1;
    }
    // Unchanged = 0 pct

    // --- PASUL 4: CONDITIONAL LOGIC (Rafinamentele AMT) ---
    // AICI SE REZOLVĂ PROBLEMA "POOR HIGH/LOW"

    // Regula: Poor High este Bullish (+1) DOAR dacă Valoarea NU scade.
    if (formData.structureHigh === 'Poor') {
        if (formData.valueRelationship === 'Higher' || formData.valueRelationship === 'Unchanged') {
            score += 1; // Magnet valid
        } else {
            // Nu facem nimic. Într-un trend Down, Poor High e irelevant pentru bias-ul de moment.
            tags.push("Weak Structure Above");
        }
    }

    // Regula: Poor Low este Bearish (-1) DOAR dacă Valoarea NU crește.
    if (formData.structureLow === 'Poor') {
        if (formData.valueRelationship === 'Lower' || formData.valueRelationship === 'Unchanged') {
            score -= 1; // Magnet valid
        } else {
            tags.push("Weak Structure Below");
        }
    }

    // --- PASUL 5: VALIDAREA PRIN VOLUM ---
    // Volumul confirmă doar direcția curentă a valorii
    if (formData.volumeTrend === 'Increasing') {
        if (score > 0 && formData.valueRelationship === 'Higher') {
            score += 0.5; // Confirmare Bullish
        } else if (score < 0 && formData.valueRelationship === 'Lower') {
            score -= 0.5; // Confirmare Bearish
        }
        // Dacă volumul crește dar prețul nu se mișcă (Divergență), nu acordăm puncte automat.
    }

    // --- PASUL 6: GESTIONAREA CONFLICTELOR & ȘTIRILOR ---
    
    // Detectare Conflict Major (OTF vs Gap)
    // Ex: Trend Major UP (+2) dar Gap DOWN (-2) = Scor 0, dar e un "0 violent", nu pașnic.
    const isConflict = (
        (formData.weeklyOTF === 'OTF Up' && (formData.weekOpenType === 'Gap Down' || formData.weekOpenType === 'Open Drive Down')) ||
        (formData.weeklyOTF === 'OTF Down' && (formData.weekOpenType === 'Gap Up' || formData.weekOpenType === 'Open Drive Up'))
    );

    if (isConflict) {
        tags.push("CONFLICT: Volatility Exp");
    }

    // Modificator Știri (Tier 3)
    let hasHighImpactNews = false;
    if (formData.dayNews) {
        Object.values(formData.dayNews).forEach((dayEvents: WeeklyNewsEvent[]) => {
            if (dayEvents.some(e => e.tier === 3)) hasHighImpactNews = true;
        });
    }
    
    if (hasHighImpactNews) {
        tags.push("POROUS VALUE / HI-VOL");
        // NOTĂ: Nu modificăm scorul numeric, doar comportamentul așteptat.
    }

    // --- DETERMINARE REGIM ---
    let regime = 'BALANCE / ROTATION';
    if (score >= 4) regime = 'STRONG TREND UP';
    else if (score <= -4) regime = 'STRONG TREND DOWN';
    else if (score >= 2) regime = 'MODERATE BULLISH';
    else if (score <= -2) regime = 'MODERATE BEARISH';

    return { score, regime, tags };
  }, [
    formData.weeklyOTF, 
    formData.weekOpenType, 
    formData.valueRelationship, 
    formData.structureHigh,
    formData.structureLow,
    formData.volumeTrend,
    formData.dayNews
  ]);

  // Update effect to synchronize calculated metrics with form data
  // Prevents loops by checking strict equality before setting state
  useEffect(() => {
      if (
          formData.matrixScore !== matrixCalculation.score || 
          formData.matrixRegime !== matrixCalculation.regime ||
          JSON.stringify(formData.matrixTags) !== JSON.stringify(matrixCalculation.tags)
      ) {
          setFormData(prev => ({ 
              ...prev, 
              matrixScore: matrixCalculation.score, 
              matrixRegime: matrixCalculation.regime,
              matrixTags: matrixCalculation.tags
          }));
      }
  }, [matrixCalculation.score, matrixCalculation.regime, matrixCalculation.tags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData.id, formData);
    onClose();
  };

  const toggleTradingDay = (date: string) => {
    const current = formData.tradingDays || [];
    const exists = current.includes(date);
    setFormData({
        ...formData,
        tradingDays: exists ? current.filter(d => d !== date) : [...current, date]
    });
  };

  const handleAddNewsEvent = (event: WeeklyNewsEvent) => {
    if (!newsPickerDate) return;
    const currentNews = formData.dayNews || {};
    const dayEvents = currentNews[newsPickerDate] || [];
    const existingIndex = dayEvents.findIndex(e => e.event === event.event && e.time === event.time);
    let updatedEvents = [];
    if (existingIndex > -1) updatedEvents = dayEvents.filter((_, i) => i !== existingIndex);
    else updatedEvents = [...dayEvents, event];

    setFormData({ ...formData, dayNews: { ...currentNews, [newsPickerDate]: updatedEvents } });
  };

  const removeNewsEvent = (date: string, index: number) => {
    const currentNews = formData.dayNews || {};
    const dayEvents = [...(currentNews[date] || [])];
    dayEvents.splice(index, 1);
    setFormData({ ...formData, dayNews: { ...currentNews, [date]: dayEvents } });
  };

  const inputClass = "bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all font-bold";
  const labelClass = "text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-[0.2em]";
  const sectionTitleClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[3rem] w-full max-w-[1050px] max-h-[96vh] overflow-hidden flex flex-col shadow-[0_0_120px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
        
        <div className="px-10 py-8 border-b border-slate-800/40 flex justify-between items-center bg-[#060b13] shrink-0">
          <div className="flex items-center space-x-5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
               <i className="fas fa-calendar-alt text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">WEEKLY ANCHOR (V5.0 AMT)</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">SĂPTĂMÂNA: {formData.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-2 transition-colors"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar bg-[#03070c] flex-1">
          
          {/* STEP 0: CALENDAR WITH AUTO-VOLATILITY DETECTION */}
          <section>
             <div className="flex justify-between items-center mb-8">
                <h4 className={sectionTitleClass}><span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mr-3 text-[9px]">0</span> OPERATIONAL SCHEDULE: RISK & NEWS MAP</h4>
                {matrixCalculation.tags.includes("POROUS VALUE / HI-VOL") && (
                    <div className="bg-red-600/10 border border-red-500/30 px-4 py-2 rounded-xl flex items-center space-x-3 animate-pulse">
                        <i className="fas fa-bolt-lightning text-red-500 text-xs"></i>
                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">High Volatility Detected</span>
                    </div>
                )}
             </div>

             <div className="bg-[#0b1222]/20 border border-slate-800/60 p-8 rounded-[3rem] space-y-8 shadow-inner">
                <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day) => {
                        const isTrading = formData.tradingDays?.includes(day.full);
                        const news = formData.dayNews?.[day.full] || [];
                        const isHighImpactDay = news.some(e => e.tier === 3);
                        return (
                            <div key={day.full} className="space-y-4">
                                <div 
                                    onClick={() => toggleTradingDay(day.full)}
                                    className={`aspect-[1/1.2] rounded-[2rem] border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${isTrading ? 'bg-blue-600/10 border-blue-500/50 shadow-xl' : 'bg-slate-950 border-slate-800/50 opacity-40 hover:opacity-100'} ${isHighImpactDay ? 'border-red-500/40 ring-1 ring-red-500/20' : ''}`}
                                >
                                    <span className="text-[8px] font-black text-slate-500 uppercase mb-1">{day.short}</span>
                                    <span className={`text-2xl font-black ${isTrading ? 'text-white' : 'text-slate-600'}`}>{day.day}</span>
                                </div>
                                <div className="space-y-2">
                                    {news.map((n, idx) => (
                                        <div key={idx} className="relative group/nitem">
                                            <div className={`p-2 rounded-lg border text-[8px] font-black uppercase ${n.tier === 3 ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : n.tier === 2 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
                                                <span className="block opacity-60 mb-0.5">{n.time}</span>
                                                {n.event}
                                            </div>
                                            <button onClick={() => removeNewsEvent(day.full, idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[7px] opacity-0 group-hover/nitem:opacity-100 transition-opacity">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setNewsPickerDate(day.full)}
                                        className="w-full py-2 bg-slate-950/50 border border-slate-800/50 rounded-lg text-[7px] font-black text-slate-600 hover:text-blue-400 transition-all flex items-center justify-center space-x-2 uppercase"
                                    >
                                        <span>Add News</span>
                                        <i className="fas fa-plus-circle"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
          </section>

          {/* STEP 1: CONTEXT MATRIX & BIAS (V5.0) */}
          <section>
             <h4 className={sectionTitleClass}><span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center mr-3 text-[9px]">1</span> MATRIX SCORING V5.0 (AMT OPTIMIZED)</h4>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-8 bg-slate-900/10 border border-slate-800/60 p-8 rounded-[2.5rem] space-y-8">
                    {/* PRIMARY DRIVERS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>1. WEEKLY OTF (Trend)</label>
                            <select value={formData.weeklyOTF} onChange={e => setFormData({...formData, weeklyOTF: e.target.value as any})} className={inputClass}>
                                <option value="None">None</option>
                                <option value="OTF Up">OTF Up (Trend)</option>
                                <option value="OTF Down">OTF Down (Trend)</option>
                                <option value="Balance">Balance</option>
                                <option value="Inside Week">Inside Week</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>2. WEEK OPEN TYPE (Initiative)</label>
                            <select value={formData.weekOpenType} onChange={e => setFormData({...formData, weekOpenType: e.target.value as any})} className={inputClass}>
                                <option value="None">None</option>
                                <option value="Gap Up">Gap Up</option>
                                <option value="Open Drive Up">Open Drive Up</option>
                                <option value="Gap Down">Gap Down</option>
                                <option value="Open Drive Down">Open Drive Down</option>
                                <option value="Open Outside Value">Open Outside Value</option>
                                <option value="Open Inside Value">Open Inside Value</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800/50">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">STRUCTURE & VOLUME VALIDATION</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>3. VALUE RELATIONSHIP</label>
                                <select value={formData.valueRelationship} onChange={e => setFormData({...formData, valueRelationship: e.target.value as any})} className={inputClass}>
                                    <option value="None">None</option>
                                    <option value="Higher">Higher (Trend Up)</option>
                                    <option value="Lower">Lower (Trend Down)</option>
                                    <option value="Unchanged">Unchanged/Overlap</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>4a. HIGH STRUCTURE</label>
                                <select value={formData.structureHigh} onChange={e => setFormData({...formData, structureHigh: e.target.value as any})} className={inputClass}>
                                    <option value="Secure">Secure (Finished)</option>
                                    <option value="Poor">Poor (Magnet if Bullish)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>4b. LOW STRUCTURE</label>
                                <select value={formData.structureLow} onChange={e => setFormData({...formData, structureLow: e.target.value as any})} className={inputClass}>
                                    <option value="Secure">Secure (Finished)</option>
                                    <option value="Poor">Poor (Magnet if Bearish)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className={labelClass}>5. VOLUME TREND</label>
                                <select value={formData.volumeTrend} onChange={e => setFormData({...formData, volumeTrend: e.target.value as any})} className={inputClass}>
                                    <option value="Average">Average / Decreasing</option>
                                    <option value="Increasing">Increasing (Validation)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>WEEKLY BIAS (Manual)</label>
                                <select value={formData.weeklyBias} onChange={e => setFormData({...formData, weeklyBias: e.target.value as any})} className={inputClass}>
                                    <option value="Neutral">Neutral</option>
                                    <option value="Bullish">Bullish</option>
                                    <option value="Bearish">Bearish</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className={`bg-[#0b1222] border p-8 rounded-[2.5rem] shadow-xl text-center relative overflow-hidden flex-1 flex flex-col justify-center transition-all duration-500 ${matrixCalculation.tags.length > 0 ? 'border-orange-500/40' : 'border-slate-800'}`}>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">MATRIX V5.0 SCORE</p>
                            <p className={`text-6xl font-black italic tracking-tighter mb-2 ${matrixCalculation.score > 0 ? 'text-green-500' : matrixCalculation.score < 0 ? 'text-red-500' : 'text-slate-200'}`}>
                                {matrixCalculation.score > 0 ? '+' : ''}{matrixCalculation.score}
                            </p>
                            <div className={`inline-block px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-[0.2em] ${
                                matrixCalculation.regime.includes('TREND') ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                                {matrixCalculation.regime}
                            </div>
                        </div>
                        <i className="fas fa-calculator absolute -bottom-6 -right-6 text-[120px] text-white/[0.02] rotate-12 pointer-events-none"></i>
                    </div>

                    <div className="bg-slate-900/10 border border-slate-800/60 p-6 rounded-[2rem] space-y-4 shadow-inner">
                         <div className="flex items-center space-x-2 mb-2">
                             <i className="fas fa-tags text-orange-500 text-[10px]"></i>
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active System Tags</p>
                         </div>
                         <div className="space-y-2">
                            {matrixCalculation.tags.length > 0 ? matrixCalculation.tags.map((tag, idx) => (
                                <div key={idx} className={`text-[9px] font-black uppercase px-3 py-2 rounded-lg border ${tag.includes('CONFLICT') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                    {tag}
                                </div>
                            )) : (
                                <p className="text-[10px] text-slate-500 italic">No warnings detected.</p>
                            )}
                         </div>
                    </div>
                </div>
             </div>
          </section>

          {/* STEP 2: NARRATIVE */}
          <section>
             <h4 className={sectionTitleClass}><span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-500 flex items-center justify-center mr-3 text-[9px]">2</span> MACRO CONTEXT & WEEKLY THEMES</h4>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className={labelClass}>ECONOMIC EVENTS / MACRO NOTES</label>
                        <textarea className={`${inputClass} h-36 resize-none leading-relaxed italic`} placeholder="CPI Tuesday, FOMC Thursday..." value={formData.weeklyMacroNotes} onChange={e => setFormData({...formData, weeklyMacroNotes: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}>WEEKLY NARRATIVE</label>
                        <textarea className={`${inputClass} h-36 resize-none leading-relaxed italic`} placeholder="Market is in a large balance..." value={formData.weeklyNarrative} onChange={e => setFormData({...formData, weeklyNarrative: e.target.value})} />
                    </div>
                </div>
                <div className="relative group h-full">
                    <label className={labelClass}>WEEKLY GOALS & FOCUS</label>
                    <div className="bg-[#0b1222]/40 border border-slate-800/60 p-10 rounded-[3rem] h-[calc(100%-30px)] shadow-xl">
                        <textarea className="w-full h-full bg-transparent border-none outline-none text-slate-300 text-sm italic font-medium leading-relaxed resize-none" placeholder="1. Stick to my bias..." value={formData.weeklyGoals} onChange={e => setFormData({...formData, weeklyGoals: e.target.value})} />
                    </div>
                </div>
             </div>
          </section>

          <div className="pt-10 flex space-x-6 sticky bottom-0 bg-[#060b13] pb-10 z-20 border-t border-slate-800/50 mt-10">
            <button onClick={onClose} className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.4em] transition-all">ANULEAZĂ</button>
            <button onClick={handleSubmit} className="flex-[3] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98]">SALVEAZĂ ANALIZA SĂPTĂMÂNALĂ</button>
          </div>
        </div>
      </div>

      {newsPickerDate && (
        <NewsEventPickerModal
          isOpen={!!newsPickerDate}
          onClose={() => setNewsPickerDate(null)}
          onAddEvent={handleAddNewsEvent}
          date={newsPickerDate}
          existingEvents={formData.dayNews?.[newsPickerDate] || []}
        />
      )}
    </div>
  );
};

export default WeeklyPrepModal;
