
import React, { useState } from 'react';
import { BacktestSession, Playbook } from '../types';

interface NewBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: BacktestSession) => void;
  playbooks: Playbook[];
}

const NewBacktestModal: React.FC<NewBacktestModalProps> = ({ isOpen, onClose, onSave, playbooks }) => {
  const [formData, setFormData] = useState<Partial<BacktestSession>>({
    name: '',
    description: '',
    assetType: 'Forex',
    symbol: '',
    playbookName: '',
    startBalance: 0,
    startDate: '',
    endDate: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.symbol || !formData.startBalance) return;

    const newSession: BacktestSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name!,
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

  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block";
  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#060b13] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create new session</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className={labelClass}>Session name<span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              className={inputClass}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea 
              className={`${inputClass} h-20 resize-none`}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Connect to playbook</label>
              <button type="button" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Create new playbook</button>
            </div>
            <select 
              className={inputClass}
              value={formData.playbookName}
              onChange={e => setFormData({...formData, playbookName: e.target.value})}
            >
              <option value="">Select playbook</option>
              {playbooks.map(pb => (
                <option key={pb.id} value={pb.name}>{pb.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
              {['Forex', 'Stocks', 'Crypto', 'Futures'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, assetType: type as any})}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    formData.assetType === type 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Symbol<span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="Ex: EURUSD"
              className={inputClass}
              value={formData.symbol}
              onChange={e => setFormData({...formData, symbol: e.target.value})}
            />
          </div>

          <div>
            <label className={labelClass}>Start balance<span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input 
                type="number" 
                required
                className={`${inputClass} pl-8`}
                value={formData.startBalance}
                onChange={e => setFormData({...formData, startBalance: Number(e.target.value)})}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Leverage is 1:1</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start date<span className="text-red-500">*</span></label>
              <input 
                type="datetime-local" 
                required
                className={inputClass}
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>End date<span className="text-red-500">*</span></label>
              <input 
                type="datetime-local" 
                required
                className={inputClass}
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              Create session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBacktestModal;
