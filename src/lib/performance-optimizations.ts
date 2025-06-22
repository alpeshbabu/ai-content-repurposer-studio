/**
 * Performance Optimizations and Code Quality Improvements
 * 
 * This module contains various optimizations and utilities to improve
 * application performance and code quality throughout the codebase.
 */

import { useCallback, useMemo, memo } from 'react';
import { debounce, throttle } from 'lodash';

// React Performance Utilities
export const withPerformance = {
  /**
   * HOC to wrap components with React.memo and performance monitoring
   */
  memo: <T extends React.ComponentType<any>>(
    Component: T,
    propsAreEqual?: (prevProps: any, nextProps: any) => boolean
  ) => {
    const MemoizedComponent = memo(Component, propsAreEqual);
    MemoizedComponent.displayName = `Performance(${Component.displayName || Component.name})`;
    return MemoizedComponent;
  },

  /**
   * Hook for memoizing expensive calculations
   */
  useMemoized: <T>(factory: () => T, deps: React.DependencyList): T => {
    return useMemo(factory, deps);
  },

  /**
   * Hook for memoizing callback functions
   */
  useStableCallback: <T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T => {
    return useCallback(callback, deps);
  }
};

// Database Query Optimizations
export const dbOptimizations = {
  /**
   * Batch multiple database queries
   */
  batchQueries: async <T>(queries: Promise<T>[]): Promise<T[]> => {
    return Promise.all(queries);
  },

  /**
   * Paginated query helper with performance optimizations
   */
  paginateQuery: <T>(
    baseQuery: any,
    options: {
      page: number;
      limit: number;
      select?: any;
      include?: any;
      orderBy?: any;
      where?: any;
    }
  ) => {
    const { page, limit, ...queryOptions } = options;
    const skip = Math.max(0, (page - 1) * limit);
    
    return {
      ...queryOptions,
      skip,
      take: Math.min(limit, 100), // Cap at 100 items per page
    };
  }
};

// Caching Utilities
export const cacheUtils = {
  /**
   * Create a memoized function with TTL
   */
  withTTL: <T extends (...args: any[]) => any>(
    fn: T,
    ttlMs: number = 60000
  ): T => {
    const cache = new Map<string, { value: any; expiry: number }>();
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      const now = Date.now();
      const cached = cache.get(key);
      
      if (cached && cached.expiry > now) {
        return cached.value;
      }
      
      const result = fn(...args);
      cache.set(key, { value: result, expiry: now + ttlMs });
      
      // Cleanup expired entries periodically
      if (cache.size > 100) {
        for (const [k, v] of cache.entries()) {
          if (v.expiry <= now) {
            cache.delete(k);
          }
        }
      }
      
      return result;
    }) as T;
  },

  /**
   * LRU Cache implementation
   */
  createLRUCache: <K, V>(maxSize: number = 100) => {
    const cache = new Map<K, V>();
    
    return {
      get: (key: K): V | undefined => {
        if (cache.has(key)) {
          const value = cache.get(key)!;
          cache.delete(key);
          cache.set(key, value);
          return value;
        }
        return undefined;
      },
      
      set: (key: K, value: V): void => {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },
      
      clear: (): void => {
        cache.clear();
      },
      
      size: (): number => cache.size
    };
  }
};

// Event Handling Optimizations
export const eventUtils = {
  /**
   * Debounced event handler
   */
  useDebounced: <T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300,
    deps: React.DependencyList = []
  ): T => {
    return useCallback(debounce(callback, delay), deps) as T;
  },

  /**
   * Throttled event handler
   */
  useThrottled: <T extends (...args: any[]) => any>(
    callback: T,
    limit: number = 100,
    deps: React.DependencyList = []
  ): T => {
    return useCallback(throttle(callback, limit), deps) as T;
  }
};

// Type Safety Utilities
export const typeUtils = {
  /**
   * Type-safe property access with fallback
   */
  safeGet: <T, K extends keyof T>(obj: T | null | undefined, key: K, fallback?: T[K]): T[K] | undefined => {
    return obj?.[key] ?? fallback;
  },

  /**
   * Type guard for checking if value is defined
   */
  isDefined: <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
  },

  /**
   * Type-safe JSON parsing
   */
  safeJSONParse: <T = unknown>(json: string, fallback?: T): T | undefined => {
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  },

  /**
   * Assert that a value is not null/undefined
   */
  assertDefined: <T>(value: T | null | undefined, message?: string): T => {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value is null or undefined');
    }
    return value;
  }
};

// Error Handling Utilities
export const errorUtils = {
  /**
   * Safe async function wrapper with error handling
   */
  safeAsync: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    onError?: (error: unknown) => void
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        onError?.(error);
        console.error('Async operation failed:', error);
        return null;
      }
    }) as T;
  },

  /**
   * Create error boundary higher-order component
   */
  withErrorBoundary: <P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error }>
  ) => {
    const ErrorBoundaryComponent = (props: P) => {
      try {
        return <Component {...props} />;
      } catch (error) {
        if (fallback) {
          const FallbackComponent = fallback;
          return <FallbackComponent error={error as Error} />;
        }
        return <div>Something went wrong</div>;
      }
    };
    
    ErrorBoundaryComponent.displayName = `ErrorBoundary(${Component.displayName || Component.name})`;
    return ErrorBoundaryComponent;
  }
};

// Bundle Size Optimizations
export const bundleOptimizations = {
  /**
   * Lazy import utility
   */
  lazyImport: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFn);
  },

  /**
   * Code splitting utility for large components
   */
  createAsyncComponent: <P extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>,
    loadingComponent?: React.ComponentType
  ) => {
    const AsyncComponent = React.lazy(importFn);
    
    return (props: P) => (
      <React.Suspense fallback={loadingComponent ? <loadingComponent /> : <div>Loading...</div>}>
        <AsyncComponent {...props} />
      </React.Suspense>
    );
  }
};

// Memory Management
export const memoryUtils = {
  /**
   * Cleanup function to prevent memory leaks
   */
  useCleanup: (cleanup: () => void) => {
    React.useEffect(() => {
      return cleanup;
    }, []);
  },

  /**
   * WeakMap-based cache for object references
   */
  createWeakCache: <K extends object, V>() => {
    const cache = new WeakMap<K, V>();
    
    return {
      get: (key: K): V | undefined => cache.get(key),
      set: (key: K, value: V): void => {
        cache.set(key, value);
      },
      has: (key: K): boolean => cache.has(key),
      delete: (key: K): boolean => cache.delete(key)
    };
  }
};

// Performance Monitoring
export const performanceMonitor = {
  /**
   * Measure function execution time
   */
  measure: async <T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`[Performance] ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
      throw error;
    }
  },

  /**
   * React component render performance monitor
   */
  withRenderMonitor: <P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    componentName?: string
  ) => {
    const name = componentName || Component.displayName || Component.name || 'Component';
    
    return (props: P) => {
      const renderStart = performance.now();
      
      React.useEffect(() => {
        const renderEnd = performance.now();
        console.log(`[Render] ${name}: ${(renderEnd - renderStart).toFixed(2)}ms`);
      });
      
      return <Component {...props} />;
    };
  }
};

export default {
  withPerformance,
  dbOptimizations,
  cacheUtils,
  eventUtils,
  typeUtils,
  errorUtils,
  bundleOptimizations,
  memoryUtils,
  performanceMonitor
}; 