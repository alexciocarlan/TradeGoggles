
import React, { useState } from 'react';
import { BacktestSession, Playbook, Account, Language } from '../types';
import { useAppStore } from '../AppContext';

interface NewBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: BacktestSession) => void;
  playbooks: Playbook[];
  // language: Language; // Not used directly in this modal, so can be omitted or typed as optional if needed.
}

const NewBacktestModal: React.FC<NewBacktestModalProps> = ({ isOpen, onClose, onSave, playbooks }) => {
  const accounts = useAppStore(state => state.accounts); // NEW: Fetch accounts from store
  const backtestAccounts = accounts.filter(a => a.type === 'Backtest');

  const [formData, setFormData] = useState<Partial<BacktestSession>>({
    name: '',
    description: '',
    assetType: 'Futures',
    symbol: 'MNQ',
    playbookName: '',
    accountId: '',
    startBalance: 0,
    startDate: '',
    endDate: '',
  });

  if (!isOpen) return null;

  const handleAccountChange = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (acc) {
        setFormData({
            ...formData,
            accountId: accId,
            startBalance: acc.initialBalance
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.symbol || !formData.startBalance) return;

    const newSession: BacktestSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      accountId: formData.accountId,
      description: formData.description,
      assetType: formData.assetType as any,
      symbol: formData.symbol!,
      playbookName: formData.playbookName || 'None',
      startBalance: Number(formData.startBalance),
      currentBalance: Number(formData.startBalance),
      startDate: formData.startDate,
      endDate: formData.endDate,
      pnl: 0,
      timeSpentMinutes: 0,
      winRate: 0,
      tradeCount: 0,
      wins: 0,
      losses: 0,
      bes: 0,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newSession);
    onClose();
  };

  const labelClass = "text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest";
  const inputClass = "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-800 bg-slate-900/20">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">New Research Session</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Session Name</label>
                <input 
                type="text" 
                required
                className={inputClass}
                placeholder="Ex: MNQ Q1 2024 Drill"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
          </div>

          <div>
            <label className={labelClass}>Alocă Profil de Risc (Cont Backtest)</label>
            <select 
              required
              className={inputClass}
              value={formData.accountId}
              onChange={e => handleAccountChange(e.target.value)}
            >
              <option value="">Selectează cont din portofoliu...</option>
              {backtestAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (${acc.initialBalance.toLocaleString()})</option>
              ))}
            </select>
            {backtestAccounts.length === 0 && (
                <p className="text-[9px] text-orange-500 mt-2 font-black uppercase">Trebuie să creezi mai întâi un cont de tip "Backtest" în secțiunea "Conturile Mele".</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Asset Type</label>
            <select 
              className={inputClass}
              value={formData.assetType}
              onChange={e => setFormData({...formData, assetType: e.target.value as any})}
            >
              <option value="Futures">Futures</option>
              <option value="Stocks">Stocks</option>
              <option value="Forex">Forex</option>
              <option value="Crypto">Crypto</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Symbol</label>
            <input 
              type="text" 
              required
              className={inputClass}
              placeholder="Ex: MNQ, ES, EURUSD"
              value={formData.symbol}
              onChange={e => setFormData({...formData, symbol: e.target.value})}
            />
          </div>

          <div>
            <label className={labelClass}>Playbook Strategie</label>
            <select 
              className={inputClass}
              value={formData.playbookName}
              onChange={e => setFormData({...formData, playbookName: e.target.value})}
            >
              <option value="">Alege un Playbook (opțional)</option>
              {playbooks.map(pb => (
                <option key={pb.id} value={pb.name}>{pb.name}</option>
              ))}
            </select>
            <p className="text-[9px] text-slate-600 mt-2 font-black uppercase tracking-tight italic">
              * Selectează un playbook pentru a avea un cadru de analiză.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input 
                type="date" 
                className={inputClass}
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input 
                type="date" 
                className={inputClass}
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 active:scale-95">Start Session</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBacktestModal;
