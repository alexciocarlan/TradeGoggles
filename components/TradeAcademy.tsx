
import React, { useState } from 'react';
import { Language } from '../types';
import { useAppStore } from '../AppContext';

const COURSES = [
  {
    id: 'c5',
    title: 'Mastering Execution: The Correction Matrix',
    category: 'Mindset',
    difficulty: 'Advanced',
    duration: '1h 20m',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    progress: 0,
    lessons: 9,
    description: 'Bazat pe Steenbarger și Douglas. Învață să identifici cele 9 erori critice și să aplici protocoalele de corecție automată.'
  },
  {
    id: 'c1',
    title: 'Market Profile Fundamentals',
    category: 'Technical',
    difficulty: 'Intermediate',
    duration: '2h 15m',
    image: 'https://images.unsplash.com/photo-1611974717482-45e3532c5780?auto=format&fit=crop&q=80&w=800',
    progress: 100,
    lessons: 12
  },
  {
    id: 'c2',
    title: 'Psychology of Risk',
    category: 'Mindset',
    difficulty: 'Advanced',
    duration: '1h 45m',
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800',
    progress: 45,
    lessons: 8
  },
  {
    id: 'c3',
    title: 'Order Flow Mastery',
    category: 'Execution',
    difficulty: 'Expert',
    duration: '4h 20m',
    image: 'https://images.unsplash.com/photo-1551288049-bbdac8626ad1?auto=format&fit=crop&q=80&w=800',
    progress: 12,
    lessons: 24
  },
  {
    id: 'c4',
    title: 'The Prop Firm Blueprint',
    category: 'Strategy',
    difficulty: 'Beginner',
    duration: '55m',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    progress: 0,
    lessons: 5
  }
];

const PATTERNS = [
  { name: 'Failed Auction', type: 'Reversal', reliability: 'High' },
  { name: 'Double Distribution', type: 'Trend', reliability: 'Medium' },
  { name: 'Poor High Repair', type: 'Targeting', reliability: 'Very High' },
  { name: 'Inside Day Breakout', type: 'Expansion', reliability: 'Medium' }
];

const TradeAcademy: React.FC = () => {
  const language = useAppStore(state => state.language);
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredCourses = activeFilter === 'All' 
    ? COURSES 
    : COURSES.filter(c => c.category === activeFilter);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Section */}
      <div className="relative bg-indigo-600 rounded-[3rem] p-12 overflow-hidden shadow-2xl shadow-indigo-900/20">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/10 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md border border-white/10 mb-6 inline-block">
            Knowledge is Edge
          </span>
          <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4 uppercase">Trade Academy</h1>
          <p className="text-indigo-100 text-lg font-medium leading-relaxed opacity-80">
            Dezvoltă-ți abilitățile de execuție și înțelegerea structurii pieței prin modulele noastre avansate de Market Profile și Psihologie.
          </p>
        </div>
        <i className="fas fa-graduation-cap absolute -bottom-10 -right-10 text-[260px] text-white/5 rotate-12 pointer-events-none"></i>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Filters */}
        <div className="space-y-8">
          <section>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Categorii Cursuri</h3>
            <div className="flex flex-col space-y-2">
              {['All', 'Technical', 'Mindset', 'Execution', 'Strategy'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all ${
                    activeFilter === cat 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                    : 'bg-[#0b1222] text-slate-500 hover:text-slate-300 border border-slate-800/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2rem] shadow-xl">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Quick Reference Patterns</h3>
             <div className="space-y-4">
                {PATTERNS.map(p => (
                  <div key={p.name} className="group cursor-help">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black text-slate-200 group-hover:text-blue-400 transition-colors uppercase">{p.name}</span>
                      <span className="text-[8px] font-black text-slate-600 uppercase border border-slate-800 px-1.5 rounded">{p.reliability}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">{p.type}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Course Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl flex flex-col">
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  <img src={course.image} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                  <div className="absolute top-6 left-6 flex space-x-2">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter border border-white/10">
                      {course.difficulty}
                    </span>
                  </div>
                  {course.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                      <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  )}
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{course.category}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase">{course.duration}</span>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h4>
                  {(course as any).description && (
                    <p className="text-[11px] text-slate-400 font-medium italic mb-6 leading-relaxed">
                      "{(course as any).description}"
                    </p>
                  )}
                  
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-800/50">
                    <div className="flex items-center space-x-2">
                       <i className="fas fa-play-circle text-slate-600"></i>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{course.lessons} Lecții</span>
                    </div>
                    <button className="bg-slate-800 hover:bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all group/btn shadow-lg">
                       <i className="fas fa-arrow-right text-xs group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bonus Resource Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
         <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 text-3xl shadow-inner shrink-0">
            <i className="fas fa-book-medical"></i>
         </div>
         <div className="flex-1">
            <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Resurse Strategice & PDF-uri</h4>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
               Descarcă ghidurile noastre complete pentru gestionarea dimensiunii poziției și rutinele de succes ale traderilor de elită.
            </p>
         </div>
         <button className="bg-white text-black font-black text-[11px] px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap active:scale-95 shadow-xl">
            Download Resources
         </button>
      </div>
    </div>
  );
};

export default TradeAcademy;
