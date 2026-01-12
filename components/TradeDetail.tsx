import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trade } from '../types';
import { analyzeTrade } from '../geminiService';
import { NewTradeModal } from './NewTradeModal';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

interface DetailCardProps {
  title: string;
  icon: string;
  className?: string;
}

const DetailCard = ({ title, icon, children, className = "" }: React.PropsWithChildren<DetailCardProps>) => (
  <div className={`bg-[#0b1222]/60 border border-slate-800/60 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all ${className}`}>
    <div className="flex items-center space-x-3 mb-6 border-b border-slate-800/50 pb-4">
      <i className={`fas ${icon} text-slate-600 text-xs`}></i>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</h4>
    </div>
    {children}
  </div>
);

const LabelValue = ({ label, value, colorClass = "text-white", size = "normal" }: { label: string, value: string | number, colorClass?: string, size?: "normal" | "large" }) => (
  <div>
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
    <p className={`font-black uppercase tracking-tight ${size === 'large' ? 'text-2xl' : 'text-sm'} ${colorClass}`}>{value || '---'}</p>
  </div>
);

const TradeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  
  const { tradesMap, dailyPreps, loadDailyPreps, updateTrade, deleteTrade } = useAppStore(useShallow(state => ({ 
    tradesMap: state.tradesMap, 
    dailyPreps: state.dailyPreps,
    loadDailyPreps: state.loadDailyPreps,
    updateTrade: state.updateTrade,
    deleteTrade: state.deleteTrade
  }))); 

  const [isDeleting, setIsDeleting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [frozenTrade, setFrozenTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (id && tradesMap[id] && !isDeleting) {
        setFrozenTrade(tradesMap[id]);
    }
  }, [id, tradesMap, isDeleting]);

  useEffect(() => {
    loadDailyPreps();
  }, [loadDailyPreps]);

  const prep = useMemo(() => frozenTrade ? dailyPreps[frozenTrade.date] : null, [frozenTrade, dailyPreps]);

  if (!frozenTrade && !isDeleting) return <div className="p-20 text-center text-slate-600 font-black uppercase tracking-widest">Trade Not Found</div>;
  if (!frozenTrade) return null;

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const result = await analyzeTrade(frozenTrade);
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDeleteAction = async () => {
    if (window.confirm('Ștergi definitiv această execuție?')) {
      setIsDeleting(true);
      try {
        await deleteTrade(frozenTrade.id);
        startTransition(() => {
            navigate('/trades', { replace: true });
        });
      } catch (error) {
        alert("Eroare la eliminarea datelor.");
        setIsDeleting(false);
      }
    }
  };

  const handleBack = () => {
      startTransition(() => {
          navigate('/trades');
      });
  };

  const getDuration = () => {
      if (!frozenTrade.entryTime || !frozenTrade.exitTime) return '-- min';
      const start = new Date(`2000-01-01T${frozenTrade.entryTime}`);
      const end = new Date(`2000-01-01T${frozenTrade.exitTime}`);
      const diff = (end.getTime() - start.getTime()) / 60000;
      return `${Math.round(diff)} min`;
  };

  return (
    <div className={`max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-6 ${isDeleting || isPending ? 'opacity-30 pointer-events-none' : ''}`}>
      
      {/* TOP NAVIGATION & ACTIONS */}
      <div className="flex items-center justify-between no-print">
        <button onClick={handleBack} className="bg-[#0b1222] border border-slate-800 px-6 py-2.5 rounded-xl text-slate-400 hover:text-white flex items-center text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">
          <i className="fas fa-arrow-left mr-3"></i> ÎNAPOI LA JURNAL
        </button>
        <div className="flex space-x-3">
          <button onClick={() => setIsEditModalOpen(true)} className="bg-[#0b1222] border border-slate-800 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-400 transition-all shadow-xl">
            <i className="fas fa-edit text-xs"></i>
          </button>
          <button 
            onClick={handleDeleteAction} 
            className="bg-[#0b1222] border border-red-500/20 w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            <i className="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>

      {/* HEADER CARD */}
      <div className="bg-[#0b1222]/80 border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-center gap-8">
         <div className="flex items-center space-x-8 z-10 w-full xl:w-auto">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl border-2 ${frozenTrade.pnlNet >= 0 ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-500' : 'bg-red-600/10 border-red-500/30 text-red-500'}`}>
               <i className={`fas ${frozenTrade.pnlNet >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-4xl`}></i>
            </div>
            <div>
               <div className="flex items-center space-x-4 mb-2">
                  <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{frozenTrade.instrument}</h1>
                  <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${frozenTrade.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {frozenTrade.type}
                  </span>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-4">
                   <span>{new Date(frozenTrade.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                   <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                   <span>{frozenTrade.session}</span>
               </p>
            </div>
         </div>

         <div className="flex items-center space-x-12 z-10 bg-slate-900/40 px-10 py-6 rounded-[2.5rem] border border-slate-800/50">
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">REALIZED R:R</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">1:{frozenTrade.rrRealized || 'N/A'}</p>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">SIZE (LOTS)</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">{frozenTrade.contracts}</p>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div className="text-right">
                <p className={`text-5xl font-black italic tracking-tighter leading-none ${frozenTrade.pnlNet >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {frozenTrade.pnlNet >= 0 ? '+' : '-'}${Math.abs(frozenTrade.pnlNet).toLocaleString()}
                </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMN 1: CONTEXT & EXECUTION */}
        <div className="lg:col-span-4 space-y-6">
           <DetailCard title="CONTEXT & PREP HUB" icon="fa-bullseye">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <LabelValue label="MARKET BIAS" value={frozenTrade.bias} colorClass={frozenTrade.bias === 'Bullish' ? 'text-emerald-400' : frozenTrade.bias === 'Bearish' ? 'text-red-400' : 'text-blue-400'} />
                 <LabelValue label="HTF STRUCTURE" value={prep?.htfMs} />
                 <LabelValue label="OPEN TYPE" value={prep?.openType} colorClass="text-orange-400" />
                 <LabelValue label="IB WIDTH" value={prep?.ibWidth} />
                 <LabelValue label="PRICE VS PWEEK" value={prep?.priceVsPWeek} />
                 <LabelValue label="GATEKEEPER" value={prep?.gkVerdict} colorClass={prep?.gkVerdict === 'Green' ? 'text-emerald-500' : 'text-red-500'} />
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">STRATEGIC PROTOCOL</p>
                 <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                    {prep?.dailyNarrative || "Nu există protocol strategic salvat."}
                 </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">DAILY NARRATIVE</p>
                 <p className="text-[10px] text-slate-300 font-medium italic leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                    "{frozenTrade.dailyNarrative || 'Nicio notă înregistrată.'}"
                 </p>
              </div>
           </DetailCard>

           <DetailCard title="FINANCIAL BREAKDOWN" icon="fa-coins">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">GROSS P&L</span>
                    <span className={`text-sm font-black ${frozenTrade.pnlBrut >= 0 ? 'text-slate-200' : 'text-red-400'}`}>${frozenTrade.pnlBrut}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">COMMISSIONS</span>
                    <span className="text-sm font-black text-orange-400">-${frozenTrade.commissions}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">NET P&L</span>
                    <span className={`text-xl font-black italic ${frozenTrade.pnlNet >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>${frozenTrade.pnlNet}</span>
                 </div>
              </div>
           </DetailCard>
        </div>

        {/* COLUMN 2: EXECUTION DETAILS */}
        <div className="lg:col-span-4 space-y-6">
           <DetailCard title="DETAILED EXECUTION" icon="fa-bolt">
              <div className="grid grid-cols-3 gap-4 mb-8">
                 <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[8px] text-slate-600 font-black mb-1 tracking-widest">ENTRY PRICE</p>
                    <p className="text-sm font-black text-white">{frozenTrade.entryPrice}</p>
                 </div>
                 <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[8px] text-slate-600 font-black mb-1 tracking-widest">STOP LOSS</p>
                    <p className="text-sm font-black text-red-400">{frozenTrade.stopLoss}</p>
                 </div>
                 <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[8px] text-slate-600 font-black mb-1 tracking-widest">TAKE PROFIT</p>
                    <p className="text-sm font-black text-emerald-400">{frozenTrade.takeProfit}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <LabelValue label="EXECUTED SETUP" value={frozenTrade.setup} />
                    </div>
                    <div className="flex-1">
                        <LabelValue label="EXIT PRICE" value={frozenTrade.exitPrice} />
                    </div>
                 </div>
                 
                 <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">EXECUTION VERDICT</p>
                    <div className="flex items-center justify-center space-x-2">
                        {frozenTrade.isAccordingToPlan === 'DA' ? (
                            <i className="fas fa-check-circle text-emerald-500"></i>
                        ) : frozenTrade.isAccordingToPlan === 'NU' ? (
                            <i className="fas fa-times-circle text-red-500"></i>
                        ) : (
                            <i className="fas fa-question-circle text-slate-500"></i>
                        )}
                        <span className={`text-lg font-black italic uppercase ${frozenTrade.isAccordingToPlan === 'DA' ? 'text-emerald-500' : frozenTrade.isAccordingToPlan === 'NU' ? 'text-red-500' : 'text-slate-500'}`}>
                            {frozenTrade.isAccordingToPlan === 'DA' ? 'DISCIPLINED' : frozenTrade.isAccordingToPlan === 'NU' ? 'VIOLATION' : 'NEUTRAL / UNKNOWN'}
                        </span>
                    </div>
                    {frozenTrade.isAccordingToPlan === 'None' && <p className="text-[8px] text-slate-600 mt-1 uppercase">Context HTF nedefinit în pregătire.</p>}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TIMING</p>
                        <p className="text-xs font-black text-white mt-1">{frozenTrade.entryTime || '--:--'} <i className="fas fa-arrow-right text-[8px] mx-1 text-slate-600"></i> {frozenTrade.exitTime || '--:--'}</p>
                    </div>
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">DURATION</p>
                        <div className="flex items-center space-x-2 mt-1">
                            <i className="far fa-clock text-slate-400 text-xs"></i>
                            <p className="text-sm font-black text-white">{getDuration()}</p>
                        </div>
                    </div>
                 </div>
              </div>
           </DetailCard>
        </div>

        {/* COLUMN 3: PSYCHOLOGY & COACHING */}
        <div className="lg:col-span-4 space-y-6">
           <DetailCard title="PSYCH & DISCIPLINE" icon="fa-brain">
              <div className="text-center mb-8">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">DISCIPLINE SCORE</p>
                 <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <i key={star} className={`fas fa-star text-lg ${star <= frozenTrade.disciplineScore ? 'text-yellow-500 drop-shadow-lg' : 'text-slate-800'}`}></i>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <LabelValue label="MENTAL STATE" value={frozenTrade.mentalState} />
                 </div>
                 
                 <div className={`p-4 rounded-xl border ${frozenTrade.executionError !== 'None' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">EXECUTION ERROR</p>
                    <p className={`text-xs font-black uppercase ${frozenTrade.executionError !== 'None' ? 'text-red-400' : 'text-emerald-500'}`}>{frozenTrade.executionError}</p>
                 </div>

                 <div className={`p-4 rounded-xl border ${frozenTrade.correctionPlan !== 'None' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">CORRECTION PLAN</p>
                    <p className={`text-[10px] font-bold leading-tight uppercase ${frozenTrade.correctionPlan !== 'None' ? 'text-blue-300' : 'text-slate-500'}`}>{frozenTrade.correctionPlan}</p>
                 </div>
              </div>
           </DetailCard>

           <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/40 border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center text-center py-4">
                 <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
                    <i className="fas fa-robot text-2xl"></i>
                 </div>
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-1">AI CORE COACH</h3>
                 <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">DEEP TRADE ANALYSIS</p>
                 
                 {analysis ? (
                    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-700/50 text-left w-full mb-4">
                        <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{analysis.takeaway}</p>
                    </div>
                 ) : (
                    <p className="text-[9px] text-slate-500 italic mb-6 w-3/4 mx-auto">Identifică inconsecvențele dintre planul tău și execuția reală.</p>
                 )}

                 <button 
                    onClick={handleAIAnalysis}
                    disabled={loadingAI}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl active:scale-95 flex items-center justify-center"
                 >
                    {loadingAI ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-bolt mr-2"></i>}
                    {loadingAI ? 'ANALIZĂ ÎN CURS...' : 'RULARE ANALIZĂ AI'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* VISUAL PROOF GALLERY */}
      <div className="bg-[#0b1222]/40 border border-slate-800 p-10 rounded-[3rem] shadow-xl">
         <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-8 flex items-center">
            <i className="fas fa-images mr-3"></i> VISUAL PROOF GALLERY
         </h4>
         {frozenTrade.screenshots && frozenTrade.screenshots.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {frozenTrade.screenshots.map((s, idx) => (
                    <div key={idx} className="group relative aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden cursor-zoom-in" onClick={() => setLightboxImage(s.url)}>
                        <img src={s.url} alt="Proof" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/80 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-[9px] text-slate-300 uppercase font-bold truncate">{s.caption || 'No Caption'}</p>
                        </div>
                    </div>
                ))}
             </div>
         ) : (
             <div className="h-40 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center opacity-30">
                <i className="fas fa-camera text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">NO CHART EVIDENCE UPLOADED</p>
             </div>
         )}
      </div>

      {/* POST-MORTEM NOTES */}
      <div className="bg-[#0b1222]/40 border border-slate-800 p-10 rounded-[3rem] shadow-xl">
         <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-8 flex items-center">
            <i className="fas fa-comment-dots mr-3"></i> POST-MORTEM REVIEW & LESSON
         </h4>
         <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800/50 min-h-[150px]">
            <p className="text-sm text-slate-300 font-medium italic leading-loose whitespace-pre-wrap">
                "{frozenTrade.notes || "Nicio observație post-trade înregistrată."}"
            </p>
         </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

      <NewTradeModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={(updated) => { updateTrade(updated); setFrozenTrade(updated); setIsEditModalOpen(false); }} 
        initialTrade={frozenTrade} 
        currentAccountId={frozenTrade.accountId} 
      />
    </div>
  );
};

export default TradeDetail;
