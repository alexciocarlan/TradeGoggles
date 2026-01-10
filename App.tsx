
import React, { useState, useMemo, useEffect, lazy, Suspense, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from './AppContext';
import { useShallow } from 'zustand/react/shallow';
import ErrorBoundary from './components/ErrorBoundary';
import { getMarketTickers, ParsedRithmicResult } from './geminiService';
import { calculateTiltRisk } from './ProtocolEngine';
import { Trade, DailyPrepData, Account } from './types';
import { calculateTGScore } from './components/HabitTracker';
import useDataManagement from './hooks/useDataManagement';

const Dashboard = lazy(() => import('./components/Dashboard'));
const TradeLog = lazy(() => import('./components/TradeLog'));
const TradeDetail = lazy(() => import('./components/TradeDetail'));
const DailyJournal = lazy(() => import('./components/DailyJournal'));
const AccountManagement = lazy(() => import('./components/AccountManagement'));
const ChallengeDashboard = lazy(() => import('./components/ChallengeDashboard')); 
const Playbooks = lazy(() => import('./components/Playbooks'));
const PlaybookEditor = lazy(() => import('./components/PlaybookEditor'));
const ReportsPage = lazy(() => import('./components/ReportsPage'));
const Backtesting = lazy(() => import('./components/Backtesting'));
const HabitTracker = lazy(() => import('./components/HabitTracker')); 
const RiskManagement = lazy(() => import('./components/RiskManagement'));
const FAQ = lazy(() => import('./components/FAQ'));
const Calendar = lazy(() => import('./components/Calendar'));
const Analytics = lazy(() => import('./components/Analytics'));
const EconomicCalendar = lazy(() => import('./components/EconomicCalendar'));
const CMECalendar = lazy(() => import('./components/CMECalendar'));
import MarketHubBar from './components/MarketHubBar';
import { NewTradeModal } from './components/NewTradeModal';
import NewAccountModal from './components/NewAccountModal';
import SentinelScoreModal from './components/SentinelScoreModal';
import RithmicSyncModal from './components/RithmicSyncModal';

const LoadingComponent: React.FC = () => (
  <div className="flex flex-1 items-center justify-center min-h-[300px] bg-[#0b1222]/50 rounded-[2.5rem] p-8">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

const SidebarLink = ({ to, icon, label, isSubItem = false }: { to: string; icon: string; label: string, isSubItem?: boolean }) => {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  return (
    <Link to={to} className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all mb-0.5 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'} ${isSubItem ? 'ml-4 py-1.5' : ''}`}>
      <i className={`fas ${icon} w-5 text-center text-[10px]`}></i>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] truncate">{label}</span>
    </Link>
  );
};

const NavSectionHeader = ({ title, icon, isOpen, onToggle }: { title: string, icon: string, isOpen: boolean, onToggle: () => void }) => (
  <button onClick={onToggle} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${isOpen ? 'text-white border border-white/10 bg-slate-900/40' : 'text-slate-400 hover:text-slate-100'}`}>
    <div className="flex items-center space-x-3">
      <i className={`fas ${icon} w-5 text-center text-[11px] ${isOpen ? 'text-blue-400' : 'text-slate-600'}`}></i>
      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{title}</span>
    </div>
    <i className={`fas fa-chevron-down text-[8px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
  </button>
);

const AppContent: React.FC = () => {
  const trades = useAppStore(state => state.trades || []);
  const accounts = useAppStore(state => state.accounts || []);
  const dailyPreps = useAppStore(state => state.dailyPreps || {});
  const backtestSessions = useAppStore(state => state.backtestSessions || []);
  const playbooks = useAppStore(state => state.playbooks || []);
  
  const language = useAppStore(state => state.language || 'ro');
  const selectedAccountId = useAppStore(state => state.selectedAccountId || 'all');
  const isDarkMode = useAppStore(state => state.isDarkMode !== false);
  const riskManagerEnabled = useAppStore(state => state.riskManagerEnabled);

  const {
    addTrade, updateTrade, deleteTrade,
    addAccount,
    saveDailyPrep, saveWeeklyPrep, saveDailyNote, savePlaybook,
    addBacktestSession,
    setLanguage, setRiskManagerEnabled,
    loadDailyPreps, loadWeeklyPreps, loadDailyNotes, addNotification
  } = useAppStore(useShallow(state => ({
    addTrade: state.addTrade,
    updateTrade: state.updateTrade,
    deleteTrade: state.deleteTrade,
    addAccount: state.addAccount,
    saveDailyPrep: state.saveDailyPrep,
    saveWeeklyPrep: state.saveWeeklyPrep,
    saveDailyNote: state.saveDailyNote,
    savePlaybook: state.savePlaybook,
    addBacktestSession: state.addBacktestSession,
    setLanguage: state.setLanguage,
    setRiskManagerEnabled: state.setRiskManagerEnabled,
    loadDailyPreps: state.loadDailyPreps,
    loadWeeklyPreps: state.loadWeeklyPreps,
    loadDailyNotes: state.loadDailyNotes,
    addNotification: state.addNotification
  })));

  const { handleBackup, handleImport, fileImportRef } = useDataManagement();

  const { data: marketTickers, isLoading: loadingTickers } = useQuery({
    queryKey: ['marketTickers'], queryFn: ({ signal }) => getMarketTickers(signal), refetchInterval: 5 * 60 * 1000, staleTime: 4 * 60 * 1000
  });

  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSentinelModalOpen, setIsSentinelModalOpen] = useState(false);
  const [isRithmicModalOpen, setIsRithmicModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ dashboard: true, journey: true });

  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrep = dailyPreps[todayStr];
  const todayTrades = activeTrades.filter(t => t.date === todayStr);
  const scoreData = useMemo(() => calculateTGScore(todayStr, activeTrades, todayPrep), [todayStr, activeTrades, todayPrep]);
  const tiltRisk = useMemo(() => calculateTiltRisk(todayTrades, activeAccount, todayPrep), [todayTrades, activeAccount, todayPrep]);
  const protocolValidated = useMemo(() => !!todayPrep?.gkVerdict && todayPrep.gkVerdict !== 'None', [todayPrep]);

  useEffect(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    loadDailyPreps(currentMonth); loadDailyNotes(currentMonth); loadWeeklyPreps();
  }, [loadDailyPreps, loadWeeklyPreps, loadDailyNotes]);

  // Memoize trades by date for efficient lookup
  const tradesByDate = useMemo(() => {
    return activeTrades.reduce((acc, t) => {
      (acc[t.date] = acc[t.date] || []).push(t);
      return acc;
    }, {} as Record<string, Trade[]>);
  }, [activeTrades]);

  const weekSchedule = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const ds = dayDate.toISOString().split('T')[0];
      const prep = dailyPreps[ds];
      const tradesForDay = tradesByDate[ds] || [];
      
      let status: 'none' | 'green' | 'yellow' | 'red' = 'none';
      if (prep) {
        if (prep.gkVerdict === 'Green') status = 'green';
        else if (prep.gkVerdict === 'Yellow') status = 'yellow';
        else if (prep.gkVerdict === 'Red') status = 'red';
      } else if (tradesForDay.length > 0) {
        status = 'yellow';
      }
      
      return { ds, status, isToday: ds === todayStr };
    });
  }, [dailyPreps, tradesByDate, todayStr]);

  const handleRithmicImport = async (data: ParsedRithmicResult, accountId?: string) => {
    if (!data?.trades) return;
    
    const targetAccount = accountId || (selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?.id);
    if (!targetAccount) {
        addNotification('error', 'Niciun cont selectat pentru import.');
        return;
    }

    let count = 0;
    const errors: string[] = [];

    for (const t of data.trades) {
        try {
            const rawPnl = String(t.pnl || '0').replace(/[^0-9.-]/g, '');
            const pnlVal = parseFloat(rawPnl);
            
            const newTrade: Trade = {
                id: Math.random().toString(36).substr(2, 9),
                accountId: targetAccount,
                date: (t.date as string) || new Date().toISOString().split('T')[0],
                instrument: (t.symbol as string) || 'NQ',
                type: String(t.side || 'BUY').toUpperCase().includes('BUY') ? 'LONG' : 'SHORT',
                entryPrice: parseFloat(String(t.entryPrice)) || 0,
                exitPrice: parseFloat(String(t.exitPrice)) || 0,
                pnlNet: pnlVal,
                status: pnlVal >= 0 ? 'WIN' : 'LOSS',
                isChallenge: accounts.find(a => a.id === targetAccount)?.type === 'Apex',
                session: 'NY Morning',
                bias: 'Neutral',
                dailyNarrative: 'Importat din Rithmic',
                setup: 'Rithmic Import',
                setupGrade: 'None',
                contracts: parseInt(String(t.qty)) || 1,
                pnlBrut: pnlVal,
                commissions: 0,
                rrRealized: 0,
                disciplineScore: 5,
                executionError: 'None',
                correctionPlan: 'None',
                mentalState: 'Calm',
                screenshots: [],
                notes: 'Import automat.',
                tags: ['#RITHMIC'],
                isPartOfPlan: true,
                isAccordingToPlan: 'DA',
                condition1Met: false,
                condition2Met: false,
                condition3Met: false,
                pdValueRelationship: 'None',
                marketCondition: 'None',
                priceVsPWeek: 'None',
                mediumTermTrend: 'None',
                onRangeVsPDay: 'None',
                onInventory: 'None',
                pdExtremes: 'None',
                untestedPdVA: 'None',
                spHigh: '',
                spLow: '',
                gapHigh: '',
                gapLow: '',
                priorVPOC: 'None',
                onVsSettlement: 'None',
                hypoSession: '',
                hypoThen: 'None',
                zoneOfInterest: '',
                continuationTrigger: '',
                reversalTrigger: '',
                invalidationPoint: '',
                exitLevel: '',
                openType: 'None',
                ibWidth: 'Normal',
                rangeExtension: 'None',
                htfMs: 'Bullish',
                newsImpact: 'None',
                stopLoss: 0,
                takeProfit: 0
            };
            await addTrade(newTrade);
            count++;
        } catch (e: any) {
            console.error("Failed to import trade:", t, e);
            errors.push(e.message);
        }
    }
    
    if (count > 0) {
        addNotification('success', `Succes: ${count} tranzacții importate din Rithmic CSV.`);
    } else if (errors.length > 0) {
        addNotification('error', `Eroare import: ${errors[0]}`);
    } else {
        addNotification('warning', 'Nu au fost găsite tranzacții valide în fișier.');
    }
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'dark bg-[#060b13]' : 'bg-slate-50'} text-slate-100 font-sans`}>
      <aside className="w-64 border-r border-slate-800/50 bg-[#0a0f1d] sticky top-0 h-screen flex flex-col p-4 z-[110] no-print overflow-y-auto custom-scrollbar">
        <div className="mb-10 px-2 flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl"><i className="fas fa-chart-line text-white"></i></div>
          <h1 className="text-xl font-black tracking-tighter text-white">TradeGoggles</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="mb-4">
            <NavSectionHeader title="EQUITY DASHBOARD" icon="fa-shapes" isOpen={openSections.dashboard} onToggle={() => setOpenSections({...openSections, dashboard: !openSections.dashboard})} />
            {openSections.dashboard && (
              <div className="mt-1 animate-in slide-in-from-top-1 duration-200">
                <SidebarLink to="/dashboard" icon="fa-chart-area" label="EQUITY STATUS" isSubItem />
                <SidebarLink to="/apex" icon="fa-medal" label="APEX TRACKER" isSubItem />
                <SidebarLink to="/calendar" icon="fa-calendar-alt" label="CALENDAR P&L" isSubItem />
                <SidebarLink to="/reports" icon="fa-chart-pie" label="RAPOARTE" isSubItem />
              </div>
            )}
          </div>
          <div className="mb-4">
            <NavSectionHeader title="TRADERS JOURNEY" icon="fa-route" isOpen={openSections.journey} onToggle={() => setOpenSections({...openSections, journey: !openSections.journey})} />
            {openSections.journey && (
              <div className="mt-1 animate-in slide-in-from-top-1 duration-200">
                <SidebarLink to="/habits" icon="fa-clipboard-list" label="JOURNEY STATUS" isSubItem />
                <SidebarLink to="/risk" icon="fa-shield-halved" label="SET YOUR RISK" isSubItem />
                <SidebarLink to="/journal" icon="fa-book-open" label="DECISIONS TERMINAL" isSubItem />
                <SidebarLink to="/trades" icon="fa-list-check" label="BATTLE DEBRIEF" isSubItem />
              </div>
            )}
          </div>
          <SidebarLink to="/backtesting" icon="fa-flask" label="BACKTESTING LAB" />
          <SidebarLink to="/playbooks" icon="fa-book-bookmark" label="PLAYBOOKS" />
          <SidebarLink to="/accounts" icon="fa-wallet" label="CONTURILE MELE" />
          
          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <button onClick={() => setIsRithmicModalOpen(true)} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all mb-0.5 text-slate-400 hover:text-white hover:bg-slate-800/40 w-full text-left group">
                <i className="fas fa-file-csv w-5 text-center text-[10px] group-hover:text-orange-500 transition-colors"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] truncate">IMPORT CSV</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-slate-800/40 pt-8 mt-4 space-y-6">
            
            {/* TG ADVISOR RATING */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-2">TG Advisor</p>
              <div className="bg-[#0b1222]/60 border border-slate-800 rounded-[1.5rem] p-5 flex items-center justify-between group shadow-xl">
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">RATING</p>
                    <p className={`text-4xl font-black italic tracking-tighter leading-none ${scoreData.score > 70 ? 'text-emerald-500' : scoreData.score > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                      {(scoreData.score / 10).toFixed(1)}
                    </p>
                  </div>
                  <button onClick={() => setIsSentinelModalOpen(true)} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-blue-400 hover:bg-slate-800 shadow-lg transition-all">
                    <i className="fas fa-info text-[10px]"></i>
                  </button>
              </div>
            </div>

            {/* TILT RISK INTEL */}
            <div className="space-y-3 px-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tilt Risk Intel</p>
                <p className={`text-[10px] font-black uppercase italic ${tiltRisk.color}`}>{tiltRisk.label}</p>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
                <div 
                  className={`h-full transition-all duration-1000 ${tiltRisk.bg}`} 
                  style={{ width: `${tiltRisk.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <span>{tiltRisk.score}% Heat</span>
                <span>{tiltRisk.desc}</span>
              </div>
            </div>

            {/* GATEKEEPER SCORE */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Gatekeeper Score</p>
              <div className="bg-[#0b1222]/40 border border-slate-800 rounded-[1.5rem] p-6 text-center">
                <p className={`text-5xl font-black tracking-tighter mb-1 ${todayPrep?.gkVerdict === 'Green' ? 'text-emerald-500' : todayPrep?.gkVerdict === 'Yellow' ? 'text-orange-500' : todayPrep?.gkVerdict === 'Red' ? 'text-red-500' : 'text-slate-800'}`}>
                  {todayPrep?.gkTotalScore || '--'}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${todayPrep?.gkVerdict === 'Green' ? 'text-emerald-500' : todayPrep?.gkVerdict === 'Yellow' ? 'text-orange-500' : todayPrep?.gkVerdict === 'Red' ? 'text-red-500' : 'text-slate-700'}`}>
                  {todayPrep?.gkVerdict ? `${todayPrep.gkVerdict} Mode` : 'No Sync'}
                </p>
              </div>
            </div>

            {/* WEEKLY SCHEDULE */}
            <div className="space-y-4 px-2">
               <div className="flex justify-between items-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weekly Schedule</p>
                 <i className="fas fa-calendar-alt text-[10px] text-slate-700"></i>
               </div>
               <div className="flex justify-between items-center px-1">
                 {weekSchedule.map((day, idx) => (
                   <div 
                    key={idx} 
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all relative ${
                      day.status === 'green' ? 'bg-emerald-500 border-emerald-500/20' : 
                      day.status === 'yellow' ? 'bg-orange-500 border-orange-500/20' : 
                      day.status === 'red' ? 'bg-red-500 border-red-500/20' : 
                      'bg-slate-800 border-slate-700'
                    }`}
                   >
                     {day.isToday && (
                       <div className="absolute inset-[-4px] border-2 border-blue-500 rounded-full animate-pulse"></div>
                     )}
                   </div>
                 ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleBackup} className="py-3 rounded-xl border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex flex-col items-center justify-center space-y-1">
                <i className="fas fa-download"></i>
                <span>Backup</span>
              </button>
              <button onClick={() => fileImportRef.current?.click()} className="py-3 rounded-xl border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex flex-col items-center justify-center space-y-1">
                <i className="fas fa-upload"></i>
                <span>Import</span>
                <input type="file" ref={fileImportRef} className="hidden" accept=".json" onChange={handleImport} />
              </button>
            </div>

        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <MarketHubBar onOpenTradeModal={() => setIsNewTradeModalOpen(true)} currentBlockStatus={null} onLanguageToggle={() => setLanguage(language === 'ro' ? 'en' : 'ro')} protocolValidated={protocolValidated} tickers={marketTickers || null} loadingTickers={loadingTickers} />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <Suspense fallback={<LoadingComponent />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/apex" element={<ChallengeDashboard />} /><Route path="/calendar" element={<Calendar />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/habits" element={<HabitTracker />} /><Route path="/risk" element={<RiskManagement />} /><Route path="/journal" element={<DailyJournal onSavePrep={saveDailyPrep} onSaveWeeklyPrep={saveWeeklyPrep} onSaveNote={saveDailyNote} />} /><Route path="/trades" element={<TradeLog />} /><Route path="/trade/:id" element={<TradeDetail onUpdate={updateTrade} onDelete={deleteTrade} />} /><Route path="/backtesting" element={<Backtesting sessions={backtestSessions} onAddSession={addBacktestSession} playbooks={playbooks} />} /><Route path="/playbooks" element={<Playbooks />} /><Route path="/playbooks/edit/:id" element={<PlaybookEditor onSave={savePlaybook} onDelete={deleteTrade} />} /><Route path="/playbooks/new" element={<PlaybookEditor onSave={savePlaybook} />} /><Route path="/accounts" element={<AccountManagement onAdd={() => setIsAccountModalOpen(true)} />} /><Route path="/faq" element={<FAQ />} /><Route path="/analytics" element={<Analytics />} /><Route path="/economic-calendar" element={<EconomicCalendar />} /><Route path="/cme-calendar" element={<CMECalendar />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        <NewTradeModal isOpen={isNewTradeModalOpen} onClose={() => setIsNewTradeModalOpen(false)} onSave={addTrade} currentAccountId={selectedAccountId} />
        <NewAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={addAccount} />
        <SentinelScoreModal isOpen={isSentinelModalOpen} onClose={() => setIsSentinelModalOpen(false)} score={scoreData.score} prep={todayPrep} todayTrades={todayTrades} vetoTriggered={scoreData.vetoTriggered} vetoReason={scoreData.vetoReason} />
        <RithmicSyncModal isOpen={isRithmicModalOpen} onClose={() => setIsRithmicModalOpen(false)} onSync={handleRithmicImport} />
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  const { init, isLoading } = useAppStore(useShallow(state => ({ init: state.init, isLoading: state.isLoading })));
  useEffect(() => { init(); }, [init]);
  if (isLoading) return <div className="flex min-h-screen bg-[#060b13] items-center justify-center"><div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div></div>;
  return <ErrorBoundary><Router><AppContent /></Router></ErrorBoundary>;
};

export default App;
