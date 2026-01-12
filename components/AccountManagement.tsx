
import React, { useState, useMemo } from 'react';
import { Account, Order, AccountType, DrawdownType } from '../types';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import BenchmarkModal from './BenchmarkModal';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, account }) => {
  const activeOrders = useAppStore(useShallow(state => (state.activeOrders || []).filter(o => o.accountId === account.id)));
  if (!isOpen) return null;
  
  const displayOpenPnl = account.openPnl || 0;

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
                <p className="text-lg font-black text-white italic">${account.currentBalance?.toLocaleString() || account.initialBalance.toLocaleString()}</p>
             </div>
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 shadow-inner">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">CLOSED P&L</p>
                <p className={`text-lg font-black ${account.closedPnl && account.closedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {account.closedPnl && account.closedPnl >= 0 ? '+' : ''}{account.closedPnl?.toLocaleString() || '0'}
                </p>
             </div>
             <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 shadow-inner">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">OPEN P&L</p>
                <p className={`text-lg font-black ${displayOpenPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {displayOpenPnl >= 0 ? '+' : ''}{displayOpenPnl?.toLocaleString() || '0'}
                </p>
             </div>
          </div>

          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">PENDING ORDERS</h4>
          <div className="space-y-3">
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800/60">
                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-slate-400">{order.time}</span>
                    <span className={`text-xs font-black ${order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'} w-16`}>{order.side} {order.qty}</span>
                    <span className="text-sm font-black text-white">{order.instrument}</span>
                  </div>
                  <span className="text-sm font-black text-blue-400">${order.price} ({order.type})</span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center opacity-30">
                <i className="fas fa-box-open text-3xl text-slate-700 mb-4"></i>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No active orders</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};


interface AccountManagementProps {
  onAdd: () => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({ onAdd }) => {
  const { 
    accounts, 
    deleteAccount, 
    resetAccount,
    migrateLegacyData, 
    resetAllData,
    addNotification
  } = useAppStore(useShallow(state => ({
    accounts: state.accounts || [],
    deleteAccount: state.deleteAccount,
    resetAccount: state.resetAccount,
    migrateLegacyData: state.migrateLegacyData,
    resetAllData: state.resetAllData,
    addNotification: state.addNotification
  })));

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedAccountForOrders, setSelectedAccountForOrders] = useState<Account | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  const handleOpenOrderModal = (account: Account) => {
    setSelectedAccountForOrders(account);
    setIsOrderModalOpen(true);
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (window.confirm(`Ești sigur că vrei să ȘTERGI DEFINITIV contul "${name}"?\n\nToate tranzacțiile, setările de risc și istoricul asociat vor fi șterse ireversibil.`)) {
      try {
        await deleteAccount(id);
        addNotification('success', `Contul "${name}" a fost șters.`);
      } catch (e) {
        console.error(e);
        addNotification('error', "Eroare la ștergerea contului.");
      }
    }
  };

  const handleResetAccount = async (id: string, name: string) => {
    if (window.confirm(`Ești sigur că vrei să RESTARTEZI contul "${name}"?\n\nToate tranzacțiile vor fi șterse, balanța va reveni la inițial, dar setările contului se păstrează.`)) {
      try {
        await resetAccount(id);
        addNotification('success', `Contul "${name}" a fost resetat.`);
      } catch (e) {
        addNotification('error', "Eroare la resetarea contului.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0b1222] p-8 rounded-[2.5rem] border border-slate-800/60 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">My Accounts</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Manage your trading capital & risk profiles</p>
        </div>
        <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center">
          <i className="fas fa-plus mr-2"></i> New Account
        </button>
      </div>

      <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 bg-slate-900/20">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/40 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
              <tr>
                <th className="px-8 py-6">Name</th>
                <th className="px-6 py-6 text-center">Type</th>
                <th className="px-6 py-6 text-center">Balance</th>
                <th className="px-6 py-6 text-center">Max Drawdown</th>
                <th className="px-6 py-6 text-center">P&L (Closed)</th>
                <th className="px-6 py-6 text-center">P&L (Open)</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {accounts.map(account => (
                <tr key={account.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <i className="fas fa-wallet"></i>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{account.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{account.isPA ? 'PA' : 'Evaluation'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-blue-400 text-[10px] uppercase">{account.type}</td>
                  <td className="px-6 py-5 text-center font-black text-white text-xs">${account.currentBalance?.toLocaleString() || account.initialBalance.toLocaleString()}</td>
                  <td className="px-6 py-5 text-center font-black text-red-500 text-xs">${account.maxDrawdown.toLocaleString()} ({account.drawdownType})</td>
                  <td className={`px-6 py-5 text-center font-black text-xs ${account.closedPnl && account.closedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {account.closedPnl && account.closedPnl >= 0 ? '+' : ''}${account.closedPnl?.toLocaleString() || '0'}
                  </td>
                  <td className={`px-6 py-5 text-center font-black text-xs ${account.openPnl && account.openPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {account.openPnl && account.openPnl >= 0 ? '+' : ''}${account.openPnl?.toLocaleString() || '0'}
                  </td>
                  <td className="px-8 py-5 text-right space-x-3">
                    {account.isRithmicConnected && (
                      <button onClick={() => handleOpenOrderModal(account)} className="bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Orders</button>
                    )}
                    
                    <button 
                        onClick={() => handleResetAccount(account.id, account.name)} 
                        className="bg-[#050810] hover:bg-orange-600/10 text-orange-400 border border-slate-700 hover:border-orange-500/50 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 whitespace-nowrap"
                        title="Reset history only"
                    >
                        RESET
                    </button>

                    <button 
                        onClick={() => handleDeleteAccount(account.id, account.name)} 
                        className="bg-[#050810] hover:bg-red-600/10 text-red-500 border-2 border-slate-700 hover:border-red-500/50 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap"
                        title="Delete account and history"
                    >
                        DELETE
                    </button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center opacity-30 italic text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Scan Area Clear. No Active Accounts Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADVANCED DATA TOOLS */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center">
            <i className="fas fa-database mr-3 text-orange-500"></i> Advanced Data Tools
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
               <p className="text-[10px] font-black text-white uppercase mb-2">Migrate Legacy Journals</p>
               <p className="text-[9px] text-slate-500 font-medium leading-relaxed mb-4">
                  Dacă lipsesc înregistrări din versiuni anterioare, folosește acest tool pentru recalibrarea stocării.
               </p>
               <button 
                 onClick={() => { if(confirm('Această operațiune este grea. Ești sigur?')) migrateLegacyData(); }}
                 className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-blue-500/20 w-full"
               >
                  Start Migration
               </button>
            </div>
            
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
               <p className="text-[10px] font-black text-purple-500 uppercase mb-2">Stress Test Benchmark</p>
               <p className="text-[9px] text-slate-500 font-medium leading-relaxed mb-4">
                  Generează peste 1000 de tranzacții aleatorii pentru a testa performanța aplicației pe dispozitivul tău.
               </p>
               <button 
                 onClick={() => setIsBenchmarkOpen(true)}
                 className="bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-purple-500/20 w-full"
               >
                  Launch Benchmark
               </button>
            </div>

            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
               <p className="text-[10px] font-black text-red-500 uppercase mb-2">Factory Reset</p>
               <p className="text-[9px] text-slate-500 font-medium leading-relaxed mb-4">
                  Șterge absolut toate datele locale și resetează aplicația la starea inițială. Acțiune ireversibilă!
               </p>
               <button 
                 onClick={resetAllData}
                 className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/20 w-full"
               >
                  Reset Everything
               </button>
            </div>
         </div>
      </div>

      {selectedAccountForOrders && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          account={selectedAccountForOrders}
        />
      )}

      {isBenchmarkOpen && (
        <BenchmarkModal 
            isOpen={isBenchmarkOpen}
            onClose={() => setIsBenchmarkOpen(false)}
        />
      )}
    </div>
  );
};

export default AccountManagement;
