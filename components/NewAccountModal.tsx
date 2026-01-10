
import React, { useState, useEffect } from 'react';
import { Account, AccountType, DrawdownType } from '../types';
// Removed Language import, not used directly in this modal
import { useAppStore } from '../AppContext';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  // language: Language; // Not used directly in this modal, so can be omitted or typed as optional if needed.
}

const APEX_PRESETS = [
  { label: '25k Full', balance: 25000, drawdown: 1500, target: 1500 },
  { label: '50k Full', balance: 50000, drawdown: 2500, target: 3000 },
  { label: '100k Full', balance: 100000, drawdown: 3000, target: 6000 },
  { label: '150k Full', balance: 150000, drawdown: 5000, target: 9000 },
  { label: '300k Full', balance: 300000,
    drawdown: 6000, target: 12000 },
];

const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose, onSave }) => {
  const { accounts, updateAccount } = useAppStore(); // Fetch accounts and updateAccount from store
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    type: 'Personal',
    initialBalance: 0,
    maxDrawdown: 0,
    drawdownType: 'Static',
    currency: 'USD',
    isPA: false,
  });
  const [activeTab, setActiveTab] = useState<'manual' | 'apex'>('manual');
  const [selectedApexPreset, setSelectedApexPreset] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        type: 'Personal',
        initialBalance: 0,
        maxDrawdown: 0,
        drawdownType: 'Static',
        currency: 'USD',
        isPA: false,
      });
      setActiveTab('manual');
      setSelectedApexPreset(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyApexPreset = () => {
    if (selectedApexPreset !== null) {
      const preset = APEX_PRESETS[selectedApexPreset];
      setFormData(prev => ({
        ...prev,
        type: 'Apex',
        initialBalance: preset.balance,
        maxDrawdown: preset.drawdown,
        targetProfit: preset.target,
        drawdownType: 'Trailing',
        isPA: false, // Default to evaluation, user can change later
        name: `Apex ${preset.label} Challenge`
      }));
      setActiveTab('manual'); // Switch to manual to review/edit
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.initialBalance || !formData.maxDrawdown) {
      alert('Te rog completează toate câmpurile obligatorii.');
      return;
    }

    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      currentBalance: formData.initialBalance,
      closedPnl: 0,
      openPnl: 0,
      ...formData
    } as Account;

    onSave(newAccount);
    onClose();
  };

  const inputClass = "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-800 bg-slate-900/20">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg mb-4">
              <i className="fas fa-wallet text-2xl"></i>
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">New Trading Account</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
              Add your personal or prop firm accounts
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-slate-800 mb-8">
            <button 
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Manual Input
            </button>
            <button 
              onClick={() => setActiveTab('apex')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'apex' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Apex Presets
            </button>
          </div>

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className={labelClass}>Account Name</label>
                <input 
                  type="text" 
                  required
                  className={inputClass}
                  placeholder="Ex: My Personal Account / Apex 50k"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className={labelClass}>Account Type</label>
                <select 
                  className={inputClass}
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
                >
                  <option value="Personal">Personal</option>
                  <option value="Apex">Apex</option>
                  <option value="Prop">Other Prop Firm</option>
                  <option value="Demo">Demo</option>
                  <option value="Backtest">Backtest Simulation</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Initial Balance ($)</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  className={inputClass}
                  value={formData.initialBalance}
                  onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className={labelClass}>Max Drawdown ($)</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  className={inputClass}
                  value={formData.maxDrawdown}
                  onChange={e => setFormData({...formData, maxDrawdown: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className={labelClass}>Drawdown Type</label>
                <select 
                  className={inputClass}
                  value={formData.drawdownType}
                  onChange={e => setFormData({...formData, drawdownType: e.target.value as DrawdownType})}
                >
                  <option value="Static">Static</option>
                  <option value="Trailing">Trailing</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Profit Target (Optional)</label>
                <input 
                  type="number" 
                  step="any"
                  className={inputClass}
                  value={formData.targetProfit || ''}
                  onChange={e => setFormData({...formData, targetProfit: parseFloat(e.target.value)})}
                />
              </div>

              <div className="flex items-center space-x-3 px-1">
                <input 
                  type="checkbox" 
                  checked={formData.isPA} 
                  onChange={e => setFormData({...formData, isPA: e.target.checked})} 
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" 
                />
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">
                  Is Payout Account (PA)?
                </label>
              </div>

              <div className="flex space-x-3 mt-8">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 active:scale-95">Save Account</button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-sm text-slate-400 leading-relaxed text-center font-medium">
                Select an Apex preset to quickly configure your challenge or PA account rules.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {APEX_PRESETS.map((preset, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedApexPreset(idx)}
                    className={`p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedApexPreset === idx ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div>
                      <span className="text-sm font-black text-white uppercase block mb-1">{preset.label}</span>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">${preset.balance.toLocaleString()} / DD: ${preset.drawdown.toLocaleString()}</p>
                    </div>
                    {selectedApexPreset === idx && <i className="fas fa-check-circle text-blue-500"></i>}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3 mt-8">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                <button 
                  type="button" 
                  onClick={handleApplyApexPreset} 
                  disabled={selectedApexPreset === null}
                  className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedApexPreset !== null ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 active:scale-95' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                >
                  Apply Preset & Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAccountModal;