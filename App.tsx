
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './AppContext';
import TGMap from './components/TGMap';
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
import HabitTracker, { calculateTGScore } from './components/HabitTracker';
import RiskManagement from './components/RiskManagement';
import MarketHubBar from './components/MarketHubBar';
import MarketWatch from './components/MarketWatch';
import TradeAcademy from './components/TradeAcademy';
import WeeklyPrepModal from './components/WeeklyPrepModal';
import FAQ from './components/FAQ';
import { Trade, Account, DailyPrepData, WeeklyPrepData } from './types';
import { translations } from './translations';
import { getMarketTickers, MarketTickers } from './geminiService';
import { calculateTiltRisk } from './ProtocolEngine';

const SidebarLink = ({ to, icon, label, onClick, isSubItem = false }: { to: string; icon: string; label: string, onClick?: (e: React.MouseEvent) => void, isSubItem?: boolean }) => {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${isSubItem ? 'ml-4 py-1.5' : ''}`}
    >
      <i className={`fas ${icon} w-5 text-center ${isSubItem ? 'text-[9px]' : 'text-[11px]'} ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}></i>
      <span className={`${isSubItem ? 'text-[9px]' : 'text-[10px]'} font-black uppercase tracking-widest truncate`}>{label}</span>
    </Link>
  );
};

const BlockingOverlay = ({ type, expires, tm, onClose, onGoToPrep, onGoToReview }: { type: string, expires?: string, tm: any, onClose: () => void, onGoToPrep: () => void, onGoToReview?: () => void }) => {
  const getInfo = () => {
    switch (type) {
      case 'riskBreach': return { title: tm.riskBreachTitle, msg: tm.riskBreachMsg, icon: 'fa-shield-halved', color: 'text-red-500', bg: 'bg-red-950/20' };
      case 'tilt': return { title: tm.tiltTitle, msg: tm.tiltMsg, icon: 'fa-fire', color: 'text-orange-500', bg: 'bg-orange-950/20' };
      case 'startDay': return { title: tm.startDayMissingTitle, msg: tm.startDayMissingMsg, icon: 'fa-calendar-exclamation', color: 'text-yellow-500', bg: 'bg-yellow-950/20' };
      case 'noAccount': return { title: "CERINȚĂ OBLIGATORIE", msg: "Alege mai întâi un cont de trading pentru a continua.", icon: 'fa-wallet', color: 'text-blue-500', bg: 'bg-blue-950/20' };
      case 'restrictedDay': return { title: 'RESTRICTED DAY', msg: 'Astăzi nu este o zi de trading conform planului tău.', icon: 'fa-calendar-xmark', color: 'text-red-500', bg: 'bg-red-950/20' };
      case 'pendingClosure': return { title: 'ZI ANTERIOARĂ DESCHISĂ', msg: 'Înainte de toate închide ziua de ieri de trading prin revizuirea trade-urilor și completarea "Day Wrap Up"', icon: 'fa-door-closed', color: 'text-orange-500', bg: 'bg-orange-950/20' };
      default: return null;
    }
  };

  const info = getInfo();
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`bg-[#0b1222] border border-slate-800 rounded-[2.5rem] w-full max-w-lg p-12 text-center shadow-2xl relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${info.color.replace('text', 'bg')}`}></div>
        <div className={`w-20 h-20 rounded-3xl ${info.bg} border border-slate-800 flex items-center justify-center mx-auto mb-8 ${info.color}`}>
          <i className={`fas ${info.icon} text-3xl`}></i>
        </div>
        <h2 className={`text-2xl font-black uppercase tracking-tighter mb-4 italic ${info.color}`}>{info.title}</h2>
        <p className="text-white text-lg font-bold leading-relaxed mb-10">{info.msg}</p>
        
        {expires && (
          <div className="mb-8 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Deblocare la ora:</p>
            <p className="text-lg font-black text-white">{new Date(expires).toLocaleTimeString()}</p>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          {type === 'pendingClosure' ? (
            <button onClick={onGoToReview} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95 text-xs uppercase tracking-widest">
              Mergi la Battle debrief
            </button>
          ) : type === 'startDay' ? (
            <button onClick={onGoToPrep} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest">
              {tm.goPrep}
            </button>
          ) : (
            <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest">
              {tm.understand}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AuditItem = ({ done, label, sub }: { done: boolean, label: string, sub?: string }) => (
  <div className="flex items-start space-x-4 py-3 border-b border-slate-800/40 last:border-0 group/audit">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-600'}`}>
          <i className={`fas ${done ? 'fa-check' : 'fa-circle'} text-[8px]`}></i>
      </div>
      <div className="flex-1 text-left">
          <p className={`text-[10px] font-black uppercase tracking-tight transition-colors ${done ? 'text-white' : 'text-slate-500'}`}>{label}</p>
          {sub && <p className={`text-[8px] font-bold uppercase mt-0.5 ${done ? 'text-slate-400' : 'text-slate-600'}`}>{sub}</p>}
      </div>
  </div>
);

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    trades, accounts, dailyPreps, weeklyPreps, playbooks, language, selectedAccountId, accountBlocks,
    activeTrades, 
    riskManagerEnabled, setRiskManagerEnabled,
    addTrade, updateTrade, deleteTrade, updateAccount, deleteAccount, setAccounts, savePlaybook, deletePlaybook,
    saveDailyPrep, saveWeeklyPrep, saveDailyNote, setLanguage, setSelectedAccountId, setIsDarkMode, isDarkMode,
    backtestTrades, backtestSessions, addBacktestSession
  } = useAppContext();

  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRithmicModalOpen, setIsRithmicModalOpen] = useState(false);
  const [isWeeklyPrepModalOpen, setIsWeeklyPrepModalOpen] = useState(false);
  const [showAdvisorAudit, setShowAdvisorAudit] = useState(false);
  const [blockingModal, setBlockingModal] = useState<{ type: 'none' | 'startDay' | 'riskBreach' | 'tilt' | 'noAccount' | 'restrictedDay' | 'pendingClosure', expires?: string }>({ type: 'none' });
  
  // States for expandable sections
  const [isJourneyOpen, setIsJourneyOpen] = useState(() => {
    const paths = ['/habits', '/risk', '/journal', '/trades'];
    return paths.some(p => location.pathname.startsWith(p));
  });

  const [isEquityOpen, setIsEquityOpen] = useState(() => {
    const paths = ['/challenge', '/calendar', '/reports', '/dashboard'];
    const isDashboard = location.pathname === '/dashboard';
    return isDashboard || paths.some(p => location.pathname.startsWith(p));
  });

  const [tickers, setTickers] = useState<MarketTickers | null>(null);
  const [loadingTickers, setLoadingTickers] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const currentWeekId = useMemo(() => {
    const d = new Date();
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }, []);

  const currentWeeklyPrep = weeklyPreps[currentWeekId];
  const todayPrep = dailyPreps[todayStr];

  // TG ADVISOR LOGIC
  const advisorData = useMemo(() => calculateTGScore(todayStr, activeTrades, todayPrep), [todayStr, activeTrades, todayPrep]);

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

  const activeAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

  const tiltLevel = useMemo(() => {
    const todayTrades = activeTrades.filter(t => t.date === todayStr);
    return calculateTiltRisk(todayTrades, activeAccount, todayPrep);
  }, [activeTrades, todayStr, todayPrep, activeAccount]);

  const currentBlockStatus = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    const block = accountBlocks[selectedAccountId];
    if (!block || new Date(block).getTime() < Date.now()) return null;
    return block;
  }, [accountBlocks, selectedAccountId]);

  const isPreviousDayClosed = useMemo(() => {
    if (!riskManagerEnabled) return true;
    const datesWithTrades = Array.from(new Set(trades.map(t => t.date)))
        .filter(d => d < todayStr)
        .sort((a: string, b: string) => b.localeCompare(a));
    if (datesWithTrades.length === 0) return true;
    const lastTradingDate = datesWithTrades[0];
    const lastDayTrades = trades.filter(t => t.date === lastTradingDate);
    const lastDayPrep = dailyPreps[lastTradingDate];
    const allReviewed = lastDayTrades.every(t => t.notes && t.notes.trim().length >= 10);
    const wrapUpDone = lastDayPrep && lastDayPrep.habJournalCompleted;
    return allReviewed && wrapUpDone;
  }, [trades, dailyPreps, todayStr, riskManagerEnabled]);

  const handleOpenTradeModal = () => {
    if (!riskManagerEnabled) { 
      setIsNewTradeModalOpen(true); 
      return; 
    }
    if (!isPreviousDayClosed) {
        setBlockingModal({ type: 'pendingClosure' });
        return;
    }
    if (selectedAccountId !== 'all') {
        if (currentWeeklyPrep && currentWeeklyPrep.tradingDays && !currentWeeklyPrep.tradingDays.includes(todayStr)) {
            setBlockingModal({ type: 'restrictedDay' }); 
            return;
        }
        if (currentBlockStatus) { 
            setBlockingModal({ type: 'riskBreach', expires: currentBlockStatus }); 
            return; 
        }
        if (!dailyPreps[todayStr]) { 
            setBlockingModal({ type: 'startDay' }); 
            return; 
        }
    } else {
        if (!dailyPreps[todayStr]) {
            setBlockingModal({ type: 'startDay' });
            return;
        }
    }
    setIsNewTradeModalOpen(true);
  };

  // LOGICA PENTRU DESCHIDERE AUTOMATĂ DIN TG MAP (Stage 4)
  useEffect(() => {
    if (location.state?.openNewTrade) {
        handleOpenTradeModal();
        // Curățăm state-ul pentru a nu re-deschide la navigări ulterioare sau refresh
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleJournalLinkClick = (e: React.MouseEvent) => {
    if (riskManagerEnabled && !isPreviousDayClosed) {
        e.preventDefault();
        setBlockingModal({ type: 'pendingClosure' });
    }
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
      <aside className="w-64 border-r border-slate-800/50 bg-[#0a0f1d] sticky top-0 h-screen flex flex-col p-4 shadow-xl z-[110] no-print">
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
          <SidebarLink to="/" icon="fa-map-location-dot" label="TG Map" />

          {/* EXPANDABLE SECTION: EQUITY DASHBOARD */}
          <div className="space-y-0.5">
            <button 
              onClick={() => setIsEquityOpen(!isEquityOpen)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all group hover:bg-slate-800/50 ${isEquityOpen ? 'text-white' : 'text-slate-400'}`}
            >
              <div className="flex items-center space-x-3">
                <i className={`fas fa-th-large w-5 text-center text-[11px] ${isEquityOpen ? 'text-blue-400' : 'text-slate-500'}`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest truncate">Equity Dashboard</span>
              </div>
              <i className={`fas fa-chevron-right text-[8px] transition-transform duration-300 ${isEquityOpen ? 'rotate-90 text-blue-400' : 'text-slate-700'}`}></i>
            </button>
            
            {isEquityOpen && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-300">
                 <SidebarLink to="/dashboard" icon="fa-chart-area" label="Equity Status" isSubItem />
                 <SidebarLink to="/challenge" icon="fa-medal" label={t.apexTracker} isSubItem />
                 <SidebarLink to="/calendar" icon="fa-calendar-days" label={t.calendarPl} isSubItem />
                 <SidebarLink to="/reports" icon="fa-chart-pie" label={t.reports} isSubItem />
              </div>
            )}
          </div>
          
          {/* EXPANDABLE SECTION: TRADERS JOURNEY */}
          <div className="space-y-0.5">
            <button 
              onClick={() => setIsJourneyOpen(!isJourneyOpen)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all group hover:bg-slate-800/50 ${isJourneyOpen ? 'text-white' : 'text-slate-400'}`}
            >
              <div className="flex items-center space-x-3">
                <i className={`fas fa-route w-5 text-center text-[11px] ${isJourneyOpen ? 'text-blue-400' : 'text-slate-500'}`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest truncate">Traders Journey</span>
              </div>
              <i className={`fas fa-chevron-right text-[8px] transition-transform duration-300 ${isJourneyOpen ? 'rotate-90 text-blue-400' : 'text-slate-700'}`}></i>
            </button>
            
            {isJourneyOpen && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-300">
                 <SidebarLink to="/habits" icon="fa-check-to-slot" label="Journey Status" isSubItem />
                 <SidebarLink to="/risk" icon="fa-shield-halved" label={t.riskManagement} isSubItem />
                 <SidebarLink to="/journal" icon="fa-book-open" label={t.dailyJournal} onClick={handleJournalLinkClick} isSubItem />
                 <SidebarLink to="/trades" icon="fa-list-check" label={t.reviewTrades} isSubItem />
              </div>
            )}
          </div>

          <SidebarLink to="/backtesting" icon="fa-vial-circle-check" label="Backtesting Lab" />
          <SidebarLink to="/playbooks" icon="fa-book-bookmark" label={t.playbooks} />
          <SidebarLink to="/academy" icon="fa-graduation-cap" label={t.academy} />
          <SidebarLink to="/accounts" icon="fa-wallet" label={t.myAccounts} />
          <SidebarLink to="/faq" icon="fa-question-circle" label={t.faq} />
        </nav>

        <div className="mt-4 space-y-4 pt-4 border-t border-slate-800/50">
          <div className="flex flex-col space-y-6">
             
             {/* TG ADVISOR SECTION - SCREENSHOT STYLE */}
             <div className="space-y-2.5">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">TG ADVISOR</span>
                <div className="bg-[#0b1222]/80 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">RATING</span>
                        <span className={`text-2xl font-black italic tracking-tighter leading-none ${advisorData.score > 70 ? 'text-emerald-400' : advisorData.score > 40 ? 'text-orange-400' : 'text-red-500'}`}>
                            {advisorData.score.toFixed(1)}
                        </span>
                    </div>
                    <button 
                        onClick={() => setShowAdvisorAudit(true)}
                        className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                    >
                        <i className="fas fa-info text-[10px]"></i>
                    </button>
                </div>
                <div className="h-0.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                    <div className={`h-full transition-all duration-1000 ${advisorData.score > 70 ? 'bg-emerald-500' : advisorData.score > 40 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${advisorData.score}%` }}></div>
                </div>
             </div>

             {/* TILT RISK INTELLIGENCE - SCREENSHOT STYLE */}
             <div className="space-y-2.5 border-t border-slate-800/40 pt-4">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TILT RISK INTEL</span>
                    <span className={`text-[10px] font-black uppercase italic ${tiltLevel.label === 'OPTIMAL' ? 'text-white' : tiltLevel.color}`}>{tiltLevel.label}</span>
                </div>
                <div className="relative h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                    <div className={`h-full transition-all duration-1000 ease-out ${tiltLevel.bg} ${tiltLevel.shadow}`} style={{ width: `${tiltLevel.score}%` }}></div>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{tiltLevel.score}% HEAT</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{tiltLevel.desc}</span>
                </div>
             </div>

             {/* GATEKEEPER SCORE - SCREENSHOT STYLE */}
             <div className="space-y-2.5 border-t border-slate-800/40 pt-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GATEKEEPER SCORE</span>
                <div className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col ${
                    !todayPrep ? 'bg-slate-900/50 border-slate-800 text-slate-600' :
                    todayPrep.gkVerdict === 'Green' ? 'bg-emerald-600/5 border-emerald-500/20 text-emerald-400' :
                    todayPrep.gkVerdict === 'Yellow' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' :
                    'bg-red-600/5 border-red-500/20 text-red-400'
                }`}>
                    <span className="text-4xl font-black leading-none tracking-tighter mb-1.5">{todayPrep?.gkTotalScore || '--'}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                        {!todayPrep ? 'Pending' : todayPrep.gkVerdict + ' Mode'}
                    </span>
                </div>
             </div>

             {/* WEEKLY SCHEDULE - SCREENSHOT STYLE */}
             <div className="space-y-3 border-t border-slate-800/40 pt-4">
                <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WEEKLY SCHEDULE</span>
                    <i className="fas fa-calendar-alt text-[10px] text-slate-600"></i>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between shadow-inner">
                    {currentWeekDates.map((date, idx) => {
                        const isTradingDay = currentWeeklyPrep?.tradingDays?.includes(date);
                        const isCurrentDay = date === todayStr;
                        const dayNews = currentWeeklyPrep?.dayNews?.[date] || [];
                        const minTier = dayNews.length > 0 ? Math.min(...dayNews.map(n => n.tier)) : null;
                        
                        let dotClass = "bg-slate-800";
                        let glowClass = "";
                        
                        if (minTier === 1) { dotClass = "bg-red-500"; glowClass = "shadow-[0_0_8px_rgba(239,68,68,0.8)]"; }
                        else if (minTier === 2) { dotClass = "bg-orange-500"; glowClass = "shadow-[0_0_8px_rgba(249,115,22,0.8)]"; }
                        else if (minTier === 3) { dotClass = "bg-yellow-500"; glowClass = "shadow-[0_0_8px_rgba(234,179,8,0.8)]"; }
                        else if (isTradingDay) { dotClass = "bg-blue-600"; }

                        return (
                            <div key={date} className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${dotClass} ${glowClass} ${isCurrentDay ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-slate-950 scale-110' : ''}`}></div>
                        );
                    })}
                </div>
             </div>

          </div>

          <div className={`p-3 mt-4 rounded-2xl border transition-all duration-500 flex flex-col space-y-2 ${riskManagerEnabled ? 'bg-emerald-600/5 border-emerald-500/20' : 'bg-rose-600/5 border-rose-500/20'}`}>
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Risk Manager</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${riskManagerEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-600/5 border-rose-500/20 text-rose-500'}`}>{riskManagerEnabled ? 'ON' : 'OFF'}</span>
             </div>
             <button onClick={() => setRiskManagerEnabled(!riskManagerEnabled)} className="relative w-full h-8 bg-slate-900 border border-slate-800 rounded-xl flex items-center p-1 transition-all overflow-hidden">
                <div className={`absolute inset-0 transition-all duration-500 ${riskManagerEnabled ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}></div>
                <div className={`w-1/2 h-full rounded-lg transition-all duration-300 transform flex items-center justify-center z-10 ${riskManagerEnabled ? 'translate-x-full bg-emerald-600 text-white' : 'translate-x-0 bg-slate-700 text-slate-300'}`}>
                    <i className={`fas ${riskManagerEnabled ? 'fa-shield-check' : 'fa-flask-vial'} text-[10px] mr-2`}></i>
                    <span className="text-[8px] font-black uppercase">{riskManagerEnabled ? 'Protected' : 'Sandbox'}</span>
                </div>
             </button>
          </div>

          <button onClick={() => setIsRithmicModalOpen(true)} className={`w-full mt-4 py-2 rounded-xl border flex items-center justify-center space-x-2 transition-all ${isRithmicActive ? 'bg-green-600/10 border-green-500/20 text-green-500' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
             <i className="fas fa-sync-alt text-[9px]"></i>
             <span className="text-[9px] font-black uppercase tracking-widest">Sync Rithmic</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
               <button onClick={handleBackup} className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 py-2 rounded-xl flex flex-col items-center justify-center transition-all group">
                  <i className="fas fa-download text-slate-500 group-hover:text-blue-400 text-[10px] mb-1"></i>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Backup</span>
               </button>
               <button onClick={handleImport} className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 py-2 rounded-xl flex flex-col items-center justify-center transition-all group">
                  <i className="fas fa-upload text-slate-500 group-hover:text-blue-400 text-[10px] mb-1"></i>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Import</span>
               </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <MarketHubBar 
          trades={activeTrades} 
          activeAccount={activeAccount} 
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          setSelectedAccountId={setSelectedAccountId}
          onOpenTradeModal={handleOpenTradeModal}
          currentBlockStatus={currentBlockStatus}
          riskManagerEnabled={riskManagerEnabled}
          language={language} 
          onLanguageToggle={() => setLanguage(language === 'ro' ? 'en' : 'ro')}
          dailyPreps={dailyPreps}
          weeklyPreps={weeklyPreps}
        />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<TGMap />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market-watch" element={<MarketWatch language={language} tickers={tickers} loadingTickers={loadingTickers} />} />
            <Route path="/journal" element={<DailyJournal trades={activeTrades} accounts={accounts} dailyPreps={dailyPreps} weeklyPreps={weeklyPreps} onSavePrep={saveDailyPrep} onSaveWeeklyPrep={saveWeeklyPrep} playbooks={playbooks} language={language} onSaveNote={saveDailyNote} dailyNotes={{}} />} />
            <Route path="/backtesting" element={<Backtesting sessions={backtestSessions} onAddSession={addBacktestSession} playbooks={playbooks} />} />
            <Route path="/trades" element={<TradeLog trades={activeTrades} accounts={accounts} onDeleteTrade={deleteTrade} language={language} dailyPreps={dailyPreps} onSavePrep={saveDailyPrep} />} />
            <Route path="/trade/:id" element={<TradeDetail trades={trades} accounts={accounts} playbooks={playbooks} dailyPreps={dailyPreps} onUpdate={updateTrade} onDelete={deleteTrade} language={language} />} />
            <Route path="/analytics" element={<Analytics trades={activeTrades} language={language} />} />
            <Route path="/calendar" element={<Calendar trades={activeTrades} dailyNotes={{}} onSaveNote={saveDailyNote} onDeleteTrade={deleteTrade} dailyPreps={dailyPreps} language={language} activeAccount={activeAccount} />} />
            <Route path="/risk" element={<RiskManagement accounts={accounts} trades={trades} onUpdateAccount={updateAccount} selectedAccountId={selectedAccountId} language={language} />} />
            <Route path="/habits" element={<HabitTracker dailyPreps={dailyPreps} trades={activeTrades} language={language} />} />
            <Route path="/academy" element={<TradeAcademy language={language} />} />
            <Route path="/playbooks" element={<Playbooks playbooks={playbooks} trades={activeTrades} backtestTrades={backtestTrades} language={language} />} />
            <Route path="/playbooks/new" element={<PlaybookEditor onSave={savePlaybook} language={language} trades={activeTrades} />} />
            <Route path="/playbooks/edit/:id" element={<PlaybookEditor playbooks={playbooks} onSave={savePlaybook} onDelete={deletePlaybook} language={language} trades={activeTrades} />} />
            <Route path="/reports/*" element={<ReportsPage trades={activeTrades} language={language} />} />
            <Route path="/economic" element={<EconomicCalendar language={language} />} />
            <Route path="/challenge" element={<ChallengeDashboard />} />
            <Route path="/accounts" element={<AccountManagement accounts={accounts} activeOrders={useAppContext().activeOrders} onUpdate={updateAccount} onDelete={deleteAccount} onAdd={() => setIsAccountModalOpen(true)} language={language} />} />
            <Route path="/faq" element={<FAQ language={language} />} />
          </Routes>
        </main>
      </div>

      <NewTradeModal isOpen={isNewTradeModalOpen} onClose={() => setIsNewTradeModalOpen(false)} onSave={addTrade} accounts={accounts} playbooks={playbooks} trades={trades} dailyPreps={dailyPreps} language={language} currentAccountId={selectedAccountId} />
      <NewAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={(acc) => setAccounts([...accounts, acc])} language={language} />
      
      <RithmicSyncModal isOpen={isRithmicModalOpen} onClose={() => setIsRithmicModalOpen(false)} onSync={(res) => { console.log("CSV Sync Result:", res); }} onLiveConnect={(accs) => { setAccounts(prev => { const existingIds = new Set(prev.map(a => a.id)); return [...prev, ...accs.filter(a => !existingIds.has(a.id))]; }); }} accounts={accounts} language={language} />

      {isWeeklyPrepModalOpen && (
        <WeeklyPrepModal 
            initialData={currentWeeklyPrep} 
            language={language} 
            onClose={() => setIsWeeklyPrepModalOpen(false)} 
            onSave={(wid, p) => { saveWeeklyPrep(wid, p); setIsWeeklyPrepModalOpen(false); }} 
        />
      )}

      {/* ADVISOR AUDIT POPUP */}
      {showAdvisorAudit && advisorData.metrics && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-[#0b1222] border border-slate-800 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0b1222] via-[#060b13]/90 to-[#060b13] pointer-events-none"></div>
              
              <div className="relative z-10 p-10 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Live Protocol Scan</p>
                        <h5 className="text-xl font-black text-white uppercase italic tracking-tighter">TG ADVISOR AUDIT</h5>
                      </div>
                      <button onClick={() => setShowAdvisorAudit(false)} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                        <i className="fas fa-times"></i>
                      </button>
                  </div>
                  
                  <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2 pb-4">
                      <div>
                          <h5 className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-3 border-l-2 border-blue-500 pl-3">P // PREPARATION (20%)</h5>
                          <div className="bg-slate-900/20 rounded-2xl p-2">
                            <AuditItem done={advisorData.metrics.p.hasGatekeeper} label="Gatekeeper Scanned" sub="Biometrics & Mental Readiness" />
                            <AuditItem done={advisorData.metrics.p.preFightSigned} label="Pre-Fight Contract" sub="Uncertainty Acceptance signed" />
                          </div>
                      </div>

                      <div>
                          <h5 className="text-[8px] font-black text-orange-500/60 uppercase tracking-[0.2em] mb-3 border-l-2 border-orange-500 pl-3">E // EXECUTION (50%)</h5>
                          <div className="bg-slate-900/20 rounded-2xl p-2">
                            <AuditItem done={advisorData.metrics.e.tradeCount > 0} label="Trade Logs Active" sub={`${advisorData.metrics.e.tradeCount} entries recorded`} />
                            <AuditItem done={advisorData.metrics.e.allNotes} label="Reasoning Strings" sub="Notes complete for all trades" />
                            <AuditItem done={advisorData.metrics.e.lowTilt} label="Tilt Control" sub="Discipline Score > 4 strictly" />
                          </div>
                      </div>

                      <div>
                          <h5 className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-3 border-l-2 border-emerald-500 pl-3">R // REVIEW (30%)</h5>
                          <div className="bg-slate-900/20 rounded-2xl p-2">
                            <AuditItem done={advisorData.metrics.r.allReviewed} label="Post-Mortems Complete" sub="Min 10 characters per review" />
                            <AuditItem done={advisorData.metrics.r.wrapUpDone} label="Day Wrap-Up Protocol" sub="Daily lesson and habits saved" />
                          </div>
                      </div>

                      <div>
                          <h5 className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 border-l-2 border-red-500 pl-3">V // THE SENTINEL (VETO)</h5>
                          <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/10 shadow-inner">
                              <AuditItem done={!advisorData.metrics.v.hasSlViolation} label="Stop Loss Integrity" sub={advisorData.metrics.v.hasSlViolation ? "CRITICAL FAILURE" : "PASSED"} />
                              <AuditItem done={!advisorData.metrics.v.hasRevenge} label="Emotional Friction" sub={advisorData.metrics.v.hasRevenge ? "REVENGE TRADING DETECTED" : "PASSED"} />
                          </div>
                      </div>
                  </div>
                  
                  <button 
                      onClick={() => setShowAdvisorAudit(false)}
                      className="relative z-10 mt-6 w-full py-5 bg-blue-600 hover:bg-blue-500 text-[11px] font-black text-white uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-blue-600/30 active:scale-95"
                  >
                      CONTINUE PROTOCOL
                  </button>
              </div>
           </div>
        </div>
      )}

      {blockingModal.type !== 'none' && (
        <BlockingOverlay 
          type={blockingModal.type} 
          expires={blockingModal.expires} 
          tm={tm} 
          onClose={() => setBlockingModal({ type: 'none' })} 
          onGoToPrep={() => { setBlockingModal({ type: 'none' }); navigate('/journal'); }} 
          onGoToReview={() => { setBlockingModal({ type: 'none' }); navigate('/trades'); }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
