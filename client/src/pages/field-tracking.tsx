import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCcw, MapPin, User } from 'lucide-react';
import UserAvatar from '@/components/user-avatar';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function FieldTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [newMarkersRef] = useState<{current: any[]}>({current: []});

  // Define types for API responses
  interface OnlineUser {
    id: number;
    fullName: string;
    role: string;
    isOnline: boolean;
    lastActive: string;
    lastLocation?: {
      latitude: number;
      longitude: number;
    };
  }

  interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: string;
    time?: string;
  }

  // Fetch online users
  const { data: onlineUsers, isLoading, refetch } = useQuery<OnlineUser[]>({
    queryKey: ['/api/users/online'],
    enabled: !!user && ['developer', 'master'].includes(user.role)
  });

  // Fetch user location history
  const { data: locationHistory, isLoading: isLocationLoading } = useQuery<LocationPoint[]>({
    queryKey: ['/api/users/location-history', selectedUser],
    enabled: !!selectedUser
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    // Load map script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBDaeWicvigtP9xPv919E-RNoxfvC-Hqik'}&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Initialize map when script loads
    window.initMap = () => {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 24.8607, lng: 67.0011 }, // Default to Pakistan
        zoom: 10,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#dadada" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "transit.line",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
        ],
      });

      setMap(newMap);
      setMapLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Clean up
      document.head.removeChild(script);
      window.initMap = () => { /* cleanup */ };
    };
  }, [mapRef]);

  // Update markers when users or selected user changes
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: any[] = [];

    if (selectedUser && locationHistory) {
      // Show location history for selected user
      const path = locationHistory.map((location: any) => ({
        lat: location.latitude,
        lng: location.longitude
      }));

      // Create path
      if (path.length > 1) {
        const polyline = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map
        });
        newMarkers.push(polyline);
      }

      // Add markers for each point
      locationHistory.forEach((location: any, index: number) => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map,
          title: `${location.time} - ${onlineUsers?.find((u: any) => u.id === parseInt(selectedUser))?.fullName || 'User'}`,
          icon: {
            url: `data:image/svg+xml;base64,${btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${index === 0 ? '#3b82f6' : '#10b981'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(30, 30),
          }
        });
        
        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <p class="font-semibold">${onlineUsers?.find((u: any) => u.id === parseInt(selectedUser))?.fullName || 'User'}</p>
              <p class="text-sm text-gray-600">${new Date(location.timestamp).toLocaleString()}</p>
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        newMarkers.push(marker);
      });

      // Center map on the first location (most recent)
      if (path.length > 0) {
        map.setCenter(path[0]);
        map.setZoom(15);
      }
    } else if (onlineUsers) {
      // Show all online users
      onlineUsers.forEach((user: any) => {
        if (user.lastLocation && user.lastLocation.latitude && user.lastLocation.longitude) {
          const marker = new window.google.maps.Marker({
            position: { lat: user.lastLocation.latitude, lng: user.lastLocation.longitude },
            map,
            title: user.fullName,
            icon: {
              url: `data:image/svg+xml;base64,${btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${user.role === 'fmt' ? '#10b981' : '#3b82f6'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(30, 30),
            }
          });
          
          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <p class="font-semibold">${user.fullName}</p>
                <p class="text-sm">${user.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer'}</p>
                <p class="text-sm text-gray-600">Last seen: ${new Date(user.lastActive).toLocaleString()}</p>
              </div>
            `
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
          
          newMarkers.push(marker);
        }
      });

      // If we have markers, fit bounds to show all
      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        newMarkers.forEach((marker: any) => {
          if (marker instanceof window.google.maps.Marker) {
            bounds.extend(marker.getPosition());
          }
        });
        map.fitBounds(bounds);
      }
    }

    setMarkers(newMarkers);
  }, [map, mapLoaded, onlineUsers, selectedUser, locationHistory]);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing field data",
      description: "Fetching the latest location data for field workers.",
    });
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId === 'all' ? null : userId);
  };

  if (!user || !['developer', 'master'].includes(user.role)) {
    return (
      <div className="text-center py-10">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          You do not have permission to access the field tracking feature.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Field Tracking</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor the location of field workers in real-time
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Field Workers List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Field Workers</CardTitle>
            <CardDescription>
              Select a worker to view their location history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : onlineUsers && onlineUsers.length > 0 ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <Select
                    value={selectedUser || 'all'}
                    onValueChange={handleUserSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="View all workers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">View all workers</SelectItem>
                      {onlineUsers.map((fieldUser: any) => (
                        <SelectItem key={fieldUser.id} value={fieldUser.id.toString()}>
                          {fieldUser.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {onlineUsers.map((fieldUser: any) => (
                    <div 
                      key={fieldUser.id} 
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser === fieldUser.id.toString() 
                          ? 'bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-800' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleUserSelect(fieldUser.id.toString())}
                    >
                      <UserAvatar 
                        user={fieldUser}
                        showStatus
                        size="md"
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{fieldUser.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {fieldUser.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer'}
                        </p>
                        {fieldUser.lastActive && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Last active: {new Date(fieldUser.lastActive).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      {fieldUser.isOnline && fieldUser.lastLocation && (
                        <MapPin className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>No field workers are currently online</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedUser 
                ? `Location History: ${onlineUsers?.find((u: any) => u.id === parseInt(selectedUser))?.fullName || 'User'}`
                : 'Field Workers Map'
              }
            </CardTitle>
            <CardDescription>
              {selectedUser 
                ? 'Showing the movement path and location history'
                : 'Current locations of all field workers'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="h-[500px] w-full rounded-md bg-gray-100 dark:bg-gray-800"
            ></div>
            
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            )}
            
            {mapLoaded && isLocationLoading && selectedUser && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-md">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading location history...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
