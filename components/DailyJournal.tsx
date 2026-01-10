
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyPrepData, WeeklyPrepData, Playbook } from '../types';
import DailyPrepModal from './DailyPrepModal';
import WeeklyPrepModal from './WeeklyPrepModal';
import DecisionFunnelModal from './DecisionFunnelModal';
import StrategySelectionModal from './StrategySelectionModal';
import TraderCheckupModal from './TraderCheckupModal';
import { PreFightSequenceModal } from './PreFightSequenceModal';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import StrategicAlignmentCockpit from './StrategicAlignmentCockpit';

// --- SUB-COMPONENTS ---

const ProtocolStage = ({ step, label, icon, active, completed, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 min-w-[200px] p-5 rounded-2xl border transition-all duration-500 group relative overflow-hidden flex items-center space-x-4 ${
      completed 
      ? 'bg-emerald-500/5 border-emerald-500/30' 
      : active
        ? 'bg-blue-600/5 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
        : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/20'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
      completed ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
    }`}>
      <i className={`fas ${completed ? 'fa-check' : icon} text-xs`}></i>
    </div>
    <div className="text-left">
      <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">STAGE {step}</p>
      <p className={`text-[10px] font-black uppercase tracking-tight ${completed ? 'text-emerald-400' : active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{completed ? 'VALIDATED' : label}</p>
    </div>
  </button>
);

const OperationalHorizon = ({ tradingDays, weekDays, dayNews }: { tradingDays: string[], weekDays: any[], dayNews: any }) => (
  <div className="bg-[#0b1222]/40 border border-slate-800/60 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
      <div className="flex items-center space-x-3 mb-8">
          <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><i className="fas fa-calendar-week text-[10px]"></i></div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">WEEKLY OPERATIONAL HORIZON</h4>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {weekDays.map((day) => {
          const isTrading = tradingDays?.includes(day.full);
          const hasNews = dayNews?.[day.full]?.length > 0;
          const isToday = day.full === new Date().toISOString().split('T')[0];
          
          return (
            <div key={day.full} className={`flex-1 min-w-[80px] p-6 rounded-2xl border transition-all relative ${
                isToday ? 'bg-blue-600/10 border-blue-500/40 shadow-lg' : 
                isTrading ? 'bg-slate-900/60 border-slate-800' : 'opacity-20 border-transparent grayscale'
            }`}>
               <p className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest text-center">{day.short}</p>
               <p className={`text-2xl font-black text-center leading-none mb-2 ${isToday ? 'text-blue-400' : 'text-white'}`}>{day.day}</p>
               {hasNews && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mx-auto shadow-[0_0_8px_red]"></div>}
               {isToday && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
            </div>
          );
        })}
      </div>
  </div>
);

const BiologicalSync = ({ prep }: { prep?: DailyPrepData }) => (
  <div className="flex items-center justify-between bg-slate-900/20 p-8 rounded-[2.5rem] border border-slate-800/40 shadow-xl">
      <div className="flex items-center space-x-6">
          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all duration-1000 ${prep?.gkVerdict === 'Green' ? 'bg-emerald-600 shadow-emerald-500/20' : prep?.gkVerdict === 'Yellow' ? 'bg-orange-500' : 'bg-slate-800'}`}>
              <i className="fas fa-heart-pulse text-2xl"></i>
          </div>
          <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">LIVE BIOLOGICAL SYNC</p>
              <h4 className={`text-2xl font-black italic tracking-tighter uppercase leading-none ${prep?.gkVerdict === 'Green' ? 'text-emerald-500' : 'text-white'}`}>
                {prep?.gkVerdict === 'Green' ? 'GREEN MODE' : prep?.gkVerdict === 'Yellow' ? 'CAUTION MODE' : 'OFFLINE'} 
                <span className="text-slate-700 ml-4 border-l border-slate-800 pl-4">{prep?.gkTotalScore || '--'}/100</span>
              </h4>
          </div>
      </div>
      <div className="hidden lg:flex space-x-12">
          <div className="text-right">
              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">SLEEP ANALYSIS</p>
              <p className="text-xl font-black text-white italic">{prep?.gkSleepHours || '--'} HOURS</p>
          </div>
          <div className="text-right">
              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">HRV CALIBRATION</p>
              <p className="text-xl font-black text-white italic">{prep?.gkHRVValue || '--'} MS</p>
          </div>
      </div>
  </div>
);

const NewsTicker = ({ dayNews, activeDate }: { dayNews: any, activeDate: string }) => {
  const news = dayNews?.[activeDate] || [];
  return (
    <div className="bg-[#0b1222]/80 border border-slate-800 p-6 rounded-[2rem] shadow-xl space-y-6">
       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
          <i className="fas fa-bullhorn text-blue-500 mr-3 text-[10px]"></i> ȘTIRI RELEVANTE
       </h4>
       <div className="space-y-3">
          {news.length > 0 ? news.map((n: any, i: number) => (
            <div key={i} className={`p-4 rounded-xl border flex justify-between items-center transition-all hover:translate-x-1 ${n.tier === 3 ? 'bg-red-500/10 border-red-500/30 text-red-400' : n.tier === 2 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              <span className="text-[9px] font-black">{n.time}</span>
              <span className="text-[9px] font-black uppercase tracking-tight truncate ml-3">{n.event}</span>
            </div>
          )) : (
            <div className="py-8 text-center opacity-20 italic">
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">SCAN AREA CLEAR // NO IMPACT EVENTS</p>
            </div>
          )}
       </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface DailyJournalProps {
  onSavePrep: (date: string, prep: DailyPrepData) => void;
  onSaveWeeklyPrep: (weekId: string, prep: WeeklyPrepData) => void;
  onSaveNote: (date: string, note: string) => void;
}

const DailyJournal: React.FC<DailyJournalProps> = ({ onSavePrep, onSaveWeeklyPrep, onSaveNote }) => {
  const { dailyPreps, weeklyPreps, playbooks, loadDailyPreps, loadWeeklyPreps, loadPlaybooks } = useAppStore(useShallow(state => ({
    dailyPreps: state.dailyPreps,
    weeklyPreps: state.weeklyPreps,
    playbooks: state.playbooks,
    loadDailyPreps: state.loadDailyPreps,
    loadWeeklyPreps: state.loadWeeklyPreps,
    loadPlaybooks: state.loadPlaybooks,
  })));

  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCheckupOpen, setIsCheckupOpen] = useState(false);
  const [isPreFightOpen, setIsPreFightOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStrategySelectOpen, setIsStrategySelectOpen] = useState(false);
  const [isWeeklyPrepOpen, setIsWeeklyPrepOpen] = useState(false);

  const todayPrep = dailyPreps[activeDate];
  
  const getWeekId = (date: string) => {
    const d = new Date(date);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const weekId = useMemo(() => getWeekId(activeDate), [activeDate]);
  const currentWeekPrep = weeklyPreps[weekId];

  useEffect(() => {
    loadDailyPreps(); loadWeeklyPreps(); loadPlaybooks();
  }, [loadDailyPreps, loadWeeklyPreps, loadPlaybooks]);

  const weekDays = useMemo(() => {
    const d = new Date(activeDate);
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
  }, [activeDate]);

  const status = {
    s1: !!currentWeekPrep,
    s2: !!todayPrep?.gkVerdict && todayPrep.gkVerdict !== 'None',
    s3: !!todayPrep?.gkUncertaintyAccepted,
    s4: !!todayPrep?.marketContext && todayPrep.marketContext !== 'UNDEFINED',
    s5: !!todayPrep?.setup && todayPrep.setup !== 'None',
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-1000 max-w-[1700px] mx-auto w-full">
      
      {/* 1. HEADER PREPARATION HUB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div className="flex items-center space-x-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
             <i className="fas fa-terminal text-2xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">DECISIONS TERMINAL</h1>
            <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">MISSION SESSION:</span>
                <input 
                  type="date" 
                  value={activeDate} 
                  onChange={(e) => setActiveDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-[10px] font-black text-blue-400 uppercase outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-[#0b1222]/60 border border-slate-800 px-6 py-3 rounded-2xl shadow-xl">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ACTIVE WEEK: <span className="text-white ml-2 italic">{weekId}</span></span>
          </div>
          <button 
            onClick={() => setIsWeeklyPrepOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center active:scale-95"
          >
            <i className="fas fa-anchor mr-2"></i> ANCHOR WEEKLY MACRO
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        <div className="flex-1 space-y-10 px-4">
            
            {/* PROTOCOL HORIZONTAL BAR */}
            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic pl-2">MANDATORY OPERATIONAL PROTOCOL</h3>
               <div className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar no-print">
                  <ProtocolStage step="1" label="WEEKLY ANCHOR" icon="fa-anchor" active={!status.s1} completed={status.s1} onClick={() => setIsWeeklyPrepOpen(true)} />
                  <ProtocolStage step="2" label="CHECK-UP" icon="fa-user-check" active={status.s1 && !status.s2} completed={status.s2} onClick={() => setIsCheckupOpen(true)} />
                  <ProtocolStage step="3" label="PRE-FIGHT" icon="fa-shield-halved" active={status.s2 && !status.s3} completed={status.s3} onClick={() => setIsPreFightOpen(true)} />
                  <ProtocolStage step="4" label="SCANNER" icon="fa-filter" active={status.s3 && !status.s4} completed={status.s4} onClick={() => setIsScannerOpen(true)} />
                  <ProtocolStage step="5" label="STRATEGY SELECT" icon="fa-rocket" active={status.s4 && !status.s5} completed={status.s5} onClick={() => setIsStrategySelectOpen(true)} />
               </div>
            </div>

            {/* OPERATIONAL HORIZON & BIOLOGICAL SYNC */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <OperationalHorizon tradingDays={currentWeekPrep?.tradingDays || []} weekDays={weekDays} dayNews={currentWeekPrep?.dayNews} />
                <BiologicalSync prep={todayPrep} />
            </div>

            {/* MAIN ANALYSIS AREA: PROTOCOL + STRATEGY */}
            <div className="space-y-8">
               <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic pl-2">STRATEGIC ALIGNMENT COCKPIT</h3>
                  {status.s5 && (
                      <span className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase animate-pulse">Ready for Execution</span>
                  )}
               </div>
               <StrategicAlignmentCockpit prep={todayPrep} date={activeDate} playbooks={playbooks} />
            </div>

        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="lg:w-96 space-y-8 px-4">
            <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Session Navigator</h4>
                  <i className="fas fa-calendar-alt text-blue-500 text-[11px]"></i>
               </div>
               <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((d, i) => (
                    <div 
                      key={i} 
                      onClick={() => setActiveDate(d.full)}
                      className={`aspect-square flex items-center justify-center rounded-xl text-[10px] font-black transition-all cursor-pointer border ${
                        d.full === activeDate 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/30 scale-110' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {d.day}
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[3.5rem] shadow-xl space-y-12">
                <div>
                  <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8 border-b border-slate-800/50 pb-4">Macro Pulse</h4>
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WEEKLY BIAS:</span>
                        <span className={`text-[10px] font-black uppercase px-4 py-1 rounded-full border ${currentWeekPrep?.weeklyBias === 'Bullish' ? 'bg-green-600/10 text-green-500 border-green-500/20' : currentWeekPrep?.weeklyBias === 'Bearish' ? 'bg-red-600/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {currentWeekPrep?.weeklyBias || 'UNDEFINED'}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/60 shadow-inner">
                         <p className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest">Active Narrative</p>
                         <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                            "{currentWeekPrep?.weeklyNarrative || 'No macro plan recorded.'}"
                         </p>
                      </div>
                  </div>
                </div>
                <NewsTicker dayNews={currentWeekPrep?.dayNews} activeDate={activeDate} />
            </div>
        </div>

      </div>

      {/* MODALS */}
      {isWeeklyPrepOpen && (
        <WeeklyPrepModal 
          isOpen={isWeeklyPrepOpen} 
          onClose={() => setIsWeeklyPrepOpen(false)} 
          onSave={onSaveWeeklyPrep} 
          initialData={currentWeekPrep} 
          selectedDate={activeDate} 
        />
      )}
      {isCheckupOpen && (
        <TraderCheckupModal 
          isOpen={isCheckupOpen} 
          onClose={() => setIsCheckupOpen(false)} 
          onSave={onSavePrep} 
          initialData={todayPrep} 
          initialDate={activeDate} 
        />
      )}
      {isPreFightOpen && (
        <PreFightSequenceModal 
          isOpen={isPreFightOpen} 
          onClose={() => setIsPreFightOpen(false)} 
          onSave={onSavePrep} 
          initialData={todayPrep} 
          initialDate={activeDate} 
        />
      )}
      {isScannerOpen && (
        <DecisionFunnelModal
          initialPrep={todayPrep}
          initialWeeklyPrep={currentWeekPrep}
          date={activeDate}
          onClose={() => setIsScannerOpen(false)} 
          onSave={(updates, date) => { onSavePrep(date, { ...dailyPreps[date], ...updates } as DailyPrepData); setActiveDate(date); }} 
        />
      )}
      {isStrategySelectOpen && (
        <StrategySelectionModal
          initialPrep={todayPrep}
          date={activeDate}
          onClose={() => setIsStrategySelectOpen(false)} 
          onSave={(updates, date) => { onSavePrep(date, { ...dailyPreps[date], ...updates } as DailyPrepData); setActiveDate(date); }} 
        />
      )}

    </div>
  );
};

export default DailyJournal;
