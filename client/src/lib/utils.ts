import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines multiple class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to human-readable format
 * @param date Date to format
 * @param formatString Optional format string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null, formatString = "PP"): string {
  if (!date) return "N/A";
  return format(new Date(date), formatString);
}

/**
 * Format a number with thousand separators
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format a number as currency
 * @param num Number to format
 * @param currency Currency code (default: PKR)
 * @returns Formatted currency string
 */
export function formatCurrency(num: number, currency = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
  }).format(num);
}

/**
 * Determine nutrition status based on MUAC (Mid-Upper Arm Circumference)
 * @param muacValue MUAC value in cm
 * @returns Nutrition status: "Normal", "MAM" (Moderate Acute Malnutrition), or "SAM" (Severe Acute Malnutrition)
 */
export function getNutritionStatus(muacValue: number): "Normal" | "MAM" | "SAM" {
  if (muacValue < 11.5) {
    return "SAM"; // Severe Acute Malnutrition
  } else if (muacValue >= 11.5 && muacValue < 12.5) {
    return "MAM"; // Moderate Acute Malnutrition
  } else {
    return "Normal";
  }
}

/**
 * Get short formatted month and year from date
 * @param date Date to format
 * @returns Short month and year (e.g., "Jan 2023")
 */
export function getMonthYear(date: Date | string): string {
  return format(new Date(date), "MMM yyyy");
}

/**
 * Get a color based on nutrition status
 * @param status Nutrition status
 * @returns Color code
 */
export function getNutritionStatusColor(status: "Normal" | "MAM" | "SAM"): string {
  switch (status) {
    case "Normal":
      return "#10b981"; // Green
    case "MAM":
      return "#f59e0b"; // Amber
    case "SAM":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Calculate age in years from date of birth
 * @param dob Date of birth
 * @returns Age in years
 */
export function calculateAge(dob: Date | string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculate age in months from date of birth
 * @param dob Date of birth
 * @returns Age in months
 */
export function calculateAgeInMonths(dob: Date | string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  
  return months;
}

/**
 * Get initials from a name (first letter of first and last name)
 * @param name Full name
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get a color based on user role
 * @param role User role
 * @returns Color code
 */
export function getRoleColor(role: string): string {
  switch (role) {
    case "developer":
      return "#3b82f6"; // Blue
    case "master":
      return "#6366f1"; // Indigo
    case "fmt":
      return "#10b981"; // Green
    case "sm":
      return "#f59e0b"; // Amber
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Get a human-readable label for user role
 * @param role User role code
 * @returns Formatted role label
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case "developer":
      return "Developer Admin";
    case "master":
      return "Field Supervisor";
    case "fmt":
      return "Field Monitor";
    case "sm":
      return "Social Mobilizer";
    default:
      return "Unknown Role";
  }
}

/**
 * Get CSS class for sidebar item based on current path
 * @param currentPathMatch Boolean indicating if the current path matches
 * @returns CSS class string
 */
export function getSidebarItemClass(currentPathMatch: boolean): string {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
    currentPathMatch
      ? "bg-primary text-primary-foreground shadow"
      : "hover:bg-muted transition-colors"
  );
}

/**
 * Truncate text to a specific length with ellipsis
 * @param text Text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number): string {
  if (!text) return "";
  if (text.length <= length) return text;
  
  return text.slice(0, length) + "...";
}