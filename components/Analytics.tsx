
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trade } from '../types';
import { getRealtimeMarketContext, getDashboardInsights } from '../geminiService';
import { Language } from '../translations';

/* Added language to AnalyticsProps to fix TypeScript error in App.tsx */
interface AnalyticsProps {
  trades: Trade[];
  language: Language;
}

const Analytics: React.FC<AnalyticsProps> = ({ trades, language }) => {
  const [marketData, setMarketData] = useState<{text: string, sources: any[]} | null>(null);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAIIntel = async () => {
    setLoading(true);
    try {
      const [market, tip] = await Promise.all([
        getRealtimeMarketContext(),
        getDashboardInsights(trades)
      ]);
      setMarketData(market);
      setCoachTip(tip);
    } catch (error) {
      console.error("AI Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIIntel();
  }, [trades]);

  const winCount = trades.filter(t => t.status === 'WIN').length;
  const lossCount = trades.filter(t => t.status === 'LOSS').length;
  const beCount = trades.filter(t => t.status === 'BE').length;

  const outcomeData = [
    { name: 'Wins', value: winCount, color: '#10b981' },
    { name: 'Losses', value: lossCount, color: '#f43f5e' },
    { name: 'Break-even', value: beCount, color: '#64748b' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* AI Market Context Section */}
      <div className="bg-[#0b1222] border border-slate-800/50 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800/50 relative z-10">
          
          {/* Left Column: Control & Coach */}
          <div className="lg:w-1/3 p-8 flex flex-col h-full">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <i className={`fas ${loading ? 'fa-sync fa-spin' : 'fa-brain'} text-white text-xl`}></i>
              </div>
              <div>
                <h3 className="text-white font-black text-xl tracking-tight uppercase">AI Market Context</h3>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Real-time NQ/ES Intelligence</p>
              </div>
            </div>

            <button 
              onClick={fetchAIIntel}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-widest mb-8"
            >
              {loading ? "Scanning markets..." : "Refresh Intelligence"}
            </button>

            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center">
                <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
                AI TRADING COACH TIP:
              </p>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 max-h-[350px] overflow-y-auto custom-scrollbar">
                <p className="text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                  {loading ? (
                    <span className="animate-pulse">Se analizează performanța ta...</span>
                  ) : (
                    coachTip || "No performance data yet. Start trading to receive personalized feedback."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & News */}
          <div className="flex-1 p-8 bg-slate-950/30">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                LIVE MARKET NARRATIVE
              </p>
              {marketData?.sources && (
                 <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                   {marketData.sources.length} sources found
                 </span>
              )}
            </div>

            <div className="bg-slate-900/50 border border-slate-800/50 rounded-[2rem] p-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-6">
                  <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-4/6 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                </div>
              ) : (
                <div className="text-slate-200 text-sm leading-8 font-medium whitespace-pre-wrap">
                   {marketData?.text || "Analiza pieței este pregătită. Apasă butonul de refresh pentru contextul actualizat de astăzi."}
                </div>
              )}
            </div>

            {marketData?.sources && marketData.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800/50">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">GROUNDED SOURCES</p>
                <div className="flex flex-wrap gap-3">
                  {marketData.sources.slice(0, 4).map((chunk: any, i: number) => (
                    <a 
                      key={i} 
                      href={chunk.web?.uri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center space-x-3 text-[10px] bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl text-blue-400 transition-all border border-slate-800 hover:border-blue-500/50 group"
                    >
                      <i className="fas fa-link text-[8px] opacity-50 group-hover:opacity-100"></i>
                      <span className="truncate max-w-[180px] font-black uppercase tracking-tight">{chunk.web?.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <i className="fas fa-satellite-dish absolute -bottom-10 -right-10 text-[200px] text-white/5 pointer-events-none"></i>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0b1222] border border-slate-800/50 p-8 rounded-[2.5rem] shadow-sm">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-10 flex items-center">
            <i className="fas fa-chart-pie mr-3 text-blue-500"></i>
            Outcome Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {outcomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '11px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0b1222] border border-slate-800/50 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center">
            <i className="fas fa-bolt mr-3 text-orange-500"></i>
            Quick AI Stats
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Profit Factor</p>
              <p className="text-3xl font-black text-blue-400">2.45</p>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Expectancy</p>
              <p className="text-3xl font-black text-green-400">${trades.length > 0 ? (trades.reduce((s,t) => s+t.pnlNet, 0) / trades.length).toFixed(2) : '0.00'}</p>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl col-span-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI Performance Index</p>
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[72%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <span className="text-white font-black">72/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
