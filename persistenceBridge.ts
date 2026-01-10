
import { storageService } from './storageService';
import {
  Trade
} from './types';

// Cloud functionality is disabled as per user request.
// All operations will be local-only via storageService (Dexie/IndexedDB).
export const persistenceBridge = {
  isCloudEnabled: false,

  async getServerTime(): Promise<string> {
    // Return local time as cloud is disabled.
    return new Date().toISOString();
  },

  async getAllTrades(signal?: AbortSignal): Promise<Trade[]> {
    return await storageService.getAllFromStore<Trade>('trades');
  },

  async getTradesPaginated(page: number, limit: number, signal?: AbortSignal): Promise<{ trades: Trade[], totalCount: number }> {
    // Directly fetch from local storage service.
    const offset = (page - 1) * limit;
    const result = await storageService.getPaginatedStore<Trade>('trades', offset, limit);
    return { trades: result.items, totalCount: result.totalCount };
  },

  async saveTrade(trade: Trade, signal?: AbortSignal): Promise<void> {
    const localTime = new Date().toISOString();
    const tradeToSave = { ...trade, updated_at: localTime };
    await storageService.saveToStore('trades', tradeToSave);
  },

  async deleteTrade(id: string, signal?: AbortSignal): Promise<void> {
    await storageService.deleteFromStore('trades', id);
  }
};
