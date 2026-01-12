
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

const SelectField = ({ label, value, options, onChange, icon, description, disabled = false }: any) => (
  <div className={`space-y-2 group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
            disabled={disabled}
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

const InputField = ({ label, value, onChange, placeholder, type = "text" }: any) => (
    <div className="space-y-2">
        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block px-1">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full bg-[#0d121f]/80 border border-slate-800/60 rounded-xl px-4 py-4 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
        />
    </div>
);

const DecisionFunnelModal: React.FC<DecisionFunnelModalProps> = ({ onClose, onSave, initialPrep, initialWeeklyPrep, date, isBacktest, simulatedWeeklyPreps }) => {
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
    dailyNarrative: '',
    rangeExtension: 'None',
    // New Technical Fields Defaults
    onRangeVsPDay: 'None', onVsSettlement: 'None', onInventory: 'None',
    pdExtremes: 'None', untestedPdVA: 'None', priorVPOC: 'None', ibWidth: 'Normal',
    spHigh: '', spLow: '', gapHigh: '', gapLow: '',
    singlePrints: 'None' // Initialize Single Prints
  });

  // Local state for Price Action Calculation (Addendum 5.1 Inputs)
  const [calcInputs, setCalcInputs] = useState({
      pdHigh: '', pdLow: '', pdClose: '',
      onHigh: '', onLow: ''
  });

  useEffect(() => {
    const existing = dailyPreps[selectedDate];
    if (existing) {
        setFormData(prev => ({ ...prev, ...existing }));
    }
  }, [selectedDate]);

  // --- AUTOMATED LOGIC GATE ENGINE (ADDENDUM 5.1) ---
  useEffect(() => {
      const pdH = parseFloat(calcInputs.pdHigh);
      const pdL = parseFloat(calcInputs.pdLow);
      const pdC = parseFloat(calcInputs.pdClose);
      const onH = parseFloat(calcInputs.onHigh);
      const onL = parseFloat(calcInputs.onLow);

      if (!isNaN(pdH) && !isNaN(pdL) && !isNaN(pdC) && !isNaN(onH) && !isNaN(onL)) {
          const updates: Partial<DailyPrepData> = {};

          // Logic Gate 1 & 2: Inventory Analysis
          if (onL > pdC) {
              updates.onInventory = 'Long'; // 100% Net Long (Gap Up / Higher)
              updates.onVsSettlement = 'higher';
          } else if (onH < pdC) {
              updates.onInventory = 'Short'; // 100% Net Short (Gap Down / Lower)
              updates.onVsSettlement = 'lower';
          } else {
              updates.onInventory = 'Net Zero'; // Balanced
              updates.onVsSettlement = 'None';
          }

          // Logic Gate 3 & 4: Context (Range)
          if (onH < pdH && onL > pdL) {
              updates.onRangeVsPDay = 'Inside'; // In-Range / Balance
          } else {
              updates.onRangeVsPDay = 'Outside'; // Out-of-Range / Imbalance
          }

          setFormData(prev => ({ ...prev, ...updates }));
      }
  }, [calcInputs]);

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

  // --- STRATEGY FAMILY LOGIC (V5.2 ADDENDUM INTEGRATION) ---
  const activeStrategies = useMemo(() => {
    const wScore = currentWeekPrep?.matrixScore || 0;
    const wBias = currentWeekPrep?.weeklyBias || 'Neutral'; // Macro Bias Filter
    const wValue = currentWeekPrep?.valueRelationship || 'None';
    const wStructHigh = currentWeekPrep?.structureHigh || 'Secure';
    const wStructLow = currentWeekPrep?.structureLow || 'Secure';
    
    const dOpen = formData.openType || 'None';
    const dVol = formData.volRelative || 'UNDEFINED'; 
    const dIB = formData.ibWidth || 'Normal';
    const dRangeExt = formData.rangeExtension || 'None';
    const dVPOC = formData.priorVPOC || 'None';
    const dUntestedVA = formData.untestedPdVA || 'None';
    const dMigration = formData.observedValueMigration || 'ANY'; 
    const dOverlap = formData.observedValueOverlap || 'ANY'; // ** KEY INPUT: Value Overlap
    
    // Family A: CONFIDENCE (Trend / Momentum / Alignment)
    const isAlignedBullish = wBias === 'Bullish' && (dRangeExt === 'Up' || dOpen.includes('Up') || dOpen === 'Drive');
    const isAlignedBearish = wBias === 'Bearish' && (dRangeExt === 'Down' || dOpen.includes('Down') || dOpen === 'Drive');

    const isVolumeSupportedA = dVol === 'ABOVE_AVG' && (dOpen === 'Drive' || dOpen === 'Test driver' || dRangeExt !== 'None');

    // ** LOGIC: NO OVERLAP + MIGRATION = CONFIDENCE **
    const isTrendLogic = dOverlap === 'No overlapping' || dMigration === 'Migrating outside';

    const isFamilyA = 
        isTrendLogic || 
        isAlignedBullish || isAlignedBearish ||
        (dOpen === 'Drive') || 
        (dOpen === 'Test driver') ||
        (wScore >= 2 && (dOpen === 'Gap Up' || dOpen === 'Open Drive Up')) ||
        (wScore <= -2 && (dOpen === 'Gap Down' || dOpen === 'Open Drive Down')) ||
        isVolumeSupportedA || 
        (formData.onRangeVsPDay === 'Outside' && dOpen !== 'Rejection- Reversal') || 
        (dIB === 'Narrow');

    // Family B: ROTATION (Balance / Inside Range / No Extension)
    const isVolumeForcedB = dVol === 'BELOW_AVG';

    // ** LOGIC: FULL OVERLAP = ROTATION **
    const isBalanceLogic = dOverlap === 'Full overlap' || dMigration === 'None';

    const isFamilyB = 
        isBalanceLogic ||
        (dOpen === 'Auction') || 
        isVolumeForcedB || 
        wBias === 'Neutral' ||
        (wScore > -2 && wScore < 2) || 
        (dOpen === 'None') ||
        (formData.participantControl === 'LOCALS') ||
        (formData.onRangeVsPDay === 'Inside') || 
        (dUntestedVA !== 'None' && formData.onRangeVsPDay === 'Inside') || 
        (dIB === 'Wide') || 
        (dRangeExt === 'None'); 

    // Family C: REPAIR (Structure & Inventory) - LOGIC GATE
    
    // ** LOGIC: HIGH OVERLAP = REPAIR/FILL **
    const isRepairLogic = dOverlap === 'High overlap' || dMigration === 'Migration to pdValue';

    const isFamilyC = 
        isRepairLogic || 
        (wStructHigh === 'Poor' && (wValue === 'Higher' || wValue === 'Unchanged')) ||
        (wStructLow === 'Poor' && (wValue === 'Lower' || wValue === 'Unchanged')) ||
        (formData.onInventory === 'Long' || formData.onInventory === 'Short') ||
        (dVPOC === 'naked') ||
        (dUntestedVA !== 'None'); 

    // Family D: CORRECTION (Conflict / Neutral Day / Counter-Bias)
    const isConflictBullish = wBias === 'Bullish' && (dRangeExt === 'Down' || dOpen.includes('Down'));
    const isConflictBearish = wBias === 'Bearish' && (dRangeExt === 'Up' || dOpen.includes('Up'));

    const isFamilyD = 
        (dOpen === 'Rejection- Reversal') || 
        isConflictBullish || isConflictBearish ||
        (wScore >= 2 && (dOpen === 'Gap Down' || dOpen === 'Rejection- Reversal')) ||
        (wScore <= -2 && (dOpen === 'Gap Up' || dOpen === 'Rejection- Reversal')) ||
        (currentWeekPrep?.matrixTags?.some(t => t.includes('CONFLICT'))) ||
        (dRangeExt === 'Both'); 

    return { CONFIDENCE: isFamilyA, ROTATION: isFamilyB, REPAIR: isFamilyC, CORRECTION: isFamilyD };
  }, [currentWeekPrep, formData]);

  const scannerVerdict = useMemo(() => {
    const protocol: string[] = [];
    if (currentWeekPrep?.weeklyBias) protocol.push(`MACRO BIAS: ${currentWeekPrep.weeklyBias.toUpperCase()} (${currentWeekPrep.matrixScore})`);
    
    // --- SINGLE PRINTS OVERRIDE PROTOCOL (High Priority) ---
    if (formData.singlePrints === 'Below Open') {
        protocol.push("SP SUPPORT: BUYING TAIL BELOW. SHORTS BLOCKED.");
        protocol.push("SETUP FOCUS: BUY THE DIP / TREND CONTINUATION.");
    } else if (formData.singlePrints === 'Above Open') {
        protocol.push("SP RESISTANCE: SELLING TAIL ABOVE. LONGS BLOCKED.");
        protocol.push("SETUP FOCUS: REJECTION / FADE.");
    } else if (formData.singlePrints === 'Inside') {
        protocol.push("REGIME CHANGE: VACUUM / FAST DYNAMIC.");
        protocol.push("RISK ALERT: VOLATILE ZONE. WIDE STOPS REQUIRED.");
    }

    // --- VALUE OVERLAP INFLUENCE (Explicit) ---
    if (formData.observedValueOverlap === 'No overlapping') {
        protocol.push("VALUE OVERLAP: NONE. IMBALANCE CONFIRMED. SEEK TREND (FAMILY A).");
    } else if (formData.observedValueOverlap === 'Full overlap') {
        protocol.push("VALUE OVERLAP: FULL. BALANCED MARKET. FADE EXTREMES (FAMILY B).");
        protocol.push("CAUTION: BREAKOUTS WILL LIKELY FAIL.");
    } else if (formData.observedValueOverlap === 'High overlap') {
        protocol.push("VALUE OVERLAP: HIGH. SEEK REPAIR/FILLS (FAMILY C).");
    }

    // --- VALUE MIGRATION INFLUENCE (Explicit) ---
    if (formData.observedValueMigration === 'Migrating outside') {
        protocol.push("VALUE MIGRATION: OUTSIDE. ACCEPTANCE OF NEW PRICES.");
    } else if (formData.observedValueMigration === 'Migration to pdValue') {
        protocol.push("VALUE MIGRATION: RETURNING TO VALUE. FAILED BREAKOUT.");
    }

    // --- RELATIVE VOLUME INFLUENCE (Explicit) ---
    if (formData.volRelative === 'ABOVE_AVG') {
        protocol.push("FUEL ALERT: HIGH RELATIVE VOLUME. BREAKOUTS VALIDATED.");
    } else if (formData.volRelative === 'BELOW_AVG') {
        protocol.push("LOW ENERGY WARNING: WEAK VOLUME. EXPECT TRAPS.");
    }

    // --- OPEN TYPE INFLUENCE (Explicit) ---
    if (formData.openType === 'Drive') {
        protocol.push("OPEN TYPE: DRIVE. AGGRESSIVE INITIATIVE. (FAMILY A - MOMENTUM).");
    } else if (formData.openType === 'Rejection- Reversal') {
        protocol.push("OPEN TYPE: REJECTION. FAILURE TO GO. (FAMILY D/C - FADE/FILL).");
    } else if (formData.openType === 'Auction') {
        protocol.push("OPEN TYPE: AUCTION. TWO-WAY TRADE. (FAMILY B - ROTATION).");
    } else if (formData.openType === 'Test driver') {
        protocol.push("OPEN TYPE: TEST DRIVE. DIRECTIONAL CONVICTION. (FAMILY A/C).");
    }

    // --- ON RANGE INFLUENCE (Logic Gate 3) ---
    if (formData.onRangeVsPDay === 'Inside') {
        protocol.push("ON RANGE: INSIDE BALANCE. HIGH ROTATION PROBABILITY (FAMILY B).");
    } else if (formData.onRangeVsPDay === 'Outside') {
        protocol.push("ON RANGE: OUTSIDE. IMBALANCE DETECTED. SEEK DIRECTION (FAMILY A).");
    }

    // --- ADDENDUM 5.1: VPOC MAGNET LOGIC ---
    if (formData.priorVPOC === 'naked') {
        protocol.push("MAGNET ALERT: UNTESTED VPOC DETECTED. HIGH PROBABILITY TARGET (FAMILY C).");
    }

    // --- ADDENDUM 5.1: UNTESTED VA MAGNET LOGIC ---
    if (formData.untestedPdVA === 'High') {
        protocol.push("VALUE MAGNET: UNTESTED VAH. TARGET ACQUIRED (80% RULE).");
    } else if (formData.untestedPdVA === 'Low') {
        protocol.push("VALUE MAGNET: UNTESTED VAL. TARGET ACQUIRED (80% RULE).");
    } else if (formData.untestedPdVA === 'Both') {
        protocol.push("VALUE MAGNET: UNTESTED VA BOUNDARIES. ROTATION MODE ACTIVE.");
    }

    // --- ADDENDUM 5.1: INVENTORY RISK ALERTS & SETUP ACTIVATION ---
    if (formData.onInventory === 'Long') {
        protocol.push("INVENTORY ALERT: 100% NET LONG. Watch for Flush to Settlement.");
        protocol.push("SETUP #14 (INVENTORY CORRECTION) ACTIVATED.");
    } else if (formData.onInventory === 'Short') {
        protocol.push("INVENTORY ALERT: 100% NET SHORT. Watch for Covering Rally.");
        protocol.push("SETUP #14 (INVENTORY CORRECTION) ACTIVATED.");
    }

    // --- RANGE EXTENSION & BIAS INFLUENCE ---
    const wBias = currentWeekPrep?.weeklyBias || 'Neutral';
    
    if (formData.rangeExtension === 'Up') {
        if (wBias === 'Bullish') protocol.push("ALIGNED FLOW: MACRO + DAILY BUYERS. FULL SIZE.");
        if (wBias === 'Bearish') protocol.push("CONFLICT FLOW: MACRO BEAR vs DAILY BULL. USE CAUTION (FAMILY D).");
    }
    if (formData.rangeExtension === 'Down') {
        if (wBias === 'Bearish') protocol.push("ALIGNED FLOW: MACRO + DAILY SELLERS. FULL SIZE.");
        if (wBias === 'Bullish') protocol.push("CONFLICT FLOW: MACRO BULL vs DAILY BEAR. USE CAUTION (FAMILY D).");
    }
    
    if (formData.rangeExtension === 'Both') protocol.push("R.EXT BOTH: NEUTRAL DAY DETECTED. EXPECT CHOP (FAMILY D).");
    if (formData.rangeExtension === 'None') protocol.push("R.EXT NONE: INSIDE DAY. ROTATION RULES APPLY (FAMILY B).");

    // --- IB WIDTH INFLUENCE ---
    if (formData.ibWidth === 'Narrow') {
        protocol.push("VOLATILITY ALERT: NARROW IB. ENERGY COMPRESSION. HIGH BREAKOUT POTENTIAL (SETUP #15).");
    } else if (formData.ibWidth === 'Wide') {
        protocol.push("VOLATILITY ALERT: WIDE IB. RANGE ESTABLISHED. EXPECT ROTATION & FADE EXTREMES.");
    }

    if (activeStrategies.CONFIDENCE) protocol.push("FAMILY A ACTIVE: MOMENTUM & DRIVE.");
    if (activeStrategies.REPAIR) protocol.push("FAMILY C ACTIVE: STRUCTURAL REPAIR & INVENTORY FILL.");
    
    // --- ADDENDUM 5.1: ANOMALY INTEGRATION (Module B) ---
    if (formData.pdExtremes === 'Poor High' && (formData.openType === 'Open Drive Up' || formData.openType === 'Drive')) {
        protocol.push("SETUP ACTIVATED: POOR HIGH MAGNET TRADE (Target: pdHigh + 1 tick).");
    }
    if (formData.pdExtremes === 'Poor High' && formData.openType === 'Rejection- Reversal') {
        protocol.push("SYSTEM ALERT: MAGNET DEZACTIVAT. Piața refuză repararea structurii azi.");
    }

    if (activeStrategies.CORRECTION) protocol.push("FAMILY D WARNING: CONFLICT DETECTED.");

    const matchedSetups = ALL_SETUPS.filter(setup => {
        let score = 0;

        // Force Setup 15 if IB is Narrow
        if (formData.ibWidth === 'Narrow' && setup.id === 15) return true;

        // ** FORCE VPOC SETUPS IF NAKED **
        if (formData.priorVPOC === 'naked' && (setup.id === 20 || setup.id === 38)) return true;

        // ** FORCE VALUE AREA SETUPS IF UNTESTED **
        if (formData.untestedPdVA !== 'None' && (setup.id === 4 || setup.id === 26)) return true;

        // --- SINGLE PRINTS OVERRIDE LOGIC (Filter Enforcement) ---
        if (formData.singlePrints === 'Below Open') {
            // CAZ 1: Support Below.
            // Action: Block Short Breakouts.
            // Assumption: 'Trend' usually implies breakouts. If market is bullish (context), Trend is Long.
            // If setup is Trend/Confidence, we Boost.
            if (setup.intentFamily === 'CONFIDENCE' || setup.strategyType === 'Trend') score += 3;
            
            // Specific Activations from Doc: #29 Trend Continuation, #9 Breakout Pullback (Short Covering)
            if (setup.id === 29 || setup.id === 9) score += 15; // Force to top
        }

        if (formData.singlePrints === 'Above Open') {
            // CAZ 2: Resistance Above.
            // Action: Block Long Breakouts.
            // Logic: Penalize 'Trend' unless it's explicitly Short (hard to know without 'direction' field, so we rely on Family).
            if (setup.strategyType === 'Trend') score -= 5; 

            // Boost Rejection/Reversion/Short
            if (setup.strategyType === 'Reversion' || setup.intentFamily === 'FILL') score += 3;
            
            // Specific Activation: #3 Open Rejection Reverse
            if (setup.id === 3) score += 15; // Force to top
        }

        if (formData.singlePrints === 'Inside') {
            // CAZ 3: Vacuum / Volatility
            // Action: Block Rotation/Balance (Slow setups)
            if (setup.strategyType === 'Rotation' || setup.intentFamily === 'ROTATION') score -= 10;
            
            // Exclusive Activation: #31 Volume Vacuum
            if (setup.id === 31) score += 20; // Massive Boost
        }

        // ** FILTER BY OPEN TYPE (Strict Filtering) **
        if (setup.openType && formData.openType && formData.openType !== 'None') {
            if (setup.openType === 'Drive' && formData.openType !== 'Drive' && formData.openType !== 'Open Drive Up' && formData.openType !== 'Open Drive Down') return false;
            if (setup.openType === 'Rejection- Reversal' && formData.openType !== 'Rejection- Reversal') return false;
            if (setup.openType === 'Test driver' && formData.openType !== 'Test driver') return false;
        }

        // ** FILTER BY VALUE OVERLAP **
        if (formData.observedValueOverlap === 'No overlapping' && setup.strategyType === 'Trend') score += 4;
        if (formData.observedValueOverlap === 'Full overlap') {
            if (setup.strategyType === 'Rotation') score += 4;
            // Punish breakouts heavily in full overlap
            if (setup.strategyType === 'Trend' || setup.name.includes('Breakout') || setup.name.includes('Drive')) score -= 6;
        }
        if (formData.observedValueOverlap === 'High overlap' && (setup.strategyType === 'Reversion' || setup.strategyType === 'Rotation')) score += 2;

        // ** FILTER BY VALUE MIGRATION **
        if (formData.observedValueMigration === 'Migrating outside' && setup.strategyType === 'Trend') score += 3;
        if (formData.observedValueMigration === 'Migration to pdValue' && setup.strategyType === 'Reversion') score += 3;

        // ** FILTER BY RELATIVE VOLUME **
        if (formData.volRelative === 'ABOVE_AVG') {
             if (setup.strategyType === 'Trend') score += 3;
        }
        if (formData.volRelative === 'BELOW_AVG') {
             if (setup.strategyType === 'Rotation' || setup.strategyType === 'Reversion') score += 3;
             if (setup.openType === 'Drive' || setup.name.includes('Breakout') || setup.name.includes('Expansion')) score -= 5;
        }

        // V5.0 Filter Logic
        if (activeStrategies.CONFIDENCE && setup.intentFamily === 'CONFIDENCE') score += 2;
        if (activeStrategies.ROTATION && setup.intentFamily === 'ROTATION') score += 2;
        if (activeStrategies.REPAIR && setup.intentFamily === 'FILL') score += 2; 
        if (activeStrategies.CORRECTION && setup.intentFamily === 'Correction') score += 2;
        
        // Setup 14 Specific Logic Override (Explicit Inventory Check)
        if (setup.id === 14 && (formData.onInventory === 'Long' || formData.onInventory === 'Short')) return true;

        // Fallback scoring for edge cases
        if (setup.contexts.includes(formData.marketContext as any)) score += 2;
        if (setup.openType === formData.openType) score += 4;
        
        return score >= 4;
    });

    const families: Record<string, any[]> = { CONFIDENCE: [], FILL: [], ROTATION: [], CORRECTION: [] };
    matchedSetups.forEach(s => {
        const key = s.intentFamily || 'ROTATION'; 
        if (families[key]) families[key].push(s);
    });

    return { families, protocol, allMatchedIds: matchedSetups.map(s => s.id) };
  }, [formData, currentWeekPrep, activeStrategies]);

  const FAMILY_META = {
    CONFIDENCE: { label: "FAMILY A: CONFIDENCE", desc: "Go With. Momentum. Breakouts.", color: "text-blue-400", bg: "bg-blue-600/10", border: "border-blue-500/30", icon: "fa-rocket" },
    FILL: { label: "FAMILY C: REPAIR/FILL", desc: "Inventory & Structure Repair. Gap Fills.", color: "text-orange-400", bg: "bg-orange-600/10", border: "border-orange-500/30", icon: "fa-magnet" },
    ROTATION: { label: "FAMILY B: ROTATION", desc: "Fade Extremes. Balance Rules.", color: "text-emerald-400", bg: "bg-emerald-600/10", border: "border-emerald-500/30", icon: "fa-sync" },
    CORRECTION: { label: "FAMILY D: CONFLICT", desc: "Counter-Trend. Deep Pullbacks.", color: "text-red-400", bg: "bg-red-600/10", border: "border-red-500/30", icon: "fa-triangle-exclamation" }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-[#03070c] border border-slate-800/60 rounded-[3rem] w-full max-w-[1450px] max-h-[94vh] shadow-[0_0_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        <header className="px-10 py-8 border-b border-slate-800/40 bg-[#060b13] flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl"><i className="fas fa-filter text-2xl"></i></div>
            <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">DECISION FUNNEL (V5.1)</h3>
                <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WEEKLY ANCHOR:</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${currentWeekPrep?.matrixScore && currentWeekPrep.matrixScore > 0 ? 'text-green-500 border-green-900 bg-green-900/20' : 'text-red-500 border-red-900 bg-red-900/20'}`}>
                        {currentWeekPrep?.matrixRegime || 'UNDEFINED'} ({currentWeekPrep?.matrixScore || 0})
                    </span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-white transition-all"><i className="fas fa-times text-xl"></i></button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#03070c] space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* TECHNICAL STRUCTURE SECTION (SMART INPUTS) */}
            <section className="space-y-8 bg-[#0b1222]/30 p-8 rounded-[2.5rem] border border-slate-800/60">
                <LayerHeader num="01" title="Structure & Levels (Auto)" icon="fa-layer-group" colorClass="bg-purple-600" active={true} />
                
                {/* AUTO-CALC INPUTS */}
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-4">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest text-center">INPUT LEVELS FOR AUTO-LOGIC</p>
                    <div className="grid grid-cols-3 gap-2">
                        <InputField label="PD HIGH" value={calcInputs.pdHigh} onChange={(v: string) => setCalcInputs(p => ({...p, pdHigh: v}))} placeholder="Price" type="number" />
                        <InputField label="PD LOW" value={calcInputs.pdLow} onChange={(v: string) => setCalcInputs(p => ({...p, pdLow: v}))} placeholder="Price" type="number" />
                        <InputField label="PD CLOSE" value={calcInputs.pdClose} onChange={(v: string) => setCalcInputs(p => ({...p, pdClose: v}))} placeholder="Price" type="number" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                        <InputField label="ON HIGH" value={calcInputs.onHigh} onChange={(v: string) => setCalcInputs(p => ({...p, onHigh: v}))} placeholder="ON H" type="number" />
                        <InputField label="ON LOW" value={calcInputs.onLow} onChange={(v: string) => setCalcInputs(p => ({...p, onLow: v}))} placeholder="ON L" type="number" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="ON RANGE" value={formData.onRangeVsPDay} options={[{val:'None', label:'---'}, {val:'Inside', label:'INSIDE'}, {val:'Outside', label:'OUTSIDE'}]} onChange={(v: any) => updateField('onRangeVsPDay', v)} disabled={!!calcInputs.pdHigh} />
                        <SelectField label="ON INVENTORY" value={formData.onInventory} options={[{val:'None', label:'---'}, {val:'Long', label:'LONG'}, {val:'Short', label:'SHORT'}, {val:'Net Zero', label:'BALANCED'}]} onChange={(v: any) => updateField('onInventory', v)} disabled={!!calcInputs.pdClose} />
                    </div>
                    
                    <div className="h-px bg-slate-800/50 w-full my-2"></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="PD EXTREMES (MAGNETS)" value={formData.pdExtremes} options={[{val:'None', label:'NONE'}, {val:'Poor High', label:'POOR HIGH (Repair A)'}, {val:'Poor Low', label:'POOR LOW (Repair A)'}, {val:'Both', label:'BOTH'}]} onChange={(v: any) => updateField('pdExtremes', v)} description="Defines structural repair targets (Module B)" />
                        <SelectField label="SINGLE PRINTS" value={formData.singlePrints} options={[{val:'None', label:'NONE / IRRELEVANT'}, {val:'Below Open', label:'BELOW OPEN (SUPPORT)'}, {val:'Above Open', label:'ABOVE OPEN (RESISTANCE)'}, {val:'Inside', label:'OPENING WITHIN (INSIDE SP)'}]} onChange={(v: any) => updateField('singlePrints', v)} description="SP Structure from Trend Days acting as Support/Resistance" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="UNTESTED VPOC" value={formData.priorVPOC} options={[{val:'None', label:'NONE'}, {val:'naked', label:'NAKED'}, {val:'tapped', label:'TAPPED'}]} onChange={(v: any) => updateField('priorVPOC', v)} />
                        <SelectField label="UNTESTED VAL/VAH" value={formData.untestedPdVA} options={[{val:'None', label:'NONE'}, {val:'High', label:'HIGH'}, {val:'Low', label:'LOW'}, {val:'Both', label:'BOTH'}]} onChange={(v: any) => updateField('untestedPdVA', v)} />
                    </div>
                </div>
            </section>

            {/* OPENING & REGIME SECTION */}
            <section className="space-y-8 bg-[#0b1222]/30 p-8 rounded-[2.5rem] border border-slate-800/60">
                <LayerHeader num="02" title="Market Regime" icon="fa-arrows-to-dot" colorClass="bg-blue-600" active={true} />
                <div className="space-y-6">
                    <SelectField label="OPEN TYPE" value={formData.openType} options={[{val:'None', label:'NONE'}, {val:'Drive', label:'DRIVE'}, {val:'Test driver', label:'TEST DRIVE'}, {val:'Rejection- Reversal', label:'REJECTION-REV'}, {val:'Auction', label:'AUCTION'}]} onChange={(v: any) => updateField('openType', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="IB WIDTH" value={formData.ibWidth} options={[{val:'Normal', label:'NORMAL'}, {val:'Narrow', label:'NARROW'}, {val:'Wide', label:'WIDE'}]} onChange={(v: any) => updateField('ibWidth', v)} />
                        <SelectField label="RANGE EXTENSION" value={formData.rangeExtension || 'None'} options={[{val:'None', label:'NONE (INSIDE)'}, {val:'Up', label:'UP (BULLISH)'}, {val:'Down', label:'DOWN (BEARISH)'}, {val:'Both', label:'BOTH (EXPANDING)'}]} onChange={(v: any) => updateField('rangeExtension', v)} />
                    </div>
                    <SelectField label="CONTEXT TYPE" value={formData.marketContext} options={[{val:'UNDEFINED', label:'CHOOSE...'}, {val:'STRONG_TREND', label:'STRONG TREND'}, {val:'TREND', label:'DISCOVERY'}, {val:'BALANCE', label:'NORMAL BALANCE'}, {val:'REVERSION', label:'REVERSION'}]} onChange={(v: any) => updateField('marketContext', v)} />
                    <SelectField label="OPENING LOCATION" value={formData.openingContext} options={[{val:'ANY', label:'ANY'}, {val:'OUT_OF_BALANCE', label:'GAP (OUTSIDE RANGE)'}, {val:'IN_BALANCE_OUTSIDE_VALUE', label:'INSIDE RANGE / OUTSIDE VA'}, {val:'IN_BALANCE_INSIDE_VALUE', label:'INSIDE VALUE'}]} onChange={(v: any) => updateField('openingContext', v)} />
                </div>
            </section>

            {/* PARTICIPANT & VALUE SECTION */}
            <section className="space-y-8 bg-[#0b1222]/30 p-8 rounded-[2.5rem] border border-slate-800/60">
                <LayerHeader num="03" title="Participant & Value" icon="fa-users" colorClass="bg-orange-600" active={true} />
                <div className="space-y-6">
                    <SelectField label="CONTROL DOMINANCE" value={formData.participantControl} options={[{val:'UNDEFINED', label:'AUTO DETECT'}, {val:'OTF', label:'OTF (INSTITUTIONAL)'}, {val:'LOCALS', label:'LOCALS (RETAIL/DAY)'}, {val:'MIXED', label:'MIXED AUCTION'}]} onChange={(v: any) => updateField('participantControl', v)} />
                    <SelectField label="RELATIVE VOLUME" value={formData.volRelative} options={[{val:'UNDEFINED', label:'CHOOSE...'}, {val:'ABOVE_AVG', label:'ABOVE AVG'}, {val:'AVG', label:'AVERAGE'}, {val:'BELOW_AVG', label:'BELOW AVG'}]} onChange={(v: any) => updateField('volRelative', v)} />
                    <SelectField label="VALUE OVERLAP" value={formData.observedValueOverlap} options={[{val:'ANY', label:'ANY'}, {val:'No overlapping', label:'NO OVERLAP (GAP)'}, {val:'Minimum overlap', label:'MINIMUM'}, {val:'High overlap', label:'HIGH OVERLAP'}, {val:'Full overlap', label:'FULL (INSIDE)'}]} onChange={(v: any) => updateField('observedValueOverlap', v)} />
                    <SelectField label="VALUE MIGRATION" value={formData.observedValueMigration} options={[{val:'ANY', label:'ANY'}, {val:'Migrating outside', label:'MIGRATING OUTSIDE'}, {val:'Migration to pdValue', label:'MIGRATING TO PD VALUE'}, {val:'None', label:'NONE (STABLE)'}]} onChange={(v: any) => updateField('observedValueMigration', v)} />
                </div>
            </section>

            <aside className="bg-[#0b1222] border border-blue-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[450px]">
                <div className="flex items-center space-x-4 mb-8 relative z-10"><div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl"><i className="fas fa-robot text-xl"></i></div><h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Protocol AI Feed</h4></div>
                <div className="space-y-4 flex-1 relative z-10 overflow-y-auto pr-2">
                    {scannerVerdict.protocol.map((line, idx) => (<div key={idx} className="flex items-start space-x-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800"><div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_currentColor] ${line.includes('RISK') ? 'bg-red-500 text-red-500' : line.includes('ACTIVATED') ? 'bg-emerald-500 text-emerald-500' : 'bg-blue-500 text-blue-500'}`}></div><p className={`text-[10px] font-black uppercase leading-tight ${line.includes('RISK') ? 'text-red-400' : line.includes('ACTIVATED') ? 'text-emerald-400' : 'text-slate-300'}`}>{line}</p></div>))}
                </div>
            </aside>
          </div>
          <section className="bg-slate-950/40 border border-slate-800/60 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6"><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">ACTIVATED STRATEGY FAMILIES</h4></div>
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {(['CONFIDENCE', 'ROTATION', 'FILL', 'CORRECTION'] as (keyof typeof FAMILY_META)[]).map(familyKey => {
                   const meta = FAMILY_META[familyKey];
                   // Map REPAIR to FILL in the list logic, Correction to CORRECTION
                   const listKey = familyKey === 'FILL' ? 'FILL' : familyKey; 
                   const list = scannerVerdict.families[listKey] || [];
                   const isActive = (activeStrategies as any)[familyKey === 'FILL' ? 'REPAIR' : familyKey];

                   return (
                     <div key={familyKey} className={`flex flex-col rounded-[2.5rem] border ${meta.border} ${meta.bg} overflow-hidden transition-all duration-500 ${isActive ? 'opacity-100 ring-1 ring-white/20' : 'opacity-30 grayscale'}`}>
                        <div className="p-8 border-b border-white/5 bg-black/20"><div className="flex items-center space-x-3 mb-2"><i className={`fas ${meta.icon} ${meta.color} text-xs`}></i><h5 className={`text-[12px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</h5></div><p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">{meta.desc}</p></div>
                        <div className="p-6 space-y-3 flex-1 min-h-[150px] overflow-y-auto">
                           {list.map(s => (<div key={s.id} onClick={() => updateField('setup', s.name)} className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${formData.setup === s.name ? 'bg-white/10 border-white/40 shadow-xl scale-[1.02]' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-600'}`}><div className="flex flex-col overflow-hidden"><p className={`text-[11px] font-black uppercase tracking-tight truncate pr-4 ${formData.setup === s.name ? 'text-white' : 'text-slate-300'}`}>#{s.id} {s.name}</p></div>{formData.setup === s.name && <i className="fas fa-check-circle text-emerald-500 text-sm"></i>}</div>))}
                        </div>
                     </div>
                   );
                })}
             </div>
          </section>
        </div>
        <footer className="px-10 py-8 border-t border-slate-800/60 bg-[#060b13] flex justify-end space-x-6 shrink-0">
          <button onClick={onClose} className="px-10 py-5 rounded-2xl bg-transparent border border-slate-800 text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] transition-all hover:bg-slate-900">ANULEAZĂ</button>
          <button onClick={() => { onSave({ ...formData, validatedSetups: scannerVerdict.allMatchedIds }, selectedDate); onClose(); }} className="px-20 py-5 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 border-t border-white/10">VALIDATE & LOCK PROTOCOL</button>
        </footer>
      </div>
    </div>
  );
};

export default DecisionFunnelModal;
