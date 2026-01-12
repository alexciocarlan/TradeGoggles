
const DB_NAME = 'TradeGogglesDB';
const DB_VERSION = 101; // Updated to match storageService.ts
const STORE_NAME = 'app_data';

const getSimpleErrorMessage = (error: any) => {
  if (error && error.message) return error.message;
  return String(error);
}

self.onmessage = async (event) => {
  try {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      const target = e.target as IDBOpenDBRequest;
      const errorDetails = { message: 'Could not open DB in worker', filename: 'migration.worker.ts', lineno: 0, colno: 0, originalError: target.error };
      self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
    };

    request.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;
      
      // Verification of legacy stores
      if (!db.objectStoreNames.contains(STORE_NAME)) {
          self.postMessage({ status: 'complete' });
          db.close();
          return;
      }

      const txRead = db.transaction([STORE_NAME], 'readonly');
      const appStoreRead = txRead.objectStore(STORE_NAME);
      const reqArray = appStoreRead.get('tv_trades');

      reqArray.onsuccess = (ev) => {
        const req = ev.target as IDBRequest;
        const trades = req.result;

        if (!trades || !Array.isArray(trades) || trades.length === 0) {
          runIndividualMigration(db);
          return;
        }

        let index = 0;
        const CHUNK_SIZE = 100;

        const processNextChunk = () => {
          if (index >= trades.length) {
            runIndividualMigration(db);
            return;
          }

          const writeTx = db.transaction(['trades'], 'readwrite');
          const tradesStore = writeTx.objectStore('trades');
          const end = Math.min(index + CHUNK_SIZE, trades.length);
          
          for (let i = index; i < end; i++) {
            const t = trades[i];
            if (t && t.id) tradesStore.put(t);
          }

          writeTx.oncomplete = () => {
            index += CHUNK_SIZE;
            processNextChunk();
          };
          writeTx.onerror = (e) => {
            const tx = e.target as IDBTransaction;
            const errorDetails = { message: 'Write transaction failed', filename: 'migration.worker.ts', lineno: 0, colno: 0, originalError: tx.error };
            self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
            db.close();
          };
        };

        processNextChunk();
      };
    };

    request.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('trades')) {
        db.createObjectStore('trades', { keyPath: 'id' });
      }
    };

  } catch (e) {
    const errorDetails = { message: 'Migration process failed', filename: 'migration.worker.ts', lineno: 0, colno: 0, originalError: e };
    self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
  }
};

function runIndividualMigration(db: IDBDatabase) {
  try {
    const tx = db.transaction([STORE_NAME, 'trades'], 'readwrite');
    const appStore = tx.objectStore(STORE_NAME);
    const tradesStore = tx.objectStore('trades');
    const cursorReq = appStore.openCursor();
    
    cursorReq.onsuccess = (event) => {
      const req = event.target as IDBRequest;
      const cursor = req.result;
      if (cursor) {
        const key = String(cursor.key);
        if (key.startsWith('trade_') || key.startsWith('tr_')) { 
          tradesStore.put(cursor.value);
          cursor.delete(); 
        }
        cursor.continue();
      }
    };
    
    tx.oncomplete = () => {
      self.postMessage({ status: 'complete' });
      db.close();
    };
  } catch (e) {
    const errorDetails = { message: 'Individual migration failed', filename: 'migration.worker.ts', lineno: 0, colno: 0, originalError: e };
    self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
  }
}

self.addEventListener('error', (event) => {
  const errorDetails = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    originalError: event.error
  };
  self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
});

export default {};
