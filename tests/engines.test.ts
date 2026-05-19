import { describe, it, expect } from 'vitest';
import { findEngine, ENGINES } from '../src/core/engines';

describe('findEngine — original engines', () => {
  it('detects a Google search', () => {
    expect(findEngine(new URL('https://www.google.com/search?q=foo'))?.id).toBe('google');
  });

  it('detects a Bing search', () => {
    expect(findEngine(new URL('https://www.bing.com/search?q=foo'))?.id).toBe('bing');
  });

  it('detects a DuckDuckGo SPA search', () => {
    expect(findEngine(new URL('https://duckduckgo.com/?q=foo'))?.id).toBe('duckduckgo');
  });

  it('detects a DuckDuckGo HTML search', () => {
    expect(findEngine(new URL('https://duckduckgo.com/html/?q=foo'))?.id).toBe('duckduckgo');
  });
});

describe('findEngine — new engines', () => {
  it('detects a Yahoo search (uses ?p= not ?q=)', () => {
    expect(findEngine(new URL('https://search.yahoo.com/search?p=foo'))?.id).toBe('yahoo');
  });

  it('returns null for Yahoo without the p param', () => {
    expect(findEngine(new URL('https://search.yahoo.com/search'))).toBeNull();
  });

  it('returns null for Yahoo homepage', () => {
    expect(findEngine(new URL('https://www.yahoo.com/'))).toBeNull();
  });

  it('detects an Ecosia search', () => {
    expect(findEngine(new URL('https://www.ecosia.org/search?q=foo'))?.id).toBe('ecosia');
  });

  it('returns null for Ecosia homepage', () => {
    expect(findEngine(new URL('https://www.ecosia.org/'))).toBeNull();
  });

  it('detects a Brave Search result', () => {
    expect(findEngine(new URL('https://search.brave.com/search?q=foo'))?.id).toBe('brave');
  });

  it('returns null for Brave homepage', () => {
    expect(findEngine(new URL('https://search.brave.com/'))).toBeNull();
  });
});

describe('findEngine — non-search-engine URLs', () => {
  it('returns null for Google homepage (no q)', () => {
    expect(findEngine(new URL('https://www.google.com/'))).toBeNull();
  });

  it('returns null for DuckDuckGo homepage (no q)', () => {
    expect(findEngine(new URL('https://duckduckgo.com/'))).toBeNull();
  });

  it('returns null for Google Maps subdomain', () => {
    expect(findEngine(new URL('https://maps.google.com/maps?q=foo'))).toBeNull();
  });

  it('returns null for Google Mail', () => {
    expect(findEngine(new URL('https://mail.google.com/mail/u/0/'))).toBeNull();
  });

  it('returns null for unrelated sites', () => {
    expect(findEngine(new URL('https://example.com/search?q=foo'))).toBeNull();
  });

  it('returns null for Google Scholar (different host)', () => {
    expect(findEngine(new URL('https://scholar.google.com/scholar?q=foo'))).toBeNull();
  });
});

describe('ENGINES registry', () => {
  it('lists all six engines', () => {
    expect(ENGINES.map((e) => e.id).sort()).toEqual([
      'bing', 'brave', 'duckduckgo', 'ecosia', 'google', 'yahoo',
    ]);
  });

  it('all engines except Yahoo use "q" as the query parameter', () => {
    for (const e of ENGINES) {
      if (e.id === 'yahoo') {
        expect(e.queryParam).toBe('p');
      } else {
        expect(e.queryParam).toBe('q');
      }
    }
  });
});
