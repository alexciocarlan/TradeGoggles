import React from 'react';
import { WeeklyNewsEvent } from '../types';

interface NewsEventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: WeeklyNewsEvent) => void;
  date: string;
  existingEvents: WeeklyNewsEvent[];
}

const NEWS_DATABASE = [
  {
    category: "I. MAXIMUM IMPACT",
    color: "text-red-500",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    tier: 3,
    events: ["Fed Interest Rate decision", "Fed press conference", "CPI MoM", "Inflation rate YoY"]
  },
  {
    category: "II. HIGH IMPACT",
    color: "text-orange-500",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    tier: 2,
    events: ["GDP MoM", "GDP YoY", "GDP Grow Rate QoQ", "GDP Grow Rate YoY"]
  },
  {
    category: "III. MEDIUM IMPACT",
    color: "text-yellow-500",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
    tier: 1,
    events: ["ISM manufacturing PMI", "ISM services PMI", "PPI MoM", "Michigan Consumer Sentiment"]
  },
  {
    category: "IV. VARIABLE IMPACT",
    color: "text-indigo-400",
    border: "border-indigo-400/20",
    bg: "bg-indigo-400/5",
    tier: 0,
    events: ["Inauguration Day", "Gov Privatization", "Debt Ceiling Deadline"]
  }
];

const TIME_SLOTS = ["15:30", "17:00", "19:30", "21:00", "21:30", "22:00"];

const NewsEventPickerModal: React.FC<NewsEventPickerModalProps> = ({ isOpen, onClose, onAddEvent, date, existingEvents }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[3rem] w-full max-w-[1400px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-10 pb-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/20">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">ADD EVENTS FOR {date}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Select category, hour and event name</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* GRID CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#060b13]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {NEWS_DATABASE.map((cat, i) => (
              <div key={i} className={`rounded-[2.5rem] border ${cat.border} ${cat.bg} p-8 flex flex-col space-y-8`}>
                <h4 className={`text-[10px] font-black ${cat.color} uppercase tracking-[0.2em]`}>{cat.category}</h4>
                
                <div className="space-y-10">
                  {cat.events.map((eventName, idx) => (
                    <div key={idx} className="space-y-4">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-tight">{eventName}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TIME_SLOTS.map(time => {
                          const isSelected = existingEvents.some(e => e.event === eventName && e.time === time);
                          return (
                            <button
                              key={time}
                              onClick={() => onAddEvent({ event: eventName, time, tier: cat.tier })}
                              className={`border py-2 rounded-lg text-[10px] font-black transition-all duration-300 ${
                                isSelected 
                                ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105' 
                                : 'bg-slate-950/60 border-slate-800 text-slate-600 hover:border-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-10 border-t border-slate-800/50 bg-[#0b1222] flex justify-end">
           <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95">FINALIZEAZĂ SELECȚIA</button>
        </div>
      </div>
    </div>
  );
};

export default NewsEventPickerModal;