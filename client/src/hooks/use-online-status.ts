import { useEffect, useState } from 'react';

/**
 * Hook to detect online/offline status
 * @returns Object with isOnline status and last online timestamp
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(isOnline ? new Date() : null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status every 30 seconds as a backup
    const intervalId = setInterval(() => {
      const currentlyOnline = navigator.onLine;
      if (currentlyOnline && !isOnline) {
        handleOnline();
      } else if (!currentlyOnline && isOnline) {
        handleOffline();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return { isOnline, lastOnlineTime };
};

export default useOnlineStatus;