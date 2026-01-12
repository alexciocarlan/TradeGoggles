
import React, { useState, useEffect } from 'react';
import { getFinancialCalendar } from '../geminiService';
// FIX: Changed import path for `Language` type
import { Language } from '../types';

/* Added language to EconomicCalendarProps to fix TypeScript error in App.tsx */
interface EconomicCalendarProps {
  // FIX: Removed language prop as it's now fetched from store internally
  // language: Language;
}

const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ }) => {
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

  const fetchCalendar = async (signal?: AbortSignal) => { 
    // Disabled
    setData({ text: "Economic Calendar Feed Disabled.", sources: [] });
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
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                   Feed Disabled.
                </td>
              </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EconomicCalendar;
