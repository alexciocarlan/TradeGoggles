
import React, { useState, useRef, useEffect } from 'react';
import { Account, Trade } from '../types';
import { parseRithmicHistory, ParsedRithmicResult } from '../geminiService';
import { Language } from '../translations';
import { rithmicLive } from '../rithmicLiveService';

interface RithmicSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (result: ParsedRithmicResult, manualAccountId?: string) => void;
  onLiveConnect: (accounts: Account[]) => void;
  accounts: Account[];
  language: Language;
}

const RithmicSyncModal: React.FC<RithmicSyncModalProps> = ({ isOpen, onClose, onSync, onLiveConnect, accounts, language }) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'live'>('live');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberCredentials, setRememberCredentials] = useState(() => localStorage.getItem('rithmic_remember') === 'true');
  const [manualAccountId, setManualAccountId] = useState<string>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Sync State
  const [liveConfig, setLiveConfig] = useState({
    user: '',
    pass: '',
    server: 'Apex. Chicago Area',
    aggregatedQuotes: true,
    userType: 'Non-Professional'
  });

  // Load saved credentials on mount
  useEffect(() => {
    if (isOpen) {
      const savedUser = localStorage.getItem('rithmic_user');
      const savedPass = localStorage.getItem('rithmic_pass');
      const savedServer = localStorage.getItem('rithmic_server');
      
      if (savedUser && savedPass) {
        setLiveConfig(prev => ({
          ...prev,
          user: savedUser,
          pass: savedPass,
          server: savedServer || prev.server
        }));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartLive = () => {
    setLoading(true);
    setError(null);

    // Salvează sau șterge credențialele în funcție de bifă
    if (rememberCredentials) {
      localStorage.setItem('rithmic_user', liveConfig.user);
      localStorage.setItem('rithmic_pass', liveConfig.pass);
      localStorage.setItem('rithmic_server', liveConfig.server);
      localStorage.setItem('rithmic_remember', 'true');
    } else {
      localStorage.removeItem('rithmic_user');
      localStorage.removeItem('rithmic_pass');
      localStorage.removeItem('rithmic_server');
      localStorage.setItem('rithmic_remember', 'false');
    }

    rithmicLive.connectWithCredentials(
      liveConfig,
      (discoveredAccounts) => {
        onLiveConnect(discoveredAccounts);
        setLoading(false);
        onClose();
      },
      (status) => {
        if (status.status === 'error') {
            setError(status.lastMessage || 'Eroare conexiune.');
            setLoading(false);
        }
      }
    );
  };

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
             <div className="flex items-center space-x-3 mb-6">
                <i className="fas fa-bolt text-green-500 text-3xl"></i>
                <h3 className="text-3xl font-black text-white italic tracking-tighter">Rithmic</h3>
             </div>
             
             <div className="flex bg-black/40 p-1 rounded-2xl border border-slate-800 w-full max-w-xs">
                <button 
                    onClick={() => setActiveTab('live')}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Live Stream
                </button>
                <button 
                    onClick={() => setActiveTab('csv')}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'csv' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    CSV Import
                </button>
             </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {activeTab === 'live' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-4">
                 <div>
                    <label className={labelClass}>User ID</label>
                    <input type="text" className={inputClass} placeholder="APEX-XXXXXX" value={liveConfig.user} onChange={e => setLiveConfig({...liveConfig, user: e.target.value})} />
                 </div>
                 <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className={inputClass} 
                        placeholder="••••••••••••" 
                        value={liveConfig.pass} 
                        onChange={e => setLiveConfig({...liveConfig, pass: e.target.value})} 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                 </div>

                 {/* Option to Remember Password */}
                 <div className="flex items-center space-x-3 px-1">
                    <button 
                      type="button"
                      onClick={() => setRememberCredentials(!rememberCredentials)}
                      className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${rememberCredentials ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700 bg-slate-900'}`}
                    >
                      {rememberCredentials && <i className="fas fa-check text-[10px] text-white"></i>}
                    </button>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none" onClick={() => setRememberCredentials(!rememberCredentials)}>
                      Remember my credentials
                    </span>
                 </div>

                 <div>
                    <label className={labelClass}>Gateway</label>
                    <select className={inputClass} value={liveConfig.server} onChange={e => setLiveConfig({...liveConfig, server: e.target.value})}>
                       <option value="Apex. Chicago Area">Apex. Chicago Area</option>
                       <option value="Rithmic Paper Trading">Rithmic Paper Trading</option>
                       <option value="Rithmic 01">Rithmic 01 (Prod)</option>
                    </select>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div>
                  <label className={labelClass}>Alege Contul Destinație (Toate conturile active)</label>
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
                  <p className="text-[9px] text-slate-600 font-bold mt-2 uppercase tracking-tight italic">
                    * Dacă alegi un cont specific, AI-ul va ignora alte conturi găsite în fișier.
                  </p>
               </div>

               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all cursor-pointer group ${selectedFile ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 hover:border-blue-500/30 bg-slate-950/20'}`}
               >
                 <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${selectedFile ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-slate-900 text-slate-500 group-hover:text-blue-400'}`}>
                    <i className={`fas ${selectedFile ? 'fa-file-csv' : 'fa-cloud-upload-alt'} text-2xl`}></i>
                 </div>
                 {selectedFile ? (
                   <div className="space-y-1">
                      <p className="text-sm font-black text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB • READY</p>
                   </div>
                 ) : (
                   <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Apasă sau Drag & Drop fișierul CSV</p>
                      <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">MAX 15.000 CARACTERE</p>
                   </div>
                 )}
               </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-[10px] font-black uppercase flex items-center animate-shake">
              <i className="fas fa-exclamation-triangle mr-3 text-lg"></i> {error}
            </div>
          )}

          <div className="flex space-x-3">
             <button onClick={onClose} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancel</button>
             {activeTab === 'live' ? (
                <button 
                    onClick={handleStartLive} 
                    disabled={loading || !liveConfig.pass}
                    className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                    loading || !liveConfig.pass ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 active:scale-95'
                    }`}
                >
                    {loading ? <><i className="fas fa-circle-notch animate-spin"></i> <span>Connecting...</span></> : <><i className="fas fa-plug"></i> <span>Activate Live Stream</span></>}
                </button>
             ) : (
                <button 
                    onClick={handleCsvSync} 
                    disabled={loading || !selectedFile}
                    className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                    loading || !selectedFile ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-600/30 active:scale-95'
                    }`}
                >
                    {loading ? <><i className="fas fa-robot animate-pulse"></i> <span>AI Syncing...</span></> : <><i className="fas fa-sync-alt"></i> <span>Sync History Now</span></>}
                </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RithmicSyncModal;
