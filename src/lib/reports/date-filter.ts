/**
 * Date Filtering Utilities for SHAKIL GLOBAL MANPOWER ERP
 * Timezone: Asia/Dhaka (UTC+6)
 */

export type DatePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface DateRangeResult {
  startDate: Date | null;
  endDate: Date | null;
  prismaDateFilter: { gte?: Date; lte?: Date } | undefined;
  label: string;
}

export function parseDateFilter(
  preset?: string | null,
  customStart?: string | null,
  customEnd?: string | null
): DateRangeResult {
  const now = new Date();
  const normalizedPreset = (preset?.toUpperCase() || 'THIS_MONTH') as DatePreset;

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let label = 'This Month';

  switch (normalizedPreset) {
    case 'TODAY': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Today';
      break;
    }
    case 'YESTERDAY': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      label = 'Yesterday';
      break;
    }
    case 'THIS_WEEK': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
      endDate = new Date();
      label = 'This Week';
      break;
    }
    case 'LAST_WEEK': {
      const day = now.getDay();
      const diff = now.getDate() - day - 6;
      const lastMonday = new Date(now.setDate(diff));
      startDate = new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate(), 0, 0, 0, 0);
      const lastSunday = new Date(startDate);
      lastSunday.setDate(lastSunday.getDate() + 6);
      endDate = new Date(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate(), 23, 59, 59, 999);
      label = 'Last Week';
      break;
    }
    case 'THIS_MONTH': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date();
      label = 'This Month';
      break;
    }
    case 'LAST_MONTH': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Last Month';
      break;
    }
    case 'THIS_QUARTER': {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
      endDate = new Date();
      label = 'This Quarter';
      break;
    }
    case 'THIS_YEAR': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date();
      label = 'This Year';
      break;
    }
    case 'CUSTOM': {
      if (customStart) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }
      label = `Custom (${customStart || 'Start'} to ${customEnd || 'Now'})`;
      break;
    }
    case 'ALL_TIME':
    default: {
      startDate = null;
      endDate = null;
      label = 'All Time';
      break;
    }
  }

  const prismaDateFilter: { gte?: Date; lte?: Date } | undefined =
    startDate || endDate
      ? {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        }
      : undefined;

  return {
    startDate,
    endDate,
    prismaDateFilter,
    label,
  };
}
