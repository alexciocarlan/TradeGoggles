
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Trade, Account, Playbook, DailyPrepData, WeeklyPrepData, Order, BacktestSession, PlaybookTrap } from './types';
import { Language } from './translations';

const DATA_VERSION = "4.5"; 
const DEFAULT_USER_ID = 'user-default';

const getTraps = (t1: string, t2: string, t3: string): PlaybookTrap[] => [
  { label: 'Trap 1: False Conviction', name: t1.split(':')[0], description: t1.includes(':') ? t1.split(':')[1].trim() : t1 },
  { label: 'Trap 2: The Absorption', name: t2.split(':')[0], description: t2.includes(':') ? t2.split(':')[1].trim() : t2 },
  { label: 'Trap 3: The Context Shift', name: t3.split(':')[0], description: t3.includes(':') ? t3.split(':')[1].trim() : t3 }
];

const INITIAL_PLAYBOOKS: Playbook[] = [
  // --- TIER 1: OPENING LOGIC (1-5) ---
  { 
    id: 'pb-1', name: '1. The Open Drive', 
    description: 'Extreme Imbalance. OTF (Institutional) decided direction pre-open. They are executing "At Market".', 
    icon: '⚡', color: '#f97316', 
    entryCriteria: [{id:'1', text:'Aggressive Open'}, {id:'2', text:'Immediate Range extension'}, {id:'3', text:'No tails in opposite direction'}], 
    entryAt: 'Minimum Pullback', target: 'HTF targets', invalidation: 'Back in Opening Range', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t1', text:'#STRONGDRIVE', color:'#f97316'}],
    traps: getTraps(
      "Low Vol Drive: Price moves fast but volume is below average; it will return to the open within 15 min.",
      "The Passive Wall: Price hits a massive 'iceberg' order and stalls instantly.",
      "Macro News Flush: The drive is an emotional reaction to news that is immediately digested."
    )
  },
  { 
    id: 'pb-2', name: '2. The Open Test Drive', 
    description: 'Validation. The market checked for business at the key level. Found none, giving the "Green Light".', 
    icon: '🎯', color: '#f97316', 
    entryCriteria: [{id:'1', text:'Test a key level at Open'}, {id:'2', text:'Quick Rejection'}, {id:'3', text:'Aggressive move in opposite direction'}], 
    entryAt: 'Break of Open in direction of drive', target: 'IB ext 1.5x - 2', invalidation: 'Price gets acceptance beyond level tested', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t2', text:'#STRONGDRIVE', color:'#f97316'}, {id:'t2b', text:'#TESTFIRST', color:'#3b82f6'}],
    traps: getTraps(
      "The Deep Test: The test penetrates too deep into yesterday's Value Area, becoming 'acceptance' rather than rejection.",
      "Hanging at Level: Price stays at the tested level instead of rejecting quickly. If it stays, it will break.",
      "Pre-Market Trap: The test was already completed in Globex; the RTH move is already exhausted."
    )
  },
  { 
    id: 'pb-3', name: '3. Open Rejection Reverse', 
    description: 'Rejection. Market tried to find new value but failed. Must return to established value.', 
    icon: '↩️', color: '#f43f5e', 
    entryCriteria: [{id:'1', text:'Open with GAP up/down'}, {id:'2', text:'Failed attempt to continue'}, {id:'3', text:'Re-entry into pDay Range'}], 
    entryAt: 'When price re-enters pDay VA', target: 'Previous POC or opposite VA limit', invalidation: 'Price breaks out of VA and consolidates', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t3', text:'#REJECTION', color:'#f43f5e'}, {id:'t3b', text:'#FAILED_PUSH', color:'#f43f5e'}],
    traps: getTraps(
      "Failed VA Entry: Price re-enters yesterday's VA but gets stuck at the first HVN or POC.",
      "The Squeeze: The reversal is just a 'weak hand' liquidation before the original trend resumes.",
      "Value Migration: Today's value is already forming outside yesterday's range, making the reversal irrelevant."
    )
  },
  { 
    id: 'pb-4', name: '4. The 80% Rule', 
    description: 'Acceptance. Statistically, once value is re-accepted, price tends to traverse entire area.', 
    icon: '📊', color: '#10b981', 
    entryCriteria: [{id:'1', text:'Opens outside pdVA'}, {id:'2', text:'Acceptance in pdVA'}, {id:'3', text:'Trades within pdVA for 2 TPOs'}], 
    entryAt: 'Close of second 30-min TPO inside VA', target: 'Opposite VA High/Low', invalidation: 'Price leaves VA from entry side', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t4', text:'#OUTSIDEVA', color:'#10b981'}, {id:'t4b', text:'#REJECTION', color:'#f43f5e'}],
    traps: getTraps(
      "The Middle Grind: Price enters the VA but remains stuck at the POC for 2 hours, losing all momentum.",
      "TPO Fake-out: You see 2 TPOs in the VA, but with long wicks indicating rejection, not acceptance.",
      "Narrow VA: Yesterday's Value Area is too small (e.g., <10 ES pts) to provide a statistical edge."
    )
  },
  { 
    id: 'pb-5', name: '5. Failed Auction', 
    description: 'Trap. Lack of buyers at highs (or sellers at lows). Sharp liquidation follows.', 
    icon: '🪤', color: '#f43f5e', 
    entryCriteria: [{id:'1', text:'Break above pdHigh/Low'}, {id:'2', text:'Immediate reversal back into range'}, {id:'3', text:'Formation of Buying/Selling Tail'}], 
    entryAt: 'At re-entry in dRange', target: 'Opposite edge of balance/range', invalidation: 'Price returns and trades through tail', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t5', text:'#FAILED_BREAK', color:'#f43f5e'}],
    traps: getTraps(
      "Slow Liquidation: Price doesn't reject aggressively; it drifts down slowly, allowing buyers to absorb the selling.",
      "Double Top/Bottom: What looks like a failure is actually a 'mechanical' level being built for a later breakout.",
      "Late Day Failure: The failure occurs in the final hour when volume is too chaotic for high-probability setups."
    )
  },

  // --- TIER 2: MARKET REGIMES (6-11) ---
  { 
    id: 'pb-6', name: '6. Trend Day (Pure)', 
    description: 'Total Control. Market searching for fair price but hasn\'t found it yet.', 
    icon: '📈', color: '#10b981', 
    entryCriteria: [{id:'1', text:'One Time Framing'}, {id:'2', text:'Value Area migrating constantly'}, {id:'3', text:'Price never returns to Open'}], 
    entryAt: 'First Pullback', target: 'Trailing Stop', invalidation: 'Loss of One Time Framing', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t6', text:'#MOMENTUM', color:'#10b981'}],
    traps: getTraps(
      "One-Side Bias: The market breaks the Initial Balance (IB) on one side and holds, ignoring the extension on the other.",
      "Stop Run: The range extension is just a 1-2 tick stop run followed by an immediate return to the range.",
      "Trend Day Disguise: The day looks neutral but is actually the quiet start of a massive Trend Day."
    )
  },
  { 
    id: 'pb-7', name: '7. Double Distribution', 
    description: 'Shift. Initial balance is broken, new value is established elsewhere.', 
    icon: '⏳', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Large range extension'}, {id:'2', text:'Single prints created'}, {id:'3', text:'Acceptance above/below IB'}], 
    entryAt: 'Test of single prints', target: 'Next target or 2x IB', invalidation: 'Price re-enters the first distribution', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t7', text:'#SINGLEPRINTS', color:'#8b5cf6'}],
    traps: getTraps(
      "The Gap Fill: Price returns to the first distribution and fills the single prints, nullifying the setup.",
      "Thin Air: The second distribution forms on tiny volume; it's a trap for late buyers.",
      "POC Shift: The daily POC migrates back into the first distribution, indicating the trend has failed."
    )
  },
  { 
    id: 'pb-8', name: '8. Normal Day (Wide IB)', 
    description: 'Strong Initial Balance. OTF entered early and finished their business.', 
    icon: '🌊', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'Very wide Initial Balance'}, {id:'2', text:'Rotational trade within IB'}, {id:'3', text:'No range extension'}], 
    entryAt: 'IB Edges (Fade)', target: 'IB Midpoint / VWAP', invalidation: 'Range Extension breakout', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t8', text:'#INBALANCE', color:'#3b82f6'}],
    traps: getTraps(
      "The Late Drive: The IB extension happens too late (after 3:00 PM), leaving no time for the move to develop.",
      "The Washout: The IB extension is instantly canceled by a massive institutional order in the opposite direction.",
      "Multi-Day Balance: The extension hits a major level on the Daily chart and reverses."
    )
  },
  { 
    id: 'pb-9', name: '9. Short Liquidation', 
    description: 'Short squeeze. Sellers are trapped at lows and forced to cover aggressively.', 
    icon: '🌪️', color: '#0ea5e9', 
    entryCriteria: [{id:'1', text:'Overextended move down'}, {id:'2', text:'Low volume low'}, {id:'3', text:'Delta divergence'}], 
    entryAt: 'Break of IB High after failed push', target: 'pdPOC', invalidation: 'New Low', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t9', text:'#MOMENTUM', color:'#0ea5e9'}],
    traps: getTraps(
      "The Trap Door: The selling stops abruptly and price makes a new high, trapping the sellers.",
      "Low Delta Bounce: Price drops, but Delta is strongly positive (hidden aggressive buying).",
      "The News Flush: Liquidation is caused by fake news; the market reverts instantly."
    )
  },
  { 
    id: 'pb-10', name: '10. Long Liquidation', 
    description: 'Panic Selling. Buyers liquidate positions causing a vertical drop with no pullbacks.', 
    icon: '⚔️', color: '#f43f5e', 
    entryCriteria: [{id:'1', text:'Exhaustion after long rally'}, {id:'2', text:'Massive volume at top'}, {id:'3', text:'One time framing down'}], 
    entryAt: 'Break of VAL', target: 'HTF support', invalidation: 'V-reversal', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t10', text:'#MOMENTUM', color:'#f43f5e'}],
    traps: getTraps(
      "The Bottomless Pit: Looks like liquidation but is actually 'Old Sellers' entering.",
      "Absorption at VAL: Buyers try to stop the fall but are steamrolled by institutional volume.",
      "Context Cycle: The market is at the start of a 3-day downward cycle; no bounce coming."
    )
  },
  { 
    id: 'pb-11', name: '11. The Spike', 
    description: 'Late discovery. A vertical move in the final periods of the day that establishes a new level.', 
    icon: '⚡', color: '#eab308', 
    entryCriteria: [{id:'1', text:'Price moves >1 ATR in period M'}, {id:'2', text:'No rejection at bell'}, {id:'3', text:'Gaps beyond spike tomorrow'}], 
    entryAt: 'Base of spike on retest', target: 'Next HVN', invalidation: 'Price trades through spike base', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t11', text:'#LATEDAY', color:'#eab308'}],
    traps: getTraps(
      "Hollow Spike: Formed in the last 2 minutes on no volume; will be zippered tomorrow.",
      "Open Beyond Spike: Tomorrow's open gaps over the spike, creating a new magnet.",
      "The Reversal Spike: Spike is just a climax at the end of a move, not a structural shift."
    )
  },

  // --- TIER 3: GAP & INVENTORY (12-14) ---
  { 
    id: 'pb-12', name: '12. Gap & Go', 
    description: 'Momentum. Overnight sentiment shift. Escape Velocity.', 
    icon: '🏃', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'Open outside pdRange'}, {id:'2', text:'Sharp rejection of GAP boundary'}, {id:'3', text:'Breakout in direction of GAP'}], 
    entryAt: 'OR Breakout', target: '150% IB Ext', invalidation: 'Gap acceptance', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t12', text:'#GAP', color:'#3b82f6'}, {id:'t12b', text:'#LARGEGAP', color:'#3b82f6'}],
    traps: getTraps(
      "Exhaustion Gap: Gap is too large (>3 ATR); market has no fuel left to continue.",
      "Immediate Rejection: Price touches gap boundary and bounces back like a wall.",
      "The News Reversal: Gap was priced in and big players use the open to sell."
    )
  },
  { 
    id: 'pb-13', name: '13. Gap Fill', 
    description: 'Unfair Price. Market deems new price unfair and returns to value.', 
    icon: '🔋', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'Exhaustion at dOpen'}, {id:'2', text:'Re-entry into pdRange'}, {id:'3', text:'Acceptance in OR'}], 
    entryAt: 'Loss of Open Price', target: 'pdClose', invalidation: 'New high of day', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t13', text:'#GAP', color:'#3b82f6'}, {id:'t13b', text:'#EXHAUSTION', color:'#3b82f6'}],
    traps: getTraps(
      "The Halfway Stall: Price fills 50% of the gap and turns violently.",
      "Acceptance Outside: Price spends 30+ min outside gap; prob. of fill drops to 20%.",
      "Momentum Shift: A macro data release at 10:00 AM cancels the fill logic entirely."
    )
  },
  { 
    id: 'pb-14', name: '14. ON Inventory Fade', 
    description: 'Correction. Overnight longs/shorts forced to liquidate at Open.', 
    icon: '🛠️', color: '#f97316', 
    entryCriteria: [{id:'1', text:'ON Inventory 100% Long/Short'}, {id:'2', text:'Failed to break ON H/L'}, {id:'3', text:'Strong move to Settlement'}], 
    entryAt: 'Failed ON breakout', target: 'Settlement / pdPOC', invalidation: 'ON Extreme breach', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t14', text:'#INSIDERANGE', color:'#f97316'}],
    traps: getTraps(
      "Sentiment Carry: Inventory 100% short but news at 8:30 forces trend continuation.",
      "Half-Back Support: Price fades toward yesterday but is stopped at 50% ON range.",
      "Breakout of ONH/L: Fade fails and market breaks ON extreme (strong trend signal)."
    )
  },

  // --- TIER 4: IB & PERIOD DYNAMICS (15-23) ---
  { 
    id: 'pb-15', name: '15. D-Period Expansion', 
    description: 'Institutional Entry. The "smart money" often waits for the IB to form before committing.', 
    icon: '🏗️', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Narrow IB'}, {id:'2', text:'Period C fails breakout'}, {id:'3', text:'Aggressive breakout in D period'}], 
    entryAt: 'D Period Breakout', target: '1.5-2x IB Ext', invalidation: 'Re-entry into IB', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t15', text:'#NARROWIB', color:'#8b5cf6'}],
    traps: getTraps(
      "The Bracket Trap: Period D breaks IB but immediately closes back inside.",
      "Low Vol Expansion: The D-period move has no volume; it is just a 'stop run'.",
      "The Midday Lull: Expansion occurs but market enters chop until PM session."
    )
  },
  { 
    id: 'pb-16', name: '16. VWAP Reversion', 
    description: 'Mean Reversion. Price deviating too far from the volume weighted average.', 
    icon: '📐', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'Extreme deviation from VWAP'}, {id:'2', text:'Tape slowing down'}, {id:'3', text:'Reversal pattern on delta'}], 
    entryAt: 'V-bottom/top pattern', target: 'VWAP', invalidation: 'New Extreme', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t16', text:'#REVERSION', color:'#3b82f6'}],
    traps: getTraps(
      "The Runway Trend: Market is so strong it doesn't touch VWAP all day.",
      "VWAP Front-run: Price approaches VWAP but bounces before hitting it.",
      "Sloping VWAP: VWAP moves aggressively with price, erasing profit potential."
    )
  },
  { 
    id: 'pb-17', name: '17. The Ledge Break', 
    description: 'Breakout. A ledge is a series of identical TPOs at a specific level.', 
    icon: '🪜', color: '#f97316', 
    entryCriteria: [{id:'1', text:'Ledge of 4+ TPOs'}, {id:'2', text:'Momentum buildup'}, {id:'3', text:'Break with volume'}], 
    entryAt: 'Break of ledge', target: 'Next volume node', invalidation: 'Re-entry under ledge', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t17', text:'#STRUCTURE', color:'#f97316'}],
    traps: getTraps(
      "The False Ledge: Formed by only 2-3 TPOs; too weak for major move.",
      "Iceberg Support: Massive passive buyer sits right under ledge absorbing break.",
      "The Late Break: Ledge breaks at 3:45 PM; too late to manage risk properly."
    )
  },
  { 
    id: 'pb-18', name: '18. Single Print Test', 
    description: 'High probability test. Price returns to check if buyers/sellers are still at the gap.', 
    icon: '🩹', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Previous SP zone exists'}, {id:'2', text:'Test of SP upper/lower bound'}, {id:'3', text:'Immediate rejection'}], 
    entryAt: 'Reject of bound', target: 'Opposite distribution', invalidation: 'Acceptance in SP zone', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t18', text:'#SINGLEPRINTS', color:'#8b5cf6'}],
    traps: getTraps(
      "The Full Fill: Price ignores SP and slices through them, filling the area.",
      "Fast Flush: Test is so fast it offers no entry time, followed by reversal.",
      "Old Single Prints: Testing levels from 10 days ago that lost market relevance."
    )
  },
  { 
    id: 'pb-19', name: '19. Poor High/Low', 
    description: 'Unfinished business. Auctions that end with no tail must be repaired.', 
    icon: '🏗️', color: '#ec4899', 
    entryCriteria: [{id:'1', text:'Poor High/Low exists'}, {id:'2', text:'Trend alignment'}, {id:'3', text:'Price trading through level'}], 
    entryAt: 'Buy/Sell through level', target: 'New tail formation', invalidation: 'Rejection before level', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t19', text:'#POORSTRUCTURE', color:'#ec4899'}],
    traps: getTraps(
      "Unfinished Business: Price makes a Poor High, drops, but returns immediately.",
      "The Mechanical High: Multiple algos have same level; break will be violent.",
      "Trend Day High: On strong trend day, Poor Highs can remain for hours."
    )
  },
  { 
    id: 'pb-20', name: '20. Buying/Selling Tail', 
    description: 'Strong Rejection. Aggressive participants defending an extreme.', 
    icon: '🏹', color: '#10b981', 
    entryCriteria: [{id:'1', text:'Tail of 2+ TPOs'}, {id:'2', text:'Occurs at extreme of day'}, {id:'3', text:'Immediate response away'}], 
    entryAt: 'Trade in tail direction', target: 'VWAP', invalidation: 'Extreme breach', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t20', text:'#SUPPORT/RES', color:'#10b981'}],
    traps: getTraps(
      "The Short Tail: Tail less than 2-3 TPOs; weak rejection that will be re-tested.",
      "Tail Replacement: Buying tail followed immediately by selling tail (Indecision).",
      "End of Day Tail: Formed at MOC; purely mechanical, not strategic."
    )
  },
  { 
    id: 'pb-21', name: '21. Trend Defense', 
    description: 'Continuation. Participants defending the midpoint of a distribution.', 
    icon: '🛡️', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'Strong trend active'}, {id:'2', text:'Pullback to 50% of dist'}, {id:'3', text:'Support on order flow'}], 
    entryAt: 'Rejection of midpoint', target: 'New session high', invalidation: 'Close under midpoint', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t21', text:'#MOMENTUM', color:'#3b82f6'}],
    traps: getTraps(
      "Failed Midpoint: Price crosses 50% of distribution; trend officially dead.",
      "Delta Divergence: Price defends level but Delta is extremely negative.",
      "Losing Initiative: OTF has left; only locals are trading."
    )
  },
  { 
    id: 'pb-22', name: '22. 45-Degree Line', 
    description: 'Momentum slope. Maintaining a sharp directional angle.', 
    icon: '📐', color: '#10b981', 
    entryCriteria: [{id:'1', text:'Trend slope at 45 deg'}, {id:'2', text:'Consistent one-time-framing'}, {id:'3', text:'No overlapping VA'}], 
    entryAt: 'Retest of slope', target: 'Extension targets', invalidation: 'Slope break', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t22', text:'#MOMENTUM', color:'#10b981'}],
    traps: getTraps(
      "The Steep Angle: Angle is too steep; 'repair' will be crash, not reversion.",
      "The Bounce Trap: Price touches line, looks like it's holding, then falls.",
      "Algorithmic Shift: Algos turn off due to tech news event (NQ)."
    )
  },
  { 
    id: 'pb-23', name: '23. Comp. HVN Rejection', 
    description: 'Acceptance vs Rejection. Testing high volume areas from previous days.', 
    icon: '🧲', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Approach Composite HVN'}, {id:'2', text:'Strong volume reject'}, {id:'3', text:'Tape acceleration away'}], 
    entryAt: 'HVN Rejection', target: 'Next LVN', invalidation: 'Price stays at HVN', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t23', text:'#HVN', color:'#8b5cf6'}],
    traps: getTraps(
      "The HVN Magnet: Price doesn't reject; stays glued to HVN (acceptance).",
      "Volume Surge: Break of HVN happens on triple volume (Paradigm Shift).",
      "The Rotation Trap: Rejection is just a small rotation before digging through."
    )
  },

  // --- TIER 5: DAILY SCALPS (24-31) ---
  { 
    id: 'pb-24', name: '24. Halfback Play', 
    description: 'Pullback. Buying/selling the 50% retracement of the initial balance.', 
    icon: '⚖️', color: '#f97316', 
    entryCriteria: [{id:'1', text:'Defined IB range'}, {id:'2', text:'Pullback to 50% IB'}, {id:'3', text:'Rejection wick'}], 
    entryAt: 'At 50% IB level', target: 'IB Extreme', invalidation: 'Full IB retracement', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t24', text:'#SCALP', color:'#f97316'}],
    traps: getTraps(
      "The Slicer: Price slices through 50% level without any hesitation.",
      "Churning at 50%: Price oscillates around level, grinding down stops.",
      "The Deep Correction: Market hunting for VAL or VWAP, ignoring 50% level."
    )
  },
  { 
    id: 'pb-25', name: '25. ON Stat Play', 
    description: 'Probabilities. Testing overnight highs or lows based on statistical likelihood.', 
    icon: '📈', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'Statistic favors ONH/L hit'}, {id:'2', text:'Approaching extreme'}, {id:'3', text:'Momentum build'}], 
    entryAt: 'Test of ON extreme', target: 'pdPOC', invalidation: 'Trend extension', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t25', text:'#SCALP', color:'#3b82f6'}],
    traps: getTraps(
      "Unreached Extreme: Market stays inside ON range all day (rare).",
      "The 1-Tick Fail: Price hits ONH with exactly 1 tick and reverses.",
      "Late Expansion: Statistical level reached only in final seconds of session."
    )
  },
  { 
    id: 'pb-26', name: '26. Inside Value Fade', 
    description: 'Mean Reversion. Fading the value area limits in a balanced market.', 
    icon: '🔄', color: '#94a3b8', 
    entryCriteria: [{id:'1', text:'Price inside pdVA'}, {id:'2', text:'Low volatility'}, {id:'3', text:'Reject VAH/VAL'}], 
    entryAt: 'Reject extreme', target: 'pdPOC', invalidation: 'VA breakout', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t26', text:'#SCALP', color:'#94a3b8'}],
    traps: getTraps(
      "The Breakout Drive: An open in the VA that turns into an unexpected trend.",
      "POC Magnetism: Price hits the POC and stays there, refusing to move.",
      "Expanding Value: Today's VA is widening rapidly, making edges irrelevant."
    )
  },
  { 
    id: 'pb-27', name: '27. IB Ext. Failure', 
    description: 'Fakeout Scalp. Betting against the sustainability of a small IB break.', 
    icon: '🤥', color: '#f43f5e', 
    entryCriteria: [{id:'1', text:'IB break < 5 pts (ES)'}, {id:'2', text:'Rejected immediately'}, {id:'3', text:'Re-entry in IB'}], 
    entryAt: 'At re-entry', target: 'Midpoint', invalidation: 'New extreme', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t27', text:'#SCALP', color:'#f43f5e'}],
    traps: getTraps(
      "The Real Breakout: What looks like failure is just a 'flag' before extension.",
      "The Retest: Price fails, returns to IB, but then re-tests and breaks definitively.",
      "Context Drift: Market in macro trend; any failure is just a buying opportunity."
    )
  },
  { 
    id: 'pb-28', name: '28. Round Number', 
    description: 'Psychological levels. Fading or joining at figures like 18000.', 
    icon: '⭕', color: '#64748b', 
    entryCriteria: [{id:'1', text:'Price at round number'}, {id:'2', text:'Order flow exhaustion'}, {id:'3', text:'Short term reversal'}], 
    entryAt: 'Deviation from round number', target: '20 pts target', invalidation: 'Acceptance above/below', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t28', text:'#SCALP', color:'#64748b'}],
    traps: getTraps(
      "The Front-Run: Market turns 2 points before level like 5000 or 6000.",
      "The Overshoot: Price pierces round number by 10 points before rejecting.",
      "The Magnet: Price gets stuck at round number (fair value) and offers no scalp."
    )
  },
  { 
    id: 'pb-29', name: '29. Afternoon Drift', 
    description: 'Low volume move. Slow drift towards a magnetic level late in the day.', 
    icon: '⛵', color: '#0ea5e9', 
    entryCriteria: [{id:'1', text:'13:30-14:30 period'}, {id:'2', text:'Slow OTF'}, {id:'3', text:'Target HVN/POC'}], 
    entryAt: 'Drift entry', target: 'Target node', invalidation: 'Volatile reversal', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t29', text:'#SCALP', color:'#0ea5e9'}],
    traps: getTraps(
      "The Second Wind: Instead of drifting, institutions enter at 1:00 PM.",
      "V-Reversal: Drift turns into violent 100% recovery of morning move.",
      "Low Liquidity Squeeze: Low volume makes price jump erratically."
    )
  },
  { 
    id: 'pb-30', name: '30. HVN Edge Bounce', 
    description: 'High volume support. Price bouncing off the edges of a previous balance area.', 
    icon: '🎾', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Approach HVN edge'}, {id:'2', text:'Low volume test'}, {id:'3', text:'Immediate bounce'}], 
    entryAt: 'Bounce at edge', target: 'Center of HVN', invalidation: 'Entering HVN deeply', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t30', text:'#SCALP', color:'#8b5cf6'}],
    traps: getTraps(
      "The Node Expansion: HVN is getting wider; edge is now the middle.",
      "Absorption Flush: Price sits at edge then suddenly collapses into next LVN.",
      "The News Spike: News event breaks node equilibrium in milliseconds."
    )
  },
  { 
    id: 'pb-31', name: '31. Volume Vacuum', 
    description: 'Gap through low volume. Price "falling" through areas with no business.', 
    icon: '🕳️', color: '#f43f5e', 
    entryCriteria: [{id:'1', text:'Enter LVN zone'}, {id:'2', text:'High speed tape'}, {id:'3', text:'Target next HVN'}], 
    entryAt: 'Break into LVN', target: 'HVN target', invalidation: 'Stalling in vacuum', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t31', text:'#SCALP', color:'#f43f5e'}],
    traps: getTraps(
      "The Re-Fill: Vacuum isn't crossed fast; price starts building value inside.",
      "The Wall at End: Massive order wall at end of vacuum sends price back.",
      "The Trap Door: Enter vacuum and market stops halfway, trapping you."
    )
  },

  // --- TIER 7: WEEKLY SETUPS (32-39) ---
  { 
    id: 'pb-32', name: '32. Half-Gap Fill', 
    description: 'The 50% Gap Rule. Common in large gaps where full fill is unlikely.', 
    icon: '🌓', color: '#f97316', 
    entryCriteria: [{id:'1', text:'Large gap (>2x ATR)'}, {id:'2', text:'Failed to fill 100%'}, {id:'3', text:'Bounce at 50% mark'}], 
    entryAt: '50% rejection', target: 'Open price', invalidation: 'Acceptance below 50%', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t32', text:'#WEEKLY', color:'#f97316'}],
    traps: getTraps(
      "The Full Fill Drive: Price doesn't even see 50% level and closes gap.",
      "Stalling and Failing: Price lingers at 50% too long then continues gap dir.",
      "The News Gap: Gap is fundamental (war/rates); it won't even fill 10%."
    )
  },
  { 
    id: 'pb-33', name: '33. Zipper Repair', 
    description: 'Filling anomalies. Market returning to "repair" messy profiles from previous weeks.', 
    icon: '🤐', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Zipper anomaly exists'}, {id:'2', text:'Open nearby'}, {id:'3', text:'One time framing through'}], 
    entryAt: 'Repair initiation', target: 'Anomaly end', invalidation: 'Rejection of anomaly', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t33', text:'#WEEKLY', color:'#8b5cf6'}],
    traps: getTraps(
      "The Unfinished Zipper: Market repairs only half the teeth and leaves.",
      "The Gap-Over: Market opens completely above zipper area, ignoring it.",
      "High Vol Breakdown: Zipper destroyed by panic move rather than smoothed."
    )
  },
  { 
    id: 'pb-34', name: '34. Neutral Day Fade', 
    description: 'The "Both Sides" Trap. Reversing the second range extension of the week.', 
    icon: '🌬️', color: '#ec4899', 
    entryCriteria: [{id:'1', text:'Extremely wide range'}, {id:'2', text:'Test of wHigh/Low'}, {id:'3', text:'Exhaustion on H4'}], 
    entryAt: 'Extreme Fade', target: 'wPOC', invalidation: 'Trend day confirmation', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t34', text:'#WEEKLY', color:'#ec4899'}],
    traps: getTraps(
      "Neutral Extreme: Market closes at High or Low (major trend signal).",
      "Double Extension: Second extension much larger than first (Imbalance).",
      "The News Pivot: Late-day news event destroys neutral nature of day."
    )
  },
  { 
    id: 'pb-35', name: '35. LVN Rejection', 
    description: 'Weekly Barriers. Low volume nodes from the weekly composite.', 
    icon: '🧱', color: '#f43f5e', 
    entryCriteria: [{id:'1', text:'Approach Weekly LVN'}, {id:'2', text:'No business at level'}, {id:'3', text:'Sharp rejection'}], 
    entryAt: 'LVN Rejection', target: 'Weekly HVN', invalidation: 'Entry into HVN', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t35', text:'#WEEKLY', color:'#f43f5e'}],
    traps: getTraps(
      "The Acceptance: Price enters LVN on high volume; LVN becomes new POC.",
      "The Fast Pass: Price moves through LVN so fast you can't even click.",
      "Contextual Void: LVN is too old (>10 days) and no longer acts as reference."
    )
  },
  { 
    id: 'pb-36', name: '36. Tail Defense', 
    description: 'Weekly Extremes. Defending the buying/selling tails of the weekly profile.', 
    icon: '🏹', color: '#10b981', 
    entryCriteria: [{id:'1', text:'Return to wTail'}, {id:'2', text:'Absorption on retest'}, {id:'3', text:'Bias alignment'}], 
    entryAt: 'Tail Defense', target: 'Mid-week range', invalidation: 'Tail breach', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t36', text:'#WEEKLY', color:'#10b981'}],
    traps: getTraps(
      "The Tail Migration: Smart money moves defense higher/lower, leaving old tail.",
      "The Wick Fill: Price fills entire tail before finally showing rejection.",
      "The Climax Tail: Tail was end of trend; testing leads to collapse."
    )
  },
  { 
    id: 'pb-37', name: '37. 3-Day Balance Break', 
    description: 'Explosive expansion. ESCaping a multi-day bracketing phase.', 
    icon: '🔓', color: '#3b82f6', 
    entryCriteria: [{id:'1', text:'3 days of overlapping VA'}, {id:'2', text:'Open outside balance'}, {id:'3', text:'Period A/B drive'}], 
    entryAt: 'Balance Breakout', target: 'Range projection', invalidation: 'Re-entry in 3-day range', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t37', text:'#WEEKLY', color:'#3b82f6'}],
    traps: getTraps(
      "Look Above and Fail: Price breaks 3-day range but returns inside.",
      "Low Vol Breakout: Breakout has no OTF participation; will fail in hour.",
      "The Fake Retest: Price returns for retest but continues deep into balance."
    )
  },
  { 
    id: 'pb-38', name: '38. Weekly POC Mag.', 
    description: 'Gravity. Reverting to the most transacted price of the week.', 
    icon: '🧲', color: '#8b5cf6', 
    entryCriteria: [{id:'1', text:'Thursday or Friday'}, {id:'2', text:'Market in balance'}, {id:'3', text:'Price deviation from wPOC'}], 
    entryAt: 'Reversion entry', target: 'Weekly POC', invalidation: 'Breakout from week range', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t38', text:'#WEEKLY', color:'#8b5cf6'}],
    traps: getTraps(
      "The Repelling POC: Price gets within 5 points and rejects violently.",
      "The POC Shift: Weekly POC moves due to today's high volume.",
      "The Friday Trend: Market trending and ignores high-volume magnet."
    )
  },
  { 
    id: 'pb-39', name: '39. Trend Day +1', 
    description: 'Follow-through. Joining the second day of institutional repositioning.', 
    icon: '🛤️', color: '#10b981', 
    entryCriteria: [{id:'1', text:'Prev day Trend Day'}, {id:'2', text:'OR holding high/low'}, {id:'3', text:'Targeting HTF levels'}], 
    entryAt: 'Period B breakout', target: 'ATR target', invalidation: 'Loss of Period A low/high', 
    isPrivate: true, createdAt: new Date().toISOString(), exitCriteria: [], marketConditions: [], tags: [{id:'t39', text:'#WEEKLY', color:'#10b981'}],
    traps: getTraps(
      "Trend Continuation: Expect consolidation but market does second Trend Day.",
      "The Deep Retrace: Market retraces 100% of yesterday before support.",
      "The Inside Day Trap: Range so small commissions eat profit while wait."
    )
  }
];

const INITIAL_ACCOUNTS: Account[] = [
  { 
    id: `acc-1-${DEFAULT_USER_ID}`, 
    name: 'APEX-224851-46', 
    type: 'Apex', 
    initialBalance: 50000, 
    targetProfit: 53000, 
    maxDrawdown: 2500, 
    drawdownType: 'Trailing',
    currency: 'USD', 
    isPA: true,
    isRithmicConnected: false,
    createdAt: new Date().toISOString(),
    riskSettings: { maxTotalRisk: 2500, maxDailyRisk: 500, maxTradesPerDay: 5, maxContractsPerTrade: 2, dailyProfitTarget: 1000, preferredInstrument: 'MNQ' }
  },
];

interface AppContextType {
  trades: Trade[];
  activeTrades: Trade[]; 
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
  updateBacktestTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;
  deleteBacktestTrade: (id: string) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  savePlaybook: (pb: Playbook) => void;
  deletePlaybook: (id: string) => void;
  saveDailyPrep: (date: string, prep: DailyPrepData) => void;
  saveWeeklyPrep: (weekId: string, prep: WeeklyPrepData) => void;
  saveBacktestDailyPrep: (sessionId: string, date: string, prep: Partial<DailyPrepData>) => void;
  saveBacktestWeeklyPrep: (sessionId: string, weekId: string, prep: WeeklyPrepData) => void;
  saveDailyNote: (date: string, note: string) => void;
  setLanguage: (lang: Language) => void;
  setSelectedAccountId: (id: string) => void;
  setIsDarkMode: (dark: boolean) => void;
  setRiskManagerEnabled: (enabled: boolean) => void;
  setActiveOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  restoreDefaultPlaybooks: () => void;
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

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    const selectedAcc = accounts.find(a => a.id === selectedAccountId);

    if (selectedAcc?.type === 'Backtest') {
      return backtestTrades.filter(t => t.accountId === selectedAccountId);
    }

    if (!selectedAcc) return trades.filter(t => t.accountId === selectedAccountId);

    return trades.filter(t => 
      t.accountId === selectedAccountId || 
      t.accountId === selectedAcc.name ||
      (t.accountId && selectedAcc.name.includes(t.accountId)) ||
      (selectedAcc.id && selectedAcc.id.includes(t.accountId))
    );
  }, [trades, backtestTrades, selectedAccountId, accounts]);

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
      
      if (sPlaybooks && sVersion === DATA_VERSION) {
          setPlaybooks(JSON.parse(sPlaybooks));
      } else {
          const stored = sPlaybooks ? JSON.parse(sPlaybooks) : [];
          const systemIds = new Set(INITIAL_PLAYBOOKS.map(p => p.id));
          const userCustomPlaybooks = stored.filter((p: Playbook) => !systemIds.has(p.id));
          setPlaybooks([...INITIAL_PLAYBOOKS, ...userCustomPlaybooks]);
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
  const updateBacktestTrade = (t: Trade) => setBacktestTrades(prev => prev.map(item => item.id === t.id ? t : item));
  const deleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id));
  const deleteBacktestTrade = (id: string) => setBacktestTrades(prev => prev.filter(t => t.id !== id));
  
  const updateAccount = (acc: Account) => setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
  const deleteAccount = (id: string) => { setAccounts(prev => prev.filter(a => a.id !== id)); setTrades(prev => prev.filter(t => t.accountId !== id)); };
  const savePlaybook = (pb: Playbook) => setPlaybooks(prev => prev.find(p => p.id === pb.id) ? prev.map(p => p.id === pb.id ? pb : p) : [...prev, pb]);
  const deletePlaybook = (id: string) => setPlaybooks(prev => prev.filter(p => p.id !== id));
  const restoreDefaultPlaybooks = () => setPlaybooks(INITIAL_PLAYBOOKS);
  
  const saveDailyPrep = (date: string, prep: DailyPrepData) => {
    setDailyPreps(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), ...prep }
    }));
  };

  const saveWeeklyPrep = (weekId: string, prep: WeeklyPrepData) => setWeeklyPreps(prev => ({ ...prev, [weekId]: prep }));

  const saveBacktestDailyPrep = (sessionId: string, date: string, prep: Partial<DailyPrepData>) => {
    setBacktestSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        const currentPrep = s.simulatedDailyPreps?.[date] || {};
        return {
            ...s,
            simulatedDailyPreps: { 
                ...(s.simulatedDailyPreps || {}), 
                [date]: { ...currentPrep, ...prep } as DailyPrepData 
            }
        };
    }));
  };

  const saveBacktestWeeklyPrep = (sessionId: string, weekId: string, prep: WeeklyPrepData) => {
    setBacktestSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        return {
            ...s,
            simulatedWeeklyPreps: { ...(s.simulatedWeeklyPreps || {}), [weekId]: prep }
        };
    }));
  };

  const saveDailyNote = (date: string, note: string) => setDailyNotes(prev => ({ ...prev, [date]: note }));

  const value = {
    trades, activeTrades, backtestTrades, backtestSessions, accounts, activeOrders, playbooks, dailyPreps, weeklyPreps, dailyNotes, accountBlocks, language, selectedAccountId, isDarkMode, riskManagerEnabled,
    addTrade, addBacktestTrade, addBacktestSession, updateBacktestSession, updateTrade, updateBacktestTrade, deleteTrade, deleteBacktestTrade, updateAccount, deleteAccount, setAccounts, savePlaybook, deletePlaybook, 
    saveDailyPrep, saveWeeklyPrep, saveBacktestDailyPrep, saveBacktestWeeklyPrep, saveDailyNote, setLanguage, setSelectedAccountId, setIsDarkMode, setRiskManagerEnabled, setActiveOrders, restoreDefaultPlaybooks
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
