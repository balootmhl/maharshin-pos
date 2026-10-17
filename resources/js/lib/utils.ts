import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function snakeToText(str: string) {
    return str.replace('_', ' ');
}

export const fetcher = (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init).then((res) => res.json());

/**
 * Returns today's date in 'YYYY-MM-DD' format locked to Myanmar timezone (Asia/Yangon).
 * Avoids the UTC-shift bug caused by new Date().toISOString() in early morning hours.
 */
export function getTodayDateString(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yangon' }).format(new Date());
}
