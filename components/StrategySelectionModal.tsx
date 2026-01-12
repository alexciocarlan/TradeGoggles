
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyPrepData, WeeklyPrepData, Playbook } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { ALL_SETUPS } from '../data/setups';
import { calculateBEScore } from '../ProtocolEngine';

interface StrategySelectionModalProps {
  onClose: () => void;
  onSave: (data: Partial<DailyPrepData>, date: string) => void;
  initialPrep?: DailyPrepData;
  date: string;
  overrideWeekPrep?: WeeklyPrepData;
  isBacktest?: boolean;
  simulatedWeeklyPreps?: Record<string, WeeklyPrepData>;
}

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

// --- DATA CONSTANTS ---

const KEY_LEVEL_OPTIONS = [
    // Prior Day
    "pdHigh", "pdLow", "pdEQ", "pdOpen", "pdVAH", "pdPOC", "pdVAL", "pdVWAPc", "Settlement",
    // Overnight
    "ONH", "ONL",
    // New York / Intraday
    "NY IB High", "NY IB Low", "NY Open", "NY VWAP", "NY IB ext 1", "NY IB ex 2",
    "dHigh", "dVAH", "dVAL", "dVWAP", "dLow", "dOpen",
    // Structure
    "GAP high", "GAP low", "IB low", "IB High", "SP",
    // Higher Timeframe
    "4h High", "4h Low",
    "pwHigh", "pwLow", "pwEQ", "pwVAH", "pwVAL", "pwOpen", "pwVWAPc",
    "wHigh", "wLow", "wOpen", "wVWAP",
    // Composite / Range
    "range VAL", "range VAH", "range POC",
    "ndPOC", "nwPOC", "nmPOC", "ndOpen", "nwOpen", "nmOpen",
    // Monthly
    "pmHigh", "pmLow", "pmOpen", "pmVAH", "pmVAL", "pmEQ", "pmVWAPc",
    "mOpen", "mVWAP"
];

// --- AUDIT LOGIC HELPERS ---

const getNYTimeDecimal = () => {
    const now = new Date();
    const nyString = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
    const [hours, minutes] = nyString.split(':').map(Number);
    return hours + (minutes / 60);
};

const TIME_SENSITIVE_SETUPS = [
    'The Open Drive', 'The Open Test Drive', 'Open Rejection Reverse', 'The GAP & Go', 'The GAP Fill'
];

// --- UI COMPONENTS ---

const SectionNumber = ({ num, label }: { num: string, label: string }) => (
    <div className="flex items-center space-x-3 mb-4">
        <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-inner">
            {num}
        </div>
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</h4>
    </div>
);

const ReadoutBadge = ({ label, value, icon, color = "text-slate-400" }: any) => (
    <div className="bg-slate-950/50 border border-slate-800/50 px-3 py-2 rounded-xl flex items-center space-x-3 min-w-[120px] transition-all hover:border-slate-700">
        <div className={`w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center ${color} bg-opacity-10 shrink-0`}>
            <i className={`fas ${icon} text-[9px] ${color}`}></i>
        </div>
        <div className="overflow-hidden">
            <p className="text-[6px] font-black text-slate-600 uppercase tracking-widest mb-px truncate">{label}</p>
            <p className={`text-[9px] font-black uppercase tracking-tight truncate ${value === 'UNDEFINED' || !value ? 'text-slate-700' : 'text-slate-200'}`}>
                {value ? value.replace(/_/g, ' ') : '---'}
            </p>
        </div>
    </div>
);

// LOCKED FIELD COMPONENT (Read Only from Scanner)
const LockedField = ({ label, value }: { label: string, value: string }) => (
    <div className="group relative opacity-75 hover:opacity-100 transition-opacity cursor-not-allowed">
        <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1 flex justify-between">
            {label} <i className="fas fa-lock text-[8px]"></i>
        </label>
        <div className="w-full bg-[#050912] border border-slate-800/50 rounded-xl px-4 py-3 text-[10px] font-black text-slate-300 uppercase truncate">
            {value || '---'}
        </div>
        <div className="absolute inset-0 z-10" title="This field is locked by the Decision Scanner. Go back to change it."></div>
    </div>
);

const TechInput = ({ label, value, onChange, placeholder, required = false, options = [], type = "text" }: any) => {
    const listId = useMemo(() => `list-${label.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`, [label]);

    return (
        <div className="group">
            <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-blue-500 transition-colors">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input 
                type={type} 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder={placeholder}
                list={options.length > 0 ? listId : undefined}
                className={`w-full bg-[#050912] border rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500/50 focus:bg-[#0b1222] transition-all placeholder:text-slate-800 ${required && !value ? 'border-red-900/30' : 'border-slate-800'}`}
            />
            {options.length > 0 && (
                <datalist id={listId}>
                    {options.map((opt: string) => (
                        <option key={opt} value={opt} />
                    ))}
                </datalist>
            )}
        </div>
    );
};

const TechSelect = ({ label, value, options, onChange, warning }: any) => (
    <div className="group relative">
        <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1 group-hover:text-blue-500 transition-colors flex justify-between">
            {label}
            {warning && <i className="fas fa-exclamation-triangle text-orange-500 animate-pulse" title={warning}></i>}
        </label>
        <select 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-[#050912] border rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500/50 focus:bg-[#0b1222] transition-all appearance-none cursor-pointer ${warning ? 'border-orange-500/50 text-orange-200' : 'border-slate-800'}`}
        >
            {options.map((opt: any) => (
                <option key={opt.val} value={opt.val} className={opt.disabled ? "bg-slate-900 text-slate-500 italic" : "bg-[#0b1222]"}>
                    {opt.label}
                </option>
            ))}
        </select>
        <i className="fas fa-chevron-down absolute right-3 bottom-3.5 text-slate-700 text-[8px] pointer-events-none group-hover:text-blue-500"></i>
    </div>
);

const HypothesisCard = ({ type, data, setData, playbooks, isLocked, onUnlock, setVacuumConfirmed, vacuumConfirmed }: any) => {
    const isLong = type === 'LONG';
    const accentColor = isLong ? 'text-emerald-500' : 'text-red-500';
    const borderColor = isLong ? 'border-emerald-500/20' : 'border-red-500/20';
    const bgColor = isLong ? 'bg-emerald-500/5' : 'bg-red-500/5';
    const icon = isLong ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

    const setupVal = isLong ? data.setup : data.setup2;
    const entryVal = isLong ? data.zoneOfInterest : data.zoneOfInterest2;
    const invalidationVal = isLong ? data.invalidationPoint : data.invalidationPoint2;
    const targetVal = isLong ? data.exitLevel : data.exitLevel2;

    const update = (field: string, val: any) => {
        setData(field, val);
    };

    // Auto-fill logic when selecting a playbook
    const handleSetupChange = (val: string) => {
        update(isLong ? 'setup' : 'setup2', val);
        
        // Find the playbook definition
        const matchedPlaybook = playbooks.find((p: any) => p.name === val);
        
        if (matchedPlaybook) {
            // Auto-fill Invalidation
            if (matchedPlaybook.invalidation) {
                update(isLong ? 'invalidationPoint' : 'invalidationPoint2', matchedPlaybook.invalidation);
            }
            // Auto-fill Target/Exit Level
            if (matchedPlaybook.target) {
                update(isLong ? 'exitLevel' : 'exitLevel2', matchedPlaybook.target);
            }
            // Auto-fill Entry Trigger
            if (matchedPlaybook.entryAt) {
                update(isLong ? 'continuationTrigger' : 'continuationTrigger2', matchedPlaybook.entryAt);
            }
        }
    };

    // 1. Time Decay Logic Check
    const nyTime = getNYTimeDecimal();
    const isLate = nyTime > 10.5; // After 10:30 AM NY
    const isTimeExpired = isLate && TIME_SENSITIVE_SETUPS.some(s => setupVal && setupVal.includes(s));

    // Audit Recommendation B: Gray out expired setups in options
    const setupOptions = useMemo(() => {
        return [
            {val:'None', label:'NO SETUP', disabled: false},
            ...playbooks.map((p: any) => {
                const isTimeSensitive = TIME_SENSITIVE_SETUPS.some(ts => p.name.includes(ts));
                const isExpired = isLate && isTimeSensitive;
                return {
                    val: p.name,
                    label: isExpired ? `⚠️ ${p.name} (EXPIRED)` : p.name,
                    disabled: false // We visually differentiate but don't strictly disable to allow manual override
                };
            })
        ];
    }, [playbooks, isLate]);

    // 2. Profitability Guard (R:R Check) - Audit Recommendation A
    const profitabilityStatus = useMemo(() => {
        // Simple numeric parsing (strips text)
        const parsePrice = (s: string) => {
            if(!s) return null;
            const match = s.match(/[\d\.]+/);
            return match ? parseFloat(match[0]) : null;
        };

        const e = parsePrice(entryVal);
        const s = parsePrice(invalidationVal);
        const t = parsePrice(targetVal);

        if (e && s && t) {
            const risk = Math.abs(e - s);
            const reward = Math.abs(t - e);
            if (risk === 0) return { valid: true, rr: 0 };
            const rr = reward / risk;
            
            // Refined Logic per Audit
            if (rr < 1) return { valid: false, rr: rr.toFixed(2), msg: "POOR R:R (<1.0). SKIPPING RECOMMENDED." };
            if (rr < 1.5) return { valid: true, warning: true, rr: rr.toFixed(2), msg: "LOW R:R (<1.5). REDUCE RISK." };
            return { valid: true, rr: rr.toFixed(2), msg: `R:R HEALTHY (${rr.toFixed(2)})` };
        }
        return { valid: true, rr: 0 };
    }, [entryVal, invalidationVal, targetVal]);

    // 3. Vacuum Setup Check
    const isVacuumSetup = useMemo(() => setupVal && setupVal.toLowerCase().includes('vacuum'), [setupVal]);

    if (isLocked) {
        return (
            <div className={`p-1 rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/20 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]`}>
                <i className={`fas ${icon} text-4xl text-slate-700 mb-4`}></i>
                <h5 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2">COUNTER-TREND PROTECTED</h5>
                <p className="text-[9px] text-slate-600 font-bold max-w-[200px] text-center mb-6">
                    Sistemul a detectat un Trend puternic. Tranzacționarea împotriva trendului este descurajată.
                </p>
                <button 
                    onClick={onUnlock}
                    className="bg-slate-800 hover:bg-red-900/20 hover:text-red-500 border border-slate-700 hover:border-red-500/50 text-slate-400 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                    UNLOCK {type} (HIGH RISK)
                </button>
            </div>
        );
    }

    return (
        <div className={`p-5 rounded-[2rem] border ${borderColor} ${bgColor} relative overflow-hidden group`}>
            <div className="flex items-center space-x-4 mb-4 relative z-10">
                <div className={`w-8 h-8 rounded-lg ${isLong ? 'bg-emerald-500' : 'bg-red-500'} flex items-center justify-center text-white shadow-lg`}>
                    <i className={`fas ${isLong ? 'fa-L' : 'fa-S'} text-[10px] font-black`}></i>
                </div>
                <div>
                    <h5 className={`text-[10px] font-black uppercase tracking-widest ${accentColor}`}>{type} HYPOTHESIS</h5>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">EXECUTION PLAN</p>
                </div>
                {/* 2. Enhanced R:R Display Badge */}
                {profitabilityStatus.rr !== 0 && (
                    <div className={`ml-auto px-2 py-1 rounded border text-[7px] font-black uppercase tracking-tight shadow-lg ${
                        !profitabilityStatus.valid ? 'bg-red-600 text-white border-red-500 animate-pulse' :
                        profitabilityStatus.warning ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                        {profitabilityStatus.msg}
                    </div>
                )}
            </div>

            <div className="space-y-3 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                    <TechInput 
                        label="KEY LEVEL (ENTRY)" 
                        value={isLong ? data.zoneOfInterest : data.zoneOfInterest2} 
                        onChange={(v: string) => update(isLong ? 'zoneOfInterest' : 'zoneOfInterest2', v)} 
                        placeholder="Price or Level"
                        required
                        options={KEY_LEVEL_OPTIONS}
                    />
                    
                    {/* 1. Time Decay Warning in Dropdown */}
                    <TechSelect 
                        label="ACTIVATED SETUP" 
                        value={isLong ? data.setup : data.setup2} 
                        options={setupOptions} 
                        onChange={(v: string) => handleSetupChange(v)} 
                        warning={isTimeExpired ? "TIME DECAY WARNING: Setup probability drops after 10:30." : undefined}
                    />
                </div>
                
                {isTimeExpired && (
                    <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-lg flex items-center space-x-2">
                        <i className="fas fa-clock text-orange-500 text-xs"></i>
                        <span className="text-[8px] font-black text-orange-400 uppercase tracking-tight">TIME DECAY: This setup is statistically weaker now.</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <TechSelect 
                        label="TIMING SESSION" 
                        value={isLong ? data.hypoSession : data.hypoSession2} 
                        options={[{val:'NY Morning', label:'NY MORNING'}, {val:'NY Afternoon', label:'NY AFTERNOON'}, {val:'London', label:'LONDON'}]} 
                        onChange={(v: string) => update(isLong ? 'hypoSession' : 'hypoSession2', v)} 
                    />
                    <TechSelect 
                        label="IN 30M SESSION?" 
                        value={isLong ? data.in30MinSession : data.in30MinSession2} 
                        options={[{val:'A', label:'PERIOD A'}, {val:'B', label:'PERIOD B'}, {val:'C', label:'PERIOD C'}, {val:'D', label:'PERIOD D+'}]} 
                        onChange={(v: string) => update(isLong ? 'in30MinSession' : 'in30MinSession2', v)} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <TechInput 
                        label="INVALIDATION (STOP)" 
                        value={isLong ? data.invalidationPoint : data.invalidationPoint2} 
                        onChange={(v: string) => update(isLong ? 'invalidationPoint' : 'invalidationPoint2', v)} 
                        placeholder="Ex: Below pdL"
                    />
                    <TechInput 
                        label="EXIT LEVEL (TARGET)" 
                        value={isLong ? data.exitLevel : data.exitLevel2} 
                        onChange={(v: string) => update(isLong ? 'exitLevel' : 'exitLevel2', v)} 
                        placeholder="Ex: Weekly POC"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <TechInput 
                        label="CONT. TRIGGER" 
                        value={isLong ? data.continuationTrigger : data.continuationTrigger2} 
                        onChange={(v: string) => update(isLong ? 'continuationTrigger' : 'continuationTrigger2', v)} 
                        placeholder="Pullback to..."
                    />
                    <TechInput 
                        label="REV. TRIGGER" 
                        value={isLong ? data.reversalTrigger : data.reversalTrigger2} 
                        onChange={(v: string) => update(isLong ? 'reversalTrigger' : 'reversalTrigger2', v)} 
                        placeholder="Rejection at..."
                    />
                </div>

                {/* 3. Vacuum Nuance Validation */}
                {isVacuumSetup && (
                    <div className="mt-2 bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isLong ? vacuumConfirmed.long : vacuumConfirmed.short} 
                                onChange={(e) => setVacuumConfirmed(isLong ? 'long' : 'short', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500"
                            />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">VACUUM VALIDATION</span>
                                <span className="text-[8px] text-slate-400 font-medium">Confirm price is entering Low Volume Zone?</span>
                            </div>
                        </label>
                    </div>
                )}
            </div>

            <i className={`fas ${icon} absolute -bottom-6 -right-6 text-[120px] opacity-[0.03] ${accentColor} pointer-events-none rotate-12`}></i>
        </div>
    );
};

const StrategySelectionModal: React.FC<StrategySelectionModalProps> = ({ onClose, onSave, initialPrep, date, isBacktest, simulatedWeeklyPreps }) => {
  const { playbooks, weeklyPreps, dailyPreps, trades } = useAppStore(useShallow(state => ({
    playbooks: state.playbooks || [],
    weeklyPreps: state.weeklyPreps || {},
    dailyPreps: state.dailyPreps || {},
    trades: state.trades || []
  })));

  const [selectedDate, setSelectedDate] = useState(date);
  const [formData, setFormData] = useState<Partial<DailyPrepData>>(initialPrep || {});
  
  // Logic States
  const [sizingMode, setSizingMode] = useState<'A' | 'B' | 'C' | 'None'>('None');
  const [showCounterTrend, setShowCounterTrend] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // New States for Recommendation 3
  const [vacuumConfirmed, setVacuumConfirmedState] = useState({ long: false, short: false });

  // Calculate Behavioral Equity Score for Permissions
  const beMetrics = useMemo(() => calculateBEScore(trades), [trades]);

  // CRITICAL FIX: Ensure local state syncs with global store when Decision Funnel updates
  useEffect(() => {
    const existing = dailyPreps[selectedDate];
    if (existing) {
        setFormData(prev => ({ ...prev, ...existing }));
    }
  }, [selectedDate, dailyPreps]); // Listen to dailyPreps changes

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

  const protocolState = useMemo(() => {
      const regime = formData.marketContext || 'UNDEFINED';
      const bias = currentWeekPrep?.weeklyBias || 'NEUTRAL';
      const participants = formData.participantControl || 'UNDEFINED';
      const openType = formData.openType || 'None';
      
      const inventory = formData.onInventory || 'None';
      const valueOverlap = formData.observedValueOverlap || 'ANY';

      const validatedSetups = (formData.validatedSetups || [])
        .map(id => ALL_SETUPS.find(s => s.id === id))
        .filter(Boolean);

      const hasScannerData = regime !== 'UNDEFINED' && participants !== 'UNDEFINED';
      
      const isStrongTrend = regime === 'STRONG_TREND' || regime.includes('TREND');
      
      // V5.0: Conflict logic defined by Weekly vs Daily alignment or explicit Conflict Tag
      const isConflict = 
        (regime === 'REVERSION' && bias === 'Bullish') || 
        (regime === 'BALANCE_CHOP') || 
        (bias === 'Bullish' && openType.includes('Down')) ||
        (currentWeekPrep?.matrixScore === 0);

      // 4. Kill Switch Logic
      const nyTime = getNYTimeDecimal();
      const isKillSwitch = formData.ibWidth === 'Narrow' && nyTime > 11.0;

      // Behavioral Handicap Check
      const isTierALocked = beMetrics.isTierALocked || isConflict; // Lock Tier A if BE is low OR context is bad

      return { regime, bias, participants, openType, inventory, valueOverlap, validatedSetups, hasScannerData, isStrongTrend, isConflict, isKillSwitch, isTierALocked };
  }, [
    formData.marketContext, 
    formData.participantControl, 
    formData.openType,
    formData.onInventory,
    formData.observedValueOverlap,
    formData.validatedSetups,
    formData.ibWidth,
    currentWeekPrep,
    beMetrics
  ]);

  useEffect(() => {
      // Auto-downgrade sizing if locked
      if ((protocolState.isTierALocked || protocolState.isKillSwitch) && sizingMode === 'A') {
          setSizingMode('B');
      }
  }, [protocolState.isTierALocked, protocolState.isKillSwitch, sizingMode]);

  const updateField = (field: keyof DailyPrepData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateVacuum = (side: 'long' | 'short', val: boolean) => {
      setVacuumConfirmedState(prev => ({ ...prev, [side]: val }));
  };

  const validateStrategy = () => {
      setValidationError(null);
      
      // 4. Kill Switch / Gatekeeper Lock Validation
      if (protocolState.isKillSwitch) {
          setValidationError("KILL SWITCH ACTIVATED: Tight Chop / Piață Moartă. Trading blocked for capital preservation.");
          return false;
      }

      if (protocolState.bias === 'Bullish' || protocolState.bias === 'Neutral') {
          if (formData.setup !== 'None' && (!formData.zoneOfInterest || formData.zoneOfInterest.length < 2)) {
              setValidationError("Plan invalid: Definește 'KEY LEVEL' pentru Ipoteza Long.");
              return false;
          }
      }
      
      if (protocolState.isTierALocked && sizingMode === 'A') {
          setValidationError(`RISK BLOCK: Tier A locked. Reason: ${beMetrics.handicapMessage}`);
          return false;
      }
      
      // 3. Vacuum Validation
      if (formData.setup?.toLowerCase().includes('vacuum') && !vacuumConfirmed.long) {
          setValidationError("VALIDARE NECESARĂ: Confirmă manual 'Volume Void' pentru Setup-ul Long.");
          return false;
      }
      if (formData.setup2?.toLowerCase().includes('vacuum') && !vacuumConfirmed.short) {
          setValidationError("VALIDARE NECESARĂ: Confirmă manual 'Volume Void' pentru Setup-ul Short.");
          return false;
      }

      if (sizingMode === 'None') {
          setValidationError("Selectează Mărimea Poziției (Sizing Plan) înainte de a finaliza.");
          return false;
      }
      return true;
  };

  const handleSave = () => {
      if (validateStrategy()) {
          onSave(formData, selectedDate);
          onClose();
      }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, prepScreenshots: [{ url: compressed, caption: 'Strategy Plan' }] }));
    };
    reader.readAsDataURL(files[0]);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-[#03070c] border border-slate-800/60 rounded-[3rem] w-full max-w-[1400px] max-h-[94vh] shadow-[0_0_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        <header className="px-10 py-5 border-b border-slate-800/40 bg-[#060b13] flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl">
                <i className="fas fa-rocket text-lg"></i>
            </div>
            <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">STRATEGY SELECTION</h3>
                <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MISSION SESSION:</span>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-[9px] font-black text-indigo-400 uppercase outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer" />
                </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-white transition-all"><i className="fas fa-times text-lg"></i></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#03070c] space-y-6">
            
            {/* 4. Kill Switch / Lockdown Alert */}
            {(protocolState.isKillSwitch) && (
                <div className="bg-red-600/20 border-2 border-red-500 p-6 rounded-3xl flex items-center justify-between animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                    <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl shadow-xl">
                            <i className="fas fa-ban"></i>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-widest">SYSTEM LOCKDOWN ACTIVE</h4>
                            <p className="text-xs font-bold text-red-300 uppercase mt-1">
                                Kill Switch: Low Volatility / Late Morning Chop.
                            </p>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-red-600 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg">
                        TRADING BLOCKED
                    </div>
                </div>
            )}

            {protocolState.isTierALocked && !protocolState.isKillSwitch && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-4">
                        <i className="fas fa-triangle-exclamation text-yellow-500 text-xl"></i>
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">WARNING: RISK HANDICAP ACTIVE</h4>
                            <p className="text-[10px] text-yellow-500 font-bold uppercase">
                                {beMetrics.handicapMessage}
                            </p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30 text-[9px] font-black text-yellow-400 uppercase">
                        MAX SIZE BLOCKED
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 bg-[#0b1222]/80 p-4 rounded-[2rem] border border-slate-800/60 shadow-lg">
                <div className="space-y-2 shrink-0 xl:w-1/3 xl:border-r border-slate-800 xl:pr-6">
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.25em] flex items-center mb-1"><i className="fas fa-anchor mr-2"></i> WEEKLY ANCHOR STATUS</p>
                    <div className="flex gap-2">
                        <ReadoutBadge label="WEEKLY BIAS" value={currentWeekPrep?.weeklyBias || 'NEUTRAL'} icon="fa-compass" color="text-blue-400" />
                        <ReadoutBadge label="MATRIX SCORE" value={currentWeekPrep?.matrixScore?.toString() || '0'} icon="fa-calculator" color="text-indigo-400" />
                    </div>
                </div>
                
                <div className="space-y-2 flex-1">
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.25em] flex items-center mb-1"><i className="fas fa-filter mr-2"></i> SCANNER MATRIX READOUT</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <ReadoutBadge label="MARKET REGIME" value={formData.marketContext} icon="fa-chess-rook" color="text-blue-400" />
                        <ReadoutBadge label="PARTICIPANT" value={formData.participantControl} icon="fa-users" color="text-orange-400" />
                        <ReadoutBadge label="VALUE DYNAMICS" value={formData.observedValueOverlap} icon="fa-clone" color="text-emerald-400" />
                        <ReadoutBadge label="OPEN TYPE" value={formData.openType} icon="fa-bolt" color="text-yellow-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0b1222]/60 border border-blue-500/20 p-5 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group shadow-lg min-h-[120px]">
                    <div className="flex items-center space-x-3 mb-2 relative z-10">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${protocolState.hasScannerData ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}>
                            <i className="fas fa-robot"></i>
                        </div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">STRATEGIC PROTOCOL GENERATED</p>
                    </div>
                    
                    <div className="relative z-10 space-y-1 ml-11">
                        {protocolState.hasScannerData ? (
                            <>
                                <p className="text-base font-black text-white uppercase italic tracking-tight leading-tight">
                                    {protocolState.regime.replace(/_/g, ' ')}
                                </p>
                                <div className="flex flex-wrap gap-2 text-[8px] font-bold text-slate-400 pt-1">
                                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 uppercase">{protocolState.participants} CONTROL</span>
                                    {protocolState.inventory !== 'None' && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 uppercase">{protocolState.inventory} INV.</span>}
                                    {protocolState.openType !== 'None' && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 uppercase">{protocolState.openType}</span>}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-start opacity-50">
                                <p className="text-sm font-black text-white uppercase tracking-tight">WAITING FOR SCANNER INPUT...</p>
                                <p className="text-[8px] text-slate-500 uppercase mt-0.5">PLEASE COMPLETE DECISION FUNNEL FIRST</p>
                            </div>
                        )}
                    </div>
                    <i className="fas fa-microchip absolute -right-4 -bottom-4 text-8xl text-blue-500/5 pointer-events-none"></i>
                </div>

                <div className="bg-[#0b1222]/60 border border-indigo-500/20 p-5 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group shadow-lg min-h-[120px]">
                    <div className="flex items-center space-x-3 mb-2 relative z-10">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${protocolState.validatedSetups.length > 0 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}>
                            <i className="fas fa-folder-open"></i>
                        </div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">PLAYBOOK ACTIVATION</p>
                    </div>

                    <div className="relative z-10 ml-11">
                        {protocolState.validatedSetups.length > 0 ? (
                            <div className="flex flex-wrap gap-2 max-h-[60px] overflow-y-auto custom-scrollbar">
                                {protocolState.validatedSetups.map((setup: any) => (
                                    <div key={setup.id} className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-lg">
                                        <i className={`fas ${setup.icon || 'fa-bolt'} text-[8px] text-indigo-300`}></i>
                                        <span className="text-[8px] font-black text-indigo-200 uppercase tracking-tight">{setup.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-start opacity-50">
                                <p className="text-sm font-black text-white uppercase tracking-tight">NO MATCHING SETUPS</p>
                                <p className="text-[8px] text-slate-500 uppercase mt-0.5">CHECK SCANNER CRITERIA OR MANUAL OVERRIDE</p>
                            </div>
                        )}
                    </div>
                    <i className="fas fa-layer-group absolute -right-4 -bottom-4 text-8xl text-indigo-500/5 pointer-events-none"></i>
                </div>
            </div>

            <div className="h-px bg-slate-800/50 w-full"></div>

            {/* TECHNICAL REFERENCES - READ ONLY IF SCANNER DATA EXISTS - NOW USING LockedField */}
            <section className="bg-[#0b1222]/30 border border-slate-800/60 p-6 rounded-[2.5rem] relative overflow-hidden">
                <SectionNumber num="1" label="LOCKED TECHNICAL CONTEXT (SCANNER DATA)" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                    <div className="grid grid-cols-3 gap-4">
                        <LockedField label="ON RANGE VS PD" value={formData.onRangeVsPDay || '---'} />
                        <LockedField label="ON VS. SETTLEMENT" value={formData.onVsSettlement || '---'} />
                        <LockedField label="ON INVENTORY" value={formData.onInventory || '---'} />
                        
                        <LockedField label="PD EXTREMES" value={formData.pdExtremes || 'None'} />
                        <LockedField label="UNTESTED PdVA" value={formData.untestedPdVA || 'None'} />
                        <LockedField label="PD VPOC" value={formData.priorVPOC || 'None'} />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">OPENING & IB DYNAMICS (CRITICAL FOR PLAYBOOK)</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <LockedField label="OPEN TYPE" value={formData.openType || 'None'} />
                            <LockedField label="IB WIDTH" value={formData.ibWidth || 'Normal'} />
                            <LockedField label="RANGE EXT." value={formData.rangeExtension || 'None'} />
                        </div>
                        <div className="grid grid-cols-4 gap-3 mt-4">
                            <LockedField label="SP HIGH" value={formData.spHigh || ''} />
                            <LockedField label="SP LOW" value={formData.spLow || ''} />
                            <LockedField label="GAP HIGH" value={formData.gapHigh || ''} />
                            <LockedField label="GAP LOW" value={formData.gapLow || ''} />
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <SectionNumber num="2" label="HYPOTHESIS GENERATION (SCENARIOS)" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HypothesisCard 
                        type="LONG" 
                        data={formData} 
                        setData={updateField} 
                        playbooks={playbooks} 
                        isLocked={(protocolState.isStrongTrend && protocolState.bias === 'Bearish') || protocolState.isKillSwitch}
                        onUnlock={() => setShowCounterTrend(true)}
                        vacuumConfirmed={vacuumConfirmed}
                        setVacuumConfirmed={updateVacuum}
                    />
                    <HypothesisCard 
                        type="SHORT" 
                        data={formData} 
                        setData={updateField} 
                        playbooks={playbooks} 
                        isLocked={((protocolState.isStrongTrend && protocolState.bias === 'Bullish') && !showCounterTrend) || protocolState.isKillSwitch}
                        onUnlock={() => setShowCounterTrend(true)}
                        vacuumConfirmed={vacuumConfirmed}
                        setVacuumConfirmed={updateVacuum}
                    />
                </div>
            </section>

            <section className="bg-[#0b1222]/40 border border-slate-800 p-6 rounded-[2rem]">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center text-[10px] font-black text-white shadow-inner">
                        3
                    </div>
                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">SIZE & RISK PLAN (ACTIVE RISK MANAGER)</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    {/* Recommendation C: Tooltip for Disabled Tier A */}
                    <button 
                        onClick={() => !protocolState.isTierALocked && !protocolState.isKillSwitch && setSizingMode('A')}
                        disabled={protocolState.isTierALocked || protocolState.isKillSwitch}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all group relative ${
                            sizingMode === 'A' 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                            : (protocolState.isTierALocked || protocolState.isKillSwitch)
                                ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed' 
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                    >
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1">TIER A</p>
                        <p className="text-xl font-black italic">MAX SIZE</p>
                        {(protocolState.isTierALocked || protocolState.isKillSwitch) && <p className="text-[8px] text-red-500 mt-1 uppercase font-bold">LOCKED</p>}
                        
                        {/* Tooltip implementation */}
                        {(protocolState.isTierALocked || protocolState.isKillSwitch) && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black border border-red-500 p-2 rounded hidden group-hover:block z-50 shadow-xl">
                                <p className="text-[9px] text-red-400 font-bold uppercase text-center leading-tight">
                                    RISK LOCKED: {beMetrics.handicapMessage}
                                </p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-red-500"></div>
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={() => !protocolState.isKillSwitch && setSizingMode('B')}
                        disabled={protocolState.isKillSwitch}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            sizingMode === 'B' 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                            : protocolState.isKillSwitch
                                ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed'
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                    >
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1">TIER B</p>
                        <p className="text-xl font-black italic">NORMAL</p>
                    </button>

                    <button 
                        onClick={() => !protocolState.isKillSwitch && setSizingMode('C')}
                        disabled={protocolState.isKillSwitch}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            sizingMode === 'C' 
                            ? 'bg-orange-600 border-orange-500 text-white shadow-lg' 
                            : protocolState.isKillSwitch
                                ? 'bg-slate-900 border-slate-800 opacity-30 cursor-not-allowed'
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                    >
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1">TIER C</p>
                        <p className="text-xl font-black italic">HALF / SCALP</p>
                    </button>
                </div>
            </section>

            <section>
                <SectionNumber num="4" label="VISUAL ANALYSIS & NARRATIVE" />
                <div className="space-y-6">
                    <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[21/9] border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-[2rem] bg-slate-900/10 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden">
                        {formData.prepScreenshots && formData.prepScreenshots.length > 0 ? (
                            <>
                                <img src={formData.prepScreenshots[0].url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all">
                                    <p className="text-xs font-black text-white uppercase tracking-widest">CHANGE BLUEPRINT</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-camera text-slate-500 text-lg"></i>
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">UPLOAD CHART ANALYSIS</p>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-2">DAILY NARRATIVE & CONTEXTUAL NOTES</label>
                        <textarea 
                            value={formData.dailyNarrative} 
                            onChange={e => updateField('dailyNarrative', e.target.value)} 
                            placeholder="Descrie contextul zilei, sentimentul pieței și așteptările tale...." 
                            className="w-full bg-[#0b1222]/60 border border-slate-800 rounded-[2rem] p-6 text-slate-300 italic text-sm h-32 resize-none outline-none focus:border-blue-500/50 shadow-inner" 
                        />
                    </div>
                </div>
            </section>

        </div>

        <footer className="px-10 py-6 border-t border-slate-800/60 bg-[#060b13] flex justify-between items-center space-x-6 shrink-0">
          {validationError && (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg text-[9px] font-black text-red-400 uppercase flex items-center animate-shake">
                  <i className="fas fa-triangle-exclamation mr-2"></i> {validationError}
              </div>
          )}
          <div className="flex space-x-4 ml-auto">
            <button onClick={onClose} className="px-8 py-4 rounded-xl bg-transparent border border-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-slate-900">ANULEAZĂ</button>
            <button onClick={handleSave} className="px-12 py-4 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 border-t border-white/10 hover:bg-indigo-500">FINALIZEAZĂ PREGĂTIREA</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StrategySelectionModal;
