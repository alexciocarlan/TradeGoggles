import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { startTransition } from 'react';
import { Playbook } from '../types';
import { storageService } from '../storageService';
import { AppState } from '../AppContext';

const DEFAULT_PLAYBOOKS: Playbook[] = [
  // TIER 1 & 2: OPENING THEMES
  { id: 'pb-1', name: '1. The Open Drive', icon: '🚀', color: '#3b82f6', description: 'Inițiativă instituțională pură. Prețul pleacă agresiv fără testare.', entryCriteria: [{id:'1', text:'Deschidere în afara pdRange'}, {id:'2', text:'Volum peste medie la Open'}, {id:'3', text:'Delta unidirecțional'}], exitCriteria: [], marketConditions: [], entryAt: 'Market Open', target: 'Extreme Range', invalidation: 'Back in Range', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t1', text:'#STRONGDRIVE', color:'#3b82f6'}] },
  { id: 'pb-2', name: '2. The Open Test Drive', icon: '🎯', color: '#8b5cf6', description: 'Testarea unui nivel cheie urmată de respingere violentă.', entryCriteria: [{id:'1', text:'Testare nivel structural (VAH/VAL)'}, {id:'2', text:'Respingere rapidă (Tails)'}], exitCriteria: [], marketConditions: [], entryAt: 'After Test', target: 'Opposite Extreme', invalidation: 'Below Test Level', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t2', text:'#TESTFIRST', color:'#8b5cf6'}] },
  { id: 'pb-3', name: '3. Open Rejection Reverse', icon: '⚡', color: '#f43f5e', description: 'Eșecul de a menține gap-ul. Reîntoarcere forțată în range.', entryCriteria: [{id:'1', text:'Gap deschis'}, {id:'2', text:'Rejecție la Open'}, {id:'3', text:'Vânzători agresivi sub Open'}], exitCriteria: [], marketConditions: [], entryAt: 'Back in Range', target: 'pdPOC', invalidation: 'pdH/L', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t3', text:'#REJECTION', color:'#f43f5e'}] },
  { id: 'pb-4', name: '4. The 80% Rule', icon: '📊', color: '#10b981', description: 'Dacă prețul acceptă 2 perioade de 30 min în VA, traversează 80%.', entryCriteria: [{id:'1', text:'Deschidere în afara VA'}, {id:'2', text:'Două perioade de acceptare în VA'}], exitCriteria: [], marketConditions: [], entryAt: 'Acceptance confirmed', target: 'Opposite VA Edge', invalidation: 'Outside VA', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t4', text:'#VALUEMAP', color:'#10b981'}] },
  { id: 'pb-5', name: '5. Failed Auction Reversal', icon: '🏹', color: '#f59e0b', description: 'Spargerea unui nivel extrem urmată de trap și reversare.', entryCriteria: [{id:'1', text:'Spargere pdH/L'}, {id:'2', text:'Lipsă follow-through'}, {id:'3', text:'Recuperare rapidă nivel'}], exitCriteria: [], marketConditions: [], entryAt: 'Back above/below level', target: 'POC / Opp. Edge', invalidation: 'New Extreme', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t5', text:'#FAILEDBREAK', color:'#f59e0b'}] },
  
  // TIER 3: INTRADAY REGIMES
  { id: 'pb-6', name: '6. Trend Day Continuation', icon: '📈', color: '#10b981', description: 'Piața se mișcă într-o singură direcție cu debalansare constantă.', entryCriteria: [{id:'1', text:'One-time framing activ'}, {id:'2', text:'VAL/VAH crescător/descrescător'}], exitCriteria: [], marketConditions: [], entryAt: 'Pullback la VWAP/Mid', target: 'End of Day Extreme', invalidation: 'Frame break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t6', text:'#IMBALANCE', color:'#10b981'}] },
  { id: 'pb-7', name: '7. Normal Variation Day', icon: '🧩', color: '#6366f1', description: 'IB-ul este depășit într-o parte și se extinde range-ul.', entryCriteria: [{id:'1', text:'Extensie IB confirmată'}, {id:'2', text:'Volum susținut pe extensie'}], exitCriteria: [], marketConditions: [], entryAt: 'IB Breakout', target: '2x IB Range', invalidation: 'Back in IB', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t7', text:'#STRUCTURE', color:'#6366f1'}] },
  { id: 'pb-8', name: '8. Double Distribution Day', icon: '⚖️', color: '#8b5cf6', description: 'Două zone de valoare separate prin single prints.', entryCriteria: [{id:'1', text:'Spargere zonă de balans'}, {id:'2', text:'Single prints formate'}], exitCriteria: [], marketConditions: [], entryAt: 'Break of first balance', target: 'Second Distribution', invalidation: 'Fill of single prints', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t8', text:'#DOUBLEDIST', color:'#8b5cf6'}] },
  { id: 'pb-9', name: '9. Neutral Day Ext. Fade', icon: '🌊', color: '#f43f5e', description: 'Extensie în ambele părți ale IB-ului, indicând echilibru.', entryCriteria: [{id:'1', text:'Extensie IB High'}, {id:'2', text:'Extensie IB Low'}], exitCriteria: [], marketConditions: [], entryAt: 'Second extension fade', target: 'Day Midpoint', invalidation: 'Trend development', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t9', text:'#REVERSION', color:'#f43f5e'}] },
  { id: 'pb-10', name: '10. Neutral Center Day', icon: '💎', color: '#06b6d4', description: 'Piață bracketing în jurul POC-ului central.', entryCriteria: [{id:'1', text:'POC central stabil'}, {id:'2', text:'Volatility contraction'}], exitCriteria: [], marketConditions: [], entryAt: 'Extreme range fade', target: 'POC', invalidation: 'Range break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t10', text:'#INBALANCE', color:'#06b6d4'}] },
  
  // TIER 4: SPECIAL SITUATIONS
  { id: 'pb-11', name: '11. Non-Trend / Bracket Fade', icon: '🏹', color: '#94a3b8', description: 'Range mic, volum mic. Trading între limite.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Range Edge', target: 'Opposite Edge', invalidation: 'Breakout', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t11', text:'#TIGHTBALANCE', color:'#94a3b8'}] },
  { id: 'pb-12', name: '12. The GAP & Go', icon: '🔥', color: '#f97316', description: 'Gap mare cu agresiune imediată în direcția gap-ului.', entryCriteria: [{id:'1', text:'Gap > 0.5%'}, {id:'2', text:'Drive la Open'}], exitCriteria: [], marketConditions: [], entryAt: 'Open + 2 min', target: 'Trend Extension', invalidation: 'Gap Midpoint', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t12', text:'#GAP', color:'#f97316'}] },
  { id: 'pb-13', name: '13. The GAP Fill Reversion', icon: '🌊', color: '#0ea5e9', description: 'Gap nesustenabil care se închide spre Settlement.', entryCriteria: [{id:'1', text:'Gap Exhaustion'}, {id:'2', text:'Open Rejection'}], exitCriteria: [], marketConditions: [], entryAt: 'Open High/Low Reversal', target: 'Settlement', invalidation: 'New Extreme', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t13', text:'#REVERSION', color:'#0ea5e9'}] },
  { id: 'pb-14', name: '14. ON Inventory Correction', icon: '⏳', color: '#ec4899', description: 'Inventar 100% Long/Short corectat la Open.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Open', target: 'Settlement', invalidation: 'Continuity', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t14', text:'#EXTREMESKEW', color:'#ec4899'}] },
  { id: 'pb-15', name: '15. "D" Period Expansion', icon: '🚀', color: '#3b82f6', description: 'Explozie după un IB balansat în a patra perioadă (D).', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'D Period Breakout', target: 'Daily ATR', invalidation: 'Back in IB', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t15', text:'#IB_STRUGGLE', color:'#3b82f6'}] },
  { id: 'pb-16', name: '16. Single Print Fill Fade', icon: '🛡️', color: '#ef4444', description: 'Testarea unui nivel de single prints urmată de respingere.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Single Print Edge', target: 'Balance POC', invalidation: 'Fill Complete', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t16', text:'#SINGLEPRINTS', color:'#ef4444'}] },
  { id: 'pb-17', name: '17. Lunch Pivot Fade', icon: ' Sandwich ', color: '#eab308', description: 'Reversare la ora prânzului (NY 12:00) spre POC.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Overextended Edge', target: 'VWAP', invalidation: 'New High/Low', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t17', text:'#AFTERNOON', color:'#eab308'}] },
  { id: 'pb-18', name: '18. Afternoon Trend Sync', icon: '🐎', color: '#22c55e', description: 'Reluarea trendului matinal în sesiunea de după-amiază.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'PM Pullback', target: 'Day Extreme', invalidation: 'Midpoint Break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t18', text:'#LATEDAY', color:'#22c55e'}] },
  { id: 'pb-19', name: '19. Late Day Ramp/Liq', icon: '💰', color: '#10b981', description: 'Mișcare forțată de MOC (Market on Close) la finalul zilei.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: '15:30 NY', target: 'Day High/Low', invalidation: 'Reversal', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t19', text:'#TIMEFACTOR', color:'#10b981'}] },
  { id: 'pb-20', name: '20. Range Ext. Failure (Trap)', icon: '🏹', color: '#f43f5e', description: 'Extensie IB care nu reușește să accepte noile prețuri.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Trap Confirmation', target: 'Opposite IB Edge', invalidation: 'Acceptance', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t20', text:'#FAKEOUT', color:'#f43f5e'}] },
  
  // TIER 5: ADVANCED CALIBRATION (21-39)
  { id: 'pb-21', name: '21. 45-Degree Line Break', icon: '📈', color: '#3b82f6', description: 'Ruptura unei pante agresive de trend.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Line Break', target: 'Previous Base', invalidation: 'Trend Resume', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t21', text:'#MOMENTUM', color:'#3b82f6'}] },
  { id: 'pb-22', name: '22. SPIKE Rule (Late Day)', icon: '⚡', color: '#f59e0b', description: 'Analiza zonei de Spike formată în ultima perioadă a zilei.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Next Day Open', target: 'Spike Base/Apex', invalidation: 'Spike Clearance', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t22', text:'#LATEDAY', color:'#f59e0b'}] },
  { id: 'pb-23', name: '23. HVN Attraction', icon: '🧲', color: '#6366f1', description: 'Prețul este atras spre un High Volume Node anterior.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Entry towards HVN', target: 'HVN Center', invalidation: 'Rejection', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t23', text:'#HVN', color:'#6366f1'}] },
  { id: 'pb-24', name: '24. LVN Rejection', icon: '🛡️', color: '#ef4444', description: 'Respingere rapidă dintr-un Low Volume Node (Anomaly).', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'LVN Touch', target: 'Nearest HVN', invalidation: 'LVN Acceptance', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t24', text:'#POORSTRUCTURE', color:'#ef4444'}] },
  { id: 'pb-25', name: '25. Failed Range Ext. (b/P Shape)', icon: '🏹', color: '#f43f5e', description: 'Formarea unui profil de tip p sau b urmat de eșec.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Profile Break', target: 'Balance POC', invalidation: 'High/Low New', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t25', text:'#STRUCTURE', color:'#f43f5e'}] },
  { id: 'pb-26', name: '26. Inside Value Fade', icon: '⚖️', color: '#94a3b8', description: 'Trading contra extremelor în zile echilibrate.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'VAH/VAL Rejection', target: 'POC', invalidation: 'Acceptance outside', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t26', text:'#INBALANCE', color:'#94a3b8'}] },
  { id: 'pb-27', name: '27. IB Extension Failure', icon: '🏹', color: '#ec4899', description: 'Tentativă de ieșire din IB urmată de trap.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Failure confirmation', target: 'Midpoint', invalidation: 'New High', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t27', text:'#FAKEOUT', color:'#ec4899'}] },
  { id: 'pb-28', name: '28. Triple Distribution Day', icon: '🧩', color: '#8b5cf6', description: 'Zile cu trend extrem și multiple zone de echilibru.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Continuation break', target: 'Day Extreme', invalidation: 'VA Break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t28', text:'#IMBALANCE', color:'#8b5cf6'}] },
  { id: 'pb-29', name: '29. P-Shape Short Squeeze', icon: '🚀', color: '#3b82f6', description: 'Lichidarea vânzătorilor forțând prețul în sus rapid.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'P-Neck Break', target: 'High Extension', invalidation: 'P-Base break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t29', text:'#PSYCHOLOGY', color:'#3b82f6'}] },
  { id: 'pb-30', name: '30. b-Shape Long Liquidation', icon: '📉', color: '#ef4444', description: 'Cumpărători prinși forțați să lichideze pozițiile.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'b-Neck Break', target: 'Low Extension', invalidation: 'b-Base break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t30', text:'#PSYCHOLOGY', color:'#ef4444'}] },
  { id: 'pb-31', name: '31. Balanced Range Breakout', icon: '⚡', color: '#f97316', description: 'Ieșirea dintr-o zonă de echilibru multi-zile.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Range Break', target: '100% Extension', invalidation: 'Back in Range', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t31', text:'#IMBALANCE', color:'#f97316'}] },
  { id: 'pb-32', name: '32. Half-Gap Fill Reaction', icon: '🌊', color: '#0ea5e9', description: 'Respingere la nivelul de 50% al gap-ului anterior.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Gap 50% Touch', target: 'Gap Close/Open', invalidation: 'Level Acceptance', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t32', text:'#GAP', color:'#0ea5e9'}] },
  { id: 'pb-33', name: '33. Excess at Extremes (Tails)', icon: '🛡️', color: '#22c55e', description: 'Prezența cozilor lungi indicând respingere instituțională.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Tail formation', target: 'VA POC', invalidation: 'Tail fill', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t33', text:'#REJECTION', color:'#22c55e'}] },
  { id: 'pb-34', name: '34. Neutral Day Fade', icon: '⚖️', color: '#94a3b8', description: 'Piața oscilează în jurul centrului fără direcție clară.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Extreme edges', target: 'POC', invalidation: 'Trend break', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t34', text:'#REVERSION', color:'#94a3b8'}] },
  { id: 'pb-35', name: '35. One-Time Framing Break', icon: '🏹', color: '#f43f5e', description: 'Ruperea secvenței de Higer Lows / Lower Highs.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Frame Break', target: 'Balance POC', invalidation: 'Trend Resume', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t35', text:'#STRUCTURE', color:'#f43f5e'}] },
  { id: 'pb-36', name: '36. Sessional POC Shift', icon: '🧲', color: '#6366f1', description: 'Migrarea valorii în timpul sesiunii indicând control.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Shift Confirmation', target: 'New Direction', invalidation: 'Shift Failure', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t36', text:'#VALUEMAP', color:'#6366f1'}] },
  { id: 'pb-37', name: '37. 3-Day Balance Break', icon: '⚡', color: '#f97316', description: 'Spargerea unui echilibru de durată medie (3 zile).', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Balance Edge Break', target: 'Multi-day Extension', invalidation: 'Back in Balance', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t37', text:'#MULTIDAY', color:'#f97316'}] },
  { id: 'pb-38', name: '38. Weekly POC Magnet', icon: '🧲', color: '#06b6d4', description: 'Atracția prețului spre POC-ul săptămânii anterioare.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Value Entry', target: 'wPOC', invalidation: 'Rejection', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t38', text:'#TARGETING', color:'#06b6d4'}] },
  { id: 'pb-39', name: '39. Monthly Range Edge Fade', icon: '🛡️', color: '#ef4444', description: 'Respingeri la extremele lunare ale range-ului.', entryCriteria: [], exitCriteria: [], marketConditions: [], entryAt: 'Monthly High/Low', target: 'Monthly POC', invalidation: 'Monthly Breakout', isPrivate: false, createdAt: new Date().toISOString(), tags: [{id:'t39', text:'#STRUCTURE', color:'#ef4444'}] },
];

export interface PlaybooksSlice {
  playbooks: Playbook[];
  loadPlaybooks: () => Promise<void>;
  savePlaybook: (pb: Playbook) => Promise<void>;
  deletePlaybook: (id: string) => Promise<void>;
  restoreDefaultPlaybooks: () => Promise<void>;
}

export const createPlaybooksSlice: StateCreator<AppState, [], [], PlaybooksSlice> = (set, get) => ({
  playbooks: [],
  
  loadPlaybooks: async () => {
    let all = await storageService.getAllPlaybooks();
    
    // Auto-seed if empty
    if (all.length === 0) {
      await storageService.resetPlaybooks(DEFAULT_PLAYBOOKS);
      all = DEFAULT_PLAYBOOKS;
    }
    
    startTransition(() => {
      set({ playbooks: all });
    });
  },

  savePlaybook: async (pb: Playbook) => {
    await storageService.savePlaybook(pb);
    const all = await storageService.getAllPlaybooks();
    startTransition(() => {
      set({ playbooks: all });
    });
  },

  deletePlaybook: async (id: string) => {
    await storageService.deletePlaybook(id);
    const all = await storageService.getAllPlaybooks();
    startTransition(() => {
      set({ playbooks: all });
    });
  },

  restoreDefaultPlaybooks: async () => {
    await storageService.resetPlaybooks(DEFAULT_PLAYBOOKS);
    startTransition(() => {
      set({ playbooks: DEFAULT_PLAYBOOKS });
    });
  }
});
