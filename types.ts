
// FIX: Added 'Language' type to be exported and used across the application.
export type Language = 'ro' | 'en';

/**
 * IMPLEMENTARE RECOMANDATĂ: Standardizare Erori API
 * Clasă personalizată pentru a distinge între tipurile de erori.
 */
export class AppError extends Error {
  constructor(public code: string, message: string, public meta?: any) {
    super(message);
    this.name = 'AppError';
  }
}

export type TradeType = 'LONG' | 'SHORT';
export type TradeStatus = 'WIN' | 'LOSS' | 'BE';
export type SessionType = 'Asia' | 'London' | 'NY Morning' | 'NY Afternoon';
export type BiasType = 'Bullish' | 'Bearish' | 'Neutral';
export type NewsImpactType = 'High' | 'Medium' | 'Low' | 'None';
export type SetupGrade = 'A+' | 'B' | 'C' | 'None';
export type DrawdownType = 'Trailing' | 'Static';

export interface RithmicSession {
  accountId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage?: string;
  marketPrice?: number;
}

export type ExecutionErrorType = 
  | '1. FOMO / Chasing'
  | '2. Hesitation (Analysis Paralysis)'
  | '3. Premature Exit (Paper Hands)'
  | '4. Stop-Loss Sabotage (Moving SL to BE)'
  | '5. Averaging Down (The Loser\'s Move)'
  | '6. Revenge Trading'
  | '7. Over-Leveraging (Size Error)'
  | '8. Impulse/Boredom Trading'
  | '9. Target Greed'
  | 'None';

export type CorrectionPlanType =
  | 'The Retest Rule: Only enter at limit orders. There is always another bus.'
  | 'Douglas Probabilistic Thinking: Use Market Order at trigger. Result is irrelevant.'
  | 'Set and Forget / Active Management: Use bracket order (ATM). Do not touch.'
  | 'Cost of Doing Business: SL is an expense. Limit BE only after 1:1 or structure break.'
  | 'Hard System Stop: Close 50% of position instead of adding. Best losers win.'
  | 'The Circuit Breaker: Walk away 30 mins after 2 losses. Mandatory movement.'
  | 'Fixed Fractional Risk: Limit X% per trade. Size down until you feel bored.'
  | 'The Entry Checklist: Physically check 3-5 criteria. No checklist, no trade.'
  | 'Automatic Limit Orders: Close 80% at automated target. Small runner only.'
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
  drawdownType: DrawdownType;
  trailingStopThreshold?: number;
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
  riskLockedUntil?: string; 
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
  rrRatio?: number;
  manualAtr?: number;
  calcMode?: 'fixedContracts' | 'fixedSL';
  targetMode?: 'fixedRR' | 'fixedTargetPoints'; 
  fixedTargetPoints?: number; 
  fixedSlPoints?: number;
  commPerContract?: number;
  targetProfitGoal?: number;
}

export interface Trade {
  id: string;
  accountId: string;
  sessionId?: string; 
  isChallenge: boolean; 
  date: string;
  updated_at?: string; 
  instrument: string;
  session: SessionType;
  bias: BiasType;
  dailyNarrative: string;
  durationMinutes?: number; 
  entryTime?: string;
  exitTime?: string;
  pdValueRelationship: PdValueRelationship;
  marketCondition: MarketCondition;
  priceVsPWeek: string;
  mediumTermTrend: MediumTermTrend;
  onRangeVsPDay: 'Inside' | 'Outside' | 'None';
  onInventory: ONInventory;
  pdExtremes: PdExtremes;
  untestedPdVA: UntestedPdVA;
  spHigh: string;
  spLow: string;
  gapHigh: string;
  gapLow: string;
  priorVPOC: PriorVPOC;
  onVsSettlement: 'lower' | 'higher' | 'None';
  hypoSession: string; 
  hypoThen: 'New York' | 'London' | 'Asia' | 'None';
  zoneOfInterest: string; 
  continuationTrigger: string; 
  reversalTrigger: string; 
  invalidationPoint: string; 
  exitLevel: string;
  openType: OpenType;
  ibWidth: IbWidth;
  rangeExtension: RangeExtension;
  htfMs: 'Bullish' | 'Bearish';
  newsImpact: NewsImpactType;
  setup: string;
  setupGrade: SetupGrade;
  type: TradeType;
  entryPrice: number;
  stopLoss: number;
  slHit?: boolean;
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
  isAccordingToPlan?: 'DA' | 'NU' | 'None';
  condition1Met: boolean;
  condition2Met: boolean;
  condition3Met: boolean;
}

export type PdValueRelationship = 'InsideRange' | 'InBalance' | 'OutsideVA' | 'GAP' | 'None';
export type MarketCondition = 'Bracket' | 'Trend' | 'Transition' | 'None';
export type MediumTermTrend = 'Up' | 'Down' | 'Balancing' | 'None';
export type ONInventory = 'Long' | 'Short' | 'Net Zero' | 'None';
export type OpenType = 'Drive' | 'Test driver' | 'Rejection- Reversal' | 'Auction' | 'None';
export type PdExtremes = 'Poor High' | 'Poor Low' | 'Both' | 'None';
export type UntestedPdVA = 'High' | 'Low' | 'Both' | 'None';
export type PriorVPOC = 'naked' | 'tapped' | 'None';
export type IbWidth = 'Narrow' | 'Wide' | 'Normal';
export type RangeExtension = 'Up' | 'Down' | 'Both' | 'None';
export type SinglePrintType = 'Below Open' | 'Above Open' | 'Inside' | 'None';

export interface PlaybookRule { id: string; text: string; }
export interface PlaybookTag { id: string; text: string; color: string; }
export interface PlaybookTrap { label: string; name: string; description: string; }
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
  traps?: PlaybookTrap[];
}
export interface User { id: string; name: string; email: string; password?: string; }
export interface TradeScreenshot { url: string; caption: string; }

export type MarketContextType = 
  | 'STRONG_TREND' 
  | 'TREND_VALIDATED' 
  | 'REVERSION' 
  | 'BALANCE_CHOP' 
  | 'TREND' 
  | 'BALANCE'
  | 'UNDEFINED';

export type OpeningContext = 'OUT_OF_BALANCE' | 'IN_BALANCE_OUTSIDE_VALUE' | 'IN_BALANCE_INSIDE_VALUE' | 'ANY';
export type ParticipantType = 'OTF' | 'LOCALS' | 'MIXED' | 'UNDEFINED';
export type RelativeVolumeType = 'ABOVE_AVG' | 'BELOW_AVG' | 'AVG' | 'UNDEFINED';

// Layer 3 Value Dynamics
export type ValueOverlap = 'No overlapping' | 'Minimum overlap' | 'High overlap' | 'Full overlap' | 'ANY';
export type ValueMigration = 'Migrating outside' | 'Migration to pdValue' | 'Migrating outside pdValue' | 'None' | 'ANY';

// Section 4.2 Structural Anomalies
export type StructuralAnomalyType = 'POOR_STRUCTURE' | 'LEDGE' | 'SINGLE_PRINTS' | 'NONE';

// Expert Recommendation: Intent Families
export type IntentFamily = 'CONFIDENCE' | 'FILL' | 'ROTATION' | 'Correction' | 'UNDEFINED';

export interface TradingSetup {
  id: number;
  name: string;
  group: 'A' | 'B' | 'C' | 'D';
  contexts: MarketContextType[];
  criteria: string[];
  trigger: string;
  target: string;
  invalidation: string;
  traps: string[];
  openingContext: OpeningContext;
  openType?: OpenType; // Added for Open Type filtering
  strategyType: string;
  triggerTiming: string;
  dominantParticipant?: string;
  valueOverlap?: ValueOverlap;
  valueMigration?: ValueMigration;
  relevantAnomaly?: StructuralAnomalyType; // Section 4.2
  intentFamily?: IntentFamily; // Expert Recommendation A
}

export interface DailyPrepData {
  gkPhysicalEnergy: number; gkMentalClarity: number; gkEmotionalCalm: number; gkProcessConfidence: number;
  gkSleepHours?: number; gkMeditation?: boolean; gkExercise?: boolean; gkNutrition?: number;
  gkHRVValue?: number; gkHRVBaseline?: number;
  gkDoNotDisturb: boolean; gkPlanWritten: boolean; gkDouglasAffirmation: boolean; gkStoicAffirmation: boolean;
  gkUncertaintyAccepted?: boolean;
  gkStopLossExecution?: boolean;
  gkNoAddingToLoss?: boolean;
  gkRiskCalmness?: boolean;
  gkDailyRiskAmount: number;
  gkTotalScore: number; gkVerdict: 'Green' | 'Yellow' | 'Red' | 'None';
  instrument: string; pdValueRelationship: PdValueRelationship; marketCondition: MarketCondition;
  priceVsPWeek: string; mediumTermTrend: MediumTermTrend; onRangeVsPDay: 'Inside' | 'Outside' | 'None';
  onInventory: ONInventory; pdExtremes: 'Poor High' | 'Poor Low' | 'Both' | 'None';
  untestedPdVA: 'High' | 'Low' | 'Both' | 'None'; spHigh: string; spLow: string; gapHigh: string; gapLow: string;
  priorVPOC: 'naked' | 'tapped' | 'None'; onVsSettlement: 'lower' | 'higher' | 'None';
  newsImpact: NewsImpactType; bias: BiasType; dailyNarrative: string;
  setup: string; 
  setupGrade: SetupGrade;
  
  // Hypothesis 1
  hypoSession: string; 
  hypoThen: 'New York' | 'London' | 'Asia' | 'None';
  zoneOfInterest: string; 
  continuationTrigger: string; 
  reversalTrigger: string; 
  invalidationPoint: string; 
  exitLevel: string;
  duringSession?: string;
  in30MinSession?: string;

  // Hypothesis 2
  setup2: string; 
  hypoSession2: string; 
  hypoThen2: 'New York' | 'London' | 'Asia' | 'None';
  zoneOfInterest2: string; 
  continuationTrigger2: string; 
  reversalTrigger2: string; 
  invalidationPoint2: string; 
  exitLevel2: string;
  duringSession2?: string;
  in30MinSession2?: string;

  habNoGoRespected: boolean; habPreMarketDone: false; habStopLossRespected: boolean;
  habNoRevengeTrading: false; habJournalCompleted: false; habDisciplineScore: number;
  pmrTradedPlan: 'DA' | 'NU' | 'None'; pmrDifficultMoment: string; pmrDailyLesson: string;
  prepScreenshots?: TradeScreenshot[];
  openType?: OpenType; ibWidth?: 'Narrow' | 'Wide' | 'Normal'; rangeExtension?: 'Up' | 'Down' | 'Both' | 'None';
  trendYesterday?: boolean;
  gkFocusError?: string;
  htfMs?: 'Bullish' | 'Bearish';
  marketContext?: MarketContextType;
  validatedSetups?: number[];
  openingContext?: OpeningContext;
  
  // Layer 2: Participant Matrix
  volRelative?: RelativeVolumeType;
  rangeExtensionActive?: boolean;
  participantControl?: ParticipantType;

  // Layer 3: Value Dynamics
  observedValueOverlap?: ValueOverlap;
  observedValueMigration?: ValueMigration;

  // Layer 4.2: Structural Anomalies
  observedAnomalies?: StructuralAnomalyType[];
  
  // New Field: Single Prints Relationship
  singlePrints?: SinglePrintType;
}

export interface WeeklyNewsEvent { event: string; time: string; tier: number; }

// Weekly Context Architecture Types
export type WeeklyOTF = 'OTF Up' | 'OTF Down' | 'Balance' | 'Inside Week' | 'None';
// Updated WeekOpenType to support Open Drive Up/Down as per V5.0 Algo
export type WeekOpenType = 'Gap Up' | 'Gap Down' | 'Open Drive Up' | 'Open Drive Down' | 'Open Outside Value' | 'Open Inside Value' | 'None';
export type WeeklyStructureAnomaly = 'Poor High' | 'Poor Low' | 'Unfinished Business' | 'None';
export type WeeklyPOCDivergence = 'Convergent' | 'Divergent (Bearish)' | 'Divergent (Bullish)' | 'None';

// V5.0 Algo Specific Types
export type ValueRelationship = 'Higher' | 'Lower' | 'Unchanged' | 'None';
export type StructureQuality = 'Poor' | 'Secure' | 'None';
export type VolumeTrend = 'Increasing' | 'Decreasing' | 'Average' | 'None';

export interface WeeklyPrepData {
  id: string; 
  weeklyBias: BiasType;
  priceVsPWeek: string;
  pwClosePosition?: string;
  pwHigh: string; pwLow: string; pwPOC: string; pwVAH: string; pwVAL: string;
  weeklyMacroNotes: string; weeklyThemes: string[]; weeklyGoals: string; weeklyNarrative: string;
  weeklyScreenshots: TradeScreenshot[]; tradingDays: string[]; 
  dayNews?: Record<string, WeeklyNewsEvent[]>;
  
  // Matrix Context Fields (Legacy + V5.0)
  weeklyOTF?: WeeklyOTF;
  weekOpenType?: WeekOpenType;
  weeklyStructureAnomaly?: WeeklyStructureAnomaly; // Legacy (kept for safety)
  weeklyPocDivergence?: WeeklyPOCDivergence;
  
  // New V5.0 AMT Fields
  valueRelationship?: ValueRelationship;
  structureHigh?: StructureQuality;
  structureLow?: StructureQuality;
  volumeTrend?: VolumeTrend;

  matrixScore?: number;
  matrixRegime?: string;
  matrixTags?: string[]; // New: Stores "Poor Structure", "Conflict" tags

  createdAt: string;
}

export interface BacktestSession {
  id: string; name: string; accountId?: string; symbol: string; playbookName: string; 
  startBalance: number; currentBalance: number; pnl: number; 
  timeSpentMinutes: number; winRate: number; tradeCount: number; 
  wins: number; losses: number; bes: number;
  status: 'Active' | 'Completed'; createdAt: string;
  description?: string; assetType?: 'Forex' | 'Stocks' | 'Crypto' | 'Futures';
  startDate?: string; endDate?: string;
  simulatedDailyPreps?: Record<string, DailyPrepData>;
  simulatedWeeklyPreps?: Record<string, WeeklyPrepData>;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export interface Notification {
  id: string; type: NotificationType; message: string; timestamp: number; duration?: number;
}
