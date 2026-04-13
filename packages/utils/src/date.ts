import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

export function formatMessageTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

export function formatBirthday(date: string): string {
  return format(parseISO(date), "MMMM d");
}

export function isOnThisDay(date: string): boolean {
  const d = parseISO(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
