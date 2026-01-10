
import React, { useMemo } from 'react';
import { DailyPrepData, Playbook } from '../types';
import { ALL_SETUPS } from '../data/setups';

interface StrategicAlignmentCockpitProps {
  prep?: DailyPrepData;
  date: string;
  playbooks: Playbook[];
}

const SummaryItem = ({ icon, label, value, color }: { icon: string, label: string, value: string, color: string }) => (
    <div className="flex flex-col space-y-2 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl group hover:border-slate-700 transition-all">
        <div className="flex items-center space-x-2">
            <i className={`fas ${icon} text-[9px] ${color} opacity-70`}></i>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
        <p className={`text-[11px] font-black uppercase tracking-tight truncate ${value === 'UNDEFINED' ? 'text-slate-700' : 'text-white'}`}>
            {value.replace(/_/g, ' ')}
        </p>
    </div>
);

const StrategicAlignmentCockpit: React.FC<StrategicAlignmentCockpitProps> = ({ prep, date, playbooks = [] }) => {
  const alignment = useMemo(() => {
    if (!prep) return null;

    const protocolStrings: string[] = [];
    
    // 1. BIAS PROTOCOL from Market Context
    if (prep.marketContext === 'STRONG_TREND' || prep.marketContext === 'TREND_VALIDATED' || prep.marketContext === 'TREND') {
        protocolStrings.push("REGIME: TREND/MOMENTUM. DON'T FIGHT THE DRIVE. PRIORITIZE CONTINUATION.");
    } else if (prep.marketContext === 'BALANCE_CHOP' || prep.marketContext === 'REVERSION' || prep.marketContext === 'BALANCE') {
        protocolStrings.push("REGIME: BRACKETING. FADE THE EDGES, REVERT TO POC.");
    } else {
        protocolStrings.push("REGIME: UNDEFINED. EXTREME CAUTION ADVISED.");
    }
    
    // 2. OPEN TYPE PROTOCOL
    if (prep.openType && prep.openType !== 'None') {
        protocolStrings.push(`OPEN: ${prep.openType.toUpperCase()} DETECTED. HIGH CONVICTION INITIATIVE.`);
    }

    // 3. ANOMALIES
    if (prep.observedAnomalies && prep.observedAnomalies.length > 0) {
        protocolStrings.push(`TARGETS: ${prep.observedAnomalies.join(', ').replace(/_/g, ' ')} IDENTIFIED.`);
    }

    // Map validated setup IDs to full objects for display
    const validatedSetupsDetails = (prep.validatedSetups || [])
      .map(id => ALL_SETUPS.find(s => s.id === id))
      .filter(Boolean) as any[];

    return { protocolStrings, setups: validatedSetupsDetails };
  }, [prep, date]);

  if (!prep || !alignment) return (
    <div className="bg-[#0b1222]/40 border border-slate-800 p-12 rounded-[3rem] text-center opacity-40">
        <i className="fas fa-radar text-4xl text-slate-800 mb-6"></i>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Așteptare calibrare scanner...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* NEW WIDGET: ALGORITHM OUTPUT SUMMARY */}
      <section className="bg-[#0b1222]/90 border border-indigo-500/30 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-4">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                    <i className="fas fa-microchip text-sm"></i>
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">ALGORITHM OUTPUT: SESSION REALITY</h4>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AMT ARCHITECTURAL READOUT // {date}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase">Decision Funnel Synced</span>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
            <SummaryItem 
                icon="fa-chess-rook" 
                label="Market Regime" 
                value={prep.marketContext || 'UNDEFINED'} 
                color="text-blue-500" 
            />
            <SummaryItem 
                icon="fa-map-pin" 
                label="Opening Location" 
                value={prep.openingContext || 'UNDEFINED'} 
                color="text-indigo-400" 
            />
            <SummaryItem 
                icon="fa-users" 
                label="Participant" 
                value={prep.participantControl || 'UNDEFINED'} 
                color="text-orange-500" 
            />
            <SummaryItem 
                icon="fa-gauge-high" 
                label="Rel. Volume" 
                value={prep.volRelative || 'UNDEFINED'} 
                color="text-cyan-400" 
            />
            <SummaryItem 
                icon="fa-clone" 
                label="Value Overlap" 
                value={prep.observedValueOverlap || 'ANY'} 
                color="text-emerald-500" 
            />
            <SummaryItem 
                icon="fa-triangle-exclamation" 
                label="Anomalies" 
                value={prep.observedAnomalies && prep.observedAnomalies.length > 0 ? prep.observedAnomalies[0] : 'NONE'} 
                color="text-rose-500" 
            />
        </div>

        <i className="fas fa-dna absolute -bottom-10 -right-10 text-[180px] text-white/[0.02] pointer-events-none rotate-12"></i>
      </section>

      {/* LOWER GRID: PROTOCOL & SETUPS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-[#0b1222]/80 border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="flex items-center space-x-4 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <i className="fas fa-robot text-sm"></i>
            </div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Strategic Protocol Control</h4>
            </div>
            
            <div className="space-y-4">
            {alignment.protocolStrings.map((line, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 bg-[#060b13] border border-slate-800 rounded-2xl group transition-all hover:border-blue-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight leading-relaxed">{line}</p>
                </div>
            ))}
            {alignment.protocolStrings.length === 0 && (
                <p className="text-[9px] text-slate-600 uppercase italic">No strategic signals detected yet.</p>
            )}
            </div>
        </div>

        <div className="bg-[#0b1222]/80 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center space-x-4 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <i className="fas fa-check-double text-sm"></i>
            </div>
            <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Validated Setups Queue</h4>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Decision Matrix v4.5 Active</p>
            </div>
            </div>

            <div className="space-y-3 relative z-10 flex-1">
            {alignment.setups.length > 0 ? alignment.setups.map((setup) => (
                <div key={setup.id} className="p-4 rounded-2xl border bg-emerald-600/5 border-emerald-500/20 flex justify-between items-center transition-all hover:translate-y-[-2px]">
                <div className="flex items-center space-x-4 overflow-hidden">
                    <p className="text-sm font-black text-white uppercase tracking-tight truncate">{`#${setup.id} ${setup.name}`}</p>
                </div>
                <span className="text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-emerald-500 text-white">ACTIVE</span>
                </div>
            )) : (
                <div className="h-full flex flex-col items-center justify-center py-8 opacity-30 italic">
                <i className="fas fa-search text-2xl mb-4"></i>
                <p className="text-[9px] font-black uppercase tracking-widest">NO SETUPS VALIDATED YET.</p>
                </div>
            )}
            </div>
            <i className="fas fa-microchip absolute -bottom-10 -right-10 text-[180px] text-white/[0.01] pointer-events-none rotate-12"></i>
        </div>
      </div>
    </div>
  );
};

export default StrategicAlignmentCockpit;
