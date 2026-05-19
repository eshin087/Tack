import { findEngine } from '../../core/engines';
import { rewriteUrl, stripModifier } from '../../core/rewriter';
import {
  getActiveProfile,
  getNextProfile,
  loadProfiles,
  saveProfiles,
  defaultProfiles,
} from '../../core/profiles';
import { loadPreferences, savePreferences } from '../../core/preferences';
import type { RuntimeMessage, RuntimeResponse, SearchProfile, TabState } from '../../core/types';
import { chromeSyncStorage } from './storage-adapter';
import { chromeTabStateStore } from './tab-state-adapter';

/**
 * Returns the effective tab state for the given tab. If the tab has no
 * per-tab state of its own (e.g. a freshly opened tab), falls back to the
 * global `lastFilterDisabled` preference so the user's last filter on/off
 * choice is honored across new tabs.
 */
async function getEffectiveTabState(tabId: number): Promise<TabState> {
  const k = `tab:${tabId}`;
  const result = await chrome.storage.session.get(k);
  const stored = result[k] as TabState | undefined;
  if (stored) return stored;

  const prefs = await loadPreferences(chromeSyncStorage);
  return { filterDisabled: prefs.lastFilterDisabled };
}

/**
 * Writes tab state and also syncs `lastFilterDisabled` so any *future* new tab
 * inherits the same on/off choice. The "current active profile" stays per-tab.
 */
async function persistTabState(tabId: number, state: TabState): Promise<void> {
  await chromeTabStateStore.set(tabId, state);
  const prefs = await loadPreferences(chromeSyncStorage);
  if (prefs.lastFilterDisabled !== state.filterDisabled) {
    await savePreferences(chromeSyncStorage, {
      ...prefs,
      lastFilterDisabled: state.filterDisabled,
    });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chromeSyncStorage.get<SearchProfile[]>('searchpin:profiles');
  if (!existing || existing.length === 0) {
    await saveProfiles(chromeSyncStorage, defaultProfiles());
  }
});

async function applyForUrl(tabId: number, rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  if (!findEngine(url)) return;

  const tabState = await getEffectiveTabState(tabId);
  if (tabState.filterDisabled) return;

  const profiles = await loadProfiles(chromeSyncStorage);
  const profile = getActiveProfile(profiles, tabState.activeProfileId);
  if (!profile) return;

  const result = rewriteUrl(rawUrl, profile);
  if (result.shouldRewrite && result.newUrl && result.newUrl !== rawUrl) {
    try {
      await chrome.tabs.update(tabId, { url: result.newUrl });
    } catch {
      // Tab may have been closed mid-navigation; safe to ignore.
    }
  }
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  void applyForUrl(details.tabId, details.url);
});

// Catches Google's SPA-style "search again from the results box" navigations,
// where the URL changes via history.pushState rather than a full page load.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  void applyForUrl(details.tabId, details.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void chromeTabStateStore.clear(tabId);
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

async function reapplyAfterStateChange(
  tabId: number,
  currentUrl: string,
  before: TabState,
  after: TabState,
): Promise<void> {
  const profiles = await loadProfiles(chromeSyncStorage);
  const beforeProfile = getActiveProfile(profiles, before.activeProfileId);
  const afterProfile = getActiveProfile(profiles, after.activeProfileId);

  // Start from the URL stripped of the previously-active modifier (if any),
  // so switching profiles doesn't leave the old modifier hanging around.
  let url = currentUrl;
  if (beforeProfile) {
    url = stripModifier(url, beforeProfile.modifier);
  }

  if (after.filterDisabled || !afterProfile) {
    if (url !== currentUrl) {
      await chrome.tabs.update(tabId, { url });
    }
    return;
  }

  const result = rewriteUrl(url, afterProfile);
  const target = result.shouldRewrite && result.newUrl ? result.newUrl : url;
  if (target !== currentUrl) {
    await chrome.tabs.update(tabId, { url: target });
  }
}

type FilterAction = 'toggle' | 'enable' | 'disable' | 'cycle' | 'cycleBack';

async function applyFilterAction(tabId: number, tabUrl: string, action: FilterAction): Promise<void> {
  let url: URL;
  try {
    url = new URL(tabUrl);
  } catch {
    return;
  }
  if (!findEngine(url)) return;

  const before = await getEffectiveTabState(tabId);
  let after: TabState;

  if (action === 'cycle' || action === 'cycleBack') {
    const profiles = await loadProfiles(chromeSyncStorage);
    const currentProfile = getActiveProfile(profiles, before.activeProfileId);
    const direction = action === 'cycle' ? 1 : -1;
    const nextProfile = getNextProfile(profiles, currentProfile?.id, direction);
    if (!nextProfile) return;
    // Cycling also re-enables the filter — otherwise it's a confusing no-op.
    after = { filterDisabled: false, activeProfileId: nextProfile.id };
  } else {
    const filterDisabled =
      action === 'enable' ? false : action === 'disable' ? true : !before.filterDisabled;
    after = { ...before, filterDisabled };
  }

  await persistTabState(tabId, after);
  await reapplyAfterStateChange(tabId, tabUrl, before, after);
}

function commandToAction(command: string): FilterAction | null {
  if (command === 'toggle-filter') return 'toggle';
  if (command === 'enable-filter') return 'enable';
  if (command === 'disable-filter') return 'disable';
  if (command === 'cycle-profile') return 'cycle';
  if (command === 'cycle-profile-back') return 'cycleBack';
  return null;
}

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  if (command === 'show-ui') {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'showUiToggle' });
    } catch {
      // No content script on this tab (not a search results page).
    }
    return;
  }

  const action = commandToAction(command);
  if (!action) return;
  await applyFilterAction(tab.id, tab.url, action);
});

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeResponse) => void,
  ) => {
    void handleMessage(message, sender).then(sendResponse);
    return true; // tells Chrome we'll respond asynchronously
  },
);

async function handleMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> {
  const tabId = sender.tab?.id;
  const tabUrl = sender.tab?.url;

  switch (message.type) {
    case 'getState': {
      const profiles = await loadProfiles(chromeSyncStorage);
      const tabState = tabId !== undefined
        ? await getEffectiveTabState(tabId)
        : { filterDisabled: false };
      const activeProfile = getActiveProfile(profiles, tabState.activeProfileId);
      return { type: 'state', profiles, tabState, activeProfile };
    }
    case 'setFilterDisabled': {
      if (tabId === undefined || !tabUrl) return { type: 'ack' };
      const before = await getEffectiveTabState(tabId);
      const after: TabState = { ...before, filterDisabled: message.disabled };
      await persistTabState(tabId, after);
      await reapplyAfterStateChange(tabId, tabUrl, before, after);
      return { type: 'ack' };
    }
    case 'setActiveProfile': {
      if (tabId === undefined || !tabUrl) return { type: 'ack' };
      const before = await getEffectiveTabState(tabId);
      const after: TabState = {
        filterDisabled: false,
        ...(message.profileId !== null ? { activeProfileId: message.profileId } : {}),
      };
      await persistTabState(tabId, after);
      await reapplyAfterStateChange(tabId, tabUrl, before, after);
      return { type: 'ack' };
    }
    case 'openOptions': {
      await chrome.runtime.openOptionsPage();
      return { type: 'ack' };
    }
    case 'invokeAction': {
      if (tabId === undefined || !tabUrl) return { type: 'ack' };
      await applyFilterAction(tabId, tabUrl, message.action);
      return { type: 'ack' };
    }
  }
}
