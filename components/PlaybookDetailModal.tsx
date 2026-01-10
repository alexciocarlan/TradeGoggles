
import React, { useRef, useMemo } from 'react';
import { Playbook, Trade, TradeScreenshot } from '../types';
import { ALL_SETUPS } from '../data/setups';

interface PlaybookDetailModalProps {
  playbook: Playbook;
  trades: Trade[];
  backtestTrades: Trade[];
  onClose: () => void;
  onEdit: (id: string) => void;
}

const PlaybookDetailModal: React.FC<PlaybookDetailModalProps> = ({ playbook, trades, backtestTrades, onClose, onEdit }) => {
  const filteredLive = (trades || []).filter(t => t.setup?.toLowerCase() === playbook.name.toLowerCase());
  const filteredBT = (backtestTrades || []).filter(t => t.setup?.toLowerCase() === playbook.name.toLowerCase());
  
  const liveStats = useMemo(() => calculateStats(filteredLive), [filteredLive]);
  const btStats = useMemo(() => calculateStats(filteredBT), [filteredBT]);

  // FIX: Robust mapping logic to link Playbook (pb-1) with Scanner Setup (id: 1)
  const setupContext = useMemo(() => {
      // 1. Try matching by stripped ID (e.g. "pb-1" -> "1")
      const numericId = playbook.id.replace('pb-', '');
      const idMatch = ALL_SETUPS.find(s => s.id.toString() === numericId);
      if (idMatch) return idMatch;

      // 2. Try matching by fuzzy name (e.g. "1. The Open Drive" contains "The Open Drive")
      const cleanName = playbook.name.replace(/^\d+\.\s*/, '').toLowerCase().trim();
      const nameMatch = ALL_SETUPS.find(s => s.name.toLowerCase().trim() === cleanName);
      if (nameMatch) return nameMatch;

      // 3. Fallback: Contains match
      return ALL_SETUPS.find(s => playbook.name.toLowerCase().includes(s.name.toLowerCase()));
  }, [playbook]);

  const mainScreenshot = playbook.screenshots && playbook.screenshots.length > 0 ? playbook.screenshots[0] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  function calculateStats(tArray: Trade[]) {
    const tradeCount = tArray.length;
    const wins = tArray.filter(t => t.status === 'WIN').length;
    const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
    const totalNet = tArray.reduce((s, t) => s + t.pnlNet, 0);
    
    const totalPoints = tArray.reduce((sum, t) => {
      const pts = t.type === 'LONG' ? ((t.exitPrice || 0) - (t.entryPrice || 0)) : ((t.entryPrice || 0) - (t.exitPrice || 0));
      return sum + pts;
    }, 0);
    const avgPoints = tradeCount > 0 ? totalPoints / tradeCount : 0;

    const winningTrades = tArray.filter(t => t.pnlNet > 0);
    const totalWinAmount = winningTrades.reduce((s, t) => s + t.pnlNet, 0);
    const totalLossAmount = Math.abs(tArray.filter(t => t.pnlNet < 0).reduce((s, t) => s + t.pnlNet, 0));
    const pf = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount) : (totalWinAmount > 0 ? 99 : 0);
    const expectancy = tradeCount > 0 ? totalNet / tradeCount : 0;
    
    return { tradeCount, winRate, totalNet, pf, expectancy, avgPoints };
  }

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
       const base64 = reader.result as string;
       alert("Blueprint set temporar. Mergi la Edit -> Save pentru a-l salva permanent.");
       (playbook.screenshots as any) = [{ url: base64, caption: 'Blueprint' }]; 
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper updated to parse the Excel format specific strings
  const parseExcelTrap = (trapStr: string) => {
      // Format expected: "Type: Name: Description" or "Type: Description"
      // Example: "False Conviction: Low Vol Drive: Price moves fast..."
      const parts = trapStr.split(':');
      
      let type = "Risk Factor";
      let title = "";
      let desc = "";

      if (parts.length >= 3) {
          type = parts[0].trim();
          title = parts[1].trim();
          desc = parts.slice(2).join(':').trim();
      } else if (parts.length === 2) {
          type = parts[0].trim();
          desc = parts[1].trim();
      } else {
          desc = trapStr;
      }

      return { type, title, desc };
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-center items-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300 p-4 md:p-10">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-[98vw] h-[92vh] bg-[#060b13] rounded-[3rem] border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
        
        {/* LEFT SIDE: STRATEGY BLUEPRINT / EDGE VALIDATION */}
        <div className="md:w-1/2 h-full bg-[#03070c] relative flex flex-col border-b md:border-b-0 md:border-r border-slate-800 group overflow-hidden">
           <div className="flex-1 flex flex-col p-10 space-y-10 relative z-10 overflow-y-auto custom-scrollbar">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <i className="fas fa-microscope"></i>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Edge Validation Benchmark</h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <BenchmarkCard 
                        label="Win Rate Validation" 
                        liveVal={`${liveStats.winRate.toFixed(0)}%`} 
                        btVal={`${btStats.winRate.toFixed(0)}%`} 
                        delta={liveStats.winRate - btStats.winRate} 
                    />
                    <BenchmarkCard 
                        label="Profit Factor Gap" 
                        liveVal={liveStats.pf.toFixed(2)} 
                        btVal={btStats.pf.toFixed(2)} 
                        delta={liveStats.pf - btStats.pf}
                        isAbsolute
                    />
                    <BenchmarkCard 
                        label="Expectancy Drift" 
                        liveVal={`$${liveStats.expectancy.toFixed(0)} (${liveStats.avgPoints.toFixed(1)} pts)`} 
                        btVal={`$${btStats.expectancy.toFixed(0)} (${btStats.avgPoints.toFixed(1)} pts)`} 
                        delta={liveStats.expectancy - btStats.expectancy} 
                    />
                </div>

                <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">AI Benchmarking Insight</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        {liveStats.tradeCount < 5 ? "Eșantion Live prea mic pentru o validare statistică relevantă. Continuă să execuți conform planului." : 
                         liveStats.winRate < btStats.winRate - 10 ? "Ai un 'Performance Gap' semnificativ. Verifică dacă execuția ta Live suferă de ezitare sau dacă datele de Backtest sunt prea optimiste." :
                         "Performanța Live confirmă Edge-ul extras din Backtesting. Menține disciplina."}
                    </p>
                </div>

                <div className="pt-6">
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Blueprint Preview</h4>
                    <div className="aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center">
                        {mainScreenshot ? (
                            <img src={mainScreenshot.url} className="w-full h-full object-contain" alt="Technical Blueprint" />
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()} className="text-slate-600 hover:text-white transition-all">
                                <i className="fas fa-upload text-3xl mb-3 block"></i>
                                <span className="text-[10px] font-black uppercase">Upload Blueprint</span>
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleManualUpload} />
                    </div>
                </div>
           </div>
           
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* RIGHT SIDE: CORE LOGIC & STATS */}
        <div className="md:w-1/2 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#060b13]">
          <div className="p-10 relative overflow-hidden shrink-0 border-b border-slate-800/50" style={{ backgroundColor: `${playbook.color}08` }}>
            <div className="flex justify-between items-start relative z-10">
               <div className="space-y-4">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-2xl border-2" style={{ backgroundColor: '#0f172a', borderColor: playbook.color }}>{playbook.icon}</div>
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                #{setupContext?.id || playbook.id.replace('pb-', '')}
                            </span>
                            {setupContext?.intentFamily && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                                    setupContext.intentFamily === 'CONFIDENCE' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 
                                    setupContext.intentFamily === 'FILL' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' : 
                                    'text-slate-400 border-slate-600 bg-slate-800'
                                }`}>
                                    {setupContext.intentFamily} FAMILY
                                </span>
                            )}
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{playbook.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {(playbook.tags || []).map(tag => (
                                <span key={tag.id} className="text-[9px] font-black uppercase border px-2.5 py-1 rounded-md" style={{ color: tag.color, borderColor: `${tag.color}30`, backgroundColor: `${tag.color}10` }}>{tag.text}</span>
                            ))}
                        </div>
                    </div>
                  </div>
               </div>
               <div className="flex space-x-3 no-print">
                  <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-slate-700 shadow-xl" title="Print/Export PDF"><i className="fas fa-print text-xs"></i></button>
                  <button onClick={() => onEdit(playbook.id)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-slate-700 shadow-xl" title="Edit Strategy"><i className="fas fa-edit text-xs"></i></button>
                  <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-slate-700 shadow-xl" title="Close"><i className="fas fa-times text-xs"></i></button>
               </div>
            </div>
          </div>

          <div className="p-10 space-y-12">
            
            {/* AMT CONTEXT MATRIX - INTEGRATED FROM SHEET */}
            {setupContext ? (
                <div className="bg-[#0b1222]/50 border border-slate-800 rounded-[2rem] p-8 shadow-inner animate-in fade-in duration-500">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center">
                        <i className="fas fa-layer-group mr-2 text-blue-500"></i> AMT Context Matrix
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                        <ContextChip label="Open Location" value={setupContext.openingContext} icon="fa-map-pin" color="text-indigo-400" />
                        <ContextChip label="Dominant Participant" value={setupContext.dominantParticipant} icon="fa-users" color="text-orange-400" />
                        <ContextChip label="Strategy Type" value={setupContext.strategyType} icon="fa-chess-knight" color="text-emerald-400" />
                        <ContextChip label="Value Overlap" value={setupContext.valueOverlap} icon="fa-clone" color="text-blue-300" />
                        <ContextChip label="Value Migration" value={setupContext.valueMigration} icon="fa-arrow-trend-up" color="text-purple-400" />
                        <ContextChip label="Timing Window" value={setupContext.triggerTiming ? "Specific" : "Anytime"} icon="fa-clock" color="text-slate-400" />
                    </div>
                    {setupContext.triggerTiming && (
                        <div className="mt-6 pt-6 border-t border-slate-800/50">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Contextual Timing & Logic</p>
                            <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed">
                                "{setupContext.triggerTiming}"
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-center">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Scanner Data Unlinked</p>
                    <p className="text-[9px] text-slate-500">This custom playbook is not linked to the Algorithm Database.</p>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <StatCard label="Live Trades" value={liveStats.tradeCount} sub="REAL SAMPLES" />
               <StatCard label="BT Trades" value={btStats.tradeCount} sub="BACKTEST SAMPLES" color="text-indigo-400" />
               <StatCard label="Edge Strength" value={liveStats.pf.toFixed(2)} sub="PROFIT FACTOR" color="text-blue-400" />
               <StatCard label="Real Return" value={`$${liveStats.totalNet.toLocaleString()}`} sub="NET PROFIT" color={liveStats.totalNet >= 0 ? 'text-green-500' : 'text-red-500'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailBox label="Optimal Entry" value={setupContext?.trigger || playbook.entryAt} icon="fa-bullseye" color="text-emerald-400" />
                <DetailBox label="Profit Target" value={setupContext?.target || playbook.target} icon="fa-flag-checkered" color="text-blue-400" />
                <DetailBox label="Invalidation" value={setupContext?.invalidation || playbook.invalidation} icon="fa-lock" color="text-rose-500" />
            </div>

            {/* INTEGRATED TRAPS SECTION */}
            {((setupContext?.traps && setupContext.traps.length > 0) || (playbook.traps && playbook.traps.length > 0)) && (
                <section className="space-y-6 animate-in slide-in-from-bottom-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 border-b border-orange-500/20 pb-3 flex items-center">
                        <i className="fas fa-skull-crossbones mr-3"></i> The Architect's Traps: Risk Validation
                    </h3>
                    
                    {/* Render Traps Grid if connected to Scanner (Strings) */}
                    {setupContext?.traps ? (
                        <div className="grid grid-cols-1 gap-4">
                            {setupContext.traps.map((trapStr, idx) => {
                                const parsed = parseExcelTrap(trapStr);
                                const isFalseConviction = parsed.type.toLowerCase().includes('false conviction') || idx === 0;
                                const isAbsorption = parsed.type.toLowerCase().includes('absorption') || idx === 1;
                                const isContextShift = parsed.type.toLowerCase().includes('context') || idx === 2;

                                const borderColor = isFalseConviction ? 'border-red-500/30' : isAbsorption ? 'border-orange-500/30' : 'border-yellow-500/30';
                                const bgColor = isFalseConviction ? 'bg-red-500/5' : isAbsorption ? 'bg-orange-500/5' : 'bg-yellow-500/5';
                                const textColor = isFalseConviction ? 'text-red-400' : isAbsorption ? 'text-orange-400' : 'text-yellow-400';
                                const icon = isFalseConviction ? 'fa-ban' : isAbsorption ? 'fa-magnet' : 'fa-shuffle';

                                return (
                                    <div key={idx} className={`${bgColor} border ${borderColor} p-6 rounded-[1.5rem] group hover:bg-opacity-80 transition-all flex items-start space-x-5`}>
                                        <div className={`w-8 h-8 rounded-lg border-2 border-current flex items-center justify-center ${textColor} shrink-0 mt-1`}>
                                            <i className={`fas ${icon} text-xs`}></i>
                                        </div>
                                        <div>
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textColor}`}>
                                                {parsed.type} {parsed.title ? `// ${parsed.title}` : ''}
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{parsed.desc}"</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {playbook.traps?.map((trap, idx) => (
                                <div key={idx} className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-[1.5rem] flex items-start space-x-6">
                                    <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center text-orange-500 font-black text-xs shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-1.5">{trap.name}</h4>
                                        <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-2">{trap.label}</p>
                                        <p className="text-xs text-slate-300 leading-relaxed font-medium italic">"{trap.description}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 border-b border-slate-800 pb-3 flex items-center">
                  <i className="fas fa-brain mr-3"></i> Strategic Context & Discipline
               </h3>
               <p className="text-slate-300 text-base leading-relaxed font-medium bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 italic shadow-inner">
                  "{playbook.description || "The logic for this strategy has not been detailed yet."}"
               </p>
            </section>

            <section className="space-y-5">
               <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 border-b border-slate-800 pb-3 flex items-center">
                  <i className="fas fa-list-check mr-3"></i> Execution Pre-Conditions
               </h3>
               <div className="space-y-3">
                  {(setupContext?.criteria || playbook.entryCriteria).map((rule: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-5 p-6 bg-[#0f172a] border border-slate-800 rounded-[1.5rem] group hover:border-blue-500/30 transition-all shadow-inner">
                       <span className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-black text-xs shrink-0 border border-blue-500/20">{idx + 1}</span>
                       <p className="text-xs text-slate-200 font-black uppercase tracking-tight leading-tight">{typeof rule === 'string' ? rule : rule.text}</p>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContextChip = ({ label, value, icon, color }: { label: string, value?: string, icon: string, color: string }) => (
    <div className="flex items-start space-x-3">
        <div className={`mt-0.5 ${color}`}>
            <i className={`fas ${icon} text-xs`}></i>
        </div>
        <div>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none">
                {value ? value.replace(/_/g, ' ') : '---'}
            </p>
        </div>
    </div>
);

const BenchmarkCard = ({ label, liveVal, btVal, delta, isAbsolute = false }: any) => {
    const isNegative = delta < 0;
    return (
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex justify-between items-center group hover:bg-slate-900/60 transition-all">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline space-x-4">
                    <span className="text-xl font-black text-emerald-500">{liveVal} <span className="text-[8px] text-slate-600 ml-1">LIVE</span></span>
                    <span className="text-xl font-black text-indigo-400">{btVal} <span className="text-[8px] text-slate-600 ml-1">BT</span></span>
                </div>
            </div>
            <div className={`text-right px-4 py-2 rounded-2xl border ${isNegative ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                <p className="text-[8px] font-black uppercase tracking-tighter mb-0.5">DRIFT</p>
                <p className="text-xs font-black">{isNegative ? '' : '+'}{isAbsolute ? delta.toFixed(2) : delta.toFixed(0)}{isAbsolute ? '' : '%'}</p>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, color = "text-white" }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[1.5rem] shadow-inner text-center">
     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
     <p className={`text-2xl font-black ${color} tracking-tighter mb-0.5`}>{value}</p>
     <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">{sub}</p>
  </div>
);

const DetailBox = ({ label, value, icon, color }: any) => (
  <div className="bg-slate-900/20 border border-slate-800/60 p-6 rounded-[1.5rem] flex flex-col items-center text-center space-y-4 shadow-inner">
     <div className={`w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center ${color} border border-slate-800 shadow-lg`}>
        <i className={`fas ${icon} text-sm`}></i>
     </div>
     <div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-[11px] font-black text-white uppercase tracking-tight leading-tight">{value || '---'}</p>
     </div>
  </div>
);

export default PlaybookDetailModal;
