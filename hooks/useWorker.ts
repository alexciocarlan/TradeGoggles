
import { useCallback } from 'react';

/**
 * Hook dezafectat pentru a preveni utilizarea Web Workerilor.
 * Returnează o interfață compatibilă dar care nu face nimic, 
 * asigurând că aplicația nu încearcă să creeze instanțe de Worker.
 */
export function useWorker<T = any>(
  workerScriptPath: string,
  options?: WorkerOptions
) {
  const sendMessage = useCallback((message: T) => {
    console.warn(`[useWorker] Utilizarea workerilor este dezactivată. Mesajul nu a fost trimis:`, message);
  }, []);

  return { 
    worker: null, 
    sendMessage, 
    isLoading: false, 
    error: null, 
    response: null 
  };
}
