
import React from 'react';

const AMT_ALGO_CONSTANTS = {
  AUTO_VALIDATION: "+15 pct (Auto-Pass)",
  HIGH_BONUS: "+5 pct",
  MODERATE_BONUS: "+3 pct",
  STRICT_PENALTY: "-10 pct (Disable)",
  SOFT_PENALTY: "-5 pct"
};

const CORRELATION_MATRIX = [
  {
    category: "I. THE BIAS LOCK (Weekly OTF)",
    logic: "Determină fluxul banilor mari (Instituționali) pe orizontul macro.",
    rules: [
      {
        input: "Weekly OTF UP",
        target: "Setup-uri de Reversare (Fade Resistance)",
        impact: AMT_ALGO_CONSTANTS.STRICT_PENALTY,
        rationale: "Fizica AMT: Într-o licitație ascendentă (OTF Up), rezistența este dinamică. Orice 'fade' este o pariere împotriva controlului instituțional."
      },
      {
        input: "Weekly OTF UP",
        target: "Setup-uri de Trend (Continuation)",
        impact: AMT_ALGO_CONSTANTS.HIGH_BONUS,
        rationale: "Alinierea Timeframe-urilor (Alignment): Când macro și intraday sunt sincronizate, probabilitatea de 'Sustained Move' crește exponențial."
      },
      {
        input: "Weekly Balance",
        target: "Setup-uri de Breakout (Expansion)",
        impact: AMT_ALGO_CONSTANTS.SOFT_PENALTY,
        rationale: "Risc de 'Breakout Fail'. Într-un range săptămânal, piața caută valoarea mediană; majoritatea tentativelor de ieșire sunt capcane de lichiditate."
      }
    ]
  },
  {
    category: "II. VOLATILITY ADAPTATION (Section 6.3)",
    logic: "Ajustarea preciziei structurale în funcție de calendarul economic.",
    rules: [
      {
        input: "High Impact News (Tier 3)",
        target: "Porous Value Area Protocol",
        impact: "Multiplier: 1.5x Error Margin",
        rationale: "Incertitudine: Știrile majore (CPI/NFP) induc volatilitate care poate 'străpunge' VA fără a invalida neapărat regimul. Se mărește filtrul de confirmare."
      },
      {
        input: "Operational Schedule Checkbox",
        target: "Matrix Score interpretación",
        impact: "Dynamic interpretation",
        rationale: "Regimul săptămânal este marcat automat ca 'Porous' dacă o zi din schedule conține evenimente de risc maxim."
      }
    ]
  },
  {
    category: "III. VALUE TRAVERSE (80% Rule)",
    logic: "Corelația dintre prețul curent și zona de valoare a săptămânii anterioare (pwVA).",
    rules: [
      {
        input: "Price Outside pwVA + Re-entry",
        target: "Setup #4 (80% Rule)",
        impact: AMT_ALGO_CONSTANTS.AUTO_VALIDATION,
        rationale: "Statistică AMT: Dacă prețul acceptă 2 perioade de 30 min în interiorul pwVA, există o probabilitate de 80% să traverseze întreaga arie până la extremitatea opusă."
      }
    ]
  },
  {
    category: "IV. INVENTORY SKEW (Overnight Friction)",
    logic: "Analiza dezechilibrului participanților din afara orelor principale (Globex).",
    rules: [
      {
        input: "ON Inventory Long/Short (>70%)",
        target: "Setup #14 (Inventory Correction)",
        impact: AMT_ALGO_CONSTANTS.AUTO_VALIDATION,
        rationale: "Echilibrare: Un inventar supra-extins forțează o corecție la Open (Flush/Pop) către Settlement pentru a aduce noi cumpărători/vânzători în licitație."
      }
    ]
  },
  {
    category: "V. OPENING CONVICTION (Open Type)",
    logic: "Măsoară agresivitatea banilor noi în primele minute ale RTH.",
    rules: [
      {
        input: "Open Type: DRIVE",
        target: "Setup #1 (Open Drive)",
        impact: AMT_ALGO_CONSTANTS.HIGH_BONUS,
        rationale: "Convincerea Instituțională: Un 'Drive' indică faptul că OTF a decis direcția pre-deschidere și execută ordine 'At Market'. Nu există testare, doar execuție."
      }
    ]
  },
  {
    category: "VI. STRUCTURAL ANOMALIES (Targets)",
    logic: "Identificarea 'afacerilor neterminate' care acționează ca magneți.",
    rules: [
      {
        input: "Poor High/Low Detected",
        target: "Setup #8 (Repair Play)",
        impact: AMT_ALGO_CONSTANTS.HIGH_BONUS,
        rationale: "Lichiditate Tehnică: Un 'Poor High' indică absența cozilor de respingere (Tails). Licitația nu este completă; prețul va fi atras înapoi pentru a 'repara' structura."
      }
    ]
  }
];

const ScannerLogicReport: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20 max-w-6xl mx-auto">
      
      {/* HEADER DOCUMENT */}
      <div className="bg-[#0b1222] border border-blue-500/30 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl no-print">
        <div className="relative z-10">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
                <i className="fas fa-project-diagram text-2xl"></i>
            </div>
            <div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">AMT ALGORITHM AUDIT</h1>
                <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em]">PROTOCOL V4.5 // ARCHITECTURE DOCUMENTATION</p>
            </div>
          </div>
          
          <div className="bg-slate-950/60 p-8 rounded-[2rem] border border-slate-800 space-y-4">
             <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Acest document detaliază corelațiile implementate între <strong>Operational Schedule</strong>, <strong>Context Matrix</strong> și scannerul de strategii.
             </p>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest italic">
                * NOTĂ PENTRU EXPERT: Corelația dintre știri și matricea de scorare (Secțiunea 6.3) este activă. Săptămânile cu știri Tier 3 aplică automat un multiplicator de risc structurilor de preț.
             </p>
          </div>
        </div>
        <i className="fas fa-shield-halved absolute -bottom-10 -right-10 text-[260px] text-white/[0.01] pointer-events-none rotate-12"></i>
      </div>

      {/* RENDER CATEGORIES */}
      <div className="space-y-10">
        {CORRELATION_MATRIX.map((cat, idx) => (
          <div key={idx} className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-xl">
             <div className="p-8 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                   <span className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 text-[10px] font-black border border-blue-500/20">{idx + 1}</span>
                   <h4 className="text-sm font-black text-white uppercase tracking-widest">{cat.category}</h4>
                </div>
             </div>
             
             <div className="p-8 space-y-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Ipoteza Logică: <span className="text-slate-300 normal-case font-medium ml-2">{cat.logic}</span></p>
                
                <div className="grid grid-cols-1 gap-4">
                    {cat.rules.map((rule, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-slate-950/40 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all group">
                            <div className="lg:col-span-3">
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">TRIGGER INPUT</p>
                                <p className="text-[11px] font-black text-white uppercase tracking-tight">{rule.input}</p>
                            </div>
                            <div className="lg:col-span-3 border-l border-slate-800 pl-6">
                                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">TARGET STRATEGY</p>
                                <p className="text-[11px] font-black text-indigo-300 uppercase tracking-tight">{rule.target}</p>
                            </div>
                            <div className="lg:col-span-2 border-l border-slate-800 pl-6">
                                <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">ALGO WEIGHT</p>
                                <p className="text-[11px] font-black text-orange-400 uppercase tracking-tight">{rule.impact}</p>
                            </div>
                            <div className="lg:col-span-4 border-l border-slate-800 pl-6">
                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">AMT RATIONALE</p>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">"{rule.rationale}"</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* FINAL EXPERT CHECKPOINT */}
      <div className="bg-orange-600/5 border border-orange-500/20 p-10 rounded-[3rem] text-center shadow-inner">
          <i className="fas fa-microscope text-3xl text-orange-500/40 mb-6"></i>
          <h4 className="text-white font-black uppercase tracking-widest text-lg mb-4">Expert Verification Checkpoint</h4>
          <p className="text-slate-400 text-sm italic max-w-2xl mx-auto leading-loose">
            Întreabă expertul: "Este suficient un multiplicator de 1.5x pentru marginea de eroare a Value Area în timpul știrilor NFP/FOMC, sau ar trebui să invalidăm complet anumite structuri de echilibru?"
          </p>
      </div>

    </div>
  );
};

export default ScannerLogicReport;
