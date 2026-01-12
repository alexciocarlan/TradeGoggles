
/**
 * @directive LOGIC_PROTECTION_PROTOCOL
 * Acest fișier conține calculele sacre ale sistemului. 
 */
import { DailyPrepData, Trade, Account } from './types';

export const INSTRUMENT_MULTIPLIERS = Object.freeze({
  'MNQ': 2, 'NQ': 20, 'MES': 5, 'ES': 50, 'GC': 100, 'BTCUSDT': 1
});

// --- V5.0 BEHAVIORAL EQUITY ENGINE ---

export interface BEMetrics {
    score: number;
    tier: 'RECRUIT' | 'BUILDER' | 'OPERATOR' | 'SENTINEL';
    multiplier: number;
    handicapMessage: string;
    isTierALocked: boolean;
}

export const calculateBEScore = (recentTrades: Trade[]): BEMetrics => {
    // 1. Select Last 10 Trades
    const last10 = recentTrades
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    if (last10.length === 0) {
        return { score: 50, tier: 'RECRUIT', multiplier: 0.5, handicapMessage: "NO DATA. PROBATION MODE.", isTierALocked: true };
    }

    let rawScore = 50; // Base Score

    // 2. Calculate Components
    last10.forEach(t => {
        // Discipline Boost
        if (t.disciplineScore >= 4) rawScore += 5;
        if (t.disciplineScore <= 2) rawScore -= 5;

        // Guillotine Veto (SL Violation)
        if (t.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)') {
            rawScore -= 25; // Massive Penalty
        }
        
        // Prep Bonus
        if (t.isAccordingToPlan === 'DA') rawScore += 2;
    });

    // 3. Normalize 0-100
    const finalScore = Math.max(0, Math.min(100, rawScore));

    // 4. Determine Tier & Handicap
    let tier: 'RECRUIT' | 'BUILDER' | 'OPERATOR' | 'SENTINEL' = 'RECRUIT';
    let multiplier = 0.25;
    let isTierALocked = true;
    let message = "PENALTY BOX ACTIVE. 25% RISK ALLOWED.";

    if (finalScore >= 80) {
        tier = 'SENTINEL';
        multiplier = 1.0;
        isTierALocked = false;
        message = "STATUS ALPHA CONFIRMED. FULL MARKET ACCESS.";
    } else if (finalScore >= 50) {
        tier = 'BUILDER';
        multiplier = 0.75;
        isTierALocked = true; // Still locked until > 80 to force discipline
        message = "BUILDER STATUS. MAX SIZE LOCKED. EARN YOUR WAY UP.";
    } else {
        tier = 'RECRUIT'; // < 50
        multiplier = 0.25;
        isTierALocked = true;
        message = "REPUTATION CRITICAL. MICRO-SIZE ONLY.";
    }

    return { score: finalScore, tier, multiplier, handicapMessage: message, isTierALocked };
};

export const isToxicWin = (trade: Trade): boolean => {
    // A toxic win is a profitable trade where a cardinal rule was broken (SL moved)
    return trade.pnlNet > 0 && trade.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)';
};

// --- LEGACY TILT CALCULATOR ---

export const calculateTiltRisk = (todayTrades: Trade[], activeAccount?: Account, todayPrep?: DailyPrepData) => {
    let score = 0;
    const todayPnl = todayTrades.reduce((s, t) => s + t.pnlNet, 0);
    const maxDailyRisk = activeAccount?.riskSettings?.maxDailyRisk || 1000;
    
    // 1. Punctaj bazat pe pierdere financiară (0-50p)
    if (todayPnl < 0) {
        score += Math.min((Math.abs(todayPnl) / maxDailyRisk) * 50, 50);
    }
    
    // 2. Pierderi consecutive (0-30p)
    let consecutiveLosses = 0;
    const sorted = [...todayTrades].sort((a, b) => b.id.localeCompare(a.id));
    for (const t of sorted) {
        if (t.status === 'LOSS') consecutiveLosses++;
        else break;
    }
    score += Math.min(consecutiveLosses * 15, 30);

    // 3. Disciplină din Prep (Dacă nu e completat Prep, risc implicit de 20p)
    if (!todayPrep) {
        score += 20;
    } else if (todayPrep.habDisciplineScore < 5) {
        score += 15;
    }

    score = Math.min(Math.round(score), 100);

    const levels = [
        { threshold: 75, label: 'OVERLOAD', color: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]', desc: 'OPREȘTE-TE IMEDIAT.' },
        { threshold: 40, label: 'FRICTION', color: 'text-orange-500', bg: 'bg-orange-500', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]', desc: 'REDU MĂRIMEA.' },
        { threshold: 15, label: 'MILD', color: 'text-yellow-400', bg: 'bg-yellow-400', shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]', desc: 'FII ATENT.' },
        { threshold: -1, label: 'OPTIMAL', color: 'text-cyan-400', bg: 'bg-cyan-500', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]', desc: 'FLOW STABIL.' }
    ];

    return { score, ...(levels.find(l => score > l.threshold) || levels[3]) };
};
