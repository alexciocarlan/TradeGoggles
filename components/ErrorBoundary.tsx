import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getErrorMessage } from '../utils/errorUtils';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
  errorInfo: ErrorInfo | null;
}

/**
 * Standard React Error Boundary.
 * Correctly typed for TypeScript and React 19 lifecycle safety.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: any): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    const msg = getErrorMessage(error);
    const stack = errorInfo?.componentStack || 'No component stack available';
    console.error("Critical Protocol Failure Trace:", msg, "\nComponent Stack:", stack);
  }

  private handleReset = () => {
    if (window.confirm("Această acțiune va încerca să reseteze stocarea locală pentru a repara aplicația. Continui?")) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("Storage clearing blocked by browser.");
      }
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const displayMessage = getErrorMessage(this.state.error);
      const stackSnippet = this.state.errorInfo?.componentStack?.trim().substring(0, 500) || 'NO STACK DATA';
      
      return (
        <div className="min-h-screen bg-[#060b13] flex items-center justify-center p-6 font-sans text-slate-100">
          <div className="bg-[#0b1222] border border-red-500/30 rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden">
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <i className="fas fa-microchip text-red-500 text-3xl animate-pulse"></i>
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Protocol Breach Detected</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
                Sistemul a întâmpinat o eroare critică de randare. Acest lucru se datorează adesea unei actualizări de stare nesincronizate sau a unor resurse lazy-loaded blocate (Error #525).
              </p>
              
              <div className="bg-black/40 border border-slate-800 p-6 rounded-2xl mb-10 text-left space-y-4">
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 italic underline">Error Intel:</p>
                  <p className="text-[11px] font-mono text-slate-300 break-all leading-tight uppercase">
                    {displayMessage}
                  </p>
                </div>
                {this.state.errorInfo && (
                  <div className="pt-4 border-t border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Component Context:</p>
                    <pre className="text-[9px] font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar">
                      {stackSnippet}
                    </pre>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={this.handleReload} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl uppercase text-[10px] tracking-widest">Reboot System</button>
                <button onClick={this.handleReset} className="bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-500 font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest">Clear Storage & Reset</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;