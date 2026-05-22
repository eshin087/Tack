import { findEngine } from '../../core/engines';
import { mountResultsBar, removeResultsBar, BAR_ID, PILL_ID } from '../../ui/results-bar';
import { injectGoogleAdHider } from '../../ui/ad-hider';
import {
  loadKeybindings,
  matchesKeybinding,
  type Keybindings,
  type KeybindingAction,
} from '../../core/keybindings';
import { loadPreferences, PREFERENCES_STORAGE_KEY } from '../../core/preferences';
import { chromeSyncStorage } from './storage-adapter';
import type { RuntimeResponse } from '../../core/types';

function isUiMounted(): boolean {
  return !!(document.getElementById(BAR_ID) ?? document.getElementById(PILL_ID));
}

let lastRenderedUrl = '';
let silentMode = false;
// Per-tab override: when true, the user has explicitly requested the bar
// be shown even though silentMode is on. Toggled by the `show` action.
let showOverride = false;

function shouldHideUi(): boolean {
  return silentMode && !showOverride;
}

async function refreshPreferences(): Promise<void> {
  const prefs = await loadPreferences(chromeSyncStorage);
  silentMode = prefs.silentMode;
}

// Kicked off synchronously at module load so the very first render() — whether
// triggered by the IIFE, the MutationObserver, pageshow, or any other path —
// blocks on it. Without this, render() can run with silentMode still `false`
// (the default), briefly mount the bar, and then remove it once the real value
// arrives. That is exactly the flash the user reported.
let preferencesReady: Promise<void> = refreshPreferences();

async function render(): Promise<void> {
  await preferencesReady;

  const url = new URL(window.location.href);
  const engine = findEngine(url);

  if (!engine) {
    removeResultsBar();
    return;
  }

  // Always hide Google ads on Google results pages, independent of filter state.
  if (engine.id === 'google') {
    injectGoogleAdHider();
  }

  lastRenderedUrl = window.location.href;

  if (shouldHideUi()) {
    removeResultsBar();
    return;
  }

  const response = (await chrome.runtime.sendMessage({ type: 'getState' })) as
    | RuntimeResponse
    | undefined;
  if (!response || response.type !== 'state') return;

  // shouldHideUi() can flip between the await above and now if the user
  // toggled Silent mode while we were waiting for getState. Re-check.
  if (shouldHideUi()) {
    removeResultsBar();
    return;
  }

  mountResultsBar({
    profiles: response.profiles,
    activeProfile: response.activeProfile,
    tabState: response.tabState,
  });
}

function handleShowAction(): void {
  showOverride = !showOverride;
  if (!showOverride) {
    removeResultsBar();
  } else {
    void render();
  }
}

void render();

// Detect SPA URL changes and DOM tear-downs from the host page. Background
// handles the actual URL rewriting via webNavigation; this observer just
// keeps the injected bar in sync.
const observer = new MutationObserver(() => {
  if (window.location.href !== lastRenderedUrl) {
    void render();
  } else if (!isUiMounted() && !shouldHideUi()) {
    // Only re-render if BOTH the bar and the pill are gone — the pill is the
    // intentional successor to the bar after the 3-second auto-collapse.
    void render();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('pageshow', () => {
  void render();
});

// In-page keybindings: lets users bind combos that chrome.commands forbids
// (e.g. bare "Shift+Q"). We listen at the document level and skip when the
// user is typing into the search box, so we never swallow real input.
let keybindings: Keybindings = {};

async function refreshKeybindings(): Promise<void> {
  keybindings = await loadKeybindings(chromeSyncStorage);
}
void refreshKeybindings();

chromeSyncStorage.onChange((key) => {
  if (key === 'tack:keybindings') void refreshKeybindings();
  if (key === PREFERENCES_STORAGE_KEY) {
    // Replace the gate so any in-flight render() awaiting the old promise
    // sees the updated silentMode by the time it reads shouldHideUi().
    preferencesReady = refreshPreferences();
    void preferencesReady.then(() => render());
  }
});

chrome.runtime.onMessage.addListener((message: { type?: string } | null) => {
  if (message?.type === 'showUiToggle') handleShowAction();
});

function isTextInputFocused(event: KeyboardEvent): boolean {
  const t = event.target as Element | null;
  if (!t) return false;
  const tag = t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (t as HTMLElement).isContentEditable;
}

document.addEventListener(
  'keydown',
  (event) => {
    if (isTextInputFocused(event)) return;
    const actions: KeybindingAction[] = ['toggle', 'enable', 'disable', 'show', 'cycle', 'cycleBack'];
    for (const action of actions) {
      const kb = keybindings[action];
      if (kb && matchesKeybinding(event, kb)) {
        event.preventDefault();
        event.stopPropagation();
        if (action === 'show') {
          handleShowAction();
        } else {
          void chrome.runtime.sendMessage({ type: 'invokeAction', action });
        }
        return;
      }
    }
  },
  true, // capture phase so we run before site handlers
);
