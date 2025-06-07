import React from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { useLocation } from 'wouter';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Disable geolocation tracking for now to fix update loop issues
  // We'll re-implement this when other critical issues are resolved
  
  // Determine page title based on current path
  const pageTitle = React.useMemo(() => {
    if (location === '/') return 'Dashboard';
    if (location.includes('/awareness-sessions')) return 'Awareness Sessions';
    if (location.includes('/child-screening')) return 'Child Screening';
    if (location.includes('/users')) return 'User Management';
    if (location.includes('/field-tracking')) return 'Field Tracking';
    if (location.includes('/export-data')) return 'Export Data';
    if (location.includes('/blog')) return 'Health Blogs';
    return 'Track4Health';
  }, [location]);
  
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        <Header title={pageTitle} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
