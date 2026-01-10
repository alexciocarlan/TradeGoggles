
import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { Trade } from '../types';
import { storageService } from '../storageService';
import { AppState } from '../AppContext';

export interface TradesSlice {
  trades: Trade[];
  tradesMap: Record<string, Trade>;
  loadTrades: () => Promise<void>;
  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  importBatchTrades: (trades: Trade[]) => Promise<number>;
}

export const createTradesSlice: StateCreator<AppState, [], [], TradesSlice> = (set, get) => ({
  trades: [],
  tradesMap: {},

  loadTrades: async () => {
    const allTrades = await storageService.getAllTrades();
    // Sortăm descrescător după dată pentru afișare corectă
    allTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const map: Record<string, Trade> = {};
    allTrades.forEach(t => map[t.id] = t);
    set({ trades: allTrades, tradesMap: map });
  },

  addTrade: async (t: Trade) => {
    await storageService.saveTrade(t);
    set(produce((state: AppState) => {
      // Adăugăm la începutul listei
      state.trades.unshift(t);
      state.tradesMap[t.id] = t;
    }));
  },

  updateTrade: async (t: Trade) => {
    await storageService.saveTrade(t);
    set(produce((state: AppState) => {
      state.tradesMap[t.id] = t;
      const idx = state.trades.findIndex(item => item.id === t.id);
      if (idx !== -1) state.trades[idx] = t;
    }));
  },
  
  deleteTrade: async (id: string) => {
    // 1. Ștergere din baza de date
    await storageService.deleteTrade(id);
    
    // 2. Actualizare Stare Locală
    set(produce((state: AppState) => {
      // Ștergem din Map
      if (state.tradesMap[id]) {
        delete state.tradesMap[id];
      }
      
      // Ștergem din Array-ul principal
      const initialLen = state.trades.length;
      state.trades = state.trades.filter(t => t.id !== id);
      
      console.log(`[TradesSlice] Deleted trade ${id}. List size: ${initialLen} -> ${state.trades.length}`);
    }));
  },

  importBatchTrades: async (newTrades: Trade[]) => {
    const start = performance.now();
    
    // Optimizare: Bulk add în DB dacă suportă (Dexie suportă bulkPut)
    // Momentan iterăm pentru siguranță
    for (const t of newTrades) {
      await storageService.saveTrade(t);
    }
    
    // Reîncărcăm tot pentru consistență după import masiv
    await get().loadTrades();
    return performance.now() - start;
  }
});
