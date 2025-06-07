import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getRoleLabel } from '@/lib/utils';
import NotificationBadge from '@/components/notification-badge';
import UserAvatar from '@/components/user-avatar';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            ) : (
              user && <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user.fullName}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          
          {user && (
            <div className="relative">
              <Button 
                variant="ghost"
                className="flex items-center space-x-3 focus:outline-none"
              >
                <UserAvatar
                  user={user}
                  showStatus
                />
                <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.fullName}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
