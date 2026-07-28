import { addDays, format, parseISO, startOfMonth, subDays, subMonths } from "date-fns";

export function formatDuration(totalSeconds = 0, compact = false) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (compact) {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${remaining}s`;
  }
  return [hours, minutes, remaining].map((part) => String(part).padStart(2, "0")).join(":");
}

export function formatHours(totalSeconds = 0) {
  return `${((Number(totalSeconds) || 0) / 3600).toFixed(1)}h`;
}

export function displayDate(dateString, pattern = "MMM d") {
  if (!dateString) return "Any day";
  return format(parseISO(dateString), pattern);
}

export function dateRange(today, preset) {
  const end = parseISO(today);
  if (preset === "7d") return { startDate: format(subDays(end, 6), "yyyy-MM-dd"), endDate: today };
  if (preset === "90d") return { startDate: format(subMonths(end, 3), "yyyy-MM-dd"), endDate: today };
  if (preset === "month") return { startDate: format(startOfMonth(end), "yyyy-MM-dd"), endDate: today };
  return { startDate: format(subDays(end, 29), "yyyy-MM-dd"), endDate: today };
}

export function datesBetween(startDate, endDate) {
  const dates = [];
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  while (cursor <= end) {
    dates.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function friendlyError(error) {
  const message = String(error?.message || error || "Something went wrong.");
  return message.replace(/^Error invoking remote method '[^']+': Error:\s*/, "");
}
