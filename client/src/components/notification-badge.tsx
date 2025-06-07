import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  children: React.ReactNode;
  className?: string;
}

export default function NotificationBadge({ count, children, className }: NotificationBadgeProps) {
  // Only show if there are notifications
  if (!count || count <= 0) {
    return <>{children}</>;
  }
  
  // Determine if we need to show the count or just a dot
  const showCount = count > 1;
  
  return (
    <div className="relative">
      {children}
      {showCount ? (
        <span className={cn(
          "absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-white",
          className
        )}>
          {count > 99 ? '99+' : count}
        </span>
      ) : (
        <span className={cn(
          "absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500",
          className
        )}></span>
      )}
    </div>
  );
}
