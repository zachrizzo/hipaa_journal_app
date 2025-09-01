import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullName(firstName: string | null, lastName: string | null): string {
  if (!firstName && !lastName) return 'User'
  if (!firstName) return lastName || 'User'
  if (!lastName) return firstName || 'User'
  return `${firstName} ${lastName}`
}