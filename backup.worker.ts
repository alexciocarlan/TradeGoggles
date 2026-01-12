
self.onmessage = (event: MessageEvent) => {
  try {
    const { trades, accounts, dailyPreps, weeklyPreps, playbooks, dailyNotes } = event.data;
    const fullState = { trades, accounts, dailyPreps, weeklyPreps, playbooks, dailyNotes };
    
    // Operațiunea grea: Serializarea JSON
    const jsonString = JSON.stringify(fullState, null, 2);
    
    // Trimitem string-ul înapoi către thread-ul principal
    self.postMessage({ success: true, data: jsonString });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
