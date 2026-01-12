import { StateCreator } from 'zustand';
import { startTransition } from 'react';
import { Language, Notification, NotificationType, RithmicSession } from '../types';
import { storageService, db } from '../storageService';
import { AppState } from '../AppContext';
import { Dexie } from 'dexie';
import { getErrorMessage } from '../utils/errorUtils';

export interface UISlice {
  language: Language;
  selectedAccountId: string;
  isDarkMode: boolean;
  riskManagerEnabled: boolean;
  isOfflineMode: boolean;
  isLoading: boolean;
  notifications: Notification[];
  rithmicStatus: RithmicSession | null;
  marketData: any | null;
  isNewTradeModalOpen: boolean;
  setLanguage: (lang: Language) => void;
  setSelectedAccountId: (id: string) => void;
  setIsDarkMode: (dark: boolean) => void;
  setRithmicStatus: (status: RithmicSession | null) => void;
  setIsNewTradeModalOpen: (open: boolean) => void;
  addNotification: (type: NotificationType | any, message?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  init: () => Promise<void>;
  resetAllData: () => Promise<void>;
  migrateLegacyData: () => Promise<void>;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
  language: 'ro', 
  selectedAccountId: 'all', 
  isDarkMode: true, 
  riskManagerEnabled: true, 
  isOfflineMode: true, 
  isLoading: true, 
  notifications: [],
  rithmicStatus: null,
  marketData: null,
  isNewTradeModalOpen: false,

  setLanguage: (lang) => {
    storageService.saveSetting('language', lang);
    startTransition(() => {
      set({ language: lang });
    });
  },
  setSelectedAccountId: (id) => {
    storageService.saveSetting('selectedAccountId', id);
    startTransition(() => {
      set({ selectedAccountId: id });
    });
  },
  setIsDarkMode: (dark) => {
    storageService.saveSetting('isDarkMode', dark);
    startTransition(() => {
      set({ isDarkMode: dark });
    });
  },
  setRithmicStatus: (status) => {
    startTransition(() => {
      set({ rithmicStatus: status });
    });
  },
  setIsNewTradeModalOpen: (open) => {
    startTransition(() => {
      set({ isNewTradeModalOpen: open });
    });
  },
  
  addNotification: (type, message, duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    
    let finalType: NotificationType = 'info';
    let finalMessage: string = '';

    if (typeof type === 'string') {
      finalType = type as NotificationType;
      finalMessage = getErrorMessage(message);
    } else if (type && typeof type === 'object') {
      finalType = (type.type as NotificationType) || 'info';
      finalMessage = getErrorMessage(type.message || type.error || type);
    }

    startTransition(() => {
      set(state => ({ 
        notifications: [...state.notifications, { 
          id, 
          type: finalType, 
          message: finalMessage, 
          timestamp: Date.now(), 
          duration 
        }] 
      }));
    });
    
    setTimeout(() => get().removeNotification(id), duration);
  },

  removeNotification: (id) => {
    startTransition(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    });
  },
  
  resetAllData: async () => {
    if (!window.confirm("❗ Ștergi absolut tot din baza de date locală?")) return;
    try {
      (db as any).close();
      await Dexie.delete('TradeGogglesDB');
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  },

  migrateLegacyData: async () => {
    get().addNotification('info', 'Migrare legacy dezafectată (Workeri inactivi).', 3000);
  },

  init: async () => {
    try {
      await storageService.init();
      
      const data = await storageService.loadFullAppState();
      const lang = await storageService.loadSetting<Language>('language', 'ro');
      const selAccId = await storageService.loadSetting<string>('selectedAccountId', 'all');
      const dark = await storageService.loadSetting<boolean>('isDarkMode', true);

      // CRITICAL FIX FOR ERROR #525
      // Transitions track asynchronous updates only if the 'set' calls are wrapped.
      // Revealing Lazy routes (by setting isLoading: false) must be marked as a transition.
      startTransition(() => {
        const tradesMap: Record<string, any> = {};
        if (data.trades) {
          data.trades.forEach(t => tradesMap[t.id] = t);
        }

        set({
          ...data,
          tradesMap,
          language: lang,
          selectedAccountId: selAccId,
          isDarkMode: dark,
          isLoading: false
        });
      });
    } catch (err) {
      console.error("[INIT ERROR]", err);
      startTransition(() => {
        set({ isLoading: false });
      });
    }
  },
});
