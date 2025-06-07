import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'Completed' | 'Normal' | 'MAM' | 'SAM' | 'Pending' | 'Active' | 'Inactive';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

export default function StatusPill({ status, className }: StatusPillProps) {
  // Define colors based on status
  const getStatusClasses = () => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Normal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'MAM':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'SAM':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span className={cn(
      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
      getStatusClasses(),
      className
    )}>
      {status}
    </span>
  );
}
