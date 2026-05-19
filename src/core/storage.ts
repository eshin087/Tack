/**
 * Platform-agnostic storage interface. Chrome, Firefox, and Safari each provide
 * a concrete implementation under `src/platform/<browser>/storage-adapter.ts`.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  onChange(listener: (key: string) => void): void;
}
