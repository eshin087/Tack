# Publishing Tack to the Chrome Web Store and Microsoft Edge Add-ons

Complete walkthrough for getting Tack published. Plan ~2 hours total
(mostly waiting on Chrome's $5 payment + capturing screenshots). Both
stores accept the same zip and the same listing copy.

> **Reference for all copy:** `store-assets/STORE-LISTING.md` already has
> the name, short description, long description, SEO keyword tiers,
> permission justifications, privacy declarations, and submission
> checklist. Open it side-by-side with the dashboards and paste fields
> across as you go.

---

## Part 0 — Pre-flight (do this once before each submission)

### 1. Bump the version (skip on first submission)

For every store update after v0.1.0, edit `manifest.json` and
`package.json` so the `version` field goes up (e.g. `0.1.0` → `0.1.1`).
The stores reject re-uploads with the same version number.

### 2. Build a clean release zip

From the repo root in PowerShell:

```powershell
npm run release
```

This runs typecheck → tests → build → zip in one shot. Output:

```
release/tack-v0.1.0.zip   (~71 KB)
```

Sanity-check what's inside before uploading. The zip should contain:

```
background.js
content.js
options.html
options.js
manifest.json
icons/icon-16.png
icons/icon-32.png
icons/icon-48.png
icons/icon-128.png
```

Nothing else. No `source.png`, no `node_modules`, no `.map` files.

### 3. Capture 1–5 screenshots (1280×800)

Both stores want screenshots showing the extension in action.
**Chrome requires at least 1; up to 5.** Take these in this order
(they map to the brief in `store-assets/STORE-LISTING.md`):

| # | What to capture |
|---|-----------------|
| 1 | A real Google search results page with the modifier in the URL and the floating Tack pill in the corner. (e.g. search "react server components best practices") |
| 2 | The options page with 3–4 profiles defined (Reddit, GitHub, Stack Overflow, plus one custom). |
| 3 | The "Keyboard shortcuts" + "In-page keybindings" sections, ideally with one keybinding capture in the orange "Press a key…" state. |
| 4 | The floating pill expanded into the popup, profile dropdown visible. |
| 5 | Before/after of Google ads being hidden — two-panel composite, optional. |

**How to take them:**

1. Set Chrome zoom to 100% (Ctrl + 0).
2. Resize the Chrome window to exactly 1280×800. Easiest way:
   open DevTools → Toggle device toolbar (Ctrl+Shift+M) → set
   "Responsive" preset to 1280×800.
3. Use Windows **Snipping Tool** (Win+Shift+S) or any screenshot tool to
   capture the visible viewport.
4. Save as PNG to a folder like `release/screenshots/`.

If a shot is slightly off the required 1280×800, both stores accept
640×400 as an alternative size.

### 4. Generate the 440×280 promo tile

Already done — `store-assets/promo-tile-440x280.png` is in the repo. The
Chrome Web Store **requires** this if you want store promotion (and it's
strongly recommended even without).

---

## Part 1 — Chrome Web Store

### 1.1 Create a developer account ($5 one-time)

1. Go to **https://chrome.google.com/webstore/devconsole**
2. Sign in with the Google account you want to publish under (Tack will
   show this account as the publisher).
3. Pay the **$5 one-time registration fee** with a credit card. This is
   per Google account, lifetime, regardless of how many extensions you
   publish.
4. Verify your email if prompted.

### 1.2 Create the item

1. In the Developer Dashboard, click **+ New item**.
2. Drag-and-drop `release/tack-v0.1.0.zip` into the upload box.
3. Wait ~10 seconds for the upload to process — Chrome will pre-validate
   the manifest. If it complains, the error message will point at the
   bad field. Fix locally, re-run `npm run release`, re-upload.

### 1.3 Fill out the listing

You'll land on a multi-tab form. Fill these in order:

#### Tab: **Store listing**

| Field | Value (copy from `store-assets/STORE-LISTING.md`) |
|---|---|
| Description (short) | The 127-char short description |
| Description (detailed) | The full long description, paste as plain text |
| Category | **Productivity** |
| Language | English (United States) |

Then upload assets:

| Asset | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Small promo tile (440×280) | `store-assets/promo-tile-440x280.png` |
| Marquee promo tile (1400×560) | `store-assets/promo-tile-1400x560.png` *(optional, helps with featured placement)* |
| Screenshots | Your 1–5 PNGs from step 0.3 |

#### Tab: **Privacy practices**

Fill the form exactly as documented in `STORE-LISTING.md` →
"Privacy practices" section. All answers are **No, except** the
"web history" question (which has a nuanced note — copy that one
verbatim).

For the **Single purpose** field:

> Tack appends user-configured search modifiers (e.g. site:reddit.com)
> to queries on a fixed list of search engines, to help users get
> higher-signal results without retyping the same operators.

For each requested permission, paste the matching justification from
`STORE-LISTING.md` → "Permissions justifications":

- `storage` justification
- `webNavigation` justification
- `tabs` justification
- Host permission justification

#### Tab: **Distribution**

- **Visibility:** Public (so anyone can install) *or* Unlisted (only
  people with the direct URL — good for soft launch / friends-only)
- **Where to ship:** All regions, unless you want to restrict
- **Pricing:** Free

### 1.4 Submit for review

1. Click **Save draft** to make sure nothing is dropped.
2. Click **Submit for review** at the top-right.
3. Confirm.

**Review timeline:**
- First submission from a new developer: typically **3 days to 3 weeks**
  (Google sometimes adds extra scrutiny for first-time publishers).
- Subsequent updates: usually **<1 day**.
- You'll get an email when it's approved (or rejected with a reason).

Tack's permissions are modest and the source is straightforward, so a
clean approval on the first pass is realistic if the listing copy and
justifications are filled in honestly.

---

## Part 2 — Microsoft Edge Add-ons

Edge accepts the same zip and the same listing copy. It's also free
(no registration fee).

### 2.1 Create a Microsoft Partner Center account

1. Go to **https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview**
2. Sign in with the Microsoft account you want to publish under.
3. Accept the Microsoft Edge Add-ons developer agreement.
4. No payment required.

### 2.2 Create the extension

1. From the Partner Center dashboard, click **New extension**.
2. Click **Choose file** and pick `release/tack-v0.1.0.zip`.
3. Wait for the manifest validation.

### 2.3 Fill out the listing

The form mirrors Chrome's. Same copy applies:

| Field | Source |
|---|---|
| Display name | `Tack — Pin a site: filter to every search` |
| Short description | The 127-char short description |
| Detailed description | The full long description |
| Category | **Productivity** |
| Properties (search keywords) | Tier 1 + Tier 2 keywords from `STORE-LISTING.md`, comma-separated. Edge lets you enter up to 7 — pick the most relevant from Tier 1. |

Asset uploads (Edge calls them differently):

| Asset | Edge dashboard name | File |
|---|---|---|
| Logo | Store logo (300×300) | Resize `icon-128.png` to 300×300 *or* re-render via `scripts/zip-release.mjs` after editing the generator to add 300×300 (see note below) |
| Tile | Small promotional tile (440×280) | `store-assets/promo-tile-440x280.png` |
| Screenshots | Screenshots | Same PNGs from Chrome step |

> **300×300 logo:** Edge wants a square 300×300 PNG that's distinct from
> the in-browser icon. Re-run the icon generator with an added line:
>
> ```powershell
> # in the inline PowerShell that generates icons:
> Resize-Square $src "store-assets/edge-logo-300.png" 300
> ```
>
> Or just open `icons/icon-128.png` in any image editor, resize to
> 300×300 (Lanczos), save as `store-assets/edge-logo-300.png`.

### 2.4 Privacy, properties, availability

- **Privacy policy URL:** `https://github.com/eshin087/Tack#privacy`
  (the README's Privacy heading anchor — make sure this section exists
  in your README, or paste the privacy declarations from
  `STORE-LISTING.md` into a `PRIVACY.md` and point at that)
- **Mature content:** No
- **Availability:** All markets
- **Visibility:** Public (or Hidden for soft launch)
- **Pricing:** Free

### 2.5 Submit

Click **Publish** at the bottom-right of the final review screen.

**Review timeline:** Edge is reliably faster than Chrome — usually
**1–3 business days** for first submission, **<1 day** for updates.

---

## Part 3 — After submission

### Email watch

Both stores send approval/rejection notifications to the email on the
developer account. Check spam if you don't see anything within a week.

### Common rejection reasons (and how to avoid them)

- **"Single purpose unclear"** → Tighten the Single purpose statement
  to one sentence. Don't list features.
- **"Excessive permissions"** → If a reviewer questions `tabs` or
  `webNavigation`, point them at the justifications. Tack actually uses
  both, so the rejection should be appealable.
- **"Privacy policy missing"** → Make sure your GitHub README has a
  Privacy section, or maintain a `PRIVACY.md` in the repo.
- **"Misleading screenshots"** → Screenshots must show actual extension
  behavior. Don't include mockups, marketing copy, or stock art.

### Updating after the first release

1. Make changes in code.
2. Bump `version` in `manifest.json` AND `package.json` (must match
   semver and be greater than the previous release).
3. `npm run release`
4. In the dashboard, find Tack → Package → upload the new
   `release/tack-vX.Y.Z.zip`.
5. Re-submit for review.

The listing copy stays — you only need to re-edit it if descriptions
change.

### Public URLs once approved

- **Chrome Web Store:** `https://chromewebstore.google.com/detail/tack/<id>`
  (the `<id>` is auto-assigned by Chrome on first publish)
- **Edge Add-ons:** `https://microsoftedge.microsoft.com/addons/detail/<slug>`

Update the README with these install links once they're live.

---

## Quick command reference

```powershell
# From the Tack repo root
npm run release      # typecheck + test + build + zip → release/tack-v$VERSION.zip
npm run build        # just rebuild dist/ (for local Load unpacked testing)
npm test             # run the 77 unit tests
```
