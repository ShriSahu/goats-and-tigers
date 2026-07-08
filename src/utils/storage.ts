/**
 * Minimal cross-platform key/value persistence. Uses `localStorage` on web
 * (available via react-native-web) and falls back to an in-memory map on
 * native/test environments where nothing else is wired up yet.
 */

const memoryStore = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Accessing localStorage can throw in locked-down environments.
  }
  return null;
}

export function loadItem(key: string): string | null {
  const ls = getLocalStorage();
  if (ls) {
    try {
      return ls.getItem(key);
    } catch {
      return null;
    }
  }
  return memoryStore.get(key) ?? null;
}

export function saveItem(key: string, value: string): void {
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.setItem(key, value);
      return;
    } catch {
      // Fall through to memory store.
    }
  }
  memoryStore.set(key, value);
}
