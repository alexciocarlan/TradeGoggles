
import React, { useState, useEffect, useMemo } from 'react';
import { DailyPrepData } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { isToxicWin } from '../ProtocolEngine';

interface DayWrapUpModalProps {
  isOpen: boolean; 
  onClose: () => void;
  date: string;
  onSave: (date: string, prep: DailyPrepData) => void;
}

const DayWrapUpModal: React.FC<DayWrapUpModalProps> = ({ isOpen, onClose, date, onSave }) => {
  const { dailyPreps, trades } = useAppStore(useShallow(state => ({
    dailyPreps: state.dailyPreps,
    trades: state.trades || []
  })));

  const [formData, setFormData] = useState<DailyPrepData | null>(null);

  // Toxic Win Detection Logic
  const toxicTrades = useMemo(() => {
      const todayTrades = trades.filter(t => t.date === date);
      return todayTrades.filter(t => isToxicWin(t));
  }, [trades, date]);

  useEffect(() => {
    if (isOpen) {
      const existing = dailyPreps[date];
      
      if (existing) {
        setFormData({ ...existing });
      } else {
        setFormData({
          // Gatekeeper Score & Habits
          gkPhysicalEnergy: 5, gkMentalClarity: 5, gkEmotionalCalm: 5, gkProcessConfidence: 5,
          gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
          gkHRVValue: 45, gkHRVBaseline: 45,
          gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
          gkUncertaintyAccepted: false, gkStopLossExecution: false, gkNoAddingToLoss: false, gkRiskCalmness: false, gkDailyRiskAmount: 0,
          gkTotalScore: 0, gkVerdict: 'None', // Will be calculated by TraderCheckupModal

          // Market Profile Protocol & Narrative
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

          // Setup & Hypotheses (Default to 'None' for setup)
          setup: 'None', 
          setupGrade: 'None', 
          hypoSession: 'NY Morning', // Default
          hypoThen: 'None', // Default
          zoneOfInterest: '', 
          continuationTrigger: '', 
          reversalTrigger: '', 
          invalidationPoint: '', 
          exitLevel: '',
          setup2: 'None', 
          hypoSession2: 'NY Morning', // Default
          hypoThen2: 'None', // Default
          zoneOfInterest2: '', 
          continuationTrigger2: '', 
          reversalTrigger2: '', 
          invalidationPoint2: '', 
          exitLevel2: '',

          // Habits & Post-Market Review
          habNoGoRespected: false, habPreMarketDone: false, habStopLossRespected: false,
          habNoRevengeTrading: false, habJournalCompleted: false, habDisciplineScore: 5,
          pmrTradedPlan: 'None', pmrDifficultMoment: '', pmrDailyLesson: '',

          // Other optional fields with defaults
          prepScreenshots: [],
          openType: 'None', 
          ibWidth: 'Normal', 
          rangeExtension: 'None',
          htfMs: 'Bullish',
          trendYesterday: false,
          gkFocusError: 'None'
        });
      }
    }
  }, [isOpen, date, dailyPreps]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
    // Ensure we preserve existing data that might not be in the form (safety merge)
    const existing = dailyPreps[date] || {};
    onSave(date, { ...existing, ...formData });
    onClose();
  };

  const inputClass = "bg-[#0f172a] border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all cursor-pointer";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";
  const sectionTitleClass = "font-black text-[11px] uppercase tracking-[0.2em] flex items-center mb-6";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[24px] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#060b13] z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-black flex items-center tracking-tight uppercase text-white">
               <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3">
                  <i className="fas fa-check-double text-xs"></i>
               </div>
               DAY WRAP UP: REVIEW & HABITS
            </h2>
            <p className="text-[10px] text-slate-500 font-bold ml-11 mt-1 uppercase tracking-widest">Sesiunea din {date}</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar bg-[#060b13]">
          
          {/* TOXIC WINS ALERT */}
          {toxicTrades.length > 0 && (
              <div className="bg-red-600/10 border-2 border-red-500 p-6 rounded-[2rem] animate-pulse">
                  <div className="flex items-center space-x-4 mb-3">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                          <i className="fas fa-skull"></i>
                      </div>
                      <h3 className="text-xl font-black text-red-500 uppercase tracking-tighter">TOXIC WIN DETECTED</h3>
                  </div>
                  <p className="text-sm text-slate-300 font-bold mb-4">
                      Ai {toxicTrades.length} tranzacții profitabile în care ai încălcat regula Stop-Loss (Risk Integrity = 0).
                  </p>
                  <div className="bg-black/40 p-4 rounded-xl border border-red-500/30">
                      <p className="text-[10px] text-red-400 font-black uppercase tracking-widest leading-relaxed">
                          "ACEST REZULTAT ESTE RODUL NOROCULUI, NU AL PROCESULUI. 
                          NU VA FI SALVAT ÎN PLAYBOOK PENTRU A NU POLUA BAZA DE DATE CU MODELE GREȘITE."
                      </p>
                  </div>
              </div>
          )}

          <section className="bg-slate-900/40 p-8 rounded-[32px] border border-slate-800">
             <h3 className={`${sectionTitleClass} text-emerald-400`}>
                <span className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center mr-4 text-[10px] text-emerald-400 font-black">3</span>
                TRACKER-UL DE OBICEIURI ZILNICE (HABIT TRACKER)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: 'Respectat "No-Go" Rule?', key: 'habNoGoRespected' },
                    { label: 'Analiză Pre-Market completă?', key: 'habPreMarketDone' },
                    { label: 'Zero erori Stop Loss?', key: 'habStopLossRespected' },
                    { label: 'Fără Revenge Trading?', key: 'habNoRevengeTrading' },
                    { label: 'Jurnal completat (Trade Review)?', key: 'habJournalCompleted' }
                ].map(habit => (
                    <label key={habit.key} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all">
                        <span className="text-xs font-bold text-slate-300">{habit.label}</span>
                        <input 
                          type="checkbox" 
                          checked={(formData as any)[habit.key]} 
                          onChange={e => setFormData({...formData, [habit.key]: e.target.checked})} 
                          className="w-6 h-6 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500" 
                        />
                    </label>
                ))}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between col-span-1 md:col-span-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">DISCIPLINĂ GLOBALĂ ZI (1-10)</span>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" min="1" max="10" 
                        value={formData.habDisciplineScore} 
                        onChange={e => setFormData({...formData, habDisciplineScore: parseInt(e.target.value)})} 
                        className="w-48 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                      />
                      <span className="text-xl font-black text-emerald-500 w-8 text-center">{formData.habDisciplineScore}</span>
                    </div>
                </div>
             </div>
          </section>

          <section className="bg-slate-900/60 p-8 rounded-[32px] border border-slate-800 shadow-xl">
             <h3 className={`${sectionTitleClass} text-blue-400`}>
                <span className="w-7 h-7 rounded-lg bg-blue-400/10 flex items-center justify-center mr-4 text-[10px] text-blue-400 font-black">4</span>
                RITUALUL DE ÎNCHIDERE (POST-MARKET REVIEW)
             </h3>
             <div className="space-y-8">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <label className="text-xs font-black text-slate-400 uppercase mb-4 block tracking-widest">Am tranzacționat conform planului meu azi?</label>
                    <div className="flex space-x-4">
                        <button onClick={() => setFormData({...formData, pmrTradedPlan: 'DA'})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all border ${formData.pmrTradedPlan === 'DA' ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/20' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>DA</button>
                        <button onClick={() => setFormData({...formData, pmrTradedPlan: 'NU'})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all border ${formData.pmrTradedPlan === 'NU' ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-green-600/20' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>NU</button>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>IDENTIFICAREA TRIGGER-ULUI (CEL MAI DIFICIL MOMENT)</label>
                    <textarea 
                      value={formData.pmrDifficultMoment} 
                      onChange={e => setFormData({...formData, pmrDifficultMoment: e.target.value})} 
                      className={`${inputClass} h-28 resize-none`} 
                      placeholder="Ce te-a scos din zonă sau ce a fost greu de gestionat?" 
                    />
                </div>
                <div>
                    <label className={labelClass}>LECȚIA ZILEI (ACȚIUNEA PENTRU MÂINE)</label>
                    <textarea 
                      value={formData.pmrDailyLesson} 
                      onChange={e => setFormData({...formData, pmrDailyLesson: e.target.value})} 
                      className={`${inputClass} h-28 resize-none`} 
                      placeholder="Ce lecție iei din ziua de azi și cum o aplici mâine?" 
                    />
                </div>
             </div>
          </section>

          <div className="pt-4 flex space-x-4 sticky bottom-0 bg-[#060b13] pb-4 z-10 border-t border-slate-800/50 mt-10">
            <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]">Anulează</button>
            <button onClick={handleSave} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-[10px]">Finalizează Ziua (Wrap Up)</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayWrapUpModal;
