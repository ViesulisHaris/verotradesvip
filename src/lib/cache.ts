// Caching utilities for performance optimization
import React from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  // Set cache item
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, item);
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      this.delete(key);
    }, item.ttl);
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  // Delete cache item
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const dataCache = new DataCache();

// React hook for caching
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cachedData = dataCache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      dataCache.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = React.useCallback(() => {
    dataCache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refetch };
};

// Memoized fetch wrapper
export const cachedFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Check cache first
  const cachedData = dataCache.get<T>(key);
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch fresh data
  const freshData = await fetcher();
  dataCache.set(key, freshData, ttl);
  return freshData;
};

// Local storage cache with fallback
export const localStorageCache = {
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 5 * 60 * 1000 // 5 minutes default
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(`cache_${key}`);
      if (!itemStr) return null;
      
      const item: CacheItem<T> = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },

  delete(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
};

// Session storage cache for temporary data
export const sessionStorageCache = {
  set<T>(key: string, data: T): void {
    try {
      sessionStorage.setItem(`session_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const itemStr = sessionStorage.getItem(`session_${key}`);
      return itemStr ? JSON.parse(itemStr) : null;
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
      return null;
    }
  },

  delete(key: string): void {
    try {
      sessionStorage.removeItem(`session_${key}`);
    } catch (error) {
      console.warn('Failed to delete from sessionStorage:', error);
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('session_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear sessionStorage cache:', error);
    }
  }
};

// IndexedDB cache for larger data sets
export class IndexedDBCache {
  private dbName = 'VeroTradeCache';
  private version = 1;
  private storeName = 'cache';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 5 * 60 * 1000
      };
      
      const request = store.put({ key, ...item });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          resolve(null);
          return;
        }
        
        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
          this.delete(key);
          resolve(null);
          return;
        }
        
        resolve(item.data as T);
      };
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const indexedDBCache = new IndexedDBCache();