/**
 * Rithmic Performance Worker
 * Gestionează procesarea fluxurilor de date și calculele de P&L în afara thread-ului principal.
 */

let currentMarketPrice = 25764.88;
let simulationInterval: any = null;
let snapshotInterval: any = null;
const SNAPSHOT_MS = 250;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      startProcessing();
      break;
    case 'STOP':
      stopProcessing();
      break;
    case 'SET_PRICE':
      if (payload?.price) currentMarketPrice = payload.price;
      break;
  }
};

function startProcessing() {
  if (simulationInterval) clearInterval(simulationInterval);
  if (snapshotInterval) clearInterval(snapshotInterval);

  simulationInterval = setInterval(() => {
    const tick = 0.25;
    const change = (Math.random() > 0.5 ? tick : -tick);
    currentMarketPrice = parseFloat((currentMarketPrice + change).toFixed(2));
  }, 10);

  snapshotInterval = setInterval(() => {
    self.postMessage({
      type: 'TICK_UPDATE',
      data: {
        marketPrice: currentMarketPrice,
        timestamp: Date.now(),
        lastMessage: `Live MNQH6: ${currentMarketPrice.toLocaleString()}`
      }
    });
  }, SNAPSHOT_MS);
}

function stopProcessing() {
  clearInterval(simulationInterval);
  clearInterval(snapshotInterval);
  simulationInterval = null;
  snapshotInterval = null;
}

// Satisfy module crawlers expecting a default export
export default {};