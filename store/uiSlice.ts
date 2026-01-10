
import { StateCreator } from 'zustand';
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
  setLanguage: (lang: Language) => void;
  setSelectedAccountId: (id: string) => void;
  setIsDarkMode: (dark: boolean) => void;
  setRithmicStatus: (status: RithmicSession | null) => void;
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

  setLanguage: (lang) => {
    storageService.saveSetting('language', lang);
    set({ language: lang });
  },
  setSelectedAccountId: (id) => {
    storageService.saveSetting('selectedAccountId', id);
    set({ selectedAccountId: id });
  },
  setIsDarkMode: (dark) => {
    storageService.saveSetting('isDarkMode', dark);
    set({ isDarkMode: dark });
  },
  setRithmicStatus: (status) => set({ rithmicStatus: status }),
  
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

    set(state => ({ 
      notifications: [...state.notifications, { 
        id, 
        type: finalType, 
        message: finalMessage, 
        timestamp: Date.now(), 
        duration 
      }] 
    }));
    
    setTimeout(() => get().removeNotification(id), duration);
  },

  removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),
  
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
    await storageService.init();
    
    const data = await storageService.loadFullAppState();
    const lang = await storageService.loadSetting<Language>('language', 'ro');
    const selAccId = await storageService.loadSetting<string>('selectedAccountId', 'all');
    const dark = await storageService.loadSetting<boolean>('isDarkMode', true);

    set({
      ...data,
      language: lang,
      selectedAccountId: selAccId,
      isDarkMode: dark,
      isLoading: false
    });
    
    const map: Record<string, any> = {};
    if (data.trades) {
      data.trades.forEach(t => map[t.id] = t);
    }
    set({ tradesMap: map });
  },
});
