import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trade, SessionType, Account, DailyPrepData, Playbook, SetupGrade, 
  ExecutionErrorType, CorrectionPlanType, MentalStateType, BiasType
} from '../types';
import { Language, translations } from '../translations';
import { useAppContext } from '../AppContext';

interface NewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  accounts: Account[];
  playbooks: Playbook[];
  trades: Trade[];
  initialTrade?: Trade;
  currentAccountId?: string;
  dailyPreps: Record<string, DailyPrepData>;
  language: Language;
}

const INSTRUMENT_MULTIPLIERS: Record<string, number> = {
  'MNQ': 2, 'NQ': 20, 'MES': 5, 'ES': 50, 'GC': 100,
};

const COMMISSION_PER_CONTRACT = 2.40;

const EXECUTION_ERRORS: ExecutionErrorType[] = [
  'Frica/Ezitarea la Intrare', 'Atasamentul Emotional de Rezultat', 
  'Refuzul de a Pierde (Mutarea Stop-Loss-ului)', 'Focus pe Bani (P&L), nu pe Executie', 
  'Trading Impulsiv (Fără Plan)', 'Încălcarea Edge-ului (Style Drift)', 
  'Tilt Emotional (Revenge Trading)', 'Lipsa Jurnalizării', 
  'Trading în Stare Degradată (Oboseală/Stres)', 'FOMO (Fear Of Missing Out)', 'None'
];

const CORRECTION_PLANS: CorrectionPlanType[] = [
  'Redu pozitia la 25% din mărimea normală', 'Pune 20 trade-uri, indiferent de rezultat', 
  'Foloseste doar Hard Stops', 'Ascunde coloana de P&L din platformă.', 
  // Fixed typo to match CorrectionPlanType in types.ts
  'Executa doar scenariu scris', 
  'Executa doar scenarii A+', 
  'Pauza de 15 minute dupa o pierdere', 'Ai voie sa trade-uiesti dupa ce ai completat jurnalul de ieri', 
  'Tranzacționezi cu 50% din mărime și max 2 tranzacții', 'Doar limit orders timp de 1 saptamana', 'None'
];

const MENTAL_STATES: MentalStateType[] = ['Calm', 'Anxious', 'Bored', 'Excited'];

const SCANNER_RULES = {
  pdValue: {
    'GAP': ['pb-12', 'pb-13', 'pb-32'],
    'OutsideVA': ['pb-4', 'pb-5'],
    'InBalance': ['pb-26', 'pb-27'],
    'InsideRange': ['pb-14']
  },
  openType: {
    'Drive': ['pb-1'],
    'Test driver': ['pb-2'],
    'Rejection- Reversal': ['pb-3']
  },
  inventory: {
    'Long': ['pb-14'],
    'Short': ['pb-14']
  },
  stats: {
    'Inside': ['pb-25']
  },
  dynamics: {
    'Narrow': ['pb-15'],
    'Both': ['pb-34']
  },
  regime: {
    'Trend': ['pb-6', 'pb-21', 'pb-18'],
    'Bracket': ['pb-34', 'pb-30']
  }
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
  const { backtestTrades } = useAppContext();

  const preSelectedAccountId = useMemo(() => {
    if (initialTrade?.accountId) return initialTrade.accountId;
    if (currentAccountId && currentAccountId !== 'all') return currentAccountId;
    return '';
  }, [initialTrade, currentAccountId]);

  const [formData, setFormData] = useState<Partial<Trade>>({
    date: new Date().toISOString().split('T')[0],
    instrument: 'MNQ',
    session: 'NY Morning',
    bias: 'Neutral',
    type: 'LONG',
    contracts: 1,
    setupGrade: 'None',
    disciplineScore: 5,
    executionError: 'None',
    correctionPlan: 'None',
    mentalState: 'Calm',
    pnlBrut: 0,
    entryPrice: 0,
    exitPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    accountId: preSelectedAccountId,
    setup: playbooks[0]?.name || '',
    screenshots: [],
    notes: '',
    isPartOfPlan: true,
    isAccordingToPlan: 'None',
    condition1Met: false,
    condition2Met: false,
    condition3Met: false,
    dailyNarrative: '',
    entryTime: '--:--',
    exitTime: '--:--',
  });

  const activeAccount = useMemo(() => accounts.find(a => a.id === formData.accountId), [accounts, formData.accountId]);
  const selectedPrep = useMemo(() => dailyPreps[formData.date || ''], [dailyPreps, formData.date]);

  const autoCalculatePrices = (entry: number) => {
    if (!activeAccount || entry <= 0) return;
    
    // Extragem setările de risc sau folosim valori implicite sigure
    const risk = activeAccount.riskSettings || { 
      maxDailyRisk: 400, 
      maxTradesPerDay: 3, 
      fixedSlPoints: 40, 
      rrRatio: 2, 
      calcMode: 'fixedSL',
      targetMode: 'fixedRR'
    };

    const multiplier = INSTRUMENT_MULTIPLIERS[formData.instrument || 'MNQ'] || 2;
    const tradesN = risk.maxTradesPerDay || 1;
    const riskPerTrade = (risk.maxDailyRisk || 400) / (tradesN || 1);
    
    // 1. Calculăm DISTANȚA Stop Loss (Puncte necesare) conform logicii din Risk Management
    let slPoints = 0;
    if (risk.calcMode === 'fixedSL') {
      slPoints = risk.fixedSlPoints || 40;
    } else {
      const contractsNum = formData.contracts || 1;
      slPoints = riskPerTrade / (contractsNum * multiplier);
    }

    // 2. Calculăm DISTANȚA Target (Puncte necesare) conform logicii din Risk Management
    let targetPoints = 0;
    if (risk.targetMode === 'fixedTargetPoints') {
      targetPoints = risk.fixedTargetPoints || 80;
    } else {
      const rr = risk.rrRatio || 2;
      targetPoints = slPoints * rr;
    }

    // 3. Calculăm prețurile finale aplicând distanțele la Entry Price în funcție de tipul tranzacției (LONG/SHORT)
    const slPrice = formData.type === 'LONG' ? entry - slPoints : entry + slPoints;
    const tpPrice = formData.type === 'LONG' ? entry + slPoints : entry - slPoints; // R:R 1:1 requested
    const exitPrice = formData.type === 'LONG' ? entry + targetPoints : entry - targetPoints;

    setFormData(prev => ({
        ...prev,
        entryPrice: entry,
        stopLoss: parseFloat(slPrice.toFixed(2)),
        takeProfit: parseFloat(tpPrice.toFixed(2)),
        exitPrice: parseFloat(exitPrice.toFixed(2))
    }));
  };

  const calculatedStats = useMemo(() => {
    const { entryPrice, exitPrice, stopLoss, type, contracts, instrument } = formData;
    const mult = INSTRUMENT_MULTIPLIERS[instrument || 'MNQ'] || 1;
    const diff = type === 'LONG' ? ((exitPrice || 0) - (entryPrice || 0)) : ((entryPrice || 0) - (exitPrice || 0));
    const brut = diff * mult * (contracts || 1);
    const net = brut - ((contracts || 1) * COMMISSION_PER_CONTRACT);
    let rr = 0;
    const risk = Math.abs((entryPrice || 0) - (stopLoss || 0));
    if (risk > 0) rr = diff / risk;
    return { net, rr, brut };
  }, [formData]);

  const isToxicWin = formData.isAccordingToPlan === 'NU' && calculatedStats.net > 0;

  const tiltLevel = useMemo(() => {
    if (initialTrade) return { score: 0, label: 'HISTORICAL DATA', desc: 'Analiză retrospectivă - Scorul de tilt nu este calculat.', color: 'text-slate-500', bg: 'bg-slate-500', shadow: '' };
    
    let score = 0;
    const todayStr = formData.date || new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === todayStr && t.accountId === formData.accountId);
    
    const todayPnl = todayTrades.reduce((s, t) => s + t.pnlNet, 0);
    const maxDailyRisk = activeAccount?.riskSettings?.maxDailyRisk || 1000;
    if (todayPnl < 0) {
        score += Math.min((Math.abs(todayPnl) / maxDailyRisk) * 50, 50);
    }

    let consecutiveLosses = 0;
    const sortedToday = [...todayTrades].sort((a, b) => b.id.localeCompare(a.id));
    for (const t of sortedToday) {
        if (t.status === 'LOSS') consecutiveLosses++;
        else break;
    }
    score += Math.min(consecutiveLosses * 15, 30);

    if (formData.mentalState === 'Anxious') score += 15;
    if (formData.mentalState === 'Excited') score += 10;
    if (formData.mentalState === 'Bored') score += 5;
    if (formData.disciplineScore! < 3) score += 20;

    score = Math.min(Math.round(score), 100);

    let label = 'SYSTEM STABLE';
    let desc = 'Cortexul prefrontal este activ. Decizii raționale dominante.';
    let color = 'text-cyan-400';
    let bg = 'bg-cyan-500';
    let shadow = 'shadow-[0_0_15px_rgba(34,211,238,0.4)]';

    if (score > 75) { 
        label = 'CRITICAL TILT RISK'; 
        desc = 'OVERLOAD. Sistemul limbic a preluat controlul. OPREȘTE-TE!';
        color = 'text-red-500'; 
        bg = 'bg-red-500'; 
        shadow = 'shadow-[0_0_20px_rgba(239,68,68,0.6)]';
    }
    else if (score > 40) { 
        label = 'EMOTIONAL FRICTION'; 
        desc = 'Risc mediu. Emoțiile încep să dicteze execuția. Redu mărimea.';
        color = 'text-orange-500'; 
        bg = 'bg-orange-500'; 
        shadow = 'shadow-[0_0_15px_rgba(249,115,22,0.4)]';
    }
    else if (score > 15) { 
        label = 'MILD IRRITATION'; 
        desc = 'Fricțiune detectată. Atenție la impulsivitate.';
        color = 'text-yellow-400'; 
        bg = 'bg-yellow-400'; 
        shadow = 'shadow-[0_0_10px_rgba(234,179,8,0.3)]';
    }

    return { score, label, desc, color, bg, shadow };
  }, [trades, formData.date, formData.accountId, formData.mentalState, formData.disciplineScore, activeAccount, initialTrade]);

  const intelligence = useMemo(() => {
    if (!selectedPrep) return { protocol: [], setups: [] };

    const protocol: string[] = [];
    if (selectedPrep.mediumTermTrend === 'Up') protocol.push("BIAS: TREND UP. HOLD LONGS / FAST TP SHORTS.");
    else if (selectedPrep.mediumTermTrend === 'Down') protocol.push("BIAS: TREND DOWN. HOLD SHORTS / FAST TP LONGS.");
    else if (selectedPrep.mediumTermTrend === 'Balancing') protocol.push("BIAS: BALANCING. ROTATIONAL TRADES ONLY.");

    if (selectedPrep.pdValueRelationship === 'GAP') protocol.push("OPEN: GAP STATE. EXPECT IMMEDIATE VOLATILITY.");
    else if (selectedPrep.pdValueRelationship === 'OutsideVA') protocol.push("STATE: OUTSIDE VALUE. 80% RULE ACTIVE.");

    if (selectedPrep.marketCondition === 'Trend') protocol.push("REGIME: MOMENTUM. DON'T FIGHT THE DRIVE.");
    else if (selectedPrep.marketCondition === 'Bracket') protocol.push("REGIME: BRACKETING. FADE THE EDGES.");

    const suggestedIds = new Set<string>();
    if (selectedPrep.pdValueRelationship && SCANNER_RULES.pdValue[selectedPrep.pdValueRelationship as keyof typeof SCANNER_RULES.pdValue]) {
        SCANNER_RULES.pdValue[selectedPrep.pdValueRelationship as keyof typeof SCANNER_RULES.pdValue].forEach(id => suggestedIds.add(id));
    }
    if (selectedPrep.openType && SCANNER_RULES.openType[selectedPrep.openType as keyof typeof SCANNER_RULES.openType]) {
        SCANNER_RULES.openType[selectedPrep.openType as keyof typeof SCANNER_RULES.openType].forEach(id => suggestedIds.add(id));
    }
    if (selectedPrep.onInventory && SCANNER_RULES.inventory[selectedPrep.onInventory as keyof typeof SCANNER_RULES.inventory]) {
        SCANNER_RULES.inventory[selectedPrep.onInventory as keyof typeof SCANNER_RULES.inventory].forEach(id => suggestedIds.add(id));
    }
    if (selectedPrep.onRangeVsPDay === 'Inside') {
        SCANNER_RULES.stats.Inside.forEach(id => suggestedIds.add(id));
    }
    if (selectedPrep.ibWidth === 'Narrow') SCANNER_RULES.dynamics.Narrow.forEach(id => suggestedIds.add(id));
    if (selectedPrep.rangeExtension === 'Both') SCANNER_RULES.dynamics.Both.forEach(id => suggestedIds.add(id));
    if (selectedPrep.marketCondition && SCANNER_RULES.regime[selectedPrep.marketCondition as keyof typeof SCANNER_RULES.regime]) {
        SCANNER_RULES.regime[selectedPrep.marketCondition as keyof typeof SCANNER_RULES.regime].forEach(id => suggestedIds.add(id));
    }
    
    const d = new Date(formData.date || '');
    if (d.getDay() === 4 || d.getDay() === 5) suggestedIds.add('pb-38');
    if (selectedPrep.trendYesterday) suggestedIds.add('pb-39');

    return {
        protocol,
        setups: playbooks.filter(pb => suggestedIds.has(pb.id))
    };
  }, [selectedPrep, playbooks, formData.date]);

  useEffect(() => {
    if (initialTrade) {
      setFormData(initialTrade);
    } else {
        if (selectedPrep) {
            setFormData(prev => ({ 
                ...prev, 
                bias: selectedPrep.bias, 
                dailyNarrative: selectedPrep.dailyNarrative 
            }));
        }
    }
  }, [initialTrade, selectedPrep]);

  const selectedPlaybook = useMemo(() => {
    return playbooks.find(p => p.name === formData.setup);
  }, [formData.setup, playbooks]);

  const entryCriteria = useMemo(() => selectedPlaybook?.entryCriteria || [], [selectedPlaybook]);

  const consolidatedPlaybookStats = useMemo(() => {
    if (!formData.setup) return { winRate: 0, pf: 0, count: 0 };
    const allTrades = [...trades, ...backtestTrades].filter(t => t.setup === formData.setup);
    const count = allTrades.length;
    const wins = allTrades.filter(t => t.status === 'WIN').length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    const totalWin = allTrades.filter(t => t.pnlNet > 0).reduce((s, t) => s + t.pnlNet, 0);
    const totalLoss = Math.abs(allTrades.filter(t => t.pnlNet < 0).reduce((s, t) => s + t.pnlNet, 0));
    const pf = totalLoss > 0 ? (totalWin / totalLoss) : (totalWin > 0 ? 99 : 0);
    return { winRate, pf, count };
  }, [formData.setup, trades, backtestTrades]);

  const isHighConfidence = consolidatedPlaybookStats.count >= 20;

  useEffect(() => {
    const metCount = [formData.condition1Met, formData.condition2Met, formData.condition3Met].filter(Boolean).length;
    let autoGrade: SetupGrade = 'None';
    if (metCount === 3) autoGrade = 'A+';
    else if (metCount === 2) autoGrade = 'B';
    else if (metCount === 1) autoGrade = 'C';
    if (autoGrade !== formData.setupGrade) setFormData(prev => ({ ...prev, setupGrade: autoGrade }));
  }, [formData.condition1Met, formData.condition2Met, formData.condition3Met]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentCount = formData.screenshots?.length || 0;
    const filesToProcess = Array.from(files).slice(0, 5 - currentCount) as File[];
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, screenshots: [...(prev.screenshots || []), { url: compressed, caption: '' }] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) {
        alert("Te rugăm să selectezi un cont înainte de a salva tranzacția.");
        return;
    }
    const finalTrade: Trade = {
      ...formData,
      id: initialTrade?.id || Math.random().toString(36).substr(2, 9),
      pnlBrut: calculatedStats.brut,
      pnlNet: calculatedStats.net,
      rrRealized: parseFloat(calculatedStats.rr.toFixed(2)),
      status: calculatedStats.net > 0 ? 'WIN' : calculatedStats.net < 0 ? 'LOSS' : 'BE',
      commissions: formData.contracts! * COMMISSION_PER_CONTRACT,
    } as Trade;
    onSave(finalTrade);
    onClose();
  };

  const inputClass = "bg-[#111827] border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all cursor-pointer";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";
  const sectionHeader = "text-[12px] font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-slate-800 pb-3 flex items-center";

  const isNoteComplete = (formData.notes || '').trim().length >= 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1222] border border-slate-800/60 rounded-[32px] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="px-10 py-6 border-b border-slate-800/50 flex justify-between items-center bg-[#0b1222] sticky top-0 z-30">
          <div className="flex items-center space-x-6">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                 <i className={`fas ${initialTrade ? 'fa-edit' : 'fa-chart-line'} text-white text-xl`}></i>
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tight uppercase text-white italic">{initialTrade ? 'ANALIZEAZĂ EXECUȚIE' : 'ÎNREGISTREAZĂ TRADE NOU'}</h2>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">MP Protocol Engine V4.0</p>
             </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-2xl mx-12 items-center space-x-8 bg-black/40 px-10 py-4 rounded-[2rem] border border-slate-800/80 shadow-2xl relative group/tiltinfo">
             <div className="flex-1">
                <div className="flex justify-between items-end mb-2.5">
                   <div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-0.5">Tilt Meter Intelligence</span>
                        <h4 className={`text-sm font-black uppercase italic tracking-tighter ${tiltLevel.color}`}>{tiltLevel.label}</h4>
                   </div>
                   <div className="text-right flex flex-col items-end">
                        <span className="text-3xl font-black text-white tracking-tighter leading-none">{tiltLevel.score}%</span>
                   </div>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800 shadow-inner">
                   <div 
                     className={`h-full transition-all duration-1000 ease-out ${tiltLevel.bg} ${tiltLevel.shadow}`}
                     style={{ width: `${tiltLevel.score}%` }}
                   >
                       <div className="absolute top-0 right-0 w-12 h-full bg-white/20 animate-pulse"></div>
                   </div>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">OPTIMAL</span>
                    <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">FRICTION</span>
                    <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">DANGER</span>
                </div>
             </div>
             
             <div className="w-48 border-l border-slate-800/50 pl-6 flex flex-col justify-center">
                 <p className="text-[8px] font-black text-slate-500 uppercase mb-1.5 tracking-widest flex items-center">
                     <i className="fas fa-brain mr-1.5 text-blue-500"></i> BIOMETRIC STATUS
                 </p>
                 <p className={`text-[10px] font-bold leading-tight uppercase italic ${tiltLevel.score > 40 ? 'text-orange-400' : 'text-slate-400'}`}>
                     {tiltLevel.desc}
                 </p>
             </div>
          </div>

          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-12 custom-scrollbar hide-scrollbar">
          
          <section className={`bg-indigo-600/10 border ${isToxicWin ? 'border-fuchsia-500/60 bg-fuchsia-600/10' : 'border-indigo-500/30'} p-8 rounded-[2rem] shadow-xl animate-in slide-in-from-top-4 duration-500 transition-colors duration-500`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                 <div className={`w-10 h-10 rounded-xl ${isToxicWin ? 'bg-fuchsia-600 animate-pulse' : 'bg-indigo-600'} flex items-center justify-center text-white shadow-lg`}>
                    <i className={`fas ${isToxicWin ? 'fa-biohazard' : 'fa-clipboard-check'} text-xs`}></i>
                 </div>
                 <div>
                    <h3 className={`text-sm font-black uppercase tracking-widest ${isToxicWin ? 'text-fuchsia-400' : 'text-white'}`}>
                        {isToxicWin ? 'TOXIC WIN DETECTED' : 'VALIDARE DISCIPLINĂ'}
                    </h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        {isToxicWin ? 'Profitul obținut fără plan întărește obiceiurile proaste.' : 'Acest trade respectă planul tău inițial?'}
                    </p>
                 </div>
              </div>
              <div className="w-full md:w-64">
                <label className={labelClass}>ANALIZA CONFORM PLANULUI</label>
                <div className="relative group">
                    <select 
                        value={formData.isAccordingToPlan || 'None'} 
                        onChange={e => setFormData({...formData, isAccordingToPlan: e.target.value as any})}
                        className={`${inputClass} !bg-[#060b13] ${isToxicWin ? 'border-fuchsia-500' : 'border-indigo-500/30'} focus:border-indigo-500 font-black text-[11px] uppercase tracking-widest`}
                    >
                        <option value="None">Alege opțiune...</option>
                        <option value="DA">DA - Am urmat planul 100%</option>
                        <option value="NU">NU - Execuție impulsivă / Greșeală</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none text-[10px]"></i>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className={sectionHeader}><i className="fas fa-calendar-alt mr-3 text-blue-500"></i> CONTEXTUL SESIUNII</h3>
            {!formData.accountId && (
                <div className="mb-6 bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex items-start space-x-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                        <i className="fas fa-info-circle text-sm"></i>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-widest">Acțiune Necesară</p>
                        <p className="text-[10px] font-medium text-blue-300 leading-tight">
                            Selectează contul de tranzacționare pentru a activa Protocolul de Management al Riscului și a permite salvarea analizei.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div><label className={labelClass}>DATA</label><input type="date" className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              <div><label className={labelClass}>INSTRUMENT</label><select className={inputClass} value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})}><option value="MNQ">MNQ</option><option value="NQ">NQ</option><option value="MES">MES</option><option value="ES">ES</option><option value="GC">GC</option></select></div>
              <div><label className={labelClass}>SESIUNE</label><select className={inputClass} value={formData.session} onChange={e => setFormData({...formData, session: e.target.value as any})}><option value="NY Morning">NY Morning</option><option value="NY Afternoon">NY Afternoon</option><option value="London">London</option><option value="Asia">Asia</option></select></div>
              <div>
                <label className={labelClass}>CONT</label>
                <select 
                    className={`${inputClass} ${!formData.accountId ? 'border-blue-500 ring-1 ring-blue-500/50' : ''}`} 
                    value={formData.accountId} 
                    onChange={e => setFormData({...formData, accountId: e.target.value})}
                >
                    <option value="">Alege contul...</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <section className="bg-blue-600/5 border border-blue-500/20 p-10 rounded-[3rem] relative overflow-hidden group">
                <div className="flex items-center space-x-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <i className="fas fa-robot text-sm"></i>
                    </div>
                    <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">STRATEGIC PROTOCOL GENERATED</h5>
                </div>
                
                <div className="space-y-4 relative z-10">
                   {intelligence.protocol.length > 0 ? intelligence.protocol.map((line, idx) => (
                       <div key={idx} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-start space-x-4 hover:border-blue-500/50 transition-all">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                           <p className="text-[10px] font-black text-white uppercase tracking-tight leading-relaxed">{line}</p>
                       </div>
                   )) : (
                       <div className="py-6 flex flex-col items-center justify-center opacity-40">
                          <i className="fas fa-microscope text-2xl text-slate-700 mb-4"></i>
                          <p className="text-[9px] font-black uppercase text-slate-600">CALCULATING STRATEGIC CONTEXT...</p>
                       </div>
                   )}
                </div>
            </section>

            <section className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[3rem] relative overflow-hidden group">
                <div className="flex items-center space-x-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                        <i className="fas fa-puzzle-piece text-sm"></i>
                    </div>
                    <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">PLAYBOOK ACTIVATION: POTENTIAL SETUPS</h5>
                </div>
                {intelligence.setups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                        {intelligence.setups.map(pb => (
                            <div key={pb.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 hover:border-indigo-500/50 transition-all shadow-inner relative overflow-hidden">
                                <span className="text-2xl relative z-10">{pb.icon}</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{pb.name}</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase relative z-10">{pb.entryAt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center opacity-40">
                        <i className="fas fa-search text-2xl text-slate-700 mb-4"></i>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">CONFIGUREAZĂ REFERINȚELE PENTRU ACTIVARE</p>
                    </div>
                )}
            </section>
          </div>

          <section className="bg-slate-900/20 p-10 rounded-[2.5rem] border border-slate-800/60 shadow-inner">
            <div className="flex justify-between items-start mb-10">
               <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">SETUP GRADE & CONVICTION</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">VALIDAREA OPORTUNITĂȚII BAZATĂ PE CRITERIILE PLAYBOOK-ULUI</p>
               </div>
               {isHighConfidence && (
                 <div className="flex items-center space-x-2 text-amber-500 animate-pulse bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <i className="fas fa-crown text-xs"></i>
                    <span className="text-[9px] font-black uppercase tracking-widest">HIGH CONFIDENCE EDGE (20+ SAMPLES)</span>
                 </div>
               )}
            </div>

            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
                 <div>
                    <label className={labelClass}>SETUP EXECUTAT</label>
                    <select className={inputClass} value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})}>
                        {playbooks.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                 </div>
                 
                 {[1, 2, 3].map((num, idx) => {
                    const criteria = entryCriteria[idx];
                    const isMet = (formData as any)[`condition${num}Met`];
                    return (
                        <div key={num} className="flex flex-col">
                            <label className={labelClass}>CONDIȚIA {num}</label>
                            <label className={`flex items-center p-3.5 h-[50px] rounded-xl border transition-all cursor-pointer ${isMet ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-400' : 'bg-slate-950/40 border-slate-800 text-slate-600'}`}>
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 mr-4 shrink-0"
                                    checked={isMet}
                                    onChange={(e) => setFormData({...formData, [`condition${num}Met`]: e.target.checked})}
                                />
                                <span className="text-[10px] font-black uppercase tracking-tight truncate">
                                    {criteria?.text || 'N/A'}
                                </span>
                            </label>
                        </div>
                    );
                 })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/30">
                  <div className={`p-8 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group 
                    ${formData.setupGrade === 'A+' 
                        ? (isHighConfidence ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.25)] scale-[1.02]' : 'border-blue-600 bg-blue-600/5 shadow-[0_0_30px_rgba(59,130,246,0.15)]') 
                        : 'border-slate-800 bg-slate-900/40 opacity-40 grayscale'}`}>
                     <span className={`text-5xl font-black absolute top-2 left-4 transition-all ${isHighConfidence && formData.setupGrade === 'A+' ? 'text-amber-500/10' : 'text-white/10'}`}>A+</span>
                     <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                           <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border ${isHighConfidence && formData.setupGrade === 'A+' ? 'border-amber-500/50 text-amber-500' : 'border-slate-800 text-blue-500'}`}>
                              <i className="fas fa-rocket"></i>
                           </div>
                           {formData.setupGrade === 'A+' && <i className={`fas fa-check-circle ${isHighConfidence ? 'text-amber-500' : 'text-blue-500'}`}></i>}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">SETUP A+</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isHighConfidence ? 'text-amber-400' : 'text-blue-400'}`}>100% RISK ALLOCATION</p>
                        </div>
                     </div>
                  </div>

                  <div className={`p-8 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group 
                    ${formData.setupGrade === 'B' 
                        ? (isHighConfidence ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.25)]' : 'border-blue-600 bg-blue-600/5 shadow-[0_0_30px_rgba(59,130,246,0.15)]') 
                        : 'border-slate-800 bg-slate-900/40 opacity-40 grayscale'}`}>
                     <span className={`text-5xl font-black absolute top-2 left-4 transition-all ${isHighConfidence && formData.setupGrade === 'B' ? 'text-amber-500/10' : 'text-white/10'}`}>B</span>
                     <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                           <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border ${isHighConfidence && formData.setupGrade === 'B' ? 'border-amber-500/50 text-amber-500' : 'border-slate-800 text-blue-500'}`}>
                              <i className="fas fa-bullseye"></i>
                           </div>
                           {formData.setupGrade === 'B' && <i className={`fas fa-check-circle ${isHighConfidence ? 'text-amber-500' : 'text-blue-500'}`}></i>}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">SETUP B</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isHighConfidence ? 'text-amber-400' : 'text-blue-400'}`}> 50% RISK ALLOCATION</p>
                        </div>
                     </div>
                  </div>

                  <div className={`p-8 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group 
                    ${formData.setupGrade === 'C' 
                        ? (isHighConfidence ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.25)]' : 'border-amber-600 bg-amber-600/5 shadow-[0_0_30px_rgba(245,158,11,0.15)]') 
                        : 'border-slate-800 bg-slate-900/40 opacity-40 grayscale'}`}>
                     <span className={`text-5xl font-black absolute top-2 left-4 transition-all ${isHighConfidence && formData.setupGrade === 'C' ? 'text-amber-500/20' : 'text-white/10'}`}>C</span>
                     <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                           <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border ${isHighConfidence && formData.setupGrade === 'C' ? 'border-amber-500/50 text-amber-500' : 'border-slate-800 text-amber-500'}`}>
                              <i className="fas fa-triangle-exclamation"></i>
                           </div>
                           {formData.setupGrade === 'C' && <i className="fas fa-check-circle text-amber-500"></i>}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">SETUP C</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isHighConfidence ? 'text-amber-400' : 'text-slate-500'}`}>25% RISK ALLOCATION</p>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className={sectionHeader}><i className="fas fa-bolt mr-3 text-emerald-500"></i> EXECUȚIE TEHNICĂ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div>
                <label className={labelClass}>SIDE</label>
                <div className="flex bg-[#111827] rounded-xl p-1 border border-slate-800 h-[50px]">
                  <button type="button" onClick={() => setFormData({...formData, type: 'LONG'})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${formData.type === 'LONG' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>LONG</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'SHORT'})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${formData.type === 'SHORT' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>SHORT</button>
                </div>
              </div>
              <div>
                <label className={labelClass}>CONTRACTS</label>
                <input type="number" className={inputClass} value={formData.contracts} onChange={e => setFormData({...formData, contracts: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className={labelClass}>ENTRY TIME</label>
                <input type="time" className={inputClass} value={formData.entryTime} onChange={e => setFormData({...formData, entryTime: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>EXIT TIME</label>
                <input type="time" className={inputClass} value={formData.exitTime} onChange={e => setFormData({...formData, exitTime: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div>
                <label className={labelClass}>ENTRY PRICE</label>
                <input 
                  type="number" 
                  step="0.25" 
                  className={inputClass} 
                  value={formData.entryPrice || ''} 
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({...prev, entryPrice: val}));
                    autoCalculatePrices(val);
                  }} 
                />
              </div>
              <div><label className={labelClass}>STOP LOSS</label><input type="number" step="0.25" className={inputClass} value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: parseFloat(e.target.value) || 0})} /></div>
              <div><label className={labelClass}>TAKE PROFIT</label><input type="number" step="0.25" className={inputClass} value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: parseFloat(e.target.value) || 0})} /></div>
              <div><label className={labelClass}>EXIT PRICE</label><input type="number" step="0.25" className={inputClass} value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: parseFloat(e.target.value) || 0})} /></div>
            </div>

            <div className={`bg-[#0b1222]/60 border ${isToxicWin ? 'border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.15)]' : 'border-slate-800'} p-6 rounded-2xl shadow-inner transition-all duration-500`}>
               <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 text-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">PNL NET CALCULAT</p>
                     <p className={`text-5xl font-black tracking-tighter ${isToxicWin ? 'text-fuchsia-500 animate-pulse' : calculatedStats.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {calculatedStats.net < 0 ? '-' : ''}${Math.abs(calculatedStats.net).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                     </p>
                  </div>
                  <div className="flex-1 text-center pt-4 md:pt-0">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">R:R REALIZAT</p>
                     <p className="text-5xl font-black tracking-tighter text-blue-500">
                        1:{calculatedStats.rr.toFixed(2)}
                     </p>
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-orange-600/5 p-8 rounded-[2rem] border border-orange-500/20">
            <h3 className={sectionHeader}><i className="fas fa-brain mr-3 text-orange-500"></i> PSIHOLOGIE & FEEDBACK</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div>
                  <label className={labelClass}>DISCIPLINE SCORE (1-5)</label>
                  <div className="flex space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 justify-center">
                     {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setFormData({...formData, disciplineScore: s})} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${formData.disciplineScore! >= s ? 'text-yellow-500' : 'text-slate-800'}`}>
                           <i className="fas fa-star"></i>
                        </button>
                     ))}
                  </div>
               </div>
               <div><label className={labelClass}>EROARE EXECUȚIE</label><select className={inputClass} value={formData.executionError} onChange={e => setFormData({...formData, executionError: e.target.value as any})}>{EXECUTION_ERRORS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
               <div><label className={labelClass}>PLAN DE COREȚIE</label><select className={inputClass} value={formData.correctionPlan} onChange={e => setFormData({...formData, correctionPlan: e.target.value as any})}>{CORRECTION_PLANS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
               <div><label className={labelClass}>STARE MENTALĂ</label><select className={inputClass} value={formData.mentalState} onChange={e => setFormData({...formData, mentalState: e.target.value as any})}>{MENTAL_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
          </section>

          <section>
            <h3 className={sectionHeader}><i className="fas fa-comment-dots mr-3 text-blue-400"></i> NOTE ȘI CAPTURI ECRAN</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="relative group">
                  <div className="flex justify-between items-end mb-2">
                    <label className={labelClass + " !mb-0"}>NOTE POST-MORTEM</label>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isNoteComplete ? 'text-emerald-500' : 'text-slate-600'}`}>
                        {formData.notes?.length || 0} / 10 CARACTERE
                    </span>
                  </div>
                  <div className={`rounded-2xl transition-all duration-500 p-0.5 ${isNoteComplete ? 'bg-gradient-to-br from-emerald-500/40 via-emerald-500/10 to-transparent shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-br from-blue-500/40 via-blue-500/10 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}>
                    <textarea 
                        className={`${inputClass} !bg-[#0b1222] h-64 resize-none leading-relaxed p-6 border-transparent focus:ring-0`} 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})} 
                        placeholder="Descrie execuția, ce ai simțit și ce ai învățat din acest trade..." 
                    />
                  </div>
                  <p className={`mt-3 text-[9px] font-black uppercase tracking-widest italic flex items-center ${isNoteComplete ? 'text-emerald-500/70' : 'text-blue-500/70'}`}>
                    <i className={`fas ${isNoteComplete ? 'fa-check-circle' : 'fa-info-circle'} mr-2 text-[10px]`}></i>
                    Răspunsul trebuie să aibă minim 10 caractere pentru a fi considerat finalizat review-ul trade-ului.
                  </p>
               </div>
               <div>
                  <label className={labelClass}>SCREENSHOTS (MAX 5)</label>
                  <div className="grid grid-cols-2 gap-4">
                     {(formData.screenshots || []).map((s, i) => (
                        <div key={i} className="aspect-video bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group">
                           <img src={s.url} className="w-full h-full object-cover" alt="Trade screenshot" />
                           <button onClick={() => setFormData({...formData, screenshots: formData.screenshots?.filter((_, idx) => idx !== i)})} className="absolute top-2 right-2 bg-red-600 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl"><i className="fas fa-times text-[10px]"></i></button>
                        </div>
                     ))}
                     {(formData.screenshots?.length || 0) < 5 && (
                        <div onClick={() => fileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
                           <i className="fas fa-camera text-slate-700 text-2xl group-hover:text-blue-500 transition-colors"></i>
                           <p className="text-[8px] font-black text-slate-600 uppercase mt-2 tracking-widest">Adaugă Poză</p>
                        </div>
                     )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
               </div>
            </div>
          </section>

          <div className="pt-8 border-t border-slate-800/50 flex space-x-6 bg-[#0b1222] sticky bottom-0 pb-10 z-20">
            <button type="button" onClick={onClose} className="flex-1 py-5 rounded-2xl font-black text-[11px] text-slate-400 hover:text-white transition-colors border border-slate-800 uppercase tracking-widest">Anulează</button>
            <button type="submit" className="flex-[2] py-5 rounded-2xl font-black text-[11px] shadow-2xl transition-all active:scale-[0.98] uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30">
              {initialTrade ? 'ACTUALIZEAZĂ ANALIZA' : 'SALVEAZĂ TRADE'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewTradeModal;