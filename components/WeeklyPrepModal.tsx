import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WeeklyPrepData, BiasType, TradeScreenshot, WeeklyNewsEvent } from '../types';
import { Language } from '../translations';

interface WeeklyPrepModalProps {
  onSave: (weekId: string, prep: WeeklyPrepData) => void;
  onClose: () => void;
  initialData?: WeeklyPrepData;
  language: Language;
  selectedDate?: string; // Dată opțională pentru a forța o anumită săptămână (Backtesting)
}

const BIAS_OPTIONS: BiasType[] = ['Neutral', 'Bullish', 'Bearish'];
const PRICE_VS_PWEEK_OPTIONS = ['None', 'inside pwRange', 'outside pwRange', 'inside pwVA', 'outside pwVA'];

const NEWS_DIRECTORY = {
    tier1: [
        'Fed Interest Rate decision', 'Fed press conference', 'CPI MoM', 'Inflation rate YoY', 
        'Inflation rate MoM', 'Core Inflation Rate MoM', 'Core Inflation Rate YoY', 
        'None Farm Payrolls', 'Unemployment Rate', 'FOMC Economic Projection'
    ],
    tier2: [
        'GDP MoM', 'GDP YoY', 'GDP Grow Rate QoQ', 'GDP Grow Rate YoY', 'GDP Grow Rate MoM',
        'Retail sales MoM', 'Core PCE Price Index MoM', 'Personal spending MoM',
        'Personal income MoM', 'FOMC minutes', 'Fed Chair Speech', 'Fed Chair Testimony'
    ],
    tier3: [
        'ISM manufacturing PMI', 'ISM services PMI', 'PPI MoM', 'Michigan Consumer Sentiment',
        'JOLTs Job openings', 'Durable Goods Orders MoM', 'Building Permits', 'House Starts',
        'Existing Home Sales'
    ],
    tier4: ['Inauguration Day', 'Gov Shut down']
};

const NEWS_HOURS = ['15:30', '17:00', '19:30', '21:00', '21:30', '22:00'];

const getWeekId = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const WeeklyPrepModal: React.FC<WeeklyPrepModalProps> = ({ onSave, onClose, initialData, language, selectedDate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDayForNews, setActiveDayForNews] = useState<string | null>(null);
  
  // Determinăm data de bază: cea primită prin props (Backtest) sau data de azi
  const baseDate = useMemo(() => selectedDate ? new Date(selectedDate) : new Date(), [selectedDate]);
  
  const weekId = useMemo(() => initialData?.id || getWeekId(baseDate), [initialData, baseDate]);

  const weekDates = useMemo(() => {
    const d = new Date(baseDate);
    const day = d.getDay();
    // Calculăm luni pentru săptămâna datei de bază
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
  }, [baseDate]);

  const [formData, setFormData] = useState<WeeklyPrepData>(initialData || {
    id: weekId,
    weeklyBias: 'Neutral',
    priceVsPWeek: 'None',
    pwHigh: '', pwLow: '', pwPOC: '', pwVAH: '', pwVAL: '',
    weeklyMacroNotes: '', weeklyThemes: [], weeklyGoals: '', weeklyNarrative: '',
    weeklyScreenshots: [], tradingDays: [], dayNews: {},
    createdAt: new Date().toISOString()
  });

  // Dacă se schimbă initialData (de ex. userul schimbă simDate în spate), resetăm formularul
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
        setFormData({
            id: weekId,
            weeklyBias: 'Neutral',
            priceVsPWeek: 'None',
            pwHigh: '', pwLow: '', pwPOC: '', pwVAH: '', pwVAL: '',
            weeklyMacroNotes: '', weeklyThemes: [], weeklyGoals: '', weeklyNarrative: '',
            weeklyScreenshots: [], tradingDays: [], dayNews: {},
            createdAt: new Date().toISOString()
        });
    }
  }, [initialData, weekId]);

  const toggleTradingDay = (dateStr: string) => {
    setFormData(prev => ({
      ...prev,
      tradingDays: prev.tradingDays.includes(dateStr) 
        ? prev.tradingDays.filter(d => d !== dateStr) 
        : [...prev.tradingDays, dateStr]
    }));
  };

  const addNewsToDay = (dateStr: string, event: string, tier: number, time: string) => {
    const currentDayNews = formData.dayNews?.[dateStr] || [];
    const newEvent: WeeklyNewsEvent = { event, tier, time };
    
    setFormData(prev => ({
        ...prev,
        dayNews: {
            ...prev.dayNews,
            [dateStr]: [...currentDayNews, newEvent]
        }
    }));
  };

  const removeNewsFromDay = (dateStr: string, index: number) => {
    const currentDayNews = formData.dayNews?.[dateStr] || [];
    const updated = currentDayNews.filter((_, i) => i !== index);
    
    setFormData(prev => ({
        ...prev,
        dayNews: {
            ...prev.dayNews,
            [dateStr]: updated
        }
    }));
  };

  const getDayGlowClasses = (dateStr: string) => {
    const news = formData.dayNews?.[dateStr] || [];
    if (news.length === 0) return 'border-slate-800';
    
    const minTier = Math.min(...news.map(n => n.tier));
    if (minTier === 1) return 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.45)] scale-105 z-10';
    if (minTier === 2) return 'border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.45)] scale-105 z-10';
    if (minTier === 3) return 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.45)] scale-105 z-10';
    if (minTier === 4) return 'border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.45)] scale-105 z-10';
    
    return 'border-slate-800';
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

  const inputClass = "bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all cursor-pointer appearance-none";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[24px] w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#060b13] z-20">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black flex items-center tracking-tight uppercase text-white italic">
               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mr-4 shadow-lg shadow-blue-600/20 not-italic">
                  <i className="fas fa-calendar-week text-sm"></i>
               </div>
              WEEKLY ANCHOR: MACRO CALIBRATION
            </h2>
            <p className="text-[10px] text-slate-500 font-bold ml-14 mt-1 uppercase tracking-widest">Săptămâna: {weekId}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar bg-[#060b13]">
          
          <section className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-400 font-black border border-emerald-500/20">0</div>
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">OPERATIONAL SCHEDULE: RISK & NEWS MAP</h3>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]"></div><span className="text-[8px] font-black text-slate-500 uppercase">Max Impact</span></div>
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_orange]"></div><span className="text-[8px] font-black text-slate-500 uppercase">High</span></div>
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_yellow]"></div><span className="text-[8px] font-black text-slate-500 uppercase">Medium</span></div>
                </div>
            </div>
            
            <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800">
                <div className="grid grid-cols-7 gap-6">
                    {weekDates.map(day => {
                        const isTrading = formData.tradingDays.includes(day.dateStr);
                        const news = formData.dayNews?.[day.dateStr] || [];
                        const glowClass = getDayGlowClasses(day.dateStr);

                        return (
                            <div key={day.dateStr} className="flex flex-col space-y-3">
                                <button
                                    type="button"
                                    onClick={() => toggleTradingDay(day.dateStr)}
                                    className={`flex flex-col items-center p-5 rounded-3xl border transition-all duration-500 relative group ${
                                        isTrading ? 'bg-blue-600 border-opacity-60' : 'bg-slate-950/60 opacity-60 hover:opacity-100'
                                    } ${glowClass}`}
                                >
                                    <span className={`text-[9px] font-black uppercase mb-1 ${isTrading ? 'text-blue-100' : 'text-slate-500'}`}>{day.dayName}</span>
                                    <span className={`text-2xl font-black ${isTrading ? 'text-white' : 'text-white/60'}`}>{day.dayNum}</span>
                                    {isTrading && <div className="mt-2 text-[7px] font-black uppercase tracking-tighter text-white/70 animate-pulse">TRADING DAY</div>}
                                </button>
                                
                                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 min-h-[80px] flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[8px] font-black text-slate-600 uppercase">Expected News</span>
                                        <button 
                                            onClick={() => setActiveDayForNews(day.dateStr)}
                                            className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            <i className="fas fa-plus text-[8px]"></i>
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        {news.map((n, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded border border-slate-800 group/item">
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className={`text-[7px] font-black truncate max-w-[60px] ${n.tier === 1 ? 'text-red-400' : n.tier === 2 ? 'text-orange-400' : n.tier === 3 ? 'text-yellow-400' : n.tier === 4 ? 'text-indigo-400' : 'text-slate-400'}`}>{n.event.toUpperCase()}</span>
                                                    <span className="text-[6px] text-slate-600 font-bold">{n.time}</span>
                                                </div>
                                                <button onClick={() => removeNewsFromDay(day.dateStr, idx)} className="opacity-0 group-hover/item:opacity-100 transition-opacity"><i className="fas fa-times text-[7px] text-red-500"></i></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800/50 flex justify-center">
                    <div className="bg-orange-600/5 border border-orange-500/20 px-10 py-3 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.1)] animate-pulse">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] italic drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">
                           Days I am fully available to trade
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {activeDayForNews && (
            <div className="bg-[#0b1222] border border-slate-800 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Add Events for {activeDayForNews}</h4>
                        <p className="text-[9px] text-slate-500 font-bold italic">Select category, hour and event name</p>
                    </div>
                    <button onClick={() => setActiveDayForNews(null)} className="bg-slate-900 p-2 rounded-xl text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { title: 'I. Maximum Impact', tier: 1, list: NEWS_DIRECTORY.tier1, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { title: 'II. High Impact', tier: 2, list: NEWS_DIRECTORY.tier2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                        { title: 'III. Medium Impact', tier: 3, list: NEWS_DIRECTORY.tier3, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                        { title: 'IV. Variable Impact', tier: 4, list: NEWS_DIRECTORY.tier4, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
                    ].map(category => (
                        <div key={category.tier} className={`p-4 rounded-2xl border border-slate-800/60 ${category.bg}`}>
                            <h5 className={`text-[9px] font-black uppercase tracking-widest mb-4 ${category.color}`}>{category.title}</h5>
                            <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                {category.list.map(evt => (
                                    <div key={evt} className="flex flex-col space-y-2 pb-3 mb-2 border-b border-slate-800/40 last:border-0">
                                        <p className="text-[9px] font-bold text-slate-300 leading-tight">{evt}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {NEWS_HOURS.map(h => (
                                                <button 
                                                    key={h}
                                                    onClick={() => addNewsToDay(activeDayForNews, evt, category.tier, h)}
                                                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[7px] font-black text-slate-500 hover:border-blue-500 hover:text-white transition-all"
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          <section className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-black border border-blue-500/20">1</div>
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">WEEKLY BIAS & PW LEVELS</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div>
                        <label className={labelClass}>Weekly Bias</label>
                        <select 
                            className={inputClass} 
                            value={formData.weeklyBias} 
                            onChange={e => setFormData({...formData, weeklyBias: e.target.value as BiasType})}
                        >
                            {BIAS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Price vs pWeek</label>
                        <select 
                            className={inputClass} 
                            value={formData.priceVsPWeek} 
                            onChange={e => setFormData({...formData, priceVsPWeek: e.target.value})}
                        >
                            {PRICE_VS_PWEEK_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
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
                </div>
            </div>
          </section>

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
            <button onClick={onClose} type="button" className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]">Anulează</button>
            <button onClick={() => onSave(formData.id, formData)} type="button" className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-2xl shadow-blue-600/30 uppercase tracking-widest text-[10px] active:scale-95">Salvează Analiza Săptămânală</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPrepModal;