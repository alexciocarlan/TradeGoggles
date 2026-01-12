
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trade, Playbook, DailyPrepData, TradeScreenshot, ExecutionErrorType, CorrectionPlanType, MentalStateType, Account } from '../types';
import { INSTRUMENT_MULTIPLIERS, calculateTiltRisk } from '../ProtocolEngine';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { ALL_SETUPS } from '../data/setups';

interface NewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  onDelete?: (id: string) => void;
  initialTrade?: Trade;
  currentAccountId?: string;
}

const EXECUTION_CORRECTION_MATRIX: Record<ExecutionErrorType, CorrectionPlanType> = {
    '1. FOMO / Chasing': 'The Retest Rule: Only enter at limit orders. There is always another bus.',
    '2. Hesitation (Analysis Paralysis)': 'Douglas Probabilistic Thinking: Use Market Order at trigger. Result is irrelevant.',
    '3. Premature Exit (Paper Hands)': 'Set and Forget / Active Management: Use bracket order (ATM). Do not touch.',
    '4. Stop-Loss Sabotage (Moving SL to BE)': 'Cost of Doing Business: SL is an expense. Limit BE only after 1:1 or structure break.',
    '5. Averaging Down (The Loser\'s Move)': 'Hard System Stop: Close 50% of position instead of adding. Best losers win.',
    '6. Revenge Trading': 'The Circuit Breaker: Walk away 30 mins after 2 losses. Mandatory movement.',
    '7. Over-Leveraging (Size Error)': 'Fixed Fractional Risk: Limit X% per trade. Size down until you feel bored.',
    '8. Impulse/Boredom Trading': 'The Entry Checklist: Physically check 3-5 criteria. No checklist, no trade.',
    '9. Target Greed': 'Automatic Limit Orders: Close 80% at automated target. Small runner only.',
    'None': 'None'
};

const GradeCard = ({ risk, active, icon, letter, colorClass }: any) => (
  <div className={`flex-1 p-8 rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden flex flex-col justify-center min-h-[160px] ${
      active 
      ? `${colorClass.bg} ${colorClass.border} ${colorClass.shadow}` 
      : 'bg-slate-900/10 border-slate-800/40 opacity-40'
    }`}
  >
    <div className="relative z-10">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${active ? `${colorClass.iconBg} text-white shadow-lg` : 'bg-slate-800 text-slate-600'}`}>
            <i className={`fas ${icon} text-xs`}></i>
        </div>
        <p className={`text-sm font-black uppercase tracking-[0.2em] mb-1 ${active ? 'text-white' : 'text-slate-500'}`}>SETUP {letter}</p>
        <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${active ? colorClass.text : 'text-slate-600'}`}>{risk} RISK ALLOCATION</p>
    </div>
    <span className={`absolute -bottom-6 -right-6 text-[120px] font-black italic transition-all duration-700 pointer-events-none ${active ? 'text-white opacity-[0.08] scale-110' : 'text-white opacity-[0.02]'}`}>{letter}</span>
    {active && <i className={`fas fa-check-circle absolute top-8 right-8 text-sm ${colorClass.text} shadow-sm`}></i>}
  </div>
);

export const NewTradeModal: React.FC<NewTradeModalProps> = ({ isOpen, onClose, onSave, onDelete, initialTrade, currentAccountId }) => {
  const { accounts, playbooks, trades, dailyPreps, loadDailyPreps, loadPlaybooks } = useAppStore(useShallow(state => ({
    accounts: state.accounts || [],
    playbooks: state.playbooks || [],
    trades: state.trades || [],
    dailyPreps: state.dailyPreps || {},
    loadDailyPreps: state.loadDailyPreps,
    loadPlaybooks: state.loadPlaybooks,
  })));

  const [formData, setFormData] = useState<Partial<Trade>>({
    notes: '',
    screenshots: [],
    condition1Met: false,
    condition2Met: false,
    condition3Met: false,
    pnlNet: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeAccount = useMemo(() => {
    return accounts.find(a => a.id === formData.accountId) || accounts[0];
  }, [accounts, formData.accountId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrep = dailyPreps[todayStr];
  const todayTrades = trades.filter(t => t.date === todayStr);
  const tiltRisk = useMemo(() => calculateTiltRisk(todayTrades, activeAccount, todayPrep), [todayTrades, activeAccount, todayPrep]);

  const getRiskProfile = (account?: Account) => {
    if (!account?.riskSettings) return { lots: 1, slPts: 25, tpPts: 50 };
    const r = account.riskSettings;
    const inst = (INSTRUMENT_MULTIPLIERS as any)[r.preferredInstrument || 'MNQ'] || 2;
    const riskPerTrade = Math.round(r.maxDailyRisk / (r.maxTradesPerDay || 1));
    
    let lots = 1;
    let slPts = 25;
    
    if (r.calcMode === 'fixedContracts') {
        lots = r.maxContractsPerTrade || 1;
        slPts = riskPerTrade / (lots * inst);
    } else {
        slPts = r.fixedSlPoints || 25;
        lots = Math.floor(riskPerTrade / (slPts * inst)) || 1;
    }

    const tpPts = r.targetMode === 'fixedRR' ? slPts * (r.rrRatio || 2) : (r.fixedTargetPoints || 50);
    
    return { lots, slPts, tpPts };
  };

  const currentSetupCriteria = useMemo(() => {
    if (!formData.setup || formData.setup === 'None') return [];
    const match = formData.setup.match(/^(\d+)\./);
    const numericId = match ? parseInt(match[1]) : null;
    const amtSetup = ALL_SETUPS.find(s => s.id === numericId || s.name.toLowerCase() === formData.setup?.toLowerCase());
    if (amtSetup) return amtSetup.criteria;
    const pb = playbooks.find(p => p.name === formData.setup);
    return pb?.entryCriteria?.map(c => c.text) || [];
  }, [formData.setup, playbooks]);

  useEffect(() => {
    if (isOpen) {
      loadDailyPreps();
      loadPlaybooks();
      if (initialTrade) setFormData({ ...initialTrade });
      else {
        // Determinăm contul inițial (evităm valoarea 'all')
        const initialAcc = accounts.find(a => a.id === currentAccountId) || accounts[0];
        const profile = getRiskProfile(initialAcc);
        
        setFormData({
          id: Math.random().toString(36).substr(2, 9),
          accountId: initialAcc?.id || '',
          isChallenge: initialAcc?.type === 'Apex',
          date: todayStr,
          instrument: initialAcc?.riskSettings?.preferredInstrument || 'MNQ',
          session: 'NY Morning',
          bias: 'Neutral',
          dailyNarrative: '',
          durationMinutes: 0,
          entryTime: '',
          exitTime: '',
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
          hypoSession: 'NY Morning',
          hypoThen: 'None',
          zoneOfInterest: '',
          continuationTrigger: '',
          reversalTrigger: '',
          invalidationPoint: '',
          exitLevel: '',
          openType: 'None',
          ibWidth: 'Normal',
          rangeExtension: 'None',
          htfMs: 'Bullish',
          newsImpact: 'None',
          setup: 'None',
          setupGrade: 'None',
          type: 'LONG',
          entryPrice: 0,
          stopLoss: 0,
          slHit: false,
          takeProfit: 0,
          contracts: profile.lots,
          exitPrice: 0,
          pnlBrut: 0,
          commissions: 0,
          pnlNet: 0,
          rrRealized: 0,
          status: 'WIN',
          disciplineScore: 5,
          executionError: 'None',
          correctionPlan: 'None',
          mentalState: 'Calm',
          screenshots: [],
          notes: '',
          tags: [],
          isPartOfPlan: false,
          isAccordingToPlan: 'None',
          condition1Met: false,
          condition2Met: false,
          condition3Met: false,
        });
      }
    }
  }, [isOpen, initialTrade, todayStr, currentAccountId, accounts]);

  useEffect(() => {
    if (initialTrade || !formData.entryPrice || formData.entryPrice === 0 || !formData.type) return;

    const profile = getRiskProfile(activeAccount);
    const isLong = formData.type === 'LONG';
    const autoSl = isLong ? formData.entryPrice - profile.slPts : formData.entryPrice + profile.slPts;
    const autoTp = isLong ? formData.entryPrice + profile.tpPts : formData.entryPrice - profile.tpPts;

    setFormData(prev => ({
        ...prev,
        contracts: profile.lots,
        stopLoss: parseFloat(autoSl.toFixed(2)),
        takeProfit: parseFloat(autoTp.toFixed(2)),
        exitPrice: parseFloat(autoTp.toFixed(2))
    }));
  }, [formData.entryPrice, formData.type, activeAccount]);

  useEffect(() => {
    const metCount = [formData.condition1Met, formData.condition2Met, formData.condition3Met].filter(Boolean).length;
    let autoGrade: any = 'None';
    if (metCount === 3) autoGrade = 'A+';
    else if (metCount === 2) autoGrade = 'B';
    else if (metCount === 1) autoGrade = 'C';
    if (formData.setupGrade !== autoGrade) setFormData(prev => ({ ...prev, setupGrade: autoGrade }));
  }, [formData.condition1Met, formData.condition2Met, formData.condition3Met]);

  const handleSlHitChange = (isHit: boolean) => {
    setFormData(prev => ({
      ...prev,
      slHit: isHit,
    }));
  };

  useEffect(() => {
    if (formData.slHit) {
      setFormData(prev => ({ ...prev, exitPrice: prev.stopLoss }));
    }
  }, [formData.slHit, formData.stopLoss]);

  useEffect(() => {
    if (formData.entryPrice !== undefined && formData.exitPrice !== undefined && formData.contracts) {
      const mult = (INSTRUMENT_MULTIPLIERS as any)[formData.instrument || 'NQ'] || 20;
      const isLong = formData.type === 'LONG';
      const gross = isLong ? (formData.exitPrice - formData.entryPrice) * formData.contracts * mult : (formData.entryPrice - formData.exitPrice) * formData.contracts * mult;
      const comms = (formData.contracts * (activeAccount?.riskSettings?.commPerContract || 2.40) * 2);
      const net = gross - comms;
      let rr = 0;
      const risk = Math.abs((formData.stopLoss !== undefined && formData.entryPrice !== undefined) ? (formData.entryPrice - formData.stopLoss) : 0);
      if (risk > 0) rr = (isLong ? (formData.exitPrice - formData.entryPrice) : (formData.entryPrice - formData.exitPrice)) / risk;
      setFormData(prev => ({ ...prev, pnlNet: parseFloat(net.toFixed(2)), rrRealized: parseFloat(rr.toFixed(2)), pnlBrut: parseFloat(gross.toFixed(2)), commissions: parseFloat(comms.toFixed(2)), status: net >= 0 ? 'WIN' : 'LOSS' }));
    }
  }, [formData.entryPrice, formData.exitPrice, formData.stopLoss, formData.contracts, formData.type, formData.instrument, activeAccount]);

  const handleSetupChange = (setupName: string) => {
    setFormData(prev => ({
        ...prev,
        setup: setupName,
        condition1Met: false,
        condition2Met: false,
        condition3Met: false
    }));
  };

  const handleAccountChange = (accId: string) => {
    const selectedAcc = accounts.find(a => a.id === accId);
    if (!selectedAcc) return;

    const profile = getRiskProfile(selectedAcc);
    setFormData(prev => ({
        ...prev,
        accountId: accId,
        isChallenge: selectedAcc.type === 'Apex',
        contracts: profile.lots,
        // Resetăm prețurile dacă schimbăm contul pentru a aplica noile reguli de SL/TP din noul profil
        stopLoss: prev.entryPrice && prev.entryPrice > 0 ? (prev.type === 'LONG' ? prev.entryPrice - profile.slPts : prev.entryPrice + profile.slPts) : prev.stopLoss,
        takeProfit: prev.entryPrice && prev.entryPrice > 0 ? (prev.type === 'LONG' ? prev.entryPrice + profile.tpPts : prev.entryPrice - profile.tpPts) : prev.takeProfit
    }));
  };

  const handleExecutionErrorChange = (error: ExecutionErrorType) => {
      const autoCorrection = EXECUTION_CORRECTION_MATRIX[error];
      setFormData(prev => ({
          ...prev,
          executionError: error,
          correctionPlan: autoCorrection
      }));
  };

  const GRADE_COLORS = {
      'A+': { bg: 'bg-emerald-600/10', border: 'border-emerald-500', shadow: 'shadow-[0_0_60px_rgba(16,185,129,0.25)]', text: 'text-emerald-400', iconBg: 'bg-emerald-600' },
      'B': { bg: 'bg-blue-600/10', border: 'border-blue-500', shadow: 'shadow-[0_0_60px_rgba(59,130,246,0.25)]', text: 'text-blue-400', iconBg: 'bg-blue-600' },
      'C': { bg: 'bg-orange-600/10', border: 'border-orange-500', shadow: 'shadow-[0_0_60px_rgba(249,115,22,0.25)]', text: 'text-orange-400', iconBg: 'bg-orange-600' }
  };

  const inputClass = "w-full bg-[#0d121f] border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:ring-1 focus:ring-blue-500 transition-all";
  const labelClass = "text-[8px] font-black text-slate-600 uppercase mb-2 block tracking-[0.2em]";

  if (!isOpen || !formData.id) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl overflow-y-auto">
      <div className="bg-[#03070c] border border-slate-800/60 rounded-[3.5rem] w-full max-w-[1000px] max-h-[96vh] shadow-[0_0_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        <div className="px-10 py-8 border-b border-slate-800/40 flex justify-between items-center bg-[#060b13] shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xl">
                <i className="fas fa-chart-line text-xl"></i>
            </div>
            <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">ÎNREGISTREAZĂ TRADE NOU</h2>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">MP PROTOCOL ENGINE V4.0</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center bg-slate-900/40 border border-slate-800 px-6 py-3 rounded-full space-x-8">
             <div className="flex flex-col">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">TILT METER INTELLIGENCE</span>
                <span className={`text-[10px] font-black uppercase italic ${tiltRisk.color}`}>SYSTEM {tiltRisk.label}</span>
             </div>
             <p className="text-2xl font-black text-white italic leading-none">{tiltRisk.score}%</p>
             <div className="flex flex-col items-end border-l border-slate-800 pl-6">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">BIOMETRIC STATUS</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase">CORTEX PREFRONTAL ACTIV.</span>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-2 transition-colors"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 bg-[#03070c]">
          
          <section className="bg-slate-900/10 border border-slate-800/60 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl">
             <div className="flex items-center space-x-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20"><i className="fas fa-shield-check"></i></div>
                <div>
                   <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">VALIDARE DISCIPLINĂ</h4>
                   <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">ACEST TRADE RESPECTĂ PLANUL TĂU INIȚIAL?</p>
                </div>
             </div>
             <select value={formData.isAccordingToPlan} onChange={e => setFormData({...formData, isAccordingToPlan: e.target.value as any})} className="bg-black border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase w-72">
                <option value="None">ALEGE OPȚIUNE...</option>
                <option value="DA">DA - CONFORM PLANULUI</option>
                <option value="NU">NU - ÎNCĂLCARE REGULI</option>
             </select>
          </section>

          <section className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div><label className={labelClass}>DATA</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>INSTRUMENT</label><select value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})} className={inputClass}><option value="MNQ">MNQ</option><option value="NQ">NQ</option><option value="MES">MES</option><option value="ES">ES</option><option value="BTCUSDT">BTCUSDT</option></select></div>
                <div>
                  <label className={labelClass}>SESIUNE</label>
                  <select 
                    value={formData.session} 
                    onChange={e => setFormData({...formData, session: e.target.value as any})} 
                    className={inputClass}
                  >
                    <option value="NY Morning">NY Morning</option>
                    <option value="NY Afternoon">NY Afternoon</option>
                    <option value="London">London</option>
                    <option value="Asia">Asia</option>
                  </select>
                </div>
                <div>
                    <label className={labelClass}>CONT</label>
                    <select 
                        value={formData.accountId} 
                        onChange={e => handleAccountChange(e.target.value)} 
                        className={inputClass}
                    >
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
             </div>
          </section>

          <section className="bg-[#0b1222]/40 border border-slate-800/60 p-10 rounded-[3.5rem] shadow-xl">
             <div className="mb-8">
                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">SETUP GRADE & CONVICTION</h4>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">VALIDAREA OPORTUNITĂȚII BAZATĂ PE CRITERIILE PLAYBOOK-ULUI</p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                <div>
                   <label className={labelClass}>SETUP EXECUTAT</label>
                   <select 
                    value={formData.setup} 
                    onChange={e => handleSetupChange(e.target.value)} 
                    className="w-full bg-[#0d121f] border border-slate-800 rounded-xl px-4 py-3 text-[11px] font-black text-white uppercase"
                   >
                      <option value="None">Alege Setup...</option>
                      {playbooks.map(pb => <option key={pb.id} value={pb.name}>{pb.name}</option>)}
                   </select>
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} onClick={() => setFormData({...formData, [`condition${i}Met`]: !(formData as any)[`condition${i}Met` ]})} className={`bg-[#0d121f] border border-slate-800 rounded-2xl p-5 flex items-center space-x-4 cursor-pointer transition-all ${ (formData as any)[`condition${i}Met`] ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'opacity-40 hover:opacity-100'}`}>
                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 ${ (formData as any)[`condition${i}Met`] ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-slate-800 group-hover:border-slate-600'}`}>
                            { (formData as any)[`condition${i}Met`] && <i className="fas fa-check text-[8px]"></i>}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[7px] font-black uppercase text-slate-500 mb-0.5">CONDIȚIA {i}</p>
                            <p className="text-[9px] font-black uppercase text-white truncate italic tracking-tight">
                              {currentSetupCriteria[i-1] || 'NESPECIFICAT'}
                            </p>
                        </div>
                    </div>
                ))}
             </div>

             <div className="flex flex-col md:flex-row gap-6">
                <GradeCard risk="100%" active={formData.setupGrade === 'A+'} icon="fa-rocket" letter="A+" colorClass={GRADE_COLORS['A+']} />
                <GradeCard risk="50%" active={formData.setupGrade === 'B'} icon="fa-bullseye" letter="B" colorClass={GRADE_COLORS['B']} />
                <GradeCard risk="25%" active={formData.setupGrade === 'C'} icon="fa-triangle-exclamation" letter="C" colorClass={GRADE_COLORS['C']} />
             </div>
          </section>

          <section className="space-y-10">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center"><i className="fas fa-bolt mr-3 text-yellow-500"></i> EXECUȚIE TEHNICĂ</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClass}>SIDE</label>
                    <div className="flex bg-[#0d121f] border border-slate-800 p-1 rounded-xl">
                        <button type="button" onClick={() => setFormData({...formData, type: 'LONG'})} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${formData.type === 'LONG' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600'}`}>LONG</button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'SHORT'})} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${formData.type === 'SHORT' ? 'bg-slate-700 text-white' : 'text-slate-600'}`}>SHORT</button>
                    </div>
                </div>
                <div><label className={labelClass}>CONTRACTS</label><input type="number" value={formData.contracts || 0} onChange={e => setFormData({...formData, contracts: parseInt(e.target.value)})} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>SL HIT?</label>
                  <div className="flex bg-[#0d121f] border border-slate-800 p-1 rounded-xl h-[52px] items-stretch">
                      <button type="button" onClick={() => handleSlHitChange(true)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${formData.slHit === true ? 'bg-red-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-800'}`}>DA</button>
                      <button type="button" onClick={() => handleSlHitChange(false)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${formData.slHit === false || formData.slHit === undefined ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-800'}`}>NU</button>
                  </div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div><label className={labelClass}>ENTRY PRICE</label><input type="number" step="0.25" value={formData.entryPrice || 0} onChange={e => setFormData({...formData, entryPrice: parseFloat(e.target.value)})} className={inputClass} /></div>
                <div><label className={labelClass}>STOP LOSS</label><input type="number" step="0.25" value={formData.stopLoss || 0} onChange={e => setFormData({...formData, stopLoss: parseFloat(e.target.value)})} className={inputClass} /></div>
                <div><label className={labelClass}>TAKE PROFIT</label><input type="number" step="0.25" value={formData.takeProfit || 0} onChange={e => setFormData({...formData, takeProfit: parseFloat(e.target.value)})} className={inputClass} /></div>
                <div><label className={labelClass}>EXIT PRICE</label><input type="number" step="0.25" value={formData.exitPrice || 0} onChange={e => setFormData({...formData, exitPrice: parseFloat(e.target.value)})} className={inputClass} disabled={formData.slHit} /></div>
             </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelClass}>ENTRY TIME</label><input type="time" value={formData.entryTime || ''} onChange={e => setFormData({...formData, entryTime: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>EXIT TIME</label><input type="time" value={formData.exitTime || ''} onChange={e => setFormData({...formData, exitTime: e.target.value})} className={inputClass} /></div>
              </div>

             <div className="bg-[#0b1222] border border-slate-800 rounded-[3rem] p-10 flex divide-x divide-slate-800/40 shadow-2xl">
                <div className="flex-1 text-center pr-4">
                    <p className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">PNL NET CALCULAT</p>
                    <p className={`text-6xl font-black italic tracking-tighter ${ (formData.pnlNet || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        { (formData.pnlNet || 0) >= 0 ? '+' : '-'}${Math.abs(formData.pnlNet || 0).toLocaleString()}
                    </p>
                </div>
                <div className="flex-1 text-center pl-4">
                    <p className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">R:R REALIZAT</p>
                    <p className="text-6xl font-black text-blue-500 italic tracking-tighter">1:{(formData.rrRealized || 0).toFixed(2)}</p>
                </div>
             </div>
          </section>

          {/* PSIHOLOGIE & FEEDBACK */}
          <section className="bg-[#0b1222]/20 border border-slate-800 p-10 rounded-[3.5rem] space-y-10">
             <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] flex items-center"><i className="fas fa-brain mr-3"></i> PSIHOLOGIE & FEEDBACK</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <label className={labelClass}>DISCIPLINE SCORE (1-5)</label>
                    <div className="flex items-center space-x-2 mt-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <i key={s} onClick={() => setFormData({...formData, disciplineScore: s})} className={`fas fa-star text-lg cursor-pointer transition-all ${s <= (formData.disciplineScore || 0) ? 'text-yellow-500 scale-110 shadow-lg' : 'text-slate-800 hover:text-slate-600'}`}></i>
                        ))}
                    </div>
                </div>
                <div>
                    <label className={labelClass}>EROARE EXECUȚIE</label>
                    <select 
                        value={formData.executionError} 
                        onChange={e => handleExecutionErrorChange(e.target.value as ExecutionErrorType)} 
                        className={inputClass}
                    >
                        <option value="None">None</option>
                        <option value="1. FOMO / Chasing">1. FOMO / Chasing</option>
                        <option value="2. Hesitation (Analysis Paralysis)">2. Hesitation (Analysis Paralysis)</option>
                        <option value="3. Premature Exit (Paper Hands)">3. Premature Exit (Paper Hands)</option>
                        <option value="4. Stop-Loss Sabotage (Moving SL to BE)">4. Stop-Loss Sabotage (Moving SL to BE)</option>
                        <option value="5. Averaging Down (The Loser's Move)">5. Averaging Down (The Loser's Move)</option>
                        <option value="6. Revenge Trading">6. Revenge Trading</option>
                        <option value="7. Over-Leveraging (Size Error)">7. Over-Leveraging (Size Error)</option>
                        <option value="8. Impulse/Boredom Trading">8. Impulse/Boredom Trading</option>
                        <option value="9. Target Greed">9. Target Greed</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>PLAN DE CORECȚIE</label>
                    <select 
                        value={formData.correctionPlan} 
                        onChange={e => setFormData({...formData, correctionPlan: e.target.value as CorrectionPlanType})} 
                        className={inputClass}
                    >
                        <option value="None">None</option>
                        <option value="The Retest Rule: Only enter at limit orders. There is always another bus.">The Retest Rule (FOMO)</option>
                        <option value="Douglas Probabilistic Thinking: Use Market Order at trigger. Result is irrelevant.">Douglas Mindset (Hesitation)</option>
                        <option value="Set and Forget / Active Management: Use bracket order (ATM). Do not touch.">Set & Forget (Paper Hands)</option>
                        <option value="Cost of Doing Business: SL is an expense. Limit BE only after 1:1 or structure break.">Cost of Biz (Stop Sabotage)</option>
                        <option value="Hard System Stop: Close 50% of position instead of adding. Best losers win.">Hard Stop (Averaging Down)</option>
                        <option value="The Circuit Breaker: Walk away 30 mins after 2 losses. Mandatory movement.">Circuit Breaker (Revenge)</option>
                        <option value="Fixed Fractional Risk: Limit X% per trade. Size down until you feel bored.">Fractional Risk (Size Error)</option>
                        <option value="The Entry Checklist: Physically check 3-5 criteria. No checklist, no trade.">Entry Checklist (Impulse)</option>
                        <option value="Automatic Limit Orders: Close 80% at automated target. Small runner only.">Auto Limit (Target Greed)</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>STARE MENTALĂ</label>
                    <select value={formData.mentalState} onChange={e => setFormData({...formData, mentalState: e.target.value as any})} className={inputClass}>
                        <option value="Calm">Calm</option>
                        <option value="Anxious">Anxious</option>
                        <option value="Excited">Excited</option>
                    </select>
                </div>
             </div>
          </section>

          <section className="space-y-8">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center"><i className="fas fa-camera mr-3 text-blue-500"></i> NOTE ȘI CAPTURI ECRAN</h3>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">NOTE POST-MORTEM</label>
                        <span className={`text-[8px] font-black uppercase ${(formData.notes?.length || 0) >= 10 ? 'text-emerald-500' : 'text-slate-600'}`}>{(formData.notes?.length || 0)} / 10 CHARACTERS</span>
                    </div>
                    <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Descrie execuția, ce ai simțit și ce ai învățat din acest trade..." className="w-full bg-[#0d121f] border border-slate-800 rounded-[2rem] p-8 text-slate-300 italic text-sm h-56 resize-none outline-none focus:ring-1 focus:ring-blue-500 shadow-inner" />
                    <p className="text-[8px] text-slate-700 italic px-2">Răspunsul trebuie să aibă minim 10 caractere pentru a fi considerat finalizat review-ul trade-ului.</p>
                </div>
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SCREENSHOTS (MAX 5)</label>
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-[2.5rem] bg-slate-900/10 flex flex-col items-center justify-center cursor-pointer transition-all group">
                        <i className="fas fa-camera text-xl text-slate-700 group-hover:text-blue-500 mb-3"></i>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">ADAUGĂ POZĂ</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                    </div>
                </div>
             </div>
          </section>
        </div>

        <div className="px-10 py-8 border-t border-slate-800/60 bg-black/60 flex space-x-6 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 bg-transparent border border-slate-800 hover:bg-slate-900 text-slate-600 font-black py-5 rounded-2xl uppercase tracking-[0.4em] text-[11px]">ANULEAZĂ</button>
          <button type="button" onClick={() => { onSave(formData as Trade); onClose(); }} className="flex-[3] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl uppercase tracking-[0.4em] text-[12px]">SALVEAZĂ TRADE</button>
        </div>
      </div>
    </div>
  );
};
