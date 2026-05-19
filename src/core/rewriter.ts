import type { SearchProfile } from './types';
import { findEngine } from './engines';

export type RewriteReason =
  | 'rewritten'
  | 'invalid-url'
  | 'not-a-search-engine'
  | 'no-query'
  | 'profile-disabled'
  | 'empty-modifier'
  | 'already-filtered';

export interface RewriteResult {
  shouldRewrite: boolean;
  newUrl?: string;
  reason: RewriteReason;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractOperator(modifier: string): string | null {
  const match = modifier.trim().match(/^([a-z][\w-]*):/i);
  return match ? match[1]!.toLowerCase() : null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Returns true if the modifier should NOT be added — either it's already present
 * verbatim, or the user has used the same operator type (e.g. `site:`) in their query.
 */
export function shouldSkipRewrite(query: string, modifier: string): boolean {
  const nQuery = normalize(query);
  const nMod = normalize(modifier);
  if (nMod.length === 0) return true;
  if (nQuery.length === 0) return false;

  // Exact phrase already present anywhere in the query.
  if (nQuery.includes(nMod)) return true;

  // Same operator class already used by the user, e.g. modifier `site:reddit.com`
  // and query contains `site:stackoverflow.com`.
  const operator = extractOperator(nMod);
  if (operator) {
    const re = new RegExp(`\\b${escapeRegex(operator)}:`, 'i');
    if (re.test(query)) return true;
  }
  return false;
}

export function rewriteUrl(rawUrl: string, profile: SearchProfile): RewriteResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { shouldRewrite: false, reason: 'invalid-url' };
  }

  const engine = findEngine(url);
  if (!engine) return { shouldRewrite: false, reason: 'not-a-search-engine' };

  const query = url.searchParams.get(engine.queryParam);
  if (query === null) return { shouldRewrite: false, reason: 'no-query' };

  if (!profile.enabled) return { shouldRewrite: false, reason: 'profile-disabled' };
  if (profile.modifier.trim().length === 0) {
    return { shouldRewrite: false, reason: 'empty-modifier' };
  }
  if (shouldSkipRewrite(query, profile.modifier)) {
    return { shouldRewrite: false, reason: 'already-filtered' };
  }

  const newQuery = `${query.trim()} ${profile.modifier.trim()}`.trim();
  const next = new URL(url.toString());
  next.searchParams.set(engine.queryParam, newQuery);

  return { shouldRewrite: true, newUrl: next.toString(), reason: 'rewritten' };
}

/**
 * Removes a modifier from a search URL's query parameter, returning the URL
 * unchanged if it isn't a recognised search engine or the modifier isn't present.
 */
export function stripModifier(rawUrl: string, modifier: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const engine = findEngine(url);
  if (!engine) return rawUrl;

  const query = url.searchParams.get(engine.queryParam);
  if (query === null) return rawUrl;

  const trimmedMod = modifier.trim();
  if (trimmedMod.length === 0) return rawUrl;

  // Case-insensitive, whitespace-tolerant removal of the modifier substring.
  const pattern = new RegExp(`(?:^|\\s+)${escapeRegex(trimmedMod)}(?=\\s|$)`, 'gi');
  const stripped = query.replace(pattern, ' ').replace(/\s+/g, ' ').trim();

  if (stripped === query) return rawUrl;

  const next = new URL(url.toString());
  next.searchParams.set(engine.queryParam, stripped);
  return next.toString();
}
