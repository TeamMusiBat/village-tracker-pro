/**
 * Format text to proper case (capitalize first letter of each word)
 * @param text - Text to format
 * @returns Formatted text
 */
export function formatText(text: string): string {
  if (!text) return '';
  
  // Split text by spaces, hyphens and underscores
  return text
    .toLowerCase()
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Validate if a date string is in YYYY-MM-DD format
 * @param dateString - Date string to validate
 * @returns True if valid date format, false otherwise
 */
export function isValidDateFormat(dateString: string): boolean {
  // Check if the string matches YYYY-MM-DD format
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  // Check if it's a valid date (not just proper format)
  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  if (isNaN(timestamp)) return false;
  
  // Verify that the date object contains the same date
  // This handles edge cases like 2022-02-31 (which doesn't exist)
  return dateString === date.toISOString().slice(0, 10);
}

/**
 * Format phone number to international format
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const numericOnly = phoneNumber.replace(/\D/g, '');
  
  // If the number doesn't start with country code, add Pakistan's code
  if (!numericOnly.startsWith('92') && numericOnly.length === 10) {
    return `+92${numericOnly}`;
  }
  
  // Add + if missing from country code
  if (numericOnly.startsWith('92')) {
    return `+${numericOnly}`;
  }
  
  return phoneNumber;
}

/**
 * Format address - capitalize each word and trim extra spaces
 * @param address - Address to format
 * @returns Formatted address
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  
  // Replace multiple spaces with a single space and trim
  const trimmed = address.replace(/\s+/g, ' ').trim();
  
  // Split by spaces and capitalize each word
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}