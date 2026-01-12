import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { startTransition } from 'react';
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
    allTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    startTransition(() => {
      const map: Record<string, Trade> = {};
      allTrades.forEach(t => map[t.id] = t);
      set({ trades: allTrades, tradesMap: map });
    });
  },

  addTrade: async (t: Trade) => {
    await storageService.saveTrade(t);
    startTransition(() => {
      set(produce((state: AppState) => {
        state.trades.unshift(t);
        state.tradesMap[t.id] = t;
      }));
    });
  },

  updateTrade: async (t: Trade) => {
    await storageService.saveTrade(t);
    startTransition(() => {
      set(produce((state: AppState) => {
        state.tradesMap[t.id] = t;
        const idx = state.trades.findIndex(item => item.id === t.id);
        if (idx !== -1) state.trades[idx] = t;
      }));
    });
  },
  
  deleteTrade: async (id: string) => {
    await storageService.deleteTrade(id);
    startTransition(() => {
      set(produce((state: AppState) => {
        if (state.tradesMap[id]) delete state.tradesMap[id];
        state.trades = state.trades.filter(t => t.id !== id);
      }));
    });
  },

  importBatchTrades: async (newTrades: Trade[]) => {
    const startTime = performance.now();
    for (const t of newTrades) {
      await storageService.saveTrade(t);
    }
    await get().loadTrades();
    return performance.now() - startTime;
  }
});
