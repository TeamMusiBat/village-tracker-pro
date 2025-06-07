import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncService } from '@/services/sync-service';
import { useEffect, useState, useRef } from 'react';

export interface NetworkStatusProps {
  showPendingCount?: boolean;
}

export const NetworkStatus = ({ showPendingCount = true }: NetworkStatusProps) => {
  const { isOnline } = useOnlineStatus();
  const { pendingCount, syncPendingItems, isSyncing } = useSyncService();
  const [showIndicator, setShowIndicator] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simple timeout to auto-hide the indicator
  useEffect(() => {
    // Always show indicator when offline or syncing or have pending items
    if (!isOnline || isSyncing || pendingCount > 0) {
      setShowIndicator(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } 
    // Auto-hide after 5 seconds if everything is good (online, not syncing, no pending items)
    else if (isOnline && !isSyncing && pendingCount === 0) {
      timeoutRef.current = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOnline, pendingCount, isSyncing]);

  // Don't render anything if we're hiding the indicator
  if (!showIndicator) return null;

  // Determine status color and text
  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSyncing) return 'bg-yellow-500 animate-pulse';
    if (pendingCount > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingCount > 0) return `Online (${pendingCount} pending)`;
    return 'Online';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white/90 py-1 pl-2 pr-3 shadow-md dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700">
      <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button 
          onClick={syncPendingItems}
          className="ml-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sync now
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;