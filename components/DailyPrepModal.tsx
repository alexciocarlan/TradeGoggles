import React, { useState, useEffect, useMemo } from 'react';
import { DailyPrepData } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { ALL_SETUPS } from '../data/setups';

interface DailyPrepModalProps {
  isOpen: boolean; 
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
}

const StatusIndicator = ({ icon, label, value, colorClass = "text-blue-500" }: any) => (
  <div className="bg-[#0b1222]/60 border border-slate-800/60 p-4 rounded-2xl flex items-center space-x-4 min-w-[180px] group hover:border-slate-700 transition-all">
    <div className={`w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center ${colorClass}`}>
      <i className={`fas ${icon} text-[10px]`}></i>
    </div>
    <div>
      <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-[10px] font-black uppercase tracking-tight ${colorClass}`}>{value || 'UNDEFINED'}</p>
    </div>
  </div>
);

const DailyPrepModal: React.FC<DailyPrepModalProps> = ({ isOpen, onSave, onClose, initialData, initialDate }) => {
  const selectedDate = useMemo(() => initialDate || new Date().toISOString().split('T')[0], [initialDate]);
  
  // OPTIMIZATION: Using useShallow for better re-render control
  const { playbooks, weeklyPreps, trades } = useAppStore(useShallow(state => ({ 
    playbooks: state.playbooks || [], 
    weeklyPreps: state.weeklyPreps || {},
    trades: state.trades || []
  })));

  const [formData, setFormData] = useState<DailyPrepData>(initialData || {
    gkPhysicalEnergy: 7, gkMentalClarity: 7, gkEmotionalCalm: 7, gkProcessConfidence: 7,
    gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
    gkHRVValue: 45, gkHRVBaseline: 45,
    gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
    gkUncertaintyAccepted: false, gkStopLossExecution: false, gkNoAddingToLoss: false, gkRiskCalmness: false, 
    gkDailyRiskAmount: 0,
    gkTotalScore: 0, gkVerdict: 'None', instrument: 'NQ', pdValueRelationship: 'None', 
    marketCondition: 'None', priceVsPWeek: 'None', mediumTermTrend: 'None',
    onRangeVsPDay: 'None', onInventory: 'None', pdExtremes: 'None', untestedPdVA: 'None',
    spHigh: '', spLow: '', gapHigh: '', gapLow: '', priorVPOC: 'None', onVsSettlement: 'None',
    newsImpact: 'None', bias: 'Neutral', dailyNarrative: '', setup: 'None', setupGrade: 'None',
    hypoSession: 'NY Morning', hypoThen: 'None', zoneOfInterest: '', continuationTrigger: '', 
    reversalTrigger: '', invalidationPoint: '', exitLevel: '',
    setup2: 'None', hypoSession2: 'NY Morning', hypoThen2: 'None', zoneOfInterest2: '', 
    continuationTrigger2: '', reversalTrigger2: '', invalidationPoint2: '', exitLevel2: '',
    habNoGoRespected: false, habPreMarketDone: false, habStopLossRespected: false,
    habNoRevengeTrading: false, habJournalCompleted: false, habDisciplineScore: 5,
    pmrTradedPlan: 'None', pmrDifficultMoment: '', pmrDailyLesson: '', prepScreenshots: [],
    openType: 'None', ibWidth: 'Normal', rangeExtension: 'None', htfMs: 'Bullish',
    trendYesterday: false, gkFocusError: 'None'
  } as DailyPrepData);

  useEffect(() => { 
    if (initialData) {
        setFormData(initialData); 
    }
  }, [initialData, isOpen]);

  const weekId = useMemo(() => {
    const d = new Date(selectedDate);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }, [selectedDate]);

  const currentWeekPrep = weeklyPreps[weekId];

  // --- ARBITRAGE ENGINE (AMT LOGIC V4.5 - AUDIT COMPLIANT) ---
  const arbitrage = useMemo(() => {
    const results: { setups: any[], protocol: string[], veto: boolean, vetoReason: string } = {
      setups: [],
      protocol: [],
      veto: (formData.gkTotalScore < 50 && formData.gkTotalScore > 0),
      vetoReason: 'Biometric score failure.'
    };

    const criticalError = (trades || []).slice(0, 5).some(t => t.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)');
    if (criticalError) {
        results.veto = true;
        results.vetoReason = 'SYSTEM LOCKDOWN: Recent Stop-Loss rejection detected. Trading blocked.';
    }

    const dayOfWeek = new Date(selectedDate).getDay();

    if (formData.pdValueRelationship === 'GAP') {
      if (formData.openType === 'Drive' || formData.openType === 'Test driver') {
        results.protocol.push("REGIME: AGGRESSIVE INITIATIVE DETECTED. DO NOT FADE.");
        results.setups.push({ id: 'pb-12', name: '#12 GAP & GO', confidence: 'HIGH', color: 'text-emerald-400', icon: 'fa-rocket' });
      } else if (formData.openType === 'Rejection- Reversal') {
        results.protocol.push("REGIME: RESPONSIVE SELLING/BUYING DETECTED. LOOK FOR FILL.");
        results.setups.push({ id: 'pb-13', name: '#13 GAP FILL', confidence: 'HIGH', color: 'text-blue-400', icon: 'fa-water' });
      }
    }

    if (formData.pdValueRelationship === 'OutsideVA') {
      results.protocol.push("CONTEXT: OUTSIDE VA. SETUP #4 IS PENDING (WAIT FOR VA RE-ENTRY).");
      results.setups.push({ id: 'pb-4', name: '#4 THE 80% RULE', confidence: 'PENDING', color: 'text-slate-600', icon: 'fa-hourglass' });
    }

    if (dayOfWeek === 4 || dayOfWeek === 5) {
      results.protocol.push("TIME CONTEXT: WEEKLY MAGNET ACTIVE.");
      results.setups.push({ id: 'pb-38', name: '#38 WEEKLY POC MAGNET', confidence: 'MEDIUM', color: 'text-indigo-400', icon: 'fa-magnet' });
    }

    return results;
  }, [formData, selectedDate, trades]);

  const handleSave = () => {
    onSave(selectedDate, formData);
    onClose();
  };

  const labelClass = "text-[9px] font-black text-slate-600 uppercase mb-3 block tracking-widest";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[3rem] w-full max-w-[1050px] max-h-[96vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
        
        <div className="px-10 py-8 border-b border-slate-800/40 flex justify-between items-center bg-[#060b13] shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xl">
                <i className="fas fa-rocket text-xl"></i>
            </div>
            <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">STRATEGY SELECTION</h2>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">DECISION MATRIX V4.5 // {selectedDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-2 transition-colors"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 bg-[#03070c]">
            {arbitrage.veto && (
                <div className="bg-red-600/10 border border-red-500/30 p-6 rounded-[2rem] flex items-center space-x-6 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg"><i className="fas fa-ban"></i></div>
                    <div>
                        <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">PROTOCOL VIOLATION DETECTED</p>
                        <p className="text-sm font-bold text-white uppercase italic">"{arbitrage.vetoReason}"</p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                <StatusIndicator icon="fa-heart-pulse" label="GK SCORE" value={`${formData.gkTotalScore}/100`} colorClass={formData.gkVerdict === 'Green' ? 'text-emerald-500' : 'text-orange-500'} />
                <StatusIndicator icon="fa-anchor" label="WEEKLY BIAS" value={currentWeekPrep?.weeklyBias} />
                <StatusIndicator icon="fa-filter" label="VALUE REL." value={formData.pdValueRelationship} />
                <StatusIndicator icon="fa-bolt" label="OPEN TYPE" value={formData.openType} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0b1222]/40 border border-slate-800 p-10 rounded-[3rem] shadow-xl">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 flex items-center"><i className="fas fa-microchip mr-3 text-blue-500"></i> AUTOMATED ARBITRAGE VERDICT</h4>
                   <div className="space-y-4">
                      {arbitrage.setups.map((setup, idx) => (
                        <div key={idx} className="p-6 rounded-[2rem] border bg-slate-950/40 border-slate-800 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                            <div className="flex items-center space-x-5">
                                <i className={`fas ${setup.icon} text-xl ${setup.color}`}></i>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tighter">{setup.name}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${setup.color}`}>CONFIDENCE: {setup.confidence}</p>
                                </div>
                            </div>
                            <button onClick={() => setFormData({...formData, setup: setup.name})} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-blue-500 group-hover:bg-blue-600/10 transition-all"><i className="fas fa-plus text-[10px]"></i></button>
                        </div>
                      ))}
                      {arbitrage.setups.length === 0 && (
                          <div className="py-12 text-center opacity-20 italic">
                             <p className="text-[9px] font-black uppercase tracking-widest">No primary setups identified by scanner.</p>
                          </div>
                      )}
                   </div>
                </div>

                <div className="bg-[#0b1222]/40 border border-slate-800 p-10 rounded-[3rem] shadow-xl space-y-8">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center"><i className="fas fa-check-circle mr-3 text-emerald-500"></i> MANUAL SELECTION</h4>
                    <div>
                        <label className="text-[9px] font-black text-slate-600 uppercase mb-3 block tracking-widest">PRIMARY SETUP</label>
                        <select value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-white uppercase outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="None">None</option>
                            {playbooks.map(pb => <option key={pb.id} value={pb.name}>{pb.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>SESSION NARRATIVE</label>
                        <textarea value={formData.dailyNarrative} onChange={e => setFormData({...formData, dailyNarrative: e.target.value})} placeholder="Describe your plan for this session..." className="w-full bg-black border border-slate-800 rounded-2xl p-6 text-slate-300 italic text-sm h-40 resize-none outline-none focus:ring-1 focus:ring-blue-500 shadow-inner" />
                    </div>
                </div>
            </div>
        </div>

        <div className="px-10 py-8 border-t border-slate-800/60 bg-black/60 flex space-x-6 shrink-0">
          <button onClick={onClose} className="flex-1 bg-transparent border border-slate-800 hover:bg-slate-900 text-slate-600 font-black py-5 rounded-2xl uppercase tracking-[0.4em] text-[11px]">CANCEL</button>
          <button 
            onClick={handleSave} 
            disabled={false}
            className="flex-[3] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl uppercase tracking-[0.4em] text-[12px]"
          >
            VALIDATE & START SESSION
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyPrepModal;