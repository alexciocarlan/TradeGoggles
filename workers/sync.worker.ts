
self.onmessage = (event) => {
  try {
    const { type, payload } = event.data;
    if (type === 'START_SYNC') {
      console.log("[Sync Worker] Sync started with payload:", payload);
      
      self.postMessage({ type: 'SYNC_PROGRESS', progress: 50 });
      setTimeout(() => {
        self.postMessage({ type: 'SYNC_COMPLETE', result: 'Data synced successfully.' });
      }, 1000);
    } else {
      throw new Error(`Unknown message type received: ${type}`);
    }
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      filename: 'sync.worker.ts',
      lineno: 0,
      colno: 0,
      originalError: error
    };
    console.error("[Sync Worker] Internal Error:", errorDetails);
    self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
  }
};

self.addEventListener('error', (event) => {
  const errorDetails = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    originalError: event.error
  };
  console.error("[Sync Worker] Unhandled Error:", errorDetails);
  self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
});

export default {};
