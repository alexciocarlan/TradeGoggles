
import React, { useState, useMemo } from 'react';
import { DailyPrepData } from '../types';
import { useAppStore } from '../AppContext';
import { calculateBEScore } from '../ProtocolEngine';

interface TraderCheckupModalProps {
  isOpen: boolean; 
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
}

type GkKeys = keyof Pick<DailyPrepData, 'gkPhysicalEnergy' | 'gkMentalClarity' | 'gkEmotionalCalm' | 'gkProcessConfidence'>;

const TraderCheckupModal: React.FC<TraderCheckupModalProps> = ({ isOpen, onSave, onClose, initialData, initialDate }) => {
  const [selectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const { trades } = useAppStore(state => ({ trades: state.trades || [] }));

  // --- BEHAVIORAL HANDICAP CALCULATION ---
  const beMetrics = useMemo(() => calculateBEScore(trades), [trades]);

  const defaultState: DailyPrepData = {
    gkPhysicalEnergy: 5, gkMentalClarity: 5, gkEmotionalCalm: 5, gkProcessConfidence: 5,
    gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
    gkHRVValue: 45, 
    gkHRVBaseline: 45, 
    gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
    gkUncertaintyAccepted: false, gkStopLossExecution: false, gkNoAddingToLoss: false, gkRiskCalmness: false, 
    gkDailyRiskAmount: 0, 
    gkTotalScore: 0, gkVerdict: 'None', 
    instrument: 'NQ', 
    pdValueRelationship: 'None', 
    marketCondition: 'None', 
    priceVsPWeek: 'None', 
    mediumTermTrend: 'None',
    onRangeVsPDay: 'None', 
    onInventory: 'None', 
    pdExtremes: 'None', 
    untestedPdVA: 'None',
    spHigh: '', spLow: '', gapHigh: '', gapLow: '', 
    priorVPOC: 'None', 
    onVsSettlement: 'None',
    newsImpact: 'None', 
    bias: 'Neutral', 
    dailyNarrative: '',
    setup: 'None', 
    setupGrade: 'None', 
    hypoSession: 'NY Morning', 
    hypoThen: 'None', 
    zoneOfInterest: '', 
    continuationTrigger: '', 
    reversalTrigger: '', 
    invalidationPoint: '', 
    exitLevel: '',
    setup2: 'None', 
    hypoSession2: 'NY Morning', 
    hypoThen2: 'None', 
    zoneOfInterest2: '', 
    continuationTrigger2: '', 
    reversalTrigger2: '', 
    invalidationPoint2: '', 
    exitLevel2: '',
    habNoGoRespected: false, habPreMarketDone: false, habStopLossRespected: false,
    habNoRevengeTrading: false, habJournalCompleted: false, habDisciplineScore: 5,
    pmrTradedPlan: 'None', pmrDifficultMoment: '', pmrDailyLesson: '',
    prepScreenshots: [],
    openType: 'None', 
    ibWidth: 'Normal', 
    rangeExtension: 'None',
    htfMs: 'Bullish', 
    trendYesterday: false,
    gkFocusError: 'None'
  };

  const [formData, setFormData] = useState<DailyPrepData>(initialData || defaultState);

  // OPTIMIZARE: Calcul sincron al scorului și verdictului folosind useMemo
  const { gkTotalScore, gkVerdict } = useMemo(() => {
    const hrvVal = Number(formData.gkHRVValue) || 1;
    const hrvBase = Number(formData.gkHRVBaseline) || 1;
    const deviation = Math.abs((hrvVal / hrvBase) - 1);

    let hrvPoints = 0;
    if (deviation <= 0.06) hrvPoints = 50;       
    else if (deviation <= 0.12) hrvPoints = 35;  
    else if (deviation <= 0.20) hrvPoints = 15;  
    else hrvPoints = 0;                          

    const sleep = Number(formData.gkSleepHours) || 0;
    let sleepPoints = 0;
    if (sleep >= 7.5) sleepPoints = 30;
    else if (sleep >= 6.5) sleepPoints = 20;
    else if (sleep >= 5.5) sleepPoints = 10;
    else sleepPoints = 0;

    const subjSum = Number(formData.gkPhysicalEnergy) + Number(formData.gkMentalClarity) + 
                    Number(formData.gkEmotionalCalm) + Number(formData.gkProcessConfidence);
    const subjPoints = (subjSum / 40) * 20;

    const total = Math.round(hrvPoints + sleepPoints + subjPoints);
    
    let verdict: 'Green' | 'Yellow' | 'Red' | 'None' = 'None'; 
    if (total >= 80) verdict = 'Green';
    else if (total >= 50) verdict = 'Yellow';
    else verdict = 'Red';

    return { gkTotalScore: total, gkVerdict: verdict };
  }, [
    formData.gkHRVValue, formData.gkHRVBaseline, formData.gkSleepHours,
    formData.gkPhysicalEnergy, formData.gkMentalClarity, formData.gkEmotionalCalm, formData.gkProcessConfidence
  ]);

  const hrvDeviation = formData.gkHRVBaseline 
    ? Math.round(((Number(formData.gkHRVValue || 0) / Number(formData.gkHRVBaseline || 1)) - 1) * 100) 
    : 0;

  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[2.5rem] w-full max-w-[1050px] max-h-[98vh] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* NEW: BEHAVIORAL HANDICAP HEADER */}
        <div className={`px-8 py-4 border-b border-slate-800 ${beMetrics.score < 50 ? 'bg-red-900/20' : 'bg-slate-900/30'} flex items-center justify-between`}>
            <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border ${beMetrics.score >= 80 ? 'bg-emerald-500 text-white border-emerald-400' : beMetrics.score < 50 ? 'bg-red-500 text-white border-red-400' : 'bg-orange-500 text-white border-orange-400'}`}>
                    {beMetrics.score}
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BEHAVIORAL EQUITY (BE)</p>
                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">{beMetrics.handicapMessage}</p>
                </div>
            </div>
            {beMetrics.isTierALocked && (
                <div className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
                    <i className="fas fa-lock text-red-500 text-xs"></i>
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">TIER A LOCKED</span>
                </div>
            )}
        </div>

        <div className="px-8 py-5 border-b border-slate-800/40 flex justify-between items-center bg-gradient-to-r from-slate-900/20 to-transparent shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <i className="fas fa-microchip text-indigo-500 text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                BIOMETRIC GATEKEEPER
              </h2>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">SYSTEM ACCESS CALIBRATION PROTOCOL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-all p-2 hover:bg-slate-800 rounded-lg">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-[#060b13]">
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* LEFT COLUMN: PHYSIOLOGICAL SCAN (80%) */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-2 pl-2">
                 <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">01 // PHYSIOLOGICAL SCAN (80%)</span>
              </div>

              {/* HRV CARD */}
              <div className="bg-[#0b1222]/60 p-6 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h5 className="text-base font-black text-blue-400 uppercase tracking-widest leading-none">HRV READOUT</h5>
                    <p className="text-[8px] text-slate-600 font-bold uppercase italic opacity-60">Autonomic Nervous System Sync</p>
                  </div>
                  <div className="bg-[#060b13] border border-slate-700/50 p-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-xl">
                    <span className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">BASELINE</span>
                    <input 
                      type="number" 
                      value={formData.gkHRVBaseline || 0} 
                      onChange={e => setFormData({...formData, gkHRVBaseline: parseInt(e.target.value) || 0})}
                      className="bg-transparent border-none text-xl font-black text-white text-center w-full focus:ring-0 p-0 tracking-tighter outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">ACTUAL: {formData.gkHRVValue || 0} MS</span>
                    <span className={Math.abs(hrvDeviation) > 15 ? 'text-red-500 animate-pulse' : 'text-blue-400'}>
                      DEV: {hrvDeviation}%
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      type="range" 
                      min={Math.round((formData.gkHRVBaseline || 45) * 0.4)} 
                      max={Math.round((formData.gkHRVBaseline || 45) * 1.6)} 
                      value={formData.gkHRVValue || 45} 
                      onChange={e => setFormData({...formData, gkHRVValue: parseInt(e.target.value) || 0})}
                      className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[8px] font-black text-slate-700 uppercase mt-3 tracking-widest">
                        <span>FATIGUE</span>
                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>
                        <span>HYPER-STRESS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLEEP CARD */}
              <div className="bg-[#0b1222]/60 p-6 rounded-[2rem] border border-slate-800 shadow-lg relative overflow-hidden">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-6">
                  RECOVERY DEPTH (PFC ENGINE)
                </span>
                <div className="flex items-center space-x-8">
                  <div className="flex-1 space-y-3">
                     <input 
                        type="range" min="0" max="12" step="0.5"
                        value={formData.gkSleepHours || 0} 
                        onChange={e => setFormData({...formData, gkSleepHours: parseFloat(e.target.value)})} 
                        className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                      />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-6xl font-black text-white leading-none tracking-tighter drop-shadow-[0_5px_15px_rgba(255,255,255,0.1)]">{formData.gkSleepHours}</span>
                    <span className="text-xl font-black text-slate-800 italic uppercase">H</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: COGNITIVE FILTER (20%) */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-2 pl-2">
                 <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">02 // COGNITIVE FILTER (20%)</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'PHYSICAL ENERGY', desc: 'VIGOAREA CORPORALĂ.', key: 'gkPhysicalEnergy' as GkKeys, color: 'accent-emerald-500' },
                  { label: 'MENTAL CLARITY', desc: 'CAPACITATE DE PROCESARE.', key: 'gkMentalClarity' as GkKeys, color: 'accent-blue-500' },
                  { label: 'EMOTIONAL CALM', desc: 'ABSENȚA IRITĂRII.', key: 'gkEmotionalCalm' as GkKeys, color: 'accent-purple-500' },
                  { label: 'PROCESS TRUST', desc: 'CREDINȚA ÎN PLAN.', key: 'gkProcessConfidence' as GkKeys, color: 'accent-orange-500' }
                ].map(item => (
                  <div key={item.key} className="bg-[#0b1222]/40 p-5 rounded-2xl border border-slate-800 flex flex-col space-y-2 hover:border-slate-700 transition-all shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="w-32 shrink-0">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">{item.label}</span>
                            <span className="text-[7px] font-bold text-slate-600 uppercase tracking-tight block mt-0.5">{item.desc}</span>
                        </div>
                        <input 
                            type="range" min="1" max="10" 
                            value={formData[item.key]} 
                            onChange={e => setFormData({...formData, [item.key]: parseInt(e.target.value)})} 
                            className={`flex-1 h-1.5 bg-slate-900 border border-slate-800 rounded-full appearance-none cursor-pointer mx-6 ${item.color}`}
                        />
                        <span className="text-3xl font-black text-white w-8 text-right leading-none tracking-tighter">{formData[item.key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-800/60">
            <div className="flex items-center space-x-10 shrink-0">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">TOTAL READY SCORE</span>
                    <div className="flex items-baseline group">
                        <span className={`text-8xl font-black leading-none tracking-tighter transition-all duration-700 ${
                            gkVerdict === 'Green' ? 'text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 
                            gkVerdict === 'Yellow' ? 'text-orange-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.2)]' : 
                            'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                        }`}>
                            {gkTotalScore || '0'}
                        </span>
                        <span className="text-3xl font-black text-slate-800 ml-2 select-none italic">/100</span>
                    </div>
                </div>
            </div>

            <div className={`min-h-[160px] w-full md:w-[420px] rounded-[2.5rem] border flex items-center p-8 space-x-8 transition-all duration-500 shadow-2xl relative overflow-hidden ${
              gkVerdict === 'Green' ? 'bg-green-500/5 border-green-500/20' : 
              gkVerdict === 'Yellow' ? 'bg-orange-500/5 border-orange-500/20' : 
              'bg-red-500/5 border-red-500/20'
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 ${
                  gkVerdict === 'Green' ? 'bg-green-500 text-white' : 
                  gkVerdict === 'Yellow' ? 'bg-orange-500 text-white' : 
                  'bg-red-600 text-white'
              }`}>
                  <i className={`fas ${gkVerdict === 'Green' ? 'fa-bolt' : gkVerdict === 'Yellow' ? 'fa-triangle-exclamation' : 'fa-ban'}`}></i>
              </div>
              <div className="flex-1">
                  <p className={`text-xl font-black uppercase tracking-[0.2em] mb-2 leading-none ${
                      gkVerdict === 'Green' ? 'text-green-500' : 
                      gkVerdict === 'Yellow' ? 'text-orange-500' : 
                      'text-red-500'
                  }`}>
                      {gkVerdict === 'Green' ? 'ALPHA STATE' : gkVerdict === 'Yellow' ? 'CAUTION' : 'DENIED'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed italic">
                      {gkVerdict === 'Green' ? 'PERFORMANȚĂ OPTIMĂ. CORTEX ACTIV. EXECUȚIE 100% RISK.' : 
                       gkVerdict === 'Yellow' ? 'RISC MODERAT DE GREȘEALĂ. RECOMANDAT JUMĂTATE DE RISC.' : 
                       'SISTEMUL NEUROLIGIC ESTE COMPROMIS. STOP TRADING.'}
                  </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t border-slate-800/60 bg-black/40 flex space-x-6 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:text-white">
            ABORT
          </button>
          <button 
            disabled={gkVerdict === 'Red'}
            onClick={() => {
                onSave(selectedDate, { ...formData, gkTotalScore, gkVerdict });
                onClose();
            }} 
            className={`flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] shadow-2xl ${
                gkVerdict === 'Red' 
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {gkVerdict === 'Red' ? 'ACCESS DENIED' : 'DEPLOY SYSTEM'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TraderCheckupModal;
