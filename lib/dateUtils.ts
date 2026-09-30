export type DatePreset = "all" | "today" | "yesterday" | "this-week" | "this-month" | "custom";

/**
 * Returns a YYYY-MM-DD formatted string for a given Date object.
 */
export function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the start and end string (YYYY-MM-DD) boundaries based on the current system date.
 * Uses the active system time to accurately compute offsets.
 */
export function getDateRangeBounds(
  preset: DatePreset,
  customStart: string | null = null,
  customEnd: string | null = null
): { start: string | null; end: string | null } {
  // We use the current dynamic date
  const now = new Date();
  const todayStr = formatDateStr(now);

  switch (preset) {
    case "today":
      return { start: todayStr, end: todayStr };

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yestStr = formatDateStr(yesterday);
      return { start: yestStr, end: yestStr };
    }

    case "this-week": {
      // Assuming week starts on Monday and ends on Sunday
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const distance = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distance);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: formatDateStr(monday), end: formatDateStr(sunday) };
    }

    case "this-month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: formatDateStr(firstDay), end: formatDateStr(lastDay) };
    }

    case "custom":
      return { start: customStart || null, end: customEnd || null };

    case "all":
    default:
      return { start: null, end: null };
  }
}

/**
 * Checks if a target date string (YYYY-MM-DD) falls within the start and end boundary strings.
 */
export function isDateInRange(
  targetDate: string | null,
  start: string | null,
  end: string | null
): boolean {
  if (!start && !end) return true; // No filter active
  if (!targetDate) return false; // Filter active, but no target date

  if (start && targetDate < start) return false;
  if (end && targetDate > end) return false;

  return true;
}
