import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert Excel serial date to JavaScript Date
export function excelSerialToDate(serial: number | string | Date): string {
  if (!serial) return "";
  
  // If it's already a string date, return it
  if (typeof serial === 'string') {
    // Check if it's already a formatted date string
    if (serial.includes('/') || serial.includes('-')) return serial;
    // Try to parse as number
    const num = parseFloat(serial);
    if (isNaN(num)) return serial;
    serial = num;
  }
  
  // If it's a Date object, format it
  if (serial instanceof Date) {
    return serial.toLocaleDateString('en-US');
  }
  
  // Excel serial date conversion (days since 1900-01-01)
  if (typeof serial === 'number' && serial > 1000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    return date.toLocaleDateString('en-US');
  }
  
  return String(serial);
}
