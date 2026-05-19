import type { StorageAdapter } from './storage';

export type KeybindingAction =
  | 'toggle'
  | 'enable'
  | 'disable'
  | 'show'
  | 'cycle'
  | 'cycleBack';

export interface Keybinding {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}

export type Keybindings = Partial<Record<KeybindingAction, Keybinding>>;

const STORAGE_KEY = 'searchpin:keybindings';

export async function loadKeybindings(storage: StorageAdapter): Promise<Keybindings> {
  return (await storage.get<Keybindings>(STORAGE_KEY)) ?? {};
}

export async function saveKeybindings(
  storage: StorageAdapter,
  kbs: Keybindings,
): Promise<void> {
  await storage.set(STORAGE_KEY, kbs);
}

// Normalises event.key so "q" and "Q" both store as "Q", while preserving
// multi-char names ("Enter", "ArrowLeft", "/").
function normaliseKey(rawKey: string): string {
  return rawKey.length === 1 ? rawKey.toUpperCase() : rawKey;
}

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph']);

/**
 * Reads a KeyboardEvent into a Keybinding, or returns null when the event was
 * only a modifier press (the user is still mid-combo, no key yet).
 */
export function captureKeybinding(event: KeyboardEvent): Keybinding | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  return {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    key: normaliseKey(event.key),
  };
}

export function matchesKeybinding(event: KeyboardEvent, kb: Keybinding): boolean {
  if (event.ctrlKey !== kb.ctrl) return false;
  if (event.altKey !== kb.alt) return false;
  if (event.shiftKey !== kb.shift) return false;
  if (event.metaKey !== kb.meta) return false;
  return normaliseKey(event.key) === kb.key;
}

export function formatKeybinding(kb: Keybinding): string {
  const parts: string[] = [];
  if (kb.ctrl) parts.push('Ctrl');
  if (kb.alt) parts.push('Alt');
  if (kb.shift) parts.push('Shift');
  if (kb.meta) parts.push('Meta');
  parts.push(kb.key);
  return parts.join('+');
}
