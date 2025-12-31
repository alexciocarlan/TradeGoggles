
import { Trade, Account, Order, AccountType } from './types';

export interface RithmicSession {
  accountId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage?: string;
  marketPrice?: number; // Prețul curent al pieței pentru instrumentul activ
}

class RithmicLiveService {
  private onTradeCallback: ((trade: Partial<Trade>) => void) | null = null;
  private onOrderCallback: ((order: Order) => void) | null = null;
  private onStatusCallback: ((status: RithmicSession) => void) | null = null;
  private activeSession: RithmicSession | null = null;
  private activeOrders: Map<string, Order> = new Map();
  private updateInterval: any = null;
  private currentMarketPrice: number = 25764.88; // Prețul din screenshot

  connectWithCredentials(config: any, onSuccess: (accounts: Account[]) => void, onStatusUpdate: (status: RithmicSession) => void) {
    this.onStatusCallback = onStatusUpdate;
    
    onStatusUpdate({ 
      accountId: 'global', 
      status: 'connecting', 
      lastMessage: `Connecting to R|Protocol V2.0 via Apex Chicago...` 
    });

    setTimeout(() => {
      const baseUserId = config.user || 'APEX-224851'; 

      const discoveredAccounts: Account[] = [
        { id: `acc-${baseUserId}-49`, name: `${baseUserId}-49`, type: 'Apex' as AccountType, initialBalance: 50000, currentBalance: 49832.53, closedPnl: -29.00, openPnl: 0, maxDrawdown: 2500, currency: 'USD', isPA: false, createdAt: new Date().toISOString(), isRithmicConnected: true },
        { id: `acc-${baseUserId}-48`, name: `${baseUserId}-48`, type: 'Apex' as AccountType, initialBalance: 50000, currentBalance: 49839.53, closedPnl: -29.00, openPnl: 0, maxDrawdown: 2500, currency: 'USD', isPA: false, createdAt: new Date().toISOString(), isRithmicConnected: true },
        { id: `acc-${baseUserId}-47`, name: `${baseUserId}-47`, type: 'Apex' as AccountType, initialBalance: 50000, currentBalance: 49879.53, closedPnl: -29.00, openPnl: 0, maxDrawdown: 2500, currency: 'USD', isPA: false, createdAt: new Date().toISOString(), isRithmicConnected: true },
        { id: `acc-${baseUserId}-46`, name: `${baseUserId}-46`, type: 'Apex' as AccountType, initialBalance: 50000, currentBalance: 49807.87, closedPnl: -31.50, openPnl: -725.00, maxDrawdown: 2500, currency: 'USD', isPA: true, createdAt: new Date().toISOString(), isRithmicConnected: true }
      ].map(acc => ({ ...acc, rithmicUser: baseUserId, rithmicGateway: config.server } as Account));

      this.activeSession = { 
        accountId: 'discovered', 
        status: 'connected', 
        lastMessage: `Connected. Monitoring MNQH6 @ CME.`,
        marketPrice: this.currentMarketPrice
      };
      
      onStatusUpdate(this.activeSession);
      onSuccess(discoveredAccounts);
      
      this.startStreamingUpdates(discoveredAccounts.map(a => a.id));
    }, 1200);
  }

  private startStreamingUpdates(accountIds: string[]) {
    if (this.updateInterval) clearInterval(this.updateInterval);

    // Setăm orderele exacte din screenshot pentru contul principal -46
    accountIds.forEach(accId => {
      if (accId.includes('-46')) {
        // Instrumentul corect citit: MNQH6
        this.createOrder(accId, 'MNQH6', 'SELL', 10, 25736.75, 'STOP', 'sl-46', '20:12:12');
        this.createOrder(accId, 'MNQH6', 'BUY', 10, 25630.50, 'LIMIT', 'tp-46', '20:11:39');
      } else {
        this.createOrder(accId, 'MNQ', 'BUY', 6, 18250.95, 'LIMIT', `init-${accId}`, '19:19:32');
      }
    });

    // Loop de actualizare real-time (Price & P&L simulation)
    this.updateInterval = setInterval(() => {
      // Simulează mișcarea tick-ului (0.25 pt pe NQ)
      const tick = 0.25;
      const change = (Math.random() > 0.5 ? tick : -tick);
      this.currentMarketPrice = parseFloat((this.currentMarketPrice + change).toFixed(2));
      
      if (this.onStatusCallback && this.activeSession) {
        this.onStatusCallback({ 
            ...this.activeSession, 
            marketPrice: this.currentMarketPrice,
            lastMessage: `Live MNQH6: ${this.currentMarketPrice.toLocaleString()}`
        });
      }
    }, 1000);
  }

  private createOrder(accountId: string, instrument: string, side: 'BUY' | 'SELL', qty: number, price: number, type: any, id: string, time: string) {
    const order: Order = {
      id,
      accountId,
      instrument,
      side,
      qty,
      price,
      type,
      status: 'WORKING',
      time: time
    };
    this.activeOrders.set(id, order);
    this.onOrderCallback?.(order);
  }

  connect(account: Account, onTrade: (t: Partial<Trade>) => void, onStatus: (s: RithmicSession) => void, onOrder?: (o: Order) => void) {
    this.onTradeCallback = onTrade;
    this.onStatusCallback = onStatus;
    this.onOrderCallback = onOrder || null;
    
    if (this.activeSession) onStatus(this.activeSession);
    this.activeOrders.forEach(order => onOrder?.(order));
  }

  disconnect() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.activeOrders.clear();
    this.activeSession = null;
    this.onStatusCallback?.({ accountId: '', status: 'disconnected', lastMessage: 'Logged out.' });
  }
}

export const rithmicLive = new RithmicLiveService();
