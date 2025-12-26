
import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { Language } from '../translations';

// Added language to NewAccountModalProps to fix TypeScript error in App.tsx
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

const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose, onSave, language }) => {
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: 'Apex',
    initialBalance: 50000,
    targetProfit: 53000,
    maxDrawdown: 2500,
    currency: 'USD',
    isPA: false,
    isRithmicConnected: true
  });

  const applyPreset = (preset: typeof APEX_PRESETS[0]) => {
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
        maxDailyRisk: (formData.maxDrawdown || 2500) * 0.2, // Default 20% of drawdown
        maxTradesPerDay: 5,
        maxContractsPerTrade: 2,
        dailyProfitTarget: (formData.maxDrawdown || 2500) * 0.4
      }
    } as Account);
    onClose();
  };

  const inputClass = "bg-[#162033] border border-[#2d3a52] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full text-white placeholder:text-slate-500 transition-all";
  const labelClass = "text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] mb-2 block";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b1222] border border-slate-800/60 rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 flex justify-between items-center border-b border-slate-800/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <i className="fas fa-wallet text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-tight">Adaugă Cont Nou</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">PERSONAL SAU PROP FIRM (APEX 2.0)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Row 1: Account Type and Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>TIP CONT</label>
              <select 
                className={inputClass} 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
              >
                <option value="Apex">Apex Trader Funding</option>
                <option value="Personal">Personal (Cash)</option>
                <option value="Prop">Other Prop Firm</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>NUME CONT</label>
              <input 
                type="text" 
                className={inputClass} 
                placeholder="Ex: Main PA 50k" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Apex Presets */}
          {formData.type === 'Apex' && (
            <div className="space-y-4">
              <label className={labelClass}>ALEGE PRESETARE APEX (EVALUARE)</label>
              <div className="grid grid-cols-3 gap-2">
                {APEX_PRESETS.map((p, idx) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`bg-[#162033] border border-[#2d3a52] hover:border-blue-500 p-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all text-white ${idx > 2 ? 'col-span-1.5' : ''}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Apex Type Toggle Card */}
              <div className="bg-[#0f172a] border border-blue-900/20 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-black text-blue-500 uppercase tracking-widest">TIP APEX ACCOUNT</h4>
                  <p className="text-[10px] text-slate-500 italic font-medium">Evaluare vs Performance (PA)</p>
                </div>
                <div className="flex bg-[#162033] p-1 rounded-xl border border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isPA: false})}
                    className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${!formData.isPA ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    EVAL
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isPA: true})}
                    className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${formData.isPA ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    PA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Numeric Inputs Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>BALANȚĂ INIȚIALĂ ($)</label>
              <input 
                type="number" 
                className={inputClass} 
                value={formData.initialBalance} 
                onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className={labelClass}>TARGET PROFIT ($)</label>
              <input 
                type="number" 
                className={inputClass} 
                value={formData.targetProfit} 
                onChange={e => setFormData({...formData, targetProfit: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className={labelClass}>MAX DRAWDOWN ($)</label>
              <input 
                type="number" 
                className={inputClass} 
                value={formData.maxDrawdown} 
                onChange={e => setFormData({...formData, maxDrawdown: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-[1.25rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-sm uppercase tracking-widest"
          >
            CREEAZĂ CONTUL
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewAccountModal;
