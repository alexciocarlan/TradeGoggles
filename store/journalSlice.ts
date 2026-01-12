import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { startTransition } from 'react';
import { DailyPrepData, WeeklyPrepData } from '../types';
import { storageService, db } from '../storageService';
import { AppState } from '../AppContext';

export interface JournalSlice {
  dailyPreps: Record<string, DailyPrepData>;
  weeklyPreps: Record<string, WeeklyPrepData>;
  dailyNotes: Record<string, string>;
  loadDailyPreps: (filter?: string) => Promise<void>;
  loadWeeklyPreps: () => Promise<void>;
  loadDailyNotes: (filter?: string) => Promise<void>;
  saveDailyPrep: (date: string, prep: DailyPrepData) => Promise<void>;
  saveWeeklyPrep: (weekId: string, prep: WeeklyPrepData) => Promise<void>;
  saveDailyNote: (date: string, note: string) => Promise<void>;
}

export const createJournalSlice: StateCreator<AppState, [], [], JournalSlice> = (set, get) => ({
  dailyPreps: {}, 
  weeklyPreps: {}, 
  dailyNotes: {},
  
  loadDailyPreps: async () => {
    const preps = await db.dailyPreps.toArray();
    startTransition(() => {
      set({ dailyPreps: preps.reduce((acc, p) => ({ ...acc, [p.date]: p }), {}) });
    });
  },

  loadWeeklyPreps: async () => {
    const preps = await db.weeklyPreps.toArray();
    startTransition(() => {
      set({ weeklyPreps: preps.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) });
    });
  },

  loadDailyNotes: async () => {
    const notes = await db.dailyNotes.toArray();
    startTransition(() => {
      set({ dailyNotes: notes.reduce((acc, n) => ({ ...acc, [n.date]: n.content }), {}) });
    });
  },

  saveDailyPrep: async (date, prep) => {
    await db.dailyPreps.put({ ...prep, date });
    startTransition(() => {
      set(produce((state: AppState) => { state.dailyPreps[date] = prep; }));
    });
  },

  saveWeeklyPrep: async (id, prep) => {
    await db.weeklyPreps.put({ ...prep, id });
    startTransition(() => {
      set(produce((state: AppState) => { state.weeklyPreps[id] = prep; }));
    });
  },

  saveDailyNote: async (date, content) => {
    await db.dailyNotes.put({ date, content });
    startTransition(() => {
      set(produce((state: AppState) => { state.dailyNotes[date] = content; }));
    });
  }
});
