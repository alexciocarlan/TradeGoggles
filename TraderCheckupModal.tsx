
import React, { useState, useEffect } from 'react';
import { DailyPrepData } from './types';
import { Language } from './translations';

interface TraderCheckupModalProps {
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
  language: Language;
}

const TraderCheckupModal: React.FC<TraderCheckupModalProps> = ({ onSave, onClose, initialData, initialDate, language }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);

  const defaultState: DailyPrepData = {
    gkPhysicalEnergy: 5, gkMentalClarity: 5, gkEmotionalCalm: 5, gkProcessConfidence: 5,
    gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
    gkHRVValue: 40, gkHRVBaseline: 40,
    gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
    gkTotalScore: 0, gkVerdict: 'None',
  } as any;

  const [formData, setFormData] = useState<DailyPrepData>(initialData || defaultState);

  useEffect(() => {
    // 1. Calcul punctaj HRV (50p Max)
    const hrvValue = Number(formData.gkHRVValue) || 40;
    const hrvBaseline = Number(formData.gkHRVBaseline) || 40;
    const hrvRatio = hrvValue / hrvBaseline;
    let hrvPoints = 0;
    
    if (hrvRatio >= 0.9 && hrvRatio <= 1.1) {
        hrvPoints = 50; // Optimal
    } else if ((hrvRatio >= 0.8 && hrvRatio < 0.9) || (hrvRatio > 1.1 && hrvRatio <= 1.2)) {
        hrvPoints = 25; // Mild Stress / Recovery
    } else {
        hrvPoints = 0; // Unbalanced / Critical
    }

    // 2. Calcul punctaj Somn (30p Max - bazat pe durata de 8 ore)
    const sleepHours = Number(formData.gkSleepHours) || 0;
    const sleepPoints = Math.min((sleepHours / 8) * 30, 30);

    // 3. Calcul punctaj Subjective Check-in (20p Max)
    const subjectiveRaw = Number(formData.gkPhysicalEnergy) + Number(formData.gkMentalClarity) + 
                          Number(formData.gkEmotionalCalm) + Number(formData.gkProcessConfidence);
    const subjectivePoints = (subjectiveRaw / 40) * 20;

    const total = Math.round(hrvPoints + sleepPoints + subjectivePoints);
    
    let verdict: 'Green' | 'Yellow' | 'Red' = 'Red';
    if (total >= 80) verdict = 'Green';
    else if (total >= 50) verdict = 'Yellow';
    else verdict = 'Red';

    if (formData.gkTotalScore !== total || formData.gkVerdict !== verdict) {
        setFormData(prev => ({ ...prev, gkTotalScore: total, gkVerdict: verdict }));
    }
  }, [
    formData.gkHRVValue, formData.gkHRVBaseline, 
    formData.gkSleepHours, 
    formData.gkPhysicalEnergy, formData.gkMentalClarity, formData.gkEmotionalCalm, formData.gkProcessConfidence
  ]);

  const subTitleClass = "text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-3 mb-6";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#060b13] z-20">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black flex items-center tracking-tight uppercase text-white italic">
               <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mr-4 shadow-lg shadow-emerald-600/20 not-italic">
                  <i className="fas fa-user-md text-sm"></i>
               </div>
              TRADER CHECK-UP: BIOMETRIC & MENTAL FILTER
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar bg-[#060b13]">
          <section className="bg-slate-900/10 p-10 rounded-[2.5rem] border border-slate-800/40 relative overflow-hidden">
             <p className="text-slate-500 text-sm font-medium italic mb-10 max-w-3xl leading-relaxed">
               Dacă biometria indică stres ridicat (HRV scăzut), cortexul prefrontal este deconectat. Nu ai voie să deschizi graficele în stare de "adolescent furios".
             </p>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
                <div className="space-y-8">
                    <h4 className={subTitleClass}>1. BIOMETRIC DATA (50P HRV + 30P SLEEP)</h4>
                    
                    {/* HRV SLIDER SECTION */}
                    <div className="bg-[#0b1222] p-8 rounded-3xl border border-blue-500/20 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h5 className="text-sm font-black text-blue-400 uppercase tracking-widest">Scorul HRV</h5>
                                <p className="text-[10px] text-slate-500 font-bold italic">Detectarea stresului fiziologic</p>
                            </div>
                            <div className="flex items-center space-x-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Baseline (Avg):</span>
                                <input 
                                    type="number" 
                                    /* Fixed: ensured correct casting for numeric inputs to fix object literal specification error */
                                    value={formData.gkHRVBaseline || 0} 
                                    onChange={e => setFormData({...formData, gkHRVBaseline: parseInt(e.target.value) || 0})}
                                    className="bg-transparent border-none text-xs font-black text-white w-12 text-center focus:ring-0"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Lectură Curentă: {formData.gkHRVValue || 0} ms</span>
                                <span className={`text-[10px] font-black uppercase ${
                                    (Number(formData.gkHRVValue || 0) / Number(formData.gkHRVBaseline || 40)) >= 0.9 && (Number(formData.gkHRVValue || 0) / Number(formData.gkHRVBaseline || 40)) <= 1.1 
                                    ? 'text-green-500' : 'text-red-400'
                                }`}>
                                    Deviație: {Math.round(((Number(formData.gkHRVValue || 0) / Number(formData.gkHRVBaseline || 40)) - 1) * 100)}%
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min={Math.round(Number(formData.gkHRVBaseline || 40) * 0.5)} 
                                max={Math.round(Number(formData.gkHRVBaseline || 40) * 1.5)} 
                                value={formData.gkHRVValue || 0} 
                                onChange={e => setFormData({...formData, gkHRVValue: parseInt(e.target.value) || 0})}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>

                    <div className="bg-[#0b1222] p-8 rounded-3xl border border-slate-800/60">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Ore de somn (Pro-rata față de 8h ideal)</span>
                        <div className="flex items-center space-x-6">
                            <input 
                                type="range" min="0" max="12" step="0.5"
                                value={formData.gkSleepHours || 0} 
                                onChange={e => setFormData({...formData, gkSleepHours: parseFloat(e.target.value)})} 
                                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                            />
                            <span className="text-2xl font-black text-white w-12">{formData.gkSleepHours}h</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <h4 className={subTitleClass}>2. SUBJECTIVE CHECK-IN (20P MAX)</h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Energie Fizică', key: 'gkPhysicalEnergy' },
                            { label: 'Claritate Mentală', key: 'gkMentalClarity' },
                            { label: 'Calm Emoțional', key: 'gkEmotionalCalm' },
                            { label: 'Încredere în Proces', key: 'gkProcessConfidence' }
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between bg-[#0b1222] p-6 rounded-2xl border border-slate-800/60">
                                <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{item.label}</span>
                                <div className="flex items-center space-x-4">
                                    <input 
                                        type="range" min="1" max="10" 
                                        value={(formData as any)[item.key]} 
                                        onChange={e => setFormData({...formData, [item.key]: parseInt(e.target.value)})} 
                                        className="w-32 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <span className="text-lg font-black text-emerald-400 w-6 text-center">{(formData as any)[item.key]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-10 border-t border-slate-800/60">
                <div className="flex items-center space-x-8 shrink-0">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">GATEKEEPER SCORE:</span>
                    <span className={`text-7xl font-black tracking-tighter ${formData.gkVerdict === 'Green' ? 'text-green-500' : formData.gkVerdict === 'Yellow' ? 'text-yellow-500' : 'text-red-500'}`}>{formData.gkTotalScore} <span className="text-3xl text-slate-800">/ 100</span></span>
                </div>
                <div className={`flex-1 w-full flex items-center space-x-6 p-8 rounded-[2.5rem] border transition-all duration-700 ${formData.gkVerdict === 'Green' ? 'bg-green-500/5 border-green-500/20 shadow-green-900/10' : formData.gkVerdict === 'Yellow' ? 'bg-yellow-500/5 border-yellow-500/20 shadow-yellow-900/10' : 'bg-red-500/5 border-red-500/20 shadow-red-900/10'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-2xl ${formData.gkVerdict === 'Green' ? 'bg-green-500' : formData.gkVerdict === 'Yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        <i className={`fas ${formData.gkVerdict === 'Green' ? 'fa-check' : formData.gkVerdict === 'Yellow' ? 'fa-exclamation-triangle' : 'fa-times'} text-white text-3xl`}></i>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">VERDICT: {formData.gkVerdict === 'Green' ? 'APEX STATE' : formData.gkVerdict === 'Yellow' ? 'CAUTION / COMPROMISED' : 'SYSTEM FAILURE'}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          {formData.gkVerdict === 'Green' ? 'Execută planul fără ezitare.' : 
                           formData.gkVerdict === 'Yellow' ? 'Tranzacționează cu mărime redusă (-50%).' : 
                           'Probabilitatea de a pierde bani azi este de 90%. NO TRADE.'}
                        </p>
                    </div>
                </div>
             </div>
          </section>

          <div className="pt-10 flex space-x-6 sticky bottom-0 bg-[#060b13] pb-10 z-20 border-t border-slate-800/50 mt-10">
            <button onClick={onClose} type="button" className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-xl">Anulează</button>
            <button onClick={() => onSave(selectedDate, formData)} type="button" className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 uppercase tracking-widest text-[11px] active:scale-[0.98]">Confirmă Starea Mentală</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderCheckupModal;
