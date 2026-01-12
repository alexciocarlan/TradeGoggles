
import React, { useState, useEffect } from 'react';
import { DailyPrepData, ExecutionErrorType } from '../types';

interface PreFightSequenceModalProps {
  isOpen: boolean; 
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
}

const EXECUTION_ERRORS: ExecutionErrorType[] = [
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

const PreFightSequenceModal: React.FC<PreFightSequenceModalProps> = ({ isOpen, onSave, onClose, initialData, initialDate }) => {
  const [selectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState<DailyPrepData>(initialData || {
    gkUncertaintyAccepted: false, 
    gkStopLossExecution: false, 
    gkNoAddingToLoss: false, 
    gkRiskCalmness: false,
    gkDailyRiskAmount: 0,
    gkFocusError: 'None',
    // Preserve other fields
    gkPhysicalEnergy: 5, gkMentalClarity: 5, gkEmotionalCalm: 5, gkProcessConfidence: 5,
    gkTotalScore: 0, gkVerdict: 'None'
  } as DailyPrepData);

  useEffect(() => {
    if (initialData) {
        setFormData(prev => ({...prev, ...initialData}));
    }
  }, [initialData]);

  const handleToggle = (key: keyof DailyPrepData) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRiskChange = (amount: string) => {
    const val = parseFloat(amount);
    setFormData(prev => ({ ...prev, gkDailyRiskAmount: isNaN(val) ? 0 : val }));
  };

  const isValid = 
    formData.gkUncertaintyAccepted && 
    formData.gkStopLossExecution && 
    formData.gkNoAddingToLoss && 
    formData.gkRiskCalmness && 
    (formData.gkDailyRiskAmount || 0) > 0 &&
    formData.gkFocusError !== 'None';

  const handleFinalize = () => {
    if (!isValid) return;
    onSave(selectedDate, formData);
    onClose();
  };

  if (!isOpen) return null; 

  const checkboxClass = (checked: boolean) => `
    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0
    ${checked ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'border-slate-700 bg-slate-900/50 group-hover:border-slate-500'}
  `;

  const cardClass = (checked: boolean) => `
    flex items-center p-6 rounded-[1.5rem] border transition-all duration-300 cursor-pointer group relative overflow-hidden
    ${checked 
      ? 'bg-blue-600/5 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.05)]' 
      : 'bg-[#0b1222]/60 border-slate-800/60 hover:border-slate-700 hover:bg-[#0b1222]'}
  `;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[3rem] w-full max-w-[700px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 my-auto">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-800/40 flex justify-between items-center bg-[#060b13] z-10 sticky top-0">
          <div>
             <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.25em] mb-1">MENTAL STATE CALIBRATION</p>
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">MENTAL REHEARSAL</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">(VISUALIZATION – MARK DOUGLAS TECHNIQUE)</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[80vh]">
           
           {/* OBJECTIVE BOX */}
           <div className="bg-orange-900/10 border border-orange-500/20 p-6 rounded-[2rem] text-center shadow-inner">
              <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.1em] leading-relaxed">
                 OBJECTIVE: PREPARING THE BRAIN FOR THE PAIN OF LOSS AND THE TEMPTATION OF PROFIT.
              </p>
           </div>

           {/* FOCUS ERROR SECTION */}
           <div className="bg-[#0f0f1d] border border-indigo-500/30 p-6 rounded-[2rem] relative overflow-hidden group shadow-lg shadow-indigo-500/5">
              <div className="flex items-center space-x-4 mb-4 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                    <i className="fas fa-bullseye"></i>
                 </div>
                 <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">TODAY I FOCUS ON CORRECTING:</span>
              </div>
              
              <div className="relative z-10">
                 <select 
                    value={formData.gkFocusError || 'None'}
                    onChange={(e) => setFormData(prev => ({ ...prev, gkFocusError: e.target.value as any }))}
                    className="w-full bg-[#05050a] border border-slate-700 rounded-xl px-5 py-4 text-xs font-black text-white uppercase outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:bg-black"
                 >
                    <option value="None" className="text-slate-500">SELECT ERROR TO CORRECT...</option>
                    {EXECUTION_ERRORS.map(err => (
                        <option key={err} value={err}>{err}</option>
                    ))}
                 </select>
                 <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <i className="fas fa-chevron-down text-xs"></i>
                 </div>
              </div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-3 text-right italic relative z-10">* THIS ERROR WILL BE MARKED AS PRIORITY IN TODAY'S EXECUTION.</p>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           </div>

           {/* CHECKLIST */}
           <div className="space-y-4">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">PSYCHOLOGICAL CHECKLIST (ALL MUST BE CHECKED):</p>
              
              <div onClick={() => handleToggle('gkUncertaintyAccepted')} className={cardClass(!!formData.gkUncertaintyAccepted)}>
                 <div className={checkboxClass(!!formData.gkUncertaintyAccepted)}>
                    {formData.gkUncertaintyAccepted && <i className="fas fa-check text-[10px]"></i>}
                 </div>
                 <div className="ml-5">
                    <p className="text-sm font-bold text-slate-200 italic leading-snug">"I don't know what the market will do, and I don't need to know to make money."</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">(ACCEPTANCE OF UNCERTAINTY)</p>
                 </div>
              </div>

              <div onClick={() => handleToggle('gkStopLossExecution')} className={cardClass(!!formData.gkStopLossExecution)}>
                 <div className={checkboxClass(!!formData.gkStopLossExecution)}>
                    {formData.gkStopLossExecution && <i className="fas fa-check text-[10px]"></i>}
                 </div>
                 <div className="ml-5">
                    <p className="text-sm font-bold text-slate-200 italic leading-snug">"I will exit immediately if the market invalidates my thesis, without hoping for a recovery."</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">(STOP-LOSS EXECUTION)</p>
                 </div>
              </div>

              <div onClick={() => handleToggle('gkNoAddingToLoss')} className={cardClass(!!formData.gkNoAddingToLoss)}>
                 <div className={checkboxClass(!!formData.gkNoAddingToLoss)}>
                    {formData.gkNoAddingToLoss && <i className="fas fa-check text-[10px]"></i>}
                 </div>
                 <div className="ml-5">
                    <p className="text-sm font-bold text-slate-200 italic leading-snug">"I will never add to a losing position."</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">(ANTI-DISASTER RULE)</p>
                 </div>
              </div>

              <div className={`${cardClass(!!formData.gkRiskCalmness)} flex-col items-stretch !p-6`} onClick={(e) => {
                  // Prevent toggle when clicking input
                  if ((e.target as HTMLElement).tagName !== 'INPUT') handleToggle('gkRiskCalmness');
              }}>
                 <div className="flex items-center">
                    <div className={checkboxClass(!!formData.gkRiskCalmness)} onClick={() => handleToggle('gkRiskCalmness')}>
                        {formData.gkRiskCalmness && <i className="fas fa-check text-[10px]"></i>}
                    </div>
                    <div className="ml-5 flex-1">
                        <p className="text-sm font-bold text-slate-200 italic leading-snug">"I am prepared to lose the risk allocated for today and remain calm."</p>
                    </div>
                 </div>
                 <div className={`mt-4 ml-11 transition-all duration-300 ${formData.gkRiskCalmness ? 'opacity-100 max-h-20' : 'opacity-40 max-h-0 overflow-hidden'}`}>
                    <div className="flex items-center space-x-3 bg-black/40 p-1.5 rounded-xl border border-slate-700/50 w-full max-w-[200px]">
                        <span className="text-[9px] font-black text-slate-500 uppercase pl-3">RISK AMOUNT ($):</span>
                        <input 
                            type="number" 
                            value={formData.gkDailyRiskAmount || ''}
                            onChange={(e) => handleRiskChange(e.target.value)}
                            placeholder="0"
                            className="bg-transparent border-none text-sm font-black text-white w-full outline-none focus:ring-0 text-right pr-2"
                        />
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-8 border-t border-slate-800/40 bg-[#03070c] flex space-x-4 shrink-0">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[#0f111a] hover:bg-[#161925] border border-slate-800 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all">
                I AM UNSURE
            </button>
            <button 
                onClick={handleFinalize} 
                disabled={!isValid}
                className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-[0.98] border-t border-white/10 ${isValid ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'}`}
            >
                {isValid ? 'INITIALIZE SESSION' : 'COMPLETE CHECKLIST'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PreFightSequenceModal;
