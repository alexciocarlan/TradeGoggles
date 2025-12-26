
import React, { useState, useMemo } from 'react';

interface DecisionFunnelModalProps {
  onClose: () => void;
}

interface FunnelData {
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
        { text: "#LargeGap", setup: "The GAP & Go", identifiers: "Open outside pdRange + Respingere gap + Breakout în direcția gap." },
        { text: "#Exhaustion", setup: "The GAP Fill", identifiers: "Epuizare în direcția gap + Acceptare în pdRange + Pierdere dOpen." },
        { text: "#MassiveGap", setup: "The Half-Gap Fill", identifiers: "Gap imens + Stall la 50% din Gap + Reversare de la mijloc." }
      ]
    },
    { 
      tag: "#InsideRange", 
      icon: "fa-arrows-left-right-to-line",
      subtags: [
        { text: "#InBalance", setup: "Inside Value Fade", identifiers: "Open în pdVA + Volum mic/Suprapunere + Testare VAH/VAL." },
        { text: "#TightBalance", setup: "Inside Day Breakout", identifiers: "Open în pdVA + Volatilitate mică + Compresie + Range Extension." },
        { text: "#ExtremeSkew", setup: "Overnight Inventory Correction", identifiers: "Open în pdRange + Inventar ON 100% L/S + Eșec spargere ON H/L." }
      ]
    },
    { 
      tag: "#OutsideVA", 
      icon: "fa-expand",
      subtags: [
        { text: "#Rejection", setup: "The 80% Rule", identifiers: "Open afara pdVA + Acceptare înapoi în pdVA (2 TPO) + Ținta opusă." },
        { text: "#FailedBreak", setup: "Failed Auction", identifiers: "Break pdHigh/Low + Reversare imediată în range + Formare coadă." }
      ]
    }
  ],
  level2: [
    { 
      tag: "#StrongDrive", 
      icon: "fa-bolt",
      subtags: [
        { text: "#NoTails", setup: "The Open Drive", identifiers: "Aggressive Open + Fără cozi în direcția opusă + Range Extension imediat." },
        { text: "#TestFirst", setup: "The Open Test Drive", identifiers: "Testare nivel cheie la Open + Respingere rapidă + Break of Open." }
      ]
    },
    { 
      tag: "#Rejection", 
      icon: "fa-rotate-left",
      subtags: [
        { text: "#FailedPush", setup: "Open Rejection Reverse", identifiers: "Open cu Gap + Eșec continuare + Reintrare în pdRange." }
      ]
    },
    { 
      tag: "#IB_Struggle", 
      icon: "fa-hand-fist",
      subtags: [
        { text: "#FakeOut", setup: "IB Extension Failure", identifiers: "Break IB (Initial Balance) + Breakout superficial (2-5 ticks) + Reversare rapidă." },
        { text: "#NarrowIB", setup: "D-Period Expansion", identifiers: "IB Îngust + Perioada C eșuează breakout + Breakout în perioada D (instituțional)." }
      ]
    }
  ],
  level3: {
    Trend: [
      { tag: "#Imbalance", setup: "Trend Day", idents: "One Time Framing + Profil alungit/subțire + Fără suprapuneri mari de TPO." },
      { tag: "#SinglePrints", setup: "Single Prints Fill", idents: "SP din ziua anterioară + Prețul intră și acceptă în zonă + Lipsă suport." },
      { tag: "#DoubleDist", setup: "Double Distribution Trend", idents: "Trend Day în progres + 2 balanțe separate de Single Prints + Testare SP." },
      { tag: "#Cascade", setup: "Weak Low/High Cascade", idents: "Cluster de minime/maxime slabe (fără cozi) + Break la primul nivel + Domino effect." },
      { tag: "#News", setup: "The Volume Vacuum", idents: "Știre impact mare + Mișcare verticală (goluri/zero volum) + Divergență Delta." }
    ],
    Range: [
      { tag: "#Overextended", setup: "VWAP Reversion", idents: "Preț > 2.0 Std Dev de la VWAP + Divergență Delta + Reintrare în bandă." },
      { tag: "#Algorithmic", setup: "45-Degree Line Break", idents: "Profilul formează o linie vizuală de 45 grade + Break al liniei + Fade." },
      { tag: "#Support/Res", setup: "The Ledge Break", idents: "Ledge intraday (TPO oprite la același preț) + Tick prin nivel + Stop-run." },
      { tag: "#Structure", setup: "Short Covering / Long Liquidation", idents: "Profil 'P' sau 'b' + Volum scade la retestare + Close înapoi în distribuție." }
    ]
  },
  level4: [
    { tag: "#PoorStructure", setup: "Poor High/Low Repair", idents: "Fără cozi la extreme (pd) + Structură locală spartă spre extrem + Respingere." },
    { tag: "#OldBusiness", setup: "Naked POC Magnet", idents: "pdPOC neatins + Cale liberă (Low Volume) + Break structură locală." },
    { tag: "#Pivot", setup: "The Halfback Play", idents: "Range clar stabilit + Retragere la exact 50% + Reacție (Bounce)." },
    { tag: "#HVN", setup: "Composite HVN Rejection", idents: "Apropiere de HVN compozit (20-30 zile) + Volum scade + Absorbție." },
    { tag: "#Psychology", setup: "Round Number Magnet", idents: "Apropiere de număr rotund (ex. NQ 18000) + Profil subțire + Magnetism." }
  ],
  level5: [
    { tag: "#Afternoon", setup: "Afternoon Drift", idents: "Ora 12:00-14:00 NY + Volum sub medie + Acțiune lentă + Fade trend dimineață." },
    { tag: "#LateDay", setup: "The Spike", idents: "Mișcare târzie violentă (OTF Repositioning) + Închidere la extremă." },
    { tag: "#EndOfWeek", setup: "Weekly POC Magnet", idents: "Joi/Vineri + Piață în derivă (drift) + Apropiere de Weekly VPOC." },
    { tag: "#MultiDay", setup: "3-Day Balance Break", idents: "Range de 3 zile suprapus (Coil) + Close puternic în afara balanței." }
  ]
};

const DecisionFunnelModal: React.FC<DecisionFunnelModalProps> = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selection, setSelection] = useState<FunnelData>({
    level1Tag: null, level1SubTag: null, level2Tag: null, level2SubTag: null, 
    level3Regime: null, level3Tag: null, level4Tag: null, level5Tag: null
  });

  const canGoNext = useMemo(() => {
    if (activeStep === 0) return !!selection.level1SubTag;
    if (activeStep === 1) return !!selection.level2SubTag;
    if (activeStep === 2) return !!selection.level3Tag;
    if (activeStep === 3) return !!selection.level4Tag;
    if (activeStep === 4) return !!selection.level5Tag;
    return false;
  }, [activeStep, selection]);

  const recommendedSetups = useMemo(() => {
    const list: string[] = [];
    
    if (selection.level1SubTag) {
        const found = FUNNEL_CONTENT.level1.find(t => t.tag === selection.level1Tag)?.subtags.find(st => st.text === selection.level1SubTag);
        if (found) list.push(found.setup);
    }
    
    if (selection.level2SubTag) {
        const found = FUNNEL_CONTENT.level2.find(t => t.tag === selection.level2Tag)?.subtags.find(st => st.text === selection.level2SubTag);
        if (found) list.push(found.setup);
    }
    
    if (selection.level3Tag && selection.level3Regime) {
        const found = (FUNNEL_CONTENT.level3 as any)[selection.level3Regime].find((t: any) => t.tag === selection.level3Tag);
        if (found) list.push(found.setup);
    }

    if (selection.level4Tag) {
        const found = FUNNEL_CONTENT.level4.find(t => t.tag === selection.level4Tag);
        if (found) list.push(found.setup);
    }

    if (selection.level5Tag) {
        const found = FUNNEL_CONTENT.level5.find(t => t.tag === selection.level5Tag);
        if (found) list.push(found.setup);
    }

    return Array.from(new Set(list));
  }, [selection]);

  const renderLevel1 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Level 1: Macro Context</h4>
            <p className="text-sm text-slate-500 font-medium italic">Unde deschidem față de ziua anterioară?</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
            {FUNNEL_CONTENT.level1.map(cat => (
                <button 
                    key={cat.tag}
                    onClick={() => setSelection({...selection, level1Tag: cat.tag, level1SubTag: null})}
                    className={`p-6 rounded-3xl border flex flex-col items-center space-y-4 transition-all ${selection.level1Tag === cat.tag ? 'bg-blue-600 border-blue-400 shadow-xl scale-105' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}`}
                >
                    <i className={`fas ${cat.icon} text-2xl`}></i>
                    <span className="text-xs font-black uppercase tracking-widest">{cat.tag}</span>
                </button>
            ))}
        </div>
        {selection.level1Tag && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Selectează Sub-Tag:</p>
                <div className="grid grid-cols-1 gap-3">
                    {FUNNEL_CONTENT.level1.find(c => c.tag === selection.level1Tag)?.subtags.map(st => (
                        <button 
                            key={st.text}
                            onClick={() => setSelection({...selection, level1SubTag: st.text})}
                            className={`p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.level1SubTag === st.text ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div>
                                <span className="text-xs font-black text-white uppercase block mb-1">{st.text}</span>
                                <p className="text-[10px] text-slate-500 font-medium">{st.identifiers}</p>
                            </div>
                            {selection.level1SubTag === st.text && <i className="fas fa-check-circle text-indigo-400"></i>}
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );

  const renderLevel2 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Level 2: Opening Auction</h4>
            <p className="text-sm text-slate-500 font-medium italic">Cine controlează deschiderea?</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
            {FUNNEL_CONTENT.level2.map(cat => (
                <button 
                    key={cat.tag}
                    onClick={() => setSelection({...selection, level2Tag: cat.tag, level2SubTag: null})}
                    className={`p-6 rounded-3xl border flex flex-col items-center space-y-4 transition-all ${selection.level2Tag === cat.tag ? 'bg-blue-600 border-blue-400 shadow-xl scale-105' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}`}
                >
                    <i className={`fas ${cat.icon} text-2xl`}></i>
                    <span className="text-xs font-black uppercase tracking-widest">{cat.tag}</span>
                </button>
            ))}
        </div>
        {selection.level2Tag && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Selectează Sub-Tag Licitație:</p>
                <div className="grid grid-cols-1 gap-3">
                    {FUNNEL_CONTENT.level2.find(c => c.tag === selection.level2Tag)?.subtags.map(st => (
                        <button 
                            key={st.text}
                            onClick={() => setSelection({...selection, level2SubTag: st.text})}
                            className={`p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.level2SubTag === st.text ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div>
                                <span className="text-xs font-black text-white uppercase block mb-1">{st.text}</span>
                                <p className="text-[10px] text-slate-500 font-medium">{st.identifiers}</p>
                            </div>
                            {selection.level2SubTag === st.text && <i className="fas fa-check-circle text-indigo-400"></i>}
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );

  const renderLevel3 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Level 3: Intraday Regime</h4>
            <p className="text-sm text-slate-500 font-medium italic">Piața este în Trend sau în Balanță?</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-8">
            <button 
                onClick={() => setSelection({...selection, level3Regime: 'Trend', level3Tag: null})}
                className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selection.level3Regime === 'Trend' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-50'}`}
            >
                Branch A: MOMENTUM
            </button>
            <button 
                onClick={() => setSelection({...selection, level3Regime: 'Range', level3Tag: null})}
                className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selection.level3Regime === 'Range' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-50'}`}
            >
                Branch B: REVERSION
            </button>
        </div>
        {selection.level3Regime && (
            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {(FUNNEL_CONTENT.level3 as any)[selection.level3Regime].map((item: any) => (
                    <button 
                        key={item.tag}
                        onClick={() => setSelection({...selection, level3Tag: item.tag})}
                        className={`w-full p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.level3Tag === item.tag ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
                    >
                        <div>
                            <span className="text-xs font-black text-white uppercase block mb-1">{item.tag}</span>
                            <p className="text-[10px] text-slate-500 font-medium">{item.idents}</p>
                        </div>
                        {selection.level3Tag === item.tag && <i className="fas fa-check-circle text-white"></i>}
                    </button>
                ))}
            </div>
        )}
    </div>
  );

  const renderLevel4 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Level 4: Location & Targeting</h4>
            <p className="text-sm text-slate-500 font-medium italic">Anomalii vizuale sau niveluri istorice?</p>
        </div>
        <div className="space-y-3">
            {FUNNEL_CONTENT.level4.map(item => (
                <button 
                    key={item.tag}
                    onClick={() => setSelection({...selection, level4Tag: item.tag})}
                    className={`w-full p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selection.level4Tag === item.tag ? 'bg-purple-600/20 border-purple-500 shadow-xl' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'}`}
                >
                    <div>
                        <span className="text-xs font-black text-white uppercase block mb-1">{item.tag}</span>
                        <p className="text-[10px] text-slate-500 font-bold">{item.idents}</p>
                    </div>
                    {selection.level4Tag === item.tag && <i className="fas fa-bullseye text-purple-400"></i>}
                </button>
            ))}
        </div>
    </div>
  );

  const renderLevel5 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Level 5: Time Factor</h4>
            <p className="text-sm text-slate-500 font-medium italic">Impactul orei sau zilei?</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col relative min-h-[750px]">
        
        {/* Header with Step indicator */}
        <div className="p-10 pb-6 border-b border-slate-800/50 bg-slate-950/20">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
                    <i className="fas fa-filter text-white text-xl"></i>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Playbook Filter Algorithm</h3>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Sistem de decizie secvențial</p>
                 </div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2"><i className="fas fa-times text-2xl"></i></button>
           </div>
           
           <div className="flex items-center space-x-3">
              {[1, 2, 3, 4, 5].map((s, i) => (
                <div key={s} className="flex-1 flex flex-col space-y-2">
                    <div className={`h-1.5 rounded-full transition-all duration-700 ${i <= activeStep ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`}></div>
                    <span className={`text-[8px] font-black text-center uppercase tracking-widest ${i === activeStep ? 'text-white' : 'text-slate-600'}`}>Level {s}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Content Dynamic Area */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Main Selection Area */}
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                {activeStep === 0 && renderLevel1()}
                {activeStep === 1 && renderLevel2()}
                {activeStep === 2 && renderLevel3()}
                {activeStep === 3 && renderLevel4()}
                {activeStep === 4 && renderLevel5()}
            </div>

            {/* Sidebar Recomandări */}
            <div className="lg:w-80 bg-slate-950/50 border-l border-slate-800/50 p-8 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
                <div>
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">SETUP-URI MONITORIZATE</h5>
                    <div className="space-y-3">
                        {recommendedSetups.length > 0 ? recommendedSetups.map(setup => (
                            <div key={setup} className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-right-2">
                                <i className="fas fa-check-circle text-blue-500 text-xs"></i>
                                <span className="text-[10px] font-black text-white uppercase tracking-tight">{setup}</span>
                            </div>
                        )) : (
                            <div className="py-10 text-center opacity-20 flex flex-col items-center">
                                <i className="fas fa-magnifying-glass text-2xl mb-4"></i>
                                <p className="text-[9px] font-black uppercase">Filtrează contextul...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto bg-slate-900/60 p-6 rounded-3xl border border-slate-800 relative group overflow-hidden">
                    <h5 className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Protocol de Risc</h5>
                    <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400">STATUS:</span>
                            <span className="text-[9px] font-black text-green-500">READY</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400">MAX LOSS:</span>
                            <span className="text-[9px] font-black text-white">$500.00</span>
                        </div>
                    </div>
                    <i className="fas fa-shield-halved absolute -bottom-4 -right-4 text-6xl text-white/[0.03] rotate-12"></i>
                </div>
            </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-10 bg-slate-950/80 border-t border-slate-800/50 flex justify-between items-center">
           <button 
             onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
             className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all ${activeStep === 0 ? 'invisible' : ''}`}
           >
              <i className="fas fa-arrow-left mr-3"></i> Înapoi
           </button>

           {activeStep < 4 ? (
             <button 
                onClick={() => canGoNext && setActiveStep(activeStep + 1)}
                disabled={!canGoNext}
                className={`px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canGoNext ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
             >
                Nivelul Următor <i className="fas fa-chevron-right ml-3"></i>
             </button>
           ) : (
             <button 
                onClick={onClose}
                disabled={!canGoNext}
                className={`px-16 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all ${canGoNext ? 'bg-green-600 text-white shadow-2xl shadow-green-600/30 animate-pulse active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
             >
                EXECUTE TRADE NOW
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default DecisionFunnelModal;
