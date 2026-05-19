import type { SearchProfile } from './types';
import type { StorageAdapter } from './storage';

export const PROFILES_KEY = 'searchpin:profiles';

export function defaultProfiles(): SearchProfile[] {
  return [
    {
      id: 'reddit',
      name: 'Reddit',
      modifier: 'site:reddit.com',
      enabled: true,
      isDefault: true,
    },
    {
      id: 'github',
      name: 'GitHub',
      modifier: 'site:github.com',
      enabled: true,
      isDefault: false,
    },
    {
      id: 'stackoverflow',
      name: 'Stack Overflow',
      modifier: 'site:stackoverflow.com',
      enabled: true,
      isDefault: false,
    },
  ];
}

export function generateId(): string {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

/**
 * Ensures exactly one enabled profile carries `isDefault: true`. If multiple
 * are flagged, the first wins; if none are flagged, the first enabled becomes
 * the default. Returns a new array, not a mutation of the input.
 */
export function normalizeProfiles(profiles: SearchProfile[]): SearchProfile[] {
  const enabled = profiles.filter((p) => p.enabled);
  if (enabled.length === 0) {
    return profiles.map((p) => ({ ...p, isDefault: false }));
  }
  const flaggedDefaults = enabled.filter((p) => p.isDefault);
  const chosenDefaultId =
    flaggedDefaults[0]?.id ?? enabled[0]!.id;
  return profiles.map((p) => ({
    ...p,
    isDefault: p.enabled && p.id === chosenDefaultId,
  }));
}

export async function loadProfiles(storage: StorageAdapter): Promise<SearchProfile[]> {
  const stored = await storage.get<SearchProfile[]>(PROFILES_KEY);
  if (!stored || stored.length === 0) return defaultProfiles();
  return normalizeProfiles(stored);
}

export async function saveProfiles(
  storage: StorageAdapter,
  profiles: SearchProfile[],
): Promise<void> {
  await storage.set(PROFILES_KEY, normalizeProfiles(profiles));
}

export function getDefaultProfile(profiles: SearchProfile[]): SearchProfile | null {
  return profiles.find((p) => p.enabled && p.isDefault) ?? null;
}

/**
 * The profile that should be applied to a given tab. A per-tab override (set
 * via the in-page UI) wins over the global default.
 */
export function getActiveProfile(
  profiles: SearchProfile[],
  overrideId: string | undefined,
): SearchProfile | null {
  if (overrideId) {
    const override = profiles.find((p) => p.id === overrideId && p.enabled);
    if (override) return override;
  }
  return getDefaultProfile(profiles);
}

/**
 * Returns the next enabled profile after `currentId`, wrapping around at the
 * end of the list. If `currentId` isn't found or no profile is enabled, falls
 * back to the first enabled profile (or null if none). `direction` is +1 to
 * move forward, -1 to move backward.
 */
export function getNextProfile(
  profiles: SearchProfile[],
  currentId: string | undefined,
  direction: 1 | -1 = 1,
): SearchProfile | null {
  const enabled = profiles.filter((p) => p.enabled);
  if (enabled.length === 0) return null;
  if (enabled.length === 1) return enabled[0]!;

  const currentIndex = currentId ? enabled.findIndex((p) => p.id === currentId) : -1;
  if (currentIndex === -1) return enabled[0]!;

  const nextIndex = (currentIndex + direction + enabled.length) % enabled.length;
  return enabled[nextIndex]!;
}
