import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { savePendingSync } from './sync-service';

// Configuration
const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOCATION_CACHE_KEY = 'track4health_location_history';

// Interface for location data
export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

/**
 * Hook to provide location tracking functionality
 * @param userId The user ID 
 * @param isTracking Whether location tracking is active
 * @returns Location service methods and state
 */
export const useLocationService = (userId: number, isTracking: boolean = false) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOnlineStatus();
  const { toast } = useToast();

  /**
   * Load location history from cache
   */
  const loadLocationHistory = useCallback(() => {
    try {
      const cachedHistory = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedHistory) {
        setLocationHistory(JSON.parse(cachedHistory));
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  }, []);

  /**
   * Save location history to cache
   */
  const saveLocationHistory = useCallback((locations: LocationData[]) => {
    try {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving location history:', error);
    }
  }, []);

  /**
   * Send location update to server
   */
  const sendLocationUpdate = useCallback(async (location: LocationData) => {
    if (!userId) return;

    try {
      if (isOnline) {
        await apiRequest('POST', '/api/update-location', {
          latitude: location.latitude,
          longitude: location.longitude
        });
        
        // Invalidate location history cache
        queryClient.invalidateQueries({ queryKey: [`/api/users/location-history/${userId}`] });
      } else {
        // Save for later sync when offline
        savePendingSync(userId, 'location', {
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [userId, isOnline]);

  /**
   * Handle successful location retrieval
   */
  const handlePosition = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString(),
      accuracy: position.coords.accuracy
    };

    setCurrentLocation(newLocation);
    
    // Add to history if more than 100 meters from last location
    if (locationHistory.length === 0 || 
        calculateDistance(
          newLocation.latitude, 
          newLocation.longitude, 
          locationHistory[locationHistory.length - 1].latitude, 
          locationHistory[locationHistory.length - 1].longitude
        ) > 0.1) {
      
      const updatedHistory = [...locationHistory, newLocation];
      setLocationHistory(updatedHistory);
      saveLocationHistory(updatedHistory);
      
      // Send to server
      sendLocationUpdate(newLocation);
    }
    
    setError(null);
  }, [locationHistory, sendLocationUpdate, saveLocationHistory]);

  /**
   * Handle location errors
   */
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
      default:
        errorMessage = 'An unknown error occurred while tracking location.';
    }
    
    setError(errorMessage);
    toast({
      title: 'Location Error',
      description: errorMessage,
      variant: 'destructive'
    });
  }, [toast]);

  /**
   * Start tracking location
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    // Load history first
    loadLocationHistory();
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    
    // Start watching position
    const id = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    
    setWatchId(id);
    setIsWatching(true);
    
    toast({
      title: 'Location Tracking',
      description: 'Your location is now being tracked.',
      variant: 'success'
    });
  }, [handlePosition, handleError, loadLocationHistory, toast]);

  /**
   * Stop tracking location
   */
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
      
      toast({
        title: 'Location Tracking',
        description: 'Location tracking has been stopped.',
        variant: 'default'
      });
    }
  }, [watchId, toast]);

  // Start/stop tracking when isTracking changes
  useEffect(() => {
    if (isTracking && !isWatching) {
      startTracking();
    } else if (!isTracking && isWatching) {
      stopTracking();
    }
    
    // Clean up on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, isWatching, startTracking, stopTracking, watchId]);

  // Periodically send updates on interval
  useEffect(() => {
    if (!isTracking || !currentLocation) return;
    
    const intervalId = setInterval(() => {
      if (currentLocation) {
        // Create a new location object with current timestamp
        const updatedLocation: LocationData = {
          ...currentLocation,
          timestamp: new Date().toISOString()
        };
        
        // Send to server
        sendLocationUpdate(updatedLocation);
      }
    }, LOCATION_UPDATE_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [isTracking, currentLocation, sendLocationUpdate]);

  return {
    currentLocation,
    locationHistory,
    isTracking: isWatching,
    error,
    startTracking,
    stopTracking
  };
};

/**
 * Calculate distance between two coordinates in kilometers
 * Using the Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default useLocationService;