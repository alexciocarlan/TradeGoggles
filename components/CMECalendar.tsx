
import React, { useState, useEffect } from 'react';
import { getCMECalendar } from '../geminiService';
// FIX: Changed import path for `Language` type
import { Language } from '../types';

/* Added language to CMECalendarProps to fix TypeScript error in App.tsx */
interface CMECalendarProps {
  // FIX: Removed language prop as it's now fetched from store internally
  // language: Language;
}

const CMECalendar: React.FC<CMECalendarProps> = ({ }) => {
  const [data, setData] = useState<{text: string, sources: any[]} | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCME = async (signal?: AbortSignal) => { 
    // Disabled
    setData({ text: "CME Calendar Feed Disabled.", sources: [] });
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
              disabled={true}
              className="w-full bg-slate-800 text-slate-500 font-black py-4 rounded-2xl transition-all border border-slate-700 text-xs uppercase tracking-widest cursor-not-allowed"
            >
              Feed Disabled
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
                <span className="w-2 h-2 bg-slate-600 rounded-full mr-3"></span>
                CME OFFICIAL SCHEDULE (OFFLINE)
              </p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="text-slate-500 text-sm leading-8 font-medium italic text-center py-20">
                   External data feed is disabled.
                </div>
            </div>
          </div>
        </div>
        <i className="fas fa-university absolute -bottom-10 -left-10 text-[200px] text-white/5 pointer-events-none"></i>
      </div>
    </div>
  );
};

export default CMECalendar;
