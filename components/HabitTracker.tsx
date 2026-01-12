import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { Trade, DailyPrepData } from '../types';

const BE_TIERS = [
  { name: 'RECRUIT', threshold: 0, color: 'text-white' },
  { name: 'BUILDER', threshold: 5000, color: 'text-blue-400' },
  { name: 'OPERATOR', threshold: 10000, color: 'text-purple-400' },
  { name: 'SENTINEL', threshold: 25000, color: 'text-emerald-400' }
];

// TG Score Logic (Măsurarea Disciplinei pe 5 Axe)
export const calculateDetailedTGScore = (date: string, trades: Trade[], prep?: DailyPrepData) => {
  const defaultData = [
    { subject: 'Prep', A: 0, fullMark: 100 },
    { subject: 'Execution', A: 0, fullMark: 100 },
    { subject: 'Review', A: 0, fullMark: 100 },
    { subject: 'Risk Integrity', A: 0, fullMark: 100 },
    { subject: 'Consistency', A: 0, fullMark: 100 },
  ];

  if (!prep) return { total: 0, data: defaultData, veto: false };

  const todayTrades = trades.filter(t => t.date === date);
  
  // 1. Prep Axis
  const prepVal = (prep.gkTotalScore * 0.6) + (prep.gkUncertaintyAccepted ? 40 : 0);
  
  // 2. Execution Axis
  const avgDisc = todayTrades.length > 0 
    ? (todayTrades.reduce((sum, t) => sum + (t.disciplineScore || 0), 0) / todayTrades.length) * 20 
    : 100;
  const executionVal = avgDisc;

  // 3. Review Axis
  const notesDone = todayTrades.length > 0 
    ? (todayTrades.filter(t => (t.notes?.length || 0) >= 15).length / todayTrades.length) * 50
    : 50;
  const wrapDone = prep.habJournalCompleted ? 50 : 0;
  const reviewVal = notesDone + wrapDone;

  // 4. Risk Integrity Axis
  // FIX: Updated comparison strings to match ExecutionErrorType definitions in types.ts
  const hasSlViolation = todayTrades.some(t => t.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)');
  const hasRevenge = todayTrades.some(t => t.executionError === '6. Revenge Trading');
  const riskVal = (hasSlViolation || hasRevenge) ? 0 : 100;

  // 5. Consistency Axis (Simulăm stabilitatea pe baza profitului vs risc)
  const totalPnl = todayTrades.reduce((s,t) => s + t.pnlNet, 0);
  const consistencyVal = totalPnl < 0 && Math.abs(totalPnl) > (prep.gkDailyRiskAmount || 1000) ? 20 : 90;

  const data = [
    { subject: 'Prep', A: prepVal, fullMark: 100 },
    { subject: 'Execution', A: executionVal, fullMark: 100 },
    { subject: 'Review', A: reviewVal, fullMark: 100 },
    { subject: 'Risk Integrity', A: riskVal, fullMark: 100 },
    { subject: 'Consistency', A: consistencyVal, fullMark: 100 },
  ];

  const total = Math.round(data.reduce((s, d) => s + d.A, 0) / 5);

  return { total, data, veto: hasSlViolation || hasRevenge };
};

// Legacy support for other components
export const calculateTGScore = (date: string, trades: Trade[], prep?: DailyPrepData) => {
    const res = calculateDetailedTGScore(date, trades, prep);
    return { score: res.total, vetoTriggered: res.veto };
};

const HabitTracker: React.FC = () => {
  const { trades = [], dailyPreps, selectedAccountId } = useAppStore(useShallow(state => ({
    trades: state.trades,
    dailyPreps: state.dailyPreps,
    selectedAccountId: state.selectedAccountId
  })));

  const [evolRange, setEvolRange] = useState<'DAYS' | 'WEEKS' | 'MONTHS' | 'ALL'>('DAYS');

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrep = dailyPreps[todayStr];
  
  const detailedScore = useMemo(() => 
    calculateDetailedTGScore(todayStr, activeTrades, todayPrep), 
  [todayStr, activeTrades, todayPrep]);

  // Calcul Behavioral Equity
  const beStats = useMemo(() => {
    const totalPnl = activeTrades.reduce((sum, t) => sum + t.pnlNet, 0);
    const avgDiscipline = activeTrades.length > 0 
      ? activeTrades.reduce((sum, t) => sum + t.disciplineScore, 0) / activeTrades.length 
      : 5;
    
    const reputationScore = Math.max(0, Math.round((totalPnl > 0 ? totalPnl * 0.1 : 0) + (avgDiscipline * 150)));
    const currentTier = [...BE_TIERS].reverse().find(t => reputationScore >= t.threshold) || BE_TIERS[0];
    const nextTier = BE_TIERS[BE_TIERS.indexOf(currentTier) + 1] || currentTier;
    const progress = nextTier === currentTier ? 100 : ((reputationScore - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100;

    // FIX: Updated comparison string for critical violations to match ExecutionErrorType
    const criticalViolations = activeTrades.filter(t => t.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)').length;
    
    return {
        reputationScore,
        tier: currentTier,
        nextTier,
        progress,
        momentum: 1.0,
        violations: criticalViolations,
        daysSinceError: 999
    };
  }, [activeTrades]);

  const flowData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      return {
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        score: calculateDetailedTGScore(ds, activeTrades, dailyPreps[ds]).total
      };
    });
  }, [activeTrades, dailyPreps]);

  const evolutionData = useMemo(() => {
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const ds = d.toISOString().split('T')[0];
      return {
        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        score: calculateDetailedTGScore(ds, activeTrades, dailyPreps[ds]).total
      };
    });
  }, [activeTrades, dailyPreps]);

  const matrixDays = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    
    return Array.from({ length: 5 }, (_, i) => {
      const curr = new Date(start);
      curr.setDate(start.getDate() + i);
      const ds = curr.toISOString().split('T')[0];
      const prep = dailyPreps[ds];
      const dayTrades = activeTrades.filter(t => t.date === ds);
      
      return {
        label: curr.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase(),
        num: String(curr.getDate()).padStart(2, '0'),
        ds,
        checks: {
          noGo: prep?.habNoGoRespected,
          preMarket: !!prep?.gkVerdict && prep.gkVerdict !== 'None',
          // FIX: Updated comparison strings for stopLoss and noRevenge to match ExecutionErrorType
          stopLoss: !dayTrades.some(t => t.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)'),
          noRevenge: !dayTrades.some(t => t.executionError === '6. Revenge Trading'),
          journal: prep?.habJournalCompleted
        },
        grade: calculateDetailedTGScore(ds, activeTrades, prep).total
      };
    });
  }, [activeTrades, dailyPreps]);

  return (
    <div className="space-y-6 animate-in fade-in duration-1000 pb-20">
      
      {/* 1. BEHAVIORAL EQUITY ENGINE HEADER */}
      <div className="bg-[#050811] border border-slate-800/40 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-16 relative z-10">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1">BEHAVIORAL EQUITY ENGINE</h1>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">IDENTITY TIER SYSTEM // REPUTAȚIE DINAMICĂ PROTOCOL</p>
          </div>
          
          <div className="flex space-x-6 items-center">
            <div className="bg-black/60 border border-slate-800 p-4 rounded-3xl min-w-[140px] text-center shadow-inner group transition-all hover:border-blue-500/30">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">REPUTATION SCORE</p>
               <p className="text-3xl font-black text-white italic tracking-tighter">{beStats.reputationScore} <span className="text-[10px] text-slate-700 not-italic uppercase ml-1">BE</span></p>
            </div>
            <div className="bg-black/60 border border-slate-800 p-4 rounded-3xl min-w-[100px] text-center shadow-inner group transition-all hover:border-blue-500/30">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">MOMENTUM</p>
               <p className="text-3xl font-black text-blue-500 italic tracking-tighter">{beStats.momentum.toFixed(1)}x</p>
            </div>
            <div className="bg-black/60 border border-slate-800 p-4 rounded-3xl min-w-[160px] text-center shadow-inner group transition-all hover:border-blue-500/30">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">CURRENT TIER</p>
               <p className="text-xl font-black text-orange-500 italic tracking-tighter uppercase underline decoration-orange-500/20">THE {beStats.tier.name}</p>
            </div>
          </div>
        </div>

        {/* TIER PROGRESS BAR */}
        <div className="relative mb-20 px-4">
           <div className="h-20 bg-[#080d19]/40 rounded-3xl border border-slate-800/40 relative overflow-hidden p-6 flex items-center">
              <div className="absolute inset-0 flex justify-between px-10 items-center">
                {BE_TIERS.map((t, idx) => (
                  <div key={t.name} className="flex flex-col items-center relative z-10">
                     <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-2">{t.threshold / 1000}K BE</span>
                     <p className={`text-[10px] font-black uppercase tracking-widest ${beStats.tier.name === t.name ? 'text-white' : 'text-slate-800'}`}>{t.name}</p>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 transition-all duration-[2000ms]" style={{ width: `${beStats.progress}%` }}></div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
           <div className="lg:col-span-1 flex items-center justify-center">
              <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase text-center p-2 leading-none shadow-xl">PROBATION</div>
           </div>
           <div className="lg:col-span-9 bg-[#080d19]/60 border border-slate-800/50 p-8 rounded-[2.5rem] flex items-center shadow-inner">
               <p className="text-sm font-black text-white uppercase tracking-[0.1em]">
                  OPERATIONAL INTEL: <span className="text-slate-400 font-medium italic normal-case ml-3">"Ești încă vulnerabil. Sistemul nu are încredere în tine. Dovedește disciplina."</span>
               </p>
           </div>
           <div className="lg:col-span-2 bg-[#080d19]/80 border border-slate-800/60 p-6 rounded-[2.5rem] shadow-xl">
              <div className="space-y-4">
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-2">ALGORITHM STATUS</p>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">CRITICAL VIOLATIONS:</span>
                    <span className="text-sm font-black text-emerald-500">{beStats.violations}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">DAYS SINCE SL ERROR:</span>
                    <span className="text-sm font-black text-emerald-500">{beStats.daysSinceError}D</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. CORRELATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CorrelationCard title={'CORELAȚIA "BIO-RISC"'} text="Sincronizare Biometrică stabilă. Nicio corelație negativă între somn și violări detectată." />
          <CorrelationCard title={'CORELAȚIA "ALPHA-PREP"'} text="Insight: Zilele tale cu 'Mental Rehearsal' (Pre-Fight Sequence) generează o stabilitate emoțională cu 22% mai mare." />
          <CorrelationCard title={'CORELAȚIA "FATIGUE FADE"'} text="Alertă Oboseală: Calitatea deciziilor tale (Checklist Compliance) tinde să scadă după tranzacția #4 a zilei." isAlert />
      </div>

      {/* 5. REDESIGNED TG SCORE GRID (SENTINEL STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* RADAR WIDGET - 8 COLS */}
        <div className="lg:col-span-8 bg-[#0b1222] border border-slate-800/60 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                 <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">TG SCORE</h2>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">SENTINEL DISCIPLINE ENGINE</p>
              </div>
              <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-white transition-all shadow-xl">
                 <i className="fas fa-info text-[10px]"></i>
              </button>
           </div>

           {/* RADAR CHART CENTER */}
           <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-[320px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={detailedScore.data}>
                       <PolarGrid stroke="#1e293b" />
                       <PolarAngleAxis 
                         dataKey="subject" 
                         tick={{ fill: '#475569', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} 
                       />
                       <Radar
                         name="Score"
                         dataKey="A"
                         stroke="#818cf8"
                         strokeWidth={2}
                         fill="#818cf8"
                         fillOpacity={0.15}
                       />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* SCORE VALUE & PROGRESS BAR BOTTOM */}
           <div className="space-y-6">
              <p className="text-7xl font-black text-white italic tracking-tighter leading-none">
                {(detailedScore.total / 10).toFixed(2)}
              </p>
              
              <div className="space-y-2">
                 <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800/50">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-[1500ms]" 
                      style={{ width: `${detailedScore.total}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-slate-700 uppercase tracking-widest px-1">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                    <span>60</span>
                    <span>80</span>
                    <span>100</span>
                 </div>
              </div>
           </div>
           
           <i className="fas fa-shield-halved absolute -bottom-10 -right-10 text-[260px] text-white/[0.01] pointer-events-none"></i>
        </div>

        {/* RIGHT WIDGETS - 4 COLS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <MetricBox title="PERFORMANCE FLOW (7D)">
                <div className="h-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={flowData}>
                        <defs>
                            <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFlow)" dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </MetricBox>

            <MetricBox title="EVOLUTION STATUS">
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 flex items-center justify-center mb-4">
                       <i className="fas fa-arrow-up text-blue-500"></i>
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">STABILITY INCREASE</p>
                    <p className="text-2xl font-black text-emerald-500">+12.4%</p>
                </div>
            </MetricBox>
        </div>
      </div>

      {/* 6. EVOLUTION CHART */}
      <div className="bg-[#0b1222] border border-slate-800/40 rounded-[3rem] p-8 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">TG SCORE EVOLUTION</h4>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">HISTORICAL DISCIPLINE TREND</p>
            </div>
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 z-10">
                {(['DAYS', 'WEEKS', 'MONTHS', 'ALL'] as const).map(r => (
                    <button key={r} onClick={() => setEvolRange(r)} className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${evolRange === r ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}>{r}</button>
                ))}
            </div>
        </div>
        <div className="h-[350px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorEvol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={10} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fill="url(#colorEvol)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7. DISCIPLINE MATRIX */}
      <div className="bg-[#0b1222] border border-slate-800/40 rounded-[3rem] p-10 shadow-xl">
        <div className="flex justify-between items-center mb-12">
            <div>
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">DISCIPLINE MATRIX: TRADER'S JOURNEY</h4>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">HABIT PERFORMANCE MONITOR</p>
            </div>
            <div className="flex space-x-2">
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 items-center">
                    <button className="p-1.5 text-[8px] text-slate-600 hover:text-white"><i className="fas fa-chevron-left"></i></button>
                    <span className="px-3 text-[8px] font-black text-white uppercase tracking-widest">WEEKLY</span>
                    <button className="p-1.5 text-[8px] text-slate-600 hover:text-white"><i className="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                   <th className="pb-8 font-black">PROTOCOL</th>
                   {matrixDays.map(d => (
                     <th key={d.ds} className="pb-8 text-center">
                        <span className="block mb-1">{d.label}</span>
                        <span className="text-slate-700 text-[11px]">{d.num}</span>
                     </th>
                   ))}
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800/40">
                {[
                  { label: 'RESPECTAT "NO-GO" RULE?', key: 'noGo' },
                  { label: 'ANALIZĂ PRE-MARKET COMPLETĂ?', key: 'preMarket' },
                  { label: 'ZERO ERORI STOP LOSS?', key: 'stopLoss' },
                  { label: 'FĂRĂ REVENGE TRADING?', key: 'noRevenge' },
                  { label: 'JURNAL COMPLETAT?', key: 'journal' }
                ].map(row => (
                  <tr key={row.key} className="group">
                    <td className="py-6 text-[10px] font-black text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{row.label}</td>
                    {matrixDays.map(d => {
                      const val = (d.checks as any)[row.key];
                      return (
                        <td key={d.ds} className="py-6 text-center">
                           <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center border ${val === true ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : val === false ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-900 border-slate-800 text-slate-800'}`}>
                              <i className={`fas ${val === true ? 'fa-check' : val === false ? 'fa-times' : 'fa-circle'} text-[8px]`}></i>
                           </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                   <td className="py-8 text-[11px] font-black text-emerald-500 uppercase italic tracking-tighter">DAILY GRADE</td>
                   {matrixDays.map(d => (
                     <td key={d.ds} className="py-8 text-center">
                        <span className={`text-2xl font-black italic tracking-tighter ${d.grade > 0 ? 'text-white' : 'text-slate-800'}`}>
                           {d.grade > 0 ? (d.grade / 10).toFixed(1) : '--'}
                        </span>
                     </td>
                   ))}
                </tr>
             </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const CorrelationCard = ({ title, text, isAlert }: { title: string, text: string, isAlert?: boolean }) => (
    <div className={`bg-[#050811] border border-slate-800/40 p-8 rounded-[2.5rem] transition-all hover:border-slate-700/60 group shadow-xl ${isAlert ? 'ring-1 ring-orange-500/10' : ''}`}>
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 group-hover:text-blue-400 transition-colors">
            {title}
        </h4>
        <p className={`text-[11px] font-medium leading-relaxed italic ${isAlert ? 'text-slate-300' : 'text-slate-400'}`}>
            {text}
        </p>
    </div>
);

const MetricBox = ({ title, subtitle, children }: any) => (
    <div className="bg-[#0b1222] border border-slate-800/40 rounded-[2.5rem] p-8 shadow-xl flex flex-col relative flex-1 min-h-[240px]">
      <div>
        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{title}</h4>
        {subtitle && <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 relative">
        {children}
      </div>
    </div>
);

export default HabitTracker;