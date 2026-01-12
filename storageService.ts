
import { Dexie, type Table } from 'dexie';
import { Trade, Account, DailyPrepData, WeeklyPrepData, Playbook, BacktestSession, AppError } from './types';

// Helper pentru LocalStorage sigur care nu crapă în medii securizate
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  },
  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {}
  }
};

class TradeGogglesDB extends Dexie {
  settings!: Table<{ key: string; value: any }, string>;
  accounts!: Table<Account, string>;
  trades!: Table<Trade, string>;
  dailyPreps!: Table<DailyPrepData, string>;
  weeklyPreps!: Table<WeeklyPrepData, string>;
  dailyNotes!: Table<{ date: string; content: string }, string>;
  playbooks!: Table<Playbook, string>;
  backtestSessions!: Table<BacktestSession, string>;

  constructor() {
    super('TradeGogglesDB');
    try {
      (this as any).version(102).stores({
        settings: 'key',
        accounts: 'id',
        trades: 'id, date, accountId',
        dailyPreps: 'date',
        weeklyPreps: 'id',
        dailyNotes: 'date',
        playbooks: 'id',
        backtestSessions: 'id'
      });
    } catch (e) {
      console.warn("[Storage] Dexie setup blocked by security.");
    }
  }
}

export const db = new TradeGogglesDB();

export const storageService = {
  private_isStorageAvailable: true,

  async init() {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        throw new Error("IndexedDB not available");
      }
      if (!(db as any).isOpen()) {
        await (db as any).open();
      }
      this.private_isStorageAvailable = true;
    } catch (e: any) {
      this.private_isStorageAvailable = false;
      console.error("[Storage] Database access blocked.", e.message || e);
    }
  },

  async saveTrade(trade: Trade) {
    if (!this.private_isStorageAvailable) throw new Error('Storage unavailable');
    try {
      await db.trades.put(trade);
    } catch (e) {
      console.error('Save failed', e);
      throw new AppError('STORAGE_WRITE_FAIL', 'Failed to save trade');
    }
  },

  async deleteTrade(id: string) {
    if (!this.private_isStorageAvailable) return;
    try { await db.trades.delete(id); } catch (e) {}
  },

  async getAllTrades(): Promise<Trade[]> {
    if (!this.private_isStorageAvailable) return [];
    try { return await db.trades.toArray(); } catch (e) { return []; }
  },

  async saveAccount(account: Account) {
    if (!this.private_isStorageAvailable) return;
    try { await db.accounts.put(account); } catch (e) {}
  },

  async deleteAccountComplete(id: string) {
    if (!this.private_isStorageAvailable) return;
    try {
      await (db as any).transaction('rw', [db.accounts, db.trades], async () => {
        await db.accounts.delete(id);
        await db.trades.where('accountId').equals(id).delete();
      });
    } catch (e) {}
  },

  async resetAccountHistory(id: string) {
    if (!this.private_isStorageAvailable) return;
    try {
      await (db as any).transaction('rw', [db.accounts, db.trades], async () => {
        const acc = await db.accounts.get(id);
        if (acc) {
          acc.currentBalance = acc.initialBalance;
          acc.closedPnl = 0;
          acc.openPnl = 0;
          await db.accounts.put(acc);
          await db.trades.where('accountId').equals(id).delete();
        }
      });
    } catch (e) {}
  },

  async savePlaybook(pb: Playbook) {
    if (!this.private_isStorageAvailable) return;
    try { await db.playbooks.put(pb); } catch (e) {}
  },

  async deletePlaybook(id: string) {
    if (!this.private_isStorageAvailable) return;
    try { await db.playbooks.delete(id); } catch (e) {}
  },

  async getAllPlaybooks(): Promise<Playbook[]> {
    if (!this.private_isStorageAvailable) return [];
    try { return await db.playbooks.toArray(); } catch (e) { return []; }
  },

  async resetPlaybooks(defaults: Playbook[]) {
    if (!this.private_isStorageAvailable) return;
    try {
      await (db as any).transaction('rw', [db.playbooks], async () => {
        await db.playbooks.clear();
        await db.playbooks.bulkPut(defaults);
      });
    } catch (e) {}
  },

  async saveBacktestSession(session: BacktestSession) {
    if (!this.private_isStorageAvailable) return;
    try { await db.backtestSessions.put(session); } catch (e) {}
  },

  async deleteBacktestSession(id: string) {
    if (!this.private_isStorageAvailable) return;
    try {
      await (db as any).transaction('rw', [db.backtestSessions, db.trades], async () => {
        await db.backtestSessions.delete(id);
        await db.trades.where('sessionId').equals(id).delete();
      });
    } catch (e) {}
  },

  async loadFullAppState() {
    if (!this.private_isStorageAvailable) {
      return { accounts: [], trades: [], playbooks: [], dailyPreps: {}, weeklyPreps: {}, dailyNotes: {}, backtestSessions: [] };
    }
    try {
      const [accounts, trades, playbooks, dPreps, wPreps, dNotes, btSessions] = await Promise.all([
        db.accounts.toArray().catch(() => []),
        db.trades.orderBy('date').reverse().toArray().catch(() => []),
        db.playbooks.toArray().catch(() => []),
        db.dailyPreps.toArray().catch(() => []),
        db.weeklyPreps.toArray().catch(() => []),
        db.dailyNotes.toArray().catch(() => []),
        db.backtestSessions.toArray().catch(() => [])
      ]);

      return {
        accounts,
        trades,
        playbooks,
        dailyPreps: dPreps.reduce((acc, p) => ({ ...acc, [p.date]: p }), {}),
        weeklyPreps: wPreps.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
        dailyNotes: dNotes.reduce((acc, n) => ({ ...acc, [n.date]: n.content }), {}),
        backtestSessions: btSessions
      };
    } catch (e) {
      return { accounts: [], trades: [], playbooks: [], dailyPreps: {}, weeklyPreps: {}, dailyNotes: {}, backtestSessions: [] };
    }
  },

  async saveSetting(key: string, value: any) {
    try {
      if (this.private_isStorageAvailable) {
        await db.settings.put({ key, value }).catch(() => {});
      }
      safeStorage.setItem(`tg_pref_${key}`, JSON.stringify(value));
    } catch (e) {}
  },

  async loadSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (this.private_isStorageAvailable) {
        const entry = await db.settings.get(key).catch(() => null);
        if (entry) return entry.value as T;
      }
      const local = safeStorage.getItem(`tg_pref_${key}`);
      if (local) return JSON.parse(local) as T;
    } catch (e) {}
    return defaultValue;
  },

  async load<T>(key: string, defaultValue: T): Promise<T> {
    return this.loadSetting(key, defaultValue);
  },

  async save(key: string, value: any): Promise<void> {
    return this.saveSetting(key, value);
  },

  async getAllFromStore<T>(tableName: string): Promise<T[]> {
    if (!this.private_isStorageAvailable) return [];
    try { return await (db as any)[tableName].toArray(); } catch (e) { return []; }
  },

  async getPaginatedStore<T>(tableName: string, offset: number, limit: number): Promise<{ items: T[], totalCount: number }> {
    if (!this.private_isStorageAvailable) return { items: [], totalCount: 0 };
    try {
      const table = (db as any)[tableName];
      const [items, totalCount] = await Promise.all([
        table.offset(offset).limit(limit).toArray(),
        table.count()
      ]);
      return { items, totalCount };
    } catch (e) {
      return { items: [], totalCount: 0 };
    }
  },

  async saveToStore(tableName: string, data: any): Promise<void> {
    if (!this.private_isStorageAvailable) return;
    try { await (db as any)[tableName].put(data); } catch (e) {}
  },

  async deleteFromStore(tableName: string, id: string): Promise<void> {
    if (!this.private_isStorageAvailable) return;
    try { await (db as any)[tableName].delete(id); } catch (e) {}
  }
};
