
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DailyPrepData, MarketContextType, OpeningContext, 
  RelativeVolumeType, ParticipantType, ValueOverlap, ValueMigration, 
  StructuralAnomalyType, IntentFamily, WeeklyPrepData
} from '../types';
import { ALL_SETUPS } from '../data/setups';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

interface DecisionFunnelModalProps {
  onClose: () => void;
  onSave: (data: Partial<DailyPrepData>, date: string) => void;
  initialPrep?: DailyPrepData;
  initialWeeklyPrep?: WeeklyPrepData;
  date: string;
  isBacktest?: boolean;
  simulatedWeeklyPreps?: Record<string, WeeklyPrepData>;
}

const LayerHeader = ({ num, title, icon, colorClass, active }: { num: string, title: string, icon: string, colorClass: string, active?: boolean }) => (
    <div className={`flex items-center space-x-4 mb-6 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-white shadow-lg`}>
            <span className="text-[11px] font-black">{num}</span>
        </div>
        <div className="flex items-center space-x-3">
            <i className={`fas ${icon} text-slate-400 text-xs`}></i>
            <h4 className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">{title}</h4>
        </div>
        <div className="flex-1 h-px bg-slate-800/40 ml-4"></div>
    </div>
);

const SelectField = ({ label, value, options, onChange, icon, description }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
            {icon && <i className={`fas ${icon} text-[8px] text-slate-700 group-hover:text-blue-500 transition-colors`}></i>}
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
        </div>
        {description && (
            <div className="group/info relative">
                <i className="fas fa-info-circle text-[8px] text-slate-700 cursor-help"></i>
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 p-2 rounded-lg text-[7px] font-bold text-slate-400 uppercase hidden group-hover/info:block z-50">
                    {description}
                </div>
            </div>
        )}
    </div>
    <div className="relative">
        <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="w-full bg-[#0d121f]/80 border border-slate-800/60 rounded-xl px-4 py-4 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer hover:bg-[#121829] shadow-inner"
        >
            {options.map((opt: any) => (
                <option key={opt.val} value={opt.val} className="bg-[#03070c]">{opt.label}</option>
            ))}
        </select>
        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 text-[8px] pointer-events-none group-hover:text-blue-400"></i>
    </div>
  </div>
);

export const DecisionFunnelModal: React.FC<DecisionFunnelModalProps> = ({ onClose, onSave, initialPrep, initialWeeklyPrep, date, isBacktest, simulatedWeeklyPreps }) => {
  const { playbooks, weeklyPreps, dailyPreps } = useAppStore(useShallow(state => ({
    playbooks: state.playbooks || [],
    weeklyPreps: state.weeklyPreps || {},
    dailyPreps: state.dailyPreps || {}
  })));

  const [selectedDate, setSelectedDate] = useState(date);
  const [formData, setFormData] = useState<Partial<DailyPrepData>>(initialPrep || {
    marketContext: 'UNDEFINED',
    openingContext: 'ANY',
    volRelative: 'UNDEFINED',
    rangeExtensionActive: false,
    participantControl: 'UNDEFINED',
    observedValueOverlap: 'ANY',
    observedValueMigration: 'ANY',
    observedAnomalies: [],
    openType: 'None',
    setup: 'None',
    dailyNarrative: ''
  });

  // Re-fetch data if date changes
  useEffect(() => {
    const existing = dailyPreps[selectedDate];
    if (existing) {
        setFormData(prev => ({ ...prev, ...existing }));
    }
  }, [selectedDate, dailyPreps]);

  const updateField = (field: keyof DailyPrepData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getWeekId = (dStr: string) => {
    const d = new Date(dStr);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const currentWeekPrep = useMemo(() => {
    const wId = getWeekId(selectedDate);
    if (isBacktest && simulatedWeeklyPreps) return simulatedWeeklyPreps[wId];
    return weeklyPreps[wId];
  }, [selectedDate, weeklyPreps, isBacktest, simulatedWeeklyPreps]);

  const scannerVerdict = useMemo(() => {
    const protocol: string[] = [];
    
    // Add Macro Alignment String if weekly prep exists
    if (currentWeekPrep?.weeklyBias) {
        protocol.push(`MACRO BIAS: ${currentWeekPrep.weeklyBias.toUpperCase()} DETECTED.`);
    }

    const matchedSetups = ALL_SETUPS.filter(setup => {
        let score = 0;
        
        // 1. Context Alignment
        if (setup.contexts.includes(formData.marketContext as any)) score += 4;
        if (setup.openingContext === formData.openingContext || setup.openingContext === 'ANY') score += 2;
        
        // 2. Open Type Precision
        if (formData.openType && formData.openType !== 'None' && setup.openType === formData.openType) score += 6;

        // 3. Participant Logic
        if (formData.participantControl === 'OTF' && setup.dominantParticipant === 'OTF') score += 3;
        if (formData.participantControl === 'LOCALS' && setup.strategyType === 'Rotation') score += 3;

        // 4. Value Dynamics
        if (formData.observedValueMigration === setup.valueMigration) score += 3;
        if (formData.observedValueOverlap === setup.valueOverlap) score += 2;

        return score >= 6;
    });

    const families: Record<IntentFamily, any[]> = {
        CONFIDENCE: [], FILL: [], ROTATION: [], UNDEFINED: []
    };
    
    matchedSetups.forEach(s => families[s.intentFamily || 'UNDEFINED'].push(s));

    // Generate Dynamic Protocol Strings
    if (formData.participantControl === 'OTF') protocol.push("OTF ACTIVE: DO NOT FADE INITIATIVE. SEEK CONTINUATION.");
    if (formData.volRelative === 'BELOW_AVG') protocol.push("LOW VOLUME: EXPECT FAILED BREAKOUTS. MEAN REVERSION PRIORITY.");
    if (formData.observedValueMigration?.includes('outside')) protocol.push("VALUE MIGRATING: DISCOVERY PHASE. TREND FOLLOW ACTIVE.");

    return { families, protocol, allMatchedIds: matchedSetups.map(s => s.id) };
  }, [formData, currentWeekPrep]);

  const FAMILY_META = {
    CONFIDENCE: { label: "CONFIDENCE (Initiative)", desc: "High conviction moves, OTF control.", color: "text-blue-400", bg: "bg-blue-600/10", border: "border-blue-500/30", icon: "fa-rocket" },
    FILL: { label: "FILL (Responsive)", desc: "Returning to value after rejection.", color: "text-orange-400", bg: "bg-orange-600/10", border: "border-orange-500/30", icon: "fa-water" },
    ROTATION: { label: "ROTATION (Balance)", desc: "Range trading between extremes.", color: "text-emerald-400", bg: "bg-emerald-600/10", border: "border-emerald-500/30", icon: "fa-sync" }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-[#03070c] border border-slate-800/60 rounded-[3rem] w-full max-w-[1450px] max-h-[94vh] shadow-[0_0_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        <header className="px-10 py-8 border-b border-slate-800/40 bg-[#060b13] flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl">
                <i className="fas fa-filter text-2xl"></i>
            </div>
            <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">DECISION FUNNEL SCANNER</h3>
                <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MISSION SESSION:</span>
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-[9px] font-black text-indigo-400 uppercase outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
                    />
                </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-white transition-all">
            <i className="fas fa-times text-xl"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#03070c] space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* COLUMN 1: MARKET REGIME */}
            <section className="space-y-8 bg-[#0b1222]/30 p-8 rounded-[2.5rem] border border-slate-800/60">
                <LayerHeader num="01" title="Market Regime" icon="fa-arrows-to-dot" colorClass="bg-blue-600" active={true} />
                <div className="space-y-6">
                    <SelectField 
                        label="CONTEXT TYPE" 
                        value={formData.marketContext} 
                        options={[{val:'UNDEFINED', label:'CHOOSE...'}, {val:'STRONG_TREND', label:'STRONG TREND'}, {val:'TREND', label:'DISCOVERY'}, {val:'BALANCE', label:'NORMAL BALANCE'}, {val:'REVERSION', label:'REVERSION'}]} 
                        onChange={(v: any) => updateField('marketContext', v)} 
                    />
                    <SelectField 
                        label="OPENING LOCATION" 
                        value={formData.openingContext} 
                        options={[{val:'ANY', label:'ANY'}, {val:'OUT_OF_BALANCE', label:'GAP (OUTSIDE RANGE)'}, {val:'IN_BALANCE_OUTSIDE_VALUE', label:'INSIDE RANGE / OUTSIDE VA'}, {val:'IN_BALANCE_INSIDE_VALUE', label:'INSIDE VALUE'}]} 
                        onChange={(v: any) => updateField('openingContext', v)} 
                    />
                    <SelectField 
                        label="OPEN TYPE" 
                        value={formData.openType} 
                        options={[{val:'None', label:'NONE'}, {val:'Drive', label:'DRIVE'}, {val:'Test driver', label:'TEST DRIVE'}, {val:'Rejection- Reversal', label:'REJECTION-REV'}, {val:'Auction', label:'AUCTION'}]} 
                        onChange={(v: any) => updateField('openType', v)} 
                    />
                </div>
            </section>

            {/* COLUMN 2: PARTICIPANT MATRIX */}
            <section className="space-y-8 bg-[#0b1222]/30 p-8 rounded-[2.5rem] border border-slate-800/60">
                <LayerHeader num="02" title="Participant Matrix" icon="fa-users" colorClass="bg-orange-600" active={true} />
                <div className="space-y-6">
                    <SelectField 
                        label="RELATIVE VOLUME" 
                        value={formData.volRelative} 
                        options={[{val:'UNDEFINED', label:'CHOOSE...'}, {val:'ABOVE_AVG', label:'ABOVE AVG'}, {val:'AVG', label:'AVERAGE'}, {val:'BELOW_AVG', label:'BELOW AVG'}]} 
                        onChange={(v: any) => updateField('volRelative', v)} 
                    />
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block px-1">RANGE EXTENSION</label>
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button onClick={() => updateField('rangeExtensionActive', true)} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-lg transition-all ${formData.rangeExtensionActive ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-600'}`}>ACTIVE</button>
                            <button onClick={() => updateField('rangeExtensionActive', false)} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-lg transition-all ${!formData.rangeExtensionActive ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>INACTIVE</button>
                        </div>
                    </div>
                    <SelectField 
                        label="CONTROL DOMINANCE" 
                        value={formData.participantControl} 
                        options={[{val:'UNDEFINED', label:'CHOOSE...'}, {val:'OTF', label:'OTF (INSTITUTIONAL)'}, {val:'LOCALS', label:'LOCALS (RETAIL/DAY)'}, {val:'MIXED', label:'MIXED AUCTION'}]} 
                        onChange={(v: any) => updateField('participantControl', v)} 
                    />
                </div>
            </section>

            {/* COLUMN 3: VALUE DYNAMICS */}
            <section className="space-y-8 bg-[#0b1222]/30 p-8 rounded-[2.5rem] border border-slate-800/60">
                <LayerHeader num="03" title="Value Dynamics" icon="fa-clone" colorClass="bg-emerald-600" active={true} />
                <div className="space-y-6">
                    <SelectField 
                        label="VALUE OVERLAP" 
                        value={formData.observedValueOverlap} 
                        options={[{val:'ANY', label:'ANY'}, {val:'No overlapping', label:'NO OVERLAP (GAP)'}, {val:'Minimum overlap', label:'MINIMUM'}, {val:'High overlap', label:'HIGH OVERLAP'}, {val:'Full overlap', label:'FULL (INSIDE)'}]} 
                        onChange={(v: any) => updateField('observedValueOverlap', v)} 
                    />
                    <SelectField 
                        label="VALUE MIGRATION" 
                        value={formData.observedValueMigration} 
                        options={[{val:'ANY', label:'ANY'}, {val:'Migrating outside', label:'MIGRATING OUTSIDE'}, {val:'Migration to pdValue', label:'MIGRATING TO PD VALUE'}, {val:'None', label:'NONE (STABLE)'}]} 
                        onChange={(v: any) => updateField('observedValueMigration', v)} 
                    />
                    <div className="pt-4 border-t border-slate-800/40">
                         <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block px-1 mb-3">STRUCTURAL ANOMALIES</label>
                         <div className="grid grid-cols-2 gap-2">
                             {['POOR_STRUCTURE', 'LEDGE', 'SINGLE_PRINTS'].map(anomaly => (
                                 <button 
                                    key={anomaly}
                                    onClick={() => {
                                        const current = formData.observedAnomalies || [];
                                        const next = current.includes(anomaly as any) ? current.filter(a => a !== anomaly) : [...current, anomaly as any];
                                        updateField('observedAnomalies', next);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-[7px] font-black uppercase transition-all border ${formData.observedAnomalies?.includes(anomaly as any) ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                                 >
                                     {anomaly.replace('_', ' ')}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            </section>

            {/* COLUMN 4: PROTOCOL FEED */}
            <aside className="bg-[#0b1222] border border-blue-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[450px]">
                <div className="flex items-center space-x-4 mb-8 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><i className="fas fa-robot text-xl"></i></div>
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Protocol AI Feed</h4>
                </div>
                <div className="space-y-4 flex-1 relative z-10 custom-scrollbar overflow-y-auto pr-2">
                    {scannerVerdict.protocol.length > 0 ? scannerVerdict.protocol.map((line, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 transition-all hover:border-blue-500/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_10px_blue]"></div>
                            <p className="text-[10px] font-black text-slate-300 uppercase leading-tight">{line}</p>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-4">
                            <i className="fas fa-radar text-4xl"></i>
                            <p className="text-[9px] font-black uppercase tracking-widest">Scanning Market Reality...</p>
                        </div>
                    )}
                </div>
                <i className="fas fa-microchip absolute -bottom-10 -right-10 text-[180px] text-white/[0.01] pointer-events-none"></i>
            </aside>
          </div>

          {/* SETUP VALIDATION QUEUE */}
          <section className="bg-slate-950/40 border border-slate-800/60 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">VALIDATED STRATEGY QUEUE</h4>
                <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Found: {scannerVerdict.allMatchedIds.length} Valid Setups</span>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {(['CONFIDENCE', 'FILL', 'ROTATION'] as (keyof typeof FAMILY_META)[]).map(familyKey => {
                   const meta = FAMILY_META[familyKey];
                   const list = scannerVerdict.families[familyKey] || [];
                   return (
                     <div key={familyKey} className={`flex flex-col rounded-[2.5rem] border ${meta.border} ${meta.bg} overflow-hidden transition-all duration-500 ${list.length > 0 ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                        <div className="p-8 border-b border-white/5 bg-black/20">
                            <div className="flex items-center space-x-3 mb-2">
                                <i className={`fas ${meta.icon} ${meta.color} text-xs`}></i>
                                <h5 className={`text-[12px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</h5>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">{meta.desc}</p>
                        </div>
                        <div className="p-6 space-y-3 flex-1 min-h-[150px] custom-scrollbar overflow-y-auto">
                           {list.length > 0 ? list.map(s => (
                              <div 
                                key={s.id} 
                                onClick={() => updateField('setup', s.name)} 
                                className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group/item ${formData.setup === s.name ? 'bg-white/10 border-white/40 shadow-xl scale-[1.02]' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-600'}`}
                              >
                                <div className="flex flex-col overflow-hidden">
                                    <p className={`text-[11px] font-black uppercase tracking-tight truncate pr-4 ${formData.setup === s.name ? 'text-white' : 'text-slate-300'}`}>#{s.id} {s.name}</p>
                                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">{s.strategyType}</p>
                                </div>
                                {formData.setup === s.name ? <i className="fas fa-check-circle text-emerald-500 text-sm"></i> : <i className="fas fa-plus text-slate-800 group-hover/item:text-blue-500 text-[10px]"></i>}
                              </div>
                           )) : (
                               <div className="h-full flex items-center justify-center opacity-10 italic py-10">
                                   <p className="text-[10px] font-black uppercase">No Family Matches</p>
                               </div>
                           )}
                        </div>
                     </div>
                   );
                })}
             </div>
          </section>

          <section className="bg-slate-900/10 border border-slate-800/60 rounded-[3rem] p-10">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 block">SESSION NARRATIVE & CONTEXTUAL NOTES</label>
              <textarea 
                value={formData.dailyNarrative}
                onChange={e => updateField('dailyNarrative', e.target.value)}
                placeholder="Introdu notele strategice pentru această sesiune (ex: Watch for liquidity sweep below ONL before entering #12...)"
                className="w-full bg-[#0d121f] border border-slate-800 rounded-2xl p-8 text-slate-300 italic text-sm h-40 resize-none outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
          </section>
        </div>

        <footer className="px-10 py-8 border-t border-slate-800/60 bg-[#060b13] flex justify-end space-x-6 shrink-0">
          <button onClick={onClose} className="px-10 py-5 rounded-2xl bg-transparent border border-slate-800 text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] transition-all hover:bg-slate-900">ANULEAZĂ</button>
          <button 
            onClick={() => { onSave({ ...formData, validatedSetups: scannerVerdict.allMatchedIds }, selectedDate); onClose(); }} 
            className="px-20 py-5 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 border-t border-white/10"
          >
            VALIDATE & LOCK PROTOCOL
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DecisionFunnelModal;
