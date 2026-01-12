
import { Account, RithmicSession } from './types';
import { useAppStore } from './AppContext'; 

// Rithmic live service is disabled as per user request.

class RithmicLiveService {
  private subscribers: ((status: RithmicSession) => void)[] = []; 
  private activeSession: RithmicSession | null = null;
  
  subscribe(listener: (status: RithmicSession) => void) {
    this.subscribers.push(listener);
    if (this.activeSession) listener(this.activeSession);
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener);
    };
  }

  private notifySubscribers(status: RithmicSession) {
    this.subscribers.forEach(listener => listener(status));
  }

  connectWithCredentials(
    config: any, 
    onSuccess: (accounts: Account[]) => void, 
    onStatusUpdate: (status: RithmicSession) => void
  ) {
    const errorMessage = 'Rithmic live connection is disabled in this version.';
    onStatusUpdate({ accountId: 'global', status: 'error', lastMessage: errorMessage });
    useAppStore.getState().addNotification({ 
        type: 'warning', 
        message: errorMessage,
        duration: 4000
    });
  }

  disconnect(fullCleanup = false, fromError = false) {
    this.activeSession = null;
    this.notifySubscribers({ accountId: 'global', status: 'disconnected' });
  }
}

export const rithmicLive = new RithmicLiveService();
