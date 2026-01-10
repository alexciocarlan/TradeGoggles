
import { useEffect } from 'react';
import { useAppStore } from '../AppContext';
import { rithmicLive } from '../rithmicLiveService';

export const useRithmic = () => {
  const setRithmicStatus = useAppStore(state => state.setRithmicStatus);

  useEffect(() => {
    // Subscribe to Rithmic service status updates and dispatch to store
    const unsubscribe = rithmicLive.subscribe((status) => {
      setRithmicStatus(status);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setRithmicStatus]);
};
