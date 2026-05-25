# Tack — Privacy Policy

**Last updated:** May 22, 2026

## Short version

Tack does not collect, transmit, sell, or share any of your data. The
extension runs entirely on your own machine. There is no server,
analytics, telemetry, tracking, or external network call of any kind.

## What Tack stores

Tack uses the browser's built-in storage APIs to remember a few small
pieces of information needed to do its job. Nothing in this list ever
leaves your browser:

| What | Where | Why |
|------|-------|-----|
| Your search profiles (name + modifier, e.g. `Reddit / site:reddit.com`) | `chrome.storage.sync` | So you can have multiple presets and switch between them. |
| Your keyboard shortcut preferences | `chrome.storage.sync` | So your custom in-page key combos persist. |
| Your "Silent mode" and "last filter state" preferences | `chrome.storage.sync` | So new tabs honor your last on/off choice. |
| Per-tab filter state (on/off, active profile override) | `chrome.storage.session` | So toggling the filter on one tab doesn't affect other tabs. Cleared when the tab is closed. |

`chrome.storage.sync` is the browser's own profile-sync mechanism. If
you are signed in to Chrome (or Edge, etc.), these settings sync
between your installs of that browser, encrypted by the browser vendor
the same way your bookmarks and history sync — Tack itself never
touches that pipeline.

## What Tack reads

To know whether to apply a filter, Tack reads the URL of the **current
tab** when that URL is on one of these search engines, and only at
the moment of navigation:

- `www.google.com`
- `www.bing.com`
- `duckduckgo.com`
- `search.yahoo.com`
- `www.ecosia.org`
- `search.brave.com`

The URL is examined in memory, compared against your active profile,
optionally rewritten, and then discarded. **Tack never reads, stores,
or transmits the page content, the search results, your browsing
history, or URLs from any other site.**

## What Tack does **not** do

- ❌ Does not collect personal information of any kind.
- ❌ Does not collect health, financial, or authentication data.
- ❌ Does not collect or transmit browsing history.
- ❌ Does not track user activity, clicks, scrolls, or timing.
- ❌ Does not contact any remote server. There are no API calls, no
  analytics SDKs, no error reporting services, no advertising.
- ❌ Does not sell or share any data with anyone, because it has no
  data to share.

## Permissions used

Tack requests three Chrome permissions and a fixed list of host
permissions. Each is used only for its declared purpose:

- **`storage`** — to save the settings listed in the table above to
  the browser's storage. No network access.
- **`webNavigation`** — to detect when you navigate to one of the six
  supported search engines, so Tack can rewrite the URL before the
  results page loads.
- **`tabs`** — to update the active tab's URL (`chrome.tabs.update`)
  when applying a filter, and to detect the active tab for keyboard
  shortcuts. The extension does **not** read tab content.
- **Host permissions** for the six search-engine domains listed
  above. Tack has no permission to read or write any other site.

## Third-party services

Tack uses none. The only "external" interaction is `chrome.storage.sync`
syncing your settings between your own browser installs via the
browser vendor's infrastructure — which is the same mechanism used by
bookmarks and is governed by your browser's privacy policy, not by
Tack.

## Source code

You can audit every line of Tack's source code yourself at:

**https://github.com/eshin087/Tack**

If you find any behavior that contradicts this policy, please open an
issue on the GitHub repository.

## Changes to this policy

If this policy ever changes — for example, if Tack is updated to add
a feature that involves data collection — the updated policy will be
committed to this same file in the GitHub repository, with the
"Last updated" date at the top revised. Material changes will also be
called out in the extension's release notes.

## Contact

For privacy questions, file an issue at
[github.com/eshin087/Tack/issues](https://github.com/eshin087/Tack/issues).
