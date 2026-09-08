import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined, currency = 'BDT'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '৳0.00';
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency === 'BDT' ? 'BDT' : currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(numeric)
    .replace('BDT', '৳');
}

export function formatDate(
  date: Date | string | number | null | undefined,
  includeTime = false
): string {
  if (!date) return '—';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      : {}),
  }).format(d);
}

export function sanitizeData<T extends Record<string, any>>(obj: T): Partial<T> {
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'secret',
    'token',
    'jwt',
    'apiKey',
    'cvv',
    'cardnumber',
    'privateurl',
    'accesstoken',
    'authheader',
  ];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as Partial<T>;
}
