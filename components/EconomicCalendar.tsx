
import React, { useState, useEffect } from 'react';
import { getFinancialCalendar } from '../geminiService';
import { Language } from '../translations';

/* Added language to EconomicCalendarProps to fix TypeScript error in App.tsx */
interface EconomicCalendarProps {
  language: Language;
}

const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<'economic' | 'earnings'>('economic');
  const [data, setData] = useState<{text: string, sources: any[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const days = [
    { name: 'Mon', num: 15 },
    { name: 'Tue', num: 16 },
    { name: 'Wed', num: 17 },
    { name: 'Thu', num: 18 },
    { name: 'Fri', num: 19 },
    { name: 'Sat', num: 20 },
    { name: 'Sun', num: 21 },
  ];

  const fetchCalendar = async () => {
    setLoading(true);
    const result = await getFinancialCalendar(activeTab);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchCalendar();
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Day Selector Bar */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-2 flex justify-between">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${
              selectedDay === i ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{day.name} {day.num}</span>
            <div className="mt-1 flex space-x-1">
              <div className="w-1 h-1 bg-orange-500 rounded-full opacity-50"></div>
              <div className="w-1 h-1 bg-red-500 rounded-full opacity-50"></div>
            </div>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('economic')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'economic' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}
          >
            Economic
          </button>
          <button 
            onClick={() => setActiveTab('earnings')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'earnings' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}
          >
            Earnings
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
           <button onClick={fetchCalendar} className="text-blue-500 text-xs font-black uppercase hover:underline flex items-center">
             <i className={`fas fa-sync-alt mr-2 ${loading ? 'fa-spin' : ''}`}></i>
             Force AI Sync
           </button>
           <div className="h-6 w-px bg-slate-800"></div>
           <span className="text-[10px] font-black text-slate-500 uppercase flex items-center">
             <i className="fas fa-clock mr-2"></i> 13:07 (UTC+2)
           </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
            <tr>
              <th className="px-8 py-4 w-24">Time</th>
              <th className="px-8 py-4 w-20">Country</th>
              <th className="px-8 py-4">Event / Description</th>
              <th className="px-8 py-4 text-right">Actual</th>
              <th className="px-8 py-4 text-right">Forecast</th>
              <th className="px-8 py-4 text-right">Prior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-8 py-6">
                    <div className="h-4 bg-slate-800 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : data?.text.includes("No data") ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                   No scheduled reports for this day.
                </td>
              </tr>
            ) : (
              <tr className="hover:bg-slate-900/30 transition-colors">
                <td colSpan={6} className="px-8 py-10">
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium custom-scrollbar max-h-[500px] overflow-y-auto">
                    {data?.text}
                  </div>
                  {data?.sources && data.sources.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-3">
                      <p className="w-full text-[9px] font-black text-slate-500 uppercase mb-2">Live Data Sources:</p>
                      {data.sources.slice(0, 3).map((chunk: any, i: number) => (
                        <a key={i} href={chunk.web?.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-blue-400 hover:border-blue-500 transition-all flex items-center space-x-2">
                          <i className="fas fa-external-link-alt text-[8px]"></i>
                          <span className="font-bold uppercase tracking-tighter">{chunk.web?.title || 'External Feed'}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Helpful Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
         <a href="https://www.tradingview.com/economic-calendar/" target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase">TradingView</p>
               <h4 className="text-white font-bold">Economic Full Feed</h4>
            </div>
            <i className="fas fa-chart-line text-slate-700 group-hover:text-blue-500 transition-colors text-2xl"></i>
         </a>
         <a href="https://www.investing.com/earnings-calendar/" target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between group hover:border-orange-500/50 transition-all">
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase">Investing.com</p>
               <h4 className="text-white font-bold">Earnings Calendar</h4>
            </div>
            <i className="fas fa-coins text-slate-700 group-hover:text-orange-500 transition-colors text-2xl"></i>
         </a>
         <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all">
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase">Forex Factory</p>
               <h4 className="text-white font-bold">High Impact Alerts</h4>
            </div>
            <i className="fas fa-bullhorn text-slate-700 group-hover:text-red-500 transition-colors text-2xl"></i>
         </a>
      </div>

      <p className="text-[10px] font-bold text-slate-600 uppercase text-center mt-10 tracking-[0.3em]">
        How to use Economic Calendar • Sync with AI to identify volatility windows
      </p>
    </div>
  );
};

export default EconomicCalendar;
