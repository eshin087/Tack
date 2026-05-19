import { describe, it, expect } from 'vitest';
import {
  normalizeProfiles,
  getDefaultProfile,
  getActiveProfile,
  getNextProfile,
  defaultProfiles,
} from '../src/core/profiles';
import type { SearchProfile } from '../src/core/types';

function profile(p: Partial<SearchProfile> & { id: string }): SearchProfile {
  return {
    name: p.id,
    modifier: 'site:example.com',
    enabled: true,
    isDefault: false,
    ...p,
  };
}

describe('normalizeProfiles', () => {
  it('picks the first enabled profile as default if none are flagged', () => {
    const out = normalizeProfiles([
      profile({ id: 'a' }),
      profile({ id: 'b' }),
    ]);
    expect(out[0]!.isDefault).toBe(true);
    expect(out[1]!.isDefault).toBe(false);
  });

  it('keeps the flagged default if exactly one is set', () => {
    const out = normalizeProfiles([
      profile({ id: 'a' }),
      profile({ id: 'b', isDefault: true }),
    ]);
    expect(out[0]!.isDefault).toBe(false);
    expect(out[1]!.isDefault).toBe(true);
  });

  it('collapses multiple defaults to the first', () => {
    const out = normalizeProfiles([
      profile({ id: 'a', isDefault: true }),
      profile({ id: 'b', isDefault: true }),
      profile({ id: 'c', isDefault: true }),
    ]);
    expect(out.filter((p) => p.isDefault).map((p) => p.id)).toEqual(['a']);
  });

  it('skips disabled profiles when choosing the default', () => {
    const out = normalizeProfiles([
      profile({ id: 'a', enabled: false }),
      profile({ id: 'b' }),
    ]);
    expect(out[0]!.isDefault).toBe(false);
    expect(out[1]!.isDefault).toBe(true);
  });

  it('clears the default if the flagged profile is disabled', () => {
    const out = normalizeProfiles([
      profile({ id: 'a', enabled: false, isDefault: true }),
      profile({ id: 'b' }),
    ]);
    expect(out[0]!.isDefault).toBe(false);
    expect(out[1]!.isDefault).toBe(true);
  });

  it('handles an empty array', () => {
    expect(normalizeProfiles([])).toEqual([]);
  });

  it('handles all-disabled (no default at all)', () => {
    const out = normalizeProfiles([
      profile({ id: 'a', enabled: false }),
      profile({ id: 'b', enabled: false }),
    ]);
    expect(out.every((p) => !p.isDefault)).toBe(true);
  });
});

describe('getActiveProfile', () => {
  const profiles: SearchProfile[] = [
    profile({ id: 'a', isDefault: true }),
    profile({ id: 'b' }),
    profile({ id: 'c', enabled: false }),
  ];

  it('returns the default when no override is provided', () => {
    expect(getActiveProfile(profiles, undefined)?.id).toBe('a');
  });

  it('returns the override when valid', () => {
    expect(getActiveProfile(profiles, 'b')?.id).toBe('b');
  });

  it('falls back to default when override refers to a disabled profile', () => {
    expect(getActiveProfile(profiles, 'c')?.id).toBe('a');
  });

  it('falls back to default when override id is unknown', () => {
    expect(getActiveProfile(profiles, 'zzz')?.id).toBe('a');
  });

  it('returns null when there are no enabled profiles', () => {
    const allDisabled = profiles.map((p) => ({ ...p, enabled: false }));
    expect(getActiveProfile(allDisabled, undefined)).toBeNull();
  });
});

describe('getNextProfile', () => {
  const profiles: SearchProfile[] = [
    profile({ id: 'a', isDefault: true }),
    profile({ id: 'b' }),
    profile({ id: 'c' }),
    profile({ id: 'd', enabled: false }),
  ];

  it('moves forward through enabled profiles', () => {
    expect(getNextProfile(profiles, 'a', 1)?.id).toBe('b');
    expect(getNextProfile(profiles, 'b', 1)?.id).toBe('c');
  });

  it('wraps from the last enabled profile back to the first', () => {
    expect(getNextProfile(profiles, 'c', 1)?.id).toBe('a');
  });

  it('skips disabled profiles', () => {
    // d is disabled, so from c we wrap to a (not d).
    expect(getNextProfile(profiles, 'c', 1)?.id).toBe('a');
  });

  it('moves backward when direction is -1', () => {
    expect(getNextProfile(profiles, 'a', -1)?.id).toBe('c');
    expect(getNextProfile(profiles, 'b', -1)?.id).toBe('a');
  });

  it('falls back to the first enabled profile when current id is unknown', () => {
    expect(getNextProfile(profiles, 'zzz', 1)?.id).toBe('a');
    expect(getNextProfile(profiles, undefined, 1)?.id).toBe('a');
  });

  it('returns the only enabled profile when there is one', () => {
    const single = [profile({ id: 'a', isDefault: true })];
    expect(getNextProfile(single, 'a', 1)?.id).toBe('a');
  });

  it('returns null when no profile is enabled', () => {
    const allDisabled = profiles.map((p) => ({ ...p, enabled: false }));
    expect(getNextProfile(allDisabled, 'a', 1)).toBeNull();
  });
});

describe('defaultProfiles', () => {
  it('seeds Reddit as the default profile', () => {
    const profiles = defaultProfiles();
    expect(getDefaultProfile(profiles)?.id).toBe('reddit');
  });

  it('seeds at least three example profiles', () => {
    expect(defaultProfiles().length).toBeGreaterThanOrEqual(3);
  });
});
