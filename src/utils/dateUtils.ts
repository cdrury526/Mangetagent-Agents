import { format, parse } from 'date-fns';

export function formatDateForDisplay(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, 'MMM dd, yyyy');
  } catch {
    return '';
  }
}

export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

export function formatLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
