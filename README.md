# SearchPin

A Chrome extension (Manifest V3) that auto-appends a configurable query modifier
— most commonly `site:reddit.com` — to your searches on Google, Bing, and
DuckDuckGo. Toggle the filter off per-tab when you want unfiltered results.

## Install (unpacked)

```bash
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder

Run a search on Google, Bing, or DuckDuckGo. The query is rewritten with the
active profile's modifier and a small bar appears at the top of the results
page showing which profile is active and offering a one-click "Show all
results" toggle plus a profile switcher.

Open the options page from the SearchPin toolbar icon (or via
`chrome://extensions` → SearchPin → Details → Extension options) to add,
rename, enable, or remove profiles.

## Commands

| Command              | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run build`      | Production build to `dist/`                     |
| `npm run watch`      | Rebuild on file changes (esbuild watch mode)    |
| `npm run typecheck`  | TypeScript strict-mode check, no emit           |
| `npm test`           | Run Vitest test suite once                      |
| `npm run test:watch` | Run Vitest in watch mode                        |

## Keyboard shortcut

`Alt+Shift+F` toggles the filter for the current tab. Customise this at
`chrome://extensions/shortcuts`.

## Architecture

```
src/
  core/                  Pure logic — no browser APIs, fully unit-testable.
    types.ts             Shared types: SearchProfile, TabState, RuntimeMessage.
    engines.ts           Search-engine descriptors and detection.
    rewriter.ts          URL rewriting + modifier-stripping rules.
    profiles.ts          Profile CRUD, normalization, default selection.
    storage.ts           Abstract StorageAdapter interface.
    tab-state.ts         TabStateStore interface + default state.

  platform/
    chrome/              MV3 entry points and Chrome-specific adapters.
      background.ts      Service worker: webNavigation, commands, messaging.
      content.ts         Content script: mounts the results-page UI.
      storage-adapter.ts chrome.storage.sync implementation of StorageAdapter.
      tab-state-adapter.ts chrome.storage.session implementation.
      options/
        options.html
        options.ts       Settings UI for profile management.

  ui/
    results-bar.ts       DOM-only UI for the injected results-page bar.

tests/
  rewriter.test.ts       URL rewriting + loop-prevention tests.
  engines.test.ts        Engine detection tests.
  profiles.test.ts       Profile normalization + active-profile selection tests.
```

### How URL rewriting works

1. User submits a search; the URL becomes e.g.
   `https://www.google.com/search?q=rust+programming`.
2. The background service worker's `chrome.webNavigation.onBeforeNavigate`
   listener fires with the destination URL.
3. `findEngine(url)` identifies the search engine; if it's not one of ours,
   the request is left alone.
4. The tab's `TabState` is loaded from `chrome.storage.session`. If the user
   has toggled the filter off for this tab, no rewrite happens.
5. `rewriteUrl()` checks:
   - is the modifier already present verbatim? (loop prevention)
   - has the user used the same operator class — e.g. their own `site:`?
     (don't double-filter)
   - is the active profile enabled and non-empty?
6. If a rewrite is warranted, `chrome.tabs.update(tabId, { url: rewritten })`
   redirects the tab before the original results page loads.
7. The results page loads with the modifier in the query. The content script
   detects the search engine, asks the background for the current state, and
   mounts the bar.

For Google's in-page SPA navigation (typing in the results page's search box
and hitting Enter, which does a `history.pushState` rather than a real
navigation), `chrome.webNavigation.onHistoryStateUpdated` fires the same
rewrite path, and `chrome.tabs.update()` forces the page to reload with the
modifier applied.

### Loop prevention

Rewriting is idempotent: once the modifier is in the query string,
`shouldSkipRewrite()` short-circuits subsequent passes. This is covered by
the test `a rewritten URL is stable: feeding it back produces no further
rewrite` and a five-iteration smoke test.

### Per-tab state

`TabState` is `{ filterDisabled: boolean; activeProfileId?: string }`. It
lives in `chrome.storage.session` keyed by tab id, which survives service
worker eviction. It's cleared on `chrome.tabs.onRemoved`.

## Adding a new search engine

1. Add an entry to `src/core/engines.ts`. You need a hostname, the query
   parameter name (usually `q`), and a predicate that recognises a results
   page (so the homepage isn't matched).
2. Add a matching content-script entry in `manifest.json` under
   `content_scripts[0].matches`.
3. Add the host to `host_permissions` in `manifest.json`.
4. Add test cases to `tests/engines.test.ts` and `tests/rewriter.test.ts`.

Example for adding Kagi:

```ts
// src/core/engines.ts
{
  id: 'kagi',
  name: 'Kagi',
  hostnames: ['kagi.com'],
  queryParam: 'q',
  isResultsPage: (url) =>
    url.pathname === '/search' && url.searchParams.has('q'),
}
```

```jsonc
// manifest.json
"matches": [..., "*://kagi.com/search*"],
"host_permissions": [..., "*://kagi.com/*"]
```

## Porting to Firefox / Safari (planned, out of scope for v1)

The `src/core/` directory has no browser-API dependencies. To port:

1. Create `src/platform/firefox/` (or `src/platform/safari/`) mirroring the
   structure under `src/platform/chrome/`.
2. Implement `StorageAdapter` and `TabStateStore` against `browser.storage`
   (or whatever the target browser provides). The `webextension-polyfill` is
   the usual shortcut for Firefox.
3. Add a target to `build.mjs` that bundles the new entry points into a
   per-browser `dist-<browser>/` folder.
4. Adapt `manifest.json` — Firefox accepts MV3 with minor differences (e.g.
   `browser_specific_settings`). Safari needs a wrapper Xcode project.

## Out of scope (v1)

- Firefox build
- Safari desktop / iOS build
- Mobile Chrome — Android Chrome does not support extensions
- Per-domain rules (only one default profile is applied at a time; you can
  switch per-tab via the bar's dropdown)
- Conflict resolution beyond Chrome's built-in `storage.sync` semantics

## License

MIT
