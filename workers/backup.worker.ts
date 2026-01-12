
self.onmessage = (event) => {
  try {
    const { trades, accounts, dailyPreps, weeklyPreps, playbooks, dailyNotes } = event.data;
    const fullState = { trades, accounts, dailyPreps, weeklyPreps, playbooks, dailyNotes };
    
    // Operațiunea grea: Serializarea JSON
    const jsonString = JSON.stringify(fullState, null, 2);
    
    // Trimitem string-ul înapoi către thread-ul principal
    self.postMessage({ success: true, data: jsonString });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: 'WORKER_ERROR', error: { message: errorMsg, filename: 'backup.worker.ts', lineno: 0, colno: 0, originalError: error } });
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
  console.error("[Backup Worker] Unhandled Error:", errorDetails);
  self.postMessage({ type: 'WORKER_ERROR', error: errorDetails });
});

export default {};
