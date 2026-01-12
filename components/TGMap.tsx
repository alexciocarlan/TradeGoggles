import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { calculateTGScore } from './HabitTracker';

interface StageProps {
  id: number;
  title: string;
  subtitle: string;
  shortDesc: string;
  fullDescription: string;
  involves: string;
  follows: string;
  gain: string;
  loss: string;
  icon: string;
  color: string;
  glowColor: string;
  path: string;
  className: string;
  tooltipAlign?: 'left' | 'center' | 'right';
  tooltipSide?: 'top' | 'bottom';
  isCompleted?: boolean;
}

const StageCard: React.FC<StageProps> = ({ 
  id, title, subtitle, shortDesc, fullDescription, involves, follows, gain, loss, icon, color, glowColor, path, className,
  tooltipAlign = 'center', tooltipSide = 'top', isCompleted = false
}) => {
  const navigate = useNavigate();
  
  const horizontalClass = tooltipAlign === 'center' ? 'left-1/2 -translate-x-1/2' : tooltipAlign === 'left' ? 'left-0' : 'right-0';
  const verticalClass = tooltipSide === 'top' ? 'bottom-full mb-6' : 'top-full mt-6';
  
  const arrowXClass = tooltipAlign === 'center' ? 'left-1/2 -translate-x-1/2' : tooltipAlign === 'left' ? 'left-10' : 'right-10';
  const arrowYClass = tooltipSide === 'top' ? 'bottom-0 -mb-2 border-r border-b' : 'top-0 -mt-2 border-l border-t';

  const activeGlow = isCompleted ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : glowColor;
  const activeBorder = isCompleted ? 'border-emerald-500/50' : 'border-slate-800';
  const activeIconColor = isCompleted ? 'text-emerald-400' : color;

  const getAutoOpenStage = () => {
    if (id === 1) return 2;
    if (id === 2) return 3;
    if (id === 3) return 4;
    return null;
  };

  const handleClick = () => {
    if (id === 4) {
      navigate(path, { state: { openNewTrade: true } });
    } else {
      navigate(path, { state: { autoOpenStage: getAutoOpenStage() } });
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`absolute ${className} group cursor-pointer transition-all duration-500 hover:scale-105 active:scale-95 z-20 hover:z-[150]`}
    >
      <div className={`absolute -inset-1 rounded-[2rem] transition-all duration-700 ${isCompleted ? 'opacity-40 blur-2xl' : 'opacity-20 group-hover:opacity-40 blur-xl'} ${activeGlow}`}></div>
      
      <div className={`relative bg-[#0b1222]/90 backdrop-blur-xl border ${activeBorder} rounded-[1.8rem] p-6 w-72 shadow-2xl group-hover:border-blue-500/50 transition-all duration-500`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg border border-white/5 ${activeIconColor} bg-white/5 transition-colors`}>
            <i className={`fas ${isCompleted ? 'fa-check-circle' : icon}`}></i>
          </div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Stage {id}</span>
        </div>
        
        <div className="space-y-1 mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">{title}</h3>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-blue-400'}`}>
            {isCompleted ? 'PROTOCOL VALIDATED' : subtitle}
          </p>
        </div>
        
        <div className="bg-black/40 rounded-xl p-3 border border-white/5 mb-4">
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
            {shortDesc}
          </p>
        </div>

        <div className="flex items-center justify-between">
           <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden mr-4">
              <div className={`h-full w-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : color.replace('text-', 'bg-') + ' opacity-40 group-hover:opacity-100'}`}></div>
           </div>
           <i className={`fas ${isCompleted ? 'fa-shield-check text-emerald-500' : 'fa-arrow-right text-slate-700 group-hover:text-blue-500'} text-[10px] group-hover:translate-x-1 transition-all`}></i>
        </div>
      </div>

      <div className={`absolute ${horizontalClass} ${verticalClass} w-[420px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-500 transform ${tooltipSide === 'top' ? 'translate-y-4' : '-translate-y-4'} group-hover:translate-y-0 z-[200]`}>
        <div className="bg-[#0b1222] border border-slate-600 rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(0,0,0,1)] ring-1 ring-white/10 relative overflow-hidden">
          <div className="flex items-center space-x-4 mb-6 border-b border-slate-800/80 pb-5">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeIconColor} bg-white/5 border border-white/10 shadow-inner`}>
                <i className={`fas ${icon} text-lg`}></i>
             </div>
             <div>
                <h4 className="text-white font-black text-sm uppercase tracking-widest">{title}</h4>
                <p className={`${isCompleted ? 'text-emerald-500' : 'text-blue-500'} text-[9px] font-black uppercase tracking-[0.2em]`}>{isCompleted ? 'COMPLETE' : subtitle}</p>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocol Description</p>
                <p className="text-[11px] text-slate-100 font-bold leading-relaxed italic">{fullDescription}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">What it Involves</p>
                    <p className="text-[10px] text-slate-300 font-black leading-tight uppercase tracking-tighter">{involves}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Next in Sequence</p>
                    <p className="text-[10px] text-slate-300 font-black leading-tight uppercase tracking-tighter">{follows}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Protocol Gain</p>
                    <p className="text-[10px] text-emerald-100 font-black leading-tight uppercase">{gain}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">System Penalty</p>
                    <p className="text-[10px] text-red-100 font-black leading-tight uppercase">{loss}</p>
                </div>
             </div>
          </div>

          <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
             <i className="fas fa-microchip text-6xl text-white"></i>
          </div>
          
          <div className={`absolute ${arrowXClass} ${arrowYClass} w-4 h-4 bg-[#0b1222] border-slate-600 rotate-45 z-[-1]`}></div>
        </div>
      </div>
    </div>
  );
};

const TGMap: React.FC<{ onOpenScoreModal: () => void }> = ({ onOpenScoreModal }) => {
  const navigate = useNavigate();
  
  // FIX: Using useShallow to only trigger re-render when specific slices change
  const { dailyPreps, trades, selectedAccountId } = useAppStore(useShallow(state => ({
    dailyPreps: state.dailyPreps,
    trades: state.trades,
    selectedAccountId: state.selectedAccountId
  })));
  
  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrep = dailyPreps[todayStr];
  const todayTrades = activeTrades.filter(t => t.date === todayStr);

  const scoreData = useMemo(() => calculateTGScore(todayStr, activeTrades, todayPrep), [todayStr, activeTrades, todayPrep]);

  const stageStatus = useMemo(() => {
    return {
      s1: !!todayPrep?.gkVerdict && todayPrep.gkVerdict !== 'None',
      s2: !!todayPrep?.gkUncertaintyAccepted,
      s3: !!todayPrep?.pdValueRelationship && todayPrep.pdValueRelationship !== 'None',
      s4: todayTrades.length > 0,
      s5: todayTrades.length > 0 && todayTrades.every(t => (t.notes?.length || 0) > 10),
      s6: !!todayPrep?.habJournalCompleted
    };
  }, [todayPrep, todayTrades]);

  const stages: StageProps[] = [
    { 
      id: 1, title: "Biometric Sync", subtitle: "(The Gatekeeper Scan)", shortDesc: "Input HRV, Sleep, Mental State. P-Score Prep. Activates Prefrontal Cortex.",
      fullDescription: "The trader doesn't start with charts, but with their own biology. It's the moment where 'flesh meets code.' You calibrate HRV, sleep depth, and current cognitive bandwidth to unlock the terminal.",
      involves: "An honest self-assessment of metabolic energy and mental clarity.",
      follows: "If score is green, 'Gate of Execution' opens. If red, system enters Lockdown.",
      gain: "Maximum P-Score. Activates the Prefrontal Cortex and minimizes amygdala reflex.",
      loss: "Ignoring fatigue leads to loss of authority. Low score penalizes any future profits.",
      icon: "fa-heart-pulse", color: "text-cyan-400", glowColor: "bg-cyan-500", path: "/journal", className: "top-[12%] left-[4%]", tooltipAlign: "left", tooltipSide: "bottom", isCompleted: stageStatus.s1
    },
    { 
      id: 2, title: "Uncertainty Contract", subtitle: "(Pre-Fight Sequence)", shortDesc: "Visualize Chaos. Sign Contract. Accept Loss. Mental Rehearsal.",
      fullDescription: "Visualizing the battlefield. The trader signs the 'Chaos Contract', fully accepting loss as a cost of business. One specific focus error from the past is selected for correction today.",
      involves: "Mental Rehearsal. Fully accepting that any individual trade is just a statistical probability.",
      follows: "Full calibration of the Macro Decision Scanner.",
      gain: "Immunity to Stop-Loss pain. You are emotionally 'armored' for the session.",
      loss: "Ego remains in control. Any loss will be taken as a personal insult, leading to Tilt.",
      icon: "fa-file-signature", color: "text-purple-400", glowColor: "bg-purple-500", path: "/journal", className: "top-[40%] left-[16%]", tooltipAlign: "left", tooltipSide: "top", isCompleted: stageStatus.s2
    },
    { 
      id: 3, title: "Arbitrage Filtering", subtitle: "(Decision Funnel)", shortDesc: "7-Step Filter (News, Structure, etc). Cold Analysis. Eliminate Noise.",
      fullDescription: "Passing market reality through the 7-step filter (News -> Structure -> Context -> Open -> Regime -> Location -> Time). This is the mandatory noise-to-signal extraction engine.",
      involves: "Objective analysis based on Market Profile (GAP, Range, Value Area relationship).",
      follows: "Activation of high-confidence setups from the Strategy Playbook.",
      gain: "Elimination of Style Drift. You no longer hunt for trades; valid trades find you.",
      loss: "Confusion. Skipping steps leads to trading 'what you think' instead of 'what you see'.",
      icon: "fa-filter", color: "text-orange-400", glowColor: "bg-orange-500", path: "/journal", className: "top-[20%] left-[32%]", tooltipAlign: "center", tooltipSide: "bottom", isCompleted: stageStatus.s3
    },
    { 
      id: 4, title: "Surgical Execution", subtitle: "(Live Strike)", shortDesc: "Action on Setup. Military Discipline. Hard Stops. E-Score Execution.",
      fullDescription: "The moment of high-intensity action. You pull the trigger ONLY on setups illuminated by previous steps. Entry, stop, and targets are mathematically fixed and locked.",
      involves: "Military discipline in respecting Hard Stops and R|Protocol safety limits.",
      follows: "Immediate Post-Mortem execution review after exit.",
      gain: "High E-Score. Rapid accumulation of Behavioral Equity (Reputation).",
      loss: "Moving a Stop-Loss triggers the Guillotine Veto. Score drops to zero instantly.",
      icon: "fa-crosshairs", color: "text-red-500", glowColor: "bg-red-500", path: "/trades", className: "top-[45%] left-[48%]", tooltipAlign: "center", tooltipSide: "top", isCompleted: stageStatus.s4
    },
    { 
      id: 5, title: "Execution Autopsy", subtitle: "(Post-Mortem Review)", shortDesc: "Dissect Trade. Brutal Honesty. AI Core Coach Scan. Unlock Insights.",
      fullDescription: "After the dust settles, you dissect the trade skeleton. Record 'Pure Truth' about your internal state. The AI Core Coach then scans for psychological gaps in your logic.",
      involves: "Brutal honesty. Identifying if fear, greed, or FOMO dictated the trigger.",
      follows: "Closing the Safety Cell for the final Day Wrap-Up protocol.",
      gain: "Transforming raw data into operational wisdom. Unlocks AI Coaching Tips.",
      loss: "Data is lost to entropy. You remain a 'gambler' who hopes instead of an operator.",
      icon: "fa-magnifying-glass-chart", color: "text-cyan-400", glowColor: "bg-cyan-500", path: "/trades", className: "top-[15%] left-[64%]", tooltipAlign: "right", tooltipSide: "bottom", isCompleted: stageStatus.s5
    },
    { 
      id: 6, title: "Experience Archiving", subtitle: "(The Day Wrap-Up)", shortDesc: "Seal the Day. 'Golden Lesson'. R-Score: Review. Status: Closed & Safe.",
      fullDescription: "Sealing the vault. Verify if 'No-Go' rules were respected and extract the 'Golden Lesson'. The Behavioral Equity Engine finalizes your daily Reputation Gain and Status.",
      involves: "Completing the Habit Matrix and recording the day's primary structural lesson.",
      follows: "Biological rest and synchronization for the next operational session.",
      gain: "Maximum R-Score. Advancing toward 'The Sentinel' elite status. Day is Closed.",
      loss: "Session remains 'Open & Bleeding'. System blocks tomorrow's access until finished.",
      icon: "fa-box-archive", color: "text-yellow-500", glowColor: "bg-yellow-500", path: "/trades", className: "top-[40%] left-[80%]", tooltipAlign: "right", tooltipSide: "top", isCompleted: stageStatus.s6
    },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-[3.5rem] overflow-hidden border border-slate-800 shadow-2xl animate-in fade-in duration-1000 bg-[#03070c]">
      
      <div className="absolute inset-0 z-0 opacity-40">
        <svg width="100%" height="100%" className="absolute inset-0">
          <pattern id="grid-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div 
        className="absolute inset-0 bg-cover bg-center mix-blend-screen opacity-40"
        style={{ backgroundImage: `url('https://r2.erweima.ai/ai_image/958d5786-8968-45e0-827d-9489d8f6d628.jpg')` }}
      ></div>

      <svg className="absolute inset-0 z-5 pointer-events-none w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
         <defs>
            <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#22d3ee" />
               <stop offset="33%" stopColor="#818cf8" />
               <stop offset="66%" stopColor="#f43f5e" />
               <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <filter id="fluidGlow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="3" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
               <feGaussianBlur stdDeviation="1.5" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
         </defs>
         <path d="M 140 132 L 260 300 L 420 180 L 580 330 L 740 150 L 900 300" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
         <path d="M 140 132 L 260 300 L 420 180 L 580 330 L 740 150 L 900 300" fill="none" stroke="url(#liquidGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="opacity-10" filter="url(#subtleGlow)" />
         <path d="M 140 132 L 260 300 L 420 180 L 580 330 L 740 150 L 900 300" fill="none" stroke="url(#liquidGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="180 600" filter="url(#fluidGlow)" className="animate-fluid-flow" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#03070c] via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#03070c]/70 via-transparent to-transparent"></div>

      <div className="absolute inset-0 z-10">
        {stages.map((stage) => (
          <StageCard key={stage.id} {...stage} />
        ))}
      </div>

      {/* ELITE TARGET INDICATOR - CLICKABLE */}
      <div 
        onClick={onOpenScoreModal}
        className="absolute top-[10%] right-[6%] flex flex-col items-center group cursor-pointer z-30 transition-all hover:scale-110"
      >
          <div className="w-24 h-24 rounded-full bg-blue-600/10 border-2 border-blue-500/40 flex items-center justify-center relative shadow-[0_0_50px_rgba(59,130,246,0.3)]">
             <i className="fas fa-shield-halved text-blue-400 text-4xl animate-pulse"></i>
             <div className="absolute -inset-3 border border-blue-500/10 rounded-full animate-spin-slow"></div>
          </div>
          <div className="mt-5 text-center">
             <h4 className="text-sm font-black text-white uppercase tracking-tighter italic leading-none">TG Score {Math.round(scoreData.score)}</h4>
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">The Sentinel</p>
          </div>

          <div className="absolute top-full right-0 mt-6 w-[450px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 z-[200]">
            <div className="bg-[#0b1222] border border-blue-500/30 rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(0,0,0,1)] ring-1 ring-white/10 relative overflow-hidden">
               <div className="flex items-center space-x-5 mb-8 border-b border-slate-800/80 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                     <i className="fas fa-microchip text-xl"></i>
                  </div>
                  <div>
                     <h4 className="text-white font-black text-lg uppercase tracking-widest italic">TG SCORE ENGINE</h4>
                     <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.3em]">Sentinel Audit Protocol</p>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-3">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Meaning & Purpose</p>
                     <p className="text-[12px] text-slate-100 font-bold leading-relaxed italic">
                        TG Score este metrica supremă a disciplinei operaționale. Nu măsoară profitul, ci alinierea ta cu protocolul Sentinel. Apasă pentru analiza live.
                     </p>
                  </div>

                  <div className="space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Algoritm de Calcul</p>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                           <span className="text-slate-500">P (Preparation) - 20%</span>
                           <span className="text-white">Gatekeeper & Contract</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                           <span className="text-slate-500">E (Execution) - 50%</span>
                           <span className="text-white">Discipline & Narrative</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                           <span className="text-slate-500">R (Review) - 30%</span>
                           <span className="text-white">Wrap-up & Post-Mortem</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="absolute -bottom-10 -left-10 text-[180px] text-white/[0.02] pointer-events-none rotate-12">
                  <i className="fas fa-shield-halved"></i>
               </div>
               
               <div className="absolute right-10 top-0 -mt-2 w-4 h-4 bg-[#0b1222] border-l border-t border-blue-500/30 rotate-45 z-[-1]"></div>
            </div>
          </div>
      </div>

      <div className="absolute bottom-16 left-16 z-20 pointer-events-none">
        <h1 className="text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          THE SENTINEL <br/> <span className="text-blue-600">PROTOCOL</span>
        </h1>
        <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Behavioral Alchemy System</span>
              <div className="w-24 h-px bg-slate-800"></div>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 px-5 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl">
               <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Version 4.5.1 Active</span>
            </div>
        </div>
      </div>

      <div className="absolute top-12 left-16 z-20 flex space-x-6 items-center pointer-events-none">
         <div className="flex items-center space-x-4 text-[11px] font-black uppercase tracking-[0.2em]">
            <span className="text-slate-700">Operational Roadmap</span>
            <i className="fas fa-chevron-right text-slate-800 text-[8px]"></i>
            <span className="text-white">Active Simulation Session</span>
         </div>
      </div>

      <div className="absolute bottom-16 right-16 z-20 hidden xl:flex flex-col space-y-6 items-end">
         <div className="bg-black/80 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-2xl w-72 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Algorithm Sync</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-tight italic">
               The Sentinel monitors every threshold. Any deviation from protocol triggers automated terminal lockdown.
            </p>
         </div>
         <button 
           onClick={() => navigate('/journal')}
           className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] transition-all active:scale-95 border-t border-white/20"
         >
            Decisions Terminal
         </button>
      </div>

      <style>{`
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TGMap;