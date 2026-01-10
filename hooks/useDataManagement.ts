
import React, { useRef } from 'react';
import { useAppStore } from '../AppContext';
import { useShallow } from 'zustand/react/shallow';
import { getErrorMessage } from '../utils/errorUtils';

const useDataManagement = () => {
  const { 
    trades, accounts, dailyPreps, weeklyPreps, playbooks, dailyNotes, addNotification 
  } = useAppStore(useShallow(state => ({
    trades: state.trades || [],
    accounts: state.accounts || [],
    dailyPreps: state.dailyPreps || {},
    weeklyPreps: state.weeklyPreps || {},
    playbooks: state.playbooks || [],
    dailyNotes: state.dailyNotes || {},
    addNotification: state.addNotification
  })));

  const fileImportRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleBackup = () => {
    addNotification('info', 'Inițiere proces backup local...', 2000);
    
    try {
      // PROCESARE PE THREAD-UL PRINCIPAL (FĂRĂ WORKER)
      // Deoarece datele de jurnal sunt în general de ordinul câtorva MB, 
      // operațiunea este instantanee pe dispozitivele moderne.
      const fullState = { trades, accounts, dailyPreps, weeklyPreps, playbooks, dailyNotes };
      const jsonString = JSON.stringify(fullState, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `trade_goggles_backup_${todayStr}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      addNotification('success', 'Backup finalizat cu succes.', 3000);
    } catch (err) {
      const extractedErrorMessage = getErrorMessage(err);
      console.error(`Backup Failed: ${extractedErrorMessage}`);
      addNotification('error', `Eroare Backup: ${extractedErrorMessage.split('\n')[0]}`, 5000);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.trades) {
          if (confirm('Importul va fuziona aceste date cu cele existente. Continui?')) {
            useAppStore.setState({ 
              trades: [...trades, ...data.trades],
              accounts: [...accounts, ...(data.accounts || [])],
              dailyPreps: { ...dailyPreps, ...(data.dailyPreps || {}) },
              weeklyPreps: { ...weeklyPreps, ...(data.weeklyPreps || {}) },
              dailyNotes: { ...dailyNotes, ...(data.dailyNotes || {}) },
              playbooks: data.playbooks || playbooks
            });
            addNotification('success', 'Date importate cu succes.', 3000);
          }
        }
      } catch (err) {
        addNotification('error', `Format fișier nevalid: ${getErrorMessage(err)}`, 5000);
      }
    };
    reader.readAsText(file);
  };

  return { handleBackup, handleImport, fileImportRef };
};

export default useDataManagement;
