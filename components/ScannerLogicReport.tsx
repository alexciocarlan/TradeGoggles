
import React from 'react';

const SCANNER_RULES_DOC = [
  { 
    category: "Step 3: Macro Context (pdValue)", 
    variable: "pdValueRelationship",
    rules: [
      { trigger: "GAP", setups: ["#12 The GAP & Go", "#13 The GAP Fill", "#32 Half-Gap Fill"], logic: "Volatilitate extremă cauzată de dezechilibrul inventarului peste noapte." },
      { trigger: "OutsideVA", setups: ["#4 The 80% Rule", "#5 Failed Auction"], logic: "Piața testează acceptarea valorii anterioare. Statistica favorizează traversarea VA." },
      { trigger: "InBalance / InsideRange", setups: ["#26 Inside Value Fade", "#27 IB Extension Failure", "#14 ON Inventory Correction"], logic: "Piață echilibrată. Prioritate pe respingeri la extremele valorii (VAH/VAL)." }
    ]
  },
  { 
    category: "Step 4: Opening Auction", 
    variable: "openType",
    rules: [
      { trigger: "Drive", setups: ["#1 The Open Drive"], logic: "Control instituțional agresiv de la prima secundă. Fără testare inversă." },
      { trigger: "Test Driver", setups: ["#2 The Open Test Drive"], logic: "Căutare de lichiditate la un nivel cheie urmată de respingere violentă." },
      { trigger: "Rejection-Reversal", setups: ["#3 Open Rejection Reverse"], logic: "Eșecul de a menține gap-ul. Reîntoarcere forțată în range-ul anterior." }
    ]
  },
  { 
    category: "Step 5: Intraday Regime", 
    variable: "marketCondition",
    rules: [
      { trigger: "Trend (Momentum)", setups: ["#6 Trend Day", "#21 45-Degree Line Break", "#18 Afternoon Trend"], logic: "Piața se mișcă direcțional. Prioritate pe 'Hold' și adăugare în direcția trendului." },
      { trigger: "Bracket (Reversion)", setups: ["#34 Neutral Day Fade", "#30 HVN Attraction"], logic: "Piață rotațională. Profit la target-uri scurte, intrare la 'Overextension'." }
    ]
  }
];

const ScannerLogicReport: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[3rem] relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Scanner Logic Engine</h2>
          <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Documentation & Decision Matrix // Version 4.5</p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Algorithm Base</p>
               <p className="text-sm font-bold text-slate-200">Market Profile Theory + Statistical Edge Mapping</p>
            </div>
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Decision Triggers</p>
               <p className="text-sm font-bold text-slate-200">32 Conditional Input Strings</p>
            </div>
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Veto System</p>
               <p className="text-sm font-bold text-red-400">Integrated Biological & Behavioral Kill-switch</p>
            </div>
          </div>
        </div>
        <i className="fas fa-microchip absolute -bottom-10 -right-10 text-[200px] text-white/[0.02] rotate-12"></i>
      </div>

      <div className="space-y-8">
        <h3 className="text-xl font-black text-white uppercase italic tracking-tight border-l-4 border-blue-600 pl-6">Decision Matrix Anatomy</h3>
        
        {SCANNER_RULES_DOC.map((section, idx) => (
          <div key={idx} className="bg-[#0b1222] border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-xl">
            <div className="p-8 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
               <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">{section.category}</h4>
               <span className="text-[10px] font-black text-slate-600 uppercase">Variable: {section.variable}</span>
            </div>
            <div className="p-0">
               <table className="w-full text-left">
                 <thead className="bg-slate-950/40 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                   <tr>
                     <th className="px-8 py-4">Trigger Condition</th>
                     <th className="px-8 py-4">Recommended Setups</th>
                     <th className="px-8 py-4">Logical Reasoning</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/40">
                    {section.rules.map((rule, rIdx) => (
                      <tr key={rIdx} className="hover:bg-blue-600/[0.02] transition-colors">
                        <td className="px-8 py-6 font-black text-white text-xs uppercase tracking-tight">{rule.trigger}</td>
                        <td className="px-8 py-6">
                           <div className="flex flex-wrap gap-2">
                             {rule.setups.map(s => (
                               <span key={s} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md text-[9px] font-black uppercase">{s}</span>
                             ))}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-[11px] text-slate-400 font-medium italic leading-relaxed">
                          "{rule.logic}"
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center">
              <i className="fas fa-calculator mr-3 text-emerald-500"></i> TG Score Algorithm (The Math)
            </h4>
            <div className="space-y-6">
               <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                     <span className="text-[10px] font-black text-slate-500 uppercase">Preparation (P)</span>
                     <span className="text-xs font-black text-white">Weight: 20%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold">
                    [Scor Gatekeeper * 0.7] + [Acceptare Incertitudine * 0.3]
                  </p>
               </div>
               <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                     <span className="text-[10px] font-black text-slate-500 uppercase">Execution (E)</span>
                     <span className="text-xs font-black text-white">Weight: 50%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold">
                    [Avg Discipline * 0.6] + [Notes Completeness * 0.4]
                  </p>
               </div>
               <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                     <span className="text-[10px] font-black text-slate-500 uppercase">Review (R)</span>
                     <span className="text-xs font-black text-white">Weight: 30%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold">
                    [Wrap-up Completed * 0.5] + [All Trades Analyzed * 0.5]
                  </p>
               </div>
               <div className="bg-red-600/5 border border-red-500/20 p-6 rounded-2xl text-center">
                  <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">FINAL SCORE = (P*0.2 + E*0.5 + R*0.3) * VETO_MULTIPLIER</p>
               </div>
            </div>
         </div>

         <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center">
              <i className="fas fa-code-branch mr-3 text-orange-500"></i> Special Logic Overrides
            </h4>
            <div className="space-y-4">
               <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 group">
                  <h5 className="text-[11px] font-black text-white uppercase mb-2 group-hover:text-blue-400 transition-colors">THE FRIDAY MAGNET (#38)</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Triggered automatically on Thursday/Friday. Logic: Săptămâna tinde să închidă în jurul echilibrului dacă nu există catalizatori majori. Target: Weekly VPOC.
                  </p>
               </div>
               <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 group">
                  <h5 className="text-[11px] font-black text-white uppercase mb-2 group-hover:text-blue-400 transition-colors">CONTINUITY MULTIPLIER (#39)</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Triggered if Yesterday = 'Trend Day'. Logic: Instituțiile tind să-și continue rebalansarea portofoliului a doua zi prin 'Follow-through' dacă Open este un Gap în direcția trendului.
                  </p>
               </div>
               <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 group">
                  <h5 className="text-[11px] font-black text-white uppercase mb-2 group-hover:text-blue-400 transition-colors">VETO: STOP LOSS REJECTION (V=0)</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Dacă orice trade are eroarea 'Refuzul de a Pierde', TG Score devine instantaneu 0, indiferent de alte performanțe. Logic: Supraviețuirea depinde de tăierea pierderilor.
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ScannerLogicReport;
