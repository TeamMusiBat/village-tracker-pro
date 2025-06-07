
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserLocation: (latitude: number, longitude: number) => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  updateUserLocation: async () => {},
  setOnlineStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('track4health_user', null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOnlineStatus();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check user session on page load
    const checkSession = async () => {
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // If we're offline, use the stored user data
        if (!isOnline) {
          setIsLoading(false);
          return;
        }
        
        const res = await apiRequest('GET', '/api/me');
        const data = await res.json();
        setUser(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to validate session:', err);
        setUser(null);
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest('POST', '/api/login', { username, password });
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.fullName || userData.name}!`,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    // Only users with high enough permissions can logout
    if (user && ['developer', 'master'].includes(user.role)) {
      setIsLoading(true);
      
      try {
        await apiRequest('POST', '/api/logout');
        setUser(null);
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out",
        });
      } catch (err) {
        console.error('Logout error:', err);
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: "There was a problem logging out. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        variant: "destructive", 
        title: "Logout Restricted",
        description: "Your role does not have permission to logout",
      });
    }
  };

  // Track previous status and location to prevent update loops
  const prevStatusRef = React.useRef<boolean | null>(null);
  const prevLocationRef = React.useRef<{lat: number | null, lng: number | null}>({ lat: null, lng: null });
  
  // Update user location
  const updateUserLocation = async (latitude: number, longitude: number) => {
    if (!user) return;
    
    // Skip if location data is the same
    const prev = prevLocationRef.current;
    if (prev.lat === latitude && prev.lng === longitude) {
      return;
    }
    
    // Update the ref
    prevLocationRef.current = { lat: latitude, lng: longitude };
    
    try {
      await apiRequest('POST', '/api/update-location', { 
        userId: user.id,
        latitude,
        longitude
      });
      
      // Update local user data with new location, but don't trigger state update if similar
      const currentLastLocation = user.lastLocation;
      const locationChanged = !currentLastLocation || 
                              currentLastLocation.latitude !== latitude || 
                              currentLastLocation.longitude !== longitude;
      
      if (locationChanged) {
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            lastLocation: { latitude, longitude }
          };
        });
      }
    } catch (err) {
      console.error('Failed to update location:', err);
      // Don't show error toast as this happens in background
    }
  };
  
  // Update online status
  const setOnlineStatus = async (status: boolean) => {
    if (!user) return;
    
    // Skip if status is the same
    if (prevStatusRef.current === status) {
      return;
    }
    
    // Update the ref
    prevStatusRef.current = status;
    
    try {
      // Only update if we're online and can make the request
      if (navigator.onLine) {
        await apiRequest('POST', '/api/update-status', {
          userId: user.id,
          isOnline: status
        });
      }
      
      // Only update user state if status has changed
      if (user.isOnline !== status) {
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            isOnline: status
          };
        });
      }
    } catch (err) {
      console.error('Failed to update online status:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateUserLocation, setOnlineStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
