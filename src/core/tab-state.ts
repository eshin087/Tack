import type { TabState } from './types';

export const DEFAULT_TAB_STATE: TabState = { filterDisabled: false };

export interface TabStateStore {
  get(tabId: number): Promise<TabState>;
  set(tabId: number, state: TabState): Promise<void>;
  clear(tabId: number): Promise<void>;
}
