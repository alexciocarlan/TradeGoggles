
import React, { useState, useRef } from 'react';
import { Account } from '../types';
import { parseRithmicHistory, ParsedRithmicResult } from '../geminiService';
import { useAppStore } from '../AppContext';

interface RithmicSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (result: ParsedRithmicResult, manualAccountId?: string) => void;
  onLiveConnect?: (accounts: Account[]) => void;
}

const RithmicSyncModal: React.FC<RithmicSyncModalProps> = ({ isOpen, onClose, onSync }) => {
  const accounts = useAppStore(state => state.accounts);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualAccountId, setManualAccountId] = useState<string>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCsvSync = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const text = await selectedFile.text();
      const result = await parseRithmicHistory(text);
      if (result) {
        onSync(result, manualAccountId === 'auto' ? undefined : manualAccountId);
        onClose();
      }
    } catch (err: any) {
      setError("Eroare la procesarea AI: " + (err.message || "Fișier invalid."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none w-full transition-all appearance-none cursor-pointer";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.15em]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#060b13] border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="p-8 border-b border-slate-800 bg-slate-900/20">
          <div className="flex flex-col items-center text-center">
             <div className="flex items-center space-x-3 mb-2">
                <i className="fas fa-file-csv text-orange-500 text-3xl"></i>
                <h3 className="text-2xl font-black text-white italic tracking-tighter">Import Execuții</h3>
             </div>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Rithmic / NinjaTrader / Tradovate</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
            <div className="space-y-6">
               <div>
                  <label className={labelClass}>Alege Contul Destinație</label>
                  <div className="relative">
                    <select 
                      className={inputClass} 
                      value={manualAccountId} 
                      onChange={e => setManualAccountId(e.target.value)}
                    >
                      <option value="auto">✨ Detectează automat după numele din CSV</option>
                      <optgroup label="Conturi în Portofoliu">
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.isPA ? '🛡️' : '🎯'} {acc.name} ({acc.isPA ? 'PA' : 'Eval'})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                       <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                  </div>
               </div>

               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all cursor-pointer group ${selectedFile ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 hover:border-blue-500/30 bg-slate-950/20'}`}
               >
                 <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${selectedFile ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-slate-900 text-slate-500 group-hover:text-blue-400'}`}>
                    <i className={`fas ${selectedFile ? 'fa-file-check' : 'fa-cloud-upload-alt'} text-2xl`}></i>
                 </div>
                 {selectedFile ? (
                   <div className="space-y-1">
                      <p className="text-sm font-black text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB • READY</p>
                   </div>
                 ) : (
                   <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Apasă sau Drag & Drop CSV</p>
                      <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">MAX 15.000 CARACTERE</p>
                   </div>
                 )}
               </div>
            </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-[10px] font-black uppercase flex items-center animate-shake">
              <i className="fas fa-exclamation-triangle mr-3 text-lg"></i> {error}
            </div>
          )}

          <div className="flex space-x-3">
             <button onClick={onClose} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancel</button>
             <button 
                onClick={handleCsvSync} 
                disabled={loading || !selectedFile}
                className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                loading || !selectedFile ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-600/30 active:scale-95'
                }`}
            >
                {loading ? <><i className="fas fa-robot animate-pulse"></i> <span>AI Processing...</span></> : <><i className="fas fa-sync-alt"></i> <span>Sync History Now</span></>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RithmicSyncModal;
