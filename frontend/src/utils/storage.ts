export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },

  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  },

  // Sync storage (syncs across devices)
  sync: {
    async get<T>(key: string): Promise<T | null> {
      const result = await chrome.storage.sync.get(key);
      return result[key] || null;
    },

    async set<T>(key: string, value: T): Promise<void> {
      await chrome.storage.sync.set({ [key]: value });
    },
  },
};