import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trade, Account, DailyPrepData, Playbook } from '../types';
import { analyzeTrade } from '../geminiService';
import NewTradeModal from './NewTradeModal';
import { Language } from '../translations';

interface TradeDetailProps {
  trades: Trade[];
  accounts: Account[];
  playbooks: Playbook[];
  dailyPreps: Record<string, DailyPrepData>;
  onUpdate: (trade: Trade) => void;
  onDelete: (id: string) => void;
  language: Language;
}

const InfoBit = ({ label, value, colorClass = "text-white", icon }: { label: string, value: string | number, colorClass?: string, icon?: string }) => (
  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-all">
    <div className="flex items-center space-x-2 mb-1.5">
      {icon && <i className={`fas ${icon} text-[8px] text-slate-500`}></i>}
      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{label}</p>
    </div>
    <p className={`font-black text-xs uppercase tracking-tight ${colorClass}`}>{value || 'N/A'}</p>
  </div>
);

const SectionTitle = ({ title, icon, color }: { title: string, icon: string, color: string }) => (
  <h3 className={`text-[11px] font-black flex items-center mb-6 tracking-[0.2em] ${color}`}>
    <i className={`fas ${icon} mr-3`}></i>
    {title.toUpperCase()}
  </h3>
);

const TradeDetail: React.FC<TradeDetailProps> = ({ trades, accounts, playbooks, dailyPreps, onUpdate, onDelete, language }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trade = trades.find(t => t.id === id);
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const prep = useMemo(() => {
    if (!trade) return null;
    return dailyPreps[trade.date];
  }, [trade, dailyPreps]);

  const isToxicWin = useMemo(() => {
    return trade && trade.isAccordingToPlan === 'NU' && trade.pnlNet > 0;
  }, [trade]);

  const strategicProtocol = useMemo(() => {
    if (!prep) return [];
    const protocol: string[] = [];
    if (prep.mediumTermTrend === 'Up') protocol.push("BIAS: TREND UP. HOLD LONGS.");
    else if (prep.mediumTermTrend === 'Down') protocol.push("BIAS: TREND DOWN. HOLD SHORTS.");
    
    if (prep.pdValueRelationship === 'GAP') protocol.push("OPEN: GAP STATE. VOLATILITY HIGH.");
    if (prep.marketCondition === 'Trend') protocol.push("REGIME: MOMENTUM ACTIVE.");
    else if (prep.marketCondition === 'Bracket') protocol.push("REGIME: BRACKETING. FADE EDGES.");
    
    return protocol;
  }, [prep]);

  const trendVerdict = useMemo(() => {
    if (!trade) return null;
    const htfStructure = prep?.mediumTermTrend || trade.mediumTermTrend;
    const side = trade.type;

    if (htfStructure === 'Up') {
      return side === 'LONG' 
        ? { label: 'Trend Alignment', desc: 'Aliniere pozitivă cu structura HTF Bullish.', color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20', icon: 'fa-arrow-up-right-dots' } 
        : { label: 'Counter Trade', desc: 'Execuție împotriva trendului dominant HTF Bullish.', color: 'text-rose-500 bg-rose-500/5 border-rose-500/20', icon: 'fa-hand-dots' };
    }
    if (htfStructure === 'Down') {
      return side === 'SHORT' 
        ? { label: 'Trend Alignment', desc: 'Aliniere pozitivă cu structura HTF Bearish.', color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20', icon: 'fa-arrow-down-right-dots' } 
        : { label: 'Counter Trade', desc: 'Execuție împotriva trendului dominant HTF Bearish.', color: 'text-rose-500 bg-rose-500/5 border-rose-500/20', icon: 'fa-hand-dots' };
    }
    if (htfStructure === 'Balancing') {
        return { label: 'Mean Reversion', desc: 'Tranzacție rotațională în interiorul balanței.', color: 'text-blue-400 bg-blue-500/5 border-blue-500/20', icon: 'fa-arrows-rotate' };
    }
    
    return { label: 'Neutral / Unknown', desc: 'Context HTF nedefinit în pregătire.', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', icon: 'fa-question' };
  }, [trade, prep]);

  if (!trade) return <div className="p-8 text-center text-slate-400">Tranzacția nu a fost găsită.</div>;

  const handleAIAnalysis = async () => {
    setLoading(true);
    const result = await analyzeTrade(trade);
    setAnalysis(result);
    setLoading(false);
  };

  const handleDelete = () => {
    if (confirm('Ești sigur că vrei să ștergi această tranzacție? Această acțiune este ireversibilă.')) {
      onDelete(trade.id);
      navigate(-1);
    }
  };

  const handleUpdate = (updatedTrade: Trade) => {
    onUpdate(updatedTrade);
    if (updatedTrade.pnlNet !== trade.pnlNet || updatedTrade.notes !== trade.notes) {
      setAnalysis(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => navigate(-1)} className="bg-[#0b1222] border border-slate-800 px-6 py-2.5 rounded-xl text-slate-400 hover:text-white flex items-center transition-all text-[11px] font-black uppercase tracking-widest shadow-xl">
          <i className="fas fa-arrow-left mr-3"></i> Înapoi la Jurnal
        </button>
        <div className="flex space-x-3">
          <button onClick={() => setIsEditModalOpen(true)} className="bg-[#0b1222] border border-slate-800 p-3 rounded-xl text-slate-400 hover:text-blue-400 transition-all shadow-xl" title="Editează Trade"><i className="fas fa-edit text-sm"></i></button>
          <button onClick={handleDelete} className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-red-500 hover:bg-red-900/40 transition-all shadow-xl" title="Șterge Trade"><i className="fas fa-trash text-sm"></i></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-700">
        <div className="lg:col-span-3 space-y-8">
          
          <div className={`bg-[#0b1222] border ${isToxicWin ? 'border-fuchsia-500/60 shadow-[0_0_50px_rgba(217,70,239,0.15)]' : 'border-slate-800'} p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl transition-all duration-700`}>
            <div className={`absolute top-0 right-0 w-64 h-64 opacity-[0.05] blur-3xl rounded-full ${isToxicWin ? 'bg-fuchsia-500' : trade.status === 'WIN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
              <div className="flex items-center space-x-8">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl border-2 ${isToxicWin ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-500 animate-pulse' : trade.status === 'WIN' ? 'bg-green-500/10 border-green-500/40 text-green-500' : 'bg-red-500/10 border-red-500/40 text-red-500'}`}>
                    <i className={`fas ${isToxicWin ? 'fa-biohazard' : trade.type === 'LONG' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                </div>
                <div>
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-4xl font-black text-white italic tracking-tighter uppercase">{trade.instrument}</span>
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${trade.type === 'LONG' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-600/10 text-rose-400 border-rose-500/30'}`}>
                      {trade.type}
                    </span>
                    {isToxicWin && (
                        <span className="bg-fuchsia-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg animate-bounce">TOXIC WIN</span>
                    )}
                  </div>
                  <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">
                    {new Date(trade.date).toLocaleDateString('ro-RO', { dateStyle: 'full' }).toUpperCase()} <span className="mx-2 text-slate-800">|</span> {trade.session}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-5xl font-black italic tracking-tighter leading-none mb-2 ${isToxicWin ? 'text-fuchsia-500' : trade.pnlNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.pnlNet >= 0 ? `+$${trade.pnlNet.toLocaleString()}` : `-$${Math.abs(trade.pnlNet).toLocaleString()}`}
                </p>
                <div className="flex justify-end items-center space-x-4">
                  <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest bg-slate-900 px-3 py-1 rounded border border-slate-800">R:R 1:{trade.rrRealized}</span>
                  <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest bg-slate-900 px-3 py-1 rounded border border-slate-800">{trade.contracts} LOTS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0b1222]/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
              <SectionTitle title="Context & Prep Hub" icon="fa-bullseye" color="text-indigo-400" />
              <div className="grid grid-cols-2 gap-4 mb-8">
                <InfoBit label="Market Bias" value={prep?.bias || trade.bias} colorClass={prep?.bias === 'Bullish' ? 'text-emerald-400' : prep?.bias === 'Bearish' ? 'text-rose-400' : 'text-blue-400'} icon="fa-compass" />
                <InfoBit label="HTF Structure" value={prep?.mediumTermTrend === 'Up' ? 'Trending Up' : prep?.mediumTermTrend === 'Down' ? 'Trending Down' : prep?.mediumTermTrend || trade.mediumTermTrend} colorClass="text-white" icon="fa-sitemap" />
                <InfoBit label="Open Type" value={prep?.openType || 'Auction'} colorClass="text-orange-400" icon="fa-bolt" />
                <InfoBit label="IB Width" value={prep?.ibWidth || 'Normal'} colorClass="text-slate-300" icon="fa-arrows-left-right" />
                <InfoBit label="Price vs pWeek" value={prep?.priceVsPWeek || trade.priceVsPWeek} colorClass="text-blue-300" icon="fa-anchor" />
                <InfoBit label="Gatekeeper" value={prep ? `${prep.gkTotalScore}/100` : 'N/A'} colorClass={prep?.gkVerdict === 'Green' ? 'text-emerald-500' : 'text-rose-500'} icon="fa-shield-halved" />
              </div>
              <div className="space-y-4">
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Strategic Protocol</p>
                    <div className="space-y-2">
                        {strategicProtocol.length > 0 ? strategicProtocol.map((line, i) => (<div key={i} className="flex items-center space-x-3"><div className="w-1 h-1 rounded-full bg-blue-500"></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{line}</span></div>)) : (<p className="text-[10px] text-slate-700 italic">Nu există protocol strategic salvat.</p>)}
                    </div>
                </div>
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Daily Narrative</p><p className="text-[11px] text-slate-400 italic leading-relaxed font-medium">"{prep?.dailyNarrative || trade.dailyNarrative || 'Nicio notă înregistrată.'}"</p></div>
              </div>
            </div>

            <div className="bg-[#0b1222]/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
              <SectionTitle title="Detailed Execution" icon="fa-bolt" color="text-emerald-400" />
              <div className="grid grid-cols-3 gap-4 mb-6">
                <InfoBit label="Entry Price" value={trade.entryPrice} icon="fa-sign-in" />
                <InfoBit label="Stop Loss" value={trade.stopLoss} icon="fa-hand" />
                <InfoBit label="Take Profit" value={trade.takeProfit} icon="fa-flag-checkered" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <InfoBit label="Executed Setup" value={trade.setup} colorClass="text-blue-400" icon="fa-puzzle-piece" />
                <InfoBit label="Exit Price" value={trade.exitPrice} icon="fa-sign-out" />
              </div>
              <div className="space-y-4">
                {trendVerdict && (<div className={`p-6 rounded-2xl border flex flex-col items-center justify-center shadow-lg transition-all duration-500 ${trendVerdict.color}`}><p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Execution Verdict</p><div className="flex items-center space-x-3 mb-1"><i className={`fas ${trendVerdict.icon} text-lg`}></i><p className="text-2xl font-black uppercase tracking-tighter italic">{trendVerdict.label}</p></div><p className="text-[10px] font-bold text-center opacity-80 uppercase tracking-tight">{trendVerdict.desc}</p></div>)}
                {isToxicWin && (
                    <div className="bg-fuchsia-950/20 border border-fuchsia-500/40 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                        <i className="fas fa-skull-crossbones text-fuchsia-500 text-xl mb-3"></i>
                        <h4 className="text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-1">DOPAMINE TRAP</h4>
                        <p className="text-[9px] text-fuchsia-300/60 uppercase font-bold leading-relaxed">Câștigurile neplanificate distrug conturile în timp prin validarea indisciplinei.</p>
                    </div>
                )}
                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Duration</p><div className="flex items-center space-x-3"><i className="far fa-clock text-slate-700 text-xs"></i><span className="text-lg font-black text-slate-200">{trade.durationMinutes || '--'} MIN</span></div></div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <SectionTitle title="Visual Proof Gallery" icon="fa-images" color="text-blue-500" />
            {(trade.screenshots || []).length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-8">{(trade.screenshots || []).map((shot, idx) => (<div key={idx} className="bg-[#0b1222] border border-slate-800 p-4 rounded-[2rem] overflow-hidden shadow-2xl group transition-all hover:border-blue-500/30"><div className="rounded-2xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center border border-slate-800/50 mb-4 cursor-zoom-in" onClick={() => setLightboxImage(shot.url)}><img src={shot.url} className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-700" alt={`Trade Shot ${idx + 1}`} /></div>{shot.caption && (<div className="px-4 pb-2"><p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest italic">Observer Notes:</p><p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{shot.caption}"</p></div>)}</div>))}</div>) : (<div className="bg-[#0b1222]/30 border-2 border-dashed border-slate-800 p-20 rounded-[3rem] text-center"><i className="fas fa-camera text-5xl mb-6 text-slate-800"></i><p className="text-xs font-black uppercase tracking-[0.3em] text-slate-700">No chart evidence uploaded</p></div>)}
          </div>

          <div className="bg-[#0b1222] border border-slate-800 p-10 rounded-[3rem] shadow-xl"><SectionTitle title="Post-Mortem Review & Lesson" icon="fa-comment-dots" color="text-blue-400" /><div className="bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800/50 shadow-inner"><p className="text-sm text-slate-300 leading-relaxed font-medium italic whitespace-pre-wrap">{trade.notes || "Nicio observație post-trade înregistrată."}</p></div></div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            <SectionTitle title="Psych & Discipline" icon="fa-brain" color="text-pink-500" />
            <div className="space-y-6">
              <div className={`bg-slate-950 p-6 rounded-2xl border ${isToxicWin ? 'border-fuchsia-500/30' : 'border-slate-800'} text-center shadow-inner`}>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Discipline Score</p>
                <div className="flex justify-center space-x-2">
                  {[1,2,3,4,5].map(star => (<i key={star} className={`fas fa-star text-lg ${star <= trade.disciplineScore ? 'text-yellow-500' : 'text-slate-800'}`}></i>))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <InfoBit label="Mental State" value={trade.mentalState} icon="fa-user-clock" />
                <InfoBit label="Execution Error" value={trade.executionError} colorClass={trade.executionError === 'None' ? 'text-emerald-400' : 'text-rose-400'} icon="fa-triangle-exclamation" />
                <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-500/10"><p className="text-[9px] font-black text-blue-500 uppercase mb-2 tracking-widest">Correction Plan</p><p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{trade.correctionPlan || 'None'}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="flex items-center space-x-4 mb-8 relative z-10"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform"><i className="fas fa-robot text-white text-xl"></i></div><div><h4 className="font-black text-sm uppercase tracking-widest text-white italic">AI CORE COACH</h4><p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Deep Trade Analysis</p></div></div>
            {!analysis && !loading && (<div className="space-y-6 text-center relative z-10"><p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight italic">Identifică inconsecvențele dintre planul tău și execuția reală.</p><button onClick={handleAIAnalysis} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 active:scale-95 text-[10px] uppercase tracking-widest">RULARE ANALIZĂ AI</button></div>)}
            {loading && (<div className="py-12 flex flex-col items-center justify-center space-y-6"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400"></div><p className="text-[10px] text-slate-500 animate-pulse font-black uppercase tracking-[0.3em]">SYNCHRONIZING DATA...</p></div>)}
            {analysis && (<div className="space-y-6 animate-in slide-in-from-top-4 duration-500 relative z-10"><div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800"><p className="text-[9px] font-black text-blue-400 uppercase mb-2 tracking-widest">Technical Feedback</p><p className="text-[11px] text-slate-300 leading-relaxed font-medium">{analysis.technical}</p></div><div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800"><p className="text-[9px] font-black text-pink-400 uppercase mb-2 tracking-widest">Psychological Gap</p><p className="text-[11px] text-slate-300 leading-relaxed font-medium">{analysis.psychological}</p></div><div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl shadow-inner"><p className="text-[9px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Critical Takeaway</p><p className="text-[12px] text-slate-100 font-black italic leading-tight">"{analysis.takeaway}"</p></div><button onClick={() => setAnalysis(null)} className="w-full text-[9px] text-slate-600 hover:text-white uppercase font-black transition-colors tracking-widest">Refă analiza sistemului</button></div>)}
            <i className="fas fa-microchip absolute -bottom-10 -right-10 text-[180px] text-white/[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000"></i>
          </div>
        </div>
      </div>

      <NewTradeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdate} accounts={accounts} playbooks={playbooks} trades={trades} initialTrade={trade} dailyPreps={dailyPreps} language={language} />

      {lightboxImage && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4 animate-in fade-in duration-300 cursor-zoom-out" onClick={() => setLightboxImage(null)}><button className="absolute top-10 right-10 text-white/40 hover:text-white text-4xl transition-all hover:scale-110" onClick={() => setLightboxImage(null)}><i className="fas fa-times"></i></button><div className="max-w-[98vw] max-h-[92vh] relative flex items-center justify-center"><img src={lightboxImage} className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,1)] rounded-xl select-none" alt="Enlarged View" onClick={(e) => e.stopPropagation()} /></div></div>)}
    </div>
  );
};

export default TradeDetail;