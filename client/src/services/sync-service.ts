import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// Local storage keys
const PENDING_SYNC_KEY = 'track4health_pending_sync';

// Entity types for sync
export type SyncEntityType = 'awareness-session' | 'attendee' | 'child-screening' | 'screened-child' | 'location';

// Interface for pending sync items
interface PendingSyncItem {
  id: number;
  userId: number;
  entityType: SyncEntityType;
  entityData: any;
  timestamp: string;
  synced: boolean;
}

/**
 * Save an item for later synchronization
 * @param userId User ID (0 if not logged in)
 * @param entityType Type of entity being synced
 * @param entityData The data to be synced
 */
export const savePendingSync = (userId: number, entityType: SyncEntityType, entityData: any): void => {
  try {
    // Get existing sync items
    const pendingSyncItems: PendingSyncItem[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    
    // Create new sync item
    const newSyncItem: PendingSyncItem = {
      id: Date.now(), // Use timestamp as unique ID
      userId,
      entityType,
      entityData,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    // Add to list and save
    pendingSyncItems.push(newSyncItem);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSyncItems));
    
    console.log(`Added item to sync queue: ${entityType}`);
  } catch (error) {
    console.error('Error saving pending sync:', error);
  }
};

/**
 * Mark a sync item as synced
 * @param id ID of the sync item
 */
export const markSyncItemAsSynced = (id: number): void => {
  try {
    const pendingSyncItems: PendingSyncItem[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    
    const updatedItems = pendingSyncItems.map(item => 
      item.id === id ? { ...item, synced: true } : item
    );
    
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error marking sync item as synced:', error);
  }
};

/**
 * Get all pending sync items
 * @returns Array of pending sync items
 */
export const getPendingSyncItems = (): PendingSyncItem[] => {
  try {
    const allItems: PendingSyncItem[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    return allItems.filter(item => !item.synced);
  } catch (error) {
    console.error('Error getting pending sync items:', error);
    return [];
  }
};

/**
 * Remove synced items older than 7 days
 */
export const cleanupSyncedItems = (): void => {
  try {
    const allItems: PendingSyncItem[] = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    
    // Keep items that are not synced or are less than 7 days old
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const filteredItems = allItems.filter(item => {
      if (!item.synced) return true;
      
      const itemDate = new Date(item.timestamp);
      return itemDate > sevenDaysAgo;
    });
    
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filteredItems));
  } catch (error) {
    console.error('Error cleaning up synced items:', error);
  }
};

/**
 * Map entity type to API endpoint
 * @param entityType The entity type
 * @returns The corresponding API endpoint
 */
const getEndpointForEntityType = (entityType: SyncEntityType): string => {
  switch (entityType) {
    case 'awareness-session':
      return '/api/awareness-sessions';
    case 'attendee':
      return '/api/attendees';
    case 'child-screening':
      return '/api/child-screenings';
    case 'screened-child':
      return '/api/screened-children';
    case 'location':
      return '/api/update-location';
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

/**
 * Determine which query keys to invalidate after syncing
 * @param entityType The entity type
 * @returns Array of query keys to invalidate
 */
const getQueryKeysToInvalidate = (entityType: SyncEntityType): string[] => {
  switch (entityType) {
    case 'awareness-session':
      return ['/api/awareness-sessions', '/api/awareness-sessions/recent'];
    case 'attendee':
      return ['/api/attendees/session'];
    case 'child-screening':
      return ['/api/child-screenings'];
    case 'screened-child':
      return ['/api/screened-children/screening'];
    case 'location':
      return ['/api/users/location-history'];
    default:
      return [];
  }
};

/**
 * Hook to provide sync service functionality
 * @returns Sync service methods and state
 */
export const useSyncService = () => {
  const { isOnline } = useOnlineStatus();
  const { toast } = useToast();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update pending count whenever online status changes
  useEffect(() => {
    const updatePendingCount = () => {
      const pendingItems = getPendingSyncItems();
      setPendingCount(pendingItems.length);
    };
    
    updatePendingCount();
    
    // Set up interval to check for pending items
    const intervalId = setInterval(updatePendingCount, 30000);
    
    return () => clearInterval(intervalId);
  }, [isOnline]);

  // Clean up old synced items on mount
  useEffect(() => {
    cleanupSyncedItems();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      // Use a slight delay to avoid sync loops
      const timeoutId = setTimeout(() => {
        syncPendingItems();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, pendingCount, isSyncing]);

  /**
   * Synchronize all pending items
   */
  const syncPendingItems = async () => {
    if (!isOnline || isSyncing) return;
    
    const pendingItems = getPendingSyncItems();
    if (pendingItems.length === 0) return;
    
    setIsSyncing(true);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const item of pendingItems) {
      try {
        const endpoint = getEndpointForEntityType(item.entityType);
        
        await apiRequest('POST', endpoint, item.entityData);
        
        // Mark as synced
        markSyncItemAsSynced(item.id);
        
        // Invalidate relevant query caches
        const queryKeys = getQueryKeysToInvalidate(item.entityType);
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        
        successCount++;
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        failureCount++;
      }
    }
    
    setIsSyncing(false);
    setLastSyncTime(new Date());
    
    // Update pending count
    setPendingCount(getPendingSyncItems().length);
    
    // Show toast notification
    if (successCount > 0) {
      toast({
        title: 'Sync completed',
        description: `Successfully synced ${successCount} items${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        variant: failureCount > 0 ? 'warning' : 'success',
      });
    }
  };

  return {
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncPendingItems,
  };
};

export default useSyncService;