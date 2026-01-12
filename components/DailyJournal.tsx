
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyPrepData, WeeklyPrepData, Playbook } from '../types';
import WeeklyPrepModal from './WeeklyPrepModal';
import DecisionFunnelModal from './DecisionFunnelModal';
import StrategySelectionModal from './StrategySelectionModal';
import TraderCheckupModal from './TraderCheckupModal';
import PreFightSequenceModal from './PreFightSequenceModal';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import StrategicAlignmentCockpit from './StrategicAlignmentCockpit';

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

const DailyJournal: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const { dailyPreps, weeklyPreps, playbooks, loadDailyPreps, loadWeeklyPreps, loadPlaybooks, saveDailyPrep, saveWeeklyPrep } = useAppStore(useShallow(state => ({
    dailyPreps: state.dailyPreps,
    weeklyPreps: state.weeklyPreps,
    playbooks: state.playbooks,
    loadDailyPreps: state.loadDailyPreps,
    loadWeeklyPreps: state.loadWeeklyPreps,
    loadPlaybooks: state.loadPlaybooks,
    saveDailyPrep: state.saveDailyPrep,
    saveWeeklyPrep: state.saveWeeklyPrep
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

  // Logic to generate days for the Weekly Horizon Widget
  const weekDays = useMemo(() => {
    const d = new Date(activeDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    const startOfWeek = new Date(d.setDate(diff));
    return Array.from({ length: 6 }, (_, i) => { // Mon-Sat
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const isoDate = dayDate.toISOString().split('T')[0];
      return {
        label: dayDate.toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '').toUpperCase(),
        day: dayDate.getDate(),
        full: isoDate,
        isToday: isoDate === activeDate
      };
    });
  }, [activeDate]);

  useEffect(() => {
    startTransition(() => {
      loadDailyPreps(); 
      loadWeeklyPreps(); 
      loadPlaybooks();
    });
  }, [loadDailyPreps, loadWeeklyPreps, loadPlaybooks]);

  // Updated Sequence Logic: 1. Check-Up -> 2. Pre-Fight -> 3. Weekly -> 4. Scanner -> 5. Strategy
  const status = {
    s1: !!todayPrep?.gkVerdict && todayPrep.gkVerdict !== 'None', // 1. Check-Up
    s2: !!todayPrep?.gkUncertaintyAccepted, // 2. Pre-Fight
    s3: !!currentWeekPrep, // 3. Weekly Anchor
    s4: !!todayPrep?.marketContext && todayPrep.marketContext !== 'UNDEFINED', // 4. Scanner
    s5: !!todayPrep?.setup && todayPrep.setup !== 'None', // 5. Strategy
  };

  const handleOpenModal = (setter: (v: boolean) => void) => {
    startTransition(() => {
      setter(true);
    });
  };

  return (
    <div className={`space-y-8 pb-20 animate-in fade-in duration-1000 max-w-[1700px] mx-auto w-full ${isPending ? 'opacity-70' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div className="flex items-center space-x-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner">
             <i className="fas fa-terminal text-2xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">2. Command Center</h1>
            <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">MISSION SESSION:</span>
                <input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-[10px] font-black text-blue-400 uppercase outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD WIDGETS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
        
        {/* WIDGET 1: WEEKLY OPERATIONAL HORIZON */}
        <div className="bg-[#0b1222] border border-slate-800/60 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
            <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <i className="fas fa-calendar-week text-xs"></i>
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Weekly Operational Horizon</h4>
            </div>
            <div className="flex justify-between items-center relative z-10">
                {weekDays.map(d => (
                    <button 
                        key={d.full} 
                        onClick={() => setActiveDate(d.full)}
                        className={`flex flex-col items-center justify-center w-10 h-14 rounded-xl transition-all ${d.isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:text-white hover:bg-slate-800'}`}
                    >
                        <span className="text-[7px] font-black uppercase tracking-wider mb-0.5">{d.label}</span>
                        <span className="text-sm font-black">{d.day}</span>
                    </button>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/50 relative z-10">
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-700 w-[60%]"></div>
                </div>
            </div>
        </div>

        {/* WIDGET 2: LIVE BIOLOGICAL SYNC */}
        <div className="bg-[#0b1222] border border-slate-800/60 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 animate-pulse">
                        <i className="fas fa-heart-pulse"></i>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Biological Sync</h4>
                        <p className={`text-xl font-black italic tracking-tighter ${todayPrep?.gkVerdict === 'Green' ? 'text-emerald-500' : todayPrep?.gkVerdict === 'Yellow' ? 'text-orange-500' : 'text-slate-500'}`}>
                            {todayPrep?.gkTotalScore ? `${todayPrep.gkTotalScore}/100` : 'OFFLINE'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Sleep Analysis</p>
                    <p className="text-lg font-black text-white italic tracking-tighter">{todayPrep?.gkSleepHours || '--'} <span className="text-[8px] not-italic text-slate-500">HOURS</span></p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4 relative z-10">
                 <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">HRV CALIBRATION</span>
                    <span className="text-xs font-black text-white">{todayPrep?.gkHRVValue || '--'} MS</span>
                 </div>
                 <button onClick={() => handleOpenModal(setIsCheckupOpen)} className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">
                    {todayPrep?.gkTotalScore ? 'RE-CALIBRATE' : 'INITIATE SYNC'}
                 </button>
            </div>
        </div>

        {/* WIDGET 3: MACRO PULSE */}
        <div className="bg-[#0b1222] border border-slate-800/60 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
            <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                    <i className="fas fa-earth-americas text-xs"></i>
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Macro Pulse</h4>
            </div>
            
            <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Weekly Bias:</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase ${
                        currentWeekPrep?.weeklyBias === 'Bullish' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        currentWeekPrep?.weeklyBias === 'Bearish' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-slate-900 text-slate-400 border-slate-700'
                    }`}>
                        {currentWeekPrep?.weeklyBias || 'UNDEFINED'}
                    </span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 h-[60px] overflow-hidden">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Active Narrative</p>
                    <p className="text-[10px] text-slate-400 italic truncate leading-relaxed">
                        "{currentWeekPrep?.weeklyNarrative || 'No macro plan recorded.'}"
                    </p>
                </div>
            </div>
        </div>

      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-10 px-4">
            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic pl-2">MANDATORY OPERATIONAL PROTOCOL</h3>
               <div className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar">
                  <ProtocolStage step="1" label="CHECK-UP" icon="fa-user-check" active={!status.s1} completed={status.s1} onClick={() => handleOpenModal(setIsCheckupOpen)} />
                  <ProtocolStage step="2" label="PRE-FIGHT" icon="fa-shield-halved" active={status.s1 && !status.s2} completed={status.s2} onClick={() => handleOpenModal(setIsPreFightOpen)} />
                  <ProtocolStage step="3" label="WEEKLY ANCHOR" icon="fa-anchor" active={status.s2 && !status.s3} completed={status.s3} onClick={() => handleOpenModal(setIsWeeklyPrepOpen)} />
                  <ProtocolStage step="4" label="SCANNER" icon="fa-filter" active={status.s3 && !status.s4} completed={status.s4} onClick={() => handleOpenModal(setIsScannerOpen)} />
                  <ProtocolStage step="5" label="STRATEGY SELECT" icon="fa-rocket" active={status.s4 && !status.s5} completed={status.s5} onClick={() => handleOpenModal(setIsStrategySelectOpen)} />
               </div>
            </div>
            <StrategicAlignmentCockpit prep={todayPrep} date={activeDate} playbooks={playbooks} />
        </div>
      </div>

      {isWeeklyPrepOpen && (
        <WeeklyPrepModal isOpen={isWeeklyPrepOpen} onClose={() => setIsWeeklyPrepOpen(false)} onSave={saveWeeklyPrep} initialData={currentWeekPrep} selectedDate={activeDate} />
      )}
      {isCheckupOpen && (
        <TraderCheckupModal isOpen={isCheckupOpen} onClose={() => setIsCheckupOpen(false)} onSave={saveDailyPrep} initialData={todayPrep} initialDate={activeDate} />
      )}
      {isPreFightOpen && (
        <PreFightSequenceModal isOpen={isPreFightOpen} onClose={() => setIsPreFightOpen(false)} onSave={saveDailyPrep} initialData={todayPrep} initialDate={activeDate} />
      )}
      {isScannerOpen && (
        <DecisionFunnelModal initialPrep={todayPrep} initialWeeklyPrep={currentWeekPrep} date={activeDate} onClose={() => setIsScannerOpen(false)} onSave={(updates, date) => { saveDailyPrep(date, { ...dailyPreps[date], ...updates } as DailyPrepData); setActiveDate(date); }} />
      )}
      {isStrategySelectOpen && (
        <StrategySelectionModal initialPrep={todayPrep} date={activeDate} onClose={() => setIsStrategySelectOpen(false)} onSave={(updates, date) => { saveDailyPrep(date, { ...dailyPreps[date], ...updates } as DailyPrepData); setActiveDate(date); }} />
      )}
    </div>
  );
};

export default DailyJournal;
