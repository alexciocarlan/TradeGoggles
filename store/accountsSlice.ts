import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { startTransition } from 'react';
import { Account, Order } from '../types';
import { storageService } from '../storageService';
import { AppState } from '../AppContext';

export interface AccountsSlice {
  accounts: Account[];
  activeOrders: Order[];
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  resetAccount: (id: string) => Promise<void>;
  setActiveOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
}

export const createAccountsSlice: StateCreator<AppState, [], [], AccountsSlice> = (set, get) => ({
  accounts: [],
  activeOrders: [],

  addAccount: async (account: Account) => {
    try {
        await storageService.saveAccount(account);
        startTransition(() => {
          set(produce((state: AppState) => { 
              state.accounts.push(account); 
          }));
        });
    } catch (e) {
        console.error("Failed to add account:", e);
    }
  },

  updateAccount: async (acc: Account) => {
    await storageService.saveAccount(acc);
    startTransition(() => {
      set(produce((state: AppState) => {
        const index = state.accounts.findIndex(a => a.id === acc.id);
        if (index !== -1) state.accounts[index] = acc;
      }));
    });
  },

  deleteAccount: async (id: string) => {
    try {
        await storageService.deleteAccountComplete(id);
    } catch (error) {
        console.error("DB Error during delete:", error);
    }
    
    startTransition(() => {
      set(produce((state: AppState) => {
        state.accounts = state.accounts.filter(a => a.id !== id);
        if (state.selectedAccountId === id) {
          state.selectedAccountId = 'all';
          storageService.saveSetting('selectedAccountId', 'all');
        }
        state.trades = state.trades.filter(t => t.accountId !== id);
        Object.keys(state.tradesMap).forEach(tradeId => {
            if (state.tradesMap[tradeId].accountId === id) {
                delete state.tradesMap[tradeId];
            }
        });
      }));
    });
  },

  resetAccount: async (id: string) => {
    try {
        await storageService.resetAccountHistory(id);
    } catch (error) {
        console.error("DB Error during reset:", error);
    }

    startTransition(() => {
      set(produce((state: AppState) => {
          const accIndex = state.accounts.findIndex(a => a.id === id);
          if (accIndex !== -1) {
              state.accounts[accIndex].currentBalance = state.accounts[accIndex].initialBalance;
              state.accounts[accIndex].closedPnl = 0;
              state.accounts[accIndex].openPnl = 0;
          }
          state.trades = state.trades.filter(t => t.accountId !== id);
          Object.keys(state.tradesMap).forEach(tradeId => {
              if (state.tradesMap[tradeId].accountId === id) {
                  delete state.tradesMap[tradeId];
              }
          });
      }));
    });
  },

  setActiveOrders: (orders) => {
    startTransition(() => {
      set(produce((state: AppState) => {
        state.activeOrders = typeof orders === 'function' ? orders(state.activeOrders) : orders;
      }));
    });
  },
});
