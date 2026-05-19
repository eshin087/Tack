import type { StorageAdapter } from './storage';

export interface Preferences {
  silentMode: boolean;
  /**
   * Global "last filter state" — sticky across new tabs. When a tab has no
   * per-tab state of its own, this is used as the default. Updated every time
   * the user toggles the filter on any tab.
   */
  lastFilterDisabled: boolean;
}

const STORAGE_KEY = 'searchpin:preferences';
const DEFAULTS: Preferences = { silentMode: false, lastFilterDisabled: false };

export async function loadPreferences(storage: StorageAdapter): Promise<Preferences> {
  const stored = await storage.get<Partial<Preferences>>(STORAGE_KEY);
  return { ...DEFAULTS, ...(stored ?? {}) };
}

export async function savePreferences(
  storage: StorageAdapter,
  prefs: Preferences,
): Promise<void> {
  await storage.set(STORAGE_KEY, prefs);
}

export const PREFERENCES_STORAGE_KEY = STORAGE_KEY;
