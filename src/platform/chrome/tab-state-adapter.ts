import type { TabState } from '../../core/types';
import type { TabStateStore } from '../../core/tab-state';
import { DEFAULT_TAB_STATE } from '../../core/tab-state';

// Per-tab state lives in chrome.storage.session so the service worker can be
// torn down and rehydrated without losing the user's "Show all results" toggle.
const key = (tabId: number) => `tab:${tabId}`;

export const chromeTabStateStore: TabStateStore = {
  async get(tabId: number): Promise<TabState> {
    const k = key(tabId);
    const result = await chrome.storage.session.get(k);
    return (result[k] as TabState | undefined) ?? DEFAULT_TAB_STATE;
  },
  async set(tabId: number, state: TabState): Promise<void> {
    await chrome.storage.session.set({ [key(tabId)]: state });
  },
  async clear(tabId: number): Promise<void> {
    await chrome.storage.session.remove(key(tabId));
  },
};
