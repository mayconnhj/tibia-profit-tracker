import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** "terça-feira, 22 de setembro" -> "Terça-feira, 22 de setembro" (CSS capitalize faria toda palavra). */
export function capFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
