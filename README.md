<div align="center">

![Tack](icons/icon-128.png)

# Tack

**Pin a `site:` filter to every search.**

Tack auto-appends configurable search modifiers — like `site:reddit.com` —
to your queries on Google, Bing, DuckDuckGo, Yahoo, Ecosia, and Brave Search.

</div>

<p align="center">
  <a href="#install-unpacked">Install</a> ·
  <a href="#features">Features</a> ·
  <a href="#keyboard-shortcuts">Shortcuts</a> ·
  <a href="#architecture">Architecture</a>
</p>

---

## Why?

Tired of trawling generic SEO blog spam when you just want a Reddit answer or
a GitHub repo? **Tack** keeps a `site:` filter pinned to every search. Define
profiles once (Reddit, GitHub, Stack Overflow, your docs site — whatever),
toggle the active one with a keypress, and never type `site:reddit.com` again.

## Features

- 🎯 **Multiple profiles** — Reddit, GitHub, Stack Overflow seeded by default. Add your own.
- ⌨️ **Keyboard-first** — toggle filter on/off, cycle between profiles, show/hide the UI, all by shortcut.
- 🔁 **Bare-modifier-key shortcuts** — `Shift+Q` and other combos Chrome's command API forbids? In-page keybindings make them work.
- 🤫 **Silent mode** — hide the UI entirely; let the filter run invisibly.
- 🔇 **Google ad hider** — sponsored results blocked via CSS injection on Google.
- 🌐 **6 search engines** — Google, Bing, DuckDuckGo, Yahoo (yes, `?p=` works), Ecosia, Brave.
- 🔁 **Sticky on/off** — turn the filter off on one tab and new tabs inherit that state.
- ☁️ **Profiles sync** across your Chrome installs via `chrome.storage.sync`.
- 🛡️ **Loop-proof** URL rewriting — won't double-append a modifier, won't fight your manual `site:`.

## Install (unpacked)

```bash
npm install
npm run build
```

Then in Chrome (or Edge):

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

Run a search on Google, Bing, or DuckDuckGo. The query is rewritten with the
active profile's modifier and a small bar appears at the top of the results
page showing which profile is active. After 3 seconds it collapses into a
floating pill in the corner; click the pill to toggle the filter or switch
profiles.

Open the options page from the Tack toolbar icon (or via
`chrome://extensions` → Tack → Details → Extension options) to add, rename,
enable, or remove profiles and to configure shortcuts.

## Keyboard shortcuts

Tack ships **two** shortcut systems for maximum flexibility:

### Chrome-managed (cross-browser, with limits)

| Command              | Default key   | Action                                       |
| -------------------- | ------------- | -------------------------------------------- |
| `toggle-filter`      | `Alt+Shift+F` | Toggle filter on / off for the current tab   |
| `enable-filter`      | (unset)       | Always enables the filter                    |
| `disable-filter`     | (unset)       | Always disables the filter (show all)        |
| `show-ui`            | (unset)       | Show / hide the bar (useful with Silent mode)|
| `cycle-profile`      | (unset)       | Switch to the next enabled profile           |
| `cycle-profile-back` | (unset)       | Switch to the previous enabled profile       |

Assign keys at `chrome://extensions/shortcuts`. Chrome requires at least one of
`Ctrl` / `Alt` / `Cmd` as a modifier.

### In-page keybindings (any combo, including `Shift+Q`)

Set these from the Tack options page → **In-page keybindings**. They're listened
for at the DOM level on search results pages, so bare-Shift combos are allowed.
Ignored while you're typing in the search box.

## Commands

| Command              | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run build`      | Production build to `dist/`                     |
| `npm run watch`      | Rebuild on file changes (esbuild watch mode)    |
| `npm run typecheck`  | TypeScript strict-mode check, no emit           |
| `npm test`           | Run Vitest test suite once                      |
| `npm run test:watch` | Run Vitest in watch mode                        |

## Architecture

```
src/
  core/                  Pure logic — no browser APIs, fully unit-testable.
    types.ts             Shared types: SearchProfile, TabState, RuntimeMessage.
    engines.ts           Search-engine descriptors and detection.
    rewriter.ts          URL rewriting + modifier-stripping rules.
    profiles.ts          Profile CRUD, normalization, default selection, cycle helper.
    keybindings.ts       In-page keybinding storage + match/format helpers.
    preferences.ts       Global preferences (Silent mode, sticky filter state).
    storage.ts           Abstract StorageAdapter interface.
    tab-state.ts         TabStateStore interface + default state.

  platform/
    chrome/              MV3 entry points and Chrome-specific adapters.
      background.ts      Service worker: webNavigation, commands, messaging.
      content.ts         Content script: mounts the results-page UI, keybindings.
      storage-adapter.ts chrome.storage.sync implementation of StorageAdapter.
      tab-state-adapter.ts chrome.storage.session implementation.
      options/
        options.html
        options.ts       Settings UI for profile + shortcut management.

  ui/
    results-bar.ts       DOM-only UI for the injected bar + floating pill.
    ad-hider.ts          CSS injection that hides Google sponsored ads.

tests/                   77 Vitest unit tests
  rewriter.test.ts       URL rewriting + loop-prevention.
  engines.test.ts        Engine detection.
  profiles.test.ts       Normalization, active-profile selection, cycling.
```

### How URL rewriting works

1. User submits a search; the URL becomes e.g.
   `https://www.google.com/search?q=rust+programming`.
2. The background service worker's `chrome.webNavigation.onBeforeNavigate`
   listener fires with the destination URL.
3. `findEngine(url)` identifies the search engine; if it's not one of ours,
   the request is left alone.
4. The tab's `TabState` is loaded from `chrome.storage.session`. If the user
   has toggled the filter off for this tab (or the global "last filter state"
   is off), no rewrite happens.
5. `rewriteUrl()` checks:
   - is the modifier already present verbatim? (loop prevention)
   - has the user used the same operator class — e.g. their own `site:`?
     (don't double-filter)
   - is the active profile enabled and non-empty?
6. If a rewrite is warranted, `chrome.tabs.update(tabId, { url: rewritten })`
   redirects the tab before the original results page loads.
7. The results page loads with the modifier in the query. The content script
   detects the search engine, asks the background for the current state, and
   mounts the bar (unless Silent mode is enabled).

For Google's in-page SPA navigation (typing in the results page's search box
and hitting Enter, which does a `history.pushState` rather than a real
navigation), `chrome.webNavigation.onHistoryStateUpdated` fires the same
rewrite path.

### Loop prevention

Rewriting is idempotent: once the modifier is in the query string,
`shouldSkipRewrite()` short-circuits subsequent passes. This is covered by
the test `a rewritten URL is stable: feeding it back produces no further
rewrite` and a five-iteration smoke test.

### Per-tab state vs. global preferences

- **Per-tab** (`chrome.storage.session`): the currently active profile override
  and the per-tab `filterDisabled` flag. Survives service worker eviction.
  Cleared on `chrome.tabs.onRemoved`.
- **Global** (`chrome.storage.sync`): profiles, keybindings, Silent mode, and
  `lastFilterDisabled` — the sticky on/off state that new tabs inherit.

## Adding a new search engine

1. Add an entry to `src/core/engines.ts` with hostname, query parameter, and
   results-page predicate.
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

1. Create `src/platform/firefox/` (or `safari/`) mirroring `src/platform/chrome/`.
2. Implement `StorageAdapter` and `TabStateStore` against the target's
   `browser.storage` API. The `webextension-polyfill` is the usual Firefox shortcut.
3. Add a target to `build.mjs` that bundles per-browser `dist-<browser>/` folders.
4. Adapt `manifest.json` — Firefox MV3 accepts a few extra fields
   (`browser_specific_settings`); Safari needs a wrapper Xcode project.

## Out of scope (v1)

- Firefox build (planned for v2)
- Safari desktop / iOS build
- Mobile Chrome — Android Chrome doesn't support extensions
- Per-domain rules (one default profile at a time; switch per-tab via UI)
- Conflict resolution beyond Chrome's built-in `storage.sync` semantics
