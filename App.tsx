
import React, { useState, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './AppContext';
import Dashboard from './components/Dashboard';
import TradeLog from './components/TradeLog';
import Analytics from './components/Analytics';
import Calendar from './components/Calendar';
import DailyJournal from './components/DailyJournal';
import TradeDetail from './components/TradeDetail';
import NewTradeModal from './components/NewTradeModal';
import NewAccountModal from './components/NewAccountModal';
import AccountManagement from './components/AccountManagement';
import ChallengeDashboard from './components/ChallengeDashboard';
import RithmicSyncModal from './components/RithmicSyncModal';
import Playbooks from './components/Playbooks';
import PlaybookEditor from './components/PlaybookEditor';
import ReportsPage from './components/ReportsPage';
import Backtesting from './components/Backtesting';
import EconomicCalendar from './components/EconomicCalendar';
import CMECalendar from './components/CMECalendar';
import HabitTracker from './components/HabitTracker';
import RiskManagement from './components/RiskManagement';
import MarketHubBar from './components/MarketHubBar';
import MarketWatch from './components/MarketWatch';
import TradeAcademy from './components/TradeAcademy';
import { Trade, Account, DailyPrepData, WeeklyPrepData } from './types';
import { translations } from './translations';

const SidebarLink = ({ to, icon, label }: { to: string; icon: string; label: string }) => {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  return (
    <Link to={to} className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
      <i className={`fas ${icon} w-5 text-center text-[11px] ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}></i>
      <span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span>
    </Link>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { 
    trades, backtestTrades, accounts, playbooks, dailyPreps, weeklyPreps, language, selectedAccountId, accountBlocks,
    backtestSessions, addBacktestSession,
    riskManagerEnabled, setRiskManagerEnabled,
    addTrade, updateTrade, deleteTrade, updateAccount, deleteAccount, setAccounts, savePlaybook, deletePlaybook,
    saveDailyPrep, saveWeeklyPrep, saveDailyNote, setLanguage, setSelectedAccountId, setIsDarkMode, isDarkMode
  } = useAppContext();

  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRithmicModalOpen, setIsRithmicModalOpen] = useState(false);
  const [blockingModal, setBlockingModal] = useState<{ type: 'none' | 'startDay' | 'riskBreach' | 'tilt' | 'noAccount' | 'restrictedDay', expires?: string }>({ type: 'none' });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrep = dailyPreps[todayStr];

  const currentWeekId = useMemo(() => {
    const d = new Date();
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }, []);

  const currentWeeklyPrep = weeklyPreps[currentWeekId];

  const currentWeekDates = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  }, []);

  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

  const currentBlockStatus = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    const block = accountBlocks[selectedAccountId];
    if (!block || new Date(block).getTime() < Date.now()) return null;
    return block;
  }, [accountBlocks, selectedAccountId]);

  const handleOpenTradeModal = () => {
    if (selectedAccountId === 'all') { setBlockingModal({ type: 'noAccount' }); return; }
    if (!riskManagerEnabled) { setIsNewTradeModalOpen(true); return; }
    if (currentWeeklyPrep && currentWeeklyPrep.tradingDays && !currentWeeklyPrep.tradingDays.includes(todayStr)) {
        setBlockingModal({ type: 'restrictedDay' }); return;
    }
    if (currentBlockStatus) { setBlockingModal({ type: 'riskBreach', expires: currentBlockStatus }); return; }
    if (!dailyPreps[todayStr]) { setBlockingModal({ type: 'startDay' }); return; }
    setIsNewTradeModalOpen(true);
  };

  const handleBackup = () => {
    const data = { trades, accounts, playbooks, dailyPreps, weeklyPreps, dailyNotes: {}, accountBlocks };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `tradegoggles_backup_${todayStr}.json`; a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0]; const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.accounts) setAccounts(data.accounts);
          alert('Import finalizat cu succes!');
        } catch (err) { alert('Eroare import.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const t = translations[language].sidebar;
  const tm = translations[language].modals;
  const isRithmicActive = accounts.some(a => a.isRithmicConnected);

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'dark bg-[#060b13]' : 'bg-slate-50'} text-slate-100 font-sans transition-colors duration-300`}>
      <aside className="w-64 border-r border-slate-800/50 bg-[#0a0f1d] sticky top-0 h-screen flex flex-col p-4 shadow-xl z-40 no-print">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-chart-line text-white"></i></div>
            <h1 className="text-xl font-black tracking-tighter text-white">TradeGoggles</h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-inner">
            <i className={`fas ${isDarkMode ? 'fa-sun text-yellow-500' : 'fa-moon text-blue-400'} text-xs`}></i>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar pr-1">
          <SidebarLink to="/" icon="fa-th-large" label={t.dashboard} />
          <SidebarLink to="/challenge" icon="fa-medal" label={t.apexTracker} />
          <SidebarLink to="/calendar" icon="fa-calendar-days" label={t.calendarPl} />
          
          <SidebarLink to="/risk" icon="fa-shield-halved" label={t.riskManagement} />
          <SidebarLink to="/journal" icon="fa-book-open" label={t.dailyJournal} />
          
          <SidebarLink to="/trades" icon="fa-list-check" label={t.reviewTrades} />
          <SidebarLink to="/habits" icon="fa-check-to-slot" label={t.habitTracker} />
          <SidebarLink to="/reports" icon="fa-chart-pie" label={t.reports} />
          
          <SidebarLink to="/backtesting" icon="fa-vial-circle-check" label="Backtesting Lab" />
          <SidebarLink to="/playbooks" icon="fa-book-bookmark" label={t.playbooks} />
          <SidebarLink to="/market-watch" icon="fa-magnifying-glass-chart" label={t.marketWatch} />
          
          <SidebarLink to="/economic" icon="fa-calendar-day" label={t.economicCalendar} />
          <SidebarLink to="/academy" icon="fa-graduation-cap" label={t.academy} />
          <SidebarLink to="/accounts" icon="fa-wallet" label={t.myAccounts} />
        </nav>

        {/* --- SIDEBAR WIDGETS SECTION --- */}
        <div className="mt-4 space-y-4 pt-4 border-t border-slate-800/50">
          
          {/* GATEKEEPER SCORE WIDGET */}
          <div className={`p-3 rounded-2xl border transition-all duration-500 bg-slate-900/40 ${!todayPrep ? 'border-slate-800' : todayPrep.gkVerdict === 'Green' ? 'border-emerald-500/30' : todayPrep.gkVerdict === 'Yellow' ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
             <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Gatekeeper</span>
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${!todayPrep ? 'bg-slate-800 text-slate-500' : todayPrep.gkVerdict === 'Green' ? 'bg-emerald-500/10 text-emerald-500' : todayPrep.gkVerdict === 'Yellow' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                   {!todayPrep ? 'Pending' : todayPrep.gkVerdict}
                </span>
             </div>
             <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${!todayPrep ? 'bg-slate-800 text-slate-600' : todayPrep.gkVerdict === 'Green' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : todayPrep.gkVerdict === 'Yellow' ? 'bg-yellow-500 text-slate-900' : 'bg-red-600 text-white'}`}>
                   {todayPrep ? todayPrep.gkTotalScore : '--'}
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-200 leading-none mb-1">Mental State</p>
                   <p className="text-[8px] text-slate-500 font-medium uppercase italic">
                      {todayPrep ? 'Verified' : 'Complete Prep'}
                   </p>
                </div>
             </div>
          </div>

          {/* WEEKLY SCHEDULE MINI-CALENDAR */}
          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-2xl">
             <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-3">Trading Schedule</p>
             <div className="flex justify-between">
                {currentWeekDates.map((date, idx) => {
                   const dayChar = ['L', 'M', 'M', 'J', 'V', 'S', 'D'][idx];
                   const isTradingDay = currentWeeklyPrep?.tradingDays?.includes(date);
                   const isToday = date === todayStr;
                   
                   return (
                      <div key={date} className="flex flex-col items-center space-y-1.5">
                         <span className={`text-[7px] font-black ${isToday ? 'text-blue-400' : 'text-slate-600'}`}>{dayChar}</span>
                         <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border transition-all ${
                            isTradingDay 
                               ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]' 
                               : 'bg-slate-950 border-slate-800 text-slate-700'
                         } ${isToday ? 'ring-1 ring-orange-500 ring-offset-1 ring-offset-slate-900' : ''}`}>
                            {new Date(date).getDate()}
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>

          <div className={`p-3 rounded-2xl border transition-all duration-500 flex flex-col space-y-2 ${riskManagerEnabled ? 'bg-emerald-600/5 border-emerald-500/20' : 'bg-rose-600/5 border-rose-500/20'}`}>
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Risk Manager</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${riskManagerEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                   {riskManagerEnabled ? 'ON' : 'OFF'}
                </span>
             </div>
             <button onClick={() => setRiskManagerEnabled(!riskManagerEnabled)} className="relative w-full h-8 bg-slate-900 border border-slate-800 rounded-xl flex items-center p-1 transition-all overflow-hidden">
                <div className={`absolute inset-0 transition-all duration-500 ${riskManagerEnabled ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}></div>
                <div className={`w-1/2 h-full rounded-lg transition-all duration-300 transform flex items-center justify-center z-10 ${riskManagerEnabled ? 'translate-x-full bg-emerald-600 text-white' : 'translate-x-0 bg-slate-700 text-slate-300'}`}>
                    <i className={`fas ${riskManagerEnabled ? 'fa-shield-check' : 'fa-flask-vial'} text-[10px] mr-2`}></i>
                    <span className="text-[8px] font-black uppercase">{riskManagerEnabled ? 'Protocat' : 'Sandbox'}</span>
                </div>
             </button>
          </div>

          <button onClick={() => setIsRithmicModalOpen(true)} className={`w-full py-2 rounded-xl border flex items-center justify-center space-x-2 transition-all ${isRithmicActive ? 'bg-green-600/10 border-green-500/20 text-green-500' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
             <i className="fas fa-sync-alt text-[9px]"></i>
             <span className="text-[9px] font-black uppercase tracking-widest">Sync Rithmic</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
               <button onClick={handleBackup} className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 py-2 rounded-xl flex flex-col items-center justify-center transition-all group">
                  <i className="fas fa-download text-slate-500 group-hover:text-blue-400 text-[10px] mb-1"></i>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Backup</span>
               </button>
               <button onClick={handleImport} className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 py-2 rounded-xl flex flex-col items-center justify-center transition-all group">
                  <i className="fas fa-upload text-slate-500 group-hover:text-blue-400 text-[10px] mb-1"></i>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Import</span>
               </button>
          </div>
          
          <button onClick={handleOpenTradeModal} className={`w-full py-3 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all ${currentBlockStatus && riskManagerEnabled ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95'}`}>
             <i className={`fas ${currentBlockStatus && riskManagerEnabled ? 'fa-lock' : 'fa-plus'} text-xs`}></i>
             <span className="text-[11px] uppercase tracking-widest font-black">{currentBlockStatus && riskManagerEnabled ? 'Blocat' : 'Trade'}</span>
          </button>
          
          <div className="bg-[#111827] p-3 rounded-[1.25rem] border border-slate-800">
             <label className="text-[8px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Cont Activ</label>
             <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full bg-transparent text-[10px] font-black text-white focus:outline-none appearance-none cursor-pointer">
                <option value="all" className="bg-slate-900">Toate</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name}</option>)}
             </select>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <MarketHubBar trades={activeTrades} activeAccount={activeAccount} language={language} onLanguageToggle={() => setLanguage(language === 'ro' ? 'en' : 'ro')} />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/market-watch" element={<MarketWatch language={language} />} />
            <Route path="/journal" element={<DailyJournal trades={activeTrades} accounts={accounts} dailyNotes={{}} onSaveNote={saveDailyNote} dailyPreps={dailyPreps} weeklyPreps={weeklyPreps} onSavePrep={saveDailyPrep} onSaveWeeklyPrep={saveWeeklyPrep} playbooks={playbooks} language={language} />} />
            <Route path="/backtesting" element={<Backtesting sessions={backtestSessions} onAddSession={addBacktestSession} playbooks={playbooks} />} />
            <Route path="/trades" element={<TradeLog trades={activeTrades} accounts={accounts} onDeleteTrade={deleteTrade} language={language} dailyPreps={dailyPreps} onSavePrep={saveDailyPrep} />} />
            <Route path="/trade/:id" element={<TradeDetail trades={trades} accounts={accounts} playbooks={playbooks} dailyPreps={dailyPreps} onUpdate={updateTrade} onDelete={deleteTrade} language={language} />} />
            <Route path="/analytics" element={<Analytics trades={activeTrades} language={language} />} />
            <Route path="/calendar" element={<Calendar trades={activeTrades} dailyNotes={{}} onSaveNote={saveDailyNote} onDeleteTrade={deleteTrade} dailyPreps={dailyPreps} language={language} activeAccount={activeAccount} />} />
            <Route path="/risk" element={<RiskManagement accounts={accounts} trades={trades} onUpdateAccount={updateAccount} selectedAccountId={selectedAccountId} language={language} />} />
            <Route path="/habits" element={<HabitTracker dailyPreps={dailyPreps} language={language} />} />
            <Route path="/academy" element={<TradeAcademy language={language} />} />
            <Route path="/playbooks" element={<Playbooks playbooks={playbooks} trades={activeTrades} backtestTrades={backtestTrades} language={language} />} />
            <Route path="/playbooks/new" element={<PlaybookEditor onSave={savePlaybook} language={language} trades={activeTrades} />} />
            <Route path="/playbooks/edit/:id" element={<PlaybookEditor playbooks={playbooks} onSave={savePlaybook} onDelete={deletePlaybook} language={language} trades={activeTrades} />} />
            <Route path="/reports" element={<ReportsPage trades={activeTrades} language={language} />} />
            <Route path="/economic" element={<EconomicCalendar language={language} />} />
            <Route path="/challenge" element={<ChallengeDashboard trades={trades} accounts={accounts.filter(a => a.type === 'Apex')} language={language} />} />
            <Route path="/accounts" element={<AccountManagement accounts={accounts} activeOrders={useAppContext().activeOrders} onUpdate={updateAccount} onDelete={deleteAccount} onAdd={() => setIsAccountModalOpen(true)} language={language} />} />
          </Routes>
        </main>
      </div>

      <NewTradeModal isOpen={isNewTradeModalOpen} onClose={() => setIsNewTradeModalOpen(false)} onSave={addTrade} accounts={accounts} playbooks={playbooks} trades={trades} dailyPreps={dailyPreps} language={language} currentAccountId={selectedAccountId} />
      <NewAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={(acc) => setAccounts([...accounts, acc])} language={language} />
      
      <RithmicSyncModal isOpen={isRithmicModalOpen} onClose={() => setIsRithmicModalOpen(false)} onSync={(res) => { console.log("CSV Sync Result:", res); }} onLiveConnect={(accs) => { setAccounts(prev => { const existingIds = new Set(prev.map(a => a.id)); const newAccs = accs.filter(a => !existingIds.has(a.id)); return [...prev, ...newAccs]; }); }} accounts={accounts} language={language} />

      {blockingModal.type !== 'none' && riskManagerEnabled && (
        <BlockingOverlay type={blockingModal.type} expires={blockingModal.expires} tm={tm} onClose={() => setBlockingModal({ type: 'none' })} onGoToPrep={() => { setBlockingModal({ type: 'none' }); navigate('/journal'); }} />
      )}
    </div>
  );
};

const BlockingOverlay = ({ type, expires, tm, onClose, onGoToPrep }: any) => {
  const isBlock = type === 'riskBreach' || type === 'tilt';
  const isNoAccount = type === 'noAccount';
  const isRestrictedDay = type === 'restrictedDay';
  const isStartDay = type === 'startDay';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
       <div className={`border rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden ${isStartDay || isNoAccount || isRestrictedDay ? 'bg-[#0f172a] border-blue-500/30' : 'bg-red-950/40 border-red-500/50'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg ${isStartDay || isNoAccount || isRestrictedDay ? 'bg-blue-600 shadow-blue-600/20' : 'bg-red-600 shadow-red-600/20 animate-pulse'}`}>
             <i className={`fas ${isStartDay ? 'fa-book-open' : isRestrictedDay ? 'fa-calendar-xmark' : isBlock ? 'fa-lock' : isNoAccount ? 'fa-wallet' : 'fa-hand-paper'} text-white text-3xl`}></i>
          </div>
          <h2 className={`text-2xl font-black uppercase mb-4 tracking-tighter ${isStartDay || isNoAccount || isRestrictedDay ? 'text-blue-500' : 'text-red-500'}`}>
             {isRestrictedDay ? "NON-TRADING DAY" : isStartDay ? tm.startDayMissingTitle : isNoAccount ? tm.tradeRequirementTitle : tm.riskBreachTitle}
          </h2>
          <p className="text-white text-lg font-bold leading-relaxed mb-8">
             {isRestrictedDay ? "Astăzi nu este o zi de trading conform planului tău săptămânal." : isStartDay ? tm.startDayMissingMsg : isNoAccount ? tm.tradeRequirementMsg : tm.riskBreachMsg}
          </p>
          <div className="flex flex-col space-y-3">
             {isStartDay && (
                <button onClick={onGoToPrep} className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20">
                   {tm.goPrep}
                </button>
             )}
             <button onClick={onClose} className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all bg-slate-800 text-white hover:bg-slate-700">
                {tm.understand}
             </button>
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <Router>
      <AppContent />
    </Router>
  </AppProvider>
);

export default App;
