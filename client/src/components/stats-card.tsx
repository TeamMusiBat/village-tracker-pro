import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBackground: string;
  trend?: {
    value: string;
    label: string;
    isPositive?: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconBackground,
  trend
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={cn(
            "p-3 rounded-full",
            iconBackground.includes("primary") ? "bg-primary-100 dark:bg-primary-900" : iconBackground
          )}>
            <Icon 
              className={cn(
                "h-5 w-5",
                iconBackground.includes("primary") ? "text-primary-500 dark:text-primary-300" : "text-white"
              )} 
            />
          </div>
        </div>
        
        {trend && (
          <div className="mt-3 flex items-center text-sm">
            <span className={cn(
              "flex items-center",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {trend.value}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
