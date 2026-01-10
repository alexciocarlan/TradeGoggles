
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { Trade, Account } from '../types';
import { ALL_SETUPS } from '../data/setups';
import { INSTRUMENT_MULTIPLIERS } from '../ProtocolEngine';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSTRUMENTS_LIST = ['NQ', 'ES', 'CL', 'GC', 'EURUSD'];
const ERRORS = ['None', 'None', 'None', 'FOMO', 'Revenge Trading', 'Hesitation'];
const SESSIONS = ['NY Morning', 'NY Afternoon', 'London', 'Asia'];

const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const { importBatchTrades, accounts, selectedAccountId, addNotification } = useAppStore(useShallow(state => ({
    importBatchTrades: state.importBatchTrades,
    accounts: state.accounts,
    selectedAccountId: state.selectedAccountId,
    addNotification: state.addNotification
  })));

  const [amount, setAmount] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ time: number, count: number } | null>(null);

  if (!isOpen) return null;

  const targetAccountId = selectedAccountId !== 'all' ? selectedAccountId : (accounts[0]?.id || null);
  const activeAccount = accounts.find(a => a.id === targetAccountId);

  const generateTrades = (count: number, account?: Account): Trade[] => {
    const generated: Trade[] = [];
    const now = new Date();
    
    // Extragere setări de risc sau default-uri stricte
    const risk = account?.riskSettings;
    const instrument = risk?.preferredInstrument || 'MNQ';
    const multiplier = (INSTRUMENT_MULTIPLIERS as any)[instrument] || 2;
    const commPerSide = risk?.commPerContract || 2.40;

    // Calcul logică Sizing/Risk similar cu RiskManagement.tsx
    const dailyRiskLimit = risk?.maxDailyRisk || 500;
    const tradesPerDay = risk?.maxTradesPerDay || 5;
    const riskPerTradeAmount = Math.round(dailyRiskLimit / tradesPerDay);
    
    let lots = 1;
    let slPts = 25;
    
    if (risk?.calcMode === 'fixedContracts') {
        lots = risk.maxContractsPerTrade || 1;
        slPts = riskPerTradeAmount / (lots * multiplier);
    } else {
        slPts = risk?.fixedSlPoints || 25;
        lots = Math.floor(riskPerTradeAmount / (slPts * multiplier)) || 1;
    }

    const rr = risk?.rrRatio || 2;
    const tpPts = risk?.targetMode === 'fixedTargetPoints' ? (risk.fixedTargetPoints || 50) : (slPts * rr);

    // Valorile brute pentru P&L (respectând R:R setat)
    const winAmountNet = (tpPts * multiplier * lots) - (lots * commPerSide * 2);
    const lossAmountNet = -(slPts * multiplier * lots) - (lots * commPerSide * 2);

    for (let i = 0; i < count; i++) {
        const daysBack = Math.floor(Math.random() * 365);
        const date = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        
        // Random outcome bazat pe un win rate rezonabil de 52%
        const isWin = Math.random() > 0.48; 
        const pnlNet = isWin ? winAmountNet : lossAmountNet;
        const commissions = lots * commPerSide * 2;
        const pnlBrut = pnlNet + commissions;
        
        const setup = ALL_SETUPS[Math.floor(Math.random() * ALL_SETUPS.length)];
        const entryPrice = 15000 + Math.random() * 2000;
        const exitPrice = isWin 
            ? (Math.random() > 0.5 ? entryPrice + tpPts : entryPrice - tpPts)
            : (Math.random() > 0.5 ? entryPrice - slPts : entryPrice + slPts);

        generated.push({
            id: `bench-${Date.now()}-${i}`,
            accountId: account?.id || 'demo-acc',
            date: dateStr,
            instrument: instrument,
            type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
            status: isWin ? 'WIN' : 'LOSS',
            pnlNet: parseFloat(pnlNet.toFixed(2)),
            pnlBrut: parseFloat(pnlBrut.toFixed(2)),
            commissions: parseFloat(commissions.toFixed(2)),
            setup: setup.name,
            setupGrade: isWin ? (Math.random() > 0.6 ? 'A+' : 'B') : 'C',
            session: SESSIONS[Math.floor(Math.random() * SESSIONS.length)] as any,
            entryPrice: parseFloat(entryPrice.toFixed(2)),
            exitPrice: parseFloat(exitPrice.toFixed(2)),
            stopLoss: parseFloat((entryPrice - slPts).toFixed(2)),
            takeProfit: parseFloat((entryPrice + tpPts).toFixed(2)),
            contracts: lots,
            rrRealized: isWin ? parseFloat(rr.toFixed(2)) : -1,
            disciplineScore: isWin ? (Math.floor(Math.random() * 2) + 4) : (Math.floor(Math.random() * 3) + 1),
            executionError: isWin ? 'None' : (ERRORS[Math.floor(Math.random() * ERRORS.length)] as any),
            correctionPlan: 'None',
            mentalState: 'Calm',
            notes: `Stress test trade using account ${account?.name || 'Default'} parameters. Lots: ${lots}, R:R: 1:${rr.toFixed(1)}.`,
            tags: ['#BENCHMARK', '#STRESSTEST'],
            screenshots: [],
            isChallenge: account?.type === 'Apex',
            isPartOfPlan: true,
            isAccordingToPlan: 'DA',
            condition1Met: true, condition2Met: true, condition3Met: true,
            bias: 'Neutral', dailyNarrative: 'Benchmark simulation',
            pdValueRelationship: 'None', marketCondition: 'None', priceVsPWeek: 'None',
            mediumTermTrend: 'None', onRangeVsPDay: 'None', onInventory: 'None', pdExtremes: 'None',
            untestedPdVA: 'None', spHigh: '', spLow: '', gapHigh: '', gapLow: '', priorVPOC: 'None',
            onVsSettlement: 'None', hypoSession: '', hypoThen: 'None', zoneOfInterest: '',
            continuationTrigger: '', reversalTrigger: '', invalidationPoint: '', exitLevel: '',
            openType: 'None', ibWidth: 'Normal', rangeExtension: 'None', htfMs: 'Bullish', newsImpact: 'None'
        });
    }
    return generated;
  };

  const runBenchmark = async () => {
    if (!targetAccountId) {
        setError("Te rog selectează un cont activ din listă pentru a prelua parametrii de risc.");
        return;
    }
    setIsRunning(true);
    setResult(null);
    setError(null);
    
    setTimeout(async () => {
        try {
            const generatedTrades = generateTrades(amount, activeAccount);
            const timeTaken = await importBatchTrades(generatedTrades);
            setResult({ time: timeTaken, count: amount });
            addNotification('success', `Benchmark complet: ${amount} tranzacții simulate folosind profilul de risc "${activeAccount?.name}".`);
        } catch (error: any) {
            console.error("Benchmark failed:", error);
            setError(error.message);
        } finally {
            setIsRunning(false);
        }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#0b1222] border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                <i className="fas fa-tachometer-alt text-xl"></i>
            </div>
            <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">System Benchmark</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stress Test & Risk Simulation</p>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Account</span>
                   <span className="text-[10px] font-black text-blue-400 uppercase">{activeAccount?.name || 'None'}</span>
                </div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Simulation Volume</label>
                <div className="flex items-center space-x-4">
                    <input 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="100" 
                        value={amount} 
                        onChange={(e) => setAmount(parseInt(e.target.value))} 
                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        disabled={isRunning}
                    />
                    <span className="text-2xl font-black text-white w-20 text-right">{amount}</span>
                </div>
                <p className="text-[9px] text-slate-600 mt-4 italic leading-relaxed">
                    Generates trades based on your <strong>Order Size</strong>, <strong>R:R</strong>, and <strong>Risk Management</strong> settings. This tests how your dashboard scales with heavy data load.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-shake">
                    <i className="fas fa-exclamation-circle mr-2"></i> {error}
                </div>
            )}

            {result && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status: CALIBRATED</p>
                        <p className="text-xs text-emerald-300 font-bold">Generated {result.count} trades</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-white italic tracking-tighter">{(result.time).toFixed(0)}ms</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Processing Time</p>
                    </div>
                </div>
            )}

            <div className="flex space-x-3 pt-4">
                <button onClick={onClose} disabled={isRunning} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all">Close</button>
                <button 
                    onClick={runBenchmark} 
                    disabled={isRunning}
                    className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center space-x-2 ${isRunning ? 'bg-slate-700 text-slate-500 cursor-wait' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 active:scale-95'}`}
                >
                    {isRunning && <i className="fas fa-circle-notch fa-spin"></i>}
                    <span>{isRunning ? 'SIMULATING...' : 'LAUNCH BENCHMARK'}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkModal;
