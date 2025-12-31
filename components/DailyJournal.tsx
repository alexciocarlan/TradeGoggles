import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Trade, Account, DailyPrepData, WeeklyPrepData, Playbook, WeeklyNewsEvent, PlaybookTrap } from '../types';
import DailyPrepModal from './DailyPrepModal';
import WeeklyPrepModal from './WeeklyPrepModal';
import DecisionFunnelModal from './DecisionFunnelModal';
import TraderCheckupModal from './TraderCheckupModal';
import PreFightSequenceModal from './PreFightSequenceModal';
import { Language } from '../translations';

// Helper pentru a identifica setup-urile active bazat pe prep
const getActiveSetups = (prep: DailyPrepData | undefined, playbooks: Playbook[]) => {
  if (!prep) return [];
  let setups: Playbook[] = [];

  // 1. GAP Logic
  if (prep.pdValueRelationship === 'GAP') {
    const isDrive = prep.openType === 'Drive' || prep.openType === 'Test driver';
    const isReversal = prep.openType === 'Rejection- Reversal';
    if (isDrive) {
      const pb = playbooks.find(p => p.id === 'pb-12');
      if (pb) setups.push(pb);
    } else if (isReversal) {
      const pb = playbooks.find(p => p.id === 'pb-13');
      if (pb) setups.push(pb);
    }
  } 
  // 2. Outside VA
  else if (prep.pdValueRelationship === 'OutsideVA') {
    const pb4 = playbooks.find(p => p.id === 'pb-4');
    if (pb4) setups.push(pb4);
  }

  // 3. Regime
  if (prep.marketCondition === 'Trend') {
    const pb6 = playbooks.find(p => p.id === 'pb-6');
    if (pb6) setups.push(pb6);
  } else if (prep.marketCondition === 'Bracket') {
    const pb34 = playbooks.find(p => p.id === 'pb-34');
    if (pb34) setups.push(pb34);
  }

  // 4. Inventory
  if (prep.onInventory !== 'Net Zero' && prep.onInventory !== 'None' && (prep.pdValueRelationship === 'InBalance' || prep.pdValueRelationship === 'InsideRange')) {
    const pb14 = playbooks.find(p => p.id === 'pb-14');
    if (pb14) setups.push(pb14);
  }

  // Deduplicare
  return Array.from(new Set(setups));
};

const PotentialTrapsWidget = ({ prep, playbooks }: { prep?: DailyPrepData, playbooks: Playbook[] }) => {
  const activeSetups = useMemo(() => getActiveSetups(prep, playbooks), [prep, playbooks]);

  if (!prep || activeSetups.length === 0) return null;

  return (
    <div className="bg-[#0b1222]/80 border border-orange-500/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group mt-8">
      <div className="flex items-center space-x-4 mb-10">
        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
          <i className="fas fa-skull-crossbones text-xl"></i>
        </div>
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Potential Traps & Failure Points</h4>
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Architect's Warning for Active Setups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {activeSetups.map((pb) => (
          <div key={pb.id} className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl opacity-80">{pb.icon}</span>
              <h5 className="text-xs font-black text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-1 flex-1">
                {pb.name}
              </h5>
            </div>
            
            <div className="space-y-3">
              {(pb.traps || []).map((trap: PlaybookTrap, idx: number) => (
                <div key={idx} className="p-4 bg-slate-950/40 border border-orange-500/10 rounded-2xl group/trap hover:border-orange-500/30 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">{trap.label}</span>
                    <i className="fas fa-triangle-exclamation text-[8px] text-orange-900 group-hover/trap:text-orange-500 transition-colors"></i>
                  </div>
                  <p className="text-[10px] font-black text-white uppercase tracking-tight mb-1">{trap.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                    "{trap.description}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-slate-800/50 flex items-center justify-center space-x-3">
         <i className="fas fa-biohazard text-orange-500 text-xs animate-pulse"></i>
         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
            IDENTIFY THE TRAP BEFORE THE Trigger. Discipline is your only defense.
         </p>
      </div>

      <i className="fas fa-radiation absolute -bottom-10 -right-10 text-[200px] text-orange-500/[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000"></i>
    </div>
  );
};

const StrategicAlignmentCockpit = ({ prep, date, playbooks }: { prep?: DailyPrepData, date: string, playbooks: Playbook[] }) => {
  const alignment = useMemo(() => {
    if (!prep) return null;

    const protocolStrings: string[] = [];
    let setups: { pb: Playbook; confidence: 'HIGH' | 'LOW' | 'PENDING'; msg?: string }[] = [];

    // 1. BIAS PROTOCOL
    if (prep.mediumTermTrend === 'Up') protocolStrings.push("BIAS: TREND UP. KEEP LONGS LONGER AND TAKE FAST TP FOR SHORTS.");
    else if (prep.mediumTermTrend === 'Down') protocolStrings.push("BIAS: TREND DOWN. KEEP SHORTS LONGER AND TAKE FAST TP FOR LONGS.");
    else protocolStrings.push("BIAS: BALANCING. PRIORITIZE ROTATIONAL TRADES. DO NOT CHASE.");

    // 2. OPEN & GAP ARBITRAGE (AMT Logic)
    if (prep.pdValueRelationship === 'GAP') {
      const isDrive = prep.openType === 'Drive' || prep.openType === 'Test driver';
      const isReversal = prep.openType === 'Rejection- Reversal';

      if (isDrive) {
        protocolStrings.push("OPEN: GAP & DRIVE DETECTED. HIGH CONVICTION INITIATIVE.");
        const pb = playbooks.find(p => p.id === 'pb-12');
        if (pb) setups.push({ pb, confidence: 'HIGH', msg: "Aggressive Initiative. Do not fade." });
      } else if (isReversal) {
        protocolStrings.push("OPEN: GAP REJECTION. LOOKING FOR MEAN REVERSION TO VALUE.");
        const pb = playbooks.find(p => p.id === 'pb-13');
        if (pb) setups.push({ pb, confidence: 'HIGH', msg: "Responsive Selling/Buying. Target pdRange." });
      } else {
        protocolStrings.push("OPEN: GAP STATE. VOLATILITY EXPECTED BUT NO CLEAR DRIVE YET.");
        const pb12 = playbooks.find(p => p.id === 'pb-12');
        const pb13 = playbooks.find(p => p.id === 'pb-13');
        if (pb12) setups.push({ pb: pb12, confidence: 'LOW' });
        if (pb13) setups.push({ pb: pb13, confidence: 'LOW' });
      }
    } else if (prep.pdValueRelationship === 'OutsideVA') {
      protocolStrings.push("OPEN: OUTSIDE VALUE. HIGH PROBABILITY OF THE 80% RULE. TARGET OPPOSITE VA EDGE.");
      const pb4 = playbooks.find(p => p.id === 'pb-4');
      if (pb4) setups.push({ pb: pb4, confidence: 'PENDING', msg: "Valid ONLY if price enters VA and accepts (2 TPOs)." });
    }

    // 3. REGIME
    if (prep.marketCondition === 'Trend') {
      protocolStrings.push("REGIME: MOMENTUM / TREND. DON'T FIGHT THE DRIVE.");
      const pb6 = playbooks.find(p => p.id === 'pb-6');
      if (pb6) setups.push({ pb: pb6, confidence: 'HIGH' });
    } else if (prep.marketCondition === 'Bracket') {
      protocolStrings.push("REGIME: BRACKETING. FADE THE EDGES, REVERT TO POC.");
      const pb34 = playbooks.find(p => p.id === 'pb-34');
      if (pb34) setups.push({ pb: pb34, confidence: 'HIGH' });
    }

    // 4. NEWS ALERT
    if (prep.newsImpact === 'High') {
        protocolStrings.push("NEWS ALERT: HIGH IMPACT DATA TODAY. REDUCE SIZE OR WAIT FOR REACTION.");
    }

    // 5. INVENTORY & OTHER
    if (prep.onInventory !== 'Net Zero' && prep.onInventory !== 'None' && (prep.pdValueRelationship === 'InBalance' || prep.pdValueRelationship === 'InsideRange')) {
        const pb14 = playbooks.find(p => p.id === 'pb-14');
        if (pb14) setups.push({ pb: pb14, confidence: 'HIGH' });
    }

    // 6. SPECIALS (Friday/Continuity)
    const d = new Date(date);
    if (d.getDay() === 4 || d.getDay() === 5) {
        const pb38 = playbooks.find(p => p.id === 'pb-38');
        if (pb38) setups.push({ pb: pb38, confidence: 'HIGH', msg: "Weekly Magnet active." });
    }

    // Filter duplicates
    const uniqueSetups = Array.from(new Map(setups.map(s => [s.pb.id, s])).values());

    return { protocolStrings, setups: uniqueSetups };
  }, [prep, date, playbooks]);

  if (!prep || !alignment) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* PANEL STÂNGA: STRATEGIC PROTOCOL */}
      <div className="bg-[#0b1222]/80 border border-blue-500/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="flex items-center space-x-4 mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <i className="fas fa-robot text-xl"></i>
          </div>
          <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Strategic Protocol Generated</h4>
        </div>
        
        <div className="space-y-4 relative z-10">
          {alignment.protocolStrings.map((line, i) => (
            <div key={i} className="flex items-start space-x-5 p-5 bg-slate-950/40 border border-slate-800 rounded-2xl group hover:border-blue-500/40 transition-all">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
              <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight leading-relaxed">{line}</p>
            </div>
          ))}
        </div>
        <i className="fas fa-microchip absolute -bottom-10 -right-10 text-[200px] text-white/[0.01] pointer-events-none"></i>
      </div>

      {/* PANEL DREAPTA: PLAYBOOK ACTIVATION */}
      <div className="bg-[#0b1222]/80 border border-indigo-500/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="flex items-center space-x-4 mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <i className="fas fa-puzzle-piece text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Validated Strategy Protocol</h4>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Decision Matrix V4.5</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {alignment.setups.map(({ pb, confidence, msg }) => (
            <div key={pb.id} className={`p-5 rounded-[2rem] border transition-all hover:scale-[1.02] ${
                confidence === 'HIGH' ? 'bg-emerald-600/5 border-emerald-500/30' :
                confidence === 'PENDING' ? 'bg-slate-900/60 border-slate-700 opacity-60' :
                'bg-orange-600/5 border-orange-500/30'
              }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{pb.icon}</span>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">{pb.name}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{pb.entryAt}</p>
                  </div>
                </div>
                <span className={`text-[7px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                  confidence === 'HIGH' ? 'bg-emerald-500 text-white' :
                  confidence === 'PENDING' ? 'bg-slate-700 text-slate-300' :
                  'bg-orange-500 text-white'
                }`}>{confidence}</span>
              </div>
              {msg && <p className="text-[9px] font-bold italic text-slate-400 leading-tight">"{msg}"</p>}
            </div>
          ))}

          {alignment.setups.length === 0 && (
            <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] opacity-30">
              <i className="fas fa-search text-3xl text-slate-700 mb-4"></i>
              <p className="text-[10px] font-black text-slate-600 uppercase">Așteptare confirmare Scanner...</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/50">
           <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Other potential setups for today:</h5>
           <div className="flex flex-wrap gap-2">
             {playbooks.filter(p => !alignment.setups.find(s => s.pb.id === p.id)).slice(0, 4).map(p => (
                <span key={p.id} className="text-[8px] font-black text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg uppercase opacity-50">{p.name}</span>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const PotentialSetupsWidget = ({ prep, date, playbooks }: { prep?: DailyPrepData, date: string, playbooks: Playbook[] }) => {
  const result = useMemo(() => {
    if (!prep) return { active: [] };
    let active: { pb: Playbook; confidence: 'HIGH' | 'LOW' | 'PENDING'; msg?: string }[] = [];
    if (prep.pdValueRelationship === 'GAP') {
      const isOpenDrive = prep.openType === 'Drive' || prep.openType === 'Test driver';
      const isRejection = prep.openType === 'Rejection- Reversal';
      if (isOpenDrive) {
        const pb = playbooks.find(p => p.id === 'pb-12');
        if (pb) active.push({ pb, confidence: 'HIGH', msg: "Aggressive Initiative." });
      } else if (isRejection) {
        const pb = playbooks.find(p => p.id === 'pb-13');
        if (pb) active.push({ pb, confidence: 'HIGH', msg: "Responsive Selling/Buying." });
      }
    }
    if (prep.pdValueRelationship === 'OutsideVA') {
      const pb = playbooks.find(p => p.id === 'pb-4');
      if (pb) active.push({ pb, confidence: 'PENDING' });
    }
    return { active };
  }, [prep, playbooks]);

  if (!prep) return null;

  return (
    <div className="bg-[#0b1222] border border-indigo-500/20 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><i className="fas fa-puzzle-piece text-xs"></i></div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Strategy Protocol</h4>
           </div>
        </div>
        <div className="space-y-4">
           {result.active.map(({ pb, confidence }) => (
              <div key={pb.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/30 flex justify-between items-center">
                 <span className="text-[10px] font-black text-white uppercase">{pb.name}</span>
                 <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${confidence === 'HIGH' ? 'bg-emerald-500' : 'bg-slate-700'}`}>{confidence}</span>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const WeeklyScheduleWidget = ({ weekPrep, currentWeekId }: { weekPrep?: WeeklyPrepData, currentWeekId: string }) => {
  if (!weekPrep) return (
    <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[3rem] text-center">
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No weekly plan for {currentWeekId}</p>
    </div>
  );

  const days = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin'];
  
  return (
    <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
            <i className="fas fa-calendar-alt text-xs"></i>
          </div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Weekly Operational Horizon</h4>
        </div>
        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
          weekPrep.weeklyBias === 'Bullish' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
          weekPrep.weeklyBias === 'Bearish' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
          'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }`}>
          {weekPrep.weeklyBias} BIAS
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
        {weekPrep.tradingDays && weekPrep.tradingDays.slice(0, 5).map((date, idx) => {
          const news = weekPrep.dayNews?.[date] || [];
          const hasHighImpact = news.some(n => n.tier === 1);
          return (
            <div key={date} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center space-y-2">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{days[idx]}</span>
              <span className="text-lg font-black text-white">{new Date(date).getDate()}</span>
              {hasHighImpact && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_red] animate-pulse"></div>}
            </div>
          );
        })}
      </div>
      <i className="fas fa-calendar-week absolute -bottom-8 -right-8 text-8xl text-white/[0.02] pointer-events-none"></i>
    </div>
  );
};

const LiveProtocolCockpit = ({ prep }: { prep?: DailyPrepData }) => {
  if (!prep) return null;
  const isHealthy = prep.gkVerdict === 'Green';
  
  return (
    <div className="bg-[#0b1222]/80 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
       <div className="flex items-center space-x-6 relative z-10 mb-6 md:mb-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 ${
            prep.gkVerdict === 'Green' ? 'bg-emerald-600 shadow-emerald-600/30' : 
            prep.gkVerdict === 'Yellow' ? 'bg-yellow-600 shadow-yellow-600/30' : 
            'bg-red-600 shadow-red-600/30'
          }`}>
            <i className={`fas ${isHealthy ? 'fa-shield-check' : 'fa-triangle-exclamation'} text-xl`}></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Biological Sync</p>
            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
              {prep.gkVerdict} MODE 
              <span className="text-slate-700 mx-3 font-light not-italic">|</span> 
              <span className={isHealthy ? 'text-emerald-400' : 'text-orange-400'}>{prep.gkTotalScore}/100</span>
            </h4>
          </div>
       </div>

       <div className="flex items-center space-x-4 relative z-10">
          <div className="text-right">
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Sleep Analysis</p>
             <p className="text-sm font-black text-white">{prep.gkSleepHours || 0} HOURS</p>
          </div>
          <div className="h-8 w-px bg-slate-800 mx-2"></div>
          <div className="text-right">
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">HRV Calibration</p>
             <p className="text-sm font-black text-white">{prep.gkHRVValue || 0} MS</p>
          </div>
       </div>
       <i className="fas fa-heart-pulse absolute -bottom-10 -left-10 text-[180px] text-white/[0.01] pointer-events-none group-hover:text-emerald-500/[0.02] transition-colors duration-1000"></i>
    </div>
  );
};

const DayCard = ({ date, trades, prep, isExpanded, onToggle }: any) => {
  const totalPnl = trades.reduce((sum: number, t: any) => sum + t.pnlNet, 0);
  const winCount = trades.filter((t: any) => t.status === 'WIN').length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  return (
    <div className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] overflow-hidden transition-all hover:border-slate-700 shadow-xl group">
      <div 
        className="px-10 py-6 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors" 
        onClick={onToggle}
      >
        <div className="flex items-center space-x-8">
           <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 w-12 h-12 rounded-xl">
              <span className="text-[7px] font-black text-slate-500 uppercase">{new Date(date).toLocaleDateString('ro-RO', { month: 'short' })}</span>
              <span className="text-lg font-black text-white">{new Date(date).getDate()}</span>
           </div>
           <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tighter italic leading-none mb-1">{trades.length} EXECUTIONS</h4>
              <div className="flex items-center space-x-3">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{date}</span>
                 <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                 <span className={`text-[9px] font-black uppercase tracking-widest ${winRate >= 50 ? 'text-emerald-500' : 'text-slate-500'}`}>{winRate.toFixed(0)}% WR</span>
              </div>
           </div>
        </div>

        <div className="flex items-center space-x-10">
           <div className="text-right">
              <p className={`text-2xl font-black italic tracking-tighter leading-none ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toLocaleString()}
              </p>
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1">Sessional Result</p>
           </div>
           <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center transition-all ${isExpanded ? 'rotate-180 text-blue-500' : 'text-slate-700'}`}>
              <i className="fas fa-chevron-down"></i>
           </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-10 pb-8 pt-4 border-t border-slate-800/40 animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Daily Narrative</p>
                 <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"{prep?.dailyNarrative || 'No narrative recorded for this session.'}"</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Gatekeeper</p>
                    <p className={`text-sm font-black ${prep?.gkVerdict === 'Green' ? 'text-emerald-500' : 'text-orange-500'}`}>{prep?.gkTotalScore || '--'}/100</p>
                 </div>
                 <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Discipline</p>
                    <p className="text-sm font-black text-white">{prep?.habDisciplineScore || '--'}/10</p>
                 </div>
              </div>
           </div>
           
           <div className="mt-6 flex justify-end">
              <Link to="/trades" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">View all session trades <i className="fas fa-arrow-right ml-1"></i></Link>
           </div>
        </div>
      )}
    </div>
  );
};

const MiniCalendar = ({ trades, onDateSelect, selectedDate }: any) => {
  const dates = useMemo(() => {
    const res: string[] = [];
    const now = new Date();
    for(let i=0; i<14; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        res.push(d.toISOString().split('T')[0]);
    }
    return res;
  }, []);

  return (
    <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
      <div className="flex items-center space-x-3 mb-6">
        <i className="fas fa-calendar-day text-blue-500 text-xs"></i>
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session Navigator</h4>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {dates.reverse().map(date => {
          const hasTrades = trades.some((t: Trade) => t.date === date);
          const isSelected = selectedDate === date;
          const dayNum = new Date(date).getDate();

          return (
            <button 
              key={date}
              onClick={() => onDateSelect(date)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : hasTrades 
                    ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600' 
                    : 'bg-slate-950/40 text-slate-700 border border-transparent hover:border-slate-800'
              }`}
            >
              <span className="text-[9px] font-black">{dayNum}</span>
              {hasTrades && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* Define DailyJournalProps interface to fix missing name error */
interface DailyJournalProps {
  trades: Trade[];
  accounts: Account[];
  dailyPreps: Record<string, DailyPrepData>;
  weeklyPreps: Record<string, WeeklyPrepData>;
  onSavePrep: (date: string, prep: DailyPrepData) => void;
  onSaveWeeklyPrep: (weekId: string, prep: WeeklyPrepData) => void;
  playbooks: Playbook[];
  language: Language;
  onSaveNote: (date: string, note: string) => void;
  dailyNotes: Record<string, string>;
}

const DailyJournal: React.FC<DailyJournalProps> = ({ trades, accounts, dailyPreps, weeklyPreps, onSavePrep, onSaveWeeklyPrep, playbooks, language }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [showCheckupModal, setShowCheckupModal] = useState(false);
  const [showPreFightModal, setShowPreFightModal] = useState(false);
  const [showWeeklyPrepModal, setShowWeeklyPrepModal] = useState(false);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const todayPrep = dailyPreps[selectedCalendarDate];

  // LOGICA PENTRU DESCHIDERE AUTOMATĂ DIN TG MAP
  useEffect(() => {
    if (location.state && location.state.autoOpenStage) {
        const stage = location.state.autoOpenStage;
        if (stage === 1) setShowWeeklyPrepModal(true);
        if (stage === 2) setShowCheckupModal(true);
        if (stage === 3) setShowPreFightModal(true);
        if (stage === 4) setShowFunnelModal(true);
        if (stage === 5) setShowPrepModal(true);
        
        // Curățăm state-ul pentru a nu re-deschide la refresh
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);
  
  const currentWeekId = useMemo(() => {
    const d = new Date();
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }, []);

  const currentWeekPrep = weeklyPreps[currentWeekId];
  
  const prepStatus = useMemo(() => ({
    weekly: !!currentWeekPrep?.weeklyBias && currentWeekPrep.weeklyBias !== 'Neutral' || currentWeekPrep?.tradingDays?.length > 0,
    checkup: !!todayPrep?.gkVerdict && todayPrep.gkVerdict !== 'None',
    preFight: !!todayPrep?.gkUncertaintyAccepted,
    scanner: !!todayPrep?.mediumTermTrend && todayPrep.mediumTermTrend !== 'None',
    startDay: !!todayPrep?.setup && todayPrep.setup !== 'None'
  }), [todayPrep, currentWeekPrep]);

  const tradesByDate = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    trades.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [trades]);

  const StepButton = ({ onClick, icon, label, step, active }: any) => {
    const activeClasses = "bg-emerald-600/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
    const pendingClasses = "bg-orange-600/5 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse";
    return (
        <button onClick={onClick} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border flex items-center whitespace-nowrap group active:scale-95 ${active ? activeClasses : pendingClasses}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 transition-colors ${active ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'}`}><i className={`fas ${active ? 'fa-check' : icon} text-[10px]`}></i></div>
            <div className="text-left"><p className="opacity-60 text-[7px] font-black leading-none mb-1">STAGE {step}</p><p className="tracking-tight">{label}</p></div>
        </button>
    );
  };

  const getDayLabel = (dateStr: string) => { const d = new Date(dateStr); return d.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase(); };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-2"><h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Preparation Hub</h1><span className="text-slate-800 text-2xl font-light">|</span><h2 className="text-sm font-black text-blue-500 uppercase tracking-widest">Sesiunea: {selectedCalendarDate}</h2></div>
        <div className="flex items-center space-x-4"><div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 hidden md:flex items-center space-x-3"><span className="text-[9px] font-black text-slate-500 uppercase">Week ID:</span><span className="text-[10px] font-black text-white">{currentWeekId}</span></div><button onClick={() => setShowWeeklyPrepModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center self-start md:self-auto"><i className="fas fa-calendar-week mr-2"></i> Update Weekly Plan</button></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-8">
           <div className="bg-[#0b1222] border border-slate-800/40 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 italic">Mandatory Operational Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  <StepButton step="1" label="Weekly Anchor" icon="fa-anchor" onClick={() => setShowWeeklyPrepModal(true)} active={prepStatus.weekly} />
                  <StepButton step="2" label="Check-up" icon="fa-user-md" onClick={() => setShowCheckupModal(true)} active={prepStatus.checkup} />
                  <StepButton step="3" label="Pre-Fight" icon="fa-shield-halved" onClick={() => setShowPreFightModal(true)} active={prepStatus.preFight} />
                  <StepButton step="4" label="Scanner" icon="fa-filter" onClick={() => setShowFunnelModal(true)} active={prepStatus.scanner} />
                  <StepButton step="5" label="Strategy Select" icon="fa-rocket" onClick={() => setShowPrepModal(true)} active={prepStatus.startDay} />
              </div>
           </div>

           <WeeklyScheduleWidget weekPrep={currentWeekPrep} currentWeekId={currentWeekId} />
           
           <LiveProtocolCockpit prep={todayPrep} />

           {/* Centralized Strategic Alignment */}
           <StrategicAlignmentCockpit prep={todayPrep} date={selectedCalendarDate} playbooks={playbooks} />

           {/* NEW WIDGET: POTENTIAL TRAPS */}
           <PotentialTrapsWidget prep={todayPrep} playbooks={playbooks} />

           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Istoric Sesiuni</h3>
              {tradesByDate.map(([date, dayTrades]) => (
                  <DayCard key={date} date={date} trades={dayTrades} prep={dailyPreps[date]} isExpanded={!!expandedDays[date]} onToggle={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))} />
              ))}
           </div>
        </div>

        <div className="w-full lg:w-[320px] no-print sticky top-24 space-y-6">
           <MiniCalendar trades={trades} onDateSelect={setSelectedCalendarDate} selectedDate={selectedCalendarDate} />
           <PotentialSetupsWidget prep={todayPrep} date={selectedCalendarDate} playbooks={playbooks} />
           
           <div className="bg-[#0b1222] border border-blue-500/20 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Săptămâna aceasta</h4>
              <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500 font-bold uppercase">Weekly Bias:</span><span className={`font-black uppercase px-2 py-0.5 rounded ${currentWeekPrep?.weeklyBias === 'Bullish' ? 'bg-green-500/10 text-green-500' : currentWeekPrep?.weeklyBias === 'Bearish' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{currentWeekPrep?.weeklyBias || 'Undefined'}</span></div>
                  <div className="pt-4 border-t border-slate-800/60">
                    <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Știri Relevante</h5>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                      {currentWeekPrep?.dayNews && Object.keys(currentWeekPrep.dayNews).length > 0 ? (
                        Object.entries(currentWeekPrep.dayNews).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([dateStr, newsArr]) => (
                          (newsArr as WeeklyNewsEvent[]).length > 0 && (
                            <div key={dateStr} className="space-y-2">
                              <div className="flex items-center space-x-2"><span className="text-[8px] font-black text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{getDayLabel(dateStr)} {dateStr.split('-')[2]}</span><div className="h-px flex-1 bg-slate-800/40"></div></div>
                              <div className="space-y-1.5 pl-2">
                                {(newsArr as WeeklyNewsEvent[]).map((news, idx) => (
                                  <div key={idx} className="flex items-start space-x-3 group"><span className={`text-[7px] font-black mt-0.5 whitespace-nowrap ${news.tier === 1 ? 'text-red-500' : news.tier === 2 ? 'text-orange-500' : news.tier === 3 ? 'text-yellow-400' : news.tier === 4 ? 'text-indigo-400' : 'text-slate-400'}`}>{news.time}</span><span className="text-[9px] font-bold text-slate-300 leading-tight group-hover:text-white transition-colors uppercase truncate">{news.event}</span></div>
                                ))}
                              </div>
                            </div>
                          )
                        ))
                      ) : ( <p className="text-[9px] text-slate-700 italic font-bold uppercase text-center py-4">Nicio știre înregistrată.</p> )}
                    </div>
                  </div>
              </div>
              <i className="fas fa-anchor absolute -bottom-6 -right-6 text-7xl text-blue-500/[0.03] rotate-12 pointer-events-none"></i>
           </div>
        </div>
      </div>

      {showCheckupModal && <TraderCheckupModal language={language} onClose={() => setShowCheckupModal(false)} onSave={(d, p) => { onSavePrep(d, p); setShowCheckupModal(false); }} initialData={dailyPreps[selectedCalendarDate]} initialDate={selectedCalendarDate} />}
      {showPreFightModal && <PreFightSequenceModal language={language} trades={trades} onClose={() => setShowPreFightModal(false)} onSave={(d, p) => { onSavePrep(d, p); setShowPreFightModal(false); }} initialData={dailyPreps[selectedCalendarDate]} initialDate={selectedCalendarDate} />}
      {showPrepModal && <DailyPrepModal weeklyPreps={weeklyPreps} playbooks={playbooks} language={language} onClose={() => setShowPrepModal(false)} onSave={(d, p) => { onSavePrep(d, p); setShowPrepModal(false); }} initialData={dailyPreps[selectedCalendarDate]} initialDate={selectedCalendarDate} />}
      {showWeeklyPrepModal && <WeeklyPrepModal initialData={weeklyPreps[currentWeekId]} language={language} onClose={() => setShowWeeklyPrepModal(false)} onSave={(wid, p) => { onSaveWeeklyPrep(wid, p); setShowWeeklyPrepModal(false); }} />}
      {showFunnelModal && <DecisionFunnelModal onSave={(updates) => onSavePrep(selectedCalendarDate, updates as DailyPrepData)} onClose={() => setShowFunnelModal(false)} />}
    </div>
  );
};

export default DailyJournal;