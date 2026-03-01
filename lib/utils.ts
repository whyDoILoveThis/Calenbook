export const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID!;

export function isAdmin(userId: string | null | undefined): boolean {
  return !!userId && userId === ADMIN_USER_ID;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 20; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour = h.toString().padStart(2, "0");
    const min = m.toString().padStart(2, "0");
    TIME_SLOTS.push(`${hour}:${min}`);
  }
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isTimeConflict(
  newArrival: string,
  newFinished: string,
  existingArrival: string,
  existingFinished: string
): boolean {
  const newStart = timeToMinutes(newArrival);
  const newEnd = timeToMinutes(newFinished);
  const exStart = timeToMinutes(existingArrival);
  const exEnd = timeToMinutes(existingFinished);

  return newStart < exEnd && newEnd > exStart;
}

/**
 * Determine the operating hours for a given date based on availability rules.
 * Returns { start, end } for custom hours, "closed" if the day is fully closed,
 * or null if no rules apply (unrestricted).
 *
 * Priority: date_override → specific_date (legacy) → weekly_hours → weekday (legacy)
 */
export function getOperatingHours(
  date: string,
  availability: { type: string; value: string; startTime?: string; endTime?: string; isClosed?: boolean }[],
): { start: string; end: string } | "closed" | null {
  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0=Sun … 6=Sat

  // 1. date_override for this exact date
  const dateOverride = availability.find(
    (r) => r.type === "date_override" && r.value === date,
  );
  if (dateOverride) {
    if (dateOverride.isClosed) return "closed";
    if (dateOverride.startTime && dateOverride.endTime) {
      return { start: dateOverride.startTime, end: dateOverride.endTime };
    }
  }

  // 2. Legacy specific_date
  const legacyDate = availability.find(
    (r) => r.type === "specific_date" && r.value === date,
  );
  if (legacyDate) return "closed";

  // 3. weekly_hours for this weekday
  const weeklyRule = availability.find(
    (r) => r.type === "weekly_hours" && r.value === String(dayOfWeek),
  );
  if (weeklyRule) {
    if (weeklyRule.isClosed) return "closed";
    if (weeklyRule.startTime && weeklyRule.endTime) {
      return { start: weeklyRule.startTime, end: weeklyRule.endTime };
    }
  }

  // 4. Legacy weekday
  const legacyWeekday = availability.find(
    (r) => r.type === "weekday" && r.value === String(dayOfWeek),
  );
  if (legacyWeekday) return "closed";

  return null;
}

/**
 * Converts any image URL to the local proxy path.
 * - Already-proxied URLs (`/api/images/...`) pass through unchanged.
 * - Legacy Appwrite URLs are converted using the file ID extracted from the path.
 */
export function toProxyUrl(url: string): string {
  // Already a proxy URL
  if (url.startsWith("/api/images/")) return url;

  // Extract file ID from Appwrite URL pattern: .../files/{fileId}/view or /preview
  const match = url.match(/\/files\/([^/]+)\/(view|preview)/);
  if (match) {
    return `/api/images/${match[1]}`;
  }

  // Fallback: return as-is
  return url;
}
