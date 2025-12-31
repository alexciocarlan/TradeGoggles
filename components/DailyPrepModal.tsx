
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DailyPrepData, PdValueRelationship, MarketCondition, MediumTermTrend, 
  ONInventory, NewsImpactType, BiasType, Playbook, TradeScreenshot, WeeklyPrepData, OpenType
} from '../types';
import { Language } from '../translations';

interface DailyPrepModalProps {
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
  allPreps?: Record<string, DailyPrepData>;
  weeklyPreps: Record<string, WeeklyPrepData>;
  playbooks: Playbook[];
  language: Language;
}

const SESSION_PERIODS = ['None', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const ON_RANGE_OPTIONS = ['None', 'Inside', 'Outside'];
const INVENTORY_OPTIONS = ['None', 'Long', 'Short', 'Net Zero'];
const PD_EXTREMES_OPTIONS = ['None', 'Poor High', 'Poor Low', 'Both'];
const UNTESTED_VA_OPTIONS = ['None', 'High', 'Low', 'Both'];
const PRIOR_VPOC_OPTIONS = ['None', 'naked', 'tapped'];
const ON_VS_SETTLEMENT_OPTIONS = ['None', 'lower', 'higher'];

const OPEN_TYPE_OPTIONS: OpenType[] = ['None', 'Drive', 'Test driver', 'Rejection- Reversal', 'Auction'];
const IB_WIDTH_OPTIONS = ['None', 'Narrow', 'Normal', 'Wide'];
const RANGE_EXT_OPTIONS = ['None', 'Up', 'Down', 'Both'];

const KEY_LEVELS = [
  'None', 
  'pdHigh', 'pdLow', 'pdEQ', 'pdOpen', 'pdVAH', 'pdPOC', 'pdVAL', 'pdVWAPc', 'Settlment',
  'ONH', 'ONL', 
  'NY IB High', 'NY IB Low', 'NY Open', 'NY VWAP', 'NY IB ext 1', 'NY IB ext 2',
  'dHigh', 'dVAH', 'dVAL', 'dVWAP', 'dLow', 'dOpen',
  'GAP high', 'GAP low', 
  'IB high', 'IB low', 'SP',
  '4h High', '4h Low',
  'pwHigh', 'pwLow', 'pwEQ', 'pwVAH', 'pwVAL', 'pwOpen', 'pwVWAPc',
  'wHigh', 'wLow', 'wOpen', 'wVWAP',
  'range VAH', 'range VAL', 'range POC',
  'ndPOC', 'nwPOC', 'nmPOC',
  'ndOpen', 'nwOpen', 'nmOpen',
  'pmHigh', 'pmLow', 'pmOpen', 'pmVAH', 'pmVAL', 'pmEQ', 'pmVWAPc',
  'mOpen', 'mVWAP'
];

const TRIGGERS = ['None', 'IB Breakout', 'IB Rejection', 'Value Area Reject', 'Single Print Fill', 'Failed Auction', '80% Rule Trigger', 'OR Breakout', 'VWAP Bounce', 'vPOC Tap'];
const INVALIDATION_LEVELS = ['None', 'Opposite IB', 'Value Acceptance', 'Breach of vPOC', 'New H/L', 'Re-entry into Balance', 'Close across Level'];

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

const DailyPrepModal: React.FC<DailyPrepModalProps> = ({ onSave, onClose, initialData, initialDate, allPreps, weeklyPreps, playbooks, language }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const setupOptions = useMemo(() => {
    const list = playbooks.map(p => p.name);
    if (!list.includes('None')) list.push('None');
    return list;
  }, [playbooks]);

  const defaultState: DailyPrepData = {
    instrument: 'NQ', pdValueRelationship: 'None', marketCondition: 'None', priceVsPWeek: 'None', mediumTermTrend: 'None',
    onRangeVsPDay: 'None', onInventory: 'None', pdExtremes: 'None', untestedPdVA: 'None',
    spHigh: '', spLow: '', gapHigh: '', gapLow: '', priorVPOC: 'None', onVsSettlement: 'None',
    newsImpact: 'None', bias: 'Neutral', dailyNarrative: '',
    setup: 'None', hypoSession: 'None', hypoThen: 'A', zoneOfInterest: 'None', continuationTrigger: 'None', reversalTrigger: 'None', invalidationPoint: 'None', exitLevel: 'None',
    setup2: 'None', hypoSession2: 'None', hypoThen2: 'A', zoneOfInterest2: 'None', continuationTrigger2: 'None', reversalTrigger2: 'None', invalidationPoint2: 'None', exitLevel2: 'None',
    prepScreenshots: [],
    openType: 'None',
    ibWidth: 'None' as any,
    rangeExtension: 'None' as any,
    trendYesterday: false
  } as any;

  const [formData, setFormData] = useState<DailyPrepData>(initialData || defaultState);

  const currentWeekPrep = useMemo(() => {
    const d = new Date(selectedDate);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const weekId = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    return weeklyPreps[weekId];
  }, [selectedDate, weeklyPreps]);

  useEffect(() => {
    if (allPreps && allPreps[selectedDate]) {
      setFormData(allPreps[selectedDate]);
    } else if (selectedDate === initialDate && initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultState);
    }
  }, [selectedDate, allPreps, initialDate, initialData]);

  const strategicProtocol = useMemo(() => {
    const protocol: string[] = [];
    if (formData.mediumTermTrend === 'Up') protocol.push("BIAS: TREND UP. KEEP LONGS LONGER AND TAKE FAST TP FOR SHORTS.");
    else if (formData.mediumTermTrend === 'Down') protocol.push("BIAS: TREND DOWN. KEEP SHORTS LONGER AND TAKE FAST TP FOR LONGS.");
    else if (formData.mediumTermTrend === 'Balancing') protocol.push("BIAS: BALANCING. PRIORITIZE ROTATIONAL TRADES. DO NOT CHASE BREAKOUTS.");

    if (formData.pdValueRelationship === 'GAP') protocol.push("OPEN: GAP STATE. EXPECT IMMEDIATE VOLATILITY. WATCH GAP FILL VS DRIVE.");
    else if (formData.pdValueRelationship === 'InsideRange' || formData.pdValueRelationship === 'InBalance') protocol.push("OPEN: INSIDE RANGE. MARKET IS BALANCED. LOOK FOR FADES AT PD EXTREMES.");
    else if (formData.pdValueRelationship === 'OutsideVA') protocol.push("OPEN: OUTSIDE VALUE. HIGH PROBABILITY OF THE 80% RULE. TARGET OPPOSITE VA EDGE.");

    if (formData.marketCondition === 'Trend') protocol.push("REGIME: MOMENTUM / TREND. DON'T FIGHT THE DRIVE.");
    else if (formData.marketCondition === 'Bracket') protocol.push("REGIME: BRACKETING / RANGE. FADE THE EDGES, REVERT TO MEAN (POC).");

    const pWeekVal = currentWeekPrep?.priceVsPWeek || formData.priceVsPWeek;
    if (pWeekVal === 'outside pwRange') protocol.push("WEEKLY ANCHOR: OUTSIDE PW RANGE. EXPANSION TARGETS IN PLAY. VOLATILITY HIGH.");
    if (formData.newsImpact === 'High') protocol.push("NEWS ALERT: HIGH IMPACT DATA TODAY. REDUCE SIZE OR WAIT FOR REACTION.");

    return protocol;
  }, [formData.mediumTermTrend, formData.pdValueRelationship, formData.marketCondition, formData.newsImpact, currentWeekPrep, formData.priceVsPWeek]);

  const suggestedSetups = useMemo(() => {
    const suggestedIds = new Set<string>();
    if (formData.pdValueRelationship && SCANNER_RULES.pdValue[formData.pdValueRelationship as keyof typeof SCANNER_RULES.pdValue]) {
        SCANNER_RULES.pdValue[formData.pdValueRelationship as keyof typeof SCANNER_RULES.pdValue].forEach(id => suggestedIds.add(id));
    }
    if (formData.openType && SCANNER_RULES.openType[formData.openType as keyof typeof SCANNER_RULES.openType]) {
        SCANNER_RULES.openType[formData.openType as keyof typeof SCANNER_RULES.openType].forEach(id => suggestedIds.add(id));
    }
    if (formData.onInventory && SCANNER_RULES.inventory[formData.onInventory as keyof typeof SCANNER_RULES.inventory]) {
        SCANNER_RULES.inventory[formData.onInventory as keyof typeof SCANNER_RULES.inventory].forEach(id => suggestedIds.add(id));
    }
    if (formData.onRangeVsPDay === 'Inside') {
        SCANNER_RULES.stats.Inside.forEach(id => suggestedIds.add(id));
    }
    if (formData.ibWidth === 'Narrow') SCANNER_RULES.dynamics.Narrow.forEach(id => suggestedIds.add(id));
    if (formData.rangeExtension === 'Both') SCANNER_RULES.dynamics.Both.forEach(id => suggestedIds.add(id));
    if (formData.marketCondition && SCANNER_RULES.regime[formData.marketCondition as keyof typeof SCANNER_RULES.regime]) {
        SCANNER_RULES.regime[formData.marketCondition as keyof typeof SCANNER_RULES.regime].forEach(id => suggestedIds.add(id));
    }
    const d = new Date(selectedDate);
    if (d.getDay() === 4 || d.getDay() === 5) suggestedIds.add('pb-38');
    if (formData.trendYesterday) suggestedIds.add('pb-39');
    return playbooks.filter(pb => suggestedIds.has(pb.id));
  }, [formData, playbooks, selectedDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentCount = formData.prepScreenshots?.length || 0;
    const filesToProcess = Array.from(files).slice(0, 10 - currentCount) as File[];
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          prepScreenshots: [...(prev.prepScreenshots || []), { url: reader.result as string, caption: '' }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const SummaryCard = ({ label, value, sub, colorClass, icon }: any) => (
    <div className={`bg-[#0b1222]/80 border border-slate-800/60 p-4 rounded-3xl transition-all hover:border-slate-700 shadow-lg flex-1 min-h-[120px] flex flex-col justify-center`}>
        <div className="flex items-center space-x-4 relative z-10">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 border border-opacity-20 ${colorClass.replace('text-', 'border-')}`}>
                <i className={`fas ${icon} text-sm`}></i>
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className={`text-xs font-black uppercase tracking-tight truncate ${colorClass}`}>{value && value !== 'None' ? value : 'UNDEFINED'}</p>
                {sub && <p className="text-[6px] text-slate-500 font-bold uppercase mt-0.5 tracking-widest">{sub}</p>}
            </div>
        </div>
    </div>
  );

  const inputClass = "bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all cursor-pointer appearance-none";
  const labelClass = "text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-widest";
  const subTitleClass = "text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-3 mb-6";

  const HypoCard = ({ title, setup, hypoSession, hypoThen, zone, contTrigger, revTrigger, invalidation, exit, prefix, playbooks }: any) => {
    const isLong = title === 'LONG HYPOTHESIS';
    const selectWrapClass = "relative group";
    const chevronIcon = <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 group-hover:text-blue-500 pointer-events-none text-[10px]"></i>;

    const activePlaybook = useMemo(() => playbooks.find((p: Playbook) => p.name === setup), [playbooks, setup]);

    const TooltipDialog = ({ label, content }: { label: string, content?: string }) => (
      <div className="absolute bottom-full mb-3 left-0 hidden group-hover/tooltip:block z-[150] animate-in fade-in zoom-in-95 duration-200 min-w-[260px] max-w-[400px] pointer-events-none">
        <div className="bg-[#0b1222] border border-slate-700 p-5 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Protocol: {label}</p>
          <p className="text-[11px] text-slate-100 leading-relaxed font-bold italic whitespace-pre-wrap">
            {content || "Niciun protocol definit în Playbook pentru acest setup."}
          </p>
          <div className="absolute top-full -mt-1.5 left-8 w-3 h-3 bg-[#0b1222] border-r border-b border-slate-700 rotate-45"></div>
        </div>
      </div>
    );

    return (
      <div className={`bg-slate-950/40 border ${isLong ? 'border-emerald-500/20' : 'border-red-500/20'} p-8 rounded-[2.5rem] relative overflow-hidden flex-1`}>
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white ${isLong ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-red-600 shadow-red-600/20'} shadow-lg`}>
                  {isLong ? 'L' : 'S'}
               </div>
               <h4 className={`text-lg font-black ${isLong ? 'text-emerald-400' : 'text-red-400'} uppercase tracking-tight`}>{title}</h4>
            </div>
            {activePlaybook && (
              <div className="flex items-center space-x-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                 <i className="fas fa-link text-[8px] text-indigo-400"></i>
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Protocol Linked</span>
              </div>
            )}
         </div>
         <div className="grid grid-cols-2 gap-6">
            <div className={selectWrapClass}><label className={labelClass}>KEY LEVEL</label><select className={inputClass} value={zone} onChange={e => setFormData({...formData, [`zoneOfInterest${prefix}`]: e.target.value})}>{KEY_LEVELS.map(o => <option key={o}>{o}</option>)}</select>{chevronIcon}</div>
            <div className={selectWrapClass}><label className={labelClass}>ACTIVATED SETUP</label><select className={inputClass} value={setup} onChange={e => setFormData({...formData, [`setup${prefix}`]: e.target.value})}>{setupOptions.map(o => <option key={o}>{o}</option>)}</select>{chevronIcon}</div>
            <div className={selectWrapClass}><label className={labelClass}>DURING SESSION</label><select className={inputClass} value={hypoSession} onChange={e => setFormData({...formData, [`hypoSession${prefix}`]: e.target.value})}>{['None', 'NY Morning', 'NY Afternoon', 'London', 'Asia'].map(o => <option key={o}>{o}</option>)}</select>{chevronIcon}</div>
            <div className={selectWrapClass}><label className={labelClass}>IN 30 MIN SESSION</label><select className={inputClass} value={hypoThen} onChange={e => setFormData({...formData, [`hypoThen${prefix}`]: e.target.value})}>{SESSION_PERIODS.map(o => <option key={o}>{o}</option>)}</select>{chevronIcon}</div>
            
            <div className={`${selectWrapClass} group/tooltip`}>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass.replace('mb-2', '')}>INVALIDATION</label>
                {activePlaybook && <i className="fas fa-lightbulb text-[8px] text-blue-500 animate-pulse"></i>}
              </div>
              <TooltipDialog label="INVALIDATION POINT" content={activePlaybook?.invalidation} />
              <select className={inputClass} value={invalidation} onChange={e => setFormData({...formData, [`invalidationPoint${prefix}`]: e.target.value})}>{INVALIDATION_LEVELS.map(o => <option key={o}>{o}</option>)}</select>
              {chevronIcon}
            </div>

            <div className={`${selectWrapClass} group/tooltip`}>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass.replace('mb-2', '')}>EXIT LEVEL</label>
                {activePlaybook && <i className="fas fa-lightbulb text-[8px] text-blue-500 animate-pulse"></i>}
              </div>
              <TooltipDialog label="PROFIT TARGET" content={activePlaybook?.target} />
              <select className={inputClass} value={exit} onChange={e => setFormData({...formData, [`exitLevel${prefix}`]: e.target.value})}>{KEY_LEVELS.map(o => <option key={o}>{o}</option>)}</select>
              {chevronIcon}
            </div>

            <div className={selectWrapClass}><label className={labelClass}>CONT. TRIGGER</label><select className={inputClass} value={contTrigger} onChange={e => setFormData({...formData, [`continuationTrigger${prefix}`]: e.target.value})}>{TRIGGERS.map(o => <option key={o}>{o}</option>)}</select>{chevronIcon}</div>
            <div className={selectWrapClass}><label className={labelClass}>REV. TRIGGER</label><select className={inputClass} value={revTrigger} onChange={e => setFormData({...formData, [`reversalTrigger${prefix}`]: e.target.value})}>{TRIGGERS.map(o => <option key={o}>{o}</option>)}</select>{chevronIcon}</div>
         </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[32px] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="px-10 py-10 border-b border-slate-800/40 bg-gradient-to-r from-slate-900/10 to-transparent shrink-0">
          <div className="flex justify-between items-start">
             <div className="flex items-center space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-transform hover:scale-110">
                   <i className="fas fa-rocket text-indigo-500 text-2xl"></i>
                </div>
                <div className="space-y-1">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">STRATEGY SELECTION: MARKET PREPARATION</h2>
                   <div className="flex items-center space-x-6 pt-2">
                       <div className="flex items-center space-x-3 group">
                           <span className="text-[10px] font-black text-slate-600 group-hover:text-blue-500 transition-colors uppercase tracking-[0.2em]">ANALYSIS DATE:</span>
                           <div className="relative">
                               <input 
                                  type="date" 
                                  value={selectedDate} 
                                  onChange={(e) => setSelectedDate(e.target.value)} 
                                  className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:border-slate-600" 
                               />
                               <i className="fas fa-calendar-alt absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 text-[10px] pointer-events-none"></i>
                           </div>
                       </div>
                   </div>
                </div>
             </div>
             <button onClick={onClose} className="text-slate-600 hover:text-white transition-all p-3 hover:bg-slate-800 rounded-xl">
               <i className="fas fa-times text-2xl"></i>
             </button>
          </div>
        </div>

        <div className="p-10 overflow-y-auto space-y-12 custom-scrollbar bg-[#060b13] hide-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
             <SummaryCard label="Weekly Anchor" value={currentWeekPrep?.weeklyBias || 'NEUTRAL'} sub={`MACRO: ${currentWeekPrep?.priceVsPWeek || 'OUTSIDE PWRANGE'}`} colorClass="text-blue-500" icon="fa-anchor" />
             <SummaryCard label="HTF Structure" value={formData.mediumTermTrend === 'Up' ? 'TRENDING UP' : formData.mediumTermTrend === 'Down' ? 'TRENDING DOWN' : formData.mediumTermTrend === 'Balancing' ? 'BALANCING' : 'NEUTRAL'} sub="SCANNER SYNC ACTIVE" colorClass={formData.mediumTermTrend === 'Up' ? 'text-green-500' : formData.mediumTermTrend === 'Down' ? 'text-red-500' : 'text-slate-400'} icon="fa-sitemap" />
             <SummaryCard 
                label="Market State" 
                // FIX: Adăugare safety check pentru toUpperCase pe pdValueRelationship
                value={formData.pdValueRelationship && formData.pdValueRelationship !== 'None' ? `#${formData.pdValueRelationship.toUpperCase()}` : 'IN BALANCE'} 
                sub="SCANNER SYNC ACTIVE" 
                colorClass="text-purple-400" 
                icon="fa-chess-rook" 
             />
             <SummaryCard label="Intra-day Regime" value={formData.marketCondition === 'Trend' ? 'MOMENTUM' : formData.marketCondition === 'Bracket' ? 'REVERSION' : 'STABLE'} sub="SCANNER SYNC STEP 5" colorClass="text-cyan-400" icon="fa-gears" />
             <SummaryCard label="High Impact News" value={formData.newsImpact === 'High' ? 'WAITING / RISK' : 'READY TO TRADE'} sub="SCANNER SYNC ACTIVE" colorClass={formData.newsImpact === 'High' ? 'text-red-500' : 'text-emerald-500'} icon="fa-bullhorn" />
          </div>
          
          <section className="bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/40">
             <h4 className={subTitleClass}>TECHNICAL REFERENCES & LEVELS</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="relative group"><label className={labelClass}>ON Range vs pd Range</label><select className={inputClass} value={formData.onRangeVsPDay} onChange={e => setFormData({...formData, onRangeVsPDay: e.target.value as any})}>{ON_RANGE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>ON vs. Settlement</label><select className={inputClass} value={formData.onVsSettlement} onChange={e => setFormData({...formData, onVsSettlement: e.target.value as any})}>{ON_VS_SETTLEMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>ON inventory</label><select className={inputClass} value={formData.onInventory} onChange={e => setFormData({...formData, onInventory: e.target.value as any})}>{INVENTORY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>pd Extremes</label><select className={inputClass} value={formData.pdExtremes} onChange={e => setFormData({...formData, pdExtremes: e.target.value as any})}>{PD_EXTREMES_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>Untested pdVA</label><select className={inputClass} value={formData.untestedPdVA} onChange={e => setFormData({...formData, untestedPdVA: e.target.value as any})}>{UNTESTED_VA_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>pd vPOC</label><select className={inputClass} value={formData.priorVPOC} onChange={e => setFormData({...formData, priorVPOC: e.target.value as any})}>{PRIOR_VPOC_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
             </div>

             <h4 className={subTitleClass}>OPENING & IB DYNAMICS (CRITICAL FOR PLAYBOOK)</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="relative group"><label className={labelClass}>Open Type</label><select className={inputClass} value={formData.openType} onChange={e => setFormData({...formData, openType: e.target.value as any})}>{OPEN_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>IB Width</label><select className={inputClass} value={formData.ibWidth} onChange={e => setFormData({...formData, ibWidth: e.target.value as any})}>{IB_WIDTH_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
                <div className="relative group"><label className={labelClass}>Range Extension</label><select className={inputClass} value={formData.rangeExtension} onChange={e => setFormData({...formData, rangeExtension: e.target.value as any})}>{RANGE_EXT_OPTIONS.map(o => <option key={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-4 top-1/2 mt-2 text-slate-700 pointer-events-none text-[10px]"></i></div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div><label className={labelClass}>SP HIGH</label><input type="text" className={inputClass} placeholder="e.g. 18250.25" value={formData.spHigh} onChange={e => setFormData({...formData, spHigh: e.target.value})} /></div>
                <div><label className={labelClass}>SP LOW</label><input type="text" className={inputClass} placeholder="e.g. 18230.75" value={formData.spLow} onChange={e => setFormData({...formData, spLow: e.target.value})} /></div>
                <div><label className={labelClass}>GAP HIGH</label><input type="text" className={inputClass} placeholder="e.g. 18300.00" value={formData.gapHigh} onChange={e => setFormData({...formData, gapHigh: e.target.value})} /></div>
                <div><label className={labelClass}>GAP LOW</label><input type="text" className={inputClass} placeholder="e.g. 18285.50" value={formData.gapLow} onChange={e => setFormData({...formData, gapLow: e.target.value})} /></div>
             </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <section className="bg-blue-600/5 border border-blue-500/20 p-10 rounded-[3rem] relative overflow-hidden group"><div className="flex items-center space-x-4 mb-10"><div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><i className="fas fa-robot text-sm"></i></div><h5 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">STRATEGIC PROTOCOL GENERATED</h5></div><div className="space-y-4 relative z-10">{strategicProtocol.length > 0 ? strategicProtocol.map((line, idx) => (<div key={idx} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-start space-x-4 hover:border-blue-500/50 transition-all"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><p className="text-[10px] font-black text-white uppercase tracking-tight leading-relaxed">{line}</p></div>)) : (<div className="py-6 flex flex-col items-center justify-center opacity-40"><i className="fas fa-microscope text-2xl text-slate-700 mb-4"></i><p className="text-[9px] font-black uppercase text-slate-600">CALCULATING STRATEGIC CONTEXT...</p></div>)}</div></section>
            <section className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[3rem] relative overflow-hidden group"><div className="flex items-center space-x-4 mb-10"><div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20"><i className="fas fa-puzzle-piece text-sm"></i></div><h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">PLAYBOOK ACTIVATION: POTENTIAL SETUPS</h5></div>{suggestedSetups.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">{suggestedSetups.map(pb => (<div key={pb.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 hover:border-indigo-500/50 transition-all shadow-inner relative overflow-hidden"><span className="text-2xl relative z-10">{pb.icon}</span><div><p className="text-[10px] font-black text-white uppercase tracking-tight">{pb.name}</p><p className="text-[8px] text-slate-500 font-bold uppercase relative z-10">{pb.entryAt}</p></div><div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div></div>))}</div>) : (<div className="py-6 flex flex-col items-center justify-center opacity-40"><i className="fas fa-search text-2xl text-slate-700 mb-4"></i><p className="text-[9px] font-black uppercase tracking-widest text-slate-600">CONFIGUREAZĂ REFERINȚELE PENTRU ACTIVARE</p></div>)}</section>
          </div>

          <section className="bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/40 relative"><div className="flex items-center space-x-3 mb-10"><div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-[10px] text-orange-400 font-black border border-orange-500/20">2</div><h3 className="text-sm font-black text-orange-400 uppercase tracking-[0.2em]">HYPOTHESIS GENERATION (SCENARIOS)</h3></div><div className="flex flex-col xl:flex-row gap-8"><HypoCard title="LONG HYPOTHESIS" setup={formData.setup} hypoSession={formData.hypoSession} hypoThen={formData.hypoThen} zone={formData.zoneOfInterest} contTrigger={formData.continuationTrigger} revTrigger={formData.reversalTrigger} invalidation={formData.invalidationPoint} exit={formData.exitLevel} prefix="" playbooks={playbooks} /><HypoCard title="SHORT HYPOTHESIS" setup={formData.setup2} hypoSession={formData.hypoSession2} hypoThen={formData.hypoThen2} zone={formData.zoneOfInterest2} contTrigger={formData.continuationTrigger2} revTrigger={formData.reversalTrigger2} invalidation={formData.invalidationPoint2} exit={formData.exitLevel2} prefix="2" playbooks={playbooks} /></div></section>
          <section className="bg-slate-900/10 p-10 rounded-[3rem] border border-slate-800/40"><div className="flex items-center space-x-3 mb-10"><div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-black border border-blue-500/20">3</div><h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">VISUAL ANALYSIS & KEY LEVELS (SCREENSHOTS)</h3></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{(formData.prepScreenshots || []).map((shot, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden group relative transition-all hover:border-blue-500/30"><div className="relative aspect-video bg-black flex items-center justify-center border-b border-slate-800"><img src={shot.url} className="w-full h-full object-contain" alt="Prep Chart" /><button onClick={() => setFormData({...formData, prepScreenshots: formData.prepScreenshots?.filter((_, i) => i !== idx)})} className="absolute top-6 right-6 bg-red-600/90 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl"><i className="fas fa-times"></i></button></div><div className="p-6"><input type="text" value={shot.caption} onChange={e => setFormData({...formData, prepScreenshots: formData.prepScreenshots?.map((s, i) => i === idx ? { ...s, caption: e.target.value } : s)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-slate-300 outline-none" placeholder="Add technical note..." /></div></div>))}{(formData.prepScreenshots?.length || 0) < 5 && (<div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-800 rounded-[2.5rem] p-12 flex flex-col items-center justify-center transition-all cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 group min-h-[300px]"><input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*" /><div className="w-20 h-20 rounded-full bg-slate-900 text-slate-700 flex items-center justify-center mb-6 group-hover:text-blue-500 group-hover:scale-110 transition-all"><i className="fas fa-camera text-3xl"></i></div><p className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-600">UPLOAD CHART ANALYSIS</p></div>)}</div></section>
          <div><label className={labelClass}>DAILY NARRATIVE & CONTEXTUAL NOTES</label><textarea className={`${inputClass} h-40 resize-none leading-relaxed p-6`} value={formData.dailyNarrative} onChange={e => setFormData({...formData, dailyNarrative: e.target.value})} placeholder="Descrie contextul zilei, sentimentul pieței și așteptările tale..." /></div>
          <div className="pt-10 flex space-x-6 sticky bottom-0 bg-[#060b13] pb-10 z-20 border-t border-slate-800/50 mt-10"><button onClick={onClose} type="button" className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-xl">ANULEAZĂ</button><button onClick={() => onSave(selectedDate, formData)} type="button" className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 uppercase tracking-widest text-[11px] active:scale-95">FINALIZEAZĂ PREGĂTIREA</button></div>
        </div>
      </div>
    </div>
  );
};

export default DailyPrepModal;
