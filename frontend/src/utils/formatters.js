import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

export function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

export function formatDateTime(value) {
  const date = parseDate(value);
  return date ? format(date, 'MMM d, yyyy HH:mm:ss') : 'Never';
}

export function formatRelativeTime(value) {
  const date = parseDate(value);
  return date ? `${formatDistanceToNowStrict(date)} ago` : 'No heartbeat';
}

export function formatInterval(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value)) {
    return '-';
  }

  if (value < 60) {
    return `${value}s`;
  }

  if (value < 3600) {
    return `${Math.round(value / 60)}m`;
  }

  return `${Math.round(value / 3600)}h`;
}
