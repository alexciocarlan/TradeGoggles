
import React, { useMemo, useState } from 'react';
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
            {value ? value.replace(/_/g, ' ') : '---'}
        </p>
    </div>
);

const StrategicAlignmentCockpit: React.FC<StrategicAlignmentCockpitProps> = ({ prep, date, playbooks = [] }) => {
  const [copied, setCopied] = useState(false);

  const detailedReport = useMemo(() => {
    if (!prep) return "Awaiting Protocol Initialization...";

    const contextStr = prep.marketContext?.replace(/_/g, ' ') || 'UNDEFINED';
    const biasStr = prep.bias || 'NEUTRAL';
    const participants = prep.participantControl || 'MIXED';
    const openType = prep.openType || 'None';
    
    // Construire Raport Textual
    const lines = [
        `PROTOCOL OPERAȚIONAL :: ${date}`,
        `===========================================`,
        `1. CONTEXT & STRUCTURĂ`,
        `   • Regim Piață: ${contextStr} (${biasStr.toUpperCase()})`,
        `   • Control Participanți: ${participants}`,
        `   • Tip Deschidere: ${openType.toUpperCase()}`,
        `   • Volum Relativ: ${prep.volRelative?.replace(/_/g, ' ') || 'N/A'}`,
        ``,
        `2. STRATEGIE DE EXECUȚIE`,
        `   • Setup Primar: ${prep.setup?.toUpperCase() || 'NO SETUP'}`,
        `   • Key Level (Zona Interes): ${prep.zoneOfInterest || 'N/A'}`,
        `   • Trigger Validare: ${prep.continuationTrigger || 'N/A'}`,
        `   • Punct Invalidare: ${prep.invalidationPoint || 'N/A'}`,
        ``,
        `3. NARATIVĂ & FOCUS`,
        `   "${prep.dailyNarrative || 'Fără notițe adiționale.'}"`,
        ``,
        `4. PARAMETRI DE RISC`,
        `   • Gatekeeper Score: ${prep.gkTotalScore}/100`,
        `   • Risc Aprobat: ${prep.gkVerdict === 'Green' ? 'FULL SIZE' : 'REDUCED SIZE'}`,
        `===========================================`,
        `STATUS: ${prep.setup !== 'None' ? 'LOCKED & READY' : 'PENDING'}`
    ];

    return lines.join('\n');
  }, [prep, date]);

  const handleCopy = () => {
      navigator.clipboard.writeText(detailedReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  if (!prep) return (
    <div className="bg-[#0b1222]/40 border border-slate-800 p-12 rounded-[3rem] text-center opacity-40">
        <i className="fas fa-radar text-4xl text-slate-800 mb-6"></i>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Așteptare calibrare scanner...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* SECTION 1: VISUAL MATRIX (ICONS) */}
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

      {/* SECTION 2: DETAILED TEXT REPORT (TERMINAL STYLE) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-[#060b13] border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <i className="fas fa-file-invoice text-sm"></i>
                    </div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Strategic Protocol Report</h4>
                </div>
                <button 
                    onClick={handleCopy} 
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg transition-all active:scale-95"
                >
                    {copied ? <span className="text-emerald-500">COPIED!</span> : <span><i className="fas fa-copy mr-1"></i> COPY LOG</span>}
                </button>
            </div>
            
            <div className="flex-1 bg-[#0a0f1d] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <textarea 
                    readOnly 
                    value={detailedReport} 
                    className="w-full h-full bg-transparent border-none outline-none text-[11px] font-mono text-blue-300/80 resize-none leading-relaxed custom-scrollbar selection:bg-blue-500/30 selection:text-white"
                    style={{ minHeight: '300px' }}
                />
                <div className="absolute top-0 right-0 p-4 pointer-events-none">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* SECTION 3: VALIDATED SETUPS QUEUE (Visual) */}
        <div className="bg-[#0b1222]/80 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center space-x-4 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <i className="fas fa-check-double text-sm"></i>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Active Playbook Queue</h4>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Approved Setups</p>
                </div>
            </div>

            <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar max-h-[350px]">
                {prep.validatedSetups && prep.validatedSetups.length > 0 ? (
                    prep.validatedSetups.map((id) => {
                        // Find the full setup definition to get the name
                        const setupDef = ALL_SETUPS.find(s => s.id === id);
                        const displayName = setupDef ? setupDef.name : `SETUP ID #${id}`;
                        const icon = setupDef && setupDef.strategyType === 'Trend' ? 'fa-arrow-trend-up' : 'fa-bolt';

                        return (
                            <div key={id} className="p-4 rounded-2xl border bg-emerald-600/5 border-emerald-500/20 flex justify-between items-center transition-all hover:translate-y-[-2px]">
                                <div className="flex items-center space-x-4 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
                                        <i className={`fas ${icon} text-xs`}></i>
                                    </div>
                                    <p className="text-xs font-black text-white uppercase tracking-tight truncate">{displayName}</p>
                                </div>
                                <span className="text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-emerald-500 text-white shrink-0">ACTIVE</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-8 opacity-30 italic">
                        <i className="fas fa-search text-2xl mb-4"></i>
                        <p className="text-[9px] font-black uppercase tracking-widest">NO SYSTEM SETUPS DETECTED.</p>
                        <p className="text-[8px] uppercase mt-1">Manual Mode Only.</p>
                    </div>
                )}
                
                {/* Always show the manually selected setup if different */}
                {prep.setup && prep.setup !== 'None' && (
                     <div className="p-4 rounded-2xl border bg-blue-600/5 border-blue-500/20 flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-4 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shrink-0">
                                <i className="fas fa-user-check text-xs"></i>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MANUAL OVERRIDE</p>
                                <p className="text-xs font-black text-white uppercase tracking-tight truncate">{prep.setup}</p>
                            </div>
                        </div>
                        <span className="text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-blue-600 text-white shrink-0">PRIMARY</span>
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
