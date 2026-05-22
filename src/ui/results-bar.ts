import type { SearchProfile, TabState, RuntimeMessage } from '../core/types';

export const BAR_ID  = 'tack-bar';
export const PILL_ID = 'tack-pill';

interface BarProps {
  profiles: SearchProfile[];
  activeProfile: SearchProfile | null;
  tabState: TabState;
}

function send(message: RuntimeMessage): void {
  void chrome.runtime.sendMessage(message);
}

export function removeResultsBar(): void {
  document.getElementById(BAR_ID)?.remove();
  removePill();
}

function removePill(): void {
  document.getElementById(PILL_ID)?.remove();
}

// ---------------------------------------------------------------------------
// Full bar (visible for 3 seconds on page load)
// ---------------------------------------------------------------------------

export function mountResultsBar(props: BarProps): void {
  removeResultsBar();

  const { profiles, activeProfile, tabState } = props;
  const filterOn = !tabState.filterDisabled && activeProfile !== null;

  const bar = document.createElement('div');
  bar.id = BAR_ID;
  Object.assign(bar.style, {
    position: 'sticky',
    top: '0',
    zIndex: '2147483646',
    boxSizing: 'border-box',
    width: '100%',
    background: filterOn ? '#fff8e1' : '#f4f4f4',
    borderBottom: filterOn ? '1px solid #f0d878' : '1px solid #d8d8d8',
    color: filterOn ? '#5a4400' : '#444',
    padding: '6px 12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: '13px',
    lineHeight: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    opacity: '1',
    transition: 'opacity 400ms ease',
  } satisfies Partial<CSSStyleDeclaration>);

  bar.append(...buildControls(props));
  document.body.prepend(bar);

  scheduleCollapse(bar, props);
}

function scheduleCollapse(bar: HTMLElement, props: BarProps): void {
  const timer = window.setTimeout(() => {
    bar.style.opacity = '0';
    window.setTimeout(() => {
      bar.remove();
      // Only mount the pill if the bar hasn't already been replaced by a new
      // render call (e.g. from a SPA URL change).
      if (!document.getElementById(BAR_ID) && !document.getElementById(PILL_ID)) {
        mountPill(props);
      }
    }, 420);
  }, 3000);

  // Cancel collapse if the bar is removed before the timer fires
  // (mountResultsBar calls removeResultsBar which removes the element).
  const mo = new MutationObserver(() => {
    if (!document.getElementById(BAR_ID)) {
      window.clearTimeout(timer);
      mo.disconnect();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

// ---------------------------------------------------------------------------
// Floating pill (persists after the bar fades)
// ---------------------------------------------------------------------------

function mountPill(props: BarProps): void {
  removePill();

  const { activeProfile, tabState } = props;
  const filterOn = !tabState.filterDisabled && activeProfile !== null;

  const wrapper = document.createElement('div');
  wrapper.id = PILL_ID;

  // Trigger button (the circle)
  const trigger = document.createElement('button');
  trigger.title = filterOn
    ? `Tack: filtered by ${activeProfile!.name}`
    : 'Tack: filter off';
  Object.assign(trigger.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: filterOn ? '#f59f00' : '#888',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    zIndex: '2147483646',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '-0.5px',
  } satisfies Partial<CSSStyleDeclaration>);
  trigger.textContent = 'T';

  // Popup panel
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '64px',
    right: '20px',
    width: '230px',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: '2147483646',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: '13px',
    color: '#222',
    display: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  panel.append(...buildControls(props));

  let outsideHandler: ((e: MouseEvent) => void) | null = null;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.style.display !== 'none';
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  function openPanel(): void {
    panel.style.display = 'block';
    outsideHandler = (e: MouseEvent) => {
      if (!panel.contains(e.target as Node) && e.target !== trigger) {
        closePanel();
      }
    };
    document.addEventListener('click', outsideHandler);
  }

  function closePanel(): void {
    panel.style.display = 'none';
    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler);
      outsideHandler = null;
    }
  }

  wrapper.append(trigger, panel);
  document.body.appendChild(wrapper);
}

// ---------------------------------------------------------------------------
// Shared controls used by both bar and pill panel
// ---------------------------------------------------------------------------

function buildControls(props: BarProps): Node[] {
  const { profiles, activeProfile, tabState } = props;
  const filterOn = !tabState.filterDisabled && activeProfile !== null;

  const label = document.createElement('span');
  if (filterOn && activeProfile) {
    label.textContent = `Filtered by: ${activeProfile.name}`;
    const code = document.createElement('code');
    code.textContent = activeProfile.modifier;
    Object.assign(code.style, {
      background: 'rgba(0,0,0,0.07)',
      padding: '1px 5px',
      marginLeft: '6px',
      borderRadius: '3px',
      fontSize: '12px',
      fontFamily: 'monospace',
    });
    label.appendChild(code);
  } else if (activeProfile) {
    label.textContent = 'Showing all results';
  } else {
    label.textContent = 'No default profile';
  }
  Object.assign(label.style, { display: 'block', marginBottom: '8px', lineHeight: '1.4' });

  const row = document.createElement('div');
  Object.assign(row.style, { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' });

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = tabState.filterDisabled ? 'Apply filter' : 'Show all';
  toggleBtn.disabled = !activeProfile;
  styleButton(toggleBtn);
  toggleBtn.addEventListener('click', () => {
    send({ type: 'setFilterDisabled', disabled: !tabState.filterDisabled });
  });

  const select = document.createElement('select');
  styleSelect(select);
  const enabledProfiles = profiles.filter((p) => p.enabled);
  if (enabledProfiles.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'No profiles';
    opt.disabled = true;
    opt.selected = true;
    select.appendChild(opt);
    select.disabled = true;
  } else {
    for (const profile of enabledProfiles) {
      const opt = document.createElement('option');
      opt.value = profile.id;
      opt.textContent = profile.name;
      if (profile.id === activeProfile?.id) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      send({ type: 'setActiveProfile', profileId: select.value });
    });
  }

  const settingsLink = document.createElement('a');
  settingsLink.textContent = 'Settings';
  settingsLink.href = '#';
  Object.assign(settingsLink.style, {
    color: '#1a73e8',
    marginLeft: 'auto',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  });
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    send({ type: 'openOptions' });
  });

  row.append(toggleBtn, select, settingsLink);
  return [label, row];
}

function styleButton(btn: HTMLButtonElement): void {
  Object.assign(btn.style, {
    padding: '3px 8px',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: '3px',
    background: '#fff',
    color: '#222',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  } satisfies Partial<CSSStyleDeclaration>);
}

function styleSelect(select: HTMLSelectElement): void {
  Object.assign(select.style, {
    padding: '3px 6px',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: '3px',
    background: '#fff',
    color: '#222',
    fontSize: '12px',
    fontFamily: 'inherit',
    flex: '1',
    minWidth: '0',
  } satisfies Partial<CSSStyleDeclaration>);
}
