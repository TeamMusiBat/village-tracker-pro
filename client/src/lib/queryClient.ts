import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { savePendingSync, SyncEntityType } from "@/services/sync-service";

// Cache keys for local storage
const CACHE_TIME_KEY = 'track4health_cache_time';
const CACHE_DATA_KEY = 'track4health_cache_data';

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 1000 * 60 * 60;

// Helper to throw if response is not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Map API endpoints to entity types for sync service
const mapUrlToEntityType = (url: string): SyncEntityType | null => {
  if (url.includes('/api/awareness-sessions')) return 'awareness-session';
  if (url.includes('/api/attendees')) return 'attendee';
  if (url.includes('/api/child-screenings')) return 'child-screening';
  if (url.includes('/api/screened-children')) return 'screened-child';
  if (url.includes('/api/update-location')) return 'location';
  return null;
};

// Function to check if device is online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Save data to cache for offline use
const saveToCache = (key: string, data: any) => {
  try {
    const cacheTimeData = JSON.parse(localStorage.getItem(CACHE_TIME_KEY) || '{}');
    const cacheData = JSON.parse(localStorage.getItem(CACHE_DATA_KEY) || '{}');
    
    cacheTimeData[key] = Date.now();
    cacheData[key] = data;
    
    localStorage.setItem(CACHE_TIME_KEY, JSON.stringify(cacheTimeData));
    localStorage.setItem(CACHE_DATA_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Get data from cache if available and not expired
const getFromCache = (key: string): any | null => {
  try {
    const cacheTimeData = JSON.parse(localStorage.getItem(CACHE_TIME_KEY) || '{}');
    const cacheData = JSON.parse(localStorage.getItem(CACHE_DATA_KEY) || '{}');
    
    const cacheTime = cacheTimeData[key];
    
    if (!cacheTime) return null;
    
    // Check if cache is expired
    if (Date.now() - cacheTime > CACHE_DURATION) {
      // Remove expired cache
      delete cacheTimeData[key];
      delete cacheData[key];
      localStorage.setItem(CACHE_TIME_KEY, JSON.stringify(cacheTimeData));
      localStorage.setItem(CACHE_DATA_KEY, JSON.stringify(cacheData));
      return null;
    }
    
    return cacheData[key] || null;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
};

// API request function with offline support
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // For POST/PUT/PATCH requests when offline, save for later sync
  if (!isOnline() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    console.log(`Offline mode: Saving ${method} request to ${url} for later sync`);
    
    const entityType = mapUrlToEntityType(url);
    
    // If this is a recognized entity type, save it for sync
    if (entityType && data) {
      // Save to pending sync
      savePendingSync(0, entityType, data);
      
      // Return a mock response
      const mockResponse = new Response(JSON.stringify({ 
        offline: true, 
        message: 'Data saved for later sync',
        data
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
      
      return mockResponse;
    }
    
    // If we can't handle this request offline, throw an error
    throw new Error('Cannot perform this operation while offline');
  }
  
  // Online mode or GET request
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    
    // For GET requests, cache the response
    if (method === 'GET') {
      const responseData = await res.clone().json();
      saveToCache(url, responseData);
    }
    
    return res;
  } catch (error) {
    // If we're offline and this is a GET request, try to get from cache
    if (!isOnline() && method === 'GET') {
      const cachedData = getFromCache(url);
      if (cachedData) {
        // Return cached data as a Response object
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Query function with offline support
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    try {
      // Try to fetch from API first
      if (isOnline()) {
        const res = await fetch(url, {
          credentials: "include",
        });
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }
        
        await throwIfResNotOk(res);
        const data = await res.json();
        
        // Cache the successful response
        saveToCache(url, data);
        
        return data;
      } else {
        // Offline mode, try to get from cache
        const cachedData = getFromCache(url);
        if (cachedData) {
          console.log(`Using cached data for ${url}`);
          return cachedData;
        }
        
        throw new Error('No cached data available while offline');
      }
    } catch (error) {
      // If online request failed, try to get from cache
      const cachedData = getFromCache(url);
      if (cachedData) {
        console.log(`Using cached data for ${url} after fetch error`);
        return cachedData;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
