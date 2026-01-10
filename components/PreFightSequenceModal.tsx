import React, { useState, useMemo, useEffect } from 'react';
import { DailyPrepData, ExecutionErrorType } from '../types';
import { useAppStore } from '../AppContext';

interface PreFightSequenceModalProps {
  isOpen: boolean; 
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
}

export const PreFightSequenceModal: React.FC<PreFightSequenceModalProps> = ({ isOpen, onSave, onClose, initialData, initialDate }) => {
  const [selectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const { trades } = useAppStore(state => ({ trades: state.trades }));
  
  const [formData, setFormData] = useState<DailyPrepData>(initialData || {
    gkPhysicalEnergy: 7, gkMentalClarity: 7, gkEmotionalCalm: 7, gkProcessConfidence: 7,
    gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
    gkHRVValue: 45, gkHRVBaseline: 45,
    gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
    gkUncertaintyAccepted: false, gkStopLossExecution: false, gkNoAddingToLoss: false, gkRiskCalmness: false, gkDailyRiskAmount: 0,
    gkTotalScore: 0, gkVerdict: 'None', 
    instrument: 'NQ', pdValueRelationship: 'None', marketCondition: 'None', 
    priceVsPWeek: 'None', mediumTermTrend: 'None', onRangeVsPDay: 'None', 
    onInventory: 'None', pdExtremes: 'None', untestedPdVA: 'None', 
    spHigh: '', spLow: '', gapHigh: '', gapLow: '', priorVPOC: 'None', 
    onVsSettlement: 'None', newsImpact: 'None', bias: 'Neutral', dailyNarrative: '',
    setup: 'None', setupGrade: 'None', 
    hypoSession: 'NY Morning', hypoThen: 'None', zoneOfInterest: '', 
    continuationTrigger: '', reversalTrigger: '', invalidationPoint: '', exitLevel: '',
    setup2: 'None', hypoSession2: 'NY Morning', hypoThen2: 'None', zoneOfInterest2: '', 
    continuationTrigger2: '', reversalTrigger2: '', invalidationPoint2: '', exitLevel2: '',
    habNoGoRespected: false, habPreMarketDone: false, habStopLossRespected: false,
    habNoRevengeTrading: false, habJournalCompleted: false, habDisciplineScore: 5,
    pmrTradedPlan: 'None', pmrDifficultMoment: '', pmrDailyLesson: '',
    prepScreenshots: [], openType: 'None', ibWidth: 'Normal', rangeExtension: 'None',
    htfMs: 'Bullish', trendYesterday: false, gkFocusError: 'None'
  });

  const historicalErrors = useMemo(() => {
    const errors = new Set<string>();
    trades.forEach(t => { if (t.executionError && t.executionError !== 'None') errors.add(t.executionError); });
    // FIX: Updated standardErrors to use valid ExecutionErrorType strings from types.ts
    const standardErrors: ExecutionErrorType[] = [
      '1. FOMO / Chasing',
      '2. Hesitation (Analysis Paralysis)',
      '3. Premature Exit (Paper Hands)',
      '4. Stop-Loss Sabotage (Moving SL to BE)',
      '5. Averaging Down (The Loser\'s Move)',
      '6. Revenge Trading',
      '7. Over-Leveraging (Size Error)',
      '8. Impulse/Boredom Trading',
      '9. Target Greed'
    ];
    standardErrors.forEach(err => errors.add(err));
    return Array.from(errors).sort();
  }, [trades]);

  const checklistItems = [
    { label: '"Nu știu ce va face piața și nu am nevoie să știu ca să fac bani."', sub: '(ACCEPTAREA INCERTITUDINII)', key: 'gkUncertaintyAccepted' },
    { label: '"Voi ieși imediat dacă piața îmi invalidează teza, fără să sper că își revine."', sub: '(EXECUȚIA STOP-LOSS)', key: 'gkStopLossExecution' },
    { label: '"Nu voi adăuga la o poziție pierzătoare."', sub: '(REGULA ANTI-DEZASTRU)', key: 'gkNoAddingToLoss' },
    { label: '"Sunt pregătit să pierd riscul alocat azi și să rămân calm."', sub: '', key: 'gkRiskCalmness', hasInput: true },
  ];

  const handleToggle = (key: string) => {
    setFormData({ ...formData, [key]: !(formData as any)[key] });
  };

  const allChecked = useMemo(() => (
    formData.gkUncertaintyAccepted && 
    formData.gkStopLossExecution && 
    formData.gkNoAddingToLoss && 
    formData.gkRiskCalmness &&
    formData.gkFocusError !== 'None'
  ), [formData]);

  const handleFinalize = () => {
    onSave(selectedDate, formData);
    onClose();
  };

  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800/60 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="px-10 py-10 border-b border-slate-800/40 flex justify-between items-start">
          <div>
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">MENTAL STATE CALIBRATION</h4>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic leading-tight">
              MENTAL REHEARSAL <br/>
              <span className="text-slate-500 not-italic text-sm font-bold uppercase tracking-widest">(VIZUALIZAREA – TEHNICA MARK DOUGLAS)</span>
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-10 space-y-8">
           {/* OBIECTIV */}
           <div className="bg-orange-500/5 border border-orange-500/20 p-8 rounded-[2rem] shadow-inner">
              <p className="text-xs text-orange-400 font-black uppercase tracking-widest leading-relaxed">
                 OBIECTIV: PREGĂTIREA CREIERULUI PENTRU DUREREA PIERDERII ȘI TENTAȚIA PROFITULUI.
              </p>
           </div>

           {/* FOCUS BOX */}
           <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                    <i className="fas fa-bullseye text-sm"></i>
                 </div>
                 <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">ASTĂZI MĂ CONCENTREZ PE A CORECTA:</h3>
              </div>
              
              <div className="relative group">
                <select 
                  value={formData.gkFocusError} 
                  onChange={(e) => setFormData({...formData, gkFocusError: e.target.value})}
                  className="w-full bg-[#0b1222] border border-slate-800 rounded-2xl px-6 py-5 text-sm font-black text-white uppercase tracking-widest appearance-none focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="None">Alege eroarea pentru corecție...</option>
                  {historicalErrors.map(err => (
                    <option key={err} value={err}>{err}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"></i>
              </div>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest text-center italic">
                 * ACEASTĂ EROARE VA FI MARCATĂ CA PRIORITATE ÎN EXECUȚIA DE AZI.
              </p>
           </div>

           {/* CHECKLIST */}
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">CHECKLIST PSIHOLOGIC (TREBUIE BIFATE TOATE):</h3>
              <div className="space-y-3">
                 {checklistItems.map((item) => (
                    <div 
                      key={item.key} 
                      onClick={() => handleToggle(item.key)}
                      className={`flex items-start p-6 bg-[#0b1222]/40 border rounded-[2rem] transition-all cursor-pointer group ${
                        (formData as any)[item.key] 
                        ? 'border-blue-500/30 bg-blue-600/5 shadow-lg shadow-blue-950/20' 
                        : 'border-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                       <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all mr-6 shrink-0 ${
                         (formData as any)[item.key] 
                         ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                         : 'border-slate-800 bg-slate-950 group-hover:border-slate-700'
                       }`}>
                          {(formData as any)[item.key] && <i className="fas fa-check text-xs"></i>}
                       </div>
                       <div className="flex-1">
                          <p className={`text-[14px] font-black leading-snug tracking-tight ${(formData as any)[item.key] ? 'text-white' : 'text-slate-300'}`}>
                            {item.label}
                          </p>
                          {item.sub && (
                            <p className="text-[10px] text-slate-500 font-black uppercase mt-1.5 tracking-widest">{item.sub}</p>
                          )}
                          {item.hasInput && (
                            <div className="mt-4 flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">SUMA RISC ($):</span>
                                <input 
                                    type="number" 
                                    value={formData.gkDailyRiskAmount || ''} 
                                    onChange={(e) => setFormData({...formData, gkDailyRiskAmount: parseInt(e.target.value) || 0})}
                                    className="bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-2 text-sm font-black text-white w-32 outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                                    placeholder="0"
                                />
                            </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ACTIONS */}
        <div className="p-10 border-t border-slate-800/40 bg-[#03070c] flex space-x-6">
            <button onClick={onClose} className="flex-1 py-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 font-black text-[11px] uppercase tracking-[0.3em] transition-all">SUNT NESIGUR</button>
            <button 
              disabled={!allChecked}
              onClick={handleFinalize} 
              className={`flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 border-2 ${
                allChecked 
                ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-blue-600/30' 
                : 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              {allChecked ? 'AM ACCEPTAT INCERTITUDINEA. START.' : 'BIFEAZĂ TOATE PUNCTELE'}
            </button>
        </div>
      </div>
    </div>
  );
};