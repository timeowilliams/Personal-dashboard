interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const cacheUtils = {
  set: <T>(key: string, data: T) => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsedItem: CacheItem<T> = JSON.parse(item);
    const now = Date.now();

    if (now - parsedItem.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return parsedItem.data;
  },
};
