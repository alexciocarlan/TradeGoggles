
import { create } from 'zustand';
import { TradesSlice, createTradesSlice } from './store/tradesSlice';
import { AccountsSlice, createAccountsSlice } from './store/accountsSlice';
import { PlaybooksSlice, createPlaybooksSlice } from './store/playbooksSlice';
import { JournalSlice, createJournalSlice } from './store/journalSlice';
import { BacktestSessionSlice, createBacktestSessionSlice } from './store/backtestSessionSlice';
import { UISlice, createUISlice } from './store/uiSlice';

export type AppState = TradesSlice & AccountsSlice & PlaybooksSlice & JournalSlice & BacktestSessionSlice & UISlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createTradesSlice(...a),
  ...createAccountsSlice(...a),
  ...createPlaybooksSlice(...a),
  ...createJournalSlice(...a),
  ...createBacktestSessionSlice(...a),
  ...createUISlice(...a),
}));

export const useAppContext = useAppStore;
