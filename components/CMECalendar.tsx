
import React, { useState, useEffect } from 'react';
import { getCMECalendar } from '../geminiService';
import { Language } from '../translations';

/* Added language to CMECalendarProps to fix TypeScript error in App.tsx */
interface CMECalendarProps {
  language: Language;
}

const CMECalendar: React.FC<CMECalendarProps> = ({ language }) => {
  const [data, setData] = useState<{text: string, sources: any[]} | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCME = async () => {
    setLoading(true);
    const result = await getCMECalendar();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchCME();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Info */}
      <div className="bg-[#0b1222] border border-blue-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-10 relative z-10">
          <div className="lg:w-1/3 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <i className={`fas ${loading ? 'fa-sync fa-spin' : 'fa-clock'} text-white text-xl`}></i>
              </div>
              <div>
                <h3 className="text-white font-black text-xl tracking-tight uppercase">CME Group Hub</h3>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Trading Hours & Contract Life</p>
              </div>
            </div>
            <button 
              onClick={fetchCME}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest"
            >
              {loading ? "Syncing CME Data..." : "Refresh CME Calendar"}
            </button>
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Quick Reference</h4>
               <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-400">Regular Trading (RTH)</span>
                 <span className="text-xs font-bold text-white">09:30 - 16:00 EST</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-400">Electronic (ETH)</span>
                 <span className="text-xs font-bold text-white">18:00 - 17:00 EST</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-400">Market Halt</span>
                 <span className="text-xs font-bold text-orange-500">17:00 - 18:00 EST</span>
               </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-950/40 border border-slate-800/50 p-8 rounded-[2rem] backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></span>
                CME OFFICIAL SCHEDULE & NOTES
              </p>
              <div className="flex items-center space-x-3">
                 <span className="text-[9px] font-black text-slate-400 uppercase">Live Sync via AI</span>
                 {data?.sources && (
                    <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-500/10 px-2 py-1 rounded">
                      {data.sources.length} sources found
                    </span>
                 )}
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-6">
                  <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-4/6 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                </div>
              ) : (
                <div className="text-slate-200 text-sm leading-8 font-medium whitespace-pre-wrap prose prose-invert max-w-none">
                   {data?.text || "Analiza programului CME este pregătită. Apasă Refresh pentru cele mai noi date despre ore, sărbători și expirări."}
                </div>
              )}
            </div>

            {data?.sources && data.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800/50">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest uppercase tracking-[0.2em]">Validated CME Sources</p>
                <div className="flex flex-wrap gap-3">
                  {data.sources.slice(0, 4).map((chunk: any, i: number) => (
                    <a 
                      key={i} 
                      href={chunk.web?.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center space-x-3 text-[10px] bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl text-blue-400 transition-all border border-slate-800 hover:border-blue-500/50 group"
                    >
                      <i className="fas fa-link text-[8px] opacity-50 group-hover:opacity-100"></i>
                      <span className="truncate max-w-[200px] font-black uppercase tracking-tight">{chunk.web?.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <i className="fas fa-university absolute -bottom-10 -left-10 text-[200px] text-white/5 pointer-events-none"></i>
      </div>

      {/* Grid of important dates / alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Upcoming Holidays</h4>
            <div className="space-y-4">
               <HolidayRow date="Dec 24, 2025" name="Christmas Eve" impact="Early Close" />
               <HolidayRow date="Dec 25, 2025" name="Christmas Day" impact="Closed" />
               <HolidayRow date="Jan 01, 2026" name="New Year's Day" impact="Closed" />
            </div>
         </div>

         <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Contract Expirations (Rollover)</h4>
            <div className="space-y-4">
               <ContractRow symbol="ES/NQ" month="Dec 2025 (Z)" date="Dec 19, 2025" />
               <ContractRow symbol="ES/NQ" month="Mar 2026 (H)" date="Mar 20, 2026" />
               <ContractRow symbol="ES/NQ" month="Jun 2026 (M)" date="Jun 19, 2026" />
            </div>
         </div>

         <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-3xl flex flex-col justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
               <i className="fas fa-external-link-alt text-2xl"></i>
            </div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Official Trading Hours</h4>
            <p className="text-slate-500 text-[10px] font-bold leading-relaxed px-4">
               For the most accurate and real-time data, always consult the official CME Group website.
            </p>
            <a 
              href="https://www.cmegroup.com/trading-hours.html" 
              target="_blank" 
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all text-[10px] uppercase tracking-widest"
            >
              Open CME Portal
            </a>
         </div>
      </div>
    </div>
  );
};

const HolidayRow = ({ date, name, impact }: { date: string, name: string, impact: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
     <div>
        <p className="text-[10px] font-black text-white uppercase">{name}</p>
        <p className="text-[9px] font-bold text-slate-500">{date}</p>
     </div>
     <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${impact === 'Closed' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
        {impact}
     </span>
  </div>
);

const ContractRow = ({ symbol, month, date }: { symbol: string, month: string, date: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
     <div>
        <p className="text-[10px] font-black text-white uppercase">{symbol} {month}</p>
        <p className="text-[9px] font-bold text-slate-500">Expiration Date</p>
     </div>
     <span className="text-[10px] font-black text-blue-400">
        {date}
     </span>
  </div>
);

export default CMECalendar;
