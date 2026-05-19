import { chromeSyncStorage } from '../storage-adapter';
import {
  loadProfiles,
  saveProfiles,
  generateId,
  normalizeProfiles,
} from '../../../core/profiles';
import {
  loadKeybindings,
  saveKeybindings,
  captureKeybinding,
  formatKeybinding,
  type Keybindings,
  type KeybindingAction,
} from '../../../core/keybindings';
import { loadPreferences, savePreferences, type Preferences } from '../../../core/preferences';
import type { SearchProfile } from '../../../core/types';

let profiles: SearchProfile[] = [];

const profilesEl = document.getElementById('profiles');
const addBtn = document.getElementById('add');
const savedIndicator = document.getElementById('saved');
const shortcutsListEl = document.getElementById('shortcuts-list');
const customizeBtn = document.getElementById('customize-shortcuts');
const keybindingsListEl = document.getElementById('keybindings-list');
const silentModeCheckbox = document.getElementById('silent-mode') as HTMLInputElement | null;

if (
  !profilesEl ||
  !addBtn ||
  !savedIndicator ||
  !shortcutsListEl ||
  !customizeBtn ||
  !keybindingsListEl ||
  !silentModeCheckbox
) {
  throw new Error('SearchPin: options page is missing required elements');
}

let keybindings: Keybindings = {};
let preferences: Preferences = { silentMode: false, lastFilterDisabled: false };

async function init(): Promise<void> {
  profiles = await loadProfiles(chromeSyncStorage);
  render();
  keybindings = await loadKeybindings(chromeSyncStorage);
  preferences = await loadPreferences(chromeSyncStorage);
  silentModeCheckbox!.checked = preferences.silentMode;
  await renderShortcuts();
  renderKeybindings();
}

silentModeCheckbox!.addEventListener('change', () => {
  preferences = { ...preferences, silentMode: silentModeCheckbox!.checked };
  void savePreferences(chromeSyncStorage, preferences).then(flashSaved);
});

const KEYBINDING_ACTIONS: { action: KeybindingAction; label: string; hint: string }[] = [
  { action: 'toggle', label: 'Toggle filter', hint: 'Turns the filter on if off, off if on' },
  { action: 'enable', label: 'Apply filter', hint: 'Always enables the filter' },
  { action: 'disable', label: 'Show all results', hint: 'Always disables the filter' },
  { action: 'show', label: 'Show / hide bar', hint: 'Reveals or hides the bar (useful with Silent mode)' },
  { action: 'cycle', label: 'Next profile', hint: 'Switch to the next enabled profile (wraps)' },
  { action: 'cycleBack', label: 'Previous profile', hint: 'Switch to the previous enabled profile (wraps)' },
];

function renderKeybindings(): void {
  keybindingsListEl!.replaceChildren(
    ...KEYBINDING_ACTIONS.map(({ action, label, hint }) =>
      renderKeybindingRow(action, label, hint),
    ),
  );
}

function renderKeybindingRow(
  action: KeybindingAction,
  label: string,
  hint: string,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'shortcut-row';

  const labelWrap = document.createElement('div');
  labelWrap.className = 'shortcut-label';
  const name = document.createElement('div');
  name.textContent = label;
  const desc = document.createElement('div');
  desc.className = 'shortcut-desc';
  desc.textContent = hint;
  labelWrap.append(name, desc);

  const capture = document.createElement('button');
  capture.type = 'button';
  const current = keybindings[action];
  capture.className = current ? 'kb-capture' : 'kb-capture unset';
  capture.textContent = current ? formatKeybinding(current) : 'Click to set';
  capture.addEventListener('click', () => startRecording(capture, action));

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'kb-clear';
  clear.textContent = 'Clear';
  clear.style.visibility = current ? 'visible' : 'hidden';
  clear.addEventListener('click', () => {
    const next = { ...keybindings };
    delete next[action];
    keybindings = next;
    void saveKeybindings(chromeSyncStorage, keybindings).then(() => {
      renderKeybindings();
      flashSaved();
    });
  });

  row.append(labelWrap, capture, clear);
  return row;
}

function startRecording(button: HTMLButtonElement, action: KeybindingAction): void {
  button.classList.add('recording');
  button.classList.remove('unset');
  button.textContent = 'Press a key…';

  const onKey = (event: KeyboardEvent): void => {
    // Let Escape cancel without binding.
    if (event.key === 'Escape') {
      event.preventDefault();
      stop();
      renderKeybindings();
      return;
    }
    const kb = captureKeybinding(event);
    if (!kb) return; // user pressed only a modifier — keep waiting
    event.preventDefault();
    event.stopPropagation();
    keybindings = { ...keybindings, [action]: kb };
    void saveKeybindings(chromeSyncStorage, keybindings).then(() => {
      stop();
      renderKeybindings();
      flashSaved();
    });
  };

  const onBlur = (): void => {
    stop();
    renderKeybindings();
  };

  function stop(): void {
    button.classList.remove('recording');
    document.removeEventListener('keydown', onKey, true);
    button.removeEventListener('blur', onBlur);
  }

  document.addEventListener('keydown', onKey, true);
  button.addEventListener('blur', onBlur);
  button.focus();
}

async function renderShortcuts(): Promise<void> {
  const commands = await chrome.commands.getAll();
  shortcutsListEl!.replaceChildren(
    ...commands
      .filter((c) => c.name && c.name !== '_execute_action')
      .map(renderShortcutRow),
  );
}

function renderShortcutRow(cmd: chrome.commands.Command): HTMLElement {
  const row = document.createElement('div');
  row.className = 'shortcut-row';

  const labelWrap = document.createElement('div');
  labelWrap.className = 'shortcut-label';
  const name = document.createElement('div');
  name.textContent = cmd.description ?? cmd.name ?? '';
  const desc = document.createElement('div');
  desc.className = 'shortcut-desc';
  desc.textContent = cmdHint(cmd.name ?? '');
  labelWrap.append(name, desc);

  const key = document.createElement('div');
  key.className = cmd.shortcut ? 'shortcut-key' : 'shortcut-key unset';
  key.textContent = cmd.shortcut || 'Not set';

  row.append(labelWrap, key);
  return row;
}

function cmdHint(name: string): string {
  if (name === 'toggle-filter') return 'Turns the filter on if off, off if on';
  if (name === 'enable-filter') return 'Always enables the filter (apply)';
  if (name === 'disable-filter') return 'Always disables the filter (show all)';
  if (name === 'show-ui') return 'Show / hide the bar (useful with Silent mode)';
  if (name === 'cycle-profile') return 'Switch to the next enabled profile';
  if (name === 'cycle-profile-back') return 'Switch to the previous enabled profile';
  return '';
}

function render(): void {
  profilesEl!.replaceChildren(...profiles.map(renderRow));
}

function renderRow(profile: SearchProfile): HTMLElement {
  const row = document.createElement('div');
  row.className = 'profile-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Name';
  nameInput.value = profile.name;
  nameInput.addEventListener('input', () => {
    profile.name = nameInput.value;
    schedulePersist();
  });

  const modifierInput = document.createElement('input');
  modifierInput.type = 'text';
  modifierInput.placeholder = 'site:example.com';
  modifierInput.value = profile.modifier;
  modifierInput.addEventListener('input', () => {
    profile.modifier = modifierInput.value;
    schedulePersist();
  });

  const enabledLabel = document.createElement('label');
  const enabledCheckbox = document.createElement('input');
  enabledCheckbox.type = 'checkbox';
  enabledCheckbox.checked = profile.enabled;
  enabledCheckbox.addEventListener('change', () => {
    profile.enabled = enabledCheckbox.checked;
    profiles = normalizeProfiles(profiles);
    render();
    void persist();
  });
  enabledLabel.append(enabledCheckbox, document.createTextNode('Enabled'));

  const defaultLabel = document.createElement('label');
  const defaultRadio = document.createElement('input');
  defaultRadio.type = 'radio';
  defaultRadio.name = 'default-profile';
  defaultRadio.checked = profile.isDefault;
  defaultRadio.disabled = !profile.enabled;
  defaultRadio.addEventListener('change', () => {
    if (!defaultRadio.checked) return;
    for (const p of profiles) p.isDefault = p.id === profile.id;
    render();
    void persist();
  });
  defaultLabel.append(defaultRadio, document.createTextNode('Default'));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Remove';
  deleteBtn.title = 'Delete profile';
  deleteBtn.addEventListener('click', () => {
    profiles = profiles.filter((p) => p.id !== profile.id);
    profiles = normalizeProfiles(profiles);
    render();
    void persist();
  });

  row.append(nameInput, modifierInput, enabledLabel, defaultLabel, deleteBtn);
  return row;
}

addBtn.addEventListener('click', () => {
  const isFirst = profiles.length === 0;
  profiles.push({
    id: generateId(),
    name: 'New profile',
    modifier: '',
    enabled: true,
    isDefault: isFirst,
  });
  render();
  void persist();
});

let saveTimer: number | null = null;
function schedulePersist(): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void persist();
  }, 350);
}

async function persist(): Promise<void> {
  profiles = normalizeProfiles(profiles);
  await saveProfiles(chromeSyncStorage, profiles);
  flashSaved();
}

function flashSaved(): void {
  savedIndicator!.style.opacity = '1';
  window.setTimeout(() => {
    savedIndicator!.style.opacity = '0';
  }, 1200);
}

customizeBtn!.addEventListener('click', () => {
  void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

void init();
