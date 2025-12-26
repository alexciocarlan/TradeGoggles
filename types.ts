
export type TradeType = 'LONG' | 'SHORT';
export type TradeStatus = 'WIN' | 'LOSS' | 'BE';
export type SessionType = 'Asia' | 'London' | 'NY Morning' | 'NY Afternoon';
export type BiasType = 'Bullish' | 'Bearish' | 'Neutral';
export type NewsImpactType = 'High' | 'Medium' | 'Low' | 'None';
export type SetupGrade = 'A+' | 'B' | 'C' | 'None';

export type ExecutionErrorType = 
  | 'Frica/Ezitarea la Intrare'
  | 'Atasamentul Emotional de Rezultat'
  | 'Refuzul de a Pierde (Mutarea Stop-Loss-ului)'
  | 'Focus pe Bani (P&L), nu pe Executie'
  | 'Trading Impulsiv (Fără Plan)'
  | 'Încălcarea Edge-ului (Style Drift)'
  | 'Tilt Emotional (Revenge Trading)'
  | 'Lipsa Jurnalizării'
  | 'Trading în Stare Degradată (Oboseală/Stres)'
  | 'FOMO (Fear Of Missing Out)'
  | 'None';

export type CorrectionPlanType =
  | 'Redu pozitia la 25% din mărimea normală'
  | 'Pune 20 trade-uri, indiferent de rezultat'
  | 'Foloseste doar Hard Stops'
  | 'Ascunde coloana de P&L din platformă.'
  | 'Executa doar scenariul scris'
  | 'Executa doar scenarii A+'
  | 'Pauza de 15 minute dupa o pierdere'
  | 'Ai voie sa trade-uiesti dupa ce ai completat jurnalul de ieri'
  | 'Tranzacționezi cu 50% din mărime și max 2 tranzacții'
  | 'Doar limit orders timp de 1 saptamana'
  | 'None';

export type MentalStateType = 'Calm' | 'Anxious' | 'Bored' | 'Excited';
export type AccountType = 'Personal' | 'Apex' | 'Prop' | 'Demo' | 'Backtest';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  targetProfit?: number;
  maxDrawdown: number;
  currency: string;
  isPA: boolean;
  createdAt: string;
  riskSettings?: AccountRiskSettings;
  isRithmicConnected?: boolean;
  rithmicUser?: string;
  rithmicPassword?: string;
  rithmicSystem?: 'Apex' | 'Rithmic Paper' | 'Rithmic 01';
  rithmicGateway?: 'Chicago' | 'Chicago Area' | 'London' | 'Frankfurt' | 'Tokyo';
  rithmicMarketData?: 'On' | 'Off';
  rithmicUserType?: 'Professional' | 'Non-Professional';
  rithmicSelectiveLoad?: 'On' | 'Off';
  isLiveSyncing?: boolean;
  currentBalance?: number;
  closedPnl?: number;
  openPnl?: number;
}

export interface Order {
  id: string;
  accountId: string;
  instrument: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  type: 'LIMIT' | 'STOP' | 'MARKET';
  status: 'WORKING' | 'FILLED' | 'CANCELLED';
  time: string;
}

export interface AccountRiskSettings {
  maxTotalRisk: number;
  maxDailyRisk: number;
  maxTradesPerDay: number;
  maxContractsPerTrade: number;
  dailyProfitTarget: number;
  preferredInstrument?: string;
}

export interface Trade {
  id: string;
  accountId: string;
  sessionId?: string; // ID-ul sesiunii de backtest (dacă e cazul)
  isChallenge: boolean; 
  date: string;
  instrument: string;
  session: SessionType;
  bias: BiasType;
  dailyNarrative: string;
  durationMinutes: number; 
  entryTime?: string;
  exitTime?: string;
  pdValueRelationship: PdValueRelationship;
  marketCondition: MarketCondition;
  priceVsPWeek: string;
  mediumTermTrend: MediumTermTrend;
  onRangeVsPDay: 'Inside' | 'Outside' | 'None';
  onInventory: ONInventory;
  pdExtremes: 'Poor High' | 'Poor Low' | 'Both' | 'None';
  untestedPdVA: 'High' | 'Low' | 'Both' | 'None';
  spHigh: string;
  spLow: string;
  gapHigh: string;
  gapLow: string;
  priorVPOC: 'naked' | 'tapped' | 'None';
  onVsSettlement: 'lower' | 'higher' | 'None';
  hypoSession: string; 
  hypoThen: string;
  zoneOfInterest: string;
  continuationTrigger: string;
  reversalTrigger: string;
  invalidationPoint: string;
  exitLevel: string;
  openType: OpenType;
  isPriceAcceptedInPdVA: 'yes' | 'no' | 'None';
  htfMs: 'Bullish' | 'Bearish';
  newsImpact: NewsImpactType;
  setup: string;
  setupGrade: SetupGrade;
  type: TradeType;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  contracts: number;
  exitPrice: number;
  pnlBrut: number;
  commissions: number;
  pnlNet: number;
  rrRealized: number;
  status: TradeStatus;
  disciplineScore: number;
  executionError: ExecutionErrorType;
  correctionPlan: CorrectionPlanType;
  mentalState: MentalStateType;
  screenshots: TradeScreenshot[];
  notes: string;
  tags: string[];
  isPartOfPlan: boolean;
  condition1Met: boolean;
  condition2Met: boolean;
  condition3Met: boolean;
}

export type PdValueRelationship = 'InsideRange' | 'InBalance' | 'OutsideVA' | 'GAP' | 'None';
export type MarketCondition = 'Bracket' | 'Trend' | 'Transition' | 'None';
export type MediumTermTrend = 'Up' | 'Down' | 'Balancing' | 'None';
export type ONInventory = 'Long' | 'Short' | 'Net Zero' | 'None';
export type OpenType = 'Drive' | 'Test driver' | 'Rejection- Reversal' | 'Auction' | 'None';

export interface PlaybookRule { id: string; text: string; }

export interface PlaybookTag {
  id: string;
  text: string;
  color: string;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  entryCriteria: PlaybookRule[];
  exitCriteria: PlaybookRule[];
  marketConditions: PlaybookRule[];
  entryAt: string;
  target: string;
  invalidation: string;
  isPrivate: boolean;
  createdAt: string;
  screenshots?: TradeScreenshot[];
  tags: PlaybookTag[];
}
export interface User { id: string; name: string; email: string; password?: string; }
export interface TradeScreenshot { url: string; caption: string; }
export interface DailyPrepData {
  gkPhysicalEnergy: number; gkMentalClarity: number; gkEmotionalCalm: number; gkProcessConfidence: number;
  gkSleepHours?: number; gkMeditation?: boolean; gkExercise?: boolean; gkNutrition?: number;
  gkDoNotDisturb: boolean; gkPlanWritten: boolean; gkDouglasAffirmation: boolean; gkStoicAffirmation: boolean;
  gkTotalScore: number; gkVerdict: 'Green' | 'Yellow' | 'Red' | 'None';
  instrument: string; pdValueRelationship: PdValueRelationship; marketCondition: MarketCondition;
  priceVsPWeek: string; mediumTermTrend: MediumTermTrend; onRangeVsPDay: 'Inside' | 'Outside' | 'None';
  onInventory: ONInventory; pdExtremes: 'Poor High' | 'Poor Low' | 'Both' | 'None';
  untestedPdVA: 'High' | 'Low' | 'Both' | 'None'; spHigh: string; spLow: string; gapHigh: string; gapLow: string;
  priorVPOC: 'naked' | 'tapped' | 'None'; onVsSettlement: 'lower' | 'higher' | 'None';
  newsImpact: NewsImpactType; bias: BiasType; dailyNarrative: string;
  setup: string; hypoSession: string; hypoThen: 'New York' | 'London' | 'Asia' | 'None';
  zoneOfInterest: string; continuationTrigger: string; reversalTrigger: string; invalidationPoint: string; exitLevel: string;
  setup2: string; hypoSession2: string; hypoThen2: 'New York' | 'London' | 'Asia' | 'None';
  zoneOfInterest2: string; continuationTrigger2: string; reversalTrigger2: string; invalidationPoint2: string; exitLevel2: string;
  habNoGoRespected: boolean; habPreMarketDone: boolean; habStopLossRespected: boolean;
  habNoRevengeTrading: boolean; habJournalCompleted: boolean; habDisciplineScore: number;
  pmrTradedPlan: 'DA' | 'NU' | 'None'; pmrDifficultMoment: string; pmrDailyLesson: string;
  prepScreenshots?: TradeScreenshot[];
}

export interface WeeklyPrepData {
  id: string; 
  weeklyBias: BiasType;
  pwHigh: string;
  pwLow: string;
  pwPOC: string;
  pwVAH: string;
  pwVAL: string;
  weeklyMacroNotes: string;
  weeklyThemes: string[];
  weeklyGoals: string;
  weeklyNarrative: string;
  weeklyScreenshots: TradeScreenshot[];
  tradingDays: string[]; 
  createdAt: string;
}

export interface BacktestSession {
  id: string; 
  name: string; 
  symbol: string; 
  playbookName: string; 
  startBalance: number; 
  currentBalance: number;
  pnl: number; 
  timeSpentMinutes: number; 
  winRate: number; 
  tradeCount: number; 
  wins: number; 
  losses: number; 
  bes: number;
  status: 'Active' | 'Completed'; 
  createdAt: string;
  description?: string;
  assetType?: 'Forex' | 'Stocks' | 'Crypto' | 'Futures';
  startDate?: string;
  endDate?: string;
}
