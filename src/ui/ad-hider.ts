const STYLE_ID = 'tack-ad-hider';

// Targets the stable structural elements Google uses for sponsored ads.
// IDs (#tads, #tadsb) have been present for 10+ years.
// div[data-text-ad] is an attribute Google attaches to individual ad wrappers.
// The commercial-unit classes cover shopping carousels and sidebar ad slots.
const GOOGLE_AD_CSS = [
  '#tads, #tadsb { display: none !important; }',
  'div[data-text-ad] { display: none !important; }',
  '.commercial-unit-desktop-top { display: none !important; }',
  '.commercial-unit-desktop-rhs { display: none !important; }',
].join('\n');

export function injectGoogleAdHider(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GOOGLE_AD_CSS;
  (document.head ?? document.documentElement).appendChild(style);
}
