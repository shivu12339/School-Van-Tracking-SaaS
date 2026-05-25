import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);
}
