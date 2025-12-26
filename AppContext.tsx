
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trade, Account, Playbook, DailyPrepData, WeeklyPrepData, Order, BacktestSession } from './types';
import { Language } from './translations';

const DATA_VERSION = "3.0"; 
const DEFAULT_USER_ID = 'user-default';

const INITIAL_PLAYBOOKS: Playbook[] = [
  // TIER 1: MACRO CONTEXT
  { id: 'pb-1', name: 'The GAP & Go', description: 'Open complet în afara range-ului zilei anterioare. Prețul respinge marginea gap-ului și pleacă agresiv.', icon: '🏃', color: '#3b82f6', entryCriteria: [{id:'1', text:'Full Gap Open'}, {id:'2', text:'Respingere Gap'}, {id:'3', text:'Breakout OR'}], exitCriteria: [], marketConditions: [], entryAt: 'Above/Below OR', target: '2.0 Range Ext', invalidation: 'Gap Fill', isPrivate: true, createdAt: new Date().toISOString(), tags: [{id:'t1', text:'#GAP', color:'#3b82f6'}] },
  { id: 'pb-2', name: 'The GAP Fill', description: 'Prețul eșuează să mențină gap-ul și reintră în range pentru a testa POC-ul.', icon: '🩹', color: '#60a5fa', entryCriteria: [{id:'1', text:'Eșec extindere Gap'}, {id:'2', text:'Acceptare pdRange'}], entryAt: 'pdRange Entry', target: 'pdPOC', invalidation: 'New Extreme', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t2', text:'#GAP', color:'#60a5fa'}] },
  { id: 'pb-3', name: 'The Half-Gap Fill', description: 'Reversare de la 50% din mărimea gap-ului după o încercare de fill eșuată.', icon: '🌓', color: '#3b82f6', entryCriteria: [{id:'1', text:'Massive Gap'}, {id:'2', text:'Stall la 50% Gap'}], entryAt: 'Mid-Gap Rejection', target: 'Gap Extreme', invalidation: 'Full Fill', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t3', text:'#GAP', color:'#3b82f6'}] },
  { id: 'pb-4', name: 'Inside Value Fade', description: 'Piață echilibrată. Vindem la VAH, cumpărăm la VAL.', icon: '⚖️', color: '#64748b', entryCriteria: [{id:'1', text:'Open în VA'}, {id:'2', text:'Respingere Edges'}], entryAt: 'VA Edges', target: 'pdPOC', invalidation: 'VA Breakout', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t4', text:'#INBALANCE', color:'#64748b'}] },
  { id: 'pb-5', name: 'Inside Day Breakout', description: 'Compresie totală în ziua anterioară urmată de o expansiune violentă.', icon: '📦', color: '#64748b', entryCriteria: [{id:'1', text:'Inside Day Setup'}, {id:'2', text:'Volume Spike at Break'}], entryAt: 'pdH/pdL Break', target: 'Range Extension', invalidation: 'Back in range', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t5', text:'#INSIDERANGE', color:'#64748b'}] },
  { id: 'pb-6', name: 'ON Inventory Correction', description: 'Corecția inventarului Overnight care este 100% net lung/scurt la open.', icon: '🔄', color: '#64748b', entryCriteria: [{id:'1', text:'100% ON Skew'}, {id:'2', text:'Eșec spargere ONH/L'}], entryAt: 'Opening Print', target: 'pdSettlement', invalidation: 'ON Extreme Break', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t6', text:'#INSIDERANGE', color:'#64748b'}] },
  { id: 'pb-7', name: 'The 80% Rule', description: 'Open în afara VA, dar în range. Acceptarea în VA duce la testarea marginii opuse.', icon: '📊', color: '#10b981', entryCriteria: [{id:'1', text:'2 perioade 30m în VA'}, {id:'2', text:'Target opus'}], entryAt: 'VA Acceptance', target: 'Opposite VA Edge', invalidation: 'Exit VA', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t7', text:'#OUTSIDEVA', color:'#10b981'}] },
  { id: 'pb-8', name: 'Failed Auction', description: 'Spargere falsă a unui nivel major urmată de o reversare rapidă.', icon: '🛑', color: '#f43f5e', entryCriteria: [{id:'1', text:'False Break < 5 ticks'}, {id:'2', text:'Reversare violentă'}], entryAt: 'Failed Level', target: 'Opposite Extreme', invalidation: 'New Extreme', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t8', text:'#REJECTION', color:'#f43f5e'}] },

  // TIER 2: OPENING AUCTION
  { id: 'pb-9', name: 'The Open Drive', description: 'Cumpărători/Vânzători agresivi la clopot. Prețul pleacă direct fără testare.', icon: '⚡', color: '#f97316', entryCriteria: [{id:'1', text:'No tails at open'}, {id:'2', text:'Immediate Range Ext'}], entryAt: 'Market Open', target: '2.0 IB Ext', invalidation: 'Open Lost', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t9', text:'#STRONGDRIVE', color:'#f97316'}] },
  { id: 'pb-10', name: 'The Open Test Drive', description: 'Testare rapidă a unui nivel cheie urmată de un drive în direcția opusă.', icon: '🎯', color: '#f97316', entryCriteria: [{id:'1', text:'Key Level Test'}, {id:'2', text:'Quick Rejection'}], entryAt: 'Test Level', target: 'Daily Extreme', invalidation: 'Test Level Break', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t10', text:'#STRONGDRIVE', color:'#f97316'}] },
  { id: 'pb-11', name: 'Open Rejection Reverse', description: 'Piața deschide cu Gap, încearcă să continue, dar respinge violent.', icon: '↩️', color: '#f43f5e', entryCriteria: [{id:'1', text:'Gap Open'}, {id:'2', text:'Failed Continuation'}], entryAt: 'Rejection Point', target: 'pdRange Entry', invalidation: 'Gap High/Low', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t11', text:'#REJECTION', color:'#f43f5e'}] },
  { id: 'pb-12', name: 'IB Extension Failure', description: 'Prețul sparge Initial Balance, dar eșuează imediat (Fakeout).', icon: '🥊', color: '#f97316', entryCriteria: [{id:'1', text:'IB Breakout'}, {id:'2', text:'Delta Divergence'}], entryAt: 'IB Edge Re-entry', target: 'Opposite IB Edge', invalidation: 'IB Break High', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t12', text:'#IB_STRUGGLE', color:'#f97316'}] },
  { id: 'pb-13', name: 'D-Period Expansion', description: 'Spargerea balanței în perioada D (după prima oră) de către instituționali.', icon: '🕓', color: '#f97316', entryCriteria: [{id:'1', text:'Narrow IB'}, {id:'2', text:'D Period Momentum'}], entryAt: 'IB Breakout (D)', target: '1.5 IB Ext', invalidation: 'Back in IB', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t13', text:'#IB_STRUGGLE', color:'#f97316'}] },

  // TIER 3: INTRADAY REGIME
  { id: 'pb-14', name: 'Trend Day', description: 'One Time Framing constant. Piața se mișcă într-o singură direcție toată ziua.', icon: '📉', color: '#10b981', entryCriteria: [{id:'1', text:'OTF Active'}, {id:'2', text:'Volume Profile Elongated'}], entryAt: 'Pullback to VWAP', target: 'New Low/High', invalidation: 'OTF Broken', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t14', text:'#IMBALANCE', color:'#10b981'}] },
  { id: 'pb-15', name: 'Single Prints Fill', description: 'Tranzacționare în zonele de ineficiență (Single Prints) de ieri.', icon: '🧱', color: '#10b981', entryCriteria: [{id:'1', text:'Entry in SP Zone'}, {id:'2', text:'Acceptance'}], entryAt: 'SP Zone Start', target: 'SP Zone End', invalidation: 'Exit SP Zone', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t15', text:'#IMBALANCE', color:'#10b981'}] },
  { id: 'pb-16', name: 'Double Distribution Trend', description: 'Două zone de valoare separate de Single Prints.', icon: '♒', color: '#10b981', entryCriteria: [{id:'1', text:'Trend Day Progress'}, {id:'2', text:'New Balance Build'}], entryAt: 'Mid-Level Test', target: 'Second Distribution', invalidation: 'Back to Dist 1', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t16', text:'#IMBALANCE', color:'#10b981'}] },
  { id: 'pb-17', name: 'Weak Low/High Cascade', description: 'Lichidarea minimelor/maximelor slabe (fără cozi) în cascadă.', icon: '🌊', color: '#10b981', entryCriteria: [{id:'1', text:'Identified Weak Low'}, {id:'2', text:'Level Break'}], entryAt: 'Break of first level', target: 'Next Liquidity', invalidation: 'Strong Bounce', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t17', text:'#CASCADE', color:'#10b981'}] },
  { id: 'pb-18', name: 'The Volume Vacuum', description: 'Mișcare ultra-rapidă prin zonele cu Low Volume Node.', icon: '🌪️', color: '#10b981', entryCriteria: [{id:'1', text:'LVN Zone Entry'}, {id:'2', text:'Velocity Spike'}], entryAt: 'LVN Entrance', target: 'Opposite HVN', invalidation: 'Stall in LVN', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t18', text:'#IMBALANCE', color:'#10b981'}] },
  { id: 'pb-19', name: 'VWAP Reversion', description: 'Piață supra-extinsă care revine la media ponderată (VWAP).', icon: '🪃', color: '#3b82f6', entryCriteria: [{id:'1', text:'> 2.0 Std Dev'}, {id:'2', text:'Delta Divergence'}], entryAt: 'Extremity Rejection', target: 'VWAP', invalidation: 'New Trend Leg', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t19', text:'#REVERSION', color:'#3b82f6'}] },
  { id: 'pb-20', name: '45-Degree Line Break', description: 'Spargerea structurii algoritmice de tip trendline.', icon: '📐', color: '#3b82f6', entryCriteria: [{id:'1', text:'Clear 45 deg line'}, {id:'2', text:'Break and Close'}], entryAt: 'Line Breakout', target: 'Start of Trend', invalidation: 'False Break', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t20', text:'#ALGORITHMIC', color:'#3b82f6'}] },
  { id: 'pb-21', name: 'The Ledge Break', description: 'Spargerea unui "Ledge" intraday format din TPO identice.', icon: '🪵', color: '#3b82f6', entryCriteria: [{id:'1', text:'Flat TPO Ledge'}, {id:'2', text:'Tick through level'}], entryAt: 'Ledge Break', target: '20 Ticks / Next LVN', invalidation: 'Back over Ledge', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t21', text:'#SUPPORT/RES', color:'#3b82f6'}] },
  { id: 'pb-22', name: 'Short Covering Rally', description: 'Raliu violent cauzat de închiderea forțată a pozițiilor short.', icon: '🩳', color: '#3b82f6', entryCriteria: [{id:'1', text:'P-Shape Profile'}, {id:'2', text:'Low Vol Retest'}], entryAt: 'Low Vol Rejection', target: 'High of Day', invalidation: 'V-Shape Reversal', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t22', text:'#STRUCTURE', color:'#3b82f6'}] },
  { id: 'pb-23', name: 'Long Liquidation', description: 'Cădere bruscă cauzată de ieșirea în panică a cumpărătorilor.', icon: '🩸', color: '#3b82f6', entryCriteria: [{id:'1', text:'b-Shape Profile'}, {id:'2', text:'Failed Bounce'}], entryAt: 'Break of b-base', target: 'Low of Day', invalidation: 'V-Shape Reversal', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t23', text:'#STRUCTURE', color:'#3b82f6'}] },

  // TIER 4: LOCATION & TARGETING
  { id: 'pb-24', name: 'Poor High/Low Repair', description: 'Piața revine pentru a "repara" o extremă fără coadă (Poor Structure).', icon: '🔧', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Identified Poor Extreme'}, {id:'2', text:'Local Momentum'}], entryAt: 'Local Break', target: 'Poor Extreme', invalidation: 'Rejection at Mid', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t24', text:'#POORSTRUCTURE', color:'#8b5cf6'}] },
  { id: 'pb-25', name: 'Naked POC Magnet', description: 'Prețul este atras de un POC neatins din zilele anterioare.', icon: '🧲', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Nearby nPOC'}, {id:'2', text:'Path of least resistance'}], entryAt: 'Consolidation Break', target: 'nPOC', invalidation: 'Opposite Level lost', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t25', text:'#OLDBUSINESS', color:'#8b5cf6'}] },
  { id: 'pb-26', name: 'The Halfback Play', description: 'Respingere de la exact 50% din range-ul zilei curente.', icon: '📏', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Established Day Range'}, {id:'2', text:'Touch of 50% Mid'}], entryAt: 'Mid-Level Touch', target: 'Day High/Low', invalidation: '5 ticks beyond Mid', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t26', text:'#PIVOT', color:'#8b5cf6'}] },
  { id: 'pb-27', name: 'Composite HVN Rejection', description: 'Respingerea de la un High Volume Node compozit (pe termen lung).', icon: '🧱', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Multi-day HVN'}, {id:'2', text:'Absorption on Delta'}], entryAt: 'HVN Touch', target: 'LVN Opposite', invalidation: 'Acceptance in HVN', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t27', text:'#HVN', color:'#8b5cf6'}] },
  { id: 'pb-28', name: 'Round Number Magnet', description: 'Atracția psihologică către numere rotunde (ex: 18000, 5000).', icon: '🔮', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Proximity to Whole Num'}, {id:'2', text:'Accelerated Tape'}], entryAt: 'Last 10 points', target: 'Round Number', invalidation: 'Stall 5pts away', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t28', text:'#PSYCHOLOGY', color:'#8b5cf6'}] },

  // TIER 5: TIME FACTOR
  { id: 'pb-29', name: 'Afternoon Drift', description: 'Marea "plimbare" a după-amiezii (drift) spre POC-ul zilei.', icon: '🛶', color: '#f43f5e', entryCriteria: [{id:'1', text:'Time 12:00-14:00 NY'}, {id:'2', text:'Low Volume'}], entryAt: 'Extreme Fade', target: 'Daily POC', invalidation: 'Spike Breakout', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t29', text:'#AFTERNOON', color:'#f43f5e'}] },
  { id: 'pb-30', name: 'The Late Day Spike', description: 'Repoziționare instituțională agresivă în ultima oră de trading.', icon: '🌵', color: '#f43f5e', entryCriteria: [{id:'1', text:'Last hour print'}, {id:'2', text:'Volume Expansion'}], entryAt: 'Range Breakout (3:15)', target: 'Close at extreme', invalidation: 'V-reversal', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t30', text:'#LATEDAY', color:'#f43f5e'}] },
  { id: 'pb-31', name: 'Weekly POC Magnet', description: 'Joi sau Vineri, prețul tinde să se întoarcă la centrul de greutate săptămânal.', icon: '⏲️', color: '#f43f5e', entryCriteria: [{id:'1', text:'Thu/Fri Session'}, {id:'2', text:'Weekly Balanced Profile'}], entryAt: 'Weekly Edge Rejection', target: 'Weekly POC', invalidation: 'Trend Continuation', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t31', text:'#ENDOFWEEK', color:'#f43f5e'}] },
  { id: 'pb-32', name: '3-Day Balance Break', description: 'Ieșirea dintr-o zonă de echilibru de 3 zile suprapuse.', icon: '🔱', color: '#f43f5e', entryCriteria: [{id:'1', text:'3 Day Coil'}, {id:'2', text:'Break of balance edge'}], entryAt: 'Edge Break', target: 'Next Weekly Level', invalidation: 'Back in Balance', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t32', text:'#MULTIDAY', color:'#f43f5e'}] },

  // OTHERS / LEGACY / ADVANCED
  { id: 'pb-33', name: 'Spike Base Retest', description: 'Testarea bazei unui spike de la închiderea anterioară.', icon: '🏹', color: '#64748b', entryCriteria: [{id:'1', text:'Spike in pSession'}, {id:'2', text:'Open at Spike Base'}], entryAt: 'Spike Base', target: 'Spike Tip', invalidation: 'Through Spike', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t33', text:'#REJECTION', color:'#64748b'}] },
  { id: 'pb-34', name: 'Buying Tail Defense', description: 'Cumpărare la retestarea unei cozi de cumpărare (Buying Tail).', icon: '🛡️', color: '#10b981', entryCriteria: [{id:'1', text:'Significant Tail found'}, {id:'2', text:'Slow retest'}], entryAt: 'Tail 50%', target: 'Daily High', invalidation: 'Tail Lost', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t34', text:'#STRUCTURE', color:'#10b981'}] },
  { id: 'pb-35', name: 'Selling Tail Defense', description: 'Vânzare la retestarea unei cozi de vânzare.', icon: '🛡️', color: '#f43f5e', entryCriteria: [{id:'1', text:'Strong Selling Tail'}, {id:'2', text:'Slow retest'}], entryAt: 'Tail 50%', target: 'Daily Low', invalidation: 'Tail Lost', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t35', text:'#STRUCTURE', color:'#f43f5e'}] },
  { id: 'pb-36', name: 'Value Area Migration', description: 'Piața mută valoarea într-o zonă nouă și o acceptă.', icon: '🚚', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Value Shift'}, {id:'2', text:'Consolidation in new zone'}], entryAt: 'Shift Confirmation', target: 'Trend Continuation', invalidation: 'Failure to hold value', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t36', text:'#STRUCTURE', color:'#8b5cf6'}] },
  { id: 'pb-37', name: 'Initiative Buying', description: 'Cumpărătorii iau inițiativa peste un punct de echilibru.', icon: '🔥', color: '#10b981', entryCriteria: [{id:'1', text:'Break of balance'}, {id:'2', text:'High Relative Volume'}], entryAt: 'Balance Edge', target: 'Next Macro Pivot', invalidation: 'Back in Balance', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t37', text:'#IMBALANCE', color:'#10b981'}] },
  { id: 'pb-38', name: 'Responsive Selling', description: 'Vânzătorii reacționează la prețuri percepute ca fiind scumpe.', icon: '🥶', color: '#3b82f6', entryCriteria: [{id:'1', text:'Touch of Overextended Level'}, {id:'2', text:'Absorption'}], entryAt: 'Price Edge', target: 'Value Area Entry', invalidation: 'Continuation', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t38', text:'#REJECTION', color:'#3b82f6'}] },
  { id: 'pb-39', name: 'Monthly Open Retest', description: 'Nivel magnetic de importanță majoră: deschiderea lunii.', icon: '🗝️', color: '#8b5cf6', entryCriteria: [{id:'1', text:'Monthly Open proximity'}, {id:'2', text:'Strong Tape Rejection'}], entryAt: 'Monthly Open', target: '200 Ticks', invalidation: 'Acceptance through', isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t39', text:'#PIVOT', color:'#8b5cf6'}] }
];

const INITIAL_ACCOUNTS: Account[] = [
  { 
    id: `acc-1-${DEFAULT_USER_ID}`, 
    name: 'APEX-224851-46', 
    type: 'Apex', 
    initialBalance: 50000, 
    targetProfit: 53000, 
    maxDrawdown: 2500, 
    currency: 'USD', 
    isPA: true,
    isRithmicConnected: false,
    createdAt: new Date().toISOString(),
    riskSettings: { maxTotalRisk: 2500, maxDailyRisk: 500, maxTradesPerDay: 5, maxContractsPerTrade: 2, dailyProfitTarget: 1000, preferredInstrument: 'MNQ' }
  },
];

interface AppContextType {
  trades: Trade[];
  backtestTrades: Trade[];
  backtestSessions: BacktestSession[];
  accounts: Account[];
  activeOrders: Order[];
  playbooks: Playbook[];
  dailyPreps: Record<string, DailyPrepData>;
  weeklyPreps: Record<string, WeeklyPrepData>;
  dailyNotes: Record<string, string>;
  accountBlocks: Record<string, string>;
  language: Language;
  selectedAccountId: string;
  isDarkMode: boolean;
  riskManagerEnabled: boolean;
  addTrade: (trade: Trade) => void;
  addBacktestTrade: (trade: Trade) => void;
  addBacktestSession: (session: BacktestSession) => void;
  updateBacktestSession: (session: BacktestSession) => void;
  updateTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;
  deleteBacktestTrade: (id: string) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  savePlaybook: (pb: Playbook) => void;
  deletePlaybook: (id: string) => void;
  saveDailyPrep: (date: string, prep: DailyPrepData) => void;
  saveWeeklyPrep: (weekId: string, prep: WeeklyPrepData) => void;
  saveDailyNote: (date: string, note: string) => void;
  setLanguage: (lang: Language) => void;
  setSelectedAccountId: (id: string) => void;
  setIsDarkMode: (dark: boolean) => void;
  setRiskManagerEnabled: (enabled: boolean) => void;
  setActiveOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [backtestTrades, setBacktestTrades] = useState<Trade[]>([]);
  const [backtestSessions, setBacktestSessions] = useState<BacktestSession[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [dailyPreps, setDailyPreps] = useState<Record<string, DailyPrepData>>({});
  const [weeklyPreps, setWeeklyPreps] = useState<Record<string, WeeklyPrepData>>({});
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [accountBlocks, setAccountBlocks] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('tv_lang') as Language) || 'ro');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => localStorage.getItem('tv_selected_acc') || 'all');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('tv_theme') !== 'light');
  const [riskManagerEnabled, setRiskManagerEnabled] = useState(() => localStorage.getItem('tv_risk_manager') !== 'false');

  useEffect(() => {
    try {
      const load = (key: string) => localStorage.getItem(`tv_${key}_${DEFAULT_USER_ID}`);
      const sTrades = load('trades');
      const sBTTrades = load('backtest_trades');
      const sBTSessions = load('backtest_sessions');
      const sAccounts = load('accounts');
      const sPlaybooks = load('playbooks');
      const sDailyPreps = load('daily_preps');
      const sWeeklyPreps = load('weekly_preps');
      const sDailyNotes = load('daily_notes');
      const sBlocks = load('account_blocks');
      const sVersion = load('data_version');

      if (sTrades) setTrades(JSON.parse(sTrades));
      if (sBTTrades) setBacktestTrades(JSON.parse(sBTTrades));
      if (sBTSessions) setBacktestSessions(JSON.parse(sBTSessions));
      if (sAccounts) setAccounts(JSON.parse(sAccounts)); else setAccounts(INITIAL_ACCOUNTS);
      
      // Upgrade logic: if version mismatch, merge or replace with full list
      if (sPlaybooks && sVersion === DATA_VERSION) {
          setPlaybooks(JSON.parse(sPlaybooks));
      } else {
          // Reset playbooks to the new exhaustive list if version changed
          setPlaybooks(INITIAL_PLAYBOOKS);
      }

      if (sDailyPreps) setDailyPreps(JSON.parse(sDailyPreps));
      if (sWeeklyPreps) setWeeklyPreps(JSON.parse(sWeeklyPreps));
      if (sDailyNotes) setDailyNotes(JSON.parse(sDailyNotes));
      if (sBlocks) setAccountBlocks(JSON.parse(sBlocks));
    } catch (e) { console.error("Load failed", e); }
  }, []);

  useEffect(() => {
    const save = (key: string, val: any) => localStorage.setItem(`tv_${key}_${DEFAULT_USER_ID}`, JSON.stringify(val));
    save('trades', trades);
    save('backtest_trades', backtestTrades);
    save('backtest_sessions', backtestSessions);
    save('accounts', accounts);
    save('playbooks', playbooks);
    save('daily_preps', dailyPreps);
    save('weekly_preps', weeklyPreps);
    save('daily_notes', dailyNotes);
    save('account_blocks', accountBlocks);
    save('data_version', DATA_VERSION);
    localStorage.setItem('tv_lang', language);
    localStorage.setItem('tv_selected_acc', selectedAccountId);
    localStorage.setItem('tv_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('tv_risk_manager', riskManagerEnabled ? 'true' : 'false');
  }, [trades, backtestTrades, backtestSessions, accounts, playbooks, dailyPreps, weeklyPreps, dailyNotes, accountBlocks, language, selectedAccountId, isDarkMode, riskManagerEnabled]);

  const addTrade = (t: Trade) => setTrades(prev => [t, ...prev]);
  const addBacktestTrade = (t: Trade) => setBacktestTrades(prev => [t, ...prev]);
  const addBacktestSession = (s: BacktestSession) => setBacktestSessions(prev => [s, ...prev]);
  const updateBacktestSession = (s: BacktestSession) => setBacktestSessions(prev => prev.map(item => item.id === s.id ? s : item));
  
  const updateTrade = (t: Trade) => setTrades(prev => prev.map(item => item.id === t.id ? t : item));
  const deleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id));
  const deleteBacktestTrade = (id: string) => setBacktestTrades(prev => prev.filter(t => t.id !== id));
  
  const updateAccount = (acc: Account) => setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
  const deleteAccount = (id: string) => { setAccounts(prev => prev.filter(a => a.id !== id)); setTrades(prev => prev.filter(t => t.accountId !== id)); };
  const savePlaybook = (pb: Playbook) => setPlaybooks(prev => prev.find(p => p.id === pb.id) ? prev.map(p => p.id === pb.id ? pb : p) : [...prev, pb]);
  const deletePlaybook = (id: string) => setPlaybooks(prev => prev.filter(p => p.id !== id));
  const saveDailyPrep = (date: string, prep: DailyPrepData) => setDailyPreps(prev => ({ ...prev, [date]: prep }));
  const saveWeeklyPrep = (weekId: string, prep: WeeklyPrepData) => setWeeklyPreps(prev => ({ ...prev, [weekId]: prep }));
  const saveDailyNote = (date: string, note: string) => setDailyNotes(prev => ({ ...prev, [date]: note }));

  const value = {
    trades, backtestTrades, backtestSessions, accounts, activeOrders, playbooks, dailyPreps, weeklyPreps, dailyNotes, accountBlocks, language, selectedAccountId, isDarkMode, riskManagerEnabled,
    addTrade, addBacktestTrade, addBacktestSession, updateBacktestSession, updateTrade, deleteTrade, deleteBacktestTrade, updateAccount, deleteAccount, setAccounts, savePlaybook, deletePlaybook, 
    saveDailyPrep, saveWeeklyPrep, saveDailyNote, setLanguage, setSelectedAccountId, setIsDarkMode, setRiskManagerEnabled, setActiveOrders
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
