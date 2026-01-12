import React, { useMemo } from 'react';
import { DailyPrepData, Trade } from '../types';

interface SentinelScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  prep?: DailyPrepData;
  todayTrades: Trade[];
  score: number;
  vetoTriggered?: boolean;
  vetoReason?: string;
}

const AuditItem = ({ checked, label, sub, partial = false }: { checked: boolean, label: string, sub: string, partial?: boolean }) => (
  <div className="flex items-center space-x-5 py-4 group">
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
      checked 
        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
        : partial 
          ? 'bg-orange-500/20 border-orange-500 text-orange-500' 
          : 'bg-slate-900 border-slate-700 text-slate-800'
    }`}>
      {checked ? <i className="fas fa-check text-[10px]"></i> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>}
    </div>
    <div>
      <p className={`text-[11px] font-black uppercase tracking-widest ${checked ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'} transition-colors`}>{label}</p>
      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{sub}</p>
    </div>
  </div>
);

const AuditSection = ({ title, weight, color, children }: { title: string, weight: string, color: string, children?: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-3 mb-2">
      <div className={`w-1 h-4 rounded-full ${color}`}></div>
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${color.replace('bg-', 'text-')}`}>{title} ({weight})</p>
    </div>
    <div className="bg-slate-900/20 rounded-[2rem] border border-slate-800/40 p-2 divide-y divide-slate-800/40">
      <div className="px-6">
        {children}
      </div>
    </div>
  </div>
);

const SentinelScoreModal: React.FC<SentinelScoreModalProps> = ({ isOpen, onClose, prep, todayTrades, score, vetoTriggered, vetoReason }) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
    const isGatekeeperDone = !!prep?.gkVerdict && prep.gkVerdict !== 'None';
    const isPreFightSigned = !!prep?.gkUncertaintyAccepted;
    const hasTrades = todayTrades.length > 0;
    const allNotesDone = hasTrades && todayTrades.every(t => (t.notes?.length || 0) > 10);
    const avgDiscipline = hasTrades ? todayTrades.reduce((s, t) => s + t.disciplineScore, 0) / todayTrades.length : 0;
    const tiltControl = avgDiscipline >= 4;
    const wrapUpDone = !!prep?.habJournalCompleted;
    
    // FIX: Updated comparison strings to match ExecutionErrorType definitions in types.ts
    const hasSlViolation = todayTrades.some(t => t.executionError === '4. Stop-Loss Sabotage (Moving SL to BE)');
    const hasRevenge = todayTrades.some(t => t.executionError === '6. Revenge Trading');

    return {
      isGatekeeperDone,
      isPreFightSigned,
      hasTrades,
      tradeCount: todayTrades.length,
      allNotesDone,
      tiltControl,
      wrapUpDone,
      slIntegrity: !hasSlViolation,
      emotionalFriction: !hasRevenge
    };
  }, [prep, todayTrades]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="bg-[#0b1222] border border-slate-800/60 rounded-[3rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
        <div className="p-10 pb-6 flex justify-between items-start shrink-0">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em] mb-1">Live Protocol Scan</p>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">TG ADVISOR AUDIT</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pt-4 space-y-10">
          <AuditSection title="P // PREPARATION" weight="20%" color="bg-blue-600">
            <AuditItem checked={stats.isGatekeeperDone} label="GATEKEEPER SCANNED" sub="BIOMETRICS READY" />
            <AuditItem checked={stats.isPreFightSigned} label="PRE-FIGHT CONTRACT" sub="UNCERTAINTY SIGNED" />
          </AuditSection>
          <AuditSection title="E // EXECUTION" weight="50%" color="bg-orange-500">
            <AuditItem checked={stats.hasTrades} label="TRADELOGS ACTIVE" sub={`${stats.tradeCount} ENTRIES`} />
            <AuditItem checked={stats.tiltControl} label="TILT CONTROL" sub="DISCIPLINE > 4" />
          </AuditSection>
          <AuditSection title="R // REVIEW" weight="30%" color="bg-emerald-500">
            <AuditItem checked={stats.allNotesDone} label="POST-MORTEMS" sub="MIN 10 CHARS" />
            <AuditItem checked={stats.wrapUpDone} label="DAY WRAP-UP" sub="HABITS SAVED" />
          </AuditSection>
          <AuditSection title="V // THE SENTINEL (VETO)" weight="MANDATORY" color="bg-red-600">
             <AuditItem checked={stats.slIntegrity} label="SL INTEGRITY" sub={stats.slIntegrity ? "PASSED" : "FAILED"} />
             <AuditItem checked={stats.emotionalFriction} label="EMOTIONAL FRICTION" sub={stats.emotionalFriction ? "PASSED" : "FAILED"} />
          </AuditSection>
        </div>

        <div className="p-10 pt-0 shrink-0">
          <button onClick={onClose} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl">CONTINUE PROTOCOL</button>
        </div>
      </div>
    </div>
  );
};

export default SentinelScoreModal;