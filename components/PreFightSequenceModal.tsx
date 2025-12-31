
import React, { useState, useMemo } from 'react';
import { DailyPrepData, Trade, ExecutionErrorType } from '../types';
import { Language } from '../translations';

interface PreFightSequenceModalProps {
  onSave: (date: string, prep: DailyPrepData) => void;
  onClose: () => void;
  initialData?: DailyPrepData;
  initialDate?: string;
  language: Language;
  trades: Trade[];
}

const PreFightSequenceModal: React.FC<PreFightSequenceModalProps> = ({ onSave, onClose, initialData, initialDate, language, trades }) => {
  const [selectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState<DailyPrepData>(initialData || {
    gkUncertaintyAccepted: false,
    gkStopLossExecution: false,
    gkNoAddingToLoss: false,
    gkRiskCalmness: false,
    gkDailyRiskAmount: 0,
    gkFocusError: 'None'
  } as any);

  // Extragem erorile unice care au apărut în istoricul tranzacțiilor
  const historicalErrors = useMemo(() => {
    const errors = new Set<string>();
    trades.forEach(t => {
      if (t.executionError && t.executionError !== 'None') {
        errors.add(t.executionError);
      }
    });
    // Adăugăm și erorile standard în caz că setul e gol, pentru a avea opțiuni
    const standardErrors: ExecutionErrorType[] = [
      'Frica/Ezitarea la Intrare',
      'Atasamentul Emotional de Rezultat',
      'Refuzul de a Pierde (Mutarea Stop-Loss-ului)',
      'Focus pe Bani (P&L), nu pe Executie',
      'Trading Impulsiv (Fără Plan)',
      'Încălcarea Edge-ului (Style Drift)',
      'Tilt Emotional (Revenge Trading)',
      'FOMO (Fear Of Missing Out)'
    ];
    standardErrors.forEach(err => errors.add(err));
    
    return Array.from(errors).sort();
  }, [trades]);

  const checklistItems = [
    { 
        label: '"Nu știu ce va face piața și nu am nevoie să știu ca să fac bani."', 
        sub: '(Acceptarea incertitudinii)', 
        key: 'gkUncertaintyAccepted' 
    },
    { 
        label: '"Voi ieși imediat dacă piața îmi invalidează teza, fără să sper că își revine."', 
        sub: '(Execuția Stop-loss)', 
        key: 'gkStopLossExecution' 
    },
    { 
        label: '"Nu voi adăuga la o poziție pierzătoare."', 
        sub: '(Regula anti-dezastru)', 
        key: 'gkNoAddingToLoss' 
    },
    { 
        label: '"Sunt pregătit să pierd riscul alocat azi și să rămân calm."', 
        sub: '', 
        key: 'gkRiskCalmness',
        hasInput: true
    },
  ];

  const handleToggle = (key: string) => {
    setFormData({ ...formData, [key]: !(formData as any)[key] });
  };

  const allChecked = formData.gkUncertaintyAccepted && 
                    formData.gkStopLossExecution && 
                    formData.gkNoAddingToLoss && 
                    formData.gkRiskCalmness &&
                    formData.gkFocusError !== 'None';

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl overflow-y-auto">
      <div className="bg-[#060b13] border border-slate-800/60 rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-800/40 flex justify-between items-start">
          <div>
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">MENTAL STATE CALIBRATION</h4>
            <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
              MENTAL REHEARSAL <br/>
              <span className="text-slate-500 not-italic text-sm font-bold uppercase tracking-widest">(Vizualizarea - Tehnica Mark Douglas)</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-10 space-y-10">
           <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl">
                 <p className="text-sm text-orange-400 font-black uppercase tracking-tight">
                    Obiectiv: Pregătirea creierului pentru durerea pierderii și tentația profitului.
                 </p>
              </div>
           </div>

           {/* Noua Secțiune de Focalizare pe Corecție */}
           <div className="bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-[2rem] space-y-4 shadow-inner">
              <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-bullseye text-xs"></i>
                 </div>
                 <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">Astăzi mă concentrez pe a corecta:</h3>
              </div>
              
              <div className="relative group">
                <select 
                  value={formData.gkFocusError} 
                  onChange={(e) => setFormData({...formData, gkFocusError: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-xs font-black text-white uppercase tracking-widest appearance-none focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="None">Alege eroarea pentru corecție...</option>
                  {historicalErrors.map(err => (
                    <option key={err} value={err}>{err}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></i>
              </div>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest text-center italic">
                 * Această eroare va fi marcată ca prioritate în execuția de azi.
              </p>
           </div>

           <div>
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">CHECKLIST PSIHOLOGIC (TREBUIE BIFATE TOATE):</h3>
              <div className="space-y-3">
                 {checklistItems.map((item) => (
                    <div 
                      key={item.key} 
                      onClick={() => handleToggle(item.key)}
                      className={`flex items-start p-6 bg-[#0b1222]/40 border rounded-3xl transition-all cursor-pointer group ${
                        (formData as any)[item.key] 
                        ? 'border-blue-500/40 bg-blue-500/[0.03]' 
                        : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                       <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all mr-6 mt-1 shrink-0 ${
                         (formData as any)[item.key] 
                         ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                         : 'border-slate-800 bg-slate-900 group-hover:border-slate-600'
                       }`}>
                          {(formData as any)[item.key] && <i className="fas fa-check text-xs"></i>}
                       </div>
                       <div className="flex-1">
                          <p className={`text-[13px] font-bold leading-relaxed ${(formData as any)[item.key] ? 'text-white' : 'text-slate-300'}`}>
                            {item.label}
                          </p>
                          {item.sub && (
                            <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest">{item.sub}</p>
                          )}
                          {item.hasInput && (
                            <div className="mt-3 flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Suma Risc ($):</span>
                                <input 
                                    type="number" 
                                    value={formData.gkDailyRiskAmount || ''} 
                                    onChange={(e) => setFormData({...formData, gkDailyRiskAmount: parseInt(e.target.value) || 0})}
                                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-black text-white w-24 outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-10 border-t border-slate-800/40 bg-[#060b13] flex space-x-4">
            <button onClick={onClose} className="flex-1 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-[11px] uppercase tracking-widest transition-all">Sunt nesigur</button>
            <button 
              disabled={!allChecked}
              onClick={() => onSave(selectedDate, formData)} 
              className={`flex-[2] py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${
                allChecked 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' 
                : 'bg-slate-900 text-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              {allChecked ? 'Am acceptat incertitudinea. Start.' : 'Bifează toate punctele'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PreFightSequenceModal;
