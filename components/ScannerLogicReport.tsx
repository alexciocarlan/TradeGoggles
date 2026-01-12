
import React from 'react';

const AMT_ALGO_CONSTANTS = {
  AUTO_VALIDATION: "+15 pct (Auto-Pass)",
  HIGH_BONUS: "+5 pct",
  MODERATE_BONUS: "+3 pct",
  STRICT_PENALTY: "-10 pct (Disable)",
  SOFT_PENALTY: "-5 pct"
};

const WEEKLY_ANCHOR_MATRIX = [
  {
    input: "Weekly OTF (Trend)",
    condition: "OTF UP / DOWN",
    points: "+/- 2.0",
    rationale: "PRIMARY DRIVER. Indică controlul instituțional pe termen lung. Cel mai puternic filtru de direcție."
  },
  {
    input: "Weekly Open Type",
    condition: "GAP UP / DOWN",
    points: "+/- 2.0",
    rationale: "INITIATIVE. O deschidere cu Gap indică o schimbare fundamentală a percepției valorii peste weekend."
  },
  {
    input: "Value Relationship",
    condition: "Outside Range + Close Extension",
    points: "+/- 1.0",
    rationale: "MIGRATION. Confirmă că prețul nu doar explorează, ci acceptă noi zone de valoare."
  },
  {
    input: "Structural Anomaly",
    condition: "Poor High / Low",
    points: "+/- 1.0",
    rationale: "MAGNET EFFECT. Un Poor High (+1) este considerat o țintă bullish (unfinished business) care atrage prețul."
  },
  {
    input: "POC Divergence",
    condition: "Vol/TPO Divergence",
    points: "+/- 1.0",
    rationale: "INTERNAL STRENGTH. Volumul confirmă sau infirmă mișcarea prețului."
  }
];

const REGIME_THRESHOLDS = [
    { range: "≥ +4", label: "STRONG TREND UP", strategy: "GO WITH / BREAKOUTS" },
    { range: "+2 to +3", label: "MODERATE BULLISH", strategy: "BUY PULLBACKS" },
    { range: "-1 to +1", label: "BALANCE / ROTATION", strategy: "FADE EXTREMES / TARGET POC" },
    { range: "-2 to -3", label: "MODERATE BEARISH", strategy: "SELL RALLIES" },
    { range: "≤ -4", label: "STRONG TREND DOWN", strategy: "GO WITH / BREAKDOWNS" }
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
                <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em]">PROTOCOL V4.5 // SYSTEM LOGIC & WEIGHTS</p>
            </div>
          </div>
          
          <div className="bg-slate-950/60 p-8 rounded-[2rem] border border-slate-800 space-y-4">
             <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Acest document detaliază logica de calcul din spatele <strong>Weekly Anchor</strong> și <strong>Scanner-ului Intraday</strong>. Folosiți acest raport pentru validarea cu experții Market Profile.
             </p>
          </div>
        </div>
        <i className="fas fa-shield-halved absolute -bottom-10 -right-10 text-[260px] text-white/[0.01] pointer-events-none rotate-12"></i>
      </div>

      {/* WEEKLY ANCHOR LOGIC SECTION */}
      <div className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-xl">
         <div className="p-8 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
            <div className="flex items-center space-x-4">
               <span className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-500 text-[10px] font-black border border-indigo-500/20">A</span>
               <h4 className="text-sm font-black text-white uppercase tracking-widest">WEEKLY ANCHOR SCORING MATRIX</h4>
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">LAYER 1 LOGIC</span>
         </div>
         
         <div className="p-8">
            <table className="w-full text-left">
                <thead className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <tr>
                        <th className="pb-4 pl-4">Input Variable</th>
                        <th className="pb-4">Condition Detected</th>
                        <th className="pb-4">Score Impact</th>
                        <th className="pb-4">AMT Rationale (Why?)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                    {WEEKLY_ANCHOR_MATRIX.map((row, idx) => (
                        <tr key={idx} className="group hover:bg-slate-900/20 transition-colors">
                            <td className="py-4 pl-4 text-xs font-black text-white">{row.input}</td>
                            <td className="py-4 text-[10px] font-bold text-blue-400 uppercase">{row.condition}</td>
                            <td className="py-4 text-xs font-black text-emerald-400">{row.points}</td>
                            <td className="py-4 text-[10px] text-slate-400 italic leading-relaxed pr-4">{row.rationale}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">REGIME THRESHOLDS (OUTPUT)</p>
                    <div className="space-y-2">
                        {REGIME_THRESHOLDS.map((t, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-400 w-16">{t.range}</span>
                                <span className={`font-black flex-1 ${t.label.includes('TREND') ? 'text-white' : 'text-slate-500'}`}>{t.label}</span>
                                <span className="text-slate-600 italic">{t.strategy}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">VOLATILITY OVERRIDE (TIER 3 NEWS)</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                        Dacă un eveniment Tier 3 (ex: FOMC, CPI) este detectat în calendar:
                    </p>
                    <ul className="space-y-2 text-[10px] text-slate-300">
                        <li className="flex items-center"><i className="fas fa-arrow-right text-orange-500 text-[8px] mr-2"></i> Scorul numeric NU se modifică.</li>
                        <li className="flex items-center"><i className="fas fa-arrow-right text-orange-500 text-[8px] mr-2"></i> Regimul primește sufixul <strong>"(POROUS VALUE)"</strong>.</li>
                        <li className="flex items-center"><i className="fas fa-arrow-right text-orange-500 text-[8px] mr-2"></i> Value Area este considerată "permeabilă" (se acceptă fakeouts de 10-15 puncte).</li>
                    </ul>
                </div>
            </div>
         </div>
      </div>

      {/* FINAL EXPERT CHECKPOINT */}
      <div className="bg-orange-600/5 border border-orange-500/20 p-10 rounded-[3rem] text-center shadow-inner">
          <i className="fas fa-microscope text-3xl text-orange-500/40 mb-6"></i>
          <h4 className="text-white font-black uppercase tracking-widest text-lg mb-4">Expert Verification Needed</h4>
          <p className="text-slate-400 text-sm italic max-w-2xl mx-auto leading-loose">
            Întrebare critică pentru expert: "Un Poor High (+1 punct în sistemul nostru) acționează întotdeauna ca un magnet Bullish, sau ar trebui considerat o slăbiciune a cumpărătorilor (lipsă de exces) și punctat negativ sau neutru?"
          </p>
      </div>

    </div>
  );
};

export default ScannerLogicReport;
