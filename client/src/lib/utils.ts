
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  const nameParts = name.split(' ').filter(part => part.length > 0);
  if (nameParts.length === 0) return '';
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return nameParts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export function getRoleColor(role: string): string {
  const roleColors = {
    'developer': 'bg-purple-500',
    'master': 'bg-blue-500', 
    'fmt': 'bg-green-500',
    'sm': 'bg-orange-500'
  };
  
  return roleColors[role as keyof typeof roleColors] || 'bg-gray-500';
}

export function getRoleLabel(role: string): string {
  const roleLabels = {
    'developer': 'Developer',
    'master': 'Master',
    'fmt': 'Field Monitor',
    'sm': 'Social Mobilizer'
  };
  
  return roleLabels[role as keyof typeof roleLabels] || role;
}

export function formatDateForInput(date: Date | string | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString();
}

export function getNutritionStatus(muac: number): 'Normal' | 'MAM' | 'SAM' {
  if (muac < 11.5) return 'SAM';
  if (muac >= 11.5 && muac < 12.5) return 'MAM';
  return 'Normal';
}

export function getSidebarItemClass(isActive: boolean): string {
  return cn(
    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
    isActive 
      ? "bg-primary text-primary-foreground" 
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );
}
