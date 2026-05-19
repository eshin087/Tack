import { describe, it, expect } from 'vitest';
import { rewriteUrl, shouldSkipRewrite, stripModifier } from '../src/core/rewriter';
import type { SearchProfile } from '../src/core/types';

const redditProfile: SearchProfile = {
  id: 'reddit',
  name: 'Reddit',
  modifier: 'site:reddit.com',
  enabled: true,
  isDefault: true,
};

function q(url: string): string {
  return new URL(url).searchParams.get('q') ?? '';
}

/** Yahoo uses ?p= instead of ?q= */
function p(url: string): string {
  return new URL(url).searchParams.get('p') ?? '';
}

describe('rewriteUrl — happy paths', () => {
  it('appends the modifier to a Google web search', () => {
    const r = rewriteUrl('https://www.google.com/search?q=rust+programming', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(r.reason).toBe('rewritten');
    expect(q(r.newUrl!)).toBe('rust programming site:reddit.com');
  });

  it('appends the modifier to a Bing search', () => {
    const r = rewriteUrl('https://www.bing.com/search?q=typescript', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(q(r.newUrl!)).toBe('typescript site:reddit.com');
  });

  it('appends the modifier to a DuckDuckGo search', () => {
    const r = rewriteUrl('https://duckduckgo.com/?q=javascript', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(q(r.newUrl!)).toBe('javascript site:reddit.com');
  });

  it('appends the modifier to a DuckDuckGo HTML-only search', () => {
    const r = rewriteUrl('https://duckduckgo.com/html/?q=foo', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(q(r.newUrl!)).toBe('foo site:reddit.com');
  });

  it('appends the modifier to a Yahoo search (reads and writes ?p=)', () => {
    const r = rewriteUrl('https://search.yahoo.com/search?p=typescript', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(r.reason).toBe('rewritten');
    // Yahoo stores the query in ?p=, not ?q=
    expect(p(r.newUrl!)).toBe('typescript site:reddit.com');
    expect(new URL(r.newUrl!).searchParams.get('q')).toBeNull();
  });

  it('appends the modifier to an Ecosia search', () => {
    const r = rewriteUrl('https://www.ecosia.org/search?q=python', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(q(r.newUrl!)).toBe('python site:reddit.com');
  });

  it('appends the modifier to a Brave Search result', () => {
    const r = rewriteUrl('https://search.brave.com/search?q=rust', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    expect(q(r.newUrl!)).toBe('rust site:reddit.com');
  });

  it('Yahoo loop-prevention: rewritten Yahoo URL is stable', () => {
    const first = rewriteUrl('https://search.yahoo.com/search?p=foo', redditProfile);
    expect(first.shouldRewrite).toBe(true);
    const second = rewriteUrl(first.newUrl!, redditProfile);
    expect(second.shouldRewrite).toBe(false);
    expect(second.reason).toBe('already-filtered');
  });

  it('preserves unrelated query parameters', () => {
    const r = rewriteUrl(
      'https://www.google.com/search?q=foo&hl=en&safe=active',
      redditProfile,
    );
    expect(r.shouldRewrite).toBe(true);
    const url = new URL(r.newUrl!);
    expect(url.searchParams.get('hl')).toBe('en');
    expect(url.searchParams.get('safe')).toBe('active');
  });

  it('still rewrites Google image / news variants (same /search endpoint)', () => {
    const r = rewriteUrl('https://www.google.com/search?q=cats&tbm=isch', redditProfile);
    expect(r.shouldRewrite).toBe(true);
    const url = new URL(r.newUrl!);
    expect(url.searchParams.get('tbm')).toBe('isch');
    expect(url.searchParams.get('q')).toBe('cats site:reddit.com');
  });

  it('handles non-ASCII queries without breaking encoding', () => {
    const r = rewriteUrl(
      'https://www.google.com/search?q=%E6%97%A5%E6%9C%AC%E8%AA%9E',
      redditProfile,
    );
    expect(r.shouldRewrite).toBe(true);
    expect(q(r.newUrl!)).toBe('日本語 site:reddit.com');
  });
});

describe('rewriteUrl — refusals (loop-prevention)', () => {
  it('skips when the exact modifier is already in the query', () => {
    const r = rewriteUrl(
      'https://www.google.com/search?q=rust+site%3Areddit.com',
      redditProfile,
    );
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('already-filtered');
  });

  it('skips when user has typed a different site: operator (no double-filter)', () => {
    const r = rewriteUrl(
      'https://www.google.com/search?q=rust+site%3Astackoverflow.com',
      redditProfile,
    );
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('already-filtered');
  });

  it('skips when modifier is empty', () => {
    const empty = { ...redditProfile, modifier: '' };
    const r = rewriteUrl('https://www.google.com/search?q=foo', empty);
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('empty-modifier');
  });

  it('skips when profile is disabled', () => {
    const disabled = { ...redditProfile, enabled: false };
    const r = rewriteUrl('https://www.google.com/search?q=foo', disabled);
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('profile-disabled');
  });
});

describe('rewriteUrl — non-search-engine URLs', () => {
  it('skips arbitrary websites', () => {
    const r = rewriteUrl('https://example.com/search?q=foo', redditProfile);
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('not-a-search-engine');
  });

  it('skips Google subdomains like Maps', () => {
    const r = rewriteUrl('https://maps.google.com/maps?q=foo', redditProfile);
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('not-a-search-engine');
  });

  it('skips Google Mail', () => {
    const r = rewriteUrl('https://mail.google.com/mail/u/0/', redditProfile);
    expect(r.shouldRewrite).toBe(false);
  });

  it('skips Google homepage (no q param)', () => {
    const r = rewriteUrl('https://www.google.com/', redditProfile);
    expect(r.shouldRewrite).toBe(false);
  });

  it('skips DuckDuckGo homepage (no q param)', () => {
    const r = rewriteUrl('https://duckduckgo.com/', redditProfile);
    expect(r.shouldRewrite).toBe(false);
  });

  it('skips invalid URLs', () => {
    const r = rewriteUrl('not-a-url', redditProfile);
    expect(r.shouldRewrite).toBe(false);
    expect(r.reason).toBe('invalid-url');
  });
});

describe('rewriteUrl — no infinite loop after rewriting', () => {
  it('a rewritten URL is stable: feeding it back produces no further rewrite', () => {
    const first = rewriteUrl('https://www.google.com/search?q=rust', redditProfile);
    expect(first.shouldRewrite).toBe(true);
    const second = rewriteUrl(first.newUrl!, redditProfile);
    expect(second.shouldRewrite).toBe(false);
    expect(second.reason).toBe('already-filtered');
  });

  it('rewriting twice in a row never compounds the modifier', () => {
    let r = rewriteUrl('https://www.google.com/search?q=foo', redditProfile);
    for (let i = 0; i < 5; i++) r = rewriteUrl(r.newUrl ?? '', redditProfile);
    expect(r.shouldRewrite).toBe(false);
  });
});

describe('shouldSkipRewrite', () => {
  it('detects exact modifier substring', () => {
    expect(shouldSkipRewrite('foo site:reddit.com', 'site:reddit.com')).toBe(true);
  });

  it('detects different site: target as a same-operator clash', () => {
    expect(shouldSkipRewrite('foo site:github.com', 'site:reddit.com')).toBe(true);
  });

  it('detects different inurl: target as a same-operator clash', () => {
    expect(shouldSkipRewrite('foo inurl:tutorial', 'inurl:docs')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(shouldSkipRewrite('foo SITE:reddit.com', 'site:reddit.com')).toBe(true);
  });

  it('treats a bare keyword modifier as a substring check, not an operator', () => {
    expect(shouldSkipRewrite('foo bar', 'tutorial')).toBe(false);
    expect(shouldSkipRewrite('foo tutorial bar', 'tutorial')).toBe(true);
  });

  it('returns true on an empty modifier (nothing to add)', () => {
    expect(shouldSkipRewrite('foo', '')).toBe(true);
  });

  it('does not falsely flag word containing operator name', () => {
    // "websites" contains "site" but is not "site:" — should not skip.
    expect(shouldSkipRewrite('foo websites bar', 'site:reddit.com')).toBe(false);
  });
});

describe('stripModifier', () => {
  it('removes the modifier from the end of a Google query', () => {
    const out = stripModifier(
      'https://www.google.com/search?q=rust+site%3Areddit.com',
      'site:reddit.com',
    );
    expect(q(out)).toBe('rust');
  });

  it('removes the modifier from the start of a query', () => {
    const out = stripModifier(
      'https://www.google.com/search?q=site%3Areddit.com+rust',
      'site:reddit.com',
    );
    expect(q(out)).toBe('rust');
  });

  it('removes the modifier from the middle of a query', () => {
    const out = stripModifier(
      'https://www.google.com/search?q=rust+site%3Areddit.com+programming',
      'site:reddit.com',
    );
    expect(q(out)).toBe('rust programming');
  });

  it('returns URL unchanged if the modifier is not present', () => {
    const input = 'https://www.google.com/search?q=rust';
    expect(stripModifier(input, 'site:reddit.com')).toBe(input);
  });

  it('returns URL unchanged for non-search URLs', () => {
    const input = 'https://example.com/?q=site%3Areddit.com';
    expect(stripModifier(input, 'site:reddit.com')).toBe(input);
  });

  it('is case-insensitive when stripping', () => {
    const out = stripModifier(
      'https://www.google.com/search?q=rust+SITE%3AREDDIT.COM',
      'site:reddit.com',
    );
    expect(q(out)).toBe('rust');
  });

  it('does not partial-match across word boundaries', () => {
    // "site:reddit.community" should NOT be stripped when modifier is "site:reddit.com"
    const input = 'https://www.google.com/search?q=rust+site%3Areddit.community';
    const out = stripModifier(input, 'site:reddit.com');
    expect(q(out)).toBe('rust site:reddit.community');
  });
});
