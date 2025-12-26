
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trade, TradeType, SessionType, BiasType, NewsImpactType, 
  ExecutionErrorType, CorrectionPlanType, MentalStateType, Account, 
  PdValueRelationship, MarketCondition, MediumTermTrend, 
  ONInventory, OpenType, DailyPrepData, Playbook, TradeScreenshot, SetupGrade
} from '../types';
import { Language, translations } from '../translations';

interface NewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  accounts: Account[];
  playbooks: Playbook[];
  trades: Trade[]; // Am adăugat trades pentru calculul performanței globale
  initialTrade?: Trade;
  currentAccountId?: string;
  dailyPreps: Record<string, DailyPrepData>;
  language: Language;
}

const INSTRUMENT_MULTIPLIERS: Record<string, number> = {
  'MNQ': 2, 'NQ': 20, 'MES': 5, 'ES': 50, 'GC': 100,
};

const COMMISSION_PER_CONTRACT = 2.40;

const ERROR_TO_PLAN: Record<string, string> = {
  'Frica/Ezitarea la Intrare': 'Redu pozitia la 25% din mărimea normală',
  'Atasamentul Emotional de Rezultat': 'Pune 20 trade-uri, indiferent de rezultat',
  'Refuzul de a Pierde (Mutarea Stop-Loss-ului)': 'Foloseste doar Hard Stops',
  'Focus pe Bani (P&L), nu pe Executie': 'Ascunde coloana de P&L din platformă.',
  'Trading Impulsiv (Fără Plan)': 'Executa doar scenariul scris',
  'Încălcarea Edge-ului (Style Drift)': 'Executa doar scenarii A+',
  'Pauza de 15 minute dupa o pierdere': 'Pauza de 15 minute dupa o pierdere',
  'Ai voie sa trade-uiesti dupa ce ai completat jurnalul de ieri': 'Ai voie sa trade-uiesti dupa ce ai completat jurnalul de ieri',
  'Tranzacționezi cu 50% din mărime și max 2 tranzacții': 'Tranzacționezi cu 50% din mărime și max 2 tranzacții',
  'Doar limit orders timp de 1 saptamana': 'Doar limit orders timp de 1 saptamana',
  'None': 'None'
};

const compressImage = (base64Str: string, maxWidth = 1920, quality = 0.9): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const NewTradeModal: React.FC<NewTradeModalProps> = ({ isOpen, onClose, onSave, accounts, playbooks, trades, initialTrade, currentAccountId, dailyPreps, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language].newTrade;

  const [formData, setFormData] = useState<Partial<Trade>>({
    date: new Date().toISOString().split('T')[0],
    instrument: 'MNQ',
    session: 'NY Morning',
    bias: 'Neutral',
    newsImpact: 'None',
    dailyNarrative: '',
    type: 'LONG',
    contracts: 1,
    setupGrade: 'None',
    disciplineScore: 5,
    executionError: 'None',
    mentalState: 'Calm',
    correctionPlan: 'None',
    pnlBrut: 0,
    entryPrice: 0,
    exitPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    accountId: currentAccountId !== 'all' ? currentAccountId : (accounts[0]?.id || ''),
    setup: playbooks[0]?.name || '',
    pdValueRelationship: 'None',
    marketCondition: 'None',
    priceVsPWeek: 'None',
    mediumTermTrend: 'None',
    onRangeVsPDay: 'None',
    onInventory: 'None',
    pdExtremes: 'None',
    untestedPdVA: 'None',
    spHigh: '',
    spLow: '',
    gapHigh: '',
    gapLow: '',
    priorVPOC: 'None',
    onVsSettlement: 'None',
    hypoSession: 'A',
    hypoThen: 'None',
    zoneOfInterest: 'None',
    continuationTrigger: 'None',
    reversalTrigger: 'None',
    invalidationPoint: 'None',
    exitLevel: 'None',
    screenshots: [],
    notes: '',
    isPartOfPlan: true,
    condition1Met: false,
    condition2Met: false,
    condition3Met: false,
  });

  const selectedPlaybook = useMemo(() => {
    return playbooks.find(p => p.name === formData.setup);
  }, [formData.setup, playbooks]);

  const entryCriteria = useMemo(() => {
    return selectedPlaybook?.entryCriteria || [];
  }, [selectedPlaybook]);

  const recommendedGrade = useMemo(() => {
    if (!formData.setup) return null;
    const pbTrades = trades.filter(t => t.setup === formData.setup);
    if (pbTrades.length < 20) return null;

    const wins = pbTrades.filter(t => t.status === 'WIN');
    const losses = pbTrades.filter(t => t.setup === formData.setup && t.status === 'LOSS');
    const winRate = (wins.length / pbTrades.length) * 100;
    const winAmt = wins.reduce((s, t) => s + t.pnlNet, 0);
    const lossAmt = Math.abs(losses.reduce((s, t) => s + t.pnlNet, 0));
    const pf = lossAmt > 0 ? winAmt / lossAmt : (winAmt > 0 ? 99 : 0);

    if (winRate >= 60 && pf >= 1.8) return 'A+';
    if (winRate >= 45 || pf >= 1.2) return 'B';
    return 'C';
  }, [formData.setup, trades]);

  useEffect(() => {
    const metCount = [formData.condition1Met, formData.condition2Met, formData.condition3Met].filter(Boolean).length;
    let autoGrade: SetupGrade = 'None';
    
    if (metCount === 3) autoGrade = 'A+';
    else if (metCount === 2) autoGrade = 'B';
    else if (metCount === 1) autoGrade = 'C';
    else autoGrade = 'None';

    if (autoGrade !== formData.setupGrade) {
      setFormData(prev => ({ ...prev, setupGrade: autoGrade }));
    }
  }, [formData.condition1Met, formData.condition2Met, formData.condition3Met]);

  const handleExecutionErrorChange = (error: ExecutionErrorType) => {
    const suggestedPlan = ERROR_TO_PLAN[error] || 'None';
    setFormData(prev => ({
      ...prev,
      executionError: error,
      correctionPlan: suggestedPlan as CorrectionPlanType
    }));
  };

  const dayPrep = useMemo(() => {
    if (!formData.date) return null;
    return dailyPreps[formData.date] || null;
  }, [formData.date, dailyPreps]);

  const suggestedSetups = useMemo(() => {
    if (!dayPrep) return [];
    const names = new Set<string>();
    
    // 1. Opening Relationship
    if (dayPrep.pdValueRelationship === 'GAP') {
        names.add('The GAP & Go'); names.add('The GAP Fill'); names.add('The Half-Gap Fill');
    } else if (dayPrep.pdValueRelationship === 'OutsideVA') {
        names.add('The 80% Rule'); names.add('Failed Auction');
    } else if (dayPrep.pdValueRelationship === 'InsideRange' || dayPrep.pdValueRelationship === 'InBalance') {
        names.add('Inside Value Fade'); names.add('Inside Day Breakout');
    }

    // 2. Structural Anomalies
    // Check if pdExtremes is set to anything other than 'None' (Poor High, Poor Low, Both)
    if (dayPrep.pdExtremes !== 'None') names.add('Poor High/Low Repair');
    // Check if priorVPOC is 'naked'
    if (dayPrep.priorVPOC === 'naked') names.add('Naked POC Magnet');
    // Check if Single Prints levels are provided
    if (dayPrep.spHigh || dayPrep.spLow) names.add('Single Prints Fill');

    // 3. Macro Context
    if (dayPrep.marketCondition === 'Trend') {
        names.add('Trend Day'); names.add('D-Period Expansion');
    } else if (dayPrep.marketCondition === 'Bracket') {
        names.add('3-Day Balance Break'); names.add('Inside Day Breakout');
    }

    return playbooks.filter(pb => names.has(pb.name));
  }, [dayPrep, playbooks]);

  const recommendations = useMemo(() => {
    if (!dayPrep) return [];
    const recs = [];
    if (dayPrep.newsImpact === 'High') recs.push("Expect high Volatility");
    if (dayPrep.pdValueRelationship === 'InsideRange') recs.push("Look for rotational moves between prev day range extremes");
    if (dayPrep.pdValueRelationship === 'InBalance') recs.push("Prioritize POC rotations and balance trades");
    if (dayPrep.pdValueRelationship === 'OutsideVA') recs.push("Look for high conviction breakout or reversal at VA edges");
    if (dayPrep.pdValueRelationship === 'GAP') recs.push("Expect Gap fill or immediate Drive in Gap direction");
    if (dayPrep.marketCondition === 'Bracket') recs.push("Look for reversal trades at pdExtremes and pdVAs");
    if (dayPrep.marketCondition === 'Trend') recs.push("Look for trend continuation and enter at small pullbacks");
    if (dayPrep.marketCondition === 'Transition') recs.push("Look for building value outside pdExtremes");
    if (dayPrep.priceVsPWeek === 'inside week') recs.push("Look for reversal trades at pwExtremes and pwVAs.");
    if (dayPrep.priceVsPWeek === 'breakout mode') recs.push("Look for trend continuation till reaching next liquidity level");
    if (dayPrep.mediumTermTrend === 'Up') recs.push("Keep Longs longer and take fast TP for shorts");
    if (dayPrep.mediumTermTrend === 'Down') recs.push("Keep Shorts longer and take fast TP for longs");
    if (dayPrep.mediumTermTrend === 'Balancing') recs.push("Look for break-outs in the direction fo the higher trend");
    if (dayPrep.onRangeVsPDay === 'Inside') recs.push("Expect chop and break-out during Cash session in the direction of the higher trend.");
    if (dayPrep.onRangeVsPDay === 'Outside') recs.push("Expect trend continuation till Cash Hour, then GAP fill.");
    if (dayPrep.onInventory === 'Long') recs.push("Expect sharp sell during Cash session to fill the GAP");
    if (dayPrep.onInventory === 'Short') recs.push("Expect sharp buy during Cash session to fill the GAP");
    if (dayPrep.onInventory === 'Net Zero') recs.push("Steady till market finds a direction");
    if (dayPrep.pdExtremes === 'Poor High') recs.push("Look for repairing the pdHigh");
    if (dayPrep.pdExtremes === 'Poor Low') recs.push("Look for repairing the pdLow");
    if (dayPrep.pdExtremes === 'Both') recs.push("Look for repairing first the extreme against the higher trend");
    if (dayPrep.untestedPdVA === 'High') recs.push("Look for retest of pdVAH and reversal trades");
    if (dayPrep.untestedPdVA === 'Low') recs.push("Look for retest of pdVAL and reversal trades");
    if (dayPrep.untestedPdVA === 'Both') recs.push("Look for retest first of the VA against the higher trend and reversal trades");
    if (dayPrep.priorVPOC === 'naked') recs.push("Look for retest of pdPOC and reversal trades if tapped in ON session");
    if (dayPrep.onVsSettlement === 'lower') recs.push("Look for longs and GAP fill during Cash session");
    if (dayPrep.onVsSettlement === 'higher') recs.push("Look for shorts and GAP fill during Cash session");
    return recs;
  }, [dayPrep]);

  const protocolStyle = useMemo(() => {
    if (!dayPrep) return { bg: 'bg-purple-600/10', border: 'border-purple-500/30', iconBg: 'bg-purple-600', shadow: 'shadow-purple-600/20', text: 'text-purple-400', bullet: 'bg-purple-500', glow: 'rgba(168,85,247,0.05)', title: `STRATEGIC PROTOCOL FOR ${formData.date}` };
    switch (dayPrep.mediumTermTrend) {
      case 'Up': return { bg: 'bg-emerald-600/10', border: 'border-emerald-500/30', iconBg: 'bg-emerald-600', shadow: 'shadow-emerald-600/20', text: 'text-emerald-400', bullet: 'bg-emerald-500', glow: 'rgba(16,185,129,0.05)', title: 'LOOK FOR LONGS' };
      case 'Down': return { bg: 'bg-red-600/10', border: 'border-red-500/30', iconBg: 'bg-red-600', shadow: 'shadow-red-600/20', text: 'text-red-400', bullet: 'bg-red-500', glow: 'rgba(239,68,68,0.05)', title: 'LOOK FOR SHORTS' };
      case 'Balancing': return { bg: 'bg-sky-600/10', border: 'border-sky-500/30', iconBg: 'bg-sky-600', shadow: 'shadow-sky-600/20', text: 'text-sky-400', bullet: 'bg-sky-500', glow: 'rgba(14,165,233,0.05)', title: 'LOOK FOR ROTATIONAL MOVES' };
      default: return { bg: 'bg-purple-600/10', border: 'border-purple-500/30', iconBg: 'bg-purple-600', shadow: 'shadow-purple-600/20', text: 'text-purple-400', bullet: 'bg-purple-500', glow: 'rgba(168,85,247,0.05)', title: `STRATEGIC PROTOCOL FOR ${formData.date}` };
    }
  }, [dayPrep, formData.date]);

  useEffect(() => {
    if (dayPrep && !initialTrade) {
      setFormData(prev => ({
        ...prev,
        bias: dayPrep.bias,
        newsImpact: dayPrep.newsImpact,
        dailyNarrative: dayPrep.dailyNarrative,
        pdValueRelationship: dayPrep.pdValueRelationship,
        marketCondition: dayPrep.marketCondition,
        priceVsPWeek: dayPrep.priceVsPWeek,
        mediumTermTrend: dayPrep.mediumTermTrend,
        onRangeVsPDay: dayPrep.onRangeVsPDay,
        onInventory: dayPrep.onInventory,
        setup: dayPrep.setup || prev.setup,
        spHigh: dayPrep.spHigh,
        spLow: dayPrep.spLow,
        gapHigh: dayPrep.gapHigh,
        gapLow: dayPrep.gapLow,
        hypoSession: dayPrep.hypoSession,
        hypoThen: dayPrep.hypoThen,
        zoneOfInterest: dayPrep.zoneOfInterest,
        continuationTrigger: dayPrep.continuationTrigger,
        reversalTrigger: dayPrep.reversalTrigger,
        invalidationPoint: dayPrep.invalidationPoint,
        exitLevel: dayPrep.exitLevel
      }));
    }
  }, [dayPrep, initialTrade]);

  useEffect(() => {
    if (initialTrade && isOpen) {
      setFormData({ ...initialTrade, screenshots: initialTrade.screenshots || [] });
    } else if (!initialTrade && isOpen) {
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
        accountId: currentAccountId !== 'all' ? currentAccountId : (accounts[0]?.id || ''),
        screenshots: [],
        condition1Met: false,
        condition2Met: false,
        condition3Met: false,
      }));
    }
  }, [initialTrade, isOpen, accounts, currentAccountId]);

  const calculatedStats = useMemo(() => {
    const { entryPrice, exitPrice, stopLoss, type, contracts, instrument } = formData;
    const mult = INSTRUMENT_MULTIPLIERS[instrument || 'MNQ'] || 1;
    const diff = type === 'LONG' ? ((exitPrice || 0) - (entryPrice || 0)) : ((entryPrice || 0) - (exitPrice || 0));
    const brut = diff * mult * (contracts || 1);
    const net = brut - ((contracts || 1) * COMMISSION_PER_CONTRACT);
    let rr = 0;
    const risk = Math.abs((entryPrice || 0) - (stopLoss || 0));
    if (risk > 0) rr = diff / risk;
    return { net, rr };
  }, [formData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentCount = formData.screenshots?.length || 0;
    if (10 - currentCount <= 0) return;
    const filesToProcess = Array.from(files).slice(0, 10 - currentCount) as File[];

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setFormData(prev => ({
          ...prev,
          screenshots: [...(prev.screenshots || []), { url: compressed, caption: '' }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTrade: Trade = {
      ...formData,
      id: initialTrade?.id || Math.random().toString(36).substr(2, 9),
      pnlBrut: (formData.type === 'LONG' ? (formData.exitPrice! - formData.entryPrice!) : (formData.entryPrice! - formData.exitPrice!)) * (INSTRUMENT_MULTIPLIERS[formData.instrument!] || 1) * formData.contracts!,
      pnlNet: calculatedStats.net,
      rrRealized: parseFloat(calculatedStats.rr.toFixed(2)),
      status: calculatedStats.net > 0 ? 'WIN' : calculatedStats.net < 0 ? 'LOSS' : 'BE',
      commissions: formData.contracts! * COMMISSION_PER_CONTRACT,
    } as Trade;
    onSave(finalTrade);
    onClose();
  };

  const inputClass = "bg-[#111827] border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";
  const infoCardClass = "bg-[#0f172a] border border-slate-800/40 p-4 rounded-xl flex flex-col justify-center min-h-[64px]";

  const DisplayField = ({ label, value, colorClass = "text-white" }: { label: string, value: any, colorClass?: string }) => (
    <div className={infoCardClass}>
      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">{label}</p>
      <p className={`text-xs font-black uppercase tracking-tight ${colorClass}`}>{value || '---'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1222] border border-slate-800/60 rounded-[32px] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-10 py-8 border-b border-slate-800/50 flex justify-between items-center bg-[#0b1222] sticky top-0 z-20">
          <div className="flex items-center space-x-4">
             <div className={`w-10 h-10 rounded-full ${initialTrade ? 'bg-orange-600' : 'bg-blue-600'} flex items-center justify-center shadow-lg transition-all`}>
                <i className={`fas ${initialTrade ? 'fa-edit' : 'fa-plus'} text-white`}></i>
             </div>
             <h2 className="text-xl font-black tracking-tight uppercase text-white">{initialTrade ? 'REVIEW TRADE' : t.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-12 custom-scrollbar hide-scrollbar">
          {initialTrade && (
            <div className="bg-orange-500/10 border-2 border-orange-500/30 p-8 rounded-[2rem] text-center animate-pulse shadow-[0_0_30px_rgba(249,115,22,0.1)]">
               <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter mb-2">Completează secțiunile 5, 6, 7</h1>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finalizează jurnalizarea execuției, analiza psihologică și dovezile grafice.</p>
            </div>
          )}

          <div className="space-y-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-black">1</div>
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">IDENTIFICARE TRADECARD</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div><label className={labelClass}>{t.date}</label><input type="date" className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              <div><label className={labelClass}>{t.instrument}</label><select className={inputClass} value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})}><option value="MNQ">MNQ</option><option value="NQ">NQ</option><option value="MES">MES</option><option value="ES">ES</option><option value="GC">GC</option></select></div>
              <div><label className={labelClass}>{t.session}</label><select className={inputClass} value={formData.session} onChange={e => setFormData({...formData, session: e.target.value as any})}><option value="NY Morning">NY Morning</option><option value="NY Afternoon">NY Afternoon</option><option value="London">London</option><option value="Asia">Asia</option></select></div>
              <div><label className={labelClass}>{t.account}</label><select className={inputClass} value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
            </div>
          </div>

          <section className="bg-slate-900/10 p-10 rounded-[32px] border border-slate-800/40 relative">
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-400 font-black border border-indigo-500/20">3</div>
              <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.2em]">DAY CONTEXT & STRATEGIC RECOMMENDATIONS</h3>
            </div>
            {dayPrep ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {recommendations.length > 0 && (
                    <div className={`${protocolStyle.bg} border ${protocolStyle.border} p-8 rounded-[2rem] shadow-[0_0_40px_${protocolStyle.glow}] relative overflow-hidden group transition-all duration-700`}>
                      <div className="flex items-start space-x-6 relative z-10">
                        <div className={`w-12 h-12 ${protocolStyle.iconBg} rounded-2xl flex items-center justify-center shadow-lg ${protocolStyle.shadow} shrink-0`}><i className={`fas ${dayPrep.mediumTermTrend === 'Up' ? 'fa-arrow-trend-up' : dayPrep.mediumTermTrend === 'Down' ? 'fa-arrow-trend-down' : 'fa-wand-magic-sparkles'} text-white text-xl`}></i></div>
                        <div className="flex-1">
                            <h4 className={`text-[11px] font-black ${protocolStyle.text} uppercase tracking-[0.2em] mb-4 flex items-center`}>{protocolStyle.title}<span className={`ml-3 h-px flex-1 ${dayPrep.mediumTermTrend === 'Up' ? 'bg-emerald-500/20' : dayPrep.mediumTermTrend === 'Down' ? 'bg-red-500/20' : 'bg-sky-500/20'}`}></span></h4>
                            <div className="grid grid-cols-1 gap-y-3">
                              {recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-start space-x-3 group/item"><div className={`w-1.5 h-1.5 rounded-full ${protocolStyle.bullet} shadow-[0_0_8px_rgba(255,255,255,0.4)] mt-1.5`}></div><span className="text-[12px] font-black text-slate-200 tracking-tight leading-tight group-hover/item:text-white transition-colors">{rec}</span></div>
                              ))}
                            </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Decision Funnel Results (Potential Setups) */}
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] relative overflow-hidden group">
                      <div className="flex items-start space-x-6 relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0"><i className="fas fa-filter text-white text-xl"></i></div>
                        <div className="flex-1">
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center">FUNNEL ACTIVATED SETUPS<span className="ml-3 h-px flex-1 bg-indigo-500/20"></span></h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {suggestedSetups.length > 0 ? suggestedSetups.map(pb => (
                                <div key={pb.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center space-x-3 group hover:border-indigo-500/50 transition-all shadow-inner">
                                    <span className="text-xl">{pb.icon}</span>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{pb.name}</p>
                                        <p className="text-[8px] text-indigo-400 font-bold uppercase">{pb.entryAt}</p>
                                    </div>
                                </div>
                              )) : (
                                <div className="col-span-2 py-4 text-center opacity-40">
                                    <p className="text-[9px] font-black uppercase text-slate-500 italic">Nu există setup-uri active pentru contextul actual.</p>
                                </div>
                              )}
                            </div>
                        </div>
                      </div>
                      <i className="fas fa-chess-knight absolute -bottom-8 -right-8 text-8xl text-white/[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000"></i>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <DisplayField label="News Impact" value={dayPrep.newsImpact} colorClass={dayPrep.newsImpact === 'High' ? 'text-red-500' : 'text-white'} />
                  <DisplayField label="Bias" value={dayPrep.bias} colorClass={dayPrep.bias === 'Bullish' ? 'text-green-500' : dayPrep.bias === 'Bearish' ? 'text-red-400' : 'text-white'} />
                  <DisplayField label="Price vs pdRange" value={dayPrep.pdValueRelationship} /><DisplayField label="Market Cond." value={dayPrep.marketCondition} /><DisplayField label="Price vs pWeek" value={dayPrep.priceVsPWeek} /><DisplayField label="MT Trend" value={dayPrep.mediumTermTrend} colorClass={dayPrep.mediumTermTrend === 'Up' ? 'text-green-500' : dayPrep.mediumTermTrend === 'Down' ? 'text-red-500' : 'text-white'} />
                </div>
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50"><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Planul "Day Prep" lipsește pentru data de {formData.date}</p></div>
            )}
          </section>

          <section>
            <div className="flex items-center space-x-4 mb-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-500 font-black border border-emerald-500/20">5</div>
                <h3 className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.2em]">{t.executionSection}</h3>
              </div>
            </div>

            <div className="space-y-12">
               <div className="bg-[#0f172a] border border-slate-800/60 p-8 rounded-[2.5rem] shadow-inner relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                     <div><h4 className="text-[11px] font-black text-white uppercase tracking-widest">Setup Grade & Conviction</h4><p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Validarea oportunității bazată pe criteriile Playbook-ului</p></div>
                     <div className="flex items-center space-x-2 text-slate-600"><i className="fas fa-shield-halved text-xs"></i><span className="text-[9px] font-black uppercase tracking-[0.2em]">Risk Management Protocol</span></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[
                        { id: 'A+', label: 'Setup A+', risk: '100% Risk Allocation', color: 'emerald', icon: '🚀' },
                        { id: 'B', label: 'Setup B', risk: '50% Risk Allocation', color: 'blue', icon: '🎯' },
                        { id: 'C', label: 'Setup C', risk: '25% Risk Allocation (NO TRADE?)', color: 'rose', icon: '⚠️' }
                     ].map(grade => {
                        const isRecommended = recommendedGrade === grade.id;
                        return (
                          <div key={grade.id} className={`p-6 rounded-[2rem] border transition-all duration-500 text-left relative group ${formData.setupGrade === grade.id ? `bg-${grade.color}-500/10 border-${grade.color}-500 shadow-lg scale-[1.02]` : 'bg-slate-950/40 border-slate-800/60 opacity-40'} ${isRecommended ? 'ring-2 ring-yellow-400' : ''}`}>
                             {isRecommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl z-10 whitespace-nowrap">⭐ PLAYBOOK REC.</div>}
                             <div className="flex justify-between items-start mb-4"><span className={`text-3xl font-black tracking-tighter ${formData.setupGrade === grade.id ? `text-${grade.color}-400` : 'text-slate-700'}`}>{grade.id}</span><span className="text-xl opacity-60 group-hover:opacity-100">{grade.icon}</span></div>
                             <p className="text-[10px] font-black text-white uppercase mb-1">{grade.label}</p>
                             <p className={`text-[11px] font-black uppercase ${formData.setupGrade === grade.id ? `text-${grade.color}-500` : 'text-slate-600'}`}>{grade.risk}</p>
                          </div>
                        );
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div><label className={labelClass}>SETUP EXECUTAT</label><select className={inputClass} value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})}>{playbooks.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                  {[1, 2, 3].map(i => {
                    const rule = entryCriteria[i - 1]?.text || '---';
                    const metKey = `condition${i}Met` as 'condition1Met' | 'condition2Met' | 'condition3Met';
                    return (
                      <div key={i} className="flex flex-col relative group/tooltip">
                        <label className={labelClass}>CONDIȚIA {i}</label>
                        {rule !== '---' && (
                          <div className="absolute bottom-[calc(100%-25px)] left-0 z-[110] hidden group-hover/tooltip:block animate-in fade-in zoom-in-95 duration-200">
                             <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-2xl shadow-2xl max-w-[280px] mb-3 pointer-events-none relative ring-1 ring-white/10"><p className="text-[11px] font-bold text-slate-200 leading-relaxed uppercase tracking-tight">{rule}</p><div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[#0f172a] border-r border-b border-slate-700 rotate-45"></div></div>
                          </div>
                        )}
                        <div className={`flex items-center space-x-3 bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] cursor-pointer ${formData[metKey] ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : ''}`} onClick={() => setFormData({...formData, [metKey]: !formData[metKey]})}>
                          <input type="checkbox" checked={formData[metKey]} onChange={(e) => setFormData({...formData, [metKey]: e.target.checked})} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500" /><span className={`text-[10px] font-bold truncate uppercase ${formData[metKey] ? 'text-emerald-400' : 'text-slate-500'}`}>{rule}</span>
                        </div>
                      </div>
                    );
                  })}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <div><label className={labelClass}>SIDE</label><div className="flex bg-[#111827] rounded-xl p-1 border border-slate-800"><button type="button" onClick={() => setFormData({...formData, type: 'LONG'})} className={`flex-1 py-3 text-[10px] font-black rounded-lg ${formData.type === 'LONG' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>LONG</button><button type="button" onClick={() => setFormData({...formData, type: 'SHORT'})} className={`flex-1 py-3 text-[10px] font-black rounded-lg ${formData.type === 'SHORT' ? 'bg-red-600 text-white' : 'text-slate-500'}`}>SHORT</button></div></div>
                 <div><label className={labelClass}>CONTRACTS</label><input type="number" className={inputClass} value={formData.contracts} onChange={e => setFormData({...formData, contracts: parseInt(e.target.value)})} /></div>
                 <div><label className={labelClass}>ENTRY TIME</label><input type="time" className={inputClass} value={formData.entryTime} onChange={e => setFormData({...formData, entryTime: e.target.value})} /></div>
                 <div><label className={labelClass}>EXIT TIME</label><input type="time" className={inputClass} value={formData.exitTime} onChange={e => setFormData({...formData, exitTime: e.target.value})} /></div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 <div><label className={labelClass}>ENTRY PRICE</label><input type="number" step="0.25" className={inputClass} value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: parseFloat(e.target.value)})} /></div>
                 <div><label className={labelClass}>STOP LOSS</label><input type="number" step="0.25" className={inputClass} value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: parseFloat(e.target.value)})} /></div>
                 <div><label className={labelClass}>TAKE PROFIT</label><input type="number" step="0.25" className={inputClass} value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: parseFloat(e.target.value)})} /></div>
                 <div><label className={labelClass}>EXIT PRICE</label><input type="number" step="0.25" className={inputClass} value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: parseFloat(e.target.value)})} /></div>
               </div>
            </div>

            <div className="mt-12 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-around items-center gap-10">
               <div className="text-center"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t.calculatePnl}</p><p className={`text-6xl font-black ${calculatedStats.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>{calculatedStats.net >= 0 ? '+' : ''}${calculatedStats.net.toLocaleString(undefined, { minimumFractionDigits: 1 })}</p></div>
               <div className="w-px h-24 bg-slate-800 hidden md:block"></div>
               <div className="text-center"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t.realizedRr}</p><p className="text-6xl font-black text-blue-500">1:{calculatedStats.rr.toFixed(2)}</p></div>
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-10"><div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-[10px] text-pink-500 font-black border border-pink-500/20">6</div><h3 className="text-[12px] font-black text-pink-500 uppercase tracking-[0.2em]">{t.reviewSection}</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               <div><label className={labelClass}>DISCIPLINE SCORE</label><select className={inputClass} value={formData.disciplineScore} onChange={e => setFormData({...formData, disciplineScore: parseInt(e.target.value)})}><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Neutral</option><option value="2">2 - Poor</option><option value="1">1 - Failed</option></select></div>
               <div><label className={labelClass}>MENTAL STATE</label><select className={inputClass} value={formData.mentalState} onChange={e => setFormData({...formData, mentalState: e.target.value as any})}><option value="Calm">Calm</option><option value="Anxious">Anxious</option><option value="Bored">Bored</option><option value="Excited">Excited</option></select></div>
               <div><label className={labelClass}>TRADING ERROR</label><select className={inputClass} value={formData.executionError} onChange={e => handleExecutionErrorChange(e.target.value as ExecutionErrorType)}><option value="None">None</option><option value="Frica/Ezitarea la Intrare">1. Frica/Ezitarea la Intrare</option><option value="Atasamentul Emotional de Rezultat">2. Atasamentul Emotional de Rezultat</option><option value="Refuzul de a Pierde (Mutarea Stop-Loss-ului)">3. Refuzul de a Pierde</option><option value="Focus pe Bani (P&L), nu pe Executie">4. Focus pe Bani (P&L)</option><option value="Trading Impulsiv (Fără Plan)">5. Trading Impulsiv</option><option value="Încălcarea Edge-ului (Style Drift)">6. Încălcarea Edge-ului</option><option value="Tilt Emotional (Revenge Trading)">7. Tilt Emotional</option></select></div>
               <div><label className={labelClass}>CORRECTION PLAN</label><select className={`${inputClass} truncate`} value={formData.correctionPlan} onChange={e => setFormData({...formData, correctionPlan: e.target.value as any})}><option value="None">None</option><option value="Redu pozitia la 25% din mărimea normală">Redu pozitia la 25%</option><option value="Pune 20 trade-uri, indiferent de rezultat">Pune 20 trade-uri</option><option value="Foloseste doar Hard Stops">Foloseste doar Hard Stops</option><option value="Ascunde coloana de P&L din platformă.">Ascunde coloana de P&L</option><option value="Executa doar scenariul scris">Executa doar scenariul scris</option></select></div>
            </div>
            <div><label className={labelClass}>POST-TRADE REVIEW NOTES</label><textarea className={`${inputClass} h-40 resize-none`} placeholder="What happened compared to your plan?" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
          </section>

          <section>
            <div className="flex items-center space-x-3 mb-10"><div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-500 font-black border border-blue-500/20">7</div><h3 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.2em]">{t.screenshotsSection} ({formData.screenshots?.length || 0}/10)</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {(formData.screenshots || []).map((shot, idx) => (
                 <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden group shadow-lg">
                    <div className="relative aspect-video bg-black flex items-center justify-center border-b border-slate-800"><img src={shot.url} className="w-full h-full object-contain" alt={`Shot ${idx + 1}`} /><button type="button" onClick={() => setFormData({...formData, screenshots: formData.screenshots?.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all"><i className="fas fa-times text-sm"></i></button></div>
                    <div className="p-4"><input type="text" value={shot.caption} onChange={(e) => setFormData({...formData, screenshots: formData.screenshots?.map((s, i) => i === idx ? { ...s, caption: e.target.value } : s)})} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Add observation..." /></div>
                 </div>
               ))}
               {(formData.screenshots?.length || 0) < 10 && (
                 <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-slate-900/20 hover:border-blue-500/30 hover:bg-blue-500/5 group min-h-[300px]">
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                   <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:text-blue-400"><i className="fas fa-camera text-2xl"></i></div>
                   <p className="font-black text-xs uppercase tracking-widest text-slate-500 group-hover:text-blue-400">Add Screenshots</p>
                 </div>
               )}
            </div>
          </section>

          <div className="pt-8 border-t border-slate-800/50 flex space-x-4 bg-[#0b1222] sticky bottom-0 pb-10 z-20">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl font-black text-[11px] text-slate-400 hover:text-white transition-colors border border-slate-800 uppercase tracking-widest">Anulează</button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[11px] shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest">Salvează Trade</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTradeModal;
