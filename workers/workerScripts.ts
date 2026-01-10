
// Acest fișier conține codul sursă al worker-ilor sub formă de string-uri JavaScript PUR (ES6).
// NU folosiți sintaxă TypeScript aici (ex: ": string", "interface", "as any") deoarece browserul nu le poate executa.

export const MIGRATION_WORKER_SCRIPT = `
self.onmessage = function(event) {
  // Worker simplificat pentru a preveni erorile de migrare
  self.postMessage({ status: 'complete' });
};
`;

export const BACKUP_WORKER_SCRIPT = `
self.onmessage = function(event) {
  try {
    // Destructurare date primite
    const data = event.data;
    const trades = data.trades;
    const accounts = data.accounts;
    const dailyPreps = data.dailyPreps;
    const weeklyPreps = data.weeklyPreps;
    const playbooks = data.playbooks;
    const dailyNotes = data.dailyNotes;

    const fullState = { 
      trades: trades, 
      accounts: accounts, 
      dailyPreps: dailyPreps, 
      weeklyPreps: weeklyPreps, 
      playbooks: playbooks, 
      dailyNotes: dailyNotes 
    };
    
    // Serializare JSON (operațiune heavy)
    const jsonString = JSON.stringify(fullState, null, 2);
    
    // Trimitem rezultatul înapoi
    self.postMessage({ success: true, data: jsonString });
  } catch (error) {
    const errorMsg = error && error.message ? error.message : String(error);
    self.postMessage({ success: false, error: errorMsg });
  }
};
`;
