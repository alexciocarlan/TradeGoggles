
import React, { useState, useEffect } from 'react';
import { Account, AccountType, DrawdownType } from '../types';
import { Language } from '../translations';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  language: Language;
}

const APEX_PRESETS = [
  { label: '25k Full', balance: 25000, drawdown: 1500, target: 1500 },
  { label: '50k Full', balance: 50000, drawdown: 2500, target: 3000 },
  { label: '100k Full', balance: 100000, drawdown: 3000, target: 6000 },
  { label: '150k Full', balance: 150000, drawdown: 5000, target: 9000 },
  { label: '300k Full', balance: 300000, drawdown: 7500, target: 20000 },
];

const BT_PRESETS = [
  { label: 'Lab 50k', balance: 50000, drawdown: 2500, target: 3000 },
  { label: 'Lab 100k', balance: 100000, drawdown: 3000, target: 6000 },
  { label: 'Lab 250k', balance: 250000, drawdown: 5000, target: 15000 },
];

const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose, onSave, language }) => {
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: 'Apex',
    initialBalance: 50000,
    targetProfit: 53000,
    maxDrawdown: 2500,
    drawdownType: 'Trailing',
    trailingStopThreshold: 100,
    currency: 'USD',
    isPA: false,
    isRithmicConnected: false
  });

  // Autoconfigurare drawdown bazat pe tipul contului (Evaluare vs PA)
  useEffect(() => {
    if (formData.type === 'Apex') {
      if (formData.isPA) {
        setFormData(prev => ({ ...prev, drawdownType: 'Trailing', trailingStopThreshold: 100 }));
      } else {
        setFormData(prev => ({ ...prev, drawdownType: 'Trailing', trailingStopThreshold: 999999 })); // Trailing infinit în Eval
      }
    }
  }, [formData.isPA, formData.type]);

  const applyPreset = (preset: any) => {
    setFormData(prev => ({
      ...prev,
      initialBalance: preset.balance,
      maxDrawdown: preset.drawdown,
      targetProfit: preset.target + preset.balance
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      riskSettings: {
        maxTotalRisk: formData.maxDrawdown || 2500,
        maxDailyRisk: (formData.maxDrawdown || 2500) * 0.2, 
        maxTradesPerDay: 5,
        maxContractsPerTrade: 10, 
        dailyProfitTarget: (formData.maxDrawdown || 2500) * 0.4,
        calcMode: 'fixedSL',
        fixedSlPoints: 40,
        rrRatio: 2,
        preferredInstrument: 'MNQ'
      }
    } as Account);
    onClose();
  };

  const inputClass = "bg-[#162033] border border-[#2d3a52] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full text-white placeholder:text-slate-500 transition-all";
  const labelClass = "text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] mb-2 block";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b1222] border border-slate-800/60 rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <i className="fas fa-wallet text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-tight">Configurare Cont Nou</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">DEFINIRE PORTFOLIO ȘI RISC</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>TIP CONT</label>
              <select 
                className={inputClass} 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
              >
                <option value="Apex">Apex Trader Funding</option>
                <option value="Backtest">Backtesting Lab</option>
                <option value="Personal">Personal (Cash)</option>
                <option value="Prop">Other Prop Firm</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>NUME CONT (EX: LAB-V1)</label>
              <input type="text" className={inputClass} placeholder="Account Reference" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
          </div>

          {formData.type === 'Apex' && (
            <div className="space-y-4">
              <label className={labelClass}>ALEGE PRESETARE APEX (OFFICIAL)</label>
              <div className="grid grid-cols-3 gap-2">
                {APEX_PRESETS.map((p) => (
                  <button key={p.label} type="button" onClick={() => applyPreset(p)} className="bg-[#162033] border border-[#2d3a52] hover:border-blue-500 p-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all text-white">{p.label}</button>
                ))}
              </div>
              <div className="bg-[#0f172a] border border-blue-900/20 p-6 rounded-2xl flex items-center justify-between">
                <div><h4 className="text-[12px] font-black text-blue-500 uppercase tracking-widest">FAZA CONTULUI</h4><p className="text-[10px] text-slate-500 italic font-medium">Evaluare vs Performance (PA)</p></div>
                <div className="flex bg-[#162033] p-1 rounded-xl border border-slate-800">
                  <button type="button" onClick={() => setFormData({...formData, isPA: false})} className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${!formData.isPA ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>EVAL</button>
                  <button type="button" onClick={() => setFormData({...formData, isPA: true})} className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${formData.isPA ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>PA</button>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED DRAWDOWN SETTINGS */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
             <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Protocol Drawdown 2.0</h4>
                <div className="flex bg-black/40 p-1 rounded-lg border border-slate-700">
                    <button type="button" onClick={() => setFormData({...formData, drawdownType: 'Trailing'})} className={`px-3 py-1 text-[9px] font-black rounded transition-all uppercase ${formData.drawdownType === 'Trailing' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Trailing</button>
                    <button type="button" onClick={() => setFormData({...formData, drawdownType: 'Static'})} className={`px-3 py-1 text-[9px] font-black rounded transition-all uppercase ${formData.drawdownType === 'Static' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Static</button>
                </div>
             </div>
             
             {formData.drawdownType === 'Trailing' && (
                <div className="animate-in slide-in-from-top-1 duration-300">
                    <label className={labelClass}>Oprește Trailing la (Balanță + $):</label>
                    <div className="relative">
                        <input type="number" className={inputClass} value={formData.trailingStopThreshold} onChange={e => setFormData({...formData, trailingStopThreshold: parseFloat(e.target.value)})} />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-500 uppercase">Apex PA Default: 100$</div>
                    </div>
                    <p className="text-[9px] text-slate-500 italic mt-2">* În modul Evaluare setarea este ignorată (Trailing infinit).</p>
                </div>
             )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>BALANȚĂ ($)</label><input type="number" className={inputClass} value={formData.initialBalance} onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value)})} /></div>
            <div><label className={labelClass}>TARGET ($)</label><input type="number" className={inputClass} value={formData.targetProfit} onChange={e => setFormData({...formData, targetProfit: parseFloat(e.target.value)})} /></div>
            <div><label className={labelClass}>DRAWDOWN ($)</label><input type="number" className={inputClass} value={formData.maxDrawdown} onChange={e => setFormData({...formData, maxDrawdown: parseFloat(e.target.value)})} /></div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-[1.25rem] transition-all shadow-xl shadow-indigo-600/30 active:scale-95 text-sm uppercase tracking-widest">ADĂUGARE CONT ÎN PORTFOLIO</button>
        </form>
      </div>
    </div>
  );
};

export default NewAccountModal;
