
import React, { useState } from 'react';
import { Language } from '../types';
import { useAppStore } from '../AppContext';

const FAQ_DATA = {
  ro: [
    {
      question: "Ce este Scorul Gatekeeper?",
      answer: "Scorul Gatekeeper este un indicator al stării tale biometrice și mentale înainte de sesiune. Folosește HRV (Heart Rate Variability), calitatea somnului și auto-evaluarea pentru a determina dacă ești în 'flow' sau sub stres ridicat. Un scor mic blochează accesul la tranzacționare pentru a proteja capitalul."
    },
    {
      question: "Cum funcționează sincronizarea Rithmic?",
      answer: "Platforma se conectează la serverele Rithmic (folosite de Apex Trader Funding și alte firme de prop) pentru a importa în timp real datele tale de execuție. Poți importa și fișiere CSV manual dacă preferi modul offline."
    },
    {
      question: "Ce înseamnă un 'Toxic Win'?",
      answer: "Un 'Toxic Win' este un câștig obținut încălcând propriul plan sau strategia din Playbook. Deși balanța crește, acest tip de profit întărește obiceiurile proaste și este un indicator de risc pe termen lung."
    },
    {
      question: "Cum se calculează Behavioral Equity (BE)?",
      answer: "BE reprezintă reputația ta în fața algoritmului nostru. Crește atunci când ești disciplinat (respecti stop-loss, jurnalizezi, ai scoruri Gatekeeper bune) și scade drastic la violări grave. Un BE mare deblochează statusuri de elită precum 'The Sentinel'."
    },
    {
      question: "Datele mele sunt în siguranță?",
      answer: "Toate datele tale sunt stocate local în browser (LocalStorage). Pentru siguranță, îți recomandăm să folosești funcția de 'Backup' periodic pentru a salva progresul într-un fișier JSON extern."
    }
  ],
  en: [
    {
      question: "What is the Gatekeeper Score?",
      answer: "The Gatekeeper Score is an indicator of your biometric and mental readiness before a session. It uses HRV (Heart Rate Variability), sleep quality, and self-assessment to determine if you are in 'flow' or under high stress. A low score blocks trading access to protect your capital."
    },
    {
      question: "How does Rithmic synchronization work?",
      answer: "The platform connects to Rithmic servers (used by Apex Trader Funding and other prop firms) to import your execution data in real-time. You can also import CSV files manually if you prefer offline mode."
    },
    {
      question: "What does 'Toxic Win' mean?",
      answer: "A 'Toxic Win' is a profit made while violating your own plan or Playbook strategy. Although your balance increases, this type of profit reinforces bad habits and is a long-term risk indicator."
    },
    {
      question: "How is Behavioral Equity (BE) calculated?",
      answer: "BE represents your reputation with our algorithm. It increases when you are disciplined (respecting stop-loss, journaling, good Gatekeeper scores) and decreases drastically on severe violations. High BE unlocks elite statuses like 'The Sentinel'."
    },
    {
      question: "Is my data secure?",
      answer: "All your data is stored locally in your browser (LocalStorage). For safety, we recommend using the 'Backup' feature periodically to save your progress to an external JSON file."
    }
  ]
};

const FAQ: React.FC = () => {
  const language = useAppStore(state => state.language);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const data = FAQ_DATA[language];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center space-x-6">
        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
          <i className="fas fa-question-circle text-3xl"></i>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Întrebări Frecvente</h2>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Centrul de asistență și clarificare TradeGoggles</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, idx) => (
          <div 
            key={idx} 
            className="bg-[#0b1222] border border-slate-800 rounded-[2rem] overflow-hidden transition-all duration-300 hover:border-slate-700 shadow-xl"
          >
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-10 py-8 flex items-center justify-between text-left group"
            >
              <span className={`text-lg font-black uppercase tracking-tight transition-colors ${openIndex === idx ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>
                {item.question}
              </span>
              <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center transition-all ${openIndex === idx ? 'rotate-180 text-blue-400 border-blue-500/30' : 'text-slate-600'}`}>
                <i className="fas fa-chevron-down text-sm"></i>
              </div>
            </button>
            
            <div 
              className={`px-10 transition-all duration-500 ease-in-out overflow-hidden ${
                openIndex === idx ? 'max-h-[300px] pb-10 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-slate-950/40 p-8 rounded-3xl border border-slate-800/50">
                <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                  "{item.answer}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600/5 border border-blue-500/20 p-10 rounded-[3rem] flex items-center justify-between group overflow-hidden relative">
         <div className="relative z-10">
            <h4 className="text-white font-black uppercase tracking-widest text-base mb-2">Ai nevoie de ajutor suplimentar?</h4>
            <p className="text-slate-400 text-sm font-medium">Folosește funcția de backup pentru a-ți asigura datele sau contactează suportul tehnic.</p>
         </div>
         <i className="fas fa-brain absolute -bottom-10 -right-10 text-[200px] text-white/[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000"></i>
      </div>
    </div>
  );
};

export default FAQ;
