import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log('Error writing to localStorage:', error);
    }
  };

  // Listen for changes to the stored value in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key]);

  return [storedValue, setValue];
}

// Helper function to store data in local storage for offline use
export function useOfflineStorage<T>(
  key: string, 
  initialValue: T[], 
  isOnline: boolean,
  syncFunction: (items: T[]) => Promise<void>
): [T[], (item: T) => void, (item: T) => void, (id: number) => void] {
  const [items, setItems] = useLocalStorage<T[]>(key, initialValue);
  
  // Add a new item
  const addItem = (item: T) => {
    const newItems = [...items, item];
    setItems(newItems);
    
    // If online, try to sync immediately
    if (isOnline) {
      syncFunction(newItems).catch(console.error);
    }
  };
  
  // Update an existing item
  const updateItem = (updatedItem: T) => {
    // Assuming items have an 'id' property
    const id = (updatedItem as any).id;
    
    const newItems = items.map(item => 
      (item as any).id === id ? updatedItem : item
    );
    
    setItems(newItems);
    
    // If online, try to sync immediately
    if (isOnline) {
      syncFunction(newItems).catch(console.error);
    }
  };
  
  // Remove an item
  const removeItem = (id: number) => {
    const newItems = items.filter(item => (item as any).id !== id);
    setItems(newItems);
    
    // If online, try to sync immediately
    if (isOnline) {
      syncFunction(newItems).catch(console.error);
    }
  };
  
  // Attempt to sync when we come back online
  useEffect(() => {
    if (isOnline && items.length > 0) {
      syncFunction(items).catch(console.error);
    }
  }, [isOnline]);
  
  return [items, addItem, updateItem, removeItem];
}
