
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyPrepData, WeeklyPrepData, TradeScreenshot, Playbook } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { ALL_SETUPS } from '../data/setups';

interface StrategySelectionModalProps {
  onClose: () => void;
  onSave: (data: Partial<DailyPrepData>, date: string) => void;
  initialPrep?: DailyPrepData;
  date: string;
  overrideWeekPrep?: WeeklyPrepData;
  isBacktest?: boolean;
  simulatedWeeklyPreps?: Record<string, WeeklyPrepData>;
}

const KEY_LEVEL_OPTIONS = [
  { val: 'None', label: 'None' },
  { val: 'pdHigh', label: 'pdHigh' },
  { val: 'pdLow', label: 'pdLow' },
  { val: 'pdEQ', label: 'pdEQ' },
  { val: 'pdOpen', label: 'pdOpen' },
  { val: 'pdVAH', label: 'pdVAH' },
  { val: 'pdPOC', label: 'pdPOC' },
  { val: 'pdVAL', label: 'pdVAL' },
  { val: 'pdVWAPc', label: 'pdVWAPc' },
  { val: 'Settlment', label: 'Settlment' },
  { val: 'ONH', label: 'ONH' },
  { val: 'ONL', label: 'ONL' },
  { val: 'NY IB High', label: 'NY IB High' },
  { val: 'NY IB Low', label: 'NY IB Low' },
  { val: 'NY Open', label: 'NY Open' },
  { val: 'NY VWAP', label: 'NY VWAP' },
  { val: 'NY IB ext 1', label: 'NY IB ext 1' },
  { val: 'NY IB ex 2', label: 'NY IB ex 2' },
  { val: 'dHigh', label: 'dHigh' },
  { val: 'dVAH', label: 'dVAH' },
  { val: 'dVAL', label: 'dVAL' },
  { val: 'dVWAP', label: 'dVWAP' },
  { val: 'dLow', label: 'dLow' },
  { val: 'dOpen', label: 'dOpen' },
  { val: 'GAP high', label: 'GAP high' },
  { val: 'GAP low', label: 'GAP low' },
  { val: 'IB low', label: 'IB low' },
  { val: 'IB high', label: 'IB high' },
  { val: 'SP', label: 'SP' },
  { val: '4h High', label: '4h High' },
  { val: '4h Low', label: '4h Low' },
  { val: 'pwHigh', label: 'pwHigh' },
  { val: 'pwLow', label: 'pwLow' },
  { val: 'pwEQ', label: 'pwEQ' },
  { val: 'pwVAH', label: 'pwVAH' },
  { val: 'pwVAL', label: 'pwVAL' },
  { val: 'pwOpen', label: 'pwOpen' },
  { val: 'pwVWAPc', label: 'pwVWAPc' },
  { val: 'wHigh', label: 'wHigh' },
  { val: 'wLow', label: 'wLow' },
  { val: 'wOpen', label: 'wOpen' },
  { val: 'wVWAP', label: 'wVWAP' },
  { val: 'range VAL', label: 'range VAL' },
  { val: 'range VAH', label: 'range VAH' },
  { val: 'range POC', label: 'range POC' },
  { val: 'ndPOC', label: 'ndPOC' },
  { val: 'nwPOC', label: 'nwPOC' },
  { val: 'nmPOC', label: 'nmPOC' },
  { val: 'ndOpen', label: 'ndOpen' },
  { val: 'nwOpen', label: 'nwOpen' },
  { val: 'nmOpen', label: 'nmOpen' },
  { val: 'pmHigh', label: 'pmHigh' },
  { val: 'pmLow', label: 'pmLow' },
  { val: 'pmOpen', label: 'pmOpen' },
  { val: 'pmVAH', label: 'pmVAH' },
  { val: 'pmVAL', label: 'pmVAL' },
  { val: 'mOpen', label: 'mOpen' },
  { val: 'pmEQ', label: 'pmEQ' },
  { val: 'mVWAP', label: 'mVWAP' },
  { val: 'pmVWAPc', label: 'pmVWAPc' }
];

const SESSION_OPTIONS = [
  { val: 'None', label: 'None' },
  { val: 'NY Morning', label: 'NY Morning' },
  { val: 'NY Afternoon', label: 'NY Afternoon' },
  { val: 'London', label: 'London' },
  { val: 'Asia', label: 'Asia' }
];

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

const SelectField = ({ label, value, options, onChange, icon }: any) => (
  <div className="space-y-2 group">
    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block px-1">{label}</label>
    <div className="relative">
        <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="w-full bg-[#0d121f] border border-slate-800/60 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer hover:bg-[#121829]"
        >
            {options.map((opt: any) => (
                <option key={opt.val} value={opt.val}>{opt.label}</option>
            ))}
        </select>
        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 text-[8px] pointer-events-none group-hover:text-blue-400"></i>
    </div>
  </div>
);

const InputField = ({ label, value, placeholder, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block px-1">{label}</label>
    <input 
        type="text" 
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0d121f] border border-slate-800/60 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500/50 transition-all"
    />
  </div>
);

const StatusChip = ({ icon, label, value, colorClass = "text-blue-500", subValue }: any) => (
    <div className="bg-[#0b1222]/80 border border-slate-800/60 p-4 rounded-2xl flex items-center space-x-5 flex-1 min-w-[180px] shadow-lg group hover:border-slate-700 transition-all">
        <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center shrink-0">
            <i className={`fas ${icon} text-xs ${colorClass}`}></i>
        </div>
        <div className="overflow-hidden">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 leading-none">{label}</p>
            <p className={`text-[11px] font-black uppercase tracking-tight truncate leading-none ${colorClass}`}>{value || 'UNDEFINED'}</p>
            {subValue && <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1">{subValue}</p>}
        </div>
    </div>
);

const HeaderGroup = ({ title, children, icon, color, className = "flex-1" }: { title: string, children?: React.ReactNode, icon: string, color: string, className?: string }) => (
    <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-3 px-2">
            <i className={`fas ${icon} text-[8px] ${color} opacity-60`}></i>
            <h4 className={`text-[9px] font-black uppercase tracking-[0.3em] ${color} opacity-80`}>{title}</h4>
            <div className="flex-1 h-px bg-slate-800/40 ml-2"></div>
        </div>
        <div className="flex flex-wrap gap-4">
            {children}
        </div>
    </div>
);

export const StrategySelectionModal: React.FC<StrategySelectionModalProps> = ({ onClose, onSave, initialPrep, date, overrideWeekPrep, isBacktest, simulatedWeeklyPreps }) => {
  const { playbooks, weeklyPreps, dailyPreps } = useAppStore(useShallow(state => ({
    playbooks: state.playbooks,
    weeklyPreps: state.weeklyPreps,
    dailyPreps: state.dailyPreps
  })));

  const [selectedDate, setSelectedDate] = useState(date);
  const [formData, setFormData] = useState<Partial<DailyPrepData>>(initialPrep || {
    pdValueRelationship: 'None', onVsSettlement: 'None', onInventory: 'None', 
    pdExtremes: 'None', untestedPdVA: 'None', priorVPOC: 'None',
    openType: 'None', ibWidth: 'Normal', rangeExtension: 'None',
    spHigh: '', spLow: '', gapHigh: '', gapLow: '',
    setup: 'None', zoneOfInterest: '', continuationTrigger: '', reversalTrigger: '', 
    invalidationPoint: '', exitLevel: '', duringSession: 'None', in30MinSession: 'A',
    setup2: 'None', zoneOfInterest2: '', continuationTrigger2: '', reversalTrigger2: '', 
    invalidationPoint2: '', exitLevel2: '', duringSession2: 'None', in30MinSession2: 'A',
    dailyNarrative: '', prepScreenshots: []
  });

  // Re-fetch data if date changes
  useEffect(() => {
    const existing = dailyPreps[selectedDate];
    if (existing) {
        setFormData(prev => ({ ...prev, ...existing }));
    }
  }, [selectedDate, dailyPreps]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof DailyPrepData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSetupSelect = (field: 'setup' | 'setup2', setupName: string) => {
    const pb = playbooks.find(p => p.name === setupName);
    
    if (pb) {
      if (field === 'setup') {
        setFormData(prev => ({
          ...prev,
          setup: setupName,
          invalidationPoint: pb.invalidation,
          exitLevel: pb.target
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          setup2: setupName,
          invalidationPoint2: pb.invalidation,
          exitLevel2: pb.target
        }));
      }
    } else {
      updateField(field, setupName);
    }
  };

  const getWeekId = (dStr: string) => {
    const d = new Date(dStr);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const weekPrep = useMemo(() => {
    const wId = getWeekId(selectedDate);
    if (isBacktest && simulatedWeeklyPreps) return simulatedWeeklyPreps[wId];
    return weeklyPreps[wId];
  }, [selectedDate, weeklyPreps, isBacktest, simulatedWeeklyPreps]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        updateField('prepScreenshots', [{ url: compressed, caption: 'Strategy Analysis' }]);
    };
    reader.readAsDataURL(files[0]);
  };

  // --- LOGIC ENGINE: ARBITRAGE & FILTERING ---
  const strategicOutput = useMemo(() => {
    const protocol: string[] = [];
    
    if (weekPrep?.weeklyBias) {
        protocol.push(`MACRO ALIGNMENT: ${weekPrep.weeklyBias.toUpperCase()} BIAS ACTIVE.`);
        if (weekPrep.priceVsPWeek === 'inside pwRange') protocol.push("WEEKLY CONTEXT: BALANCE. EXPECT ROTATION.");
        if (weekPrep.priceVsPWeek === 'outside pwRange') protocol.push("WEEKLY CONTEXT: IMBALANCE. SEEK TREND CONTINUATION.");
    }

    if (formData.onRangeVsPDay === 'Inside') {
        protocol.push("VALUE: INSIDE DAY. LOWER PROBABILITY BREAKOUTS. FADE EXTREMES.");
    } else if (formData.onRangeVsPDay === 'Outside') {
        protocol.push("VALUE: OUTSIDE RANGE. HIGH PROBABILITY FOR DIRECTIONAL MOVE.");
    }

    if (formData.openType === 'Drive') {
        protocol.push("OPEN: DRIVE. AGGRESSIVE INITIATIVE. DO NOT FADE. GO WITH.");
    } else if (formData.openType === 'Test driver') {
        protocol.push("OPEN: TEST DRIVE. LOOK FOR REJECTION AT KEY LEVEL THEN ENTRY.");
    } else if (formData.openType === 'Rejection- Reversal') {
        protocol.push("OPEN: REJECTION. FAILED AUCTION LIKELY. TARGET OPPOSITE LIQUIDITY.");
    }

    if (formData.ibWidth === 'Narrow') {
        protocol.push("VOLATILITY: NARROW IB. HIGH PROBABILITY OF IB BREAKOUT/EXTENSION.");
    } else if (formData.ibWidth === 'Wide') {
        protocol.push("VOLATILITY: WIDE IB. EXPECT ROTATION INSIDE IB (CHOP).");
    }

    if (formData.onInventory && formData.onInventory !== 'None' && formData.onInventory !== 'Net Zero') {
        protocol.push(`INVENTORY: SKEWED ${formData.onInventory.toUpperCase()}. WATCH FOR EARLY CORRECTION.`);
    }

    const filteredSetups = ALL_SETUPS.filter(setup => {
        let score = 0;
        if (formData.openType && formData.openType !== 'None' && setup.openType === formData.openType) {
            score += 5;
        }
        if (formData.onRangeVsPDay === 'Outside' && setup.openingContext === 'OUT_OF_BALANCE') score += 3;
        if (formData.onRangeVsPDay === 'Inside' && setup.openingContext === 'IN_BALANCE_INSIDE_VALUE') score += 3;
        if (formData.pdExtremes === 'Poor High' && setup.relevantAnomaly === 'POOR_STRUCTURE') score += 4;
        if (formData.pdExtremes === 'Poor Low' && setup.relevantAnomaly === 'POOR_STRUCTURE') score += 4;
        if ((formData.spHigh || formData.spLow) && setup.relevantAnomaly === 'SINGLE_PRINTS') score += 2;
        return score >= 3;
    }).sort((a, b) => b.group.localeCompare(a.group));

    return { protocol, filteredSetups };
  }, [formData, weekPrep]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-[#03070c] border border-slate-800/60 rounded-[3rem] w-full max-w-[1250px] max-h-[96vh] shadow-[0_0_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <header className="px-10 py-8 border-b border-slate-800/40 bg-[#060b13] flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20">
                <i className="fas fa-rocket text-xl"></i>
            </div>
            <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">STRATEGY SELECTION: CALIBRATED COMMAND</h3>
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
          
          {/* REFACTORED STATUS HEADER - GROUPED BY LOGIC STEPS */}
          <section className="flex flex-col lg:flex-row gap-10 pb-8 border-b border-slate-800/40">
             
             {/* GROUP 1: WEEKLY ANCHOR */}
             <HeaderGroup title="WEEKLY ANCHOR STATUS" icon="fa-anchor" color="text-indigo-500" className="flex-[2]">
                <StatusChip 
                    icon="fa-compass" 
                    label="WEEKLY BIAS" 
                    value={weekPrep?.weeklyBias} 
                    colorClass={weekPrep?.weeklyBias === 'Bullish' ? 'text-emerald-500' : weekPrep?.weeklyBias === 'Bearish' ? 'text-red-500' : 'text-blue-500'} 
                />
                <StatusChip 
                    icon="fa-calculator" 
                    label="MATRIX CONTEXT SCORE" 
                    value={weekPrep?.matrixScore?.toString()} 
                    colorClass={Number(weekPrep?.matrixScore) >= 4 ? 'text-emerald-500' : Number(weekPrep?.matrixScore) <= -4 ? 'text-red-500' : 'text-blue-400'}
                    subValue={weekPrep?.matrixRegime}
                />
             </HeaderGroup>

             {/* GROUP 2: DECISION FUNNEL MATRIX */}
             <HeaderGroup title="SCANNER MATRIX READOUT" icon="fa-filter" color="text-blue-400" className="flex-[3]">
                <StatusChip 
                    icon="fa-chess-rook" 
                    label="MARKET REGIME" 
                    value={formData.marketContext?.replace(/_/g, ' ')} 
                    colorClass="text-blue-400" 
                />
                <StatusChip 
                    icon="fa-users" 
                    label="PARTICIPATION MATRIX" 
                    value={formData.participantControl} 
                    subValue={`VOL: ${formData.volRelative}`}
                    colorClass="text-orange-500" 
                />
                <StatusChip 
                    icon="fa-clone" 
                    label="VALUE DYNAMICS" 
                    value={formData.observedValueOverlap} 
                    subValue={`MIGRATION: ${formData.observedValueMigration}`}
                    colorClass="text-emerald-500" 
                />
             </HeaderGroup>
          </section>

          {/* TECHNICAL REFERENCES & LEVELS */}
          <section className="bg-slate-900/10 border border-slate-800/60 p-8 rounded-[3rem] space-y-10">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
                <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center mr-3 text-[9px]">1</span>
                TECHNICAL REFERENCES & LEVELS
             </h4>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SelectField label="ON RANGE VS PD RANGE" value={formData.onRangeVsPDay} options={[{val:'None', label:'None'}, {val:'Inside', label:'Inside'}, {val:'Outside', label:'Outside'}]} onChange={(v:any)=>updateField('onRangeVsPDay',v)} />
                <SelectField label="ON VS. SETTLEMENT" value={formData.onVsSettlement} options={[{val:'None', label:'None'}, {val:'lower', label:'lower'}, {val:'higher', label:'higher'}]} onChange={(v:any)=>updateField('onVsSettlement',v)} />
                <SelectField label="ON INVENTORY" value={formData.onInventory} options={[{val:'None', label:'None'}, {val:'Long', label:'Long'}, {val:'Short', label:'Short'}, {val:'Net Zero', label:'Net Zero'}]} onChange={(v:any)=>updateField('onInventory',v)} />
                
                <SelectField label="PD EXTREMES" value={formData.pdExtremes} options={[{val:'None', label:'None'}, {val:'Poor High', label:'Poor High'}, {val:'Poor Low', label:'Poor Low'}, {val:'Both', label:'Both'}]} onChange={(v:any)=>updateField('pdExtremes',v)} />
                <SelectField label="UNTESTED PDVA" value={formData.untestedPdVA} options={[{val:'None', label:'None'}, {val:'High', label:'High'}, {val:'Low', label:'Low'}, {val:'Both', label:'Both'}]} onChange={(v:any)=>updateField('untestedPdVA',v)} />
                <SelectField label="PD VPOC" value={formData.priorVPOC} options={[{val:'None', label:'None'}, {val:'naked', label:'naked'}, {val:'tapped', label:'tapped'}]} onChange={(v:any)=>updateField('priorVPOC',v)} />
             </div>

             <div className="pt-8 border-t border-slate-800/40">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-6">OPENING & IB DYNAMICS (CRITICAL FOR PLAYBOOK)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <SelectField label="OPEN TYPE" value={formData.openType} options={[{val:'None', label:'None'}, {val:'Drive', label:'Drive'}, {val:'Test driver', label:'Test driver'}, {val:'Rejection- Reversal', label:'Rejection- Reversal'}, {val:'Auction', label:'Auction'}]} onChange={(v:any)=>updateField('openType',v)} />
                    <SelectField label="IB WIDTH" value={formData.ibWidth} options={[{val:'Normal', label:'Normal'}, {val:'Narrow', label:'Narrow'}, {val:'Wide', label:'Wide'}]} onChange={(v:any)=>updateField('ibWidth',v)} />
                    <SelectField label="RANGE EXTENSION" value={formData.rangeExtension} options={[{val:'None', label:'None'}, {val:'Up', label:'Up'}, {val:'Down', label:'Down'}, {val:'Both', label:'Both'}]} onChange={(v:any)=>updateField('rangeExtension',v)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField label="SP HIGH" value={formData.spHigh} placeholder="e.g. 18250.25" onChange={(v:any)=>updateField('spHigh',v)} />
                    <InputField label="SP LOW" value={formData.spLow} placeholder="e.g. 18230.75" onChange={(v:any)=>updateField('spLow',v)} />
                    <InputField label="GAP HIGH" value={formData.gapHigh} placeholder="e.g. 18300.00" onChange={(v:any)=>updateField('gapHigh',v)} />
                    <InputField label="GAP LOW" value={formData.gapLow} placeholder="e.g. 18285.50" onChange={(v:any)=>updateField('gapLow',v)} />
                </div>
             </div>
          </section>

          {/* DUAL PROTOCOLS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-[#0b1222]/60 border border-slate-800 p-8 rounded-[3rem] shadow-xl relative overflow-hidden min-h-[200px] flex flex-col items-start justify-start">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><i className="fas fa-robot text-xs"></i></div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">STRATEGIC PROTOCOL GENERATED</p>
                </div>
                {strategicOutput.protocol.length > 0 ? (
                    <div className="space-y-3 w-full">
                        {strategicOutput.protocol.map((line, idx) => (
                            <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_5px_blue]"></div>
                                <p className="text-[10px] font-black text-slate-300 uppercase leading-tight">{line}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 w-full flex flex-col items-center justify-center opacity-30">
                        <i className="fas fa-dna text-3xl mb-2"></i>
                        <p className="text-[9px] font-black uppercase tracking-widest">AWAITING TECHNICAL INPUTS...</p>
                    </div>
                )}
             </div>

             <div className="bg-[#0b1222]/60 border border-slate-800 p-8 rounded-[3rem] shadow-xl relative overflow-hidden min-h-[200px] flex flex-col items-start justify-start">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><i className="fas fa-puzzle-piece text-xs"></i></div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">PLAYBOOK ACTIVATION: POTENTIAL SETUPS</p>
                </div>
                {strategicOutput.filteredSetups.length > 0 ? (
                    <div className="space-y-3 w-full max-h-[300px] overflow-y-auto custom-scrollbar">
                        {strategicOutput.filteredSetups.map((setup, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl cursor-pointer hover:bg-indigo-500/20 transition-all" onClick={() => handleSetupSelect('setup', setup.name)}>
                                <div className="flex items-center space-x-3">
                                    <span className="text-[9px] font-black text-indigo-400">#{setup.id}</span>
                                    <p className="text-[10px] font-black text-white uppercase">{setup.name}</p>
                                </div>
                                <i className="fas fa-plus text-[8px] text-indigo-400"></i>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 w-full flex flex-col items-center justify-center opacity-30">
                        <i className="fas fa-search text-3xl mb-2"></i>
                        <p className="text-[9px] font-black uppercase tracking-widest">NO MATCHING SETUPS FOUND</p>
                    </div>
                )}
             </div>
          </section>

          {/* HYPOTHESIS GENERATION */}
          <section className="space-y-10">
             <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center">
                <span className="w-5 h-5 rounded bg-orange-500/10 text-orange-500 flex items-center justify-center mr-3 text-[9px]">2</span>
                HYPOTHESIS GENERATION (SCENARIOS)
             </h4>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LONG HYPOTHESIS */}
                <div className="bg-emerald-600/5 border border-emerald-500/10 p-8 rounded-[3rem] shadow-xl space-y-8">
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg">L</div>
                        <h5 className="text-sm font-black text-emerald-500 uppercase tracking-widest italic">LONG HYPOTHESIS</h5>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <SelectField label="KEY LEVEL" value={formData.zoneOfInterest} options={KEY_LEVEL_OPTIONS} onChange={(v:any)=>updateField('zoneOfInterest',v)} />
                        <SelectField label="ACTIVATED SETUP" value={formData.setup} options={[{val:'None', label:'None'}, ...playbooks.map(p=>({val:p.name, label:p.name}))]} onChange={(v:any)=>handleSetupSelect('setup',v)} />
                        <SelectField label="DURING SESSION" value={formData.duringSession} options={SESSION_OPTIONS} onChange={(v:any)=>updateField('duringSession',v)} />
                        <SelectField label="IN 30 MIN SESSION" value={formData.in30MinSession} options={[{val:'A', label:'A'}, {val:'B', label:'B'}, {val:'C', label:'C'}, {val:'D', label:'D'}]} onChange={(v:any)=>updateField('in30MinSession',v)} />
                        <InputField label="INVALIDATION" value={formData.invalidationPoint} placeholder="e.g. pdVAL" onChange={(v:any)=>updateField('invalidationPoint',v)} />
                        <InputField label="EXIT LEVEL" value={formData.exitLevel} placeholder="e.g. pdVAH" onChange={(v:any)=>updateField('exitLevel',v)} />
                        <SelectField label="CONT. TRIGGER" value={formData.continuationTrigger} options={[{val:'None', label:'None'}, {val:'Trap', label:'Trap'}, {val:'Absorption', label:'Absorption'}]} onChange={(v:any)=>updateField('continuationTrigger',v)} />
                        <SelectField label="REV. TRIGGER" value={formData.reversalTrigger} options={[{val:'None', label:'None'}, {val:'Flush', label:'Flush'}, {val:'No Tails', label:'No Tails'}]} onChange={(v:any)=>updateField('reversalTrigger',v)} />
                    </div>
                </div>

                {/* SHORT HYPOTHESIS */}
                <div className="bg-red-600/5 border border-red-500/10 p-8 rounded-[3rem] shadow-xl space-y-8">
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg">S</div>
                        <h5 className="text-sm font-black text-red-500 uppercase tracking-widest italic">SHORT HYPOTHESIS</h5>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <SelectField label="KEY LEVEL" value={formData.zoneOfInterest2} options={KEY_LEVEL_OPTIONS} onChange={(v:any)=>updateField('zoneOfInterest2',v)} />
                        <SelectField label="ACTIVATED SETUP" value={formData.setup2} options={[{val:'None', label:'None'}, ...playbooks.map(p=>({val:p.name, label:p.name}))]} onChange={(v:any)=>handleSetupSelect('setup2',v)} />
                        <SelectField label="DURING SESSION" value={formData.duringSession2} options={SESSION_OPTIONS} onChange={(v:any)=>updateField('duringSession2',v)} />
                        <SelectField label="IN 30 MIN SESSION" value={formData.in30MinSession2} options={[{val:'A', label:'A'}, {val:'B', label:'B'}, {val:'C', label:'C'}, {val:'D', label:'D'}]} onChange={(v:any)=>updateField('in30MinSession2',v)} />
                        <InputField label="INVALIDATION" value={formData.invalidationPoint2} placeholder="e.g. pdVAH" onChange={(v:any)=>updateField('invalidationPoint2',v)} />
                        <InputField label="EXIT LEVEL" value={formData.exitLevel2} placeholder="e.g. pdVAL" onChange={(v:any)=>updateField('exitLevel2',v)} />
                        <SelectField label="CONT. TRIGGER" value={formData.continuationTrigger2} options={[{val:'None', label:'None'}, {val:'Trap', label:'Trap'}, {val:'Absorption', label:'Absorption'}]} onChange={(v:any)=>updateField('continuationTrigger2',v)} />
                        <SelectField label="REV. TRIGGER" value={formData.reversalTrigger2} options={[{val:'None', label:'None'}, {val:'Flush', label:'Flush'}, {val:'No Tails', label:'No Tails'}]} onChange={(v:any)=>updateField('reversalTrigger2',v)} />
                    </div>
                </div>
             </div>
          </section>

          {/* VISUAL ANALYSIS */}
          <section className="space-y-10">
             <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center">
                <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center mr-3 text-[9px]">3</span>
                VISUAL ANALYSIS & KEY LEVELS (SCREENSHOTS)
             </h4>
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video bg-slate-900/20 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer group transition-all"
             >
                {formData.prepScreenshots && formData.prepScreenshots.length > 0 ? (
                    <img src={formData.prepScreenshots[0].url} className="w-full h-full object-contain rounded-[3rem]" alt="Prep" />
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-700 group-hover:text-blue-500 group-hover:bg-blue-600/10 transition-all">
                            <i className="fas fa-camera text-2xl"></i>
                        </div>
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">UPLOAD CHART ANALYSIS</p>
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
             </div>
          </section>

          {/* NARRATIVE */}
          <section className="space-y-6">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">DAILY NARRATIVE & CONTEXTUAL NOTES</label>
             <textarea 
                value={formData.dailyNarrative}
                onChange={e => updateField('dailyNarrative', e.target.value)}
                placeholder="Descrie contextul zilei, sentimentul pieței și așteptările tale..."
                className="w-full bg-[#0d121f] border border-slate-800/60 rounded-[1.5rem] p-8 text-slate-300 italic text-sm h-48 resize-none outline-none focus:ring-1 focus:ring-blue-500/40 shadow-inner"
             />
          </section>
        </div>

        <footer className="px-10 py-8 border-t border-slate-800/60 bg-[#060b13] flex justify-end space-x-6 shrink-0">
          <button onClick={onClose} className="flex-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-500 font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.4em] transition-all">ANULEAZĂ</button>
          <button 
            onClick={() => { onSave(formData, selectedDate); onClose(); }} 
            className="flex-[3] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 border-t border-white/20"
          >
            FINALIZEAZĂ PREGĂTIREA
          </button>
        </footer>
      </div>
    </div>
  );
};

export default StrategySelectionModal;
