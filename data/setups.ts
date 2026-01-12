
import { TradingSetup, MarketContextType, OpeningContext } from '../types';

export const ALL_SETUPS: TradingSetup[] = [
  // --- OUT OF BALANCE (GAP) ---
  {
    id: 1, name: "The Open Drive", group: 'A', contexts: ['STRONG_TREND'],
    criteria: ["Aggressive Open", "Imediat Range extension", "No tails in opposite direction"],
    trigger: "Minimum Pullback", target: "HTF targets", invalidation: "Back in Opening Range",
    traps: [
        "False Conviction: Low Vol Drive: Price moves fast but volume is below average; it will return to the open within 15 min.",
        "Absorption: The Passive Wall: Price hits a massive 'iceberg' order and stalls instantly.",
        "Context Shift: Macro News Flush: The drive is an emotional reaction to news that is immediately digested."
    ],
    openingContext: 'OUT_OF_BALANCE', openType: 'Drive', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Extreme Imbalance. OTF (Institutional) decided direction pre-open. They are executing "At Market".',
    valueOverlap: 'No overlapping', valueMigration: 'Migrating outside',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 6, name: "Trend Day", group: 'A', contexts: ['STRONG_TREND'],
    criteria: ["One Time Framing", "Elongated, thin profile", "No large TPO overlaps"],
    trigger: "Any minor pullback. Do not wait for deep retracements.", target: "Open-ended. Exit on structure break", invalidation: "One Time Framing structure is broken (a bar closes below previous low).",
    traps: [
        "False Conviction: The Failed Midpoint: Price crosses 50% of the first distribution; the trend is officially dead.",
        "Absorption: Delta Divergence: Price defends the level, but Delta is strongly positive (hidden aggressive buying).",
        "Context Shift: Losing Initiative: The OTF that created the trend has left; only 'locals' are trading."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Total Control (OTF). Market is searching for a fair price but hasn\'t found it yet. Sustained imbalance.',
    valueOverlap: 'No overlapping', valueMigration: 'Migrating outside',
    relevantAnomaly: 'SINGLE_PRINTS',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 9, name: "Short Covering", group: 'A', contexts: ['TREND'],
    criteria: ["Thin profile with large distribution at High", "Volume dries up at retest of upper part of distribution", "Local structure change"],
    trigger: "candle close back inside distribution", target: "The POC of the distribution.", invalidation: "Outside boundary of distribution",
    traps: [
        "False Conviction: The Trap Door: The 'puke' (selling) stops abruptly and price makes a new High, trapping the sellers.",
        "Absorption: Low Delta Bounce: Price drops, but Delta is strongly positive (hidden aggressive buying).",
        "Context Shift: The News Flush: The liquidation is caused by a fake news headline; the market reverts instantly."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Rotation', dominantParticipant: 'Mixed',
    triggerTiming: 'P Shape: Position Exit. Old money exiting(OTF stop selling, Day Timefra panic), not new money entering. Market seeks balance after the run.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 10, name: "Long Liquidation", group: 'A', contexts: ['TREND'],
    criteria: ["Thin profile with large distribution at Low", "Volume dries up at retest of lower part of distribution", "Local structure change"],
    trigger: "candle close back inside distribution", target: "The POC of the distribution.", invalidation: "Outside boundary of distribution",
    traps: [
        "False Conviction: The Bottomless Pit: What looks like liquidation is actually 'Old Sellers' entering the market (Trend Change).",
        "Absorption: Absorption at VAL: Buyers try to stop the fall, but they are 'steamrolled' by institutional volume.",
        "Context Shift: Context Cycle: The market is at the start of a 3-day downward cycle; no bounce is coming."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Rotation', dominantParticipant: 'Mixed',
    triggerTiming: 'b-SHAPE Position Exit. Old money exiting(OTF stop buying, Day Timeframe panic), not new money entering. Market seeks balance after the run.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 12, name: "The GAP & Go", group: 'A', contexts: ['STRONG_TREND'],
    criteria: ["Open outside pdRange", "Sharp rejection of GAP boundary", "Breakout in the direction of GAP"],
    trigger: "Above or below Opening Range in the direction of the GAP", target: "Range Expansion (150% - 200% of the initial balance projected forward)", invalidation: "The moment price Accepts inside the Gap",
    traps: [
        "False Conviction: The Exhaustion Gap: The gap is too large (>3 ATR); the market has no fuel left to continue.",
        "Absorption: Immediate Rejection: Price touches the gap boundary and bounces back like a wall (no 'Go').",
        "Context Shift: The News Reversal: The Gap was 'priced in' and the big players are using the open to sell their positions."
    ],
    openingContext: 'OUT_OF_BALANCE', openType: 'Drive', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Momentum Play. Overnight sentiment has shifted value drastically. We are not looking for a "Gap Fill" here; looking for Escape Velocity.',
    valueOverlap: 'No overlapping', valueMigration: 'Migrating outside',
    relevantAnomaly: 'GAPS' as any,
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 13, name: "The GAP Fill", group: 'A', contexts: ['REVERSION'],
    criteria: ["Exhaustion on the direction of the GAP", "30 min acceptance into opening range", "Acceleration to pdClose"],
    trigger: "After loosing dOpen", target: "PdClose", invalidation: "The pdHigh/Low is TP1. pdClose final target",
    traps: [
        "False Conviction: The Halfway Stall: Price fills 50% of the gap and turns violently (never reaches the target).",
        "Absorption: Acceptance Outside: Price spends 30+ minutes outside the gap; the probability of a fill drops to 20%.",
        "Context Shift: Momentum Shift: A macro data release at 10:00 AM cancels the fill logic entirely."
    ],
    openingContext: 'OUT_OF_BALANCE', openType: 'Rejection- Reversal', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'The market opens with a Gap but the "smart money" deems the new price unfair or unsustainable. Trade the Reversion back to yesterday\'s closing range.',
    valueOverlap: 'No overlapping', valueMigration: 'Migration to pdValue',
    relevantAnomaly: 'GAPS' as any,
    intentFamily: 'FILL'
  },
  {
    id: 15, name: "\"D\" Period Expansion", group: 'B', contexts: ['STRONG_TREND'],
    criteria: ["Narrow IB", "Period C fails to break out", "Breakout of the Initial Balance High/Low during Period D"],
    trigger: "Go With the breakout", target: "150% - 200% IB Extension.", invalidation: "Price fails to hold the breakout and closes back inside the IB range.",
    traps: [
        "False Conviction: The Bracket Trap: Period D breaks the IB but immediately closes back inside (Fake breakout).",
        "Absorption: Low Vol Expansion: The D-period move has no volume; it is just a 'stop run' before reversing.",
        "Context Shift: The Midday Lull: Expansion occurs, but the market enters a 'chop' phase until the PM session."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Fresh Money. Early amateurs are done. Institutional flows often enter in D-period to set the real trend or expand the range. 11:00 NY time (6 pm RO).',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migrating outside',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 21, name: "Double Distribution Trend", group: 'B', contexts: ['STRONG_TREND'],
    criteria: ["Trend Day in progress", "Market forms two balances separated by SP", "Price tests the Single Prints separating the distributions and stalls."],
    trigger: "Buy the dip in the thin zone.", target: "New High of Day (Second Distribution High).", invalidation: "Price falls back into the Lower Distribution (Trend Failure).",
    traps: [
        "False Conviction: The Gap Fill: Price returns to the first distribution and fills the 'single prints', nullifying the setup.",
        "Absorption: Thin Air: The second distribution forms on tiny volume; it's a trap for 'late buyers'.",
        "Context Shift: POC Shift: The daily POC migrates back into the first distribution, indicating the trend has failed."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Trend Defense. Initiative buyers must defend the area between the two distributions to keep the trend alive.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migrating outside',
    relevantAnomaly: 'SINGLE_PRINTS',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 22, name: "45-Degree Line Break", group: 'B', contexts: ['TREND'],
    criteria: ["45 degree angle move - the profile edge forms a clean 45-degree angle", "Indicates managed algorithmic trend", "Price breaks the 45-degree visual trend line on the profile."],
    trigger: "Counter-trend (Fade).", target: "The day's POC.", invalidation: "Price repairs the line and continues the grind.",
    traps: [
        "False Conviction: The Steep Angle: The angle is too steep; the 'repair' will be a crash, not a slow reversion.",
        "Absorption: The Bounce Trap: Price touches the line, looks like it's holding, then 'falls through the floor'.",
        "Context Shift: Algorithmic Shift: The algos maintaining the trend line turn off due to a tech news event (NQ)."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Rhythm Break. The structured buying/selling has stopped. Stops trailing the trend line are exposed.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },
  {
    id: 32, name: "The Half-Gap Fill", group: 'D', contexts: ['REVERSION'],
    criteria: ["Massive Gap Open.", "Market attempts to fill but stalls halfway.", "Price stalls/reverses exactly at the 50% measurement of the Gap."],
    trigger: "Resume original trend (Fade the fill).", target: "New High/Low of Day.", invalidation: "Price pushes past 50% and accelerates to fill the whole gap.",
    traps: [
        "False Conviction: The Full Fill Drive: Price doesn't even see the 50% level and closes the gap entirely.",
        "Absorption: Stalling and Failing: Price lingers at 50% too long and then continues the original gap direction.",
        "Context Shift: The News Gap: The gap is fundamental (war/interest rates); it won't even fill 10%."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Support in Void. When a gap is too large to fill, algorithms often treat the 50% midpoint of the Gap as a structural pivot.',
    valueOverlap: 'No overlapping', valueMigration: 'Migrating outside',
    relevantAnomaly: 'GAPS' as any,
    intentFamily: 'FILL'
  },
  {
    id: 37, name: "3-Day Balance Break", group: 'D', contexts: ['STRONG_TREND'],
    criteria: ["Market has traded in the same High-Low range for 3 days.", "Overlapping Value Areas.", "Strong close outside the 3-day balance range."],
    trigger: "\"Go With\" the breakout (Retest of breakout point).", target: "Measured Move (Height of Balance).", invalidation: "\"Look Above/Below and Fail\" (False Breakout).",
    traps: [
        "False Conviction: Look Above and Fail: Price breaks the 3-day range but returns inside (the ultimate trap).",
        "Absorption: Low Vol Breakout: The breakout has no OTF participation; it will fail within the hour.",
        "Context Shift: The Fake Retest: Price returns to a retest but continues deep back into the balance."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Energy Release. 3 days is the standard cycle for short-term accumulation. A breakout usually leads to a trending period.',
    valueOverlap: 'High overlap', valueMigration: 'Migrating outside',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 39, name: "Trend Day +1", group: 'D', contexts: ['BALANCE_CHOP'],
    criteria: ["Yesterday was a massive Trend Day.", "Today opens inside yesterday's range.", "Price approaches the edge of yesterday's value."],
    trigger: "Fade the edges (Do not look for trend).", target: "Midpoint of the range.", invalidation: "A continuation breakout (Rare, but powerful).",
    traps: [
        "False Conviction: Trend Continuation: You expect consolidation, but the market does a second Trend Day (deadly).",
        "Absorption: The Deep Retrace: Market retraces 100% of yesterday's trend before finding any support.",
        "Context Shift: The Inside Day Trap: The range is so small that commissions eat your profit while you wait."
    ],
    openingContext: 'OUT_OF_BALANCE', strategyType: 'Rotation', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Consolidation. Markets rarely trend vertically for 2 days. The new value needs to be digested.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },

  // --- IN BALANCE - OUTSIDE VALUE ---
  {
    id: 2, name: "The Open Test Drive", group: 'A', contexts: ['TREND'],
    criteria: ["Test a key level at Open", "Quick Rejection", "Aggressive move in the opposite direction"],
    trigger: "Break of Open in the direction of the drive", target: "IB ext 1.5x - 2", invalidation: "Price gets acceptance beyond the level tested",
    traps: [
        "False Conviction: The Deep Test: The test penetrates too deep into yesterday's Value Area, becoming 'acceptance' rather than rejection.",
        "Absorption: Hanging at Level: Price stays at the tested level instead of rejecting quickly. If it stays, it will break.",
        "Context Shift: Pre-Market Trap: The test was already completed in Globex; the RTH move is already exhausted."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', openType: 'Test driver', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Validation. The market checked for business at the key level. Found none, giving the "Green Light".',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migrating outside',
    intentFamily: 'FILL'
  },
  {
    id: 3, name: "Open Rejection Reverse", group: 'A', contexts: ['REVERSION'],
    criteria: ["Open with GAP up/down", "Failed attempt to continue", "Re-entry into pDay Range"],
    trigger: "When price re-enters the pDay VA.", target: "Previous POC or opposite Value Area limit.", invalidation: "Price breaks out of Value Area again and consolidates there.",
    traps: [
        "False Conviction: Failed VA Entry: Price re-enters yesterday's VA but gets stuck at the first High Volume Node (HVN) or POC.",
        "Absorption: The Squeeze: The reversal is just a 'weak hand' liquidation before the original trend resumes.",
        "Context Shift: Value Migration: Today's value is already forming outside yesterday's range, making the reversal irrelevant."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', openType: 'Rejection- Reversal', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Rejection. Market tried to find new value but failed. Must return to established value.',
    valueOverlap: 'High overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },
  {
    id: 4, name: "The 80% Rule", group: 'A', contexts: ['BALANCE_CHOP'],
    criteria: ["Opens outside pdVA", "acceptance in pdVA", "Trades within pdVA for 2 TPOs"],
    trigger: "The close of the second 30-min TPO inside VA.", target: "Value Area High/Low (opposite side).", invalidation: "Price leaves the VA from the side it entered.",
    traps: [
        "False Conviction: The Middle Grind: Price enters the VA but remains stuck at the POC for 2 hours, losing all momentum.",
        "Absorption: TPO Fake-out: You see 2 TPOs in the VA, but with long wicks indicating rejection, not acceptance.",
        "Context Shift: Narrow VA: Yesterday's Value Area is too small (e.g., <10 ES pts) to provide a statistical edge."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Local trend', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Acceptance. Statistically, once value is re-accepted, price tends to traverse the entire area.',
    valueOverlap: 'Full overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'ROTATION'
  },
  {
    id: 5, name: "Failed Auction", group: 'A', contexts: ['REVERSION'],
    criteria: ["Break above pdHigh/Low", "Immediate reversal back into range", "Formation of a Buying/Selling Tail"],
    trigger: "At re-entry in dRange", target: "Opposite edge of the current balance/range.", invalidation: "Price returns, tests the tail, and trades through it (filling the tail)",
    traps: [
        "False Conviction: Slow Liquidation: Price doesn't reject aggressively; it drifts down slowly, allowing buyers to absorb the selling.",
        "Absorption: Double Top/Bottom: What looks like a failure is actually a 'mechanical' level being built for a later breakout.",
        "Context Shift: Late Day Failure: The failure occurs in the final hour when volume is too chaotic for high-probability setups."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Trap. Lack of buyers at highs (or sellers at lows). Sharp liquidation follows.',
    valueOverlap: 'No overlapping', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },
  {
    id: 8, name: "Poor High/Low Repair", group: 'A', contexts: ['TREND'],
    criteria: ["No Tail at pd Extremes", "Value building near extreme", "Local structure to break in the direction of the Extreme"],
    trigger: "Momentum must increase towards Poor High/Low", target: "Once the level is broken (repaired) and the stops are triggered, GET OUT", invalidation: "Clear and violent rejection before reaching the level (weakness).",
    traps: [
        "False Conviction: Unfinished Business: Price makes a Poor High, drops, but returns immediately to repair it.",
        "Absorption: The Mechanical High: Multiple algos have the same level; the break will be violent, not a reversal.",
        "Context Shift: Trend Day High: On a strong trend day, Poor Highs can remain for hours before being repaired."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Local trend', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Imperfection. Algo-driven stop. The auction is "unfinished" and magnetically attracts price.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    relevantAnomaly: 'POOR_STRUCTURE',
    intentFamily: 'FILL'
  },
  {
    id: 11, name: "THE SPIKE", group: 'A', contexts: ['TREND'],
    criteria: ["Open inside or outside spike", "Retest of origin or spike", "Breakout from extreme"],
    trigger: "If inside go in the direction of spike after retest", target: "Next reference point above spike", invalidation: "below the origin of spike",
    traps: [
        "False Conviction: Hollow Spike: The spike is formed in the last 2 minutes on no volume; it will be 'zippered' tomorrow.",
        "Absorption: Open Beyond Spike: Tomorrow's open gaps over the spike, leaving it behind and creating a new magnet.",
        "Context Shift: The Reversal Spike: The spike is just a 'climax' at the end of a move, not a structural shift."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Late imbalance: OTF Repositioning. Institutions setting up for tomorrow. The Spike is the new reference.',
    valueOverlap: 'No overlapping', valueMigration: 'Migrating outside',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 14, name: "Overnight Inventory Correction", group: 'B', contexts: ['REVERSION'],
    criteria: ["Open inside pdRange", "ON inventory is 100% long/short", "Failure to break the Overnight High/Low in the first 5-15 mins."],
    trigger: "Fade the Overnight trend.", target: "Yesterday's Settlement (Close) or VWAP", invalidation: "Aggressive breakout extending the Overnight Range (Inventory Validation).",
    traps: [
        "False Conviction: Sentiment Carry: Inventory is 100% short, but a macro headline at 8:30 AM forces a trend continuation.",
        "Absorption: Half-Back Support: Price fades toward yesterday but is brutally stopped at 50% of the ON range.",
        "Context Shift: Breakout of ONH/L: The fade fails and the market breaks the Overnight High (strong trend signal)."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Rerversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Weak Hands Flush. Overnight speculators are "trapped." If the market doesn\'t expand immediately, they panic-exit (puke) to break even.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },
  {
    id: 17, name: "The Ledge Break", group: 'B', contexts: ['TREND'],
    criteria: ["Intraday Ledge - where TPOs stop at the exact same price.", "Usually occurs mid-range", "Price ticks through the flat ledge level."],
    trigger: "Stop-Entry breakout through the ledge", target: "Next High Volume Node (HVN)", invalidation: "Price bounces off the ledge and moves away (Support held)",
    traps: [
        "False Conviction: The False Ledge: The 'ledge' is formed by only 2-3 TPOs; it's too weak for a major move.",
        "Absorption: Iceberg Support: A massive passive buyer sits right under the ledge, absorbing the break.",
        "Context Shift: The Late Break: The ledge breaks at 3:45 PM (too late to manage the risk properly)."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'An OTF with a large iceberg order is holding price. Once that liquidity(Day timeframe) is consumed or pulled, price collapses through the vacuum lead by an agressive OTF.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    relevantAnomaly: 'LEDGE',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 19, name: "Weak Low/High Cascade", group: 'B', contexts: ['TREND'],
    criteria: ["Cluster of weak swing lows/highs - (poor structure) stacked close together over recent days", "No \"clean\" rejection tails", "Price breaks the first level in the cluster."],
    trigger: "Short the breakdown.", target: "The final low in the series + 5-10 points (Flush).", invalidation: "\"Look Below and Fail.\" Price sweeps the first low and reverses violently.",
    traps: [
        "False Conviction: Look Below and Fail: Price sweeps the first low and reverses violently.",
        "Absorption: Absorption by Passive Buyers: Large limit orders absorb the cascade.",
        "Context Shift: Reversal News: Sudden news halts the breakdown."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Trend', dominantParticipant: 'Mixed',
    triggerTiming: 'Liquidity Pool. Stops are bunched up below these weak levels(Day Timeframe). Hitting the first one triggers a chain reaction of sell orders. OTF uses the liquidity to push further.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migrating outside',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 25, name: "Overnight Stat Play", group: 'C', contexts: ['REVERSION'],
    criteria: ["Market opens between the Overnight High (ONH) and Low (ONL)", "Neither extreme has been touched in RTH yet.", "Market tests one side, fails to break, and reverses."],
    trigger: "Target the opposite overnight extreme.", target: "ONH or ONL.", invalidation: "The market breaks the first side tested and accepts outside of it.",
    traps: [
        "False Conviction: Unreached Extreme: The market stays inside the ON range all day (rare, but it happens).",
        "Absorption: The 1-Tick Fail: Price hits the ONH with exactly 1 tick and reverses (no liquidity above).",
        "Context Shift: Late Expansion: The statistical level is reached only in the final seconds of the session."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Statistical Probability. On ES/NQ, there is a >90% stat probability that at least one overnight extreme is taken out during the day.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'ROTATION'
  },
  {
    id: 27, name: "IB Extension Failure", group: 'C', contexts: ['BALANCE_CHOP'],
    criteria: ["Price breaks the Initial Balance (First Hour Range)", "Breakout is shallow (2-5 ticks) and stalls.", "A reversal candle/pattern immediately after the IB break."],
    trigger: "Fade the breakout.", target: "The opposite side of the Initial Balance.", invalidation: "Acceptance (two TPO closes) outside the Initial Balance.",
    traps: [
        "False Conviction: The Real Breakout: What looks like a failure is just a 'flag' before a massive extension.",
        "Absorption: The Retest: Price fails, returns to the IB, but then re-tests and breaks out definitively.",
        "Context Shift: Context Drift: The market is in a macro trend; any 'failure' is just a buying opportunity."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Rotation', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Liquidity Trap. Breakout traders are lured in. Pros absorb the flow and reverse it to run the stops on the other side.',
    valueOverlap: 'High overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'ROTATION'
  },
  {
    id: 28, name: "Round Number Magnet", group: 'C', contexts: ['BALANCE_CHOP'],
    criteria: ["NQ approaches huge levels (e.g., 18,000) or ES (e.g., 5,000).", "Volume profile thins out as we approach.", "Price gets within \"striking distance\" (10-20 pts NQ)."],
    trigger: "Momentum trade to the number.", target: "The exact Round Number.", invalidation: "Price stalls significantly before reaching the magnet (Defense).",
    traps: [
        "False Conviction: The Front-Run: The market turns 2 points before a level like 5000 or 6000.",
        "Absorption: The Overshoot: Price pierces the round number by 10 points before finally rejecting.",
        "Context Shift: The Magnet: Price gets stuck at the round number (fair value) and offers no scalp."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Local trend', dominantParticipant: 'Mixed',
    triggerTiming: 'Massive hedging activity occurs at big strikes. The price is magnetically pulled to the level to settle options (Daytimeframes) OTF pasiv present with iceberg, OTF aggressive uses liquidity to move price further.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migrating outside',
    intentFamily: 'ROTATION'
  },
  {
    id: 35, name: "LVN Rejection", group: 'D', contexts: ['REVERSION'],
    criteria: ["Price approaches a Low Volume Node (LVN) separating two distributions.", "Momentum slows.", "Absorption (high volume, no movement) at the LVN lip."],
    trigger: "Fade the LVN.", target: "Back to the current distribution's POC.", invalidation: "Price zooms through the LVN with speed (Transition).",
    traps: [
        "False Conviction: The Acceptance: Price enters the LVN on high volume; the LVN becomes the new POC.",
        "Absorption: The Fast Pass: Price moves through the LVN so fast you can't even click 'sell/buy.'",
        "Context Shift: Contextual Void: The LVN is too old (>10 days) and no longer acts as a reference."
    ],
    openingContext: 'IN_BALANCE_OUTSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Rejection. The market previously rejected these prices. Without news, it is likely to reject them again. OTF who created the LVN will defend it first.',
    valueOverlap: 'No overlapping', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },

  // --- IN BALANCE - INSIDE VALUE ---
  {
    id: 7, name: "Inside Day Breakout", group: 'A', contexts: ['TREND'],
    criteria: ["Open inside pdVA", "Low volatility", "Tight balance"],
    trigger: "Go with the direction of the break", target: "Range extension 1, 2", invalidation: "\"Look above and fail\". False breakout and return to the Inside Day POC.",
    traps: [
        "False Conviction: Look Above/Fail: Price looks above the range and fails immediately.",
        "Absorption: Losing Initiative: The breakout lacks volume and gets absorbed.",
        "Context Shift: Reversion: Market reverts to the mean instead of trending."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Trend', dominantParticipant: 'OTF',
    triggerTiming: 'Energy Build-up. Compression inevitably leads to expansion/explosion.',
    valueOverlap: 'Full overlap', valueMigration: 'Migrating outside pdValue',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 16, name: "VWAP Reversion", group: 'B', contexts: ['REVERSION'],
    criteria: ["Price extends >2.0 Standard Deviations from VWAP", "Price hits a Profile Reference (VAL/VAH)", "Momentum diverges (Delta)"],
    trigger: "Price crosses back inside the 2.0 Std Dev band or breaks micro-structure.", target: "The VWAP line itself.", invalidation: "Trend continues strong with increasing volume (Imbalance > Value).",
    traps: [
        "False Conviction: The Runway Trend: The market is so strong it doesn't touch the VWAP all day.",
        "Absorption: VWAP Front-run: Price approaches VWAP but 'bounces' before hitting it (missed entry).",
        "Context Shift: Sloping VWAP: The VWAP moves aggressively in the direction of price, erasing your profit potential."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'Mixed',
    triggerTiming: 'Mean Reversion. Algorithms perceive value as "overstretched." They execute reversion programs to bring price back to the average.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'FILL'
  },
  {
    id: 18, name: "Single Prints Fill", group: 'B', contexts: ['TREND'],
    criteria: ["SP formed by pDay - Trend Day leaving Single Prints", "Price opens/trades into this zone.", "Price accepts (closes a candle) inside the Single Print zone."],
    trigger: "In direction of the fill.", target: "The base of the Singles (where volume thickens).", invalidation: "Rejection at the very edge of the Single Prints (Trend Defense).",
    traps: [
        "False Conviction: The Full Fill: Price ignores the Single Prints and slices through them, filling the area completely.",
        "Absorption: Fast Flush: The test is so fast it offers no entry time, followed by a total reversal.",
        "Context Shift: Old Single Prints: You are testing levels from 10 days ago that have lost market relevance."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Local Trend', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Lack of Friction. Single prints represent emotion, not accumulated volume. There is no structural support to stop the price.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    relevantAnomaly: 'SINGLE_PRINTS',
    intentFamily: 'FILL'
  },
  {
    id: 20, name: "Naked POC Magnet", group: 'B', contexts: ['REVERSION'],
    criteria: ["pdPOC has not been touched", "Price has a clear path (Low Volume) towards it.", "Break of local structure opening the path to the VPOC."],
    trigger: "Directional trade to the VPOC", target: "Exact touch of the VPOC.", invalidation: "Major absorption/reversal before reaching the target.",
    traps: [
        "False Conviction: The Repelling Magnet: Price gets close but reverses just before the touch.",
        "Absorption: Front Running: Traders exit just before the POC, causing a reversal.",
        "Context Shift: Trend Day: On a trend day, old POCs are ignored."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Unfinished Business. Old value areas act as magnets for Day Timeframe. The market seeks to test if old "fair prices" are still valid. OTF may ignore it!',
    valueOverlap: 'High overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },
  {
    id: 23, name: "Composite HVN Rejection", group: 'B', contexts: ['REVERSION'],
    criteria: ["Approaching a HVN - High Volume Node from a 20-30 day Composite Profile.", "Volume dries up on approach.", "Absorption or Reversal Candle pattern right at the HVN edge."],
    trigger: "Fade the move.", target: "Rotation back to the current day's mean.", invalidation: "High volume breakout straight through the HVN (Paradigm Shift).",
    traps: [
        "False Conviction: The HVN Magnet: Price doesn't reject; it stays 'glued' to the HVN (acceptance of new value).",
        "Absorption: Volume Surge: The break of the HVN happens on triple volume (A Paradigm Shift).",
        "Context Shift: The Rotation Trap: The rejection is just a small rotation before the price 'digs' through the node."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Old Value Resistance. Markets accept new value slowly. A massive old value node acts as a brick wall on the first test.',
    valueOverlap: 'High overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'ROTATION'
  },
  {
    id: 24, name: "The Halfback Play", group: 'C', contexts: ['BALANCE_CHOP'],
    criteria: ["Market establishes a clear Day Range or Strong Swing", "Price pulls back to the exact 50% midpoint.", "Price touches the 50% level of the current range/swing."],
    trigger: "Scalp for a reaction (Bounce).", target: "The previous High/Low.", invalidation: "Price slices through the 50% level with increasing Delta/Volume.",
    traps: [
        "False Conviction: The Slicer: Price slices through the 50% level without any hesitation or reaction.",
        "Absorption: Churning at 50%: Price oscillates around the level, grinding down stops in both directions.",
        "Context Shift: The Deep Correction: The market is hunting for the VAL or VWAP, ignoring the 50% level."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Local trend', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Algorithmic Pivot. HFT algorithms use the 50% level as the immediate short-term "Fair Value" equilibrium.',
    valueOverlap: 'High overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'ROTATION'
  },
  {
    id: 26, name: "Inside Value Fade", group: 'C', contexts: ['BALANCE_CHOP'],
    criteria: ["Price opens and remains inside Yesterday's Value Area (VA)", "Low momentum / overlapping TPOs.", "Price touches Value Area High (VAH) or Low (VAL)."],
    trigger: "Fade (Sell VAH / Buy VAL).", target: "Point of Control (POC).", invalidation: "Price breaks the Value Area with strong Initiative Volume (Trend start).",
    traps: [
        "False Conviction: The Breakout Drive: An open in the VA that turns into an unexpected 'Open Drive' trend.",
        "Absorption: POC Magnetism: Price hits the POC and stays there, refusing to move to the VA edges.",
        "Context Shift: Expanding Value: Today's VA is widening rapidly, making yesterday's edges irrelevant."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Rotation', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'In Balance. The market agrees on price. Breakout attempts are usually "noise" and will be faded by responsive participants. Lack of OTF!',
    valueOverlap: 'Full overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 29, name: "Afternoon Drift", group: 'C', contexts: ['BALANCE_CHOP'],
    criteria: ["Time is 12:00 PM – 2:00 PM NY", "Volume drops significantly below average.", "Volume drops + Price action becomes sluggish/grinding."],
    trigger: "Fade the morning trend.", target: "VWAP or Morning Midpoint.", invalidation: "A fresh news catalyst brings volume back into the market.",
    traps: [
        "False Conviction: The Second Wind: Instead of drifting, institutions enter at 1:00 PM for a new wave.",
        "Absorption: V-Reversal: The drift turns into a violent 100% recovery of the morning move.",
        "Context Shift: Low Liquidity Squeeze: Low volume makes the price 'jump' erratically, hitting tight stops."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Rotation', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Liquidity Withdrawal. OTF stop trading. The market drifts on light volume, often retracing the morning move - inventory adjustment. Occurs between 11:30-12(NY)/ 6:30-7pm (RO)',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 30, name: "HVN Edge Bounce", group: 'C', contexts: ['BALANCE_CHOP'],
    criteria: ["Price is trading inside a massive composite High Volume Node (HVN)", "Market is choppy.", "Price tests the visual edge of the Volume Node."],
    trigger: "Fade the edge (Buy Low/Sell High of node).", target: "The center of the node (Peak Volume).", invalidation: "Breakout with volume clearing the HVN completely.",
    traps: [
        "False Conviction: The Node Expansion: The HVN is getting wider; what was the 'edge' is now the 'middle'.",
        "Absorption: Absorption Flush: Price sits at the edge of the node and then suddenly collapses into the next LVN.",
        "Context Shift: The News Spike: A news event breaks the node's equilibrium in milliseconds."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Thick Value. Price is "stuck in mud." It oscillates between the upper and lower limits of the volume node.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 31, name: "The Volume Vacuum", group: 'C', contexts: ['STRONG_TREND'],
    criteria: ["High Impact News (CPI/FOMC) creates a vertical move", "Profile shows gaps/zeros (Vacuum).", "Momentum stalls and Delta diverges at the high/low."],
    trigger: "Fade the spike.", target: "The base of the spike (where the move started).", invalidation: "Continuation of the spike with sustained volume (Real Repricing).",
    traps: [
        "False Conviction: The Re-Fill: The vacuum isn't crossed fast; price starts building value inside the empty zone.",
        "Absorption: The Wall at End: A massive order wall at the end of the vacuum sends price back to the start.",
        "Context Shift: The Trap Door: You enter the vacuum and the market stops halfway, trapping you in 'thin air'."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Hollow Structure. There is no support in a vacuum. Once momentum stops, gravity takes over to "fill" the empty space.',
    valueOverlap: 'Minimum overlap', valueMigration: 'None',
    intentFamily: 'CONFIDENCE'
  },
  {
    id: 33, name: "The \"Zipper\" Repair", group: 'D', contexts: ['BALANCE_CHOP'],
    criteria: ["Intraday profile looks \"jagged\" (alternating lines of high/low volume).", "Indicates fighting/inefficiency.", "Price rotates back into the jagged area."],
    trigger: "Range trade (Scalp both sides).", target: "Until the profile looks smooth.", invalidation: "Strong directional drive through the zipper.",
    traps: [
        "False Conviction: The Unfinished Zipper: The market repairs only half the 'teeth' and leaves to start a new trend.",
        "Absorption: The Gap-Over: The market opens completely above the zipper area, ignoring it.",
        "Context Shift: High Vol. Breakdown: The zipper is destroyed by a panic move rather than being 'smoothed'."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Rotation', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Smoothing Process. The market is an efficiency machine. It returns to "zipper" areas to trade back and forth until the curve is smooth.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 34, name: "Neutral Day Fade", group: 'D', contexts: ['REVERSION'],
    criteria: ["Market extends range on BOTH sides of the Initial Balance (Neutral Day).", "Price approaches an extreme late day.", "Late afternoon test of the Day's High or Low."],
    trigger: "Fade the extreme.", target: "The day's POC (Center).", invalidation: "A \"Neutral Extreme\" close (Price closes at the High/Low).",
    traps: [
        "False Conviction: Neutral Extreme: The market closes at the High or Low (a major trend signal for tomorrow).",
        "Absorption: Double Extension: The extension on the second side is much larger than the first (Imbalance).",
        "Context Shift: The News Pivot: A late-day news event (Fed Minutes) destroys the neutral nature of the day."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Mean Reversion. Range extension on both sides means neither Bulls nor Bears are in control. Close tends to be central.',
    valueOverlap: 'High overlap', valueMigration: 'None',
    intentFamily: 'ROTATION'
  },
  {
    id: 36, name: "The \"Tail\" Fade", group: 'D', contexts: ['REVERSION'],
    criteria: ["Previous day has a long single-print tail (Buying/Selling wick).", "Price tests the base of that tail.", "Price touches the area where the \"fat\" profile turns into the \"thin\" tail."],
    trigger: "Defend the tail (Buy/Sell).", target: "Recent POC.", invalidation: "Price trades into the tail and starts filling it.",
    traps: [
        "False Conviction: The Tail Migration: 'Smart money' moves their defense higher/lower, leaving the old tail exposed.",
        "Absorption: The Wick Fill: Price fills the entire tail (wick) before finally showing a rejection.",
        "Context Shift: The Climax Tail: The tail was the end of a trend; testing it leads to a total collapse."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Structural Defense. The tail represents an unfair price. However, the start of the tail is often where value ends and rejection begins.',
    valueOverlap: 'No overlapping', valueMigration: 'None',
    intentFamily: 'FILL'
  },
  {
    id: 38, name: "Weekly POC Magnet", group: 'D', contexts: ['REVERSION'],
    criteria: ["It is Thursday/Friday.", "Market is drifting with no catalysts.", "Price drifts within range of the Weekly VPOC."],
    trigger: "Directional trade to the VPOC.", target: "The Weekly VPOC.", invalidation: "New information (News) creates a late-week breakout.",
    traps: [
        "False Conviction: The Repelling POC: Price gets within 5 points and rejects violently (never hits the magnet).",
        "Absorption: The POC Shift: The Weekly POC moves because of today's high volume, changing your target.",
        "Context Shift: The Friday Trend: It's Friday, but the market is trending and ignores the high-volume magnet."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'Day Timeframe',
    triggerTiming: 'Dealer Gamma. Market makers and algos try to pin the price at the area of highest volume to kill weekly option premiums. Thursday/ Friday',
    valueOverlap: 'High overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'FILL'
  },
  {
    id: 39, name: "Monthly Range Edge Fade", group: 'D', contexts: ['REVERSION'],
    criteria: ["Price hits monthly high/low extremes.", "RSI divergence on HTF (4H/Daily).", "Rejection wicks on daily timeframe."],
    trigger: "Fade the breakout attempt.", target: "Monthly POC.", invalidation: "Price closes outside monthly range for 2 consecutive days.",
    traps: [
        "False Conviction: The Trend Resumption: Price hits the monthly high and accelerates (Breakout).",
        "Absorption: The Fake Rejection: Price wicks the level, drops slightly, then blasts through.",
        "Context Shift: Macro News Breakout: A fundamental shift pushes price into a new monthly range."
    ],
    openingContext: 'IN_BALANCE_INSIDE_VALUE', strategyType: 'Reversion', dominantParticipant: 'OTF',
    triggerTiming: 'Mean Reversion. Price is overextended on a macro scale. Large players take profits and reverse positions.',
    valueOverlap: 'Minimum overlap', valueMigration: 'Migration to pdValue',
    intentFamily: 'ROTATION'
  },
];
