import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { cn, getSidebarItemClass } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Megaphone,
  User,
  Users,
  FileDown, // Replacing FileExport with FileDown
  MapPin,
  BookOpen,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  
  // Expand sidebar on hover
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoverTimeout(setTimeout(() => setExpanded(true), 300));
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoverTimeout(setTimeout(() => setExpanded(false), 300));
  };
  
  const toggleSidebar = () => {
    setExpanded(prev => !prev);
  };
  
  const handleLogout = async () => {
    try {
      if (!user || !['developer', 'master'].includes(user.role)) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Your role doesn't have permission to logout"
        });
        return;
      }
      
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);
  
  return (
    <aside 
      id="sidebar" 
      className={cn(
        "fixed z-10 h-screen bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 overflow-hidden",
        expanded ? "w-60" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-full flex flex-col justify-between py-6">
        <div>
          <div className="px-4 mb-6">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-primary-500 text-white">
              <span className="text-lg font-semibold">T4H</span>
            </div>
          </div>
          
          <nav className="space-y-1 px-2">
            <Button 
              id="expandSidebar" 
              variant="ghost" 
              size="sm"
              className="w-full flex justify-start items-center p-2 rounded-md mb-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={toggleSidebar}
            >
              <Menu size={20} className="text-gray-500 dark:text-gray-400" />
              {expanded && (
                <span className="ml-3 truncate text-gray-700 dark:text-gray-300">
                  {expanded ? "Collapse Menu" : "Expand Menu"}
                </span>
              )}
            </Button>
            
            <Link href="/">
              <a className={getSidebarItemClass(location === "/")}>
                <span className="flex-shrink-0 w-6 flex justify-center">
                  <Home size={20} />
                </span>
                {expanded && <span className="ml-3 truncate">Dashboard</span>}
              </a>
            </Link>
            
            <Link href="/awareness-sessions">
              <a className={getSidebarItemClass(location.includes("/awareness-sessions"))}>
                <span className="flex-shrink-0 w-6 flex justify-center">
                  <Megaphone size={20} />
                </span>
                {expanded && <span className="ml-3 truncate">Awareness Sessions</span>}
              </a>
            </Link>
            
            <Link href="/child-screening">
              <a className={getSidebarItemClass(location.includes("/child-screening"))}>
                <span className="flex-shrink-0 w-6 flex justify-center">
                  <User size={20} />
                </span>
                {expanded && <span className="ml-3 truncate">Child Screening</span>}
              </a>
            </Link>
            
            {user && ['developer', 'master'].includes(user.role) && (
              <Link href="/users">
                <a className={getSidebarItemClass(location.includes("/users"))}>
                  <span className="flex-shrink-0 w-6 flex justify-center">
                    <Users size={20} />
                  </span>
                  {expanded && <span className="ml-3 truncate">User Management</span>}
                </a>
              </Link>
            )}
            
            {user && ['developer', 'master'].includes(user.role) && (
              <Link href="/field-tracking">
                <a className={getSidebarItemClass(location.includes("/field-tracking"))}>
                  <span className="flex-shrink-0 w-6 flex justify-center">
                    <MapPin size={20} />
                  </span>
                  {expanded && <span className="ml-3 truncate">Field Tracking</span>}
                </a>
              </Link>
            )}
            
            {user && ['developer', 'master'].includes(user.role) && (
              <Link href="/export-data">
                <a className={getSidebarItemClass(location.includes("/export-data"))}>
                  <span className="flex-shrink-0 w-6 flex justify-center">
                    <FileDown size={20} />
                  </span>
                  {expanded && <span className="ml-3 truncate">Export Data</span>}
                </a>
              </Link>
            )}
            
            <Link href="/blog">
              <a className={getSidebarItemClass(location.includes("/blog"))}>
                <span className="flex-shrink-0 w-6 flex justify-center">
                  <BookOpen size={20} />
                </span>
                {expanded && <span className="ml-3 truncate">Blogs</span>}
              </a>
            </Link>
          </nav>
        </div>
        
        <div className="px-4 space-y-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="w-10 h-10 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
            onClick={toggleTheme}
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          
          {user && ['developer', 'master'].includes(user.role) && (
            <Button 
              variant="ghost" 
              size="icon"
              className="w-10 h-10 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              onClick={handleLogout}
            >
              <LogOut size={20} />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
