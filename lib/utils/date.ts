import { format, differenceInDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy/MM/dd', { locale: ja });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy/MM/dd HH:mm', { locale: ja });
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  return differenceInDays(parseISO(date), new Date());
}

export function isExpiringSoon(date: string | null | undefined, days = 30): boolean {
  const d = daysUntil(date);
  if (d === null) return false;
  return d >= 0 && d <= days;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('ja-JP').format(num);
}
