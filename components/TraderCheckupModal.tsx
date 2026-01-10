
import React, { useState, useMemo, useEffect } from 'react';
import { DailyPrepData } from '../types';
import { useAppStore } from '../AppContext';

interface TraderCheckupModalProps {
  isOpen: boolean; 
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
}

type GkKeys = keyof Pick<DailyPrepData, 'gkPhysicalEnergy' | 'gkMentalClarity' | 'gkEmotionalCalm' | 'gkProcessConfidence'>;

const TraderCheckupModal: React.FC<TraderCheckupModalProps> = ({ isOpen, onSave, onClose, initialData, initialDate }) => {
  const selectedDate = useMemo(() => initialDate || new Date().toISOString().split('T')[0], [initialDate]);
  
  const defaultState: DailyPrepData = {
    gkPhysicalEnergy: 7, gkMentalClarity: 7, gkEmotionalCalm: 7, gkProcessConfidence: 7,
    gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
    gkHRVValue: 45, gkHRVBaseline: 45, 
    gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
    gkUncertaintyAccepted: false, gkStopLossExecution: false, gkNoAddingToLoss: false, gkRiskCalmness: false, 
    gkDailyRiskAmount: 0, gkTotalScore: 0, gkVerdict: 'None', 
    instrument: 'NQ', pdValueRelationship: 'None', marketCondition: 'None', 
    priceVsPWeek: 'None', mediumTermTrend: 'None', onRangeVsPDay: 'None', 
    onInventory: 'None', pdExtremes: 'None', untestedPdVA: 'None', 
    spHigh: '', spLow: '', gapHigh: '', gapLow: '', priorVPOC: 'None', 
    onVsSettlement: 'None', newsImpact: 'None', bias: 'Neutral', dailyNarrative: '',
    setup: 'None', setupGrade: 'None', hypoSession: 'NY Morning', hypoThen: 'None', 
    zoneOfInterest: '', continuationTrigger: '', reversalTrigger: '', invalidationPoint: '', exitLevel: '',
    setup2: 'None', hypoSession2: 'NY Morning', hypoThen2: 'None', 
    zoneOfInterest2: '', continuationTrigger2: '', reversalTrigger2: '', 
    invalidationPoint2: '', exitLevel2: '',
    habNoGoRespected: false, habPreMarketDone: false, habStopLossRespected: false,
    habNoRevengeTrading: false, habJournalCompleted: false, habDisciplineScore: 5,
    pmrTradedPlan: 'None', pmrDifficultMoment: '', pmrDailyLesson: '',
    prepScreenshots: [], openType: 'None', ibWidth: 'Normal', rangeExtension: 'None',
    htfMs: 'Bullish', trendYesterday: false, gkFocusError: 'None'
  };

  const [formData, setFormData] = useState<DailyPrepData>(initialData || defaultState);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  const { gkTotalScore, gkVerdict } = useMemo(() => {
    const hrvVal = Number(formData.gkHRVValue) || 1;
    const hrvBase = Number(formData.gkHRVBaseline) || 1;
    const deviation = Math.abs((hrvVal / hrvBase) - 1);

    // Scor HRV (Max 50p) - Penalizare progresivă pe deviație
    let hrvPoints = 0;
    if (deviation <= 0.06) hrvPoints = 50;       
    else if (deviation <= 0.12) hrvPoints = 35;  
    else if (deviation <= 0.20) hrvPoints = 15;  
    else hrvPoints = 0;                          

    // Scor Somn (Max 30p)
    const sleep = Number(formData.gkSleepHours) || 0;
    let sleepPoints = 0;
    if (sleep >= 7.5) sleepPoints = 30;
    else if (sleep >= 6.5) sleepPoints = 20;
    else if (sleep >= 5.5) sleepPoints = 10;

    // Scor Subiectiv (Max 20p)
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

  const handleDeploy = () => {
    const finalPrep = { ...formData, gkTotalScore, gkVerdict };
    onSave(selectedDate, finalPrep);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[2.5rem] w-full max-w-[1050px] max-h-[98vh] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        <div className="px-10 py-8 border-b border-slate-800/40 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <i className="fas fa-microchip text-indigo-500 text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                BIOMETRIC GATEKEEPER
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SYSTEM ACCESS CALIBRATION PROTOCOL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-all p-3 hover:bg-slate-800 rounded-xl">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-[#060b13]">
          <p className="text-slate-500 text-xs font-medium italic max-w-4xl leading-tight opacity-60">
            Fără excepții. Dacă datele indică stres, contul rămâne blocat. <span className="text-indigo-400 font-black not-italic uppercase tracking-widest text-[10px] ml-2">PROTOCOL DOUGLAS-TENDLER ACTIV.</span>
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* 01 // PHYSIOLOGICAL SCAN */}
            <div className="space-y-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block border-l-2 border-indigo-500 pl-4">01 // PHYSIOLOGICAL SCAN (80%)</span>
              
              <div className="bg-[#0b1222]/60 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-10">
                  <div className="space-y-1">
                    <h5 className="text-lg font-black text-blue-400 uppercase tracking-widest leading-none">HRV READOUT</h5>
                    <p className="text-[9px] text-slate-600 font-bold uppercase italic opacity-60">Autonomic Nervous System Sync</p>
                  </div>
                  <div className="bg-[#060b13] border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
                    <span className="text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">BASELINE</span>
                    <input 
                      type="number" 
                      value={formData.gkHRVBaseline || 0} 
                      onChange={e => setFormData({...formData, gkHRVBaseline: parseInt(e.target.value) || 0})}
                      className="bg-transparent border-none text-2xl font-black text-white text-center w-full focus:ring-0 p-0 tracking-tighter outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">ACTUAL: {formData.gkHRVValue || 0} MS</span>
                    <span className={Math.abs(hrvDeviation) > 15 ? 'text-red-500 animate-pulse' : 'text-blue-400'}>
                      DEV: {hrvDeviation}%
                    </span>
                  </div>
                  <div className="relative pt-2">
                    <input 
                      type="range" 
                      min={Math.round((formData.gkHRVBaseline || 45) * 0.4)} 
                      max={Math.round((formData.gkHRVBaseline || 45) * 1.6)} 
                      value={formData.gkHRVValue || 45} 
                      onChange={e => setFormData({...formData, gkHRVValue: parseInt(e.target.value) || 0})}
                      className="w-full h-2 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between mt-5 text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
                      <span>FATIGUE</span>
                      <span>HYPER-STRESS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0b1222]/60 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-8">
                  RECOVERY DEPTH (PFC ENGINE)
                </span>
                <div className="flex items-center space-x-12">
                  <div className="flex-1 space-y-4">
                     <input 
                        type="range" min="0" max="12" step="0.5"
                        value={formData.gkSleepHours || 0} 
                        onChange={e => setFormData({...formData, gkSleepHours: parseFloat(e.target.value)})} 
                        className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                      />
                      <div className="flex justify-between text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                         <span>BRAIN-FOG</span>
                         <span>HYPER-ALERT</span>
                      </div>
                  </div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-7xl font-black text-white leading-none tracking-tighter drop-shadow-[0_5px_15px_rgba(255,255,255,0.1)]">{formData.gkSleepHours}</span>
                    <span className="text-2xl font-black text-slate-800 italic uppercase">H</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 02 // COGNITIVE FILTER */}
            <div className="space-y-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block border-l-2 border-indigo-500 pl-4">02 // COGNITIVE FILTER (20%)</span>
              <div className="space-y-4">
                {[
                  { label: 'PHYSICAL ENERGY', key: 'gkPhysicalEnergy' as GkKeys, color: 'accent-emerald-500', desc: 'Vigoarea corporală.' },
                  { label: 'MENTAL CLARITY', key: 'gkMentalClarity' as GkKeys, color: 'accent-blue-500', desc: 'Capacitate de procesare.' },
                  { label: 'EMOTIONAL CALM', key: 'gkEmotionalCalm' as GkKeys, color: 'accent-purple-500', desc: 'Absența iritării.' },
                  { label: 'PROCESS TRUST', key: 'gkProcessConfidence' as GkKeys, color: 'accent-orange-500', desc: 'Credința în plan.' }
                ].map(item => (
                  <div key={item.key} className="bg-slate-900/20 p-6 rounded-[1.8rem] border border-slate-800 flex flex-col space-y-3 hover:border-slate-700 transition-all shadow-lg group/item">
                    <div className="flex items-center justify-between">
                        <div className="w-40 shrink-0">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{item.label}</span>
                          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tight mt-1">{item.desc}</p>
                        </div>
                        <input 
                          type="range" min="1" max="10" 
                          value={formData[item.key]} 
                          onChange={e => setFormData({...formData, [item.key]: parseInt(e.target.value)})} 
                          className={`flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full appearance-none cursor-pointer mx-8 ${item.color}`}
                        />
                        <span className="text-3xl font-black text-white w-8 text-right leading-none tracking-tighter">{formData[item.key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TOTAL SCORE BLOCK */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-slate-800/60">
            
            <div className="flex items-center space-x-12 shrink-0">
                <div className="space-y-1">
                   <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] block">TOTAL</span>
                   <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] block">READY</span>
                   <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] block">SCORE</span>
                </div>
                <div className="flex items-baseline group">
                  <span className={`text-[9rem] font-black leading-none tracking-tighter transition-all duration-700 ${
                    gkVerdict === 'Green' ? 'text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 
                    gkVerdict === 'Yellow' ? 'text-orange-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]' : 
                    'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                  }`}>
                    {gkTotalScore || '0'}
                  </span>
                  <span className="text-3xl font-black text-slate-900 ml-6 select-none italic">/ 100</span>
                </div>
            </div>

            <div className={`min-h-[180px] w-full md:w-[420px] rounded-[3rem] border-2 flex items-center p-8 space-x-8 transition-all duration-500 shadow-2xl relative overflow-hidden group/pill ${
              gkVerdict === 'Green' ? 'bg-green-500/5 border-green-500/20' : 
              gkVerdict === 'Yellow' ? 'bg-orange-500/5 border-orange-500/20' : 
              'bg-red-500/5 border-red-500/20'
            }`}>
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl shrink-0 ${
                gkVerdict === 'Green' ? 'bg-green-500 shadow-green-500/40' : 
                gkVerdict === 'Yellow' ? 'bg-orange-500 shadow-orange-500/40' : 
                'bg-red-500 shadow-red-500/40'
              }`}>
                <i className={`fas ${
                  gkVerdict === 'Green' ? 'fa-bolt' : 
                  gkVerdict === 'Yellow' ? 'fa-shield-halved' : 
                  'fa-ban'
                } text-white text-2xl`}></i>
              </div>
              
              <div className="flex-1">
                  <p className={`text-[14px] font-black uppercase tracking-[0.4em] mb-2 ${
                      gkVerdict === 'Green' ? 'text-green-500' : 
                      gkVerdict === 'Yellow' ? 'text-orange-500' : 
                      'text-red-500'
                  }`}>
                      {gkVerdict === 'Green' ? 'ALPHA STATE' : gkVerdict === 'Yellow' ? 'CAUTION' : 'DENIED'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed italic">
                     {gkVerdict === 'Green' ? 'Performanță optimă. Cortex activ. Execuție 100% risk.' : 
                      gkVerdict === 'Yellow' ? 'Sistem degradat. Risc de eroare crescut. Redu poziția.' : 
                      'Eșec calibrare. Accesul la cont este restricționat.'}
                  </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-10 py-8 border-t border-slate-800/60 bg-black/40 flex space-x-6 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-400 font-black text-[11px] uppercase tracking-[0.4em] transition-all">
            ABORT
          </button>
          <button 
            onClick={handleDeploy} 
            className={`flex-[2] py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] transition-all active:scale-[0.98] shadow-2xl ${
                gkVerdict === 'Red' 
                ? 'bg-slate-900 text-slate-700 border border-red-950/40 hover:bg-slate-800 hover:text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_20px_50px_rgba(99,102,241,0.3)]'
            }`}
          >
            {gkVerdict === 'Red' ? 'DEPLOY SYSTEM (OVERRIDE)' : 'DEPLOY SYSTEM'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TraderCheckupModal;
