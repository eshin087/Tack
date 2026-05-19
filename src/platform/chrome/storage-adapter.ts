import type { StorageAdapter } from '../../core/storage';

export const chromeSyncStorage: StorageAdapter = {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.sync.get(key);
    const value = result[key];
    return (value as T | undefined) ?? null;
  },
  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.sync.set({ [key]: value });
  },
  async remove(key: string): Promise<void> {
    await chrome.storage.sync.remove(key);
  },
  onChange(listener: (key: string) => void): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      for (const key of Object.keys(changes)) listener(key);
    });
  },
};
