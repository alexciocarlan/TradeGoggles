import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';

/**
 * IMPLEMENTARE RECOMANDATĂ: Consum date throttled
 * Utilizează starea globală marketData care este actualizată la un interval fix de 250ms.
 */
export const useRithmicData = () => {
  return useAppStore(useShallow(state => state.marketData));
};