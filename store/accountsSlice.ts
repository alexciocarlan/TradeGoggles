
import { StateCreator } from 'zustand';
import { produce } from 'immer';
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
        set(produce((state: AppState) => { 
            state.accounts.push(account); 
        }));
    } catch (e) {
        console.error("Failed to add account:", e);
    }
  },

  updateAccount: async (acc: Account) => {
    await storageService.saveAccount(acc);
    set(produce((state: AppState) => {
      const index = state.accounts.findIndex(a => a.id === acc.id);
      if (index !== -1) state.accounts[index] = acc;
    }));
  },

  deleteAccount: async (id: string) => {
    // 1. Ștergere fizică din Baza de Date (Cont + Tranzacții)
    try {
        await storageService.deleteAccountComplete(id);
    } catch (error) {
        console.error("DB Error during delete:", error);
        // Continuăm execuția pentru a curăța UI-ul chiar dacă DB are probleme
    }
    
    // 2. Actualizare STARE GLOBALĂ (Critic pentru UI instantaneu)
    set(produce((state: AppState) => {
      // A. Eliminăm contul din lista de conturi
      state.accounts = state.accounts.filter(a => a.id !== id);
      
      // B. Resetăm selecția dacă utilizatorul era pe contul șters
      if (state.selectedAccountId === id) {
        state.selectedAccountId = 'all';
        // Salvăm preferința 'all' pentru a nu căuta contul șters la refresh
        storageService.saveSetting('selectedAccountId', 'all');
      }

      // C. Eliminăm TOATE tranzacțiile care aparțineau acestui cont din memorie
      // Aceasta este partea care lipsea sau nu funcționa corect înainte
      const initialTradesCount = state.trades.length;
      state.trades = state.trades.filter(t => t.accountId !== id);
      
      // D. Curățăm și Map-ul de tranzacții (indexul rapid)
      // Iterăm cheile pentru a fi siguri (tradesMap este un obiect, nu array)
      Object.keys(state.tradesMap).forEach(tradeId => {
          if (state.tradesMap[tradeId].accountId === id) {
              delete state.tradesMap[tradeId];
          }
      });
      
      console.log(`[UI Clean] Removed account ${id} and ${initialTradesCount - state.trades.length} associated trades.`);
    }));
  },

  resetAccount: async (id: string) => {
    try {
        await storageService.resetAccountHistory(id);
    } catch (error) {
        console.error("DB Error during reset:", error);
    }

    set(produce((state: AppState) => {
        // Resetăm valorile financiare ale contului
        const accIndex = state.accounts.findIndex(a => a.id === id);
        if (accIndex !== -1) {
            state.accounts[accIndex].currentBalance = state.accounts[accIndex].initialBalance;
            state.accounts[accIndex].closedPnl = 0;
            state.accounts[accIndex].openPnl = 0;
        }
        
        // Eliminăm tranzacțiile contului din liste și map-uri
        state.trades = state.trades.filter(t => t.accountId !== id);
        Object.keys(state.tradesMap).forEach(tradeId => {
            if (state.tradesMap[tradeId].accountId === id) {
                delete state.tradesMap[tradeId];
            }
        });
    }));
  },

  setActiveOrders: (orders) => {
    set(produce((state: AppState) => {
      state.activeOrders = typeof orders === 'function' ? orders(state.activeOrders) : orders;
    }));
  },
});
