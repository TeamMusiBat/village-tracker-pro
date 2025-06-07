import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeolocation } from '@/hooks/use-geolocation';
import { 
  MapPin, 
  PauseCircle, 
  RefreshCw, 
  AlertTriangle
} from 'lucide-react';

interface LocationInputProps {
  onLocationChange: (latitude: number | null, longitude: number | null) => void;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  className?: string;
}

export default function LocationInput({
  onLocationChange,
  initialLatitude = null,
  initialLongitude = null,
  className
}: LocationInputProps) {
  const [value, setValue] = useState<string>('');
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  
  const { 
    latitude, 
    longitude, 
    accuracy, 
    error, 
    isTracking,
    isPaused,
    getPosition,
    startTracking,
    pauseTracking,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  });
  
  // Format location string when coordinates change
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setValue(`Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}${accuracy ? `, Accuracy: ±${accuracy.toFixed(1)}m` : ''}`);
      onLocationChange(latitude, longitude);
    } else if (initialLatitude !== null && initialLongitude !== null) {
      setValue(`Lat: ${initialLatitude.toFixed(6)}, Long: ${initialLongitude.toFixed(6)}`);
    } else {
      setValue('');
    }
  }, [latitude, longitude, accuracy, initialLatitude, initialLongitude]);
  
  // Handle get location click
  const handleGetLocation = () => {
    getPosition();
    setLocationEnabled(true);
  };
  
  // Handle pause click
  const handlePauseLocation = () => {
    if (isTracking) {
      pauseTracking();
    } else {
      startTracking();
      setLocationEnabled(true);
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    getPosition();
  };
  
  return (
    <div className={className}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Location is being detected automatically..."
          className="pr-10"
          readOnly
        />
        {error && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-1 flex items-center space-x-2">
          <p className="text-sm text-red-500">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            className="flex items-center"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
