
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DailyPrepData, PdValueRelationship, MarketCondition, MediumTermTrend, 
  ONInventory, NewsImpactType, BiasType, Playbook
} from '../types';
import { Language } from '../translations';

interface DailyPrepModalProps {
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
  allPreps?: Record<string, DailyPrepData>;
  playbooks: Playbook[];
  language: Language;
}

const INSTRUMENT_LIST = ['ES', 'NQ', 'MES', 'MNQ', 'GC', 'MGC', 'MBT', 'CL'];
const PD_VALUE_OPTIONS = ['None', 'InsideRange', 'InBalance', 'OutsideVA', 'GAP'];
const MARKET_CONDITION_OPTIONS = ['None', 'Bracket', 'Trend', 'Transition'];
const PRICE_VS_PWEEK_OPTIONS = ['None', 'inside week', 'breakout mode', 'balance'];
const MEDIUM_TERM_TREND_OPTIONS = ['None', 'Up', 'Down', 'Balancing'];
const ON_RANGE_OPTIONS = ['None', 'Inside', 'Outside'];
const INVENTORY_OPTIONS = ['None', 'Long', 'Short', 'Net Zero'];
const PD_EXTREMES_OPTIONS = ['None', 'Poor High', 'Poor Low', 'Both'];
const UNTESTED_VA_OPTIONS = ['None', 'High', 'Low', 'Both'];
const PRIOR_VPOC_OPTIONS = ['None', 'naked', 'tapped'];
const ON_VS_SETTLEMENT_OPTIONS = ['None', 'lower', 'higher'];
const NEWS_IMPACT_OPTIONS: NewsImpactType[] = ['None', 'Low', 'Medium', 'High'];
const BIAS_OPTIONS: BiasType[] = ['Neutral', 'Bullish', 'Bearish'];

const TECHNICAL_LEVELS = [
  'None', 'pdHigh', 'pdLow', 'pdEQ', 'pdOpen', 'pdVAH', 'pdPOC', 'pdVAL', 'pdVWAPc', 'Settlement', 
  'ONH', 'ONL', 'NY IB High', 'NY IB Low', 'NY Open', 'NY VWAP', 'NY IB ext 1', 'NY IB ex 2', 
  'dHigh', 'dVAH', 'dVAL', 'dVWAP', 'dLow', 'dOpen', 'GAP high', 'GAP low', 'IB low', 'IB high', 
  'SP', '4h High', '4h Low', 'pwHigh', 'pwLow', 'pwEQ', 'pwVAH', 'pwVAL', 'pwOpen', 'pwVWAPc', 
  'wHigh', 'wLow', 'wOpen', 'wVWAP', 'range VAL', 'range VAH', 'range POC', 'ndPOC', 'nwPOC', 
  'ndOpen', 'nwOpen', 'nmOpen', 'pmHigh', 'pmLow', 'pmOpen', 'pmVAH', 'pmVAL', 'mOpen', 
  'pmEQ', 'mVWAP'
];

const HYPO_SESSIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
const HYPO_DURING_OPTIONS = ['New York', 'London', 'Asia', 'None'];
const HYPO_CONT_TRIGGERS = ['None', 'Aggressive Delta', 'Velocity', 'Stacked Imbalance'];
const HYPO_REV_TRIGGERS = ['None', 'Absorbtion', 'Delta Divergence', 'Exhaustion'];
const HYPO_INVALIDATIONS = ['None', 'back in pdVA', 'Value building outside pd Extremes'];

const DailyPrepModal: React.FC<DailyPrepModalProps> = ({ onSave, onClose, initialData, initialDate, allPreps, playbooks, language }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const setupOptions = useMemo(() => {
    const list = playbooks.map(p => p.name);
    if (!list.includes('None')) list.push('None');
    return list;
  }, [playbooks]);

  const defaultState: DailyPrepData = {
    gkPhysicalEnergy: 5, gkMentalClarity: 5, gkEmotionalCalm: 5, gkProcessConfidence: 5,
    gkSleepHours: 7, gkMeditation: false, gkExercise: false, gkNutrition: 5,
    gkDoNotDisturb: false, gkPlanWritten: false, gkDouglasAffirmation: false, gkStoicAffirmation: false,
    gkTotalScore: 20, gkVerdict: 'Red',
    instrument: 'NQ', pdValueRelationship: 'None', marketCondition: 'None', priceVsPWeek: 'None', mediumTermTrend: 'None',
    onRangeVsPDay: 'None', onInventory: 'None', pdExtremes: 'None', untestedPdVA: 'None',
    spHigh: '', spLow: '', gapHigh: '', gapLow: '', priorVPOC: 'None', onVsSettlement: 'None',
    newsImpact: 'None', bias: 'Neutral', dailyNarrative: '',
    setup: 'None', hypoSession: 'A', hypoThen: 'None', zoneOfInterest: 'None', continuationTrigger: 'None', reversalTrigger: 'None', invalidationPoint: 'None', exitLevel: 'None',
    setup2: 'None', hypoSession2: 'A', hypoThen2: 'None', zoneOfInterest2: 'None', continuationTrigger2: 'None', reversalTrigger2: 'None', invalidationPoint2: 'None', exitLevel2: 'None',
    habNoGoRespected: false, habPreMarketDone: false, habStopLossRespected: false, habNoRevengeTrading: false, habJournalCompleted: false, habJournalCompleted2: false, habDisciplineScore: 5,
    pmrTradedPlan: 'None', pmrDifficultMoment: '', pmrDailyLesson: '',
    prepScreenshots: []
  } as any;

  const [formData, setFormData] = useState<DailyPrepData>(defaultState);

  useEffect(() => {
    const total = Number(formData.gkPhysicalEnergy) + Number(formData.gkMentalClarity) + Number(formData.gkEmotionalCalm) + Number(formData.gkProcessConfidence);
    let verdict: 'Green' | 'Yellow' | 'Red' = 'Red';
    if (total > 32) verdict = 'Green';
    else if (total >= 25) verdict = 'Yellow';
    if (formData.gkTotalScore !== total || formData.gkVerdict !== verdict) {
        setFormData(prev => ({ ...prev, gkTotalScore: total, gkVerdict: verdict }));
    }
  }, [formData.gkPhysicalEnergy, formData.gkMentalClarity, formData.gkEmotionalCalm, formData.gkProcessConfidence]);

  useEffect(() => {
    if (allPreps && allPreps[selectedDate]) {
      setFormData(allPreps[selectedDate]);
    } else if (selectedDate === initialDate && initialData) {
      setFormData(initialData);
    } else {
        setFormData(defaultState);
    }
  }, [selectedDate, allPreps, initialDate, initialData]);

  // LOGICA FILTRARE SETUPURI POSIBILE
  const suggestedSetups = useMemo(() => {
    const names = new Set<string>();
    
    // Level 1: Macro
    if (formData.pdValueRelationship === 'GAP') {
        names.add('The GAP & Go'); names.add('The GAP Fill'); names.add('The Half-Gap Fill');
    }
    if (formData.pdValueRelationship === 'InsideRange') {
        names.add('Inside Value Fade'); names.add('Inside Day Breakout'); names.add('Overnight Inventory Correction');
    }
    if (formData.pdValueRelationship === 'InBalance') {
        names.add('Inside Value Fade');
    }
    if (formData.pdValueRelationship === 'OutsideVA') {
        names.add('The 80% Rule'); names.add('Failed Auction');
    }

    // Level 3: Regime
    if (formData.marketCondition === 'Trend') {
        names.add('Trend Day'); names.add('Double Distribution Trend'); names.add('Weak Low/High Cascade');
    }
    if (formData.marketCondition === 'Bracket') {
        names.add('Inside Value Fade'); names.add('VWAP Reversion');
    }

    // Level 4: Location
    if (formData.pdExtremes !== 'None') {
        names.add('Poor High/Low Repair');
    }
    if (formData.priorVPOC === 'naked') {
        names.add('Naked POC Magnet');
    }

    // Mapare obiecte Playbook
    return playbooks.filter(pb => names.has(pb.name));
  }, [formData.pdValueRelationship, formData.marketCondition, formData.pdExtremes, formData.priorVPOC, playbooks]);

  const recommendations = useMemo(() => {
    const recs = [];
    if (formData.newsImpact === 'High') recs.push("Expect high Volatility");
    if (formData.pdValueRelationship === 'InsideRange') recs.push("Look for rotational moves between previous day range extremes");
    if (formData.pdValueRelationship === 'InBalance') recs.push("Market is balanced; expect POC focus and low conviction unless broken.");
    if (formData.pdValueRelationship === 'OutsideVA') recs.push("Look for high convictional moves or failed auction at the edges.");
    if (formData.pdValueRelationship === 'GAP') recs.push("Expect GAP fill or aggressive Drive in the direction of the GAP.");
    if (formData.marketCondition === 'Bracket') recs.push("Look for reversal trades at pdExtremes and pdVAs");
    if (formData.marketCondition === 'Trend') recs.push("Look for trend continuation and enter at small pullbacks");
    if (formData.marketCondition === 'Transition') recs.push("Look for building value outside pdExtremes");
    if (formData.mediumTermTrend === 'Up') recs.push("Keep Longs longer and take fast TP for shorts");
    if (formData.mediumTermTrend === 'Down') recs.push("Keep Shorts longer and take fast TP for longs");
    if (formData.onInventory === 'Long') recs.push("Expect sharp sell during Cash session to fill the GAP");
    if (formData.onInventory === 'Short') recs.push("Expect sharp buy during Cash session to fill the GAP");
    return recs;
  }, [formData.pdValueRelationship, formData.marketCondition, formData.mediumTermTrend, formData.onInventory, formData.newsImpact]);

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

  const inputClass = "bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full text-slate-100 placeholder:text-slate-700 transition-all cursor-pointer";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";
  const sectionHeaderClass = "flex items-center space-x-3 mb-4";
  const subTitleClass = "text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-3 mb-6";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800 rounded-[24px] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#060b13] z-20">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black flex items-center tracking-tight uppercase text-white italic">
               <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mr-4 shadow-lg shadow-indigo-600/20 not-italic">
                  <i className="fas fa-rocket text-sm"></i>
               </div>
              START MY DAY: MARKET PREPARATION
            </h2>
            <div className="flex items-center mt-3 ml-14 space-x-6">
                <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ANALYSIS DATE:</span>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div className="p-10 overflow-y-auto space-y-16 custom-scrollbar bg-[#060b13]">
          
          {/* SECTION 0: GATEKEEPER */}
          <section className="bg-slate-900/10 p-10 rounded-[2.5rem] border border-slate-800/40 relative overflow-hidden group">
             <div className={sectionHeaderClass}>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-400 font-black border border-indigo-500/20">0</div>
                <h3 className="text-base font-black text-indigo-400 uppercase tracking-[0.2em]">PRE-MARKET: EVALUAREA STĂRII DE PREGĂTIRE (THE GATEKEEPER)</h3>
             </div>
             <p className="text-slate-500 text-sm font-medium italic mb-10 max-w-3xl leading-relaxed">
               Înainte de a deschide orice grafic, trebuie să treci de acest "filtru". Dacă nu ești apt mental, nu ai voie să atingi tastatura.
             </p>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
                <div className="space-y-8">
                    <h4 className={subTitleClass}>1. ANALIZA BIO-PSIHO-SOCIALĂ (SCOR 1-10)</h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Energie Fizică', sub: '(Somn, odihnă)', key: 'gkPhysicalEnergy' },
                            { label: 'Claritate Mentală', sub: '(Fără distrageri)', key: 'gkMentalClarity' },
                            { label: 'Calm Emoțional', sub: '(Fără frustrare/euforie)', key: 'gkEmotionalCalm' },
                            { label: 'Încredere în Proces', sub: '(Focus pe execuție)', key: 'gkProcessConfidence' }
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between bg-[#0b1222] p-6 rounded-2xl border border-slate-800/60 hover:border-slate-700 transition-all shadow-inner group/item">
                                <div>
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[10px] text-slate-500 font-bold ml-2 italic">{item.sub}</span>
                                </div>
                                <input 
                                    type="number" min="1" max="10" 
                                    value={(formData as any)[item.key]} 
                                    onChange={e => setFormData({...formData, [item.key]: parseInt(e.target.value) || 0})} 
                                    className="bg-slate-900 border border-slate-800 w-14 h-11 rounded-xl text-center text-xl font-black text-indigo-400 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-[#0b1222] p-6 rounded-2xl border border-slate-800/60">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ore de somn</span>
                            <input type="number" value={formData.gkSleepHours || 0} onChange={e => setFormData({...formData, gkSleepHours: parseInt(e.target.value)})} className="bg-transparent border-none p-0 text-2xl font-black text-white focus:ring-0 outline-none w-full" />
                        </div>
                        <div className="bg-[#0b1222] p-6 rounded-2xl border border-slate-800/60">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nutriție/Hidratare</span>
                            <input type="number" min="1" max="10" value={formData.gkNutrition || 0} onChange={e => setFormData({...formData, gkNutrition: parseInt(e.target.value)})} className="bg-transparent border-none p-0 text-2xl font-black text-white focus:ring-0 outline-none w-full" />
                        </div>
                    </div>
                </div>
                <div className="space-y-8">
                    <h4 className={subTitleClass}>2. LISTA DE VERIFICARE A MEDIULUI ȘI PLANULUI</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { label: 'Telefonul este pe "Do Not Disturb" / Distrageri eliminate', key: 'gkDoNotDisturb' },
                            { label: 'Planul de trading tehnic este scris (niveluri cheie identificate)', key: 'gkPlanWritten' },
                            { label: 'Afirmația Douglas: "Accept complet riscul la trade-urile de azi..."', key: 'gkDouglasAffirmation' },
                            { label: 'Afirmația Stoică: "Nu pot controlar piața, pot controla doar intrarea..."', key: 'gkStoicAffirmation' },
                            { label: 'Meditație / Breathwork finalizat', key: 'gkMeditation' },
                            { label: 'Sport / Activitate fizică (azi)', key: 'gkExercise' }
                        ].map(item => (
                            <label key={item.key} className="flex items-center space-x-5 p-5 bg-[#0b1222] rounded-2xl border border-slate-800/60 hover:bg-slate-800/20 cursor-pointer transition-all shadow-inner group/check">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${ (formData as any)[item.key] ? 'bg-indigo-600 border-indigo-500 shadow-lg' : 'bg-slate-950 border-slate-800' } border`}>
                                    <input type="checkbox" checked={(formData as any)[item.key]} onChange={e => setFormData({...formData, [item.key]: e.target.checked})} className="hidden" />
                                    { (formData as any)[item.key] && <i className="fas fa-check text-xs text-white"></i> }
                                </div>
                                <span className="text-xs font-bold text-slate-300 group-hover/check:text-slate-100 transition-colors">{item.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
             </div>
             <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-10 border-t border-slate-800/60">
                <div className="flex items-center space-x-8 shrink-0">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">GATEKEEPER SCORE:</span>
                    <span className={`text-7xl font-black tracking-tighter ${formData.gkVerdict === 'Green' ? 'text-green-500' : formData.gkVerdict === 'Yellow' ? 'text-yellow-500' : 'text-red-500'}`}>{formData.gkTotalScore} <span className="text-3xl text-slate-800">/ 40</span></span>
                </div>
                <div className={`flex-1 w-full flex items-center space-x-6 p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-700 ${formData.gkVerdict === 'Green' ? 'bg-green-500/5 border-green-500/20 shadow-green-900/10' : formData.gkVerdict === 'Yellow' ? 'bg-yellow-500/5 border-yellow-500/20 shadow-yellow-900/10' : 'bg-red-500/5 border-red-500/20 shadow-red-900/10'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-2xl ${formData.gkVerdict === 'Green' ? 'bg-green-500' : formData.gkVerdict === 'Yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        <i className={`fas ${formData.gkVerdict === 'Green' ? 'fa-check' : formData.gkVerdict === 'Yellow' ? 'fa-exclamation-triangle' : 'fa-times'} text-white text-3xl`}></i>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">VERDICT: {formData.gkVerdict === 'Green' ? 'TRADING ENABLED' : formData.gkVerdict === 'Yellow' ? 'CAUTION ADVISED' : 'TRADING HALTED'}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          {formData.gkVerdict === 'Green' ? 'Sistemul de protecție a evaluat starea ta ca fiind optimă. Execută planul cu încredere.' : 
                           formData.gkVerdict === 'Yellow' ? 'Starea ta este degradată. Tranzacționează cu mărime redusă (-50%) și focus maxim.' : 
                           'OPREȘTE-TE! Nu ești într-o stare optimă pentru execuție. Mergi la plimbare sau fă backtesting.'}
                        </p>
                    </div>
                </div>
             </div>
             <i className="fas fa-shield-halved absolute -bottom-16 -right-16 text-[250px] text-white/[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000"></i>
          </section>

          {/* SECTION 1: CONTEXT & PREP */}
          <section>
            <div className={sectionHeaderClass}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xs text-purple-400 font-black border border-purple-500/20">1</div>
              <h3 className="text-base font-black text-purple-400 uppercase tracking-[0.2em]">CONTEXT & PREP (MP PROTOCOL)</h3>
            </div>
            
            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div><label className={labelClass}>Instrument</label><select className={inputClass} value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})}>{INSTRUMENT_LIST.map(o => <option key={o}>{o}</option>)}</select></div>
                    <div><label className={labelClass}>MT Trend</label><select className={inputClass} value={formData.mediumTermTrend} onChange={e => setFormData({...formData, mediumTermTrend: e.target.value as any})}>{MEDIUM_TERM_TREND_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                    <div><label className={labelClass}>Bias</label><select className={inputClass} value={formData.bias} onChange={e => setFormData({...formData, bias: e.target.value as any})}>{BIAS_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                    <div><label className={labelClass}>News Impact</label><select className={inputClass} value={formData.newsImpact} onChange={e => setFormData({...formData, newsImpact: e.target.value as any})}>{NEWS_IMPACT_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                </div>

                <div className="bg-[#0b1222]/40 p-8 rounded-3xl border border-slate-800/40">
                    <h4 className={subTitleClass}>MARKET PROFILE REFERENCES</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div><label className={labelClass}>Price vs pdRange</label><select className={inputClass} value={formData.pdValueRelationship} onChange={e => setFormData({...formData, pdValueRelationship: e.target.value as any})}>{PD_VALUE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>Market Condition</label><select className={inputClass} value={formData.marketCondition} onChange={e => setFormData({...formData, marketCondition: e.target.value as any})}>{MARKET_CONDITION_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>Price vs pWeek</label><select className={inputClass} value={formData.priceVsPWeek} onChange={e => setFormData({...formData, priceVsPWeek: e.target.value})}>{PRICE_VS_PWEEK_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>ON Range vs pDay</label><select className={inputClass} value={formData.onRangeVsPDay} onChange={e => setFormData({...formData, onRangeVsPDay: e.target.value as any})}>{ON_RANGE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>ON Inventory</label><select className={inputClass} value={formData.onInventory} onChange={e => setFormData({...formData, onInventory: e.target.value as any})}>{INVENTORY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>PD Extremes</label><select className={inputClass} value={formData.pdExtremes} onChange={e => setFormData({...formData, pdExtremes: e.target.value as any})}>{PD_EXTREMES_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>Untested pdVA</label><select className={inputClass} value={formData.untestedPdVA} onChange={e => setFormData({...formData, untestedPdVA: e.target.value as any})}>{UNTESTED_VA_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>Prior vPOC</label><select className={inputClass} value={formData.priorVPOC} onChange={e => setFormData({...formData, priorVPOC: e.target.value as any})}>{PRIOR_VPOC_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                        <div><label className={labelClass}>ON vs Settlement</label><select className={inputClass} value={formData.onVsSettlement} onChange={e => setFormData({...formData, onVsSettlement: e.target.value as any})}>{ON_VS_SETTLEMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-800/40">
                        <div><label className={labelClass}>SP High</label><input type="text" className={inputClass} value={formData.spHigh} onChange={e => setFormData({...formData, spHigh: e.target.value})} placeholder="e.g. 18250.25" /></div>
                        <div><label className={labelClass}>SP Low</label><input type="text" className={inputClass} value={formData.spLow} onChange={e => setFormData({...formData, spLow: e.target.value})} placeholder="e.g. 18230.75" /></div>
                        <div><label className={labelClass}>GAP High</label><input type="text" className={inputClass} value={formData.gapHigh} onChange={e => setFormData({...formData, gapHigh: e.target.value})} placeholder="e.g. 18300.00" /></div>
                        <div><label className={labelClass}>GAP Low</label><input type="text" className={inputClass} value={formData.gapLow} onChange={e => setFormData({...formData, gapLow: e.target.value})} placeholder="e.g. 18285.50" /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* ALGORITM RECOMANDĂRI STRATEGICE */}
                    {recommendations.length > 0 && (
                    <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] shadow-[0_0_40px_rgba(59,130,246,0.05)] relative overflow-hidden">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                <i className="fas fa-robot"></i>
                            </div>
                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">STRATEGIC PROTOCOL GENERATED</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {recommendations.map((rec, i) => (
                            <div key={i} className="flex items-center space-x-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                <span className="text-xs font-black text-slate-200 uppercase tracking-tight">{rec}</span>
                            </div>
                            ))}
                        </div>
                        <i className="fas fa-brain absolute -bottom-10 -right-10 text-[150px] text-white/[0.02] pointer-events-none"></i>
                    </div>
                    )}

                    {/* SETUPURI POSIBILE DATORITĂ CONTEXTULUI */}
                    <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <i className="fas fa-puzzle-piece"></i>
                            </div>
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">PLAYBOOK ACTIVATION: POTENTIAL SETUPS</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {suggestedSetups.length > 0 ? suggestedSetups.map(pb => (
                                <div key={pb.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center space-x-3 group hover:border-indigo-500/50 transition-all">
                                    <span className="text-xl">{pb.icon}</span>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{pb.name}</p>
                                        <p className="text-[8px] text-indigo-400 font-bold uppercase">{pb.entryAt}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-10 text-center opacity-20">
                                    <i className="fas fa-search text-2xl mb-2"></i>
                                    <p className="text-[9px] font-black uppercase">Configurează referințele pentru activare</p>
                                </div>
                            )}
                        </div>
                        <i className="fas fa-chess absolute -bottom-10 -right-10 text-[150px] text-white/[0.02] pointer-events-none"></i>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>DAILY NARRATIVE & CONTEXTUAL NOTES</label>
                    <textarea className={`${inputClass} h-32 resize-none leading-relaxed p-6`} value={formData.dailyNarrative} onChange={e => setFormData({...formData, dailyNarrative: e.target.value})} placeholder="Descrie contextul zilei, sentimentul pieței și așteptările tale bazate pe volume..." />
                </div>
            </div>
          </section>

          {/* SECTION 2: HYPOTHESIS GENERATION */}
          <section className="bg-slate-900/20 p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative">
            <div className={sectionHeaderClass}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xs text-orange-500 font-black border border-orange-500/20">2</div>
              <h3 className="text-base font-black text-orange-500 uppercase tracking-[0.2em]">HYPOTHESIS GENERATION (SCENARIOS)</h3>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* LONG HYPO */}
              <div className="bg-emerald-950/10 border border-emerald-800/30 p-10 rounded-[3rem] space-y-8 shadow-xl relative overflow-hidden group/hypo">
                <div className="flex items-center space-x-4 mb-2 relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">L</div>
                   <h4 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">LONG HYPOTHESIS</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div><label className={labelClass}>KEY LEVEL</label><select className={inputClass} value={formData.zoneOfInterest} onChange={e => setFormData({...formData, zoneOfInterest: e.target.value})}>{TECHNICAL_LEVELS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>ACTIVATED SETUP</label><select className={inputClass} value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})}>{setupOptions.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>DURING SESSION</label><select className={inputClass} value={formData.hypoThen} onChange={e => setFormData({...formData, hypoThen: e.target.value as any})}>{HYPO_DURING_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>IN 30 MIN SESSION</label><select className={inputClass} value={formData.hypoSession} onChange={e => setFormData({...formData, hypoSession: e.target.value})}>{HYPO_SESSIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>INVALIDATION</label><select className={inputClass} value={formData.invalidationPoint} onChange={e => setFormData({...formData, invalidationPoint: e.target.value})}>{HYPO_INVALIDATIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>EXIT LEVEL</label><select className={inputClass} value={formData.exitLevel} onChange={e => setFormData({...formData, exitLevel: e.target.value})}>{TECHNICAL_LEVELS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>CONT. TRIGGER</label><select className={inputClass} value={formData.continuationTrigger} onChange={e => setFormData({...formData, continuationTrigger: e.target.value})}>{HYPO_CONT_TRIGGERS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>REV. TRIGGER</label><select className={inputClass} value={formData.reversalTrigger} onChange={e => setFormData({...formData, reversalTrigger: e.target.value})}>{HYPO_REV_TRIGGERS.map(o => <option key={o}>{o}</option>)}</select></div>
                </div>
                <i className="fas fa-arrow-trend-up absolute -bottom-10 -right-10 text-[200px] text-emerald-500/[0.03] pointer-events-none group-hover/hypo:scale-110 transition-transform duration-1000"></i>
              </div>

              {/* SHORT HYPO */}
              <div className="bg-rose-950/10 border border-rose-800/30 p-10 rounded-[3rem] space-y-8 shadow-xl relative overflow-hidden group/hypo2">
                <div className="flex items-center space-x-4 mb-2 relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">S</div>
                   <h4 className="text-xl font-black text-rose-400 uppercase tracking-tighter">SHORT HYPOTHESIS</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div><label className={labelClass}>KEY LEVEL</label><select className={inputClass} value={formData.zoneOfInterest2} onChange={e => setFormData({...formData, zoneOfInterest2: e.target.value})}>{TECHNICAL_LEVELS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>ACTIVATED SETUP</label><select className={inputClass} value={formData.setup2} onChange={e => setFormData({...formData, setup2: e.target.value})}>{setupOptions.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>DURING SESSION</label><select className={inputClass} value={formData.hypoThen2} onChange={e => setFormData({...formData, hypoThen2: e.target.value as any})}>{HYPO_DURING_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>IN 30 MIN SESSION</label><select className={inputClass} value={formData.hypoSession2} onChange={e => setFormData({...formData, hypoSession2: e.target.value})}>{HYPO_SESSIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>INVALIDATION</label><select className={inputClass} value={formData.invalidationPoint2} onChange={e => setFormData({...formData, invalidationPoint2: e.target.value})}>{HYPO_INVALIDATIONS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>EXIT LEVEL</label><select className={inputClass} value={formData.exitLevel2} onChange={e => setFormData({...formData, exitLevel2: e.target.value})}>{TECHNICAL_LEVELS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>CONT. TRIGGER</label><select className={inputClass} value={formData.continuationTrigger2} onChange={e => setFormData({...formData, continuationTrigger2: e.target.value})}>{HYPO_CONT_TRIGGERS.map(o => <option key={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>REV. TRIGGER</label><select className={inputClass} value={formData.reversalTrigger2} onChange={e => setFormData({...formData, reversalTrigger2: e.target.value})}>{HYPO_REV_TRIGGERS.map(o => <option key={o}>{o}</option>)}</select></div>
                </div>
                <i className="fas fa-arrow-trend-down absolute -bottom-10 -right-10 text-[200px] text-rose-500/[0.03] pointer-events-none group-hover/hypo2:scale-110 transition-transform duration-1000"></i>
              </div>
            </div>
          </section>

          {/* SECTION 3: VISUAL ANALYSIS & SCREENSHOTS */}
          <section className="bg-slate-900/10 p-10 rounded-[2.5rem] border border-slate-800/40 relative">
             <div className={sectionHeaderClass}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xs text-blue-400 font-black border border-blue-500/20">3</div>
                <h3 className="text-base font-black text-blue-400 uppercase tracking-[0.2em]">VISUAL ANALYSIS & KEY LEVELS (SCREENSHOTS)</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {(formData.prepScreenshots || []).map((shot, idx) => (
                 <div key={idx} className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden group shadow-2xl relative">
                    <div className="relative aspect-video bg-black flex items-center justify-center border-b border-slate-800">
                        <img src={shot.url} className="w-full h-full object-contain" alt={`Prep Chart ${idx + 1}`} />
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, prepScreenshots: formData.prepScreenshots?.filter((_, i) => i !== idx)})} 
                          className="absolute top-6 right-6 bg-red-600/90 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-all"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="p-6 bg-slate-900/50">
                      <input 
                        type="text" 
                        value={shot.caption} 
                        onChange={(e) => setFormData({...formData, prepScreenshots: formData.prepScreenshots?.map((s, i) => i === idx ? { ...s, caption: e.target.value } : s)})} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium" 
                        placeholder="Adaugă observație vizuală / nivel..." 
                      />
                    </div>
                 </div>
               ))}
               {(formData.prepScreenshots?.length || 0) < 10 && (
                 <div 
                   onClick={() => fileInputRef.current?.click()} 
                   className="border-2 border-dashed border-slate-800 rounded-[2.5rem] p-16 flex flex-col items-center justify-center transition-all cursor-pointer bg-[#0b1222]/20 hover:border-blue-500/40 hover:bg-blue-500/5 group min-h-[300px] shadow-inner"
                 >
                   <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                   <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 group-hover:text-blue-400 group-hover:border-blue-500/30 shadow-xl">
                     <i className="fas fa-camera text-3xl"></i>
                   </div>
                   <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-400 transition-colors">Add Preparation Chart ({formData.prepScreenshots?.length || 0}/10)</p>
                   <p className="text-[10px] text-slate-700 uppercase font-bold mt-2 tracking-widest opacity-60">High Resolution Recommended</p>
                 </div>
               )}
            </div>
          </section>

          <div className="pt-10 flex space-x-6 sticky bottom-0 bg-[#060b13] pb-10 z-20 border-t border-slate-800/50 mt-10">
            <button onClick={onClose} type="button" className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-[11px] shadow-xl">Anulează</button>
            <button onClick={() => onSave(selectedDate, formData)} type="button" className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 uppercase tracking-widest text-[11px] active:scale-[0.98]">Finalizează Pregătirea</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPrepModal;
