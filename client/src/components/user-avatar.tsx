import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@shared/schema';
import { getInitials, getRoleColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  statusPosition?: 'bottom-right' | 'top-right';
  className?: string;
}

export default function UserAvatar({
  user,
  showStatus = false,
  size = 'md',
  statusPosition = 'bottom-right',
  className
}: UserAvatarProps) {
  // Determine size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };
  
  // Determine role background color
  const roleColor = getRoleColor(user.role);
  
  // Determine status indicator classes
  const statusClasses = {
    'bottom-right': 'absolute bottom-0 right-0',
    'top-right': 'absolute top-0 right-0',
  };
  
  // Determine status size based on avatar size
  const statusSizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };
  
  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(
        sizeClasses[size],
        roleColor, 
        "flex items-center justify-center text-white",
        "data-random-color"
      )}>
        <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <span className={cn(
          statusClasses[statusPosition],
          statusSizeClasses[size],
          "block rounded-full border-2 border-white dark:border-gray-800",
          user.isOnline ? "bg-green-500" : "bg-gray-300"
        )}></span>
      )}
    </div>
  );
}
