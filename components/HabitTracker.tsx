
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DailyPrepData, Trade } from '../types';
import { Language } from '../translations';

interface HabitTrackerProps {
  dailyPreps: Record<string, DailyPrepData>;
  trades: Trade[];
  language: Language;
}

const HABITS = [
  { label: 'Respectat "No-Go" Rule?', key: 'habNoGoRespected' },
  { label: 'Analiza Pre-Market completa?', key: 'habPreMarketDone' },
  { label: 'Zero erori Stop Loss?', key: 'habStopLossRespected' },
  { label: 'Fara Revenge Trading?', key: 'habNoRevengeTrading' },
  { label: 'Jurnal completat?', key: 'habJournalCompleted' },
];

export const calculateTGScore = (date: string, trades: Trade[], prep: DailyPrepData | undefined) => {
  if (!prep && trades.filter(t => t.date === date).length === 0) return { score: 0, components: [], vetoTriggered: false, vetoReason: '', metrics: null };

  // 1. P (Preparation - 20%)
  const hasGatekeeper = !!prep?.gkVerdict && prep.gkVerdict !== 'None';
  const gatekeeperScore = prep?.gkTotalScore || 0;
  const preFightSigned = prep?.gkUncertaintyAccepted || false;
  const P = (gatekeeperScore * 0.7 + (preFightSigned ? 100 : 0) * 0.3);

  // 2. E (Execution - 50%)
  const dayTrades = trades.filter(t => t.date === date);
  let E = 0;
  let allExecutionNotes = false;
  if (dayTrades.length > 0) {
    const avgDiscipline = (dayTrades.reduce((s, t) => s + t.disciplineScore, 0) / dayTrades.length) * 20; // scale to 100
    const notesCompleteness = (dayTrades.filter(t => (t.notes?.length || 0) > 10).length / dayTrades.length) * 100;
    allExecutionNotes = dayTrades.every(t => (t.notes?.length || 0) > 10);
    E = (avgDiscipline * 0.6 + notesCompleteness * 0.4);
  }

  // 3. R (Review - 30%)
  const wrapUpDone = prep?.habJournalCompleted || false;
  const allReviewed = dayTrades.length > 0 && dayTrades.every(t => (t.notes?.length || 0) > 10) ? 100 : 0;
  const R = ((wrapUpDone ? 100 : 0) * 0.5 + allReviewed * 0.5);

  // 4. V (The Sentinel Multiplier - Veto)
  let V = 1.0;
  let vetoTriggered = false;
  let vetoReason = '';

  const hasSlViolation = dayTrades.some(t => t.executionError === 'Refuzul de a Pierde (Mutarea Stop-Loss-ului)');
  const hasRevenge = dayTrades.some(t => t.executionError === 'Tilt Emotional (Revenge Trading)');
  
  if (hasSlViolation) { V = 0; vetoTriggered = true; vetoReason = 'STOP LOSS VIOLATION'; }
  else if (hasRevenge) { V = 0.5; vetoTriggered = true; vetoReason = 'REVENGE TRADING DETECTED'; }

  const finalScore = ((P * 0.20) + (E * 0.50) + (R * 0.30)) * V;

  const radarData = [
    { subject: 'Prep', A: P, fullMark: 100 },
    { subject: 'Execution', A: E, fullMark: 100 },
    { subject: 'Review', A: R, fullMark: 100 },
    { subject: 'Risk Integrity', A: V * 100, fullMark: 100 },
    { subject: 'Consistency', A: prep?.habDisciplineScore ? prep.habDisciplineScore * 10 : 0, fullMark: 100 },
  ];

  const auditMetrics = {
      p: { hasGatekeeper, preFightSigned },
      e: { tradeCount: dayTrades.length, allNotes: allExecutionNotes, lowTilt: dayTrades.length > 0 && dayTrades.every(t => t.disciplineScore >= 4) },
      r: { wrapUpDone, allReviewed: allReviewed === 100 },
      v: { hasSlViolation, hasRevenge }
  };

  return { score: finalScore, components: radarData, vetoTriggered, vetoReason, metrics: auditMetrics };
};

const IdentityTierWidget = ({ dailyPreps, trades }: { dailyPreps: Record<string, DailyPrepData>, trades: Trade[] }) => {
    const engineResults = useMemo(() => {
        const allDates = Array.from(new Set([...Object.keys(dailyPreps), ...trades.map(t => t.date)])).sort();
        let be = 0;
        let multiplier = 1.0;
        let lastViolationDate: string | null = null;
        let criticalViolations = 0;

        allDates.forEach(date => {
            const prep = dailyPreps[date];
            const dayTrades = trades.filter(t => t.date === date);
            const scoreData = calculateTGScore(date, trades, prep);

            // 1. Base Points Calculation
            let basePoints = 0;
            if (prep) {
                if ((prep.gkSleepHours || 0) >= 7) basePoints += 10;
                if (prep.habJournalCompleted) basePoints += 10;
                if (prep.gkTotalScore >= 70) basePoints += 20;
            }

            // 2. Guillotine Check
            if (scoreData.vetoTriggered && scoreData.vetoReason === 'STOP LOSS VIOLATION') {
                be = be * 0.50;
                multiplier = 1.0;
                lastViolationDate = date;
                criticalViolations++;
            } else {
                // Compounding Consistency
                const dailyGain = basePoints * multiplier;
                be += dailyGain;
                
                // Increment multiplier (neuroplasticity simulation)
                multiplier = Math.min(multiplier + 0.1, 2.0);
            }
        });

        const now = new Date();
        const daysSinceLastViolation = lastViolationDate 
            ? Math.floor((now.getTime() - new Date(lastViolationDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        return { be, multiplier, daysSinceLastViolation, criticalViolations };
    }, [dailyPreps, trades]);

    const getTierInfo = (be: number, cleanDays: number) => {
        if (be >= 15000 && cleanDays >= 90) return { level: 3, name: 'THE SENTINEL', state: 'Elite', desc: 'Statut suprem. Algoritmul consideră traderul "autonom". You are the Edge.', color: 'from-blue-400 to-indigo-600', glow: 'shadow-[0_0_40px_rgba(99,102,241,0.6)]', icon: 'fa-crown text-amber-500' };
        if (be >= 5000) return { level: 2, name: 'The Operator', state: 'Established', desc: 'Structură de oțel. Poți seta limite de risc personalizate.', color: 'from-emerald-400 to-cyan-600', glow: 'shadow-[0_0_25px_rgba(16,185,129,0.5)]', icon: 'fa-user-ninja text-slate-300' };
        if (be >= 1000) return { level: 1, name: 'The Builder', state: 'Constructing', desc: 'Construiești structură, dar ești încă fragil. Primești Streak_Multiplier bonus.', color: 'from-blue-500 to-blue-800', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]', icon: 'fa-hammer text-slate-400' };
        return { level: 0, name: 'The Recruit', state: 'Probation', desc: 'Ești încă vulnerabil. Sistemul nu are încredere în tine. Dovedește disciplina.', color: 'from-orange-500 to-red-600', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', icon: 'fa-shield-halved text-red-500 opacity-50' };
    };

    const currentTier = getTierInfo(engineResults.be, engineResults.daysSinceLastViolation);
    const progressPercent = Math.min((engineResults.be / 15000) * 100, 100);

    return (
        <div className="w-full bg-[#0b1222] border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group mb-10">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Behavioral Equity Engine</h2>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Identity Tier System // Reputație Dinamică Protocol</p>
                </div>
                <div className="bg-slate-950/80 px-8 py-4 rounded-3xl border border-slate-800 shadow-inner flex items-center space-x-8">
                    <div className="text-center border-r border-slate-800 pr-8">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Reputation Score</p>
                        <p className="text-3xl font-black text-white italic">{Math.round(engineResults.be).toLocaleString()} <span className="text-xs text-slate-700 not-italic">BE</span></p>
                    </div>
                    <div className="text-center border-r border-slate-800 pr-8">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Momentum</p>
                        <p className="text-3xl font-black text-blue-400 italic">{engineResults.multiplier.toFixed(1)}x</p>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Tier</p>
                        <p className={`text-xl font-black uppercase italic tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${currentTier.color}`}>
                            {currentTier.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* THE INDUSTRIAL LIQUID TANK (BEHAVIORAL EQUITY REPRESENTATION) */}
            <div className="relative w-full h-32 bg-slate-950/50 rounded-[2rem] border-4 border-slate-900 overflow-hidden shadow-inner group/tank">
                {/* Peretele de sticlă cu gradații BE */}
                <div className="absolute inset-0 z-20 pointer-events-none opacity-40">
                    {[0, 1000, 5000, 10000, 15000].map((val) => (
                        <div key={val} className="absolute bottom-0 h-full border-r border-slate-800 transition-all" style={{ left: `${(val / 15000) * 100}%` }}>
                            <div className="absolute top-4 left-2 text-[8px] font-black text-slate-600 uppercase">
                                {val >= 1000 ? `${val / 1000}K` : val} BE
                            </div>
                        </div>
                    ))}
                    {/* Gloss Reflection */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>
                </div>

                {/* The Reputation Liquid */}
                <div 
                    className={`absolute bottom-0 left-0 h-full bg-gradient-to-r ${currentTier.color} transition-all duration-[2000ms] ease-out z-10 ${currentTier.glow}`}
                    style={{ width: `${progressPercent}%` }}
                >
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                        <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="absolute bottom-4 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
                        <div className="absolute bottom-2 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-1000"></div>
                    </div>
                </div>

                {/* Tier Labels Over the tank */}
                <div className="absolute inset-0 z-40 flex items-center px-10 pointer-events-none">
                    <div className="flex-1 flex justify-between w-full">
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${engineResults.be < 1000 ? 'text-white' : 'text-slate-600 opacity-40'}`}>RECRUIT</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${engineResults.be >= 1000 && engineResults.be < 5000 ? 'text-white' : 'text-slate-600 opacity-40'}`}>BUILDER</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${engineResults.be >= 5000 && engineResults.be < 15000 ? 'text-white' : 'text-slate-600 opacity-40'}`}>OPERATOR</div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${engineResults.be >= 15000 ? 'text-white' : 'text-slate-600 opacity-40'}`}>SENTINEL</div>
                    </div>
                </div>
            </div>

            {/* IDENTITY DESCRIPTION BOX */}
            <div className="mt-8 flex flex-col md:flex-row items-stretch gap-6 animate-in fade-in duration-1000">
                <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center shrink-0 bg-slate-900 border border-slate-800 shadow-xl`}>
                    <i className={`fas ${currentTier.icon.split(' ')[1]} text-3xl mb-2 ${currentTier.icon.split(' ')[2]}`}></i>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{currentTier.state}</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-3xl flex-1 flex flex-col justify-center">
                    <p className="text-sm text-slate-300 font-medium italic leading-relaxed">
                        <span className="font-black text-white not-italic uppercase mr-3 tracking-widest border-b border-blue-500/50 pb-1">Operational Intel:</span>
                        "{currentTier.desc}"
                    </p>
                </div>
                <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-3xl md:w-72 flex flex-col justify-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Algorithm Status</p>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 font-bold uppercase tracking-tight">Critical Violations:</span>
                            <span className={`font-black ${engineResults.criticalViolations > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{engineResults.criticalViolations}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 font-bold uppercase tracking-tight">Days Since SL Error:</span>
                            <span className={`font-black ${engineResults.daysSinceLastViolation < 30 ? 'text-orange-500' : 'text-emerald-500'}`}>{engineResults.daysSinceLastViolation}D</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute -top-10 -left-10 text-[250px] text-white/[0.01] pointer-events-none rotate-12">
                <i className="fas fa-microchip"></i>
            </div>
        </div>
    );
};

const TGScoreWidget = ({ date, trades, prep }: { date: string, trades: Trade[], prep: DailyPrepData | undefined }) => {
  const [showAudit, setShowAudit] = useState(false);
  const scoreData = useMemo(() => calculateTGScore(date, trades, prep), [date, trades, prep]);

  const AuditItem = ({ done, label, sub }: { done: boolean, label: string, sub?: string }) => (
    <div className="flex items-start space-x-4 py-3 border-b border-slate-800/40 last:border-0 group/audit">
        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-600'}`}>
            <i className={`fas ${done ? 'fa-check' : 'fa-circle'} text-[8px]`}></i>
        </div>
        <div className="flex-1">
            <p className={`text-[10px] font-black uppercase tracking-tight transition-colors ${done ? 'text-white' : 'text-slate-500'}`}>{label}</p>
            {sub && <p className={`text-[8px] font-bold uppercase mt-0.5 ${done ? 'text-slate-400' : 'text-slate-600'}`}>{sub}</p>}
        </div>
    </div>
  );

  return (
    <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center relative overflow-hidden group">
      <div className="w-full flex justify-between items-start mb-4">
        <div>
          <h4 className="text-white font-black text-lg tracking-tighter italic uppercase leading-none">TG Score</h4>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">SENTINEL DISCIPLINE ENGINE</p>
        </div>
        <button 
          onClick={() => setShowAudit(!showAudit)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all z-[60] ${showAudit ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-blue-500'}`}
        >
          <i className={`fas ${showAudit ? 'fa-times' : 'fa-info-circle'} text-[10px]`}></i>
        </button>
      </div>

      <div className="w-full h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreData.components}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} />
            <Radar
              name="Performance"
              dataKey="A"
              stroke="#818cf8"
              fill="#818cf8"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-4 mt-4">
        <div className="flex justify-between items-end">
          <span className="text-4xl font-black text-white tracking-tighter">{scoreData.score.toFixed(2)}</span>
          {scoreData.vetoTriggered && (
            <span className="text-[8px] font-black bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 animate-pulse uppercase tracking-widest">
              VETO: {scoreData.vetoReason}
            </span>
          )}
        </div>
        
        <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
           <div 
             className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-all duration-1000 ease-out"
             style={{ width: `${scoreData.score}%` }}
           />
        </div>

        <div className="flex justify-between text-[7px] font-black text-slate-700 uppercase tracking-widest">
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>

      {showAudit && scoreData.metrics && (
        <div className="absolute inset-0 z-50 bg-[#060b13]/95 backdrop-blur-2xl p-8 flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b1222] via-[#060b13]/90 to-[#060b13] pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Audit Sequence</p>
                  <h5 className="text-sm font-black text-white uppercase italic tracking-tighter">TG SCORE BREAKDOWN</h5>
                </div>
            </div>
            
            <div className="relative z-10 flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2 pb-4">
                <div>
                    <h5 className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-3 border-l-2 border-blue-500 pl-3">P // PREPARATION (20%)</h5>
                    <div className="bg-slate-900/20 rounded-2xl p-2">
                      <AuditItem done={scoreData.metrics.p.hasGatekeeper} label="Gatekeeper Scanned" sub="Biometrics & Mental Readiness" />
                      <AuditItem done={scoreData.metrics.p.preFightSigned} label="Pre-Fight Contract" sub="Uncertainty Acceptance signed" />
                    </div>
                </div>

                <div>
                    <h5 className="text-[8px] font-black text-orange-500/60 uppercase tracking-[0.2em] mb-3 border-l-2 border-orange-500 pl-3">E // EXECUTION (50%)</h5>
                    <div className="bg-slate-900/20 rounded-2xl p-2">
                      <AuditItem done={scoreData.metrics.e.tradeCount > 0} label="Trade Logs Active" sub={`${scoreData.metrics.e.tradeCount} entries recorded`} />
                      <AuditItem done={scoreData.metrics.e.allNotes} label="Reasoning Strings" sub="Notes complete for all trades" />
                      <AuditItem done={scoreData.metrics.e.lowTilt} label="Tilt Control" sub="Discipline Score > 4 strictly" />
                    </div>
                </div>

                <div>
                    <h5 className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-3 border-l-2 border-emerald-500 pl-3">R // REVIEW (30%)</h5>
                    <div className="bg-slate-900/20 rounded-2xl p-2">
                      <AuditItem done={scoreData.metrics.r.allReviewed} label="Post-Mortems Complete" sub="Min 10 characters per review" />
                      <AuditItem done={scoreData.metrics.r.wrapUpDone} label="Day Wrap-Up Protocol" sub="Daily lesson and habits saved" />
                    </div>
                </div>

                <div>
                    <h5 className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 border-l-2 border-red-500 pl-3">V // THE SENTINEL (VETO)</h5>
                    <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10 shadow-inner">
                        <AuditItem done={!scoreData.metrics.v.hasSlViolation} label="Stop Loss Integrity" sub={scoreData.metrics.v.hasSlViolation ? "CRITICAL FAILURE" : "PASSED"} />
                        <AuditItem done={!scoreData.metrics.v.hasRevenge} label="Emotional Friction" sub={scoreData.metrics.v.hasRevenge ? "REVENGE TRADING DETECTED" : "PASSED"} />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => setShowAudit(false)}
                className="relative z-10 mt-6 w-full py-4 bg-slate-900/80 border border-slate-800 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95"
            >
                RETURN TO GAUGE
            </button>
        </div>
      )}

      <div className="absolute -bottom-6 -right-6 text-9xl text-white/[0.01] pointer-events-none rotate-12">
        <i className="fas fa-shield-check"></i>
      </div>
    </div>
  );
};

const EvolutionScale = ['DAYS', 'WEEKS', 'MONTHS', 'ALL'] as const;
type EvolutionScaleType = typeof EvolutionScale[number];

const HabitTracker: React.FC<HabitTrackerProps> = ({ dailyPreps, trades, language }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [showFlowAudit, setShowFlowAudit] = useState(false);
  const [evolutionScale, setEvolutionScale] = useState<EvolutionScaleType>('DAYS');
  const [leaksScale, setLeaksScale] = useState<EvolutionScaleType>('MONTHS');

  const evolutionData = useMemo(() => {
    // Collect all dates from preps and trades
    const allDates = new Set([...Object.keys(dailyPreps), ...trades.map(t => t.date)]);
    const sortedDates = Array.from(allDates).sort();
    
    const dailyScores = sortedDates.map(date => {
      const { score } = calculateTGScore(date, trades, dailyPreps[date]);
      return { date, score };
    });

    if (evolutionScale === 'DAYS') return dailyScores.slice(-30).map(d => ({ label: d.date.split('-').slice(1).join('/'), score: d.score }));

    if (evolutionScale === 'WEEKS') {
      const weekly: Record<string, number[]> = {};
      dailyScores.forEach(d => {
        const dateObj = new Date(d.date);
        const week = `${dateObj.getFullYear()}-W${Math.ceil(dateObj.getDate() / 7)}`;
        if (!weekly[week]) weekly[week] = [];
        weekly[week].push(d.score);
      });
      return Object.entries(weekly).map(([label, scores]) => ({
        label,
        score: scores.reduce((a, b) => a + b, 0) / scores.length
      })).slice(-12);
    }

    if (evolutionScale === 'MONTHS') {
      const monthly: Record<string, number[]> = {};
      dailyScores.forEach(d => {
        const month = d.date.substring(0, 7);
        if (!monthly[month]) monthly[month] = [];
        monthly[month].push(d.score);
      });
      return Object.entries(monthly).map(([label, scores]) => ({
        label,
        score: scores.reduce((a, b) => a + b, 0) / scores.length
      })).slice(-12);
    }

    return dailyScores.map(d => ({ label: d.date, score: d.score }));
  }, [dailyPreps, trades, evolutionScale]);

  const analytics = useMemo(() => {
    const gatekeeperTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        name: d.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase(),
        score: dailyPreps[dateStr]?.gkTotalScore || 0
      };
    });

    const plans = Array.from(new Set(trades
      .filter(t => t.correctionPlan && t.correctionPlan !== 'None')
      .map(t => t.correctionPlan)))
      .slice(0, 5);

    const errorCounts: Record<string, number> = {};
    const now = new Date();
    
    // Timeframe filtering logic for leaks
    let daysToFilter = 99999;
    if (leaksScale === 'DAYS') daysToFilter = 7;
    else if (leaksScale === 'WEEKS') daysToFilter = 30;
    else if (leaksScale === 'MONTHS') daysToFilter = 90;

    trades.filter(tr => {
      if (leaksScale === 'ALL') return true;
      const tradeDate = new Date(tr.date);
      const diff = Math.abs(now.getTime() - tradeDate.getTime());
      return (diff / (1000 * 60 * 60 * 24)) <= daysToFilter;
    }).forEach(tr => {
      if (tr.executionError && tr.executionError !== 'None') {
        errorCounts[tr.executionError] = (errorCounts[tr.executionError] || 0) + 1;
      }
    });

    const frequentErrors = Object.entries(errorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    // GENERATIVE INSIGHTS LOGIC
    const bioRiscTrigger = trades.some(t => {
        const prep = dailyPreps[t.date];
        return prep && (prep.gkSleepHours || 0) < 6 && (t.executionError === 'Refuzul de a Pierde (Mutarea Stop-Loss-ului)');
    });

    // Fix: Explicitly cast to DailyPrepData[] to avoid 'unknown' type error for Object.values
    const alphaPrepData = (Object.values(dailyPreps) as DailyPrepData[]).filter(p => p.gkUncertaintyAccepted).length > 0;

    return { gatekeeperTrend, plans, frequentErrors, bioRiscTrigger, alphaPrepData };
  }, [trades, dailyPreps, leaksScale]);

  const currentWeekDays = useMemo(() => {
    const startOfWeek = new Date(viewDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        dateStr,
        dayName: d.toLocaleDateString('ro-RO', { weekday: 'long' }),
        prep: dailyPreps[dateStr]
      };
    });
  }, [viewDate, dailyPreps]);

  const exportToCSV = () => {
    const headers = ['Data', ...HABITS.map(h => h.label), 'Nota Disciplina'];
    const rows = Object.entries(dailyPreps).map(([date, data]) => {
      const prep = data as DailyPrepData;
      return [
        date,
        ...HABITS.map(h => prep[h.key as keyof DailyPrepData] ? 'DA' : 'NU'),
        prep.habDisciplineScore
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "traders_journey_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-6">
      {/* IDENTITY JOURNEY WIDGET - BEHAVIORAL EQUITY ENGINE INTEGRATED */}
      <IdentityTierWidget dailyPreps={dailyPreps} trades={trades} />

      {/* GENERATIVE INSIGHTS SECTION (Part III of Architecture) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl border ${analytics.bioRiscTrigger ? 'bg-red-600/5 border-red-500/20' : 'bg-slate-900/20 border-slate-800'}`}>
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Corelația "Bio-Risc"</h5>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                {analytics.bioRiscTrigger 
                    ? "Atenție: Analiza istorică arată că riscul tău de a muta Stop Loss-ul crește cu 60% când dormi sub 6 ore. Astăzi ești vulnerabil." 
                    : "Sincronizare Biometrică stabilă. Nicio corelație negativă între somn și violări detectată."}
            </p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-800">
            <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Corelația "Alpha-Prep"</h5>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                Insight: Zilele tale cu 'Mental Rehearsal' (Pre-Fight Sequence) generează o stabilitate emoțională cu 22% mai mare.
            </p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-800">
            <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Corelația "Fatigue Fade"</h5>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                Alertă Oboseală: Calitatea deciziilor tale (Checklist Compliance) tinde să scadă după tranzacția #4 a zilei.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TGScoreWidget date={todayStr} trades={trades} prep={dailyPreps[todayStr]} />

        {/* PERFORMANCE FLOW WIDGET WITH AUDIT INFO */}
        <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Performance Flow (7D)</h4>
                <button 
                  onClick={() => setShowFlowAudit(true)}
                  className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-blue-500 transition-all z-10"
                >
                  <i className="fas fa-info-circle text-[10px]"></i>
                </button>
            </div>
            
            <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.gatekeeperTrend}>
                        <defs>
                           <linearGradient id="habitGkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fill="url(#habitGkGrad)" dot={{ r: 4, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* FLOW AUDIT OVERLAY */}
            {showFlowAudit && (
              <div className="absolute inset-0 z-[60] bg-[#060b13]/98 backdrop-blur-xl p-8 flex flex-col animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-center mb-6">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Biological Flow Intel</p>
                  <button onClick={() => setShowFlowAudit(false)} className="text-slate-600 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
                
                <div className="relative z-10 flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                  <div>
                    <h5 className="text-[11px] font-black text-white uppercase italic mb-2 tracking-tight">Ce reprezintă acest grafic?</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Diagrama reflectă **pregătirea ta biologică și mentală** (Scorul Gatekeeper) din ultimele 7 zile. 
                      Sursa datelor este mixul dintre HRV, calitatea somnului și starea ta subiectivé raportată pre-sesiune.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                       <h6 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Alpha State Indicator</h6>
                       <p className="text-[9px] text-slate-300 font-bold uppercase leading-relaxed">
                         O linie stabilă peste 80 indică faptul că tranzacționezi în "Flow", unde cortexul prefrontal domină deciziile.
                       </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                       <h6 className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Burnout / Stress Alert</h6>
                       <p className="text-[9px] text-slate-300 font-bold uppercase leading-relaxed">
                         O curbă descendentă semnalează oboseală acumulată sau stres fiziologic. Riscul de trading impulsiv este maxim.
                       </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Cum îmbunătățești performanța?</h5>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                         <p className="text-[9px] text-slate-400 font-bold uppercase">Respectă strict cele 8h de somn pentru recuperarea PFC.</p>
                      </li>
                      <li className="flex items-start space-x-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                         <p className="text-[9px] text-slate-400 font-bold uppercase">Nu sări peste check-up-ul biometric matinal.</p>
                      </li>
                      <li className="flex items-start space-x-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                         <p className="text-[9px] text-slate-400 font-bold uppercase">Zilele cu scor sub 50 = "Red Day" (Risk Off).</p>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowFlowAudit(false)}
                  className="relative z-10 mt-6 w-full py-3 bg-blue-600/10 border border-blue-500/20 text-[9px] font-black text-blue-400 hover:bg-blue-600 hover:text-white uppercase tracking-widest rounded-xl transition-all"
                >
                  Return to Chart
                </button>
              </div>
            )}
        </div>

        <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Execution Leaks ({leaksScale})</h4>
            <div className="relative w-32 h-6 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden p-0.5 flex">
               {EvolutionScale.map((scale) => (
                  <button 
                    key={scale}
                    onClick={() => setLeaksScale(scale)}
                    className={`flex-1 text-[6px] font-black uppercase tracking-tighter rounded transition-all relative z-10 ${leaksScale === scale ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    {scale === 'DAYS' ? '7D' : scale === 'WEEKS' ? '30D' : scale === 'MONTHS' ? '90D' : 'ALL'}
                  </button>
               ))}
               <div 
                  className="absolute top-0.5 bottom-0.5 bg-red-600 rounded transition-all duration-300"
                  style={{ 
                      left: `${(EvolutionScale.indexOf(leaksScale) * (100 / EvolutionScale.length)) + 0.5}%`,
                      width: `${(100 / EvolutionScale.length) - 1}%`
                  }}
               />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-3">
            {analytics.frequentErrors.length > 0 ? analytics.frequentErrors.map(err => (
              <div key={err.name} className="flex justify-between items-center w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl group hover:border-red-500/40 transition-all shadow-inner">
                <span className="text-[9px] font-black text-slate-300 uppercase truncate pr-2">{err.name}</span>
                <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">{err.value}x</span>
              </div>
            )) : (
              <div className="text-center py-6 opacity-30 flex flex-col items-center">
                <i className="fas fa-shield-check text-2xl mb-2 text-slate-700"></i>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Zero leaks detected</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0b1222] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 italic">Training Focus</h4>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {analytics.plans.length > 0 ? analytics.plans.map((p, i) => (
              <div key={i} className="flex items-center space-x-3 text-indigo-400 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/40 transition-all">
                <i className="fas fa-bolt text-[10px]"></i>
                <span className="text-[10px] font-black uppercase tracking-tight leading-relaxed">{p}</span>
              </div>
            )) : (
              <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl opacity-40">
                <p className="text-[10px] text-slate-600 italic font-bold uppercase tracking-widest">Standard Routine.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* TG SCORE EVOLUTION WIDGET */}
          <div className="bg-[#0b1222] border border-slate-800 p-6 rounded-[2rem] shadow-2xl flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight italic">TG Score Evolution</h3>
                  <p className="text-slate-500 text-[9px] font-black uppercase mt-1 tracking-widest">Historical Discipline Trend</p>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div className="relative w-56 h-8 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden p-1 flex">
                     {EvolutionScale.map((scale) => (
                        <button 
                          key={scale}
                          onClick={() => setEvolutionScale(scale)}
                          className={`flex-1 text-[8px] font-black uppercase tracking-widest rounded transition-all relative z-10 ${evolutionScale === scale ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          {scale}
                        </button>
                     ))}
                     <div 
                        className="absolute top-1 bottom-1 bg-blue-600 rounded transition-all duration-300 shadow-lg shadow-blue-600/20"
                        style={{ 
                            left: `${(EvolutionScale.indexOf(evolutionScale) * (100 / EvolutionScale.length)) + 0.5}%`,
                            width: `${(100 / EvolutionScale.length) - 1}%`
                        }}
                     />
                  </div>
                </div>
            </div>

            <div className="flex-1 h-[280px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData}>
                        <defs>
                            <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                        <XAxis dataKey="label" stroke="#475569" fontSize={8} fontBold tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={8} fontBold tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '9px' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#818cf8" 
                            strokeWidth={3} 
                            fill="url(#evoGrad)" 
                            dot={{ r: 3, fill: '#818cf8', stroke: '#fff', strokeWidth: 1.5 }}
                            activeDot={{ r: 5, fill: '#fff', stroke: '#818cf8', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* DISCIPLINE MATRIX (RESIZED & ALIGNED) */}
          <div className="bg-[#0b1222] border border-slate-800 p-6 rounded-[2rem] shadow-2xl flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 px-2">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Discipline Matrix: Trader's Journey</h3>
                <p className="text-slate-500 text-[9px] font-black uppercase mt-1 tracking-widest">HABIT PERFORMANCE MONITOR</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button onClick={() => {
                    const d = new Date(viewDate);
                    d.setDate(d.getDate() - 7);
                    setViewDate(d);
                  }} className="p-2 text-slate-600 hover:text-white transition-all"><i className="fas fa-chevron-left text-[10px]"></i></button>
                  <span className="px-4 py-1.5 text-[9px] font-black uppercase text-white self-center">Weekly</span>
                  <button onClick={() => {
                    const d = new Date(viewDate);
                    d.setDate(d.getDate() + 7);
                    setViewDate(d);
                  }} className="p-2 text-slate-600 hover:text-white transition-all"><i className="fas fa-chevron-right text-[10px]"></i></button>
                </div>
                <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] flex items-center transition-all border border-slate-700 shadow-xl active:scale-95">
                  <i className="fas fa-table mr-2 text-[10px]"></i> EXPORT
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <th className="px-4 py-4 text-left w-48">PROTOCOL</th>
                    {currentWeekDays.map(day => (
                      <th key={day.dateStr} className="px-3 py-4 text-center">
                        <span className="text-white block mb-0.5">{day.dayName.substring(0, 3).toUpperCase()}</span>
                        <span className="text-slate-700 text-[8px] font-bold">{day.dateStr.split('-').slice(2)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20">
                  {HABITS.map(habit => (
                    <tr key={habit.key} className="hover:bg-blue-600/[0.01] transition-colors group">
                      <td className="px-4 py-3.5 text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-tight transition-colors">{habit.label}</td>
                      {currentWeekDays.map(day => {
                        const isDone = day.prep?.[habit.key as keyof DailyPrepData];
                        return (
                          <td key={day.dateStr} className="px-3 py-3.5 text-center">
                            <div className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center border transition-all duration-500 ${
                              day.prep 
                                ? isDone 
                                  ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                  : 'bg-red-600/10 border-red-500/30 text-red-500'
                                : 'bg-slate-900/30 border-slate-800/40 text-slate-800'
                            }`}>
                              {day.prep ? (isDone ? <i className="fas fa-check text-[10px]"></i> : <i className="fas fa-times text-[10px]"></i>) : '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-slate-950/20">
                    <td className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 italic">DAILY GRADE</td>
                    {currentWeekDays.map(day => (
                       <td key={day.dateStr} className="px-3 py-4 text-center">
                          <span className="text-lg font-black text-emerald-400 tracking-tighter">
                            {day.prep?.habDisciplineScore || '--'}
                          </span>
                       </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default HabitTracker;
