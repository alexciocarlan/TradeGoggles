
import React, { useState, useMemo, useEffect } from 'react';
import { DailyPrepData, NewsImpactType, MediumTermTrend, PdValueRelationship, OpenType } from '../types';

interface DecisionFunnelModalProps {
  onClose: () => void;
  onSave: (data: Partial<DailyPrepData>) => void;
}

interface FunnelData {
  hasHighImpactNews: boolean | null;
  newsTime: string;
  primaryAsset: string;
  htfStructure: 'Bullish' | 'Bearish' | 'Neutral' | null;
  level1Tag: string | null;
  level1SubTag: string | null;
  level2Tag: string | null;
  level2SubTag: string | null;
  level3Regime: 'Trend' | 'Range' | null;
  level3Tag: string | null;
  level4Tag: string | null;
  level5Tag: string | null;
}

const FUNNEL_CONTENT = {
  level1: [
    { 
      tag: "#GAP", 
      icon: "fa-arrows-up-to-line",
      subtags: [
        { text: "#LargeGap", setup: "#12 The GAP & Go", identifiers: "Deschidere clară în afara pdRange. Se caută agresiune instituțională." },
        { text: "#Exhaustion", setup: "#13 The GAP Fill", identifiers: "Epuizare după salt. Se caută respingere la Open (Rejection)." },
        { text: "#MassiveGap", setup: "#32 The Half-Gap Fill", identifiers: "Gap imens. Probabilitate de magnet spre 50% retracement." }
      ]
    },
    { 
      tag: "#InsideRange", 
      icon: "fa-arrows-left-right-to-line",
      subtags: [
        { text: "#InBalance", setup: "#26 Inside Value Fade", identifiers: "Deschidere în interiorul Valorii. Echilibru. Fading la extreme." },
        { text: "#TightBalance", setup: "#27 IB Extension Failure", identifiers: "Compresie extremă. Așteaptă spargerea IB falsă." },
        { text: "#ExtremeSkew", setup: "#14 Overnight Inventory Correction", identifiers: "Inventar ON debalansat 100%. Reversare spre Settlement." }
      ]
    },
    { 
      tag: "#OutsideVA", 
      icon: "fa-expand",
      subtags: [
        { text: "#Rejection", setup: "#4 The 80% Rule", identifiers: "Acceptare în VA (2 TPO). Țintă: capătul opus al VA." },
        { text: "#FailedBreak", setup: "#5 Failed Auction", identifiers: "Break pdH/L urmat de reîntoarcere violentă. Trap setup." }
      ]
    }
  ],
  level2: [
    { 
      tag: "#StrongDrive", 
      icon: "fa-bolt",
      subtags: [
        { text: "#NoTails", setup: "#1 The Open Drive", identifiers: "Cea mai mare încredere. Fără testare inversă. Instituții agresive.", ot: 'Drive' },
        { text: "#TestFirst", setup: "#2 The Open Test Drive", identifiers: "Testare nivel cheie + respingere. Confirmă direcția.", ot: 'Test driver' }
      ]
    },
    { 
      tag: "#Rejection", 
      icon: "fa-rotate-left",
      subtags: [
        { text: "#FailedPush", setup: "#3 Open Rejection Reverse", identifiers: "Eșec la Open. Respingere promptă a noilor prețuri.", ot: 'Rejection- Reversal' }
      ]
    },
    { 
      tag: "#IB_Struggle", 
      icon: "fa-hand-fist",
      subtags: [
        { text: "#FakeOut", setup: "#27 IB Extension Failure", identifiers: "Lichiditate luată peste IB. Reversare rapidă.", ot: 'Auction' },
        { text: "#NarrowIB", setup: "#15 \"D\" Period Expansion", identifiers: "Range IB mic. Se caută breakout instituțional în perioada D.", ot: 'Auction' }
      ]
    }
  ],
  level3: {
    Trend: [
      { tag: "#Imbalance", setup: "#15 \"D\" Period Expansion", idents: "One Time Framing. Profil subțire. Momentum controlat." },
      { tag: "#SinglePrints", setup: "#22 45-Degree Line Break", idents: "Zonă de volum zero. Cale liberă pentru preț." },
      { tag: "#Cascade", setup: "#22 45-Degree Line Break", idents: "Efect domino prin stopuri la niveluri slabe." }
    ],
    Range: [
      { tag: "#Support/Res", setup: "#34 Neutral Day Fade", idents: "TPO Ledge. Respingeri la prețuri precise." },
      { tag: "#MultiDay", setup: "#37 3-Day Balance Break", idents: "Range de 3 zile suprapus. Energie acumulată." }
    ]
  },
  level4: [
    { tag: "#OldBusiness", setup: "Naked POC Magnet", idents: "Magnetism spre pdPOC neatins ieri." },
    { tag: "#Psychology", setup: "Round Number Magnet", idents: "Atracție spre cifre rotunde (ex. 18000, 5000)." }
  ],
  level5: [
    { tag: "#AFTERNOON", setup: "#17 Lunch Pivot Fade", idents: "Ora 12-14 NY. Volum mic. Rotație spre medie." },
    { tag: "#LATEDAY", setup: "#19 Late Day Ramp / Liquidation", idents: "Mișcare MOC. Repoziționare agresivă finală." },
    { tag: "#ENDOFWEEK", setup: "#38 Weekly POC Magnet", idents: "Săptămână spre final. Magnet wPOC." },
    { tag: "#MULTIDAY", setup: "#37 3-Day Balance Break", idents: "Explozie după coil multi-day." }
  ]
};

const DecisionFunnelModal: React.FC<DecisionFunnelModalProps> = ({ onClose, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [now, setNow] = useState(new Date());
  const [selection, setSelection] = useState<FunnelData>({
    hasHighImpactNews: null,
    newsTime: '',
    primaryAsset: 'NQ (Nasdaq)',
    htfStructure: null,
    level1Tag: null, level1SubTag: null, level2Tag: null, level2SubTag: null, 
    level3Regime: null, level3Tag: null, level4Tag: null, level5Tag: null
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleFinalize = () => {
    const level2Obj = FUNNEL_CONTENT.level2.find(l => l.tag === selection.level2Tag);
    const subTagObj = level2Obj?.subtags.find(st => st.text === selection.level2SubTag);
    const ot = (subTagObj as any)?.ot || 'Auction';

    const updates: Partial<DailyPrepData> = {
        newsImpact: selection.hasHighImpactNews ? 'High' : 'None',
        mediumTermTrend: (selection.htfStructure === 'Bullish' ? 'Up' : selection.htfStructure === 'Bearish' ? 'Down' : selection.htfStructure === 'Neutral' ? 'Balancing' : 'None') as MediumTermTrend,
        bias: (selection.htfStructure === 'Bullish' ? 'Bullish' : selection.htfStructure === 'Bearish' ? 'Bearish' : 'Neutral') as any,
        pdValueRelationship: (selection.level1Tag?.replace('#', '') || 'None') as PdValueRelationship,
        marketCondition: (selection.level3Regime === 'Trend' ? 'Trend' : selection.level3Regime === 'Range' ? 'Bracket' : 'None') as any,
        openType: ot as OpenType,
        ibWidth: selection.level2SubTag === '#NarrowIB' ? 'Narrow' : 'Normal',
        trendYesterday: selection.level5Tag === '#MULTIDAY',
        dailyNarrative: `Scanner Analysis: ${selection.level1SubTag} | Open Type: ${ot} | Regime: ${selection.level3Regime || 'None'}. Confirmed via Protocol 4.5.`
    };

    onSave(updates);
    onClose();
  };

  const canGoNext = useMemo(() => {
    if (activeStep === 0) return selection.hasHighImpactNews === false || (selection.hasHighImpactNews === true && selection.newsTime.length >= 4);
    if (activeStep === 1) return selection.htfStructure !== null;
    if (activeStep === 2) return !!selection.level1SubTag;
    if (activeStep === 3) return !!selection.level2SubTag;
    if (activeStep === 4) return !!selection.level3Regime && !!selection.level3Tag;
    if (activeStep === 5) return !!selection.level4Tag;
    if (activeStep === 6) return !!selection.level5Tag;
    return false;
  }, [activeStep, selection]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col relative min-h-[750px]">
        <div className="p-10 pb-6 border-b border-slate-800/50 bg-slate-950/20">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4"><div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20"><i className="fas fa-filter text-white text-xl"></i></div><div><h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Arbitrage Scanner</h3><p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Conflict Resolution Logic</p></div></div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2"><i className="fas fa-times text-2xl"></i></button>
           </div>
           <div className="flex items-center space-x-2">{[1, 2, 3, 4, 5, 6, 7].map((s, i) => (<div key={s} className="flex-1 flex flex-col space-y-2"><div className={`h-1.5 rounded-full transition-all duration-700 ${i <= activeStep ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`}></div><span className={`text-[7px] font-black text-center uppercase tracking-widest ${i === activeStep ? 'text-white' : 'text-slate-600'}`}>Step {s}</span></div>))}</div>
        </div>
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                {activeStep === 0 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div><h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">1. Volatility Protection</h4><p className="text-sm text-slate-500 font-medium italic">Știri de impact ridicat?</p></div>
                        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl space-y-8">
                            <div className="space-y-4">
                                <div className="flex space-x-4">
                                    <button onClick={() => setSelection({...selection, hasHighImpactNews: true})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${selection.hasHighImpactNews === true ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>DA</button>
                                    <button onClick={() => setSelection({...selection, hasHighImpactNews: false, newsTime: ''})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${selection.hasHighImpactNews === false ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>NU</button>
                                </div>
                            </div>
                            {selection.hasHighImpactNews && (
                                <input type="text" value={selection.newsTime} onChange={(e) => setSelection({...selection, newsTime: e.target.value})} placeholder="Ex: 15:30 CPI" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-white font-bold outline-none focus:ring-1 focus:ring-red-500" />
                            )}
                        </div>
                    </div>
                )}
                {activeStep === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div><h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">2. Higher Timeframe Frame</h4><p className="text-sm text-slate-500 font-medium italic">Bias-ul structural</p></div>
                        <div className="space-y-4">
                            {['Bullish', 'Bearish', 'Neutral'].map(s => (
                                <button key={s} onClick={() => setSelection({...selection, htfStructure: s as any})} className={`w-full p-6 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.htfStructure === s ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}><span className="text-xs font-black text-white uppercase">{s}</span>{selection.htfStructure === s && <i className="fas fa-check-circle text-white"></i>}</button>
                            ))}
                        </div>
                    </div>
                )}
                {activeStep === 2 && (
                    <div className="space-y-8">
                        <div><h4 className="text-2xl font-black text-white uppercase mb-2 italic">3. Contextual Aperture</h4><p className="text-sm text-slate-500 font-medium">Unde deschidem față de Valoarea precedentă?</p></div>
                        <div className="grid grid-cols-3 gap-4">{FUNNEL_CONTENT.level1.map(cat => (<button key={cat.tag} onClick={() => setSelection({...selection, level1Tag: cat.tag, level1SubTag: null})} className={`p-6 rounded-3xl border flex flex-col items-center space-y-4 transition-all ${selection.level1Tag === cat.tag ? 'bg-blue-600 border-blue-400 scale-105' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}><i className={`fas ${cat.icon} text-2xl`}></i><span className="text-xs font-black uppercase">{cat.tag}</span></button>))}</div>
                        {selection.level1Tag && (
                            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2">{FUNNEL_CONTENT.level1.find(c => c.tag === selection.level1Tag)?.subtags.map(st => (<button key={st.text} onClick={() => setSelection({...selection, level1SubTag: st.text})} className={`p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.level1SubTag === st.text ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}><div><span className="text-xs font-black text-white uppercase block mb-1">{st.text}</span><p className="text-[10px] text-slate-500 font-medium">{st.identifiers}</p></div></button>))}</div>
                        )}
                    </div>
                )}
                {activeStep === 3 && (
                    <div className="space-y-8">
                        <div><h4 className="text-2xl font-black text-white mb-2 italic">4. Order Flow Signature</h4><p className="text-sm text-slate-500 font-medium">Cum arată execuția la Open?</p></div>
                        <div className="grid grid-cols-3 gap-4">{FUNNEL_CONTENT.level2.map(cat => (<button key={cat.tag} onClick={() => setSelection({...selection, level2Tag: cat.tag, level2SubTag: null})} className={`p-6 rounded-3xl border flex flex-col items-center space-y-4 transition-all ${selection.level2Tag === cat.tag ? 'bg-blue-600 border-blue-400' : 'bg-slate-900/40 border-slate-800'}`}><i className={`fas ${cat.icon} text-2xl`}></i><span className="text-xs font-black uppercase">{cat.tag}</span></button>))}</div>
                        {selection.level2Tag && (
                            <div className="grid grid-cols-1 gap-3 animate-in fade-in">{FUNNEL_CONTENT.level2.find(c => c.tag === selection.level2Tag)?.subtags.map(st => (<button key={st.text} onClick={() => setSelection({...selection, level2SubTag: st.text})} className={`p-5 rounded-2xl border text-left flex justify-between items-center ${selection.level2SubTag === st.text ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}><div><span className="text-xs font-black text-white uppercase block mb-1">{st.text}</span><p className="text-[10px] text-slate-500 font-medium">{st.identifiers}</p></div></button>))}</div>
                        )}
                    </div>
                )}
                {activeStep === 4 && (
                    <div className="space-y-8">
                        <div><h4 className="text-2xl font-black text-white mb-2 italic">5. Intraday Regime</h4><p className="text-sm text-slate-500 font-medium">Branching: Momentum vs Reversion</p></div>
                        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-8"><button onClick={() => setSelection({...selection, level3Regime: 'Trend', level3Tag: null})} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${selection.level3Regime === 'Trend' ? 'bg-orange-600 text-white' : 'text-slate-50'}`}>MOMENTUM</button><button onClick={() => setSelection({...selection, level3Regime: 'Range', level3Tag: null})} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${selection.level3Regime === 'Range' ? 'bg-blue-600 text-white' : 'text-slate-50'}`}>REVERSION</button></div>
                        {selection.level3Regime && (
                            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">{(FUNNEL_CONTENT.level3 as any)[selection.level3Regime].map((item: any) => (<button key={item.tag} onClick={() => setSelection({...selection, level3Tag: item.tag})} className={`w-full p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.level3Tag === item.tag ? 'bg-white/10 border-white/30' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}><div><span className="text-xs font-black text-white uppercase block mb-1">{item.tag}</span><p className="text-[10px] text-slate-500 font-medium">{item.idents}</p></div></button>))}</div>
                        )}
                    </div>
                )}
                {activeStep === 5 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div><h4 className="text-2xl font-black text-white mb-2 italic">6. Critical Location</h4><p className="text-sm text-slate-500 font-medium">Identifică magneții structurali activi.</p></div>
                        <div className="grid grid-cols-1 gap-4">
                            {FUNNEL_CONTENT.level4.map(item => (
                                <button 
                                    key={item.tag} 
                                    onClick={() => setSelection({...selection, level4Tag: item.tag})} 
                                    className={`p-6 rounded-[2rem] border text-left flex justify-between items-center transition-all ${selection.level4Tag === item.tag ? 'bg-blue-600 border-blue-400 shadow-2xl' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <div>
                                        <span className="text-xs font-black text-white uppercase block mb-1">{item.tag}</span>
                                        <p className="text-[10px] text-slate-500 font-medium">{item.idents}</p>
                                    </div>
                                    {selection.level4Tag === item.tag && <i className="fas fa-check-circle text-white"></i>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {activeStep === 6 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div><h4 className="text-2xl font-black text-white mb-2 italic">7. Final Alignment</h4><p className="text-sm text-slate-500 font-medium">Time Factor Overlays</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {FUNNEL_CONTENT.level5.map(item => (
                                <button 
                                    key={item.tag} 
                                    onClick={() => setSelection({...selection, level5Tag: item.tag})} 
                                    className={`p-6 rounded-[2rem] border text-left space-y-3 transition-all ${selection.level5Tag === item.tag ? 'bg-indigo-600 border-indigo-400 shadow-2xl' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <span className="text-xs font-black text-white uppercase">{item.tag}</span>
                                    <p className="text-[9px] text-slate-400 font-black leading-relaxed uppercase">{item.idents}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="lg:w-80 bg-slate-950/50 border-l border-slate-800/50 p-8 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
                <div><h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Arbitrage Results</h5><div className="space-y-3">
                   {selection.level1SubTag && <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl"><p className="text-[8px] font-black text-blue-500 uppercase mb-1">State Identified</p><p className="text-[10px] font-black text-white uppercase">{selection.level1SubTag}</p></div>}
                   {selection.level2SubTag && <div className="p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl"><p className="text-[8px] font-black text-indigo-500 uppercase mb-1">Flow Identity</p><p className="text-[10px] font-black text-white uppercase">{selection.level2SubTag}</p></div>}
                   {selection.level3Tag && <div className="p-3 bg-emerald-600/10 border border-emerald-500/30 rounded-xl"><p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Execution Logic</p><p className="text-[10px] font-black text-white uppercase">{selection.level3Tag}</p></div>}
                </div></div>
            </div>
        </div>
        <div className="p-10 bg-slate-950/80 border-t border-slate-800/50 flex justify-between items-center"><button onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)} className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all ${activeStep === 0 ? 'invisible' : ''}`}><i className="fas fa-arrow-left mr-3"></i> Înapoi</button>
           {activeStep < 6 ? (<button onClick={() => canGoNext && setActiveStep(activeStep + 1)} disabled={!canGoNext} className={`px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canGoNext ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>Spre Arbitraj <i className="fas fa-chevron-right ml-3"></i></button>) : (
             <button onClick={handleFinalize} disabled={!canGoNext} className={`px-16 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all ${canGoNext ? 'bg-green-600 text-white shadow-2xl' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}>SALVEAZĂ PROTOCOL 4.5</button>
           )}
        </div>
      </div>
    </div>
  );
};

export default DecisionFunnelModal;
