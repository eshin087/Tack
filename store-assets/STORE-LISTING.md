# Tack — Chrome Web Store & Edge Add-ons listing copy

Paste these straight into the developer dashboards. Character limits are noted
on each section; everything below already fits within those limits.

---

## Name (45 char max)

```
Tack — Pin a site: filter to every search
```
(41 chars)

---

## Short description (132 char max — Chrome Web Store, Edge equivalent)

```
Pin a site:reddit.com (or any modifier) to every search. One keypress cycles between profiles on Google, Bing & DuckDuckGo.
```
(127 chars)

### Alternate short descriptions (A/B candidates)

- `Auto-append site:reddit.com (or any filter) to every Google, Bing, DuckDuckGo, Yahoo, Ecosia & Brave search.` (113 chars)
- `Tired of SEO spam? Tack pins a site: filter to every search and cycles between Reddit, GitHub & Stack Overflow.` (115 chars)
- `Stop typing site:reddit.com. Tack pins one (or many) modifiers to every search across 6 engines.` (100 chars)

---

## Detailed description (16,000 char max — markdown stripped, plain text)

```
Tired of trawling SEO-blog spam to find a real answer? Tack pins a `site:` filter — or any other search operator — to every query you run on search engines.

Define one profile (e.g. site:reddit.com), or several (Reddit, GitHub, Stack Overflow, your company docs), and toggle between them with a single keypress. Tack rewrites the URL before the results page loads, so you get filtered results immediately — no waiting, no manual typing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY USE TACK?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Skip the SEO sludge — every search defaults to high-signal sites you trust
  ✓ Multiple named profiles, synced across Chrome installs
  ✓ Cycle between profiles with a keyboard shortcut (no clicks required)
  ✓ Toggle the filter off per-tab when you DO want broad results
  ✓ Sticky on/off — if you turn it off, new tabs honor that
  ✓ Silent mode hides all UI; the filter just runs quietly
  ✓ 100% local — no servers, no tracking, no analytics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install Tack and open the options page.
2. Edit or add profiles. Each profile is a friendly name + a modifier:
     • Reddit          →  site:reddit.com
     • GitHub          →  site:github.com
     • Stack Overflow  →  site:stackoverflow.com
     • PDFs only       →  filetype:pdf
     • No Pinterest    →  -site:pinterest.com
     • Tutorials       →  inurl:tutorial
3. Pick one profile as Default.
4. Search anywhere — Tack appends the modifier and the results page is already filtered.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEYBOARD SHORTCUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tack has two shortcut systems for maximum flexibility:

CHROME-MANAGED (work everywhere in Chrome):
  • Toggle filter            — default Alt+Shift+F
  • Apply filter             — your choice
  • Show all results         — your choice
  • Cycle to next profile    — your choice
  • Cycle to previous profile — your choice
  • Show / hide the bar      — your choice (Silent mode)

IN-PAGE KEYBINDINGS (any combo, including bare Shift+letter):
  Chrome's command API doesn't allow bare Shift shortcuts. Tack adds a
  second listener on search pages so you can bind shortcuts like Shift+Q
  or even a single letter. Set them from the options page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tack runs entirely on your machine. There is no remote server, no
telemetry, no analytics. Your profiles sync between your own Chrome
installs via Chrome's built-in chrome.storage.sync, encrypted by Google
the same way your bookmarks are.

Tack only requests access to the search-engine domains it actually rewrites
queries on. It never sees pages outside those domains.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the source code or file issues at: https://github.com/eshin087/Tack
```

> ⚠️ **DO NOT put keyword lists in the description.** A previous draft
> appended a trailing `Keywords:` line; Chrome Web Store rejected the
> submission citing the **"Keyword Spam"** policy (violation reference
> "Yellow Argon"). Keywords go ONLY in the dashboard's dedicated
> search-keywords / properties field — never in the description body.
> Same rule applies to the WHY USE TACK list: keep it feature-focused,
> not keyword-focused.

---

## Category (Chrome Web Store)

**Primary:** Productivity
**Secondary suggestion:** Workflow & Planning (or Developer Tools)

## Category (Edge Add-ons)

**Primary:** Productivity

## Languages

English (US)

---

## Keywords / tags for marketplace discoverability

These go into the dashboard's tag/keyword fields when prompted. Both
Chrome and Edge let you pick a handful — start with the high-intent ones:

### Tier 1 (high intent, must include)
- site search
- reddit search
- search filter
- search modifier
- search operator
- search shortcut
- google site search
- filter google results

### Tier 2 (broader discoverability)
- productivity
- search tools
- developer tools
- block sponsored
- ad blocker (only if you can be specific — Tack only hides Google sponsored, so use cautiously)
- search productivity
- site:reddit.com
- site:github.com
- site:stackoverflow.com
- search profile

### Tier 3 (long-tail / niche)
- "reddit" search shortcut
- skip seo spam
- high signal search
- google search hack
- search redirect
- query rewrite
- bing search filter
- duckduckgo filter
- yahoo search modifier
- brave search filter
- ecosia search filter

---

## GitHub repo description (250 char max)

```
Pin a site: filter to every search. Tack auto-appends search modifiers (site:reddit.com, site:github.com, etc.) on Google, Bing, DuckDuckGo, Yahoo, Ecosia & Brave. Multi-profile, keyboard-driven, hides Google sponsored ads. MV3, TypeScript, 77 tests.
```
(250 chars)

## GitHub topics (max 20, lowercase, no spaces — use hyphens)

```
chrome-extension
edge-extension
manifest-v3
browser-extension
search
google-search
reddit
search-filter
site-search
productivity
typescript
chrome-storage
keyboard-shortcuts
search-engine
search-modifier
mv3
duckduckgo
bing
brave-search
open-source
```

---

## Screenshots (Chrome Web Store needs 1–5 at 1280×800 or 640×400)

You'll need to capture these manually after installing the latest build:

1. **Hero shot** — A Google search results page with the Tack pill in the
   corner and the modifier visible in the URL bar. Show "site:reddit.com"
   appended to a real query like "react server components best practices".
   Crop tight; annotate with a callout arrow: "Modifier auto-appended".

2. **Options page** — Show 3–4 profiles defined (Reddit, GitHub,
   Stack Overflow, "No Pinterest"). Include the Default toggle and the
   profile dropdown.

3. **Keyboard shortcuts panel** — The options page scrolled to the
   "Keyboard shortcuts" + "In-page keybindings" sections. Show one
   keybinding being captured (the orange "Press a key…" state).

4. **Pill + panel** — A search results page with the floating pill
   expanded into the popup, showing the profile dropdown and the toggle
   button.

5. **Ad hiding before/after** — A two-panel comparison: Google results
   with sponsored ads on the left, same query with Tack installed on the
   right (ads gone).

Tooling tip: take 1280×800 screenshots at 100% browser zoom. Annotate in
Figma, Excalidraw, or any browser-based mockup tool.

---

## Promo tiles

Generated by `scripts/generate-icons.ps1`:

| File                                  | Size       | Where it's used                          |
| ------------------------------------- | ---------- | ---------------------------------------- |
| `store-assets/promo-tile-440x280.png` | 440 × 280  | Chrome Web Store small tile (required if you want store promotion) |
| `store-assets/promo-tile-1400x560.png`| 1400 × 560 | Chrome Web Store marquee tile (optional, used for featured placement) |

For Edge, the 440×280 doubles as the "Small promotional tile". Edge also
asks for a 1400×560 marquee if you want featured placement.

---

## Submission checklist

### Chrome Web Store

- [ ] $5 one-time developer registration paid (covers Chrome + Edge dev accounts? No — Edge is free, Chrome is $5)
- [ ] `dist/` built and zipped (`zip -r tack-v0.1.0.zip dist/`)
- [ ] Listing name, short description, detailed description, category set
- [ ] At least 1 screenshot uploaded (5 strongly recommended)
- [ ] 128×128 icon visible in the listing
- [ ] 440×280 promo tile uploaded
- [ ] Privacy practices declared — Tack: **No data collected**, single purpose: rewrites search URLs
- [ ] Permissions justifications written (see below)
- [ ] Source code link to GitHub repo

### Microsoft Edge Add-ons

- [ ] Free Partner Center account created
- [ ] Same `dist/` zip
- [ ] All listing fields copy-pasted
- [ ] Screenshots + 440×280 tile uploaded
- [ ] Privacy URL (GitHub README works)

---

## Permissions justifications (you'll be asked these on submission)

**`storage`**
> Used to save user-defined search profiles (name + modifier pairs) via
> chrome.storage.sync so they sync across the user's Chrome installs, and
> per-tab on/off state via chrome.storage.session. No data leaves the
> browser.

**`webNavigation`**
> Used to detect when the user is loading a results page on a supported
> search engine, so the URL can be rewritten with the active modifier
> before the page loads. The listener is filtered to known search-engine
> hostnames only.

**`tabs`**
> Used to apply the modifier by updating the active tab's URL
> (chrome.tabs.update) and to detect the active tab for keyboard
> shortcuts. No tab content is read.

**Host permissions** (only the listed search engines)
> Each host is required because Tack rewrites the URL on that specific
> domain. The list is exhaustive: www.google.com, www.bing.com,
> duckduckgo.com, search.yahoo.com, www.ecosia.org, search.brave.com.
> No other domains are accessed.

**Single purpose statement (Chrome requires one)**
> Tack appends user-configured search modifiers (e.g. site:reddit.com)
> to queries on a fixed list of search engines, to help users get
> higher-signal results without retyping the same operators.

---

## Privacy practices (Chrome Web Store form)

| Question                                           | Answer                                       |
| -------------------------------------------------- | -------------------------------------------- |
| Does Tack collect or use personally identifiable information? | No |
| Does Tack collect or use health information?       | No |
| Does Tack collect or use financial information?    | No |
| Does Tack collect or use authentication information? | No |
| Does Tack collect or use personal communications?  | No |
| Does Tack collect or use location data?            | No |
| Does Tack collect or use web history?              | No, only the active tab's URL while it is on a supported search engine, in memory only, for the purpose of rewriting that URL. Nothing is logged or transmitted. |
| Does Tack collect or use user activity?            | No |
| Does Tack collect or use website content?          | No |

**Use of permissions disclosure:**
> Tack uses storage, webNavigation, and tabs permissions only to detect
> search results pages on a fixed list of search engines and to rewrite
> the URL in the current tab with the user's chosen modifier. No data is
> transmitted to any server.
