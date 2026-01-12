import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { startTransition } from 'react';
import { BacktestSession, DailyPrepData, WeeklyPrepData, Trade } from '../types';
import { storageService } from '../storageService';
import { AppState } from '../AppContext';

export interface BacktestSessionSlice {
  backtestSessions: BacktestSession[];
  backtestTrades: Trade[];
  loadBacktestSessions: () => Promise<void>;
  loadBacktestData: () => Promise<void>;
  addBacktestSession: (session: BacktestSession) => Promise<void>;
  updateBacktestSession: (session: BacktestSession) => Promise<void>;
  saveBacktestDailyPrep: (sessionId: string, date: string, prep: Partial<DailyPrepData>) => Promise<void>;
  saveBacktestWeeklyPrep: (sessionId: string, weekId: string, prep: WeeklyPrepData) => Promise<void>;
  addBacktestTrade: (trade: Trade) => Promise<void>;
  updateBacktestTrade: (trade: Trade) => Promise<void>;
  deleteBacktestTrade: (id: string) => Promise<void>;
  deleteBacktestSession: (id: string) => Promise<void>;
}

export const createBacktestSessionSlice: StateCreator<AppState, [], [], BacktestSessionSlice> = (set, get) => ({
  backtestSessions: [],
  backtestTrades: [],
  
  loadBacktestSessions: async () => {
    const data = await storageService.loadFullAppState();
    startTransition(() => {
      set(produce((state: AppState) => { state.backtestSessions = data.backtestSessions; }));
    });
  },

  loadBacktestData: async () => {
      const allTrades = await storageService.getAllTrades();
      const btTrades = allTrades.filter(t => t.sessionId);
      startTransition(() => {
        set({ backtestTrades: btTrades });
      });
  },

  addBacktestSession: async (session: BacktestSession) => {
    await storageService.saveBacktestSession(session);
    startTransition(() => {
      set(produce((state: AppState) => { state.backtestSessions.unshift(session); }));
    });
  },
  
  updateBacktestSession: async (session: BacktestSession) => {
    await storageService.saveBacktestSession(session);
    startTransition(() => {
      set(produce((state: AppState) => {
        const index = state.backtestSessions.findIndex(item => item.id === session.id);
        if (index !== -1) state.backtestSessions[index] = session;
      }));
    });
  },
  
  saveBacktestDailyPrep: async (sessionId: string, date: string, prep: Partial<DailyPrepData>) => {
    const currentSessions = get().backtestSessions;
    const s = currentSessions.find(item => item.id === sessionId);
    if (!s) return;

    const updatedSession = produce(s, draft => {
      if (!draft.simulatedDailyPreps) draft.simulatedDailyPreps = {};
      draft.simulatedDailyPreps[date] = { ...(draft.simulatedDailyPreps[date] || {}), ...prep } as DailyPrepData;
    });

    await storageService.saveBacktestSession(updatedSession);
    startTransition(() => {
      set(produce((state: AppState) => {
        const index = state.backtestSessions.findIndex(item => item.id === sessionId);
        if (index !== -1) state.backtestSessions[index] = updatedSession;
      }));
    });
  },
  
  saveBacktestWeeklyPrep: async (sessionId: string, weekId: string, prep: WeeklyPrepData) => {
    const currentSessions = get().backtestSessions;
    const s = currentSessions.find(item => item.id === sessionId);
    if (!s) return;

    const updatedSession = produce(s, draft => {
      if (!draft.simulatedWeeklyPreps) draft.simulatedWeeklyPreps = {};
      draft.simulatedWeeklyPreps[weekId] = prep;
    });

    await storageService.saveBacktestSession(updatedSession);
    startTransition(() => {
      set(produce((state: AppState) => {
        const index = state.backtestSessions.findIndex(item => item.id === sessionId);
        if (index !== -1) state.backtestSessions[index] = updatedSession;
      }));
    });
  },

  addBacktestTrade: async (trade: Trade) => {
      await storageService.saveTrade(trade);
      startTransition(() => {
        set(produce((state: AppState) => { 
            state.backtestTrades.unshift(trade); 
        }));
      });
  },
  
  updateBacktestTrade: async (trade: Trade) => {
      await storageService.saveTrade(trade);
      startTransition(() => {
        set(produce((state: AppState) => {
            const idx = state.backtestTrades.findIndex(t => t.id === trade.id);
            if (idx !== -1) state.backtestTrades[idx] = trade;
        }));
      });
  },
  
  deleteBacktestTrade: async (id: string) => {
      await storageService.deleteTrade(id);
      startTransition(() => {
        set(produce((state: AppState) => {
            state.backtestTrades = state.backtestTrades.filter(t => t.id !== id);
        }));
      });
  },

  deleteBacktestSession: async (id: string) => {
      await storageService.deleteBacktestSession(id);
      startTransition(() => {
        set(produce((state: AppState) => {
            state.backtestSessions = state.backtestSessions.filter(s => s.id !== id);
            state.backtestTrades = state.backtestTrades.filter(t => t.sessionId !== id);
        }));
      });
  }
});
