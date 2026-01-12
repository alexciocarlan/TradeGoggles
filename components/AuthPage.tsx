
import React, { useState } from 'react';
import { User } from '../types';
import { useAppStore } from '../AppContext'; // NEW: Import useAppStore

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  // NEW: Fetch language and isDarkMode from the store and persist them
  const setLanguage = useAppStore(state => state.setLanguage);
  const setIsDarkMode = useAppStore(state => state.setIsDarkMode);
  const language = useAppStore(state => state.language);
  const isDarkMode = useAppStore(state => state.isDarkMode);


  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const usersStr = localStorage.getItem('tv_users') || '[]';
    const users: User[] = JSON.parse(usersStr);

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
        // NEW: Load user's language/theme settings here on successful login if user-specific settings exist
        // For now, assuming these are global or default to store.
      } else {
        setError('Email sau parolă incorectă.');
      }
    } else {
      if (users.find(u => u.email === email)) {
        setError('Acest email este deja înregistrat.');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        password
      };
      localStorage.setItem('tv_users', JSON.stringify([...users, newUser]));
      onLogin(newUser);
      // NEW: Set default language and theme for new user.
      setLanguage('ro'); 
      setIsDarkMode(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-full max-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/20 rotate-3">
            <i className="fas fa-chart-line text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TradeGoggles</h1>
          <p className="text-slate-400 mt-2">Platforma ta inteligentă de trading journal</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex mb-8 bg-slate-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Autentificare
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Înregistrare
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-xs font-bold flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
            )}
            
            {!isLogin && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Nume Complet</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="Ion Popescu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                <input 
                  type="email" 
                  required 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Parolă</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                <input 
                  type="password" 
                  required 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] mt-4">
              {isLogin ? 'INTRĂ ÎN CONT' : 'CREEAZĂ CONT'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-medium italic">
              "Trading is not about being right, it's about being disciplined."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;