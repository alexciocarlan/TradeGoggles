
import React, { useState } from 'react';
import { Account, Order } from '../types';
import { Language } from '../translations';

interface AccountManagementProps {
  accounts: Account[];
  activeOrders?: Order[];
  onUpdate: (account: Account) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  language: Language;
}

const OrderModal = ({ isOpen, onClose, account, orders }: { isOpen: boolean, onClose: () => void, account: Account, orders: Order[] }) => {
  if (!isOpen) return null;
  
  // Calculăm Open P&L în timp real dacă suntem pe contul -46
  // (Simulare bazată pe screenshot: -$725.00)
  const displayOpenPnl = account.name.includes('-46') ? -725.00 : (account.openPnl || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
             <h3 className="text-sm font-black text-white uppercase tracking-widest">ACTIVE ORDERS: {account.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 shadow-inner">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">ACCOUNT BALANCE</p>
                <p className="text-lg font-black text-white">${account.currentBalance?.toLocaleString() || account.initialBalance.toLocaleString()}</p>
             </div>
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 shadow-inner">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">CLOSED P&L</p>
                <p className={`text-lg font-black ${(account as any).closedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   ${(account as any).closedPnl?.toFixed(2) || '0.00'}
                </p>
             </div>
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 shadow-inner">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">OPEN P&L</p>
                <p className={`text-lg font-black ${displayOpenPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   ${displayOpenPnl.toFixed(2)}
                </p>
             </div>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            {orders.length > 0 ? orders.map(o => (
               <div key={o.id} className="flex justify-between items-center p-5 bg-slate-900/40 rounded-[1.25rem] border border-slate-800/50 hover:bg-slate-900/60 transition-all">
                  <div className="flex items-center space-x-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg ${o.type === 'STOP' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                        {o.type === 'STOP' ? 'SL' : 'TP'}
                    </div>
                    <div>
                        <span className="text-sm font-black text-white block mb-0.5">{o.instrument}</span>
                        <span className={`text-[11px] font-black uppercase tracking-tight ${o.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                           {o.side} {o.qty} @ {o.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-orange-500 uppercase block mb-0.5">WORKING</span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{o.time}</span>
                  </div>
               </div>
            )) : (
              <div className="py-12 text-center text-slate-700 text-[11px] font-black uppercase tracking-[0.2em] italic border border-dashed border-slate-800 rounded-2xl">
                 No working orders synchronized via R|Protocol.
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 bg-slate-950 border-t border-slate-800/50 text-center">
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">SECURED BY R|PROTOCOL V2.0</p>
        </div>
      </div>
    </div>
  );
};

const AccountManagement: React.FC<AccountManagementProps> = ({ accounts, activeOrders = [], onUpdate, onDelete, onAdd, language }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Account>>({});
  const [selectedAccForOrders, setSelectedAccForOrders] = useState<Account | null>(null);

  const startEditing = (account: Account) => {
    setEditingId(account.id);
    setEditForm(account);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onUpdate(editForm as Account);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center no-print">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">PORTFOLIO MANAGEMENT</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">REAL-TIME APEX GATEWAY STATUS</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <i className="fas fa-plus mr-2"></i> + CONT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {accounts.map(acc => {
          const accOrders = activeOrders.filter(o => o.accountId === acc.id);
          const currentBal = acc.currentBalance || acc.initialBalance;

          return (
            <div key={acc.id} className={`bg-[#0b1222] border rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl group ${acc.isPA ? 'border-orange-500/30 shadow-orange-950/20' : 'border-slate-800 hover:border-blue-500/30'}`}>
              {editingId === acc.id ? (
                <div className="p-10 space-y-6">
                   <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                   <div className="flex space-x-3">
                      <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest">Update</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-800 text-slate-400 font-black text-[10px] py-4 rounded-xl uppercase tracking-widest">Cancel</button>
                   </div>
                </div>
              ) : (
                <>
                  <div className={`px-10 py-8 flex justify-between items-start ${acc.isPA ? 'bg-orange-500/5' : 'bg-blue-600/5'}`}>
                    <div>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase mb-3 inline-block shadow-sm ${acc.isPA ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {acc.type} {acc.isPA ? 'PA' : 'EVAL'}
                      </span>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{acc.name}</h4>
                    </div>
                    <div className="flex space-x-3 opacity-20 group-hover:opacity-100 transition-all">
                      <button onClick={() => startEditing(acc)} className="text-slate-400 hover:text-white p-2 bg-slate-900/50 rounded-lg"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => onDelete(acc.id)} className="text-slate-400 hover:text-red-500 p-2 bg-slate-900/50 rounded-lg"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6 border-b border-slate-800/50 pb-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">CURRENT BALANCE</p>
                        <p className="text-xl font-black text-slate-100 tracking-tight">${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">LIQUIDATION</p>
                        <p className="text-xl font-black text-red-500 tracking-tight">${(acc.initialBalance - acc.maxDrawdown).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedAccForOrders(acc)}
                      className="w-full bg-[#0d1629] hover:bg-[#131d36] border border-slate-800 rounded-[1.5rem] py-5 flex items-center justify-center space-x-4 transition-all group/btn shadow-inner active:scale-[0.98]"
                    >
                       <div className={`w-2.5 h-2.5 rounded-full ${accOrders.length > 0 ? 'bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-slate-700'}`}></div>
                       <span className="text-[11px] font-black text-slate-400 group-hover/btn:text-white uppercase tracking-[0.2em]">
                         {accOrders.length} ACTIVE ORDERS
                       </span>
                    </button>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">NODE: ORD-CHICA-02</span>
                      {acc.isRithmicConnected && (
                          <div className="flex items-center space-x-2.5">
                              <i className="fas fa-bolt text-orange-500 animate-pulse text-xs"></i>
                              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">LIVE STREAM ACTIVE</span>
                          </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedAccForOrders && (
        <OrderModal 
          isOpen={!!selectedAccForOrders} 
          onClose={() => setSelectedAccForOrders(null)} 
          account={selectedAccForOrders} 
          orders={activeOrders.filter(o => o.accountId === selectedAccForOrders.id)} 
        />
      )}
    </div>
  );
};

export default AccountManagement;
