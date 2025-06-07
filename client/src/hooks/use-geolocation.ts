import { useState, useEffect, useRef, useCallback } from 'react';

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  timestamp: number | null;
  isTracking: boolean;
  isPaused: boolean;
}

export function useGeolocation(options: LocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 5000,
    maximumAge = 0,
    watchPosition = false
  } = options;
  
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    timestamp: null,
    isTracking: false,
    isPaused: false
  });
  
  const watchIdRef = useRef<number | null>(null);
  
  // Success handler for geolocation API
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      timestamp: position.timestamp,
      isTracking: true,
      isPaused: false
    });
  }, []);
  
  // Error handler for geolocation API
  const handleError = useCallback((error: GeolocationPositionError) => {
    setLocation(prev => ({
      ...prev,
      error: error.message,
      isTracking: false,
      isPaused: false
    }));
  }, []);
  
  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: "Geolocation is not supported by this browser.",
        isTracking: false,
        isPaused: false
      }));
      return;
    }
    
    setLocation(prev => ({
      ...prev,
      isTracking: true,
      isPaused: false
    }));
    
    if (watchPosition) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    }
  }, [watchPosition, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);
  
  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setLocation(prev => ({
      ...prev,
      isTracking: false,
      isPaused: false
    }));
  }, []);
  
  // Pause tracking (but keep last position)
  const pauseTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setLocation(prev => ({
      ...prev,
      isTracking: false,
      isPaused: true
    }));
  }, []);
  
  // Get current position once
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: "Geolocation is not supported by this browser.",
        isTracking: false,
        isPaused: false
      }));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);
  
  // Request location on mount and cleanup on unmount
  useEffect(() => {
    // Request location automatically when the component mounts
    if (navigator.geolocation) {
      try {
        getPosition();
      } catch (error) {
        console.error('Error getting initial position:', error);
      }
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [getPosition]);
  
  return {
    ...location,
    startTracking,
    stopTracking,
    pauseTracking,
    getPosition
  };
}
