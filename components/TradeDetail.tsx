
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trade, Account, DailyPrepData, Playbook } from '../types';
import { analyzeTrade } from '../geminiService';
import NewTradeModal from './NewTradeModal';
import { Language } from '../translations';

/* Added language to TradeDetailProps to fix TypeScript error in App.tsx */
interface TradeDetailProps {
  trades: Trade[];
  accounts: Account[];
  playbooks: Playbook[];
  dailyPreps: Record<string, DailyPrepData>;
  onUpdate: (trade: Trade) => void;
  onDelete: (id: string) => void;
  language: Language;
}

const InfoBit = ({ label, value, colorClass = "text-white" }: { label: string, value: string | number, colorClass?: string }) => (
  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</p>
    <p className={`font-semibold text-sm ${colorClass}`}>{value}</p>
  </div>
);

const SectionTitle = ({ title, icon, color }: { title: string, icon: string, color: string }) => (
  <h3 className={`text-sm font-black flex items-center mb-4 ${color}`}>
    <i className={`fas ${icon} mr-2`}></i>
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

  // Calcul Verdict: Trend Follow vs Counter Trade
  const trendVerdict = useMemo(() => {
    if (!trade) return null;
    const trend = trade.mediumTermTrend;
    const side = trade.type;

    if (trend === 'Up') {
      return side === 'LONG' 
        ? { label: 'Trend Follow', color: 'text-green-500 bg-green-500/10 border-green-500/20' } 
        : { label: 'Counter Trade', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    if (trend === 'Down') {
      return side === 'SHORT' 
        ? { label: 'Trend Follow', color: 'text-green-500 bg-green-500/10 border-green-500/20' } 
        : { label: 'Counter Trade', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
    return { label: 'Neutral / Balancing', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
  }, [trade]);

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

  // Fix: Removed reference to non-existent property screenshotUrl on type Trade
  const screenshots = trade.screenshots || [];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-slate-400 hover:text-white flex items-center transition-all"
        >
          <i className="fas fa-arrow-left mr-2"></i> Înapoi la Jurnal
        </button>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-90"
            title="Editează Trade"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            onClick={handleDelete}
            className="bg-red-900/20 p-2 rounded-lg text-red-500 hover:bg-red-900/40 transition-all hover:scale-110 active:scale-90"
            title="Șterge Trade"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full ${trade.status === 'WIN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl font-black">{trade.instrument}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${trade.type === 'LONG' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {trade.type}
                  </span>
                </div>
                <p className="text-slate-500 font-medium">
                  {new Date(trade.date).toLocaleDateString('ro-RO', { dateStyle: 'full' })} • {trade.session}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-black ${trade.pnlNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnlNet >= 0 ? `+$${trade.pnlNet.toLocaleString()}` : `-$${Math.abs(trade.pnlNet).toLocaleString()}`}
                </p>
                <div className="flex justify-end space-x-4 mt-2">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">R:R 1:{trade.rrRealized}</span>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">{trade.contracts} Contracte</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <SectionTitle title="Context & Prep" icon="fa-bullseye" color="text-purple-400" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoBit label="Bias" value={trade.bias} colorClass={trade.bias === 'Bullish' ? 'text-green-400' : trade.bias === 'Bearish' ? 'text-red-400' : 'text-white'} />
                <InfoBit label="Medium Term Trend" value={trade.mediumTermTrend} colorClass={trade.mediumTermTrend === 'Up' ? 'text-green-400' : trade.mediumTermTrend === 'Down' ? 'text-red-400' : 'text-white'} />
                <InfoBit label="Price vs pWeek" value={trade.priceVsPWeek} />
                <InfoBit label="News Impact" value={trade.newsImpact} />
              </div>
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Daily Narrative</p>
                <p className="text-sm text-slate-300 italic leading-relaxed">"{trade.dailyNarrative || 'Nicio notă despre context.'}"</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <SectionTitle title="Execuție Detaliată" icon="fa-bolt" color="text-green-400" />
              <div className="grid grid-cols-3 gap-3 mb-4">
                <InfoBit label="Entry" value={trade.entryPrice} />
                <InfoBit label="Stop Loss" value={trade.stopLoss} />
                <InfoBit label="Take Profit" value={trade.takeProfit} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoBit label="Setup" value={trade.setup} colorClass="text-blue-400" />
                <InfoBit label="Exit Real" value={trade.exitPrice} />
              </div>
              {trendVerdict && (
                <div className={`p-4 rounded-xl border text-center ${trendVerdict.color}`}>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Verdict Execuție</p>
                   <p className="text-xl font-black uppercase tracking-tighter">{trendVerdict.label}</p>
                </div>
              )}
            </div>
          </div>

          {/* Galerie Screenshot-uri Corectată */}
          <div className="space-y-6">
            <SectionTitle title="Galeria de Screenshots" icon="fa-images" color="text-blue-500" />
            {screenshots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {screenshots.map((shot, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl overflow-hidden shadow-lg group">
                    <div 
                        className="rounded-xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center border border-slate-800 mb-3 cursor-zoom-in"
                        onClick={() => setLightboxImage(shot.url)}
                    >
                        <img src={shot.url} className="w-full h-full object-contain group-hover:scale-[1.05] transition-transform duration-700" alt={`Trade Shot ${idx + 1}`} />
                    </div>
                    {shot.caption && (
                      <div className="px-2 pb-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Comentariu:</p>
                        <p className="text-xs text-slate-300 italic">"{shot.caption}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-800">
                <i className="fas fa-camera text-5xl mb-3 opacity-20"></i>
                <p className="text-xs font-black uppercase tracking-tighter opacity-20">Nicio imagine încărcată</p>
              </div>
            )}
          </div>

          {trade.notes && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <SectionTitle title="Note și Review Post-Trade" icon="fa-comment-dots" color="text-blue-400" />
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
            <SectionTitle title="Psihologie & Review" icon="fa-brain" color="text-pink-400" />
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Discipline Score</p>
                <div className="flex justify-center space-x-1">
                  {[1,2,3,4,5].map(star => (
                    <i key={star} className={`fas fa-star ${star <= trade.disciplineScore ? 'text-yellow-500' : 'text-slate-700'}`}></i>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <InfoBit label="Mental State" value={trade.mentalState} />
                <InfoBit label="Eroare Execuție" value={trade.executionError} colorClass={trade.executionError === 'None' ? 'text-green-400' : 'text-orange-400'} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-blue-900/20 to-slate-900 border border-blue-900/30 p-6 rounded-2xl shadow-xl">
             <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                <i className="fas fa-robot text-white"></i>
              </div>
              <h4 className="font-black text-sm uppercase tracking-tighter">GEMINI AI COACH</h4>
            </div>

            {!analysis && !loading && (
              <div className="space-y-4 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase">
                  Analizează acest trade pentru a identifica greșelile de execuție sau confirmările tehnice omise.
                </p>
                <button 
                  onClick={handleAIAnalysis}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-xs"
                >
                  START ANALIZĂ
                </button>
              </div>
            )}

            {loading && (
              <div className="py-10 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
                <p className="text-[10px] text-slate-500 animate-pulse font-black uppercase tracking-widest">SE ANALIZEAZĂ DATELE...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Technical Insight</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{analysis.technical}</p>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] font-black text-purple-400 uppercase mb-2">Psych Feedback</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{analysis.psychological}</p>
                </div>
                <div className="bg-blue-600/10 border border-blue-600/30 p-4 rounded-xl">
                  <p className="text-[10px] font-black text-blue-300 uppercase mb-2">Lecție Key</p>
                  <p className="text-[11px] text-slate-100 font-bold italic leading-relaxed">"{analysis.takeaway}"</p>
                </div>
                <button onClick={() => setAnalysis(null)} className="w-full text-[10px] text-slate-600 hover:text-white uppercase font-black transition-colors tracking-widest">Refă analiza</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pass required 'trades' prop to NewTradeModal to fix the TypeScript error */}
      <NewTradeModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleUpdate} 
        accounts={accounts}
        playbooks={playbooks}
        trades={trades}
        initialTrade={trade}
        dailyPreps={dailyPreps}
        language={language}
      />

      {/* Lightbox Modal pentru Screenshot-uri */}
      {lightboxImage && (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}
        >
            <button 
                className="absolute top-8 right-8 text-white/50 hover:text-white text-3xl transition-colors"
                onClick={() => setLightboxImage(null)}
            >
                <i className="fas fa-times"></i>
            </button>
            <div className="max-w-[95vw] max-h-[95vh] relative flex items-center justify-center">
                <img 
                    src={lightboxImage} 
                    className="max-w-full max-h-[90vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg select-none"
                    alt="Enlarged View"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default TradeDetail;
