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
